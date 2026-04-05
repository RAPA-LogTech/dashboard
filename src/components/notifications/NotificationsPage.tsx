'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Link as MuiLink,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { apiClient } from '@/lib/apiClient'
import { formatDateTime } from '@/lib/formatters'
import NoDataState from '@/components/common/NoDataState'

export default function NotificationsPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [slackFlowFlash, setSlackFlowFlash] = useState<{ status: string | null; details: string | null }>(() => ({
    status: searchParams.get('slack'),
    details: searchParams.get('details'),
  }))
  const queryClient = useQueryClient()
  const notificationsQuery = useQuery({
    queryKey: ['notifications-page'],
    queryFn: apiClient.getNotifications,
  })
  const integrationQuery = useQuery({
    queryKey: ['notifications-slack-integration-status'],
    queryFn: apiClient.getSlackIntegration,
  })
  const slackConfigQuery = useQuery<{ configured: boolean; message?: string }>({
    queryKey: ['notifications-slack-config'],
    queryFn: async () => {
      const response = await fetch('/api/integrations/slack/config', { cache: 'no-store' })
      if (!response.ok) {
        throw new Error('Slack OAuth 설정 조회에 실패했습니다.')
      }
      return (await response.json()) as { configured: boolean; message?: string }
    },
  })

  const disconnectSlackMutation = useMutation({
    mutationFn: () => apiClient.disconnectSlackIntegration(),
    onSuccess: async () => {
      queryClient.setQueryData(['notifications-slack-integration-status'], (prev: unknown) => {
        if (!prev || typeof prev !== 'object') {
          return prev
        }

        return {
          ...(prev as Record<string, unknown>),
          connected: false,
          teamId: undefined,
          teamName: undefined,
          channelId: undefined,
          channelName: undefined,
          webhookUrlMasked: undefined,
          installedBy: undefined,
          installedAt: undefined,
          updatedAt: new Date().toISOString(),
        }
      })

      await queryClient.invalidateQueries({ queryKey: ['notifications-slack-integration-status'] })
      await integrationQuery.refetch()
    },
    onError: (error) => {
      console.error('Slack 연동 해제 실패:', error)
    },
  })

  const testSlackMutation = useMutation({
    mutationFn: () =>
      apiClient.sendSlackTestMessage({
        text: '[TEST] 알림 연동 테스트',
      }),
  })

  const notifications = notificationsQuery.data ?? []
  const [readMap, setReadMap] = useState<Record<string, boolean>>({})
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const effectiveReadMap = useMemo(() => {
    const next: Record<string, boolean> = {}
    notifications.forEach(item => {
      next[item.id] = readMap[item.id] ?? item.read
    })
    return next
  }, [notifications, readMap])

  const unreadCount = notifications.filter(item => !effectiveReadMap[item.id]).length
  const filteredNotifications = notifications.filter(item => {
    if (filter === 'unread') {
      return !effectiveReadMap[item.id]
    }
    return true
  })

  const isIntegrationConnected = integrationQuery.data?.connected ?? false
  const slackFlowStatus = slackFlowFlash.status
  const slackFlowDetails = slackFlowFlash.details
  const slackFlowErrorMessage =
    slackFlowStatus === 'connect-error' || slackFlowStatus === 'oauth-error'
      ? slackFlowDetails || 'Slack 연동 중 오류가 발생했습니다.'
      : slackFlowStatus === 'missing-code'
      ? 'Slack 승인 코드가 누락되었습니다. 다시 시도해주세요.'
      : slackFlowStatus === 'cancelled'
      ? 'Slack 연동이 취소되었습니다.'
      : null
  const isLoading = notificationsQuery.isLoading || integrationQuery.isLoading
  const isBaseEmpty = notifications.length === 0
  const showIntegrationGuide = !isLoading && filter === 'all' && !isIntegrationConnected
  const showNoDataEmpty = !isLoading && filter === 'all' && isBaseEmpty && isIntegrationConnected
  const slackActionState = (() => {
    if (integrationQuery.isError) {
      return {
        kind: 'alert' as const,
        severity: 'error' as const,
        message: 'Slack 연동 상태를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.',
      }
    }

    if (slackFlowErrorMessage) {
      return {
        kind: 'alert' as const,
        severity: 'error' as const,
        message: slackFlowErrorMessage,
      }
    }

    if (!slackConfigQuery.data?.configured) {
      return {
        kind: 'alert' as const,
        severity: 'warning' as const,
        message: slackConfigQuery.data?.message || 'Slack OAuth 설정이 없어 연동할 수 없습니다.',
      }
    }

    return {
      kind: 'text' as const,
      message: '버튼을 누르면 Slack 권한 승인 화면으로 이동합니다.',
    }
  })()
  const slackHighlights = [
    {
      title: '즉시 전달',
      description: '중요한 알림을 Slack 채널로 바로 받아 빠르게 대응할 수 있습니다.',
    },
    {
      title: '팀 공유',
      description: '개인 알림을 팀의 협업 흐름 안으로 자연스럽게 연결합니다.',
    },
    {
      title: '테스트 가능',
      description: '연동 후 테스트 메시지로 연결 상태를 바로 확인할 수 있습니다.',
    },
  ]
  const slackSteps = [
    'Slack 워크스페이스 권한을 승인합니다.',
    '알림을 받을 채널을 선택합니다.',
    '테스트 메시지로 정상 동작을 확인합니다.',
  ]

  const getSeverityColor = (severity: string) => {
    if (severity === 'critical' || severity === 'error') return 'error.main'
    if (severity === 'warning') return 'warning.main'
    return 'info.main'
  }

  const resolveNotificationRoute = (notification: { route?: string; source?: string }) => {
    if (notification.route) {
      return notification.route
    }

    if (notification.source === 'metrics') return '/metrics'
    if (notification.source === 'logs' || notification.source === 'alerts') return '/logs'
    if (notification.source === 'traces') return '/traces'
    if (notification.source === 'integrations') return '/integrations/slack'
    if (notification.source === 'deploy') return '/dashboards'

    return '/'
  }

  useEffect(() => {
    const status = searchParams.get('slack')
    const details = searchParams.get('details')

    if (!status && !details) {
      return
    }

    setSlackFlowFlash({ status, details })

    const nextParams = new URLSearchParams(searchParams.toString())
    nextParams.delete('slack')
    nextParams.delete('details')
    const nextQuery = nextParams.toString()
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname)
  }, [pathname, router, searchParams])

  useEffect(() => {
    const routes = new Set<string>()
    notifications.forEach(notification => {
      routes.add(resolveNotificationRoute(notification))
    })
    routes.forEach(route => router.prefetch(route))
  }, [notifications, router])

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: { xs: 1.5, sm: 2, md: 3 },
        height: 'auto',
        minHeight: 0,
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ sm: 'center' }}
        gap={1}
      >
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          전체 알림
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            variant={filter === 'all' ? 'contained' : 'outlined'}
            onClick={() => setFilter('all')}
            sx={{ textTransform: 'none', minWidth: 'auto', px: 1.25 }}
          >
            전체 {notifications.length}
          </Button>
          <Button
            size="small"
            color="warning"
            variant={filter === 'unread' ? 'contained' : 'outlined'}
            onClick={() => setFilter('unread')}
            sx={{ textTransform: 'none', minWidth: 'auto', px: 1.25 }}
          >
            미확인 {unreadCount}
          </Button>
        </Stack>
      </Stack>

      <Card
        variant="outlined"
        sx={{
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          height: 'auto',
          overflow: 'visible',
        }}
      >
        <CardContent
          sx={{
            p: 0,
            overflow: 'visible',
            flex: '0 0 auto',
            '&:last-child': { pb: 0 },
          }}
        >
          {isLoading ? (
            <Stack spacing={1} sx={{ p: 2 }}>
              <Skeleton variant="rounded" height={82} />
              <Skeleton variant="rounded" height={82} />
              <Skeleton variant="rounded" height={82} />
            </Stack>
          ) : (
            <>
              {showIntegrationGuide && (
                <Box
                  sx={{
                    width: '100%',
                    p: { xs: 2, sm: 2.75 },
                    position: 'relative',
                    overflow: 'hidden',
                    bgcolor: theme =>
                      theme.palette.mode === 'dark' ? 'rgba(15,23,42,0.45)' : 'rgba(248,250,252,0.9)',
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      background:
                        'radial-gradient(circle at top right, rgba(97, 187, 255, 0.12), transparent 36%), radial-gradient(circle at left center, rgba(88, 101, 242, 0.08), transparent 40%)',
                      pointerEvents: 'none',
                    }}
                  />

                  <Box sx={{ position: 'relative' }}>
                      <Stack spacing={3}>
                        <Stack
                          direction={{ xs: 'column', sm: 'row' }}
                          spacing={2.5}
                          alignItems={{ xs: 'flex-start', sm: 'center' }}
                          justifyContent="space-between"
                        >
                          <Stack direction="row" spacing={1.75} alignItems="center" sx={{ flex: 1 }}>
                            <Box
                              sx={{
                                width: 64,
                                height: 64,
                                borderRadius: 3,
                                display: 'grid',
                                placeItems: 'center',
                                bgcolor: theme =>
                                  theme.palette.mode === 'dark'
                                    ? 'rgba(15,23,42,0.85)'
                                    : 'rgba(255,255,255,0.9)',
                                border: '1px solid',
                                borderColor: 'divider',
                                flexShrink: 0,
                              }}
                            >
                              <Image
                                src="/images/icons/slack.png"
                                alt="Slack"
                                width={34}
                                height={34}
                                style={{ objectFit: 'contain' }}
                              />
                            </Box>

                            <Box sx={{ minWidth: 0 }}>
                              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }}>
                                <Chip label="추천" size="small" color="primary" sx={{ fontWeight: 700 }} />
                                <Chip
                                  label="실시간"
                                  size="small"
                                  variant="outlined"
                                  sx={{ fontWeight: 700 }}
                                />
                              </Stack>

                              <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
                                Slack 연동으로 알림을 더 빠르게
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mt: 1, maxWidth: 520, lineHeight: 1.7 }}
                              >
                                관찰성 이벤트를 Slack 채널로 바로 받아보세요. 로그, 메트릭, 트레이스 관련
                                알림을 팀이 놓치지 않도록 정리해서 전달합니다.
                              </Typography>
                            </Box>
                          </Stack>

                          <Box
                            sx={{
                              minWidth: { xs: '100%', sm: 180 },
                              p: 1.5,
                              borderRadius: 2,
                              border: '1px solid',
                              borderColor: 'divider',
                              bgcolor: theme =>
                                theme.palette.mode === 'dark'
                                  ? 'rgba(148,163,184,0.06)'
                                  : 'rgba(15,23,42,0.03)',
                            }}
                          >
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              연동 상태
                            </Typography>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800, mt: 0.25 }}>
                              아직 연결되지 않음
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                              몇 단계만 거치면 팀 채널로 알림을 받을 수 있습니다.
                            </Typography>
                          </Box>
                        </Stack>

                        <Stack
                          direction={{ xs: 'column', md: 'row' }}
                          spacing={1.5}
                          sx={{
                            '& > *': {
                              flex: 1,
                            },
                          }}
                        >
                          {slackHighlights.map(highlight => (
                            <Box
                              key={highlight.title}
                              sx={{
                                p: 2,
                                borderRadius: 2,
                                border: '1px solid',
                                borderColor: 'divider',
                                bgcolor: theme =>
                                  theme.palette.mode === 'dark'
                                    ? 'rgba(2,6,23,0.45)'
                                    : 'rgba(255,255,255,0.7)',
                              }}
                            >
                              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.5 }}>
                                {highlight.title}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                                {highlight.description}
                              </Typography>
                            </Box>
                          ))}
                        </Stack>

                        <Stack
                          direction={{ xs: 'column', lg: 'row' }}
                          spacing={1.5}
                          alignItems={{ xs: 'stretch', lg: 'flex-start' }}
                        >
                          <Box
                            sx={{
                              flex: 1.2,
                              p: 2.25,
                              borderRadius: 2,
                              border: '1px solid',
                              borderColor: 'divider',
                              bgcolor: theme =>
                                theme.palette.mode === 'dark' ? 'rgba(15,23,42,0.7)' : '#fafafa',
                            }}
                          >
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5 }}>
                              연동 순서
                            </Typography>
                            <Stack spacing={1.25}>
                              {slackSteps.map((step, index) => (
                                <Stack key={step} direction="row" spacing={1.25} alignItems="flex-start">
                                  <Box
                                    sx={{
                                      width: 26,
                                      height: 26,
                                      borderRadius: '50%',
                                      display: 'grid',
                                      placeItems: 'center',
                                      bgcolor: theme =>
                                        theme.palette.mode === 'dark'
                                          ? 'rgba(96,165,250,0.18)'
                                          : 'rgba(37,99,235,0.1)',
                                      color: 'primary.main',
                                      fontSize: '0.8rem',
                                      fontWeight: 800,
                                      flexShrink: 0,
                                      mt: 0.15,
                                    }}
                                  >
                                    {index + 1}
                                  </Box>
                                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                                    {step}
                                  </Typography>
                                </Stack>
                              ))}
                            </Stack>
                          </Box>

                          <Box
                            sx={{
                              flex: 1,
                              p: 2.25,
                              borderRadius: 2,
                              border: '1px solid',
                              borderColor: 'divider',
                              bgcolor: theme =>
                                theme.palette.mode === 'dark' ? 'rgba(2,6,23,0.5)' : '#ffffff',
                            }}
                          >
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.25 }}>
                              시작하기
                            </Typography>

                            <Button
                              variant="contained"
                              size="large"
                              disabled={slackActionState.kind !== 'text'}
                              onClick={() => {
                                window.location.href = '/api/integrations/slack/connect'
                              }}
                              sx={{
                                textTransform: 'none',
                                width: '100%',
                                height: 48,
                                fontWeight: 700,
                                fontSize: '0.98rem',
                                mb: 1.25,
                              }}
                            >
                              Slack 연동하기
                            </Button>

                            {slackActionState.kind === 'text' ? (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                                {slackActionState.message}
                              </Typography>
                            ) : (
                              <Alert severity={slackActionState.severity} variant="outlined" sx={{ mt: 1 }}>
                                {slackActionState.message}
                              </Alert>
                            )}
                          </Box>
                        </Stack>
                      </Stack>
                  </Box>
                </Box>
              )}

              {isIntegrationConnected && !isLoading && filter === 'all' && (
                <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Stack direction="row" spacing={1.25} justifyContent="space-between" alignItems="center">
                    <Stack direction="row" spacing={1.25} alignItems="center">
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          position: 'relative',
                        }}
                      >
                        <Image
                          src="/images/icons/slack.png"
                          alt="Slack"
                          fill
                          sizes="24px"
                          style={{ objectFit: 'contain' }}
                        />
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          Slack 연동됨
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'inline-flex', gap: 0.5, alignItems: 'center' }}>
                          <Box component="span" sx={{ fontWeight: 700, color: 'text.primary' }}>
                            {integrationQuery.data?.teamName || integrationQuery.data?.teamId || '워크스페이스'}
                          </Box>
                          <Box component="span">·</Box>
                          {integrationQuery.data?.teamId && integrationQuery.data?.channelId ? (
                            <MuiLink
                              href={`https://app.slack.com/client/${integrationQuery.data.teamId}/${integrationQuery.data.channelId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              sx={{ textDecoration: 'underline' }}
                            >
                              {integrationQuery.data?.channelName || integrationQuery.data?.channelId}
                            </MuiLink>
                          ) : (
                            integrationQuery.data?.channelName || integrationQuery.data?.channelId || '채널 미설정'
                          )}
                        </Typography>
                      </Box>
                    </Stack>
                    <Stack direction="row" spacing={0.5}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => testSlackMutation.mutate()}
                        disabled={testSlackMutation.isPending}
                        sx={{ textTransform: 'none' }}
                      >
                        {testSlackMutation.isPending ? '전송 중...' : '테스트'}
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => {
                          if (window.confirm('연동을 초기화하고 새로 연동하시겠습니까?')) {
                            disconnectSlackMutation.mutate()
                            setTimeout(() => {
                              window.location.href = '/api/integrations/slack/connect'
                            }, 500)
                          }
                        }}
                        disabled={disconnectSlackMutation.isPending}
                        sx={{ textTransform: 'none' }}
                      >
                        {disconnectSlackMutation.isPending ? '수정 중...' : '채널 수정'}
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        color="error"
                        onClick={() => disconnectSlackMutation.mutate()}
                        disabled={disconnectSlackMutation.isPending}
                        sx={{ textTransform: 'none' }}
                      >
                        {disconnectSlackMutation.isPending ? '해제 중...' : '해제'}
                      </Button>
                    </Stack>
                    {disconnectSlackMutation.isError && (
                      <Alert severity="error" sx={{ mt: 1 }}>
                        {disconnectSlackMutation.error instanceof Error
                          ? disconnectSlackMutation.error.message
                          : 'Slack 연동 해제에 실패했습니다.'}
                      </Alert>
                    )}
                    {disconnectSlackMutation.isSuccess && (
                      <Alert severity="success" sx={{ mt: 1 }}>
                        Slack 연동이 해제되었습니다.
                      </Alert>
                    )}
                  </Stack>
                </Box>
              )}

              {filteredNotifications.length === 0 ? (
                showNoDataEmpty ? (
                  <Box sx={{ p: 2 }}>
                    <NoDataState
                      title="알림 데이터가 없습니다"
                      description="아직 수집된 알림이 없습니다. 알림 이벤트가 발생하면 여기에 표시됩니다."
                    />
                  </Box>
                ) : filter === 'unread' ? (
                  <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                    미확인 알림이 없습니다.
                  </Typography>
                ) : null
              ) : (
                filteredNotifications.map((notification, index) => {
                  const isUnread = !effectiveReadMap[notification.id]
                  const resolvedRoute = resolveNotificationRoute(notification)

                  return (
                    <Box key={notification.id}>
                      <Box
                        component={Link}
                        href={resolvedRoute}
                        sx={{
                          display: 'block',
                          textDecoration: 'none',
                          color: 'inherit',
                          p: 2,
                          bgcolor: isUnread ? 'transparent' : 'action.hover',
                          cursor: 'pointer',
                          '&:hover': {
                            bgcolor: 'action.hover',
                          },
                        }}
                        onClick={() => {
                          setReadMap(prev => ({ ...prev, [notification.id]: true }))
                        }}
                      >
                        <Stack direction="row" spacing={1.25} alignItems="flex-start">
                          <Box
                            sx={{
                              mt: 0.6,
                              width: 9,
                              height: 9,
                              borderRadius: '50%',
                              bgcolor: getSeverityColor(notification.severity),
                              flexShrink: 0,
                            }}
                          />
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Stack
                              direction={{ xs: 'column', sm: 'row' }}
                              justifyContent="space-between"
                              gap={0.5}
                            >
                              <Typography
                                variant="subtitle2"
                                sx={{
                                  fontWeight: isUnread ? 700 : 800,
                                  lineHeight: 1.35,
                                  pr: 1,
                                }}
                              >
                                {notification.title}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ flexShrink: 0 }}
                              >
                                {formatDateTime(notification.timestamp)}
                              </Typography>
                            </Stack>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ display: 'block', mt: 0.5, lineHeight: 1.35 }}
                            >
                              {notification.message}
                            </Typography>
                            <Stack direction="row" spacing={1} sx={{ mt: 1.25 }}>
                              {notification.source ? (
                                <Box
                                  sx={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    px: 1,
                                    py: 0.25,
                                    borderRadius: 999,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    fontSize: '0.75rem',
                                    color: 'text.secondary',
                                    lineHeight: 1.4,
                                  }}
                                >
                                  {notification.source}
                                </Box>
                              ) : null}
                              <Button
                                size="small"
                                variant="text"
                                sx={{ textTransform: 'none', px: 0.5, minWidth: 'auto' }}
                                onClick={event => {
                                  event.preventDefault()
                                  event.stopPropagation()
                                  setReadMap(prev => ({ ...prev, [notification.id]: true }))
                                  router.push(resolvedRoute)
                                }}
                              >
                                이동
                              </Button>
                            </Stack>
                          </Box>
                        </Stack>
                      </Box>
                      {index < filteredNotifications.length - 1 ? <Divider /> : null}
                    </Box>
                  )
                })
              )}
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}
