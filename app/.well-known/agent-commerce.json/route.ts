import { agentManifest } from '../../../lib/agent-manifest';
export function GET() {
  return Response.json(agentManifest);
}
