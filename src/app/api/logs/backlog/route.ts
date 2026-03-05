import { getLogBacklogPage } from '@/lib/live/logsLive';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cursorParam = Number(searchParams.get('cursor') ?? '0');
  const limitParam = Number(searchParams.get('limit') ?? '200');
  const cursor = Number.isFinite(cursorParam) ? cursorParam : 0;
  const limit = Number.isFinite(limitParam) ? limitParam : 200;

  const page = getLogBacklogPage(cursor, limit);

  return Response.json({
    events: page.events,
    nextCursor: page.nextCursor,
    hasMore: page.hasMore,
    latestCursor: page.latestCursor,
  });
}
