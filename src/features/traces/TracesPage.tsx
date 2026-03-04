'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Button,
  Checkbox,
  Chip,
  FormControl,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import { apiClient } from '@/lib/apiClient';
import { formatTimestamp } from '@/lib/formatters';

type SortKey = 'recent' | 'duration';

export default function TracesPage() {
  const theme = useTheme();
  const { data: traces = [] } = useQuery({ queryKey: ['traces'], queryFn: apiClient.getTraces });
  const [sortKey, setSortKey] = useState<SortKey>('recent');

  const sortedTraces = useMemo(() => {
    const cloned = [...traces];
    if (sortKey === 'duration') {
      return cloned.sort((a, b) => b.duration - a.duration);
    }
    return cloned.sort((a, b) => b.startTime - a.startTime);
  }, [traces, sortKey]);

  const minStart = useMemo(() => Math.min(...sortedTraces.map((trace) => trace.startTime)), [sortedTraces]);
  const maxStart = useMemo(() => Math.max(...sortedTraces.map((trace) => trace.startTime)), [sortedTraces]);
  const minDuration = useMemo(() => Math.min(...sortedTraces.map((trace) => trace.duration)), [sortedTraces]);
  const maxDuration = useMemo(() => Math.max(...sortedTraces.map((trace) => trace.duration)), [sortedTraces]);

  const handleSortChange = (event: SelectChangeEvent<SortKey>) => {
    setSortKey(event.target.value as SortKey);
  };

  const getStatusColor = (statusCode?: number) => {
    if (!statusCode) return theme.palette.text.secondary;
    if (statusCode >= 500) return theme.palette.error.main;
    if (statusCode >= 400) return theme.palette.warning.main;
    if (statusCode >= 300) return theme.palette.warning.light;
    return theme.palette.success.main;
  };

  if (sortedTraces.length === 0) {
    return (
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Traces
        </Typography>
        <Typography variant="body2" color="text.secondary">
          No traces found.
        </Typography>
      </Box>
    );
  }

  const timeRange = Math.max(maxStart - minStart, 1);
  const durationRange = Math.max(maxDuration - minDuration, 1);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2, md: 3 } }}>
      <Typography variant="h4" sx={{ fontWeight: 700 }}>
        Traces
      </Typography>

      <Paper
        variant="outlined"
        sx={{
          p: { xs: 1.5, md: 2 },
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Box
          sx={{
            position: 'relative',
            height: 220,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            bgcolor: 'background.default',
            overflow: 'hidden',
          }}
        >
          <Typography variant="caption" sx={{ position: 'absolute', left: 8, top: 8, color: 'text.secondary' }}>
            Duration
          </Typography>
          <Typography variant="caption" sx={{ position: 'absolute', right: 8, bottom: 8, color: 'text.secondary' }}>
            Time
          </Typography>
          {sortedTraces.map((trace) => {
            const x = ((trace.startTime - minStart) / timeRange) * 92 + 4;
            const y = 92 - ((trace.duration - minDuration) / durationRange) * 70;
            const size = 6 + ((trace.duration - minDuration) / durationRange) * 18;

            return (
              <Box
                key={`dot-${trace.id}`}
                sx={{
                  position: 'absolute',
                  left: `${x}%`,
                  top: `${y}%`,
                  width: size,
                  height: size,
                  borderRadius: '50%',
                  transform: 'translate(-50%, -50%)',
                  bgcolor: getStatusColor(trace.status_code),
                  opacity: 0.8,
                }}
              />
            );
          })}
        </Box>
      </Paper>

      <Paper variant="outlined" sx={{ borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', md: 'center' }}
          gap={1.5}
          sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}
        >
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {sortedTraces.length} Traces
          </Typography>
          <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
            <Typography variant="body2" color="text.secondary">
              Sort:
            </Typography>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <Select value={sortKey} onChange={handleSortChange}>
                <MenuItem value="recent">Most Recent</MenuItem>
                <MenuItem value="duration">Longest Duration</MenuItem>
              </Select>
            </FormControl>
            <Button variant="outlined" size="small">
              Download Results
            </Button>
            <Button variant="outlined" size="small">
              Deep Dependency Graph
            </Button>
          </Stack>
        </Stack>

        <Box sx={{ p: 2, bgcolor: 'action.hover', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Compare traces by selecting result items
          </Typography>
        </Box>

        <Stack sx={{ p: 1.5 }} gap={1.5}>
          {sortedTraces.map((trace) => {
            const serviceCounts = trace.spans.reduce<Record<string, number>>((accumulator, span) => {
              accumulator[span.service] = (accumulator[span.service] ?? 0) + 1;
              return accumulator;
            }, {});

            const errorCount = trace.spans.filter((span) => span.status === 'error').length;
            const topServices = Object.entries(serviceCounts)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5);

            return (
              <Paper
                key={trace.id}
                component={Link}
                href={`/traces/${trace.id}`}
                variant="outlined"
                sx={{
                  textDecoration: 'none',
                  color: 'inherit',
                  borderColor: 'divider',
                  overflow: 'hidden',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 1, py: 1.5, bgcolor: 'action.hover' }}>
                  <Stack direction="row" alignItems="center" gap={1}>
                    <Checkbox size="small" sx={{ p: 0.5 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {trace.service}: {trace.operation}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {trace.id}
                    </Typography>
                  </Stack>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {trace.duration.toFixed(2)}ms
                  </Typography>
                </Stack>

                <Stack
                  direction={{ xs: 'column', md: 'row' }}
                  justifyContent="space-between"
                  alignItems={{ xs: 'flex-start', md: 'center' }}
                  gap={1}
                  sx={{ px: 1.5, py: 1.5 }}
                >
                  <Stack direction="row" gap={1} flexWrap="wrap" alignItems="center">
                    <Chip size="small" label={`${trace.spans.length} Spans`} variant="outlined" />
                    <Chip
                      size="small"
                      label={`${errorCount} Errors`}
                      color={errorCount > 0 ? 'error' : 'success'}
                      variant={errorCount > 0 ? 'filled' : 'outlined'}
                    />
                    {topServices.map(([service, count]) => (
                      <Chip key={`${trace.id}-${service}`} size="small" label={`${service} (${count})`} variant="outlined" />
                    ))}
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {formatTimestamp(trace.startTime)}
                  </Typography>
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      </Paper>
    </Box>
  );
}
