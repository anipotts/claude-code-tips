import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const h2 = (text) => `## ${text}`;
const h3 = (text) => `### ${text}`;

const overviewCodex = [
  h2('this is codex'), h3('one engineering loop, several control rooms'), h3('the task can be its own workspace'),
  h2('where codex lives'), h3('terminal and editor keep the evidence close'), h3('desktop coordinates parallel work'), h3('cloud and mobile change where you steer'),
  h2('the interface is not the whole system'), h3('the interface changes what you can see'), h3('the interaction layer changes what codex can reach'),
  h2('controlling codex across devices'), h3('steering is different from hosting'), h3('local, remote, and cloud execution are different'), h3('mobile keeps the control loop close'),
  h2('start with what you are trying to finish'), h3('code should end in the repository'), h3('ChatGPT Work begins with a finished deliverable'),
];

const overviewClaude = [
  h2('this is claude code'), h3('one engineering loop, several interfaces'), h3('the repository gives the task its shape'),
  h2('where claude code lives'), h3('terminal and IDE keep the evidence close'), h3('desktop coordinates parallel work'), h3('web, mobile, and Remote Control change where you steer'),
  h2('the interface is not the whole system'), h3('the interface changes what you can see'), h3('the interaction layer changes how claude code behaves'),
  h2('controlling claude code across devices'), h3('steering is different from hosting'), h3('web and Remote Control use different execution models'), h3('mobile keeps the control loop close'),
  h2('start with what you are trying to finish'), h3('code should end in the repository'), h3('Cowork begins with a finished deliverable'),
];

const gettingStarted = (instruction) => [
  h2('begin with one useful pass'), h3('use work you already understand'), h3('give it one visible finish line'),
  h2('choose the surface by how you want to review'), h3('keep commands and diffs close'), h3('use a visual surface when the review is visual'), h3('move the steering surface when it helps'),
  h2('give the repository durable context'), h3(instruction), h3('task context belongs to the current pass'),
  h2('define completion before the first prompt'), h3('name the artifact'), h3('name the verification command'), h3('name the decision that returns to you'),
  h2('close the loop with receipts'), h3('read the diff'), h3('rerun the proof'), h3('carry the open questions forward'),
];

const configurationCodex = [
  h2('configuration has separate jobs'), h3('AGENTS.md explains the repository'), h3('config.toml chooses defaults'),
  h2('understand the scope before changing a value'), h3('personal configuration follows you'), h3('project configuration begins with trust'), h3('profiles group deliberate modes'),
  h2('separate instructions from memory'), h3('shared rules have one canonical source'), h3('memory records useful experience'),
  h2('permissions are two different questions'), h3('the sandbox defines reach'), h3('approval policy defines interruption'),
  h2('keep identity and secrets outside the repository'), h3('authentication belongs to the account'), h3('credentials belong in external storage'),
  h2('inspect the effective configuration'), h3('profiles can change several assumptions at once'),
];

const configurationClaude = [
  h2('configuration has separate jobs'), h3('CLAUDE.md explains the repository'), h3('settings choose behavior'),
  h2('understand the scope before changing a value'), h3('user settings follow you'), h3('project settings travel with the repository'), h3('local and managed settings change precedence'),
  h2('separate instructions from memory'), h3('shared rules have one canonical source'), h3('auto memory records useful experience'),
  h2('permissions answer two questions'), h3('rules define allow, ask, and deny'), h3('modes define the session posture'),
  h2('keep identity and secrets outside the repository'), h3('authentication belongs to the account'), h3('credentials belong in external storage'),
  h2('inspect the effective configuration'), h3('imports and precedence can hide the source'),
];

const workflowsCodex = [
  h2('the everyday loop'), h3('scope the pass before the prompt'), h3('keep evidence close to the work'),
  h2('parallel work needs visible boundaries'), h3('one task owns one checkout'), h3('review capacity is the real limit'),
  h2('work that continues without you'), h3('goals preserve a durable objective'), h3('scheduled work needs a stable environment'), h3('cloud tasks return as new evidence'),
  h2('working across devices'), h3('mobile is a full codex surface'), h3('control other devices connects to a codex host'), h3('Remote SSH opens the remote machine directly'), h3('choose where execution should live'),
  h2('image generation belongs inside the build loop'), h3('generate from the project context'), h3('edit and refine existing images'), h3('turn visual output into reviewed assets'),
  h2('handoffs preserve state and authority'), h3('name the repository state'), h3('return with evidence and the remaining decision'),
];

