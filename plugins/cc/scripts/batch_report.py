#!/usr/bin/env python3
"""Convert batch.py eval output to skill-creator's report format.

Bridges cc/batch results into the HTML report generator from skill-creator,
so you get the same interactive viewer for batch eval runs.

Usage:
    python3 batch_report.py results.json -o report.html
    python3 batch_report.py results.json  # opens in browser
"""

import argparse
import html
import json
import sys
import tempfile
import webbrowser
from pathlib import Path


def batch_to_loop_format(batch_data: dict) -> dict:
    """Convert batch eval output to run_loop.py's history format."""
    results = batch_data.get("results", [])
    description = batch_data.get("description", "")

    passed = sum(1 for r in results if r["pass"])
    total = len(results)

    return {
        "original_description": description,
        "best_description": description,
        "best_score": f"{passed}/{total}",
        "best_train_score": f"{passed}/{total}",
        "best_test_score": None,
        "final_description": description,
        "iterations_run": 1,
        "holdout": 0,
        "train_size": total,
        "test_size": 0,
        "history": [{
            "iteration": 1,
            "description": description,
            "train_passed": passed,
            "train_failed": total - passed,
            "train_total": total,
            "train_results": results,
            "test_passed": None,
            "test_failed": None,
            "test_total": None,
            "test_results": None,
            "passed": passed,
            "failed": total - passed,
            "total": total,
            "results": results,
        }],
    }


def generate_standalone_html(batch_data: dict) -> str:
    """Generate a standalone HTML report from batch eval results."""
    results = batch_data.get("results", [])
    summary = batch_data.get("summary", {})
    config = batch_data.get("config", {})
    batch_id = batch_data.get("batch_id", "?")
    skill_name = batch_data.get("skill_name", "?")
    description = batch_data.get("description", "")

    positives = [r for r in results if r.get("should_trigger", True)]
    negatives = [r for r in results if not r.get("should_trigger", True)]

    # Stats
    total_runs = sum(r.get("runs", 0) for r in results)
    total_triggers = sum(r.get("triggers", 0) for r in results)
    avg_elapsed = sum(r.get("avg_elapsed", 0) for r in results) / max(1, len(results))

    pos_pass = sum(1 for r in positives if r["pass"])
    neg_pass = sum(1 for r in negatives if r["pass"])

    rows = []
    for r in sorted(results, key=lambda x: (x["pass"], x.get("should_trigger", True))):
        status = "PASS" if r["pass"] else "FAIL"
        icon = "&#10003;" if r["pass"] else "&#10007;"
        css = "pass" if r["pass"] else "fail"
        expected = "trigger" if r.get("should_trigger", True) else "no trigger"
        rate = f"{r.get('triggers', 0)}/{r.get('runs', 0)}"
        elapsed = f"{r.get('avg_elapsed', 0):.1f}s"
        rows.append(f"""<tr class="{css}-row">
            <td class="{css}">{icon} {status}</td>
            <td>{html.escape(r['query'][:80])}</td>
            <td>{expected}</td>
            <td>{rate}</td>
            <td>{r.get('trigger_rate', 0):.0%}</td>
            <td>{elapsed}</td>
        </tr>""")

    return f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Batch Eval: {html.escape(skill_name)}</title>
