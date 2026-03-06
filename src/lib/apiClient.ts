import {
  globalFilterOptions,
  mockAiConversation,
  mockDashboards,
  mockLogs,
  mockMetricSeries,
  mockTraces,
} from './mock';
import { Dashboard, LogEntry, MetricSeries, NotificationItem, RunbookItem, Trace } from './types';

const simulateLatency = async () => {
  await new Promise((resolve) => setTimeout(resolve, 150));
};

export const apiClient = {
  async getDashboards(): Promise<Dashboard[]> {
    await simulateLatency();
    return mockDashboards;
  },
  async getLogs(): Promise<LogEntry[]> {
    await simulateLatency();

    try {
      const response = await fetch('/data/logs-example.json');

      if (!response.ok) {
        return mockLogs;
      }

      const data = (await response.json()) as { logs?: LogEntry[] };
      return data.logs ?? mockLogs;
    } catch {
      return mockLogs;
    }
  },
  async getMetrics(): Promise<MetricSeries[]> {
    await simulateLatency();
    return mockMetricSeries;
  },
  async getTraces(): Promise<Trace[]> {
    await simulateLatency();
    return mockTraces;
  },
  async getGlobalFilterOptions() {
    await simulateLatency();
    return globalFilterOptions;
  },
  async getAiMessages() {
    await simulateLatency();
    return mockAiConversation;
  },
  async getNotifications(): Promise<NotificationItem[]> {
    await simulateLatency();

    try {
      const response = await fetch('/data/notifications-example.json');

      if (!response.ok) {
        return [];
      }

      const data = (await response.json()) as NotificationItem[];
      return data;
    } catch {
      return [];
    }
  },
  async getRunbooks(): Promise<RunbookItem[]> {
    await simulateLatency();

    try {
      const response = await fetch('/data/runbooks-example.json');

      if (!response.ok) {
        return [];
      }

      const data = (await response.json()) as RunbookItem[];
      return data;
    } catch {
      return [];
    }
  },
  async sendSlackTestMessage(payload: { channel: string; text: string }) {
    await simulateLatency();
    return {
      ok: true,
      ...payload,
      sentAt: new Date().toISOString(),
    };
  },
};
