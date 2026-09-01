import { describe, expect, test } from 'bun:test';
import { validateProtectionRuleset } from './publisher';

const qualifying = [{
  enforcement: 'active', conditions: { ref_name: { include: ['~DEFAULT_BRANCH'] } }, bypass_actors: [],
  rules: [
    { type: 'deletion' }, { type: 'non_fast_forward' }, { type: 'pull_request' }, { type: 'required_signatures' },
    { type: 'required_status_checks', parameters: { strict_required_status_checks_policy: true, required_status_checks: ['site', 'handbook', 'markdown', 'compatibility'].map((context) => ({ context })) } },
  ],
}];

describe('protected publisher gate', () => {
  test('accepts the exact protected current-head contract', () => expect(validateProtectionRuleset(qualifying)).toBe(true));
  test('rejects bypass actors, missing checks, and non-strict checks', () => {
    expect(validateProtectionRuleset([{ ...qualifying[0], bypass_actors: [{ actor_id: 1 }] }])).toBe(false);
    expect(validateProtectionRuleset([{ ...qualifying[0], rules: qualifying[0].rules.filter((rule) => rule.type !== 'required_signatures') }])).toBe(false);
    const relaxed = structuredClone(qualifying); relaxed[0].rules.at(-1)!.parameters!.strict_required_status_checks_policy = false;
    expect(validateProtectionRuleset(relaxed)).toBe(false);
  });
});
