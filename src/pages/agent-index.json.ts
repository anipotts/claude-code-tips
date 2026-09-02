import { buildAgentIndex } from '../agent-index.mjs';

export async function GET() {
  const index = await buildAgentIndex(process.cwd());
  return new Response(`${JSON.stringify(index)}\n`, {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=300',
    },
  });
}
