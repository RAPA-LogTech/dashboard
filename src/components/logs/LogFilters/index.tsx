import { FormControl, MenuItem, Select, Stack } from '@mui/material'
import LogSourceSelect from './LogSourceSelect'
import SearchInput from '@/components/logs/LogFilters/SearchInput'
import LuceneToggle from '@/components/logs/LogFilters/LuceneToggle'
import TimeRangeSelect from '@/components/logs/LogFilters/TimeRangeSelect'
import RefreshButton from '@/components/logs/LogFilters/RefreshButton'
import LiveButton from '@/components/logs/LogFilters/LiveButton'

type LogSource = 'all' | 'app' | 'host'

interface LogFiltersProps {
  query: string
  onQueryChange: (value: string) => void
  isLuceneMode: boolean
  onLuceneModeChange: (value: boolean) => void
  timeRange: '15m' | '1h' | '6h' | '24h' | 'all'
  onTimeRangeChange: (value: '15m' | '1h' | '6h' | '24h' | 'all') => void
  onRefresh: () => void
  isLiveEnabled: boolean
  onLiveEnabledChange: (value: boolean) => void
  isLiveStreaming: boolean
  logSource: LogSource
  onLogSourceChange: (value: LogSource) => void
}

export default function LogFilters({
  query,
  onQueryChange,
  isLuceneMode,
  onLuceneModeChange,
  timeRange,
  onTimeRangeChange,
  onRefresh,
  isLiveEnabled,
  onLiveEnabledChange,
  isLiveStreaming,
  logSource,
  onLogSourceChange,
}: LogFiltersProps) {
  const getPlaceholder = (isLucene: boolean) =>
    isLucene ? 'field:value (예: service:auth, level:ERROR)' : '키워드 입력 (예: error, auth)'

  return (
    <Stack direction={{ xs: 'column', md: 'row' }} gap={1}>
      <SearchInput
        value={query}
        onChange={onQueryChange}
        placeholder={getPlaceholder(isLuceneMode)}
        sx={{ width: { xs: '100%', md: 'auto' }, flexGrow: { md: 1 } }}
      />
      <Stack direction="row" gap={1}>
        <LuceneToggle value={isLuceneMode} onChange={onLuceneModeChange} />
        <TimeRangeSelect value={timeRange} onChange={onTimeRangeChange} />
        <RefreshButton onClick={onRefresh} />
        <LiveButton
          value={isLiveEnabled}
          isStreaming={isLiveStreaming}
          onChange={onLiveEnabledChange}
        />
        <LogSourceSelect value={logSource} onChange={onLogSourceChange} />
      </Stack>
    </Stack>
  )
}
