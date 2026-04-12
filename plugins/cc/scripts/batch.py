#!/usr/bin/env python3
"""batch.py — massively parallel eval orchestrator for Claude Code skills.

Spawns N concurrent `claude -p` headless sessions, tracks them in /cc,
streams progress, and collects results in skill-creator-compatible format.

Usage:
  python3 batch.py eval --skill-path /path/to/skill --eval-set evals.json
  python3 batch.py run  --prompts prompts.json --cwd /project

Designed to scale to hundreds of concurrent workers on a single machine.
"""

from __future__ import annotations

import argparse
import json
import os
import select
import subprocess
import sys
import time
import uuid
from concurrent.futures import ProcessPoolExecutor, as_completed
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

# ---------------------------------------------------------------------------
# cc integration
# ---------------------------------------------------------------------------

CLAUDE_DIR = Path(os.environ.get("CLAUDE_CONFIG_DIR", Path.home() / ".claude"))
ENRICH_DIR = CLAUDE_DIR / "cc" / "enrich"
MAILBOX_DIR = CLAUDE_DIR / "cc" / "mailbox"


def cc_register(batch_id: str, status: str, progress: str) -> None:
    """Write batch metadata so /cc roster can see it."""
    ENRICH_DIR.mkdir(parents=True, exist_ok=True)
    path = ENRICH_DIR / f"batch-{batch_id}.json"
    tmp = path.with_suffix(f".tmp.{os.getpid()}")
    tmp.write_text(json.dumps({
        "files": [],
        "task": f"[batch] {status}: {progress}",
        "updated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }))
    tmp.rename(path)


def cc_deregister(batch_id: str) -> None:
    try:
        (ENRICH_DIR / f"batch-{batch_id}.json").unlink(missing_ok=True)
    except OSError:
        pass


def _locked_write(path: Path, updater, default=None):
    """Atomic read-modify-write with advisory file locking."""
    import fcntl
    path.parent.mkdir(parents=True, exist_ok=True)
    lock_path = path.with_suffix(path.suffix + ".lock")
    with open(lock_path, "w") as lock_fd:
        fcntl.flock(lock_fd, fcntl.LOCK_EX)
        try:
            try:
                data = json.loads(path.read_text())
            except (json.JSONDecodeError, OSError, FileNotFoundError):
                data = default() if callable(default) else default
            result = updater(data)
            tmp = path.with_suffix(f".tmp.{os.getpid()}")
            tmp.write_text(json.dumps(result))
            tmp.rename(path)
            return result
        finally:
            fcntl.flock(lock_fd, fcntl.LOCK_UN)


def cc_send(session_name: str, text: str, summary: str = "") -> None:
    """Send a message to a named session via mailbox."""
    parent_id = os.environ.get("CLAUDE_SESSION_ID", "")
    if not parent_id:
        return
    path = MAILBOX_DIR / f"{parent_id}.json"

    def updater(msgs):
        if msgs is None:
            msgs = []
        msgs.append({
            "from": "batch",
            "text": text,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "read": False,
            "summary": summary or text[:60],
        })
        return msgs

    _locked_write(path, updater, default=list)


# ---------------------------------------------------------------------------
# Worker: single headless claude -p session
# ---------------------------------------------------------------------------

@dataclass
class WorkerResult:
    query: str
    triggered: bool | None = None
    output: str = ""
    error: str = ""
    elapsed: float = 0.0
    tool_calls: list[str] = field(default_factory=list)
    exit_code: int | None = None


def find_project_root() -> Path:
    current = Path.cwd()
    for parent in [current, *current.parents]:
        if (parent / ".claude").is_dir():
            return parent
    return current


def run_worker(
    query: str,
    skill_name: str | None = None,
    skill_description: str | None = None,
    timeout: int = 60,
    project_root: str = "",
    model: str | None = None,
    collect_output: bool = False,
    worker_id: str = "",
) -> WorkerResult:
    """Run a single headless claude -p session."""
    result = WorkerResult(query=query)
    start = time.time()

    # If skill provided, create temp command file
    command_file = None
    clean_name = ""
    if skill_name and skill_description:
        unique_id = uuid.uuid4().hex[:8]
        clean_name = f"{skill_name}-eval-{unique_id}"
        project_commands_dir = Path(project_root) / ".claude" / "commands"
        command_file = project_commands_dir / f"{clean_name}.md"
        project_commands_dir.mkdir(parents=True, exist_ok=True)
        indented_desc = "\n  ".join(skill_description.split("\n"))
        command_file.write_text(
            f"---\ndescription: |\n  {indented_desc}\n---\n\n"
            f"# {skill_name}\n\nThis skill handles: {skill_description}\n"
        )

    try:
        cmd = [
            "claude",
            "-p", query,
            "--output-format", "stream-json",
            "--verbose",
        ]
        if collect_output or (skill_name and skill_description):
            cmd.append("--include-partial-messages")
        if model:
            cmd.extend(["--model", model])

        env = {k: v for k, v in os.environ.items() if k != "CLAUDECODE"}

        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL,
            cwd=project_root or None,
            env=env,
        )

        buffer = ""
        pending_tool_name = None
        accumulated_json = ""
        full_output = []

        try:
            while time.time() - start < timeout:
                if process.poll() is not None:
                    remaining = process.stdout.read()
                    if remaining:
                        buffer += remaining.decode("utf-8", errors="replace")
                    break

                ready, _, _ = select.select([process.stdout], [], [], 1.0)
                if not ready:
                    continue

                chunk = os.read(process.stdout.fileno(), 8192)
                if not chunk:
                    break
                buffer += chunk.decode("utf-8", errors="replace")

                while "\n" in buffer:
                    line, buffer = buffer.split("\n", 1)
                    line = line.strip()
                    if not line:
                        continue

                    try:
                        event = json.loads(line)
                    except json.JSONDecodeError:
                        continue

                    # Track tool calls
                    if event.get("type") == "stream_event":
                        se = event.get("event", {})
                        se_type = se.get("type", "")

                        if se_type == "content_block_start":
                            cb = se.get("content_block", {})
                            if cb.get("type") == "tool_use":
                                tool_name = cb.get("name", "")
                                result.tool_calls.append(tool_name)
                                if clean_name and tool_name in ("Skill", "Read"):
                                    pending_tool_name = tool_name
                                    accumulated_json = ""

                        elif se_type == "content_block_delta" and pending_tool_name:
                            delta = se.get("delta", {})
                            if delta.get("type") == "input_json_delta":
                                accumulated_json += delta.get("partial_json", "")
                                if clean_name and clean_name in accumulated_json:
                                    result.triggered = True

                        elif se_type in ("content_block_stop", "message_stop"):
                            if pending_tool_name and clean_name:
                                if result.triggered is None:
                                    result.triggered = clean_name in accumulated_json
                                pending_tool_name = None
                                accumulated_json = ""

                    elif event.get("type") == "assistant":
                        message = event.get("message", {})
                        for ci in message.get("content", []):
                            if ci.get("type") == "text":
                                full_output.append(ci.get("text", ""))
                            elif ci.get("type") == "tool_use" and clean_name:
                                tool_input = ci.get("input", {})
                                if clean_name in json.dumps(tool_input):
                                    result.triggered = True

                    elif event.get("type") == "result":
                        msg = event.get("result", "")
                        if msg:
                            full_output.append(msg)

            result.exit_code = process.poll()
        finally:
            if process.poll() is None:
                process.kill()
                process.wait()

        if result.triggered is None and clean_name:
            result.triggered = False
        result.output = "\n".join(full_output)
        result.elapsed = time.time() - start

    except Exception as e:
        result.error = str(e)
        result.elapsed = time.time() - start
    finally:
        if command_file and command_file.exists():
            command_file.unlink()

    return result


# ---------------------------------------------------------------------------
# Batch orchestrator
# ---------------------------------------------------------------------------

@dataclass
class BatchConfig:
    workers: int = 20
    timeout: int = 60
    runs_per_query: int = 3
    trigger_threshold: float = 0.5
    model: str | None = None
    project_root: str = ""
    verbose: bool = False


def run_batch_eval(
    eval_set: list[dict],
    skill_name: str,
    skill_description: str,
    config: BatchConfig,
) -> dict:
    """Run eval set across N parallel workers with progress tracking."""
    batch_id = uuid.uuid4().hex[:8]
    total_runs = len(eval_set) * config.runs_per_query
    completed = 0
    failed = 0
    start_time = time.time()

    cc_register(batch_id, "starting", f"0/{total_runs} runs")

    if config.verbose:
        print(f"[batch:{batch_id}] {total_runs} runs across {config.workers} workers", file=sys.stderr)

    query_triggers: dict[str, list[bool]] = {}
    query_items: dict[str, dict] = {}
    query_elapsed: dict[str, list[float]] = {}

    with ProcessPoolExecutor(max_workers=config.workers) as executor:
        future_to_info = {}
        for item in eval_set:
            for run_idx in range(config.runs_per_query):
                future = executor.submit(
                    run_worker,
                    query=item["query"],
                    skill_name=skill_name,
                    skill_description=skill_description,
                    timeout=config.timeout,
                    project_root=config.project_root,
                    model=config.model,
                    worker_id=f"{batch_id}-{uuid.uuid4().hex[:4]}",
                )
                future_to_info[future] = (item, run_idx)

        for future in as_completed(future_to_info):
            item, run_idx = future_to_info[future]
            query = item["query"]
            query_items[query] = item
            if query not in query_triggers:
                query_triggers[query] = []
                query_elapsed[query] = []

            try:
                wr = future.result()
                query_triggers[query].append(wr.triggered or False)
                query_elapsed[query].append(wr.elapsed)
                if wr.error:
                    failed += 1
            except Exception as e:
                query_triggers[query].append(False)
                query_elapsed[query].append(0.0)
                failed += 1
                if config.verbose:
                    print(f"[batch:{batch_id}] error: {e}", file=sys.stderr)

            completed += 1
            if completed % max(1, total_runs // 20) == 0 or completed == total_runs:
                pct = completed * 100 // total_runs
                elapsed = time.time() - start_time
                rate = completed / elapsed if elapsed > 0 else 0
                eta = (total_runs - completed) / rate if rate > 0 else 0
                progress = f"{completed}/{total_runs} ({pct}%) {failed} err, ETA {eta:.0f}s"
                cc_register(batch_id, "running", progress)
                if config.verbose:
                    print(f"[batch:{batch_id}] {progress}", file=sys.stderr)

    # Build results in skill-creator format
    results = []
    for query, triggers in query_triggers.items():
        item = query_items[query]
        trigger_rate = sum(triggers) / len(triggers) if triggers else 0
        should_trigger = item.get("should_trigger", True)
        if should_trigger:
            did_pass = trigger_rate >= config.trigger_threshold
        else:
            did_pass = trigger_rate < config.trigger_threshold

        results.append({
            "query": query,
            "should_trigger": should_trigger,
            "trigger_rate": trigger_rate,
            "triggers": sum(triggers),
            "runs": len(triggers),
            "pass": did_pass,
            "avg_elapsed": sum(query_elapsed.get(query, [])) / max(1, len(query_elapsed.get(query, []))),
        })

    total_elapsed = time.time() - start_time
    passed = sum(1 for r in results if r["pass"])
    total = len(results)

    output = {
        "batch_id": batch_id,
        "skill_name": skill_name,
        "description": skill_description,
        "config": {
            "workers": config.workers,
            "timeout": config.timeout,
            "runs_per_query": config.runs_per_query,
            "trigger_threshold": config.trigger_threshold,
            "model": config.model,
        },
        "results": results,
        "summary": {
            "total": total,
            "passed": passed,
            "failed": total - passed,
            "pass_rate": passed / total if total > 0 else 0,
            "total_runs": total_runs,
            "errors": failed,
            "elapsed_seconds": round(total_elapsed, 1),
            "runs_per_second": round(total_runs / total_elapsed, 2) if total_elapsed > 0 else 0,
        },
    }

    # Notify parent session
    summary_line = f"{passed}/{total} passed ({failed} errors) in {total_elapsed:.0f}s"
    cc_register(batch_id, "done", summary_line)
    cc_send("", f"[batch:{batch_id}] {summary_line}", summary=f"batch done: {passed}/{total}")

    if config.verbose:
        print(f"\n[batch:{batch_id}] DONE: {summary_line}", file=sys.stderr)
        for r in output["results"]:
            status = "PASS" if r["pass"] else "FAIL"
            rate_str = f"{r['triggers']}/{r['runs']}"
            print(f"  [{status}] rate={rate_str} expected={r['should_trigger']}: {r['query'][:70]}", file=sys.stderr)

    return output


def run_batch_prompts(
    prompts: list[dict],
    config: BatchConfig,
) -> dict:
    """Run arbitrary prompts in batch (not eval — just collect outputs)."""
    batch_id = uuid.uuid4().hex[:8]
    total = len(prompts)
    completed = 0
    start_time = time.time()

    cc_register(batch_id, "starting", f"0/{total} prompts")

    results = []

    with ProcessPoolExecutor(max_workers=config.workers) as executor:
        future_to_prompt = {}
        for item in prompts:
            query = item if isinstance(item, str) else item.get("prompt", item.get("query", ""))
            future = executor.submit(
                run_worker,
                query=query,
                timeout=config.timeout,
                project_root=config.project_root,
                model=config.model,
                collect_output=True,
                worker_id=f"{batch_id}-{uuid.uuid4().hex[:4]}",
            )
            future_to_prompt[future] = item

        for future in as_completed(future_to_prompt):
            item = future_to_prompt[future]
            query = item if isinstance(item, str) else item.get("prompt", item.get("query", ""))
            try:
                wr = future.result()
                results.append({
                    "query": query,
                    "output": wr.output,
                    "tool_calls": wr.tool_calls,
                    "elapsed": round(wr.elapsed, 2),
                    "error": wr.error or None,
                })
            except Exception as e:
                results.append({
                    "query": query,
                    "output": "",
                    "tool_calls": [],
                    "elapsed": 0,
                    "error": str(e),
                })

            completed += 1
            if completed % max(1, total // 10) == 0 or completed == total:
                progress = f"{completed}/{total} ({completed * 100 // total}%)"
                cc_register(batch_id, "running", progress)
                if config.verbose:
                    print(f"[batch:{batch_id}] {progress}", file=sys.stderr)

    total_elapsed = time.time() - start_time
    errors = sum(1 for r in results if r.get("error"))

    output = {
        "batch_id": batch_id,
        "config": {
            "workers": config.workers,
            "timeout": config.timeout,
            "model": config.model,
        },
        "results": results,
        "summary": {
            "total": total,
            "errors": errors,
            "elapsed_seconds": round(total_elapsed, 1),
            "prompts_per_second": round(total / total_elapsed, 2) if total_elapsed > 0 else 0,
        },
    }

    return output


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def cmd_eval(args):
    eval_set = json.loads(Path(args.eval_set).read_text())

    # Parse skill SKILL.md for name + description
    skill_path = Path(args.skill_path)
    skill_md = skill_path / "SKILL.md"
    if not skill_md.exists():
        print(f"Error: No SKILL.md at {skill_path}", file=sys.stderr)
        sys.exit(1)

    # Minimal YAML frontmatter parsing (no deps)
    content = skill_md.read_text()
    name = skill_path.name
    description = ""
    if content.startswith("---"):
        _, fm, body = content.split("---", 2)
        for line in fm.strip().splitlines():
            if line.startswith("description:"):
                description = line.split(":", 1)[1].strip().strip('"').strip("'")
            elif line.startswith("name:"):
                name = line.split(":", 1)[1].strip().strip('"').strip("'")

    if args.description:
        description = args.description

    config = BatchConfig(
        workers=args.workers,
        timeout=args.timeout,
        runs_per_query=args.runs_per_query,
        trigger_threshold=args.trigger_threshold,
        model=args.model,
        project_root=args.project_root or str(find_project_root()),
        verbose=args.verbose,
    )

    output = run_batch_eval(eval_set, name, description, config)

    json_out = json.dumps(output, indent=2)
    print(json_out)

    if args.output:
        Path(args.output).write_text(json_out)
        print(f"Saved to {args.output}", file=sys.stderr)


def cmd_run(args):
    prompts = json.loads(Path(args.prompts).read_text())

    config = BatchConfig(
        workers=args.workers,
        timeout=args.timeout,
        model=args.model,
        project_root=args.project_root or str(find_project_root()),
        verbose=args.verbose,
    )

    output = run_batch_prompts(prompts, config)

    json_out = json.dumps(output, indent=2)
    print(json_out)

    if args.output:
        Path(args.output).write_text(json_out)
        print(f"Saved to {args.output}", file=sys.stderr)


def main():
    parser = argparse.ArgumentParser(
        description="cc batch — massively parallel Claude Code session orchestrator"
    )
    sub = parser.add_subparsers(dest="command", required=True)

    # eval subcommand
    eval_p = sub.add_parser("eval", help="Run skill trigger evaluation in batch")
    eval_p.add_argument("--eval-set", required=True, help="Path to evals.json")
    eval_p.add_argument("--skill-path", required=True, help="Path to skill directory")
    eval_p.add_argument("--description", help="Override skill description")
    eval_p.add_argument("--workers", type=int, default=20, help="Concurrent workers (default: 20)")
    eval_p.add_argument("--timeout", type=int, default=60, help="Timeout per session (default: 60s)")
    eval_p.add_argument("--runs-per-query", type=int, default=3, help="Runs per query (default: 3)")
    eval_p.add_argument("--trigger-threshold", type=float, default=0.5, help="Trigger threshold (default: 0.5)")
    eval_p.add_argument("--model", help="Model override")
    eval_p.add_argument("--project-root", help="Project root for claude -p")
    eval_p.add_argument("--output", "-o", help="Save results to file")
    eval_p.add_argument("--verbose", "-v", action="store_true")
    eval_p.set_defaults(func=cmd_eval)

    # run subcommand
    run_p = sub.add_parser("run", help="Run arbitrary prompts in batch")
    run_p.add_argument("--prompts", required=True, help="Path to prompts JSON (list of strings or objects with 'prompt' key)")
    run_p.add_argument("--workers", type=int, default=20, help="Concurrent workers (default: 20)")
    run_p.add_argument("--timeout", type=int, default=120, help="Timeout per session (default: 120s)")
    run_p.add_argument("--model", help="Model override")
    run_p.add_argument("--project-root", help="Project root for claude -p")
    run_p.add_argument("--output", "-o", help="Save results to file")
    run_p.add_argument("--verbose", "-v", action="store_true")
    run_p.set_defaults(func=cmd_run)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
