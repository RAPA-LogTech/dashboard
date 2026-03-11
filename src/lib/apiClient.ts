import {
  globalFilterOptions,
  mockAiConversation,
  mockDashboards,
  mockLogs,
  mockMetricSeries,
  mockTraces,
} from './mock';
import {
  Dashboard,
  LogEntry,
  MetricSeries,
  NotificationItem,
  RunbookItem,
  SlackIntegrationStatus,
  SlackTestMessageResponse,
  Trace,
} from './types';

const simulateLatency = async () => {
  await new Promise((resolve) => setTimeout(resolve, 150));
};

const readErrorMessage = async (response: Response, fallback: string) => {
  try {
    const errorBody = (await response.json()) as { message?: string };
    return errorBody.message ?? fallback;
  } catch {
    return fallback;
  }
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
  async sendSlackTestMessage(payload: { text: string }) {
    const response = await fetch('/api/integrations/slack/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(await readErrorMessage(response, 'Slack 테스트 메시지 전송에 실패했습니다.'));
    }

    return (await response.json()) as SlackTestMessageResponse;
  },
  async getSlackIntegration() {
    const response = await fetch('/api/integrations/slack');

    if (!response.ok) {
      throw new Error(await readErrorMessage(response, 'Slack 연동 정보 조회에 실패했습니다.'));
    }

    return (await response.json()) as SlackIntegrationStatus;
  },
  async disconnectSlackIntegration() {
    const response = await fetch('/api/integrations/slack', {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(await readErrorMessage(response, 'Slack 연동 해제에 실패했습니다.'));
    }

    return (await response.json()) as {
      ok: boolean;
      disconnectedAt: string;
    };
  },
};
