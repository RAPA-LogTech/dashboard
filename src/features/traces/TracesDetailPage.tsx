'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { apiClient } from '@/lib/apiClient';
import { TraceSpan } from '@/lib/types';

type SpanRow = {
  span: TraceSpan;
  depth: number;
};

const buildSpanRows = (spans: TraceSpan[]): SpanRow[] => {
  const childrenMap = new Map<string, TraceSpan[]>();
  const roots: TraceSpan[] = [];

  for (const span of spans) {
    if (!span.parentSpanId) {
      roots.push(span);
      continue;
    }

    const siblings = childrenMap.get(span.parentSpanId) ?? [];
    siblings.push(span);
    childrenMap.set(span.parentSpanId, siblings);
  }

  const rows: SpanRow[] = [];

  const dfs = (current: TraceSpan, depth: number) => {
    rows.push({ span: current, depth });

    const children = (childrenMap.get(current.id) ?? []).sort((a, b) => a.startTime - b.startTime);
    for (const child of children) {
      dfs(child, depth + 1);
    }
  };

  const sortedRoots = [...roots].sort((a, b) => a.startTime - b.startTime);
  for (const root of sortedRoots) {
    dfs(root, 0);
  }

  return rows;
};

export default function TracesDetailPage({ traceId }: { traceId: string }) {
  const theme = useTheme();
  const [showRelatedLogs, setShowRelatedLogs] = useState(false);
  const { data: traces = [], isLoading } = useQuery({
    queryKey: ['traces'],
    queryFn: apiClient.getTraces,
  });

  const trace = useMemo(() => traces.find((item) => item.id === traceId), [traces, traceId]);

  const rows = useMemo(() => {
    if (!trace) return [];
    return buildSpanRows(trace.spans);
  }, [trace]);

  const minStart = useMemo(() => {
    if (!trace) return 0;
    return Math.min(...trace.spans.map((span) => span.startTime));
  }, [trace]);

  const maxEnd = useMemo(() => {
    if (!trace) return 0;
    return Math.max(...trace.spans.map((span) => span.startTime + span.duration));
  }, [trace]);

  const totalDuration = useMemo(() => {
    if (!trace) return 1;
    return Math.max(maxEnd - minStart, trace.duration, 1);
  }, [maxEnd, minStart, trace]);

  const scaleStops = useMemo(() => [0, 0.25, 0.5, 0.75, 1], []);

  const relatedLogs = useMemo(() => {
    if (!trace) return [];

    return trace.spans
      .flatMap((span) =>
        (span.logs ?? []).map((log, index) => ({
          id: `${span.id}-${index}`,
          spanId: span.id,
          service: span.service,
          operation: span.operation,
          timestamp: log.timestamp,
          relativeMs: Math.max(log.timestamp - trace.startTime, 0),
          fields: log.fields,
        }))
      )
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [trace]);

  if (isLoading) {
    return <Typography color="text.secondary">Loading trace...</Typography>;
  }

  if (!trace) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Button component={Link} href="/traces" startIcon={<ArrowBackIcon />} sx={{ width: 'fit-content' }}>
          Back to Traces
        </Button>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Trace not found
        </Typography>
      </Box>
    );
  }

  const errorCount = trace.spans.filter((span) => span.status === 'error').length;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1} flexWrap="wrap">
        <Button component={Link} href="/traces" startIcon={<ArrowBackIcon />} size="small">
          Back
        </Button>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {trace.service}: {trace.operation}
        </Typography>
      </Stack>

      <Paper variant="outlined" sx={{ p: 2, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} gap={1.5} flexWrap="wrap">
          <Chip label={`Trace Start ${new Date(trace.startTime).toLocaleString()}`} variant="outlined" />
          <Chip label={`Duration ${trace.duration.toFixed(2)}ms`} color="primary" />
          <Chip label={`Services ${new Set(trace.spans.map((span) => span.service)).size}`} variant="outlined" />
          <Chip label={`Depth ${Math.max(...rows.map((row) => row.depth), 0) + 1}`} variant="outlined" />
          <Chip label={`Total Spans ${trace.spans.length}`} variant="outlined" />
          <Chip label={`Errors ${errorCount}`} color={errorCount > 0 ? 'error' : 'success'} variant={errorCount > 0 ? 'filled' : 'outlined'} />
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ borderColor: 'divider', bgcolor: 'background.paper', overflow: 'hidden' }}>
        <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Trace Timeline
            </Typography>
            <Button
              size="small"
              variant={showRelatedLogs ? 'contained' : 'outlined'}
              onClick={() => setShowRelatedLogs((prev) => !prev)}
              sx={{ textTransform: 'none' }}
            >
              {showRelatedLogs ? 'Hide Related Logs' : 'Show Related Logs'}
            </Button>
          </Stack>
        </Box>

        <Box sx={{ position: 'relative', px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ position: 'relative', height: 28, borderTop: '2px solid', borderColor: 'divider' }}>
            {scaleStops.map((stop) => (
              <Box key={stop} sx={{ position: 'absolute', left: `${stop * 100}%`, top: -8, transform: 'translateX(-50%)' }}>
                <Typography variant="caption" color="text.secondary">
                  {(totalDuration * stop).toFixed(2)}ms
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        <Box sx={{ maxHeight: '65vh', overflowY: 'auto' }}>
          {rows.map(({ span, depth }) => {
            const startOffset = ((span.startTime - minStart) / totalDuration) * 100;
            const widthPct = Math.max((span.duration / totalDuration) * 100, 0.8);
            const barColor =
              span.status === 'error'
                ? theme.palette.error.main
                : span.status === 'slow'
                  ? theme.palette.warning.main
                  : theme.palette.success.main;

            return (
              <Box
                key={span.id}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: '360px 1fr' },
                  gap: 1,
                  alignItems: 'center',
                  px: 2,
                  py: 1.2,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Stack direction="row" alignItems="center" sx={{ pl: `${depth * 16}px` }} gap={1}>
                  <Box sx={{ width: 3, height: 16, bgcolor: barColor, borderRadius: 1 }} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {span.service}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {span.operation}
                  </Typography>
                </Stack>

                <Box sx={{ position: 'relative', height: 20, borderLeft: '1px solid', borderColor: 'divider' }}>
                  <Box
                    sx={{
                      position: 'absolute',
                      left: `${startOffset}%`,
                      width: `${Math.min(widthPct, 100 - startOffset)}%`,
                      minWidth: 6,
                      height: 14,
                      top: 3,
                      borderRadius: 0.75,
                      bgcolor: barColor,
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      position: 'absolute',
                      left: `${Math.min(startOffset + widthPct + 0.6, 96)}%`,
                      top: 1,
                      color: 'text.secondary',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {span.duration.toFixed(2)}ms
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>

        {showRelatedLogs && (
          <Box sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ px: 2, py: 1.25, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'action.hover' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Related Logs ({relatedLogs.length})
              </Typography>
            </Box>

            <Box sx={{ maxHeight: 260, overflowY: 'auto' }}>
              {relatedLogs.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 2 }}>
                  No logs available for this trace.
                </Typography>
              ) : (
                relatedLogs.map((log) => {
                  const summary = Object.entries(log.fields)
                    .slice(0, 6)
                    .map(([key, value]) => `${key}=${String(value)}`)
                    .join('  ·  ');

                  return (
                    <Box
                      key={log.id}
                      sx={{
                        px: 2,
                        py: 1,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={0.5}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {log.relativeMs.toFixed(2)}ms
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {log.service} · {log.operation} · {log.spanId}
                        </Typography>
                      </Stack>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, wordBreak: 'break-word' }}>
                        {summary}
                      </Typography>
                    </Box>
                  );
                })
              )}
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
