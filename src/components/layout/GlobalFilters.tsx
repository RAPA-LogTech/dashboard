'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  Grid,
  FormControl,
  Select,
  MenuItem,
  Typography,
} from '@mui/material';
import { apiClient } from '@/lib/apiClient';

export default function GlobalFilters() {
  const { data } = useQuery({
    queryKey: ['global-filter-options'],
    queryFn: apiClient.getGlobalFilterOptions,
  });

  const [timeRange, setTimeRange] = useState(data?.timeRanges?.[1]?.value ?? '1h');
  const [service, setService] = useState(data?.services?.[0] ?? '');
  const [env, setEnv] = useState(data?.envs?.[0] ?? '');
  const [cluster, setCluster] = useState(data?.clusters?.[0] ?? '');

  return (
    <Card
      sx={{
        bgcolor: '#0f172a',
        border: '1px solid #1E293B',
        mb: 2,
      }}
    >
      <CardContent>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          {/* Time Range */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, mb: 1, display: 'block' }}>
              Time Range
            </Typography>
            <FormControl fullWidth size="small">
              <Select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                sx={{
                  bgcolor: '#1e293b',
                  color: '#cbd5e1',
                  fontSize: '0.875rem',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#334155',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#475569',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#c084fc',
                  },
                }}
              >
                {(data?.timeRanges ?? []).map((item) => (
                  <MenuItem key={item.value} value={item.value}>
                    {item.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Service */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, mb: 1, display: 'block' }}>
              Service
            </Typography>
            <FormControl fullWidth size="small">
              <Select
                value={service}
                onChange={(e) => setService(e.target.value)}
                sx={{
                  bgcolor: '#1e293b',
                  color: '#cbd5e1',
                  fontSize: '0.875rem',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#334155',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#475569',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#c084fc',
                  },
                }}
              >
                {(data?.services ?? []).map((value) => (
                  <MenuItem key={value} value={value}>
                    {value}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Environment */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, mb: 1, display: 'block' }}>
              Env
            </Typography>
            <FormControl fullWidth size="small">
              <Select
                value={env}
                onChange={(e) => setEnv(e.target.value)}
                sx={{
                  bgcolor: '#1e293b',
                  color: '#cbd5e1',
                  fontSize: '0.875rem',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#334155',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#475569',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#c084fc',
                  },
                }}
              >
                {(data?.envs ?? []).map((value) => (
                  <MenuItem key={value} value={value}>
                    {value}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Cluster */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, mb: 1, display: 'block' }}>
              Cluster
            </Typography>
            <FormControl fullWidth size="small">
              <Select
                value={cluster}
                onChange={(e) => setCluster(e.target.value)}
                sx={{
                  bgcolor: '#1e293b',
                  color: '#cbd5e1',
                  fontSize: '0.875rem',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#334155',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#475569',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#c084fc',
                  },
                }}
              >
                {(data?.clusters ?? []).map((value) => (
                  <MenuItem key={value} value={value}>
                    {value}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Typography variant="caption" sx={{ color: '#64748b' }}>
          Global filters are shared across pages.
        </Typography>
      </CardContent>
    </Card>
  );
}
