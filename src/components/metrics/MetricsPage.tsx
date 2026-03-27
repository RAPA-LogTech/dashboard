'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Paper,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  Typography,
  useTheme,
} from '@mui/material'
import { Area, AreaChart, Line, LineChart, ResponsiveContainer, Tooltip, YAxis } from 'recharts'
import type { MetricSeries } from '@/lib/types'
import { apiClient } from '@/lib/apiClient'
import NoDataState from '@/components/common/NoDataState'
import LiveButton from '@/components/logs/LogFilters/LiveButton'

type MetricStreamPayload = {
  cursor: number
  ts: number
  points: Array<{ id: string; ts: number; value: number }>
}

const EMPTY_METRICS: MetricSeries[] = []

const getSeriesLast = (series?: MetricSeries) =>
  series ? (series.points[series.points.length - 1]?.value ?? 0) : 0

const getSeriesAvg = (series?: MetricSeries) => {
  if (!series || series.points.length === 0) return 0
  return series.points.reduce((s, p) => s + p.value, 0) / series.points.length
}

function StatusBadge({ value }: { value: number }) {
  const isWarn = value > 1
  return (
    <Chip
      label={isWarn ? '주의' : '정상'}
      size="small"
      color={isWarn ? 'warning' : 'success'}
      variant="outlined"
      sx={{ height: 20, fontSize: 11, fontWeight: 700, borderRadius: 1, px: 0.25 }}
    />
  )
}

function EnvBadge({ env }: { env?: string }) {
  if (!env) return null
  const isProd = env === 'prod'
  return (
    <Chip
      label={env.toUpperCase()}
      size="small"
      color={isProd ? 'info' : 'secondary'}
      variant="outlined"
      sx={{ height: 18, fontSize: 10, fontWeight: 700, borderRadius: 0.75, px: 0.25 }}
    />
  )
}

const FIVE_MIN_MS = 5 * 60 * 1000

function sliceLast5Min(points: MetricSeries['points']) {
  if (points.length === 0) return points
  const cutoff = points[points.length - 1].ts - FIVE_MIN_MS
  const idx = points.findIndex(p => p.ts >= cutoff)
  return idx === -1 ? points : points.slice(idx)
}

function MiniSparkline({ series, color }: { series: MetricSeries; color: string }) {
  const points = sliceLast5Min(series.points)
  if (points.length === 0) return <Box sx={{ height: 48 }} />
  const values = points.map(p => p.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const spread = Math.max(1, max - min)
  const data = points.map((p, i) => ({ i, v: p.value }))
  return (
    <Box sx={{ height: 48, width: '100%', mt: 1 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`sg-${series.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.35} />
              <stop offset="95%" stopColor={color} stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <YAxis hide domain={[Math.max(0, min - spread * 0.1), max + spread * 0.1]} />
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            fill={`url(#sg-${series.id})`}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  const theme = useTheme()
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
      <Box sx={{ width: 3, height: 16, bgcolor: 'primary.main', borderRadius: 1 }} />
      <Typography
        variant="caption"
        sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: 1 }}
      >
        {children}
      </Typography>
    </Box>
  )
}

function ServiceHealthCard({
  service,
  envs,
  errorRate,
}: {
  service: string
  envs: string[]
  errorRate: number
}) {
  return (
    <Paper
      variant="outlined"
      sx={{ p: 2, borderColor: 'divider', bgcolor: 'background.paper', borderRadius: 1 }}
    >
      <Stack direction="row" spacing={0.75} alignItems="center" mb={0.5} flexWrap="wrap">
        <Typography
          variant="caption"
          sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: 1 }}
        >
          {service.toUpperCase()}
        </Typography>
        {envs.map(env => (
          <EnvBadge key={env} env={env} />
        ))}
      </Stack>
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {errorRate.toFixed(1)}%
        </Typography>
        <StatusBadge value={errorRate} />
      </Stack>
      <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.25, display: 'block' }}>
        HTTP error ratio (5m)
      </Typography>
    </Paper>
  )
}

