import {
  globalFilterOptions,
  mockAiConversation,
  mockDashboards,
  mockLogs,
  mockMetricSeries,
  mockTraces,
} from './mock';
import { Dashboard, LogEntry, MetricSeries, Trace } from './types';

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
    return mockLogs;
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
  async sendSlackTestMessage(payload: { channel: string; text: string }) {
    await simulateLatency();
    return {
      ok: true,
      ...payload,
      sentAt: new Date().toISOString(),
    };
  },
};
