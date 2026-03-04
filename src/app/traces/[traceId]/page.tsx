import TracesDetailPage from '@/features/traces/TracesDetailPage';

export default async function Page({ params }: { params: Promise<{ traceId: string }> }) {
  const { traceId } = await params;

  return <TracesDetailPage traceId={traceId} />;
}