function MetricBigCard({
  series,
  label,
  sublabel,
  color,
}: {
  series?: MetricSeries
  label: string
  sublabel: string
  color: string
}) {
  const value = getSeriesLast(series)
  const unit = series?.unit ?? ''

  const formatted = (() => {
    if (unit === 'req/s')
      return `${value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value.toFixed(0)} req/5m`
    if (unit === '%') return `${value.toFixed(0)} err/5m`
    if (unit === 'ms') return `${value.toFixed(0)} ms`
    return value.toFixed(1)
  })()

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        borderRadius: 1,
        height: '100%',
      }}
    >
      <Typography
        variant="caption"
        sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: 1, display: 'block' }}
      >
        {label}
      </Typography>
      <Typography variant="h3" sx={{ fontWeight: 700, mt: 0.5 }}>
        {formatted}
      </Typography>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        {sublabel}
      </Typography>
      {series && <MiniSparkline series={series} color={color} />}
    </Paper>
  )
}

export default function MetricsPage() {
  const theme = useTheme()
  const [tab, setTab] = useState(0)
  const [envFilter, setEnvFilter] = useState<'all' | 'dev' | 'prod'>('all')

  const { data: serviceList = [] } = useQuery({
    queryKey: ['metric-services'],
    queryFn: apiClient.getMetricServices,
    staleTime: 60_000,
  })

  const { data: serviceHealth = [] } = useQuery({
    queryKey: ['metric-health'],
    queryFn: apiClient.getMetricHealth,
    staleTime: 30_000,
    refetchInterval: 30_000,
    placeholderData: (prev) => prev,
  })

  const tabs = ['Overview', ...(serviceList?.length ? serviceList : [])]

  const {
    data: metricsData,
    isLoading,
    isFetched,
  } = useQuery({
    queryKey: ['metrics'],
    queryFn: apiClient.getMetrics,
  })
  const metrics = metricsData ?? EMPTY_METRICS

  const [liveMetrics, setLiveMetrics] = useState<MetricSeries[]>([])
  const [isLiveEnabled, setIsLiveEnabled] = useState(true)
  const [streamStatus, setStreamStatus] = useState<
    'connecting' | 'live' | 'reconnecting' | 'offline'
  >('connecting')
  const lastCursorRef = useRef(0)

  useEffect(() => {
    if (metrics.length > 0) setLiveMetrics(prev => (prev.length === 0 ? metrics : prev))
  }, [metrics, isLiveEnabled])

  useEffect(() => {
    if (!isLiveEnabled) {
      setStreamStatus('offline')
      return
    }

    const MAX_POINTS = 120
    let es: EventSource | null = null
    let timer: ReturnType<typeof setTimeout> | null = null
    let unmounted = false
    let retry = 0

    const apply = (payload: MetricStreamPayload) => {
      const map = new Map(payload.points.map(p => [p.id, p]))
      setLiveMetrics(prev =>
        prev.map(s => {
          const next = map.get(s.id)
          if (!next) return s
          const pts = [...s.points, { ts: next.ts, value: next.value }]
          return {
            ...s,
            points: pts.length > MAX_POINTS ? pts.slice(pts.length - MAX_POINTS) : pts,
          }
        })
      )
      lastCursorRef.current = Math.max(lastCursorRef.current, payload.cursor ?? 0)
    }

    const fetchBacklog = async () => {
      let cursor = lastCursorRef.current
      for (let i = 0; i < 10; i++) {
        try {
          const res = await fetch(`/api/metrics/backlog?cursor=${cursor}&limit=200`)
          if (!res.ok) return
          const data = (await res.json()) as {
            events?: MetricStreamPayload[]
            nextCursor?: number
            hasMore?: boolean
            latestCursor?: number
          }
          ;(data.events ?? []).forEach(apply)
          cursor = Math.max(cursor, data.nextCursor ?? cursor)
          lastCursorRef.current = Math.max(lastCursorRef.current, data.latestCursor ?? cursor)
          if (!data.hasMore) break
        } catch {
          break
        }
      }
    }

    const connect = async () => {
      if (unmounted) return
      setStreamStatus(retry === 0 ? 'connecting' : 'reconnecting')
      await fetchBacklog()
      if (unmounted) return
      es = new EventSource('/api/metrics/stream')
      es.onopen = () => {
        retry = 0
        setStreamStatus('live')
      }
      es.addEventListener('metric', e => {
        try {
          apply(JSON.parse((e as MessageEvent<string>).data))
        } catch {}
      })
      es.onerror = () => {
        es?.close()
        es = null
        if (unmounted) return
        setStreamStatus('reconnecting')
        retry++
        timer = setTimeout(connect, Math.min(5000, 1000 * 2 ** Math.min(retry, 3)))
      }
    }

    connect()
    return () => {
      unmounted = true
      setStreamStatus('offline')
      if (timer) clearTimeout(timer)
      es?.close()
    }
  }, [isLiveEnabled])

  const metricSeries = useMemo(
    () => (liveMetrics.length > 0 ? liveMetrics : metrics),
    [liveMetrics, metrics]
  )

  const selectedService = tab === 0 ? null : tabs[tab]

  const filterByEnv = (s: MetricSeries) => {
    if (envFilter === 'all') return true
    const env = (s as MetricSeries & { env?: string }).env
    if (!env) return false
    return env === envFilter
  }

  const errorSeries = metricSeries.filter(
    s => s.name.includes('error_rate') && !s.name.includes('4xx') && !s.name.includes('5xx') && (!selectedService || s.service === selectedService) && filterByEnv(s)
  )
  const error4xxSeries = metricSeries.filter(
    s => s.name.includes('4xx_ratio') && (!selectedService || s.service === selectedService) && filterByEnv(s)
  )
  const error5xxSeries = metricSeries.filter(
    s => s.name.includes('5xx_ratio') && (!selectedService || s.service === selectedService) && filterByEnv(s)
  )
  const requestSeries = metricSeries.filter(
    s => s.name.includes('request_rate') && (!selectedService || s.service === selectedService) && filterByEnv(s)
  )
  const latencySeries = metricSeries.filter(
    s => s.name.includes('latency_p95') && (!selectedService || s.service === selectedService) && filterByEnv(s)
  )
  const cpuSeries = metricSeries.filter(
    s => s.name.includes('cpu_usage') && (!selectedService || s.service === selectedService) && filterByEnv(s)
  )
  const memorySeries = metricSeries.filter(
    s => s.name.includes('memory_usage') && (!selectedService || s.service === selectedService) && filterByEnv(s)
  )
  const rdsSeries = metricSeries.filter(
    s => (s.name.includes('rds') || s.name.includes('db_connections') || s.name.includes('DatabaseConnections') || s.name.includes('CPUUtilization')) && filterByEnv(s)
  )

  // Route별 레이턴시: latency_p95 시리즈 중 route/http_route 속성 있는 것
  type RouteRow = { service: string; env: string; route: string; value: number }
  const routeRows: RouteRow[] = metricSeries
    .filter(s => s.name.includes('latency_p95') && (!selectedService || s.service === selectedService))
    .flatMap(s => {
      const ext = s as MetricSeries & { env?: string; route?: string; http_route?: string }
      const route = ext.route ?? ext.http_route
      if (!route) return []
      const env = ext.env ?? 'unknown'
      if (envFilter !== 'all' && env !== envFilter) return []
      return [{ service: s.service ?? '', env, route, value: getSeriesLast(s) }]
    })

  // 서비스별 route 그룹
  const routeByService = routeRows.reduce<Record<string, RouteRow[]>>((acc, r) => {
    if (!acc[r.service]) acc[r.service] = []
    acc[r.service].push(r)
    return acc
  }, {})

  const services =
    serviceList.length > 0
      ? serviceList
      : ([...new Set(metricSeries.map(s => s.service).filter(Boolean))] as string[])

  const sumSeries = (list: MetricSeries[], id: string, unit: string): MetricSeries | undefined => {
    if (list.length === 0) return undefined
    const len = Math.max(...list.map(s => s.points.length))
    const points = Array.from({ length: len }, (_, i) => ({
      ts: list[0].points[i]?.ts ?? 0,
      value: list.reduce((sum, s) => sum + (s.points[i]?.value ?? 0), 0),
    }))
    return { id, name: id, unit, points }
  }

  const reqSum = sumSeries(requestSeries, 'total_request_rate', 'req/s')
  const errSum = sumSeries(errorSeries, 'total_error_rate', '%')
  const latMax = latencySeries[0]
  void reqSum
  void errSum
  void latMax

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2, md: 3 } }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h4" sx={{ fontWeight: 700 }}>Metrics</Typography>
          <Skeleton variant="rounded" width={80} height={28} />
        </Stack>
        {/* Tabs skeleton */}
        <Stack direction="row" gap={0.75}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" width={80} height={36} />
          ))}
        </Stack>
        {/* Service Health skeleton */}
        <Paper variant="outlined" sx={{ p: 2, borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <Skeleton variant="rounded" width={3} height={16} />
            <Skeleton variant="text" width={100} height={16} />
          </Box>
          <Grid container spacing={1.5}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Grid item xs={12} sm={6} md={3} key={i}>
                <Paper variant="outlined" sx={{ p: 2, borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', gap: 0.75, mb: 0.5 }}>
                    <Skeleton variant="text" width={80} height={16} />
                    <Skeleton variant="rounded" width={36} height={18} />
                    <Skeleton variant="rounded" width={36} height={18} />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Skeleton variant="text" width={70} height={40} />
                    <Skeleton variant="rounded" width={40} height={20} />
                  </Box>
                  <Skeleton variant="text" width="80%" height={14} />
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Paper>
        {/* Request Rate / Latency skeleton */}
        <Paper variant="outlined" sx={{ p: 2, borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <Skeleton variant="rounded" width={3} height={16} />
            <Skeleton variant="text" width={160} height={16} />
          </Box>
          <Stack direction="row" spacing={1.5}>
            {Array.from({ length: 3 }).map((_, i) => (
              <Paper key={i} variant="outlined" sx={{ p: 2, borderColor: 'divider', minWidth: 220 }}>
                <Skeleton variant="text" width="70%" height={14} sx={{ mb: 0.5 }} />
                <Skeleton variant="text" width="50%" height={44} />
                <Skeleton variant="text" width="60%" height={14} />
                <Skeleton variant="rounded" height={48} sx={{ mt: 1 }} />
              </Paper>
            ))}
          </Stack>
        </Paper>
        {/* Infrastructure Summary skeleton */}
        <Paper variant="outlined" sx={{ p: 2, borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <Skeleton variant="rounded" width={3} height={16} />
            <Skeleton variant="text" width={160} height={16} />
          </Box>
          <Stack direction="row" spacing={1.5}>
            {Array.from({ length: 2 }).map((_, i) => (
              <Paper key={i} variant="outlined" sx={{ p: 2, borderColor: 'divider', minWidth: 220 }}>
                <Skeleton variant="text" width="70%" height={14} sx={{ mb: 0.5 }} />
                <Skeleton variant="text" width="50%" height={44} />
                <Skeleton variant="text" width="80%" height={14} />
                <Skeleton variant="rounded" height={48} sx={{ mt: 1 }} />
              </Paper>
            ))}
          </Stack>
        </Paper>
      </Box>
    )
  }
  if (isFetched && metricSeries.length === 0) {
    return (
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Metrics
        </Typography>
        <NoDataState title="No metrics data" description="No metrics data found." />
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2, md: 3 } }}>
      {/* 헤더 */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1.5}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Metrics
          </Typography>
        </Box>
        <Stack direction="row" gap={1} alignItems="center">
          {/* DEV / PROD 환경 필터 */}
          <Stack direction="row" gap={0.5}>
            {(['all', 'dev', 'prod'] as const).map(e => (
              <Chip
                key={e}
                label={e === 'all' ? 'ALL' : e.toUpperCase()}
                size="small"
                onClick={() => setEnvFilter(e)}
                color={envFilter === e ? (e === 'prod' ? 'info' : e === 'dev' ? 'secondary' : 'default') : 'default'}
                variant={envFilter === e ? 'filled' : 'outlined'}
                sx={{ fontWeight: 700, fontSize: 11, cursor: 'pointer' }}
              />
            ))}
          </Stack>
          <LiveButton
            value={isLiveEnabled}
            onChange={setIsLiveEnabled}
            isStreaming={streamStatus === 'live'}
          />
        </Stack>
      </Stack>

      {/* 탭 */}
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          minHeight: 36,
          '& .MuiTab-root': {
            minHeight: 36,
            py: 0.5,
            px: 2,
            fontSize: 13,
            fontWeight: 600,
            color: 'text.secondary',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            mr: 0.75,
            '&.Mui-selected': {
              color: 'text.primary',
              bgcolor: 'action.selected',
            },
          },
          '& .MuiTabs-indicator': { display: 'none' },
        }}
      >
        {tabs.map(t => (
          <Tab key={t} label={t} disableRipple />
        ))}
      </Tabs>

      {tab === 0 && (
        <Paper
          variant="outlined"
          sx={{ p: 2, borderColor: 'divider', bgcolor: 'background.paper' }}
        >
          <SectionLabel>Service Health</SectionLabel>
          {serviceHealth.length === 0 ? (
            <NoDataState title="No service health data" description="No data available for the selected environment." />
          ) : (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
              {serviceHealth
                .filter(h => (envFilter === 'all' || h.env === envFilter) && h.rds_cpu === undefined)
                .map(h => {
                  const s4xx = error4xxSeries.find(s => s.service === h.service)
                  const s5xx = error5xxSeries.find(s => s.service === h.service)
                  return (
                    <Box key={`${h.service}-${h.env}`} sx={{ flex: '1 1 220px', minWidth: 0, maxWidth: 300 }}>
                      <Paper variant="outlined" sx={{ p: 2, borderColor: 'divider', bgcolor: 'background.paper', borderRadius: 1, height: '100%' }}>
                        <Stack direction="row" spacing={0.75} alignItems="center" mb={0.5} sx={{ overflow: 'hidden' }}>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>
                            {h.service.toUpperCase()}
                          </Typography>
                          <EnvBadge env={h.env} />
                        </Stack>
                        {h.rds_cpu === undefined && (
                          <>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Typography variant="h4" sx={{ fontWeight: 700 }}>{h.error_rate.toFixed(1)}%</Typography>
                              <StatusBadge value={h.error_rate} />
                            </Stack>
                            <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.25, display: 'block' }}>HTTP error ratio (5m)</Typography>
                            {(s4xx || s5xx) && (
                              <>
                                <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                                  <Typography variant="caption" sx={{ fontWeight: 700, color: theme.palette.warning.main }}>
                                    4xx: {getSeriesLast(s4xx).toFixed(1)}%
                                  </Typography>
                                  <Typography variant="caption" sx={{ fontWeight: 700, color: theme.palette.error.main }}>
                                    5xx: {getSeriesLast(s5xx).toFixed(1)}%
                                  </Typography>
                                </Stack>
                                <Box sx={{ height: 56, mt: 0.75 }}>
                                  <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={(() => {
                                      const p4 = sliceLast5Min(s4xx?.points ?? [])
                                      const p5 = sliceLast5Min(s5xx?.points ?? [])
                                      const len = Math.max(p4.length, p5.length)
                                      return Array.from({ length: len }, (_, i) => ({
                                        i,
                                        v4xx: p4[i]?.value ?? null,
                                        v5xx: p5[i]?.value ?? null,
                                      }))
                                    })()} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                                      <YAxis hide domain={[0, 'auto']} />
                                      <Line type="monotone" dataKey="v4xx" name="4xx" stroke={theme.palette.warning.main} strokeWidth={1.5} dot={false} isAnimationActive={false} connectNulls />
                                      <Line type="monotone" dataKey="v5xx" name="5xx" stroke={theme.palette.error.main} strokeWidth={1.5} dot={false} isAnimationActive={false} connectNulls />
                                    </LineChart>
                                  </ResponsiveContainer>
                                </Box>
                              </>
                            )}
                          </>
                        )}
                      </Paper>
                    </Box>
                  )
                })}
            </Box>
          )}
        </Paper>
      )}

      {/* Route별 레이턴시 테이블 */}
      {Object.keys(routeByService).length > 0 && (
        <Paper variant="outlined" sx={{ p: 2, borderColor: 'divider', bgcolor: 'background.paper' }}>
          <SectionLabel>Latency by Route (p95)</SectionLabel>
          <Box sx={{ overflowX: 'auto' }}>
            <Stack direction="row" spacing={2} sx={{ minWidth: 'min-content' }}>
              {Object.entries(routeByService).map(([svc, rows]) => (
                <Box key={svc} sx={{ minWidth: 240 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: 0.5, display: 'block', mb: 1 }}>
                    {svc.toUpperCase()}
                  </Typography>
                  <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '80px 1fr 60px', px: 1.5, py: 0.75, bgcolor: 'action.hover', borderBottom: '1px solid', borderColor: 'divider' }}>
                      {['환경', 'http_route', 'p95'].map(h => (
                        <Typography key={h} variant="caption" sx={{ fontWeight: 700 }}>{h}</Typography>
                      ))}
                    </Box>
                    {rows.map((r, i) => (
                      <Box key={i} sx={{ display: 'grid', gridTemplateColumns: '80px 1fr 60px', px: 1.5, py: 0.75, borderBottom: i < rows.length - 1 ? '1px solid' : 'none', borderColor: 'divider' }}>
                        <Typography variant="caption" sx={{ color: r.env === 'prod' ? 'info.main' : 'secondary.main', fontWeight: 600 }}>{r.env}</Typography>
                        <Typography variant="caption" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>{r.route}</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>{r.value.toFixed(0)}ms</Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              ))}
            </Stack>
          </Box>
        </Paper>
      )}

      {/* Latency p95 */}
      {latencySeries.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2, borderColor: 'divider', bgcolor: 'background.paper' }}>
          <SectionLabel>Latency p95</SectionLabel>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
            {[...new Set(latencySeries.map(s => s.service).filter(Boolean))].map(svc => {
              const s = latencySeries.find(l => l.service === svc)
              const val = getSeriesLast(s)
              return (
                <Box key={svc} sx={{ flex: '1 1 220px', minWidth: 0, maxWidth: 300 }}>
                  <Paper variant="outlined" sx={{ p: 2, borderColor: 'divider', bgcolor: 'background.paper', borderRadius: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: 1, display: 'block', mb: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {(svc as string).toUpperCase()}
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.warning.main }}>{val.toFixed(0)}ms</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>p95 latency</Typography>
                    {s && <MiniSparkline series={{ ...s, points: sliceLast5Min(s.points) }} color={theme.palette.warning.main} />}
                  </Paper>
                </Box>
              )
            })}
          </Box>
        </Paper>
      )}

      {/* 인프라 요약 */}
      <Paper variant="outlined" sx={{ p: 2, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <SectionLabel>Infrastructure Summary</SectionLabel>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
          {[...new Set([...cpuSeries, ...memorySeries].map(s => s.service).filter(Boolean))].map(svc => {
            const cpu = cpuSeries.find(s => s.service === svc)
            const mem = memorySeries.find(s => s.service === svc)
            const cpuVal = getSeriesLast(cpu)
            const memVal = getSeriesLast(mem)
            return (
              <Box key={svc} sx={{ flex: '1 1 220px', minWidth: 0, maxWidth: 300 }}>
                <Paper variant="outlined" sx={{ p: 2, borderColor: 'divider', bgcolor: 'background.paper', borderRadius: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: 1, display: 'block', mb: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {(svc as string).toUpperCase()}
                  </Typography>
                  <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.success.main }}>{cpuVal.toFixed(2)}%</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>CPU avg</Typography>
                      {cpu && <MiniSparkline series={{ ...cpu, points: sliceLast5Min(cpu.points) }} color={theme.palette.success.main} />}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.secondary.main }}>{memVal.toFixed(2)}%</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>MEM avg</Typography>
                      {mem && <MiniSparkline series={{ ...mem, points: sliceLast5Min(mem.points) }} color={theme.palette.secondary.main} />}
                    </Box>
                  </Stack>
                </Paper>
              </Box>
            )
          })}
          {serviceHealth.filter(h => h.rds_cpu !== undefined).map(h => (
            <Box key="rds" sx={{ flex: '1 1 220px', minWidth: 0, maxWidth: 300 }}>
              <Paper variant="outlined" sx={{ p: 2, borderColor: 'divider', bgcolor: 'background.paper', borderRadius: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: 1, display: 'block', mb: 1 }}>
                  RDS
                </Typography>
                <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.success.main }}>{(h.rds_cpu as number).toFixed(1)}%</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>CPU</Typography>
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.info.main }}>{(h.rds_connections as number ?? 0).toFixed(0)}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Connections</Typography>
                  </Box>
                </Stack>
              </Paper>
            </Box>
          ))}
        </Box>
      </Paper>
    </Box>
  )
}
