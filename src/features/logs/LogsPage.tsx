'use client';

import { UIEvent, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Button,
  Chip,
  Divider,
  FormControl,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Drawer,
  Typography,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { apiClient } from '@/lib/apiClient';
import { formatTimestamp } from '@/lib/formatters';
import LogsTable from '@/components/tables/LogsTable';
import { LogEntry } from '@/lib/types';

export default function LogsPage() {
  const PAGE_SIZE = 60;
  const { data: logs = [], refetch } = useQuery({ queryKey: ['logs'], queryFn: apiClient.getLogs });
  const [query, setQuery] = useState('error');
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [activeTab, setActiveTab] = useState<'logs' | 'patterns' | 'exceptions'>('logs');
  const [isLuceneMode, setIsLuceneMode] = useState(true);
  const [timeRange, setTimeRange] = useState<'15m' | '1h' | '6h' | '24h' | 'all'>('15m');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [fieldSearch, setFieldSearch] = useState('');
  const [hoveredBucketKey, setHoveredBucketKey] = useState<number | null>(null);
  const [selectedBucketKey, setSelectedBucketKey] = useState<number | null>(null);

  const getFieldValue = (log: LogEntry, field: string) => {
    const normalizedField = field.toLowerCase();
    const metadata = log.metadata ?? {};
    const tags = log.tags ?? {};

    if (normalizedField === 'service') return log.service;
    if (normalizedField === 'message') return log.message;
    if (normalizedField === 'level') return log.level;
    if (normalizedField === 'env') return log.env;
    if (normalizedField === 'traceid') return metadata.traceId;
    if (normalizedField === 'requestid') return metadata.requestId;
    if (normalizedField.startsWith('tag.')) return tags[normalizedField.replace('tag.', '')];

    const metadataEntry = Object.entries(metadata).find(([key]) => key.toLowerCase() === normalizedField);
    if (metadataEntry) return metadataEntry[1];

    return undefined;
  };

  const luceneMatch = (log: LogEntry, rawQuery: string) => {
    const tokens = rawQuery.match(/(?:[^\s"]+|"[^"]*")+/g) ?? [];
    if (tokens.length === 0) return true;

    return tokens.every((token) => {
      const cleanedToken = token.replace(/^"|"$/g, '');
      const separatorIndex = cleanedToken.indexOf(':');

      if (separatorIndex > 0) {
        const field = cleanedToken.slice(0, separatorIndex);
        const expectedRaw = cleanedToken.slice(separatorIndex + 1);
        const expected = expectedRaw.replace(/^"|"$/g, '').toLowerCase();
        const actual = String(getFieldValue(log, field) ?? '').toLowerCase();
        return actual.includes(expected);
      }

      const searchable = `${log.service} ${log.env} ${log.level} ${log.message} ${JSON.stringify(log.metadata ?? {})}`.toLowerCase();
      return searchable.includes(cleanedToken.toLowerCase());
    });
  };

  const baseFiltered = useMemo(() => {
    const sortedByTime = [...logs].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    if (sortedByTime.length === 0) return [];

    const latestTs = new Date(sortedByTime[0].timestamp).getTime();
    const rangeMsMap: Record<typeof timeRange, number> = {
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      all: Number.MAX_SAFE_INTEGER,
    };

    const cutoff = latestTs - rangeMsMap[timeRange];

    const byTime = sortedByTime.filter((log) => {
      if (timeRange === 'all') return true;
      return new Date(log.timestamp).getTime() >= cutoff;
    });

    const byQuery = byTime.filter((log) => {
      if (!query.trim()) return true;

      if (isLuceneMode) {
        return luceneMatch(log, query);
      }

      return `${log.service} ${log.message} ${log.level} ${JSON.stringify(log.metadata ?? {})}`
        .toLowerCase()
        .includes(query.toLowerCase());
    });

    return activeTab === 'exceptions'
      ? byQuery.filter((log) => log.level === 'ERROR')
      : byQuery;
  }, [logs, query, isLuceneMode, timeRange, activeTab]);

  const appendFieldFilter = (field: string) => {
    setIsLuceneMode(true);
    setQuery((prev) => {
      const token = `${field}:`;
      if (prev.includes(token)) return prev;
      return prev.trim() ? `${prev} ${token}` : token;
    });
  };

  const histogram = useMemo(() => {
    if (baseFiltered.length === 0) return [];

    const sorted = [...baseFiltered].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    const start = new Date(sorted[0].timestamp).getTime();
    const end = new Date(sorted[sorted.length - 1].timestamp).getTime();
    const bucketCount = 30;
    const interval = Math.max(Math.floor((end - start) / bucketCount), 1000);

    const buckets = Array.from({ length: bucketCount }, (_, idx) => ({
      key: idx,
      label: new Date(start + idx * interval),
      count: 0,
      start,
      end,
      interval,
    }));

    for (const item of sorted) {
      const idx = Math.min(
        Math.floor((new Date(item.timestamp).getTime() - start) / interval),
        bucketCount - 1
      );
      buckets[idx].count += 1;
    }

    return buckets;
  }, [baseFiltered]);

  const filtered = useMemo(() => {
    if (selectedBucketKey === null || histogram.length === 0) {
      return baseFiltered;
    }

    const bucket = histogram.find((item) => item.key === selectedBucketKey);
    if (!bucket) {
      return baseFiltered;
    }

    const bucketStart = bucket.start + bucket.key * bucket.interval;
    const bucketEnd = bucketStart + bucket.interval;

    return baseFiltered.filter((log) => {
      const ts = new Date(log.timestamp).getTime();
      return ts >= bucketStart && ts < bucketEnd;
    });
  }, [baseFiltered, histogram, selectedBucketKey]);

  const visibleLogs = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);
  const hasMoreLogs = visibleCount < filtered.length;

  const handleTableScroll = (event: UIEvent<HTMLDivElement>) => {
    if (!hasMoreLogs) return;

    const { scrollTop, clientHeight, scrollHeight } = event.currentTarget;
    if (scrollHeight - (scrollTop + clientHeight) < 120) {
      setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filtered.length));
    }
  };

  const maxBucket = Math.max(...histogram.map((bucket) => bucket.count), 1);
  const hoveredBucket = hoveredBucketKey !== null
    ? histogram.find((bucket) => bucket.key === hoveredBucketKey) ?? null
    : null;
  const hoveredBucketMeta = useMemo(() => {
    if (!hoveredBucket || histogram.length === 0) {
      return null;
    }

    const index = histogram.findIndex((bucket) => bucket.key === hoveredBucket.key);
    if (index < 0) {
      return null;
    }

    const xPct = histogram.length === 1 ? 50 : (index / (histogram.length - 1)) * 100;
    const heightPct = Math.max((hoveredBucket.count / maxBucket) * 100, 2);
    const yPct = 100 - heightPct;

    return { xPct, yPct };
  }, [hoveredBucket, histogram, maxBucket]);

  const yAxisTicks = [1, 0.75, 0.5, 0.25, 0].map((ratio) => ({
    ratio,
    value: Math.round(maxBucket * ratio),
  }));

  const xAxisTicks = histogram.length > 0
    ? [histogram[0], histogram[Math.floor(histogram.length / 2)], histogram[histogram.length - 1]]
    : [];

  const fieldCandidates = useMemo(() => {
    const baseFields = ['@timestamp', 'service', 'level', 'message', 'env', 'traceId', 'requestId'];
    const dynamicFields = new Set<string>();

    for (const item of logs) {
      Object.keys(item.metadata ?? {}).forEach((field) => dynamicFields.add(field));
      Object.keys(item.tags ?? {}).forEach((field) => dynamicFields.add(`tag.${field}`));
    }

    return [...baseFields, ...Array.from(dynamicFields)].slice(0, 20);
  }, [logs]);

  const filteredFields = useMemo(() => {
    if (!fieldSearch.trim()) return fieldCandidates;
    return fieldCandidates.filter((field) =>
      field.toLowerCase().includes(fieldSearch.toLowerCase())
    );
  }, [fieldCandidates, fieldSearch]);

  const exceptionCount = filtered.filter((item) => item.level === 'ERROR').length;

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [query, timeRange, isLuceneMode, activeTab, selectedBucketKey]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2, md: 3 } }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
        Logs
      </Typography>

      <Paper
        variant="outlined"
        sx={{
          borderColor: 'divider',
          bgcolor: 'background.paper',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Stack direction={{ xs: 'column', md: 'row' }} gap={1}>
            <TextField
              fullWidth
              placeholder="Search logs (Lucene style)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              size="small"
            />
            <Button
              variant={isLuceneMode ? 'contained' : 'outlined'}
              size="small"
              sx={{ whiteSpace: 'nowrap', px: 2 }}
              onClick={() => setIsLuceneMode((prev) => !prev)}
            >
              {isLuceneMode ? 'Lucene ON' : 'Lucene OFF'}
            </Button>
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <Select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as typeof timeRange)}
              >
                <MenuItem value="15m">Last 15m</MenuItem>
                <MenuItem value="1h">Last 1h</MenuItem>
                <MenuItem value="6h">Last 6h</MenuItem>
                <MenuItem value="24h">Last 24h</MenuItem>
                <MenuItem value="all">All Time</MenuItem>
              </Select>
            </FormControl>
            <Button variant="contained" size="small" sx={{ whiteSpace: 'nowrap', px: 2 }} onClick={() => refetch()}>
              Refresh
            </Button>
          </Stack>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '300px 1fr' },
            minHeight: 520,
          }}
        >
          <Box sx={{ borderRight: { lg: '1px solid' }, borderColor: 'divider', p: 1.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              Search these accounts
            </Typography>
            <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mb: 2 }}>
              <Chip label="Benchmarks" size="small" />
              <Chip label="Jenkins Tests Logs" size="small" />
              <Chip label="LogTech Prod" size="small" />
            </Stack>

            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
              Field Explorer
            </Typography>
            <TextField
              placeholder="Search field names"
              size="small"
              fullWidth
              sx={{ mb: 1 }}
              value={fieldSearch}
              onChange={(e) => setFieldSearch(e.target.value)}
            />
            <Divider sx={{ my: 1 }} />
            <Stack gap={0.5} sx={{ maxHeight: 310, overflowY: 'auto' }}>
              {filteredFields.map((field) => (
                <Button
                  key={field}
                  size="small"
                  variant="text"
                  onClick={() => appendFieldFilter(field)}
                  sx={{
                    justifyContent: 'flex-start',
                    textTransform: 'none',
                    color: 'text.secondary',
                    px: 0.5,
                    minHeight: 28,
                  }}
                >
                  {field}
                </Button>
              ))}
            </Stack>
          </Box>

          <Box sx={{ p: 1.5 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, textAlign: 'center', mb: 1 }}>
              {filtered.length.toLocaleString()} hits
            </Typography>

            {selectedBucketKey !== null && (
              <Stack direction="row" justifyContent="flex-end" sx={{ mb: 1 }}>
                <Button size="small" variant="text" onClick={() => setSelectedBucketKey(null)}>
                  Clear bucket filter
                </Button>
              </Stack>
            )}

            <Paper
              variant="outlined"
              sx={{
                p: 1,
                borderColor: 'divider',
                bgcolor: 'background.default',
                mb: 1.5,
              }}
            >
              <Box sx={{ position: 'relative', pl: 4.5, pr: 1, pt: 0.5, pb: 3 }}>
                <Box sx={{ position: 'relative', height: 180 }}>
                  {hoveredBucket && hoveredBucketMeta && (
                    <Paper
                      elevation={3}
                      sx={{
                        position: 'absolute',
                        left: `${hoveredBucketMeta.xPct}%`,
                        top: `clamp(4px, calc(${hoveredBucketMeta.yPct}% - 42px), 150px)`,
                        transform: 'translateX(-50%)',
                        zIndex: 3,
                        px: 1,
                        py: 0.75,
                        borderRadius: 1,
                        bgcolor: 'background.paper',
                        pointerEvents: 'none',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <Typography variant="caption" sx={{ display: 'block', fontWeight: 700 }}>
                        {hoveredBucket.count.toLocaleString()} hits
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {hoveredBucket.label.toLocaleTimeString()}
                      </Typography>
                    </Paper>
                  )}

                  {yAxisTicks.map((tick) => (
                    <Box
                      key={`y-${tick.ratio}`}
                      sx={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        top: `${(1 - tick.ratio) * 100}%`,
                        borderTop: '1px dashed',
                        borderColor: 'divider',
                        opacity: tick.ratio === 0 ? 0.8 : 0.5,
                      }}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          position: 'absolute',
                          left: -32,
                          top: -8,
                          fontSize: '0.65rem',
                        }}
                      >
                        {tick.value}
                      </Typography>
                    </Box>
                  ))}

                  <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.5, height: '100%', position: 'relative', zIndex: 1 }}>
                    {histogram.map((bucket) => (
                      <Box
                        key={bucket.key}
                        onMouseEnter={() => setHoveredBucketKey(bucket.key)}
                        onMouseLeave={() => setHoveredBucketKey(null)}
                        onClick={() =>
                          setSelectedBucketKey((prev) => (prev === bucket.key ? null : bucket.key))
                        }
                        sx={{
                          flex: 1,
                          minWidth: 6,
                          height: `${Math.max((bucket.count / maxBucket) * 100, 2)}%`,
                          bgcolor: (theme) =>
                            query.trim()
                              ? theme.palette.mode === 'dark'
                                ? '#5fb8a8'
                                : '#59ad9b'
                              : theme.palette.primary.main,
                          borderRadius: '2px 2px 0 0',
                          opacity:
                            selectedBucketKey !== null
                              ? selectedBucketKey === bucket.key
                                ? 1
                                : 0.35
                              : hoveredBucketKey === null || hoveredBucketKey === bucket.key
                                ? 1
                                : 0.5,
                          outline:
                            selectedBucketKey === bucket.key
                              ? '2px solid rgba(255,255,255,0.7)'
                              : 'none',
                          cursor: 'pointer',
                        }}
                      />
                    ))}
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.75, ml: 0.5 }}>
                  {xAxisTicks.map((tick, index) => (
                    <Typography key={`x-${tick.key}-${index}`} variant="caption" color="text.secondary">
                      {tick.label.toLocaleTimeString()}
                    </Typography>
                  ))}
                </Box>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
                @timestamp per auto interval
              </Typography>
            </Paper>

            <ToggleButtonGroup
              exclusive
              value={activeTab}
              onChange={(_, value) => value && setActiveTab(value)}
              size="small"
              sx={{ mb: 1.5 }}
            >
              <ToggleButton value="logs">Logs</ToggleButton>
              <ToggleButton value="patterns">Patterns</ToggleButton>
              <ToggleButton value="exceptions">Exceptions ({exceptionCount})</ToggleButton>
            </ToggleButtonGroup>

            <Box
              onScroll={handleTableScroll}
              sx={{
                maxHeight: 420,
                overflowY: 'auto',
              }}
            >
              <LogsTable logs={visibleLogs} onSelect={setSelectedLog} query={query} compact />
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Showing {visibleLogs.length.toLocaleString()} of {filtered.length.toLocaleString()} logs
              {hasMoreLogs ? ' · Scroll down to load more' : ''}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Selected Log Detail Drawer */}
      <Drawer
        anchor="right"
        open={selectedLog !== null}
        onClose={() => setSelectedLog(null)}
        PaperProps={{
          sx: {
            width: 384,
            bgcolor: (theme) => theme.palette.background.paper,
            borderLeft: '1px solid',
            borderColor: (theme) => theme.palette.divider,
          },
        }}
      >
        {selectedLog && (
          <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Log Detail
              </Typography>
              <IconButton
                onClick={() => setSelectedLog(null)}
                size="small"
                sx={{ color: (theme) => theme.palette.text.secondary }}
              >
                <CloseIcon />
              </IconButton>
            </Box>

            <Typography variant="body2" sx={{ color: (theme) => theme.palette.text.secondary }}>
              ID: {selectedLog.id}
            </Typography>
            <Typography variant="body2" sx={{ color: (theme) => theme.palette.text.secondary }}>
              Timestamp: {formatTimestamp(selectedLog.timestamp)}
            </Typography>
            <Typography variant="body2" sx={{ color: (theme) => theme.palette.text.secondary }}>
              Service: {selectedLog.service}
            </Typography>
            <Typography variant="body2" sx={{ color: (theme) => theme.palette.text.secondary }}>
              Level: {selectedLog.level}
            </Typography>
            <Typography variant="body2" sx={{ color: (theme) => theme.palette.text.secondary }}>
              Message: {selectedLog.message}
            </Typography>
          </Box>
        )}
      </Drawer>
    </Box>
  );
}