const workflowsClaude = [
  h2('the everyday loop'), h3('scope the pass before the prompt'), h3('keep evidence close to the work'),
  h2('parallel work needs visible boundaries'), h3('subagents protect the main context'), h3('background agents keep work moving'), h3('worktrees separate change ownership'),
  h2('dynamic workflows coordinate more than one step'), h3('agent view makes parallel work visible'), h3('batch work needs independent units'), h3('repeatable loops need explicit routing'),
  h2('work that continues without you'), h3('loop watches the current session'), h3('desktop scheduled tasks stay local'), h3('routines continue in the cloud'),
  h2('working across devices'), h3('Remote Control keeps execution local'), h3('Dispatch starts work from mobile'), h3('web moves execution to the cloud'), h3('teleport changes the steering surface'),
  h2('handoffs preserve state and authority'), h3('resume, branch, and teleport carry different state'), h3('return with evidence and the remaining decision'),
];

const extensionsCodex = [
  h2('make operating knowledge reusable'), h3('instructions route the repository context'), h3('skills carry procedures, scripts, and references'),
  h2('connect a real system'), h3('MCP exposes tools and resources'), h3('authentication and reach stay explicit'),
  h2('make events deterministic'), h3('hooks run code at defined moments'), h3('failure should remain visible'),
  h2('give work its own context'), h3('subagents need a bounded problem'), h3('the return contract matters'),
  h2('package behavior for reuse'), h3('plugins move related behavior together'), h3('portable behavior needs an owner and version'),
  h2('compose without losing the plot'), h3('route context instead of preloading it'), h3('every layer needs one clear job'), h3('maintenance cost is part of the design'),
];

const extensionsClaude = [
  h2('make repository context durable'), h3('CLAUDE.md and rules establish context'), h3('skills carry procedures'), h3('imports keep shared knowledge singular'),
  h2('connect a real system'), h3('MCP exposes tools and resources'), h3('authentication and reach stay explicit'),
  h2('make events deterministic'), h3('hooks run code at defined moments'), h3('failure should remain visible'),
  h2('give work its own context'), h3('subagents need a bounded problem'), h3('the return contract matters'),
  h2('package behavior for reuse'), h3('plugins move related behavior together'), h3('portable behavior needs an owner and version'),
  h2('compose without losing the plot'), h3('precedence decides which layer wins'), h3('context cost is part of the design'), h3('ownership makes removal possible'),
];

const safety = (providerSection, providerHeadings) => [
  h2('access should match the job'), h3('filesystem, network, and external systems are separate kinds of reach'), h3('remote and cloud execution change the reachable world'),
  h2('identity travels with the action'), h3('name the human, machine, and service identity'), h3('scoped identities fit unattended work'),
  h2('unattended work changes the risk'), h3('scheduled work needs predeclared boundaries'), h3('event triggered work needs a narrow reachable world'),
  h2('external actions need their own decision'), h3('preparing and executing are separate states'), h3('final authority belongs to the named human'), h3('merge, publish, deploy, send, pay, purchase, delete, and account changes return to the human'),
  h2(providerSection), ...providerHeadings.map(h3),
  h2('finish with authority clear'), h3('name what happened under which identity'), h3('return the remaining decision'),
];

const recommendationsCodex = [
  h2('my default codex setup'), h3('desktop is the coordination hub'), h3('CLI and mobile have clear supporting jobs'),
  h2('when i switch surfaces'), h3('the review surface follows the evidence'), h3('execution location is a separate decision'),
  h2('what codex does unusually well'), h3('projectless work broadens the starting point'), h3('visible orchestration makes parallel work easier to judge'),
  h2('where image generation earns its place'), h3('generate visual direction from project context'), h3('edit and refine existing images'), h3('turn visual experiments into reviewed assets'),
  h2('why i recommend one password'), h3('the full access model belongs across agents'),
  h2('what i would avoid'), h3('parallelism that outruns review'), h3('standing access without a bounded job'),
  h2('what changed my mind'), h3('worktrees replaced direct main work'), h3('scoped authority replaced blanket autonomy'),
  h2('how i use a paid plan'), h3('treat the week as a resource budget'),
  h2('what i am still watching'), h3('mobile and remote execution keep changing'), h3('security and model behavior need dated claims'),
];

