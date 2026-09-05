import { RescueHandoff } from '@/components/rescue-handoff';
export default async function HandoffPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  return <RescueHandoff caseId={caseId} />;
}
