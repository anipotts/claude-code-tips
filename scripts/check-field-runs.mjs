import { execFile } from 'node:child_process';
import { readFile, readdir, realpath } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { promisify } from 'node:util';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { parseRepositoryEvidenceUrl } from './repository-evidence-url.mjs';

const root = process.cwd();
const canonicalRoot = await realpath(root);
const runsDirectory = path.join(root, 'docs', 'field-lab', 'runs');
const schema = JSON.parse(await readFile(path.join(root, 'docs', 'field-lab', 'run.schema.json'), 'utf8'));
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const validate = ajv.compile(schema);
const files = (await readdir(runsDirectory)).filter((file) => file.endsWith('.json')).sort();
const repositoryBlobPrefix = 'https://github.com/anipotts/coding-agent-tips/blob/main/';
const runFailures = [];
const execFileAsync = promisify(execFile);

if (files.length === 0) {
  throw new Error('field lab requires at least one run record');
}

async function validateRepositoryTarget(url, context, baseUrl = repositoryBlobPrefix) {
  const parsed = parseRepositoryEvidenceUrl(url, { baseUrl, repositoryBlobPrefix });
  if (parsed.external) return;
  if (parsed.error === 'malformed-url') {
    runFailures.push(`${context}: malformed repository evidence URL: ${url}`);
    return;
  }
  if (parsed.error === 'malformed-path') {
    runFailures.push(`${context}: malformed repository evidence path: ${url}`);
    return;
  }
  if (parsed.error === 'path-escape') {
    runFailures.push(`${context}: repository evidence target escapes the repository: ${url}`);
    return;
  }

  const { repositoryPath } = parsed;

  const resolvedPath = path.resolve(root, repositoryPath);
  let canonicalTarget;
  try {
    canonicalTarget = await realpath(resolvedPath);
  } catch {
    runFailures.push(`${context}: repository evidence target does not exist: ${repositoryPath}`);
    return;
  }

  const relativeTarget = path.relative(canonicalRoot, canonicalTarget);
  if (relativeTarget === '..' || relativeTarget.startsWith(`..${path.sep}`) || path.isAbsolute(relativeTarget)) {
    runFailures.push(`${context}: repository evidence target escapes the repository: ${repositoryPath}`);
  }
}

for (const file of files) {
  const text = await readFile(path.join(runsDirectory, file), 'utf8');
  const run = JSON.parse(text);

  if (!validate(run)) {
    runFailures.push(`${file}: ${ajv.errorsText(validate.errors, { separator: '; ' })}`);
  }

  if (`${run.runId}.json` !== file) {
    runFailures.push(`${file}: filename must match runId`);
  }

  const expectedTaskSpecification = `${repositoryBlobPrefix}docs/field-lab/runs/${run.runId}/task-specification.md`;
  if (run.taskSpecification !== expectedTaskSpecification) {
    runFailures.push(`${file}: taskSpecification must live beneath its run id`);
  }

  const evidenceUrls = [
    run.taskSpecification,
    ...run.scenarios.flatMap((scenario) => scenario.evidence),
    ...run.artifacts.map((artifact) => artifact.url),
  ];
  const runEvidenceBase = `${repositoryBlobPrefix}docs/field-lab/runs/${run.runId}/`;

  for (const url of evidenceUrls) {
    await validateRepositoryTarget(url, file, runEvidenceBase);
  }

  if (/\/(?:Users|home)\//.test(text) || /(?:api[_-]?key|password|credential|private transcript)/i.test(text)) {
    runFailures.push(`${file}: contains a blocked private-path or secret-bearing term`);
  }
}

const { stdout: trackedMarkdownOutput } = await execFileAsync('git', ['ls-files', '*.md'], { cwd: root });
const trackedMarkdown = trackedMarkdownOutput.split('\n').filter(Boolean);
const repositoryLinkPattern = /https:\/\/github\.com\/anipotts\/coding-agent-tips\/blob\/main\/[^\s<>")\]]+/g;

for (const file of trackedMarkdown) {
  const text = await readFile(path.join(root, file), 'utf8');
  for (const url of text.match(repositoryLinkPattern) ?? []) {
    await validateRepositoryTarget(url, file);
  }
}

if (runFailures.length > 0) {
  console.error(runFailures.join('\n'));
  process.exit(1);
}

console.log(`validated ${files.length} field run record${files.length === 1 ? '' : 's'}`);
