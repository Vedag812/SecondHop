import { RescueConsole } from '@/components/rescue-console';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ parcel?: string }>;
}) {
  const { parcel } = await searchParams;
  return <RescueConsole initialParcelId={parcel} />;
}