const recommendationsClaude = [
  h2('my default claude code setup'), h3('terminal and repository context are my default'), h3('desktop and remote surfaces have clear supporting jobs'),
  h2('when i switch surfaces'), h3('the review surface follows the evidence'), h3('execution location is a separate decision'),
  h2('what claude code does unusually well'), h3('repository context compounds across real work'), h3('dynamic workflows can coordinate real operations'),
  h2('when dynamic workflows earn their complexity'), h3('use them when they simplify a multistep job'), h3('background work needs a visible owner'), h3('routines need stable boundaries'),
  h2('why i recommend one password'), h3('the full access model belongs across agents'),
  h2('what i would avoid'), h3('context that grows without an owner'), h3('automation before a pass condition'),
  h2('what changed my mind'), h3('provider roles are a lens rather than a rule'), h3('scoped authority replaced blanket autonomy'),
  h2('how i use a paid plan'), h3('treat the week as a resource budget'),
  h2('what i am still watching'), h3('mobile and Remote Control keep changing'), h3('current workflow features need a paired field run'),
];

const credentials = [
  h2('credentials belong in an access layer'), h3('scope access to the current job'), h3('the broker supplies access while the secret stays encrypted'),
  h2('interactive access keeps the human close'), h3('biometric approval is fast enough to use'), h3('browser access should be scoped per task'),
  h2('automation needs a machine identity'), h3('service accounts narrow vault access'), h3('CLI, Environments, and Connect solve different jobs'),
  h2('why i pay for one password'), h3('one access layer keeps machines and agents cleaner'), h3('the value grows with a dedicated host'),
  h2('what changed my mind'), h3('the model expanded beyond CLI and Connect'), h3('provider integrations made scoped access practical'),
  h2('what i am still testing'), h3('integration limits need current verification'),
];

const contracts = new Map([
  ['docs/guides/codex.md', overviewCodex],
  ['docs/guides/claude-code.md', overviewClaude],
  ['docs/guides/codex/getting-started.md', gettingStarted('AGENTS.md explains the repository')],
  ['docs/guides/claude-code/getting-started.md', gettingStarted('CLAUDE.md explains the repository')],
  ['docs/guides/codex/configuration.md', configurationCodex],
  ['docs/guides/claude-code/configuration.md', configurationClaude],
  ['docs/guides/codex/workflows.md', workflowsCodex],
  ['docs/guides/claude-code/workflows.md', workflowsClaude],
  ['docs/guides/codex/extensions.md', extensionsCodex],
  ['docs/guides/claude-code/extensions.md', extensionsClaude],
  ['docs/guides/codex/safety.md', safety('security review is its own workflow', ['Codex Security surfaces hypotheses', 'a finding still needs validation'])],
  ['docs/guides/claude-code/safety.md', safety('policy can set an organization floor', ['managed policy defines the floor', 'hooks can enforce specific events'])],
  ['docs/guides/codex/recommendations.md', recommendationsCodex],
  ['docs/guides/claude-code/recommendations.md', recommendationsClaude],
  ['docs/guides/credentials-and-access.md', credentials],
]);

const failures = [];
for (const [relative, expected] of contracts) {
  const markdown = await readFile(path.join(root, relative), 'utf8');
  const actual = [...markdown.matchAll(/^(##|###) (.+)$/gm)].map((match) => `${match[1]} ${match[2]}`);
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    failures.push(`${relative}: heading contract changed\nexpected: ${JSON.stringify(expected)}\nactual:   ${JSON.stringify(actual)}`);
  }
  if (!/^checkedAt:\s*"\d{4}-\d{2}-\d{2}T[^\n]+"$/m.test(markdown)) failures.push(`${relative}: checkedAt is required`);
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`validated handbook heading and freshness contracts for ${contracts.size} guides`);