<style>
    body {{ font-family: system-ui, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; background: #faf9f5; color: #141413; }}
    h1 {{ font-size: 1.5rem; }}
    .summary {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin: 20px 0; }}
    .card {{ background: white; padding: 16px; border-radius: 8px; border: 1px solid #e8e6dc; }}
    .card .label {{ font-size: 0.75rem; color: #888; text-transform: uppercase; }}
    .card .value {{ font-size: 1.5rem; font-weight: 700; }}
    .card .value.good {{ color: #788c5d; }}
    .card .value.warn {{ color: #d97706; }}
    .card .value.bad {{ color: #c44; }}
    .desc {{ background: white; padding: 12px 16px; border-radius: 8px; border: 1px solid #e8e6dc; font-family: monospace; font-size: 0.85rem; margin: 12px 0; word-break: break-word; }}
    table {{ width: 100%; border-collapse: collapse; background: white; border: 1px solid #e8e6dc; border-radius: 8px; font-size: 0.85rem; }}
    th, td {{ padding: 8px 12px; text-align: left; border-bottom: 1px solid #e8e6dc; }}
    th {{ background: #141413; color: #faf9f5; font-weight: 500; }}
    .pass {{ color: #788c5d; font-weight: 700; }}
    .fail {{ color: #c44; font-weight: 700; }}
    .fail-row {{ background: #fdf2f2; }}
    .pass-row:hover, .fail-row:hover {{ background: #f5f5f0; }}
</style>
</head>
<body>
<h1>Batch Eval: {html.escape(skill_name)} <span style="color:#888;font-size:0.8rem">#{batch_id}</span></h1>
<div class="desc">{html.escape(description)}</div>

<div class="summary">
    <div class="card">
        <div class="label">Pass Rate</div>
        <div class="value {'good' if summary.get('pass_rate', 0) >= 0.8 else 'warn' if summary.get('pass_rate', 0) >= 0.5 else 'bad'}">{summary.get('pass_rate', 0):.0%}</div>
        <div style="font-size:0.8rem;color:#888">{summary.get('passed', 0)}/{summary.get('total', 0)} queries</div>
    </div>
    <div class="card">
        <div class="label">Positive Queries</div>
        <div class="value {'good' if pos_pass == len(positives) else 'warn'}">{pos_pass}/{len(positives)}</div>
        <div style="font-size:0.8rem;color:#888">should trigger</div>
    </div>
    <div class="card">
        <div class="label">Negative Queries</div>
        <div class="value {'good' if neg_pass == len(negatives) else 'warn'}">{neg_pass}/{len(negatives)}</div>
        <div style="font-size:0.8rem;color:#888">should NOT trigger</div>
    </div>
    <div class="card">
        <div class="label">Total Runs</div>
        <div class="value">{summary.get('total_runs', total_runs)}</div>
        <div style="font-size:0.8rem;color:#888">{config.get('runs_per_query', '?')}x per query</div>
    </div>
    <div class="card">
        <div class="label">Throughput</div>
        <div class="value">{summary.get('runs_per_second', 0):.1f}/s</div>
        <div style="font-size:0.8rem;color:#888">{config.get('workers', '?')} workers</div>
    </div>
    <div class="card">
        <div class="label">Wall Time</div>
        <div class="value">{summary.get('elapsed_seconds', 0):.0f}s</div>
        <div style="font-size:0.8rem;color:#888">avg {avg_elapsed:.1f}s per query</div>
    </div>
</div>

<table>
<thead><tr><th>Status</th><th>Query</th><th>Expected</th><th>Triggers</th><th>Rate</th><th>Avg Time</th></tr></thead>
<tbody>
{''.join(rows)}
</tbody>
</table>
</body>
</html>"""


def main():
    parser = argparse.ArgumentParser(description="Generate HTML report from batch eval results")
    parser.add_argument("input", help="Path to batch results JSON")
    parser.add_argument("-o", "--output", help="Output HTML file (default: open in browser)")
    parser.add_argument("--loop-format", action="store_true", help="Output in run_loop.py format instead of HTML")
    args = parser.parse_args()

    data = json.loads(Path(args.input).read_text())

    if args.loop_format:
        print(json.dumps(batch_to_loop_format(data), indent=2))
        return

    html_output = generate_standalone_html(data)

    if args.output:
        Path(args.output).write_text(html_output)
        print(f"Report: {args.output}", file=sys.stderr)
    else:
        path = Path(tempfile.gettempdir()) / f"batch_eval_{data.get('batch_id', 'report')}.html"
        path.write_text(html_output)
        webbrowser.open(str(path))
        print(f"Report: {path}", file=sys.stderr)


if __name__ == "__main__":
    main()
