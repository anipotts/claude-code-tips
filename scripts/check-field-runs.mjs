import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const root = process.cwd();
const runsDirectory = path.join(root, 'docs', 'field-lab', 'runs');
const schema = JSON.parse(await readFile(path.join(root, 'docs', 'field-lab', 'run.schema.json'), 'utf8'));
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const validate = ajv.compile(schema);
const files = (await readdir(runsDirectory)).filter((file) => file.endsWith('.json')).sort();
const repositoryBlobPrefix = 'https://github.com/anipotts/coding-agent-tips/blob/main/';

if (files.length === 0) {
  throw new Error('field lab requires at least one run record');
}

const failures = [];

for (const file of files) {
  const text = await readFile(path.join(runsDirectory, file), 'utf8');
  const run = JSON.parse(text);

  if (!validate(run)) {
    failures.push(`${file}: ${ajv.errorsText(validate.errors, { separator: '; ' })}`);
  }

  if (`${run.runId}.json` !== file) {
    failures.push(`${file}: filename must match runId`);
  }

  const expectedTaskSpecification = `${repositoryBlobPrefix}docs/field-lab/runs/${run.runId}/task-specification.md`;
  if (run.taskSpecification !== expectedTaskSpecification) {
    failures.push(`${file}: taskSpecification must live beneath its run id`);
  }

  const evidenceUrls = [
    run.taskSpecification,
    ...run.scenarios.flatMap((scenario) => scenario.evidence),
    ...run.artifacts.map((artifact) => artifact.url),
  ];

  for (const url of evidenceUrls) {
    if (!url.startsWith(repositoryBlobPrefix)) continue;

    const repositoryPath = decodeURIComponent(url.slice(repositoryBlobPrefix.length));
    const resolvedPath = path.resolve(root, repositoryPath);
    if (!resolvedPath.startsWith(`${root}${path.sep}`)) {
      failures.push(`${file}: repository evidence target escapes the repository: ${repositoryPath}`);
      continue;
    }

    try {
      await access(resolvedPath);
    } catch {
      failures.push(`${file}: repository evidence target does not exist: ${repositoryPath}`);
    }
  }

  if (/\/(?:Users|home)\//.test(text) || /(?:api[_-]?key|password|credential|private transcript)/i.test(text)) {
    failures.push(`${file}: contains a blocked private-path or secret-bearing term`);
  }
}

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`validated ${files.length} field run record${files.length === 1 ? '' : 's'}`);
