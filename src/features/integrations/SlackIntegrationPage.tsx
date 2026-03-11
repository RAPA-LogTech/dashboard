'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Chip,
  Box,
  Card,
  CardContent,
  Button,
  Alert,
  Stack,
  Typography,
  Divider,
} from '@mui/material';
import { apiClient } from '@/lib/apiClient';

export default function SlackIntegrationPage() {
  const searchParams = useSearchParams();

  const integrationQuery = useQuery({
    queryKey: ['slack-integration'],
    queryFn: () => apiClient.getSlackIntegration(),
  });

  const disconnectMutation = useMutation({
    mutationFn: () => apiClient.disconnectSlackIntegration(),
    onSuccess: () => {
      integrationQuery.refetch();
    },
  });

  const testMutation = useMutation({
    mutationFn: () =>
      apiClient.sendSlackTestMessage({
        text: '[TEST] Observability alert pipeline health check',
      }),
  });

  const oauthStatus = searchParams.get('slack');
  const oauthDetails = searchParams.get('details');

  const oauthFeedback = useMemo(() => {
    if (!oauthStatus) {
      return null;
    }

    if (oauthStatus === 'connected') {
      return { severity: 'success' as const, message: 'Slack 워크스페이스 연결이 완료되었습니다.' };
    }

    if (oauthStatus === 'cancelled') {
      return { severity: 'warning' as const, message: 'Slack 권한 승인이 취소되었습니다.' };
    }

    if (oauthStatus === 'not-configured') {
      return {
        severity: 'error' as const,
        message: '서버에 Slack OAuth 환경 변수가 설정되지 않았습니다.',
      };
    }

    return {
      severity: 'error' as const,
      message: `Slack OAuth 처리 중 오류가 발생했습니다${oauthDetails ? `: ${oauthDetails}` : ''}`,
    };
  }, [oauthDetails, oauthStatus]);

  const connected = integrationQuery.data?.connected ?? false;
  const oauthConfigured = integrationQuery.data?.oauthConfigured ?? false;
  const canTest = connected && !testMutation.isPending;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2, md: 3 } }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
        Slack Integration
      </Typography>

      <Card sx={{ bgcolor: (theme) => theme.palette.background.paper, border: '1px solid', borderColor: (theme) => theme.palette.divider }}>
        <CardContent>
          <Stack spacing={2}>
            <Alert
              severity={connected ? 'success' : 'info'}
              variant="outlined"
              sx={{
                bgcolor: (theme) => theme.palette.mode === 'dark' ? '#0f172a' : '#ffffff',
                color: (theme) => theme.palette.info.main,
                borderColor: (theme) => theme.palette.info.dark,
                '& .MuiAlert-icon': {
                  color: (theme) => theme.palette.info.main,
                },
              }}
            >
              {connected
                ? `Connection Status: Connected to ${integrationQuery.data?.teamName ?? 'Slack workspace'}`
                : 'Connection Status: Not Connected'}
            </Alert>

            {oauthFeedback && (
              <Alert severity={oauthFeedback.severity} variant="outlined">
                {oauthFeedback.message}
              </Alert>
            )}

            {!oauthConfigured && (
              <Alert severity="warning" variant="outlined">
                Slack OAuth를 쓰려면 서버 환경 변수에 SLACK_CLIENT_ID, SLACK_CLIENT_SECRET, SLACK_SIGNING_SECRET을 설정해야 합니다.
              </Alert>
            )}

            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                How It Works
              </Typography>
              <Typography variant="body2" color="text.secondary">
                고객은 Connect Slack 버튼만 누르고 Slack 권한 화면에서 허용하면 됩니다. 설치가 끝나면 선택한 워크스페이스와 채널 정보가 이 페이지에 자동으로 반영됩니다.
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                onClick={() => {
                  window.location.href = '/api/integrations/slack/connect';
                }}
                disabled={!oauthConfigured}
                sx={{
                  bgcolor: (theme) => theme.palette.primary.main,
                  textTransform: 'none',
                  '&:hover': {
                    bgcolor: (theme) => theme.palette.primary.dark,
                  },
                }}
              >
                {connected ? 'Reconnect Slack' : 'Connect Slack'}
              </Button>
              <Button
                variant="outlined"
                onClick={() => testMutation.mutate()}
                disabled={!canTest}
                sx={{
                  color: (theme) => theme.palette.text.secondary,
                  borderColor: (theme) => theme.palette.divider,
                  textTransform: 'none',
                  '&:hover': {
                    bgcolor: (theme) => theme.palette.action.hover,
                    borderColor: (theme) => theme.palette.primary.main,
                  },
                  '&.Mui-disabled': {
                    opacity: 0.5,
                  },
                }}
              >
                {testMutation.isPending ? 'Sending...' : 'Test Message'}
              </Button>
              <Button
                variant="outlined"
                color="error"
                onClick={() => disconnectMutation.mutate()}
                disabled={!connected || disconnectMutation.isPending}
                sx={{ textTransform: 'none' }}
              >
                {disconnectMutation.isPending ? 'Disconnecting...' : 'Disconnect'}
              </Button>
            </Box>

            <Divider />

            <Stack spacing={1}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Installation Summary
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Workspace: {integrationQuery.data?.teamName ?? '-'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Channel: {integrationQuery.data?.channelName ?? '-'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Installed By: {integrationQuery.data?.installedBy ?? '-'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Installed At: {integrationQuery.data?.installedAt ?? '-'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Webhook: {integrationQuery.data?.webhookUrlMasked ?? '-'}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', pt: 0.5 }}>
                {(integrationQuery.data?.scopes ?? []).map((scope) => (
                  <Chip key={scope} label={scope} size="small" variant="outlined" />
                ))}
              </Box>
            </Stack>

            {integrationQuery.isError && (
              <Alert severity="error" variant="outlined">
                {(integrationQuery.error as Error).message}
              </Alert>
            )}

            {disconnectMutation.isError && (
              <Alert severity="error" variant="outlined">
                {(disconnectMutation.error as Error).message}
              </Alert>
            )}

            {testMutation.isError && (
              <Alert severity="error" variant="outlined">
                {(testMutation.error as Error).message}
              </Alert>
            )}

            {testMutation.data?.ok && (
              <Alert
                severity="success"
                variant="outlined"
                sx={{
                  bgcolor: (theme) => theme.palette.mode === 'dark' ? '#0f172a' : '#ffffff',
                  color: (theme) => theme.palette.success.main,
                  borderColor: (theme) => theme.palette.success.dark,
                  '& .MuiAlert-icon': {
                    color: (theme) => theme.palette.success.main,
                  },
                }}
              >
                테스트 메시지 전송 완료: {testMutation.data.channel}
              </Alert>
            )}

            {disconnectMutation.data?.ok && (
              <Alert severity="success" variant="outlined">
                Slack 연동이 해제되었습니다.
              </Alert>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
