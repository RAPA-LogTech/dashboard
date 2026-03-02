'use client';

import {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Paper,
} from '@mui/material';
import { LogEntry } from '@/lib/types';

export default function LogsTable({ logs, onSelect }: { logs: LogEntry[]; onSelect: (log: LogEntry) => void }) {
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR':
        return { bgcolor: 'rgba(239, 68, 68, 0.1)', textColor: '#ef4444' };
      case 'WARN':
        return { bgcolor: 'rgba(240, 153, 75, 0.1)', textColor: '#f59e0b' };
      case 'INFO':
        return { bgcolor: 'rgba(59, 130, 246, 0.1)', textColor: '#3b82f6' };
      default:
        return { bgcolor: 'rgba(16, 185, 129, 0.1)', textColor: '#10b981' };
    }
  };

  return (
    <TableContainer
      component={Paper}
      sx={{
        bgcolor: '#0f172a',
        border: '1px solid #1E293B',
      }}
    >
      <Table sx={{ minWidth: 650 }}>
        <TableHead sx={{ bgcolor: '#0f172a' }}>
          <TableRow sx={{ borderBottom: '1px solid #1E293B' }}>
            <TableCell
              sx={{
                color: '#cbd5e1',
                fontWeight: 600,
                fontSize: '0.875rem',
              }}
            >
              Timestamp
            </TableCell>
            <TableCell
              sx={{
                color: '#cbd5e1',
                fontWeight: 600,
                fontSize: '0.875rem',
              }}
            >
              Service
            </TableCell>
            <TableCell
              sx={{
                color: '#cbd5e1',
                fontWeight: 600,
                fontSize: '0.875rem',
              }}
            >
              Env
            </TableCell>
            <TableCell
              sx={{
                color: '#cbd5e1',
                fontWeight: 600,
                fontSize: '0.875rem',
              }}
            >
              Level
            </TableCell>
            <TableCell
              sx={{
                color: '#cbd5e1',
                fontWeight: 600,
                fontSize: '0.875rem',
              }}
            >
              Message
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {logs.map((row) => (
            <TableRow
              key={row.id}
              onClick={() => onSelect(row)}
              sx={{
                borderBottom: '1px solid #1E293B',
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: '#1e293b',
                },
              }}
            >
              <TableCell sx={{ color: '#64748b', fontSize: '0.875rem' }}>
                {row.timestamp}
              </TableCell>
              <TableCell sx={{ color: '#cbd5e1', fontSize: '0.875rem' }}>
                {row.service}
              </TableCell>
              <TableCell sx={{ color: '#cbd5e1', fontSize: '0.875rem' }}>
                {row.env}
              </TableCell>
              <TableCell sx={{ fontSize: '0.875rem' }}>
                {(() => {
                  const color = getLevelColor(row.level);
                  return (
                    <Chip
                      label={row.level}
                      size="small"
                      sx={{
                        bgcolor: color.bgcolor,
                        color: color.textColor,
                        fontWeight: 600,
                        fontSize: '0.75rem',
                      }}
                    />
                  );
                })()}
              </TableCell>
              <TableCell
                sx={{
                  color: '#cbd5e1',
                  fontSize: '0.875rem',
                  maxWidth: 300,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {row.message}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
