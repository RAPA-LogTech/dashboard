import { mockMetricSeries } from '@/lib/mock';

type StreamPoint = {
  id: string;
  ts: number;
  value: number;
};

export type MetricStreamPayload = {
  cursor: number;
  ts: number;
  points: StreamPoint[];
};

type MutableSeriesState = {
  id: string;
  unit: string;
  value: number;
};

const listeners = new Set<(payload: MetricStreamPayload) => void>();
const history: MetricStreamPayload[] = [];

const MAX_HISTORY = 400;
let started = false;
let timer: ReturnType<typeof setTimeout> | null = null;
let cursor = 0;

const clampByUnit = (value: number, unit: string) => {
  if (unit === '%') return Math.max(0, Math.min(100, value));
  return Math.max(0, value);
};

const roundByUnit = (value: number, unit: string) => {
  if (unit === '%') return Number(value.toFixed(3));
  if (unit === 'ms') return Number(value.toFixed(0));
  return Number(value.toFixed(2));
};

const nextDeltaByUnit = (unit: string) => {
  if (unit === '%') return (Math.random() - 0.5) * 1.2;
  if (unit === 'ms') return (Math.random() - 0.5) * 24;
  return (Math.random() - 0.5) * 40;
};

const buildInitialState = (): MutableSeriesState[] =>
  mockMetricSeries.map((series) => ({
    id: series.id,
    unit: series.unit,
    value: series.points[series.points.length - 1]?.value ?? 0,
  }));

const state = buildInitialState();

const publish = (payload: MetricStreamPayload) => {
  history.push(payload);
  if (history.length > MAX_HISTORY) {
    history.splice(0, history.length - MAX_HISTORY);
  }
  listeners.forEach((listener) => listener(payload));
};

const emit = () => {
  const ts = Date.now();
  const points: StreamPoint[] = state.map((series) => {
    const nextRaw = series.value + nextDeltaByUnit(series.unit);
    const next = roundByUnit(clampByUnit(nextRaw, series.unit), series.unit);
    series.value = next;

    return { id: series.id, ts, value: next };
  });

  cursor += 1;
  publish({ cursor, ts, points });

  const nextDelayMs = 4500 + Math.floor(Math.random() * 5500);
  timer = setTimeout(emit, nextDelayMs);
};

export const ensureMetricsProducer = () => {
  if (started) return;
  started = true;
  emit();
};

export const subscribeMetrics = (listener: (payload: MetricStreamPayload) => void) => {
  ensureMetricsProducer();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const getMetricBacklogPage = (afterCursor: number, limit: number) => {
  ensureMetricsProducer();
  const safeCursor = Number.isFinite(afterCursor) ? Math.max(0, Math.floor(afterCursor)) : 0;
  const safeLimit = Number.isFinite(limit) ? Math.min(500, Math.max(1, Math.floor(limit))) : 200;

  const events = history
    .filter((event) => event.cursor > safeCursor)
    .slice(0, safeLimit);
  const nextCursor = events.length > 0 ? events[events.length - 1].cursor : safeCursor;
  const latestCursor = history[history.length - 1]?.cursor ?? safeCursor;

  return {
    events,
    nextCursor,
    hasMore: latestCursor > nextCursor,
    latestCursor,
  };
};

export const getLatestMetricCursor = () => {
  const last = history[history.length - 1];
  return last?.cursor ?? 0;
};
