import { FormControl, MenuItem, Select } from '@mui/material'

type LogSource = 'all' | 'app' | 'host'

interface LogSourceSelectProps {
  value: LogSource
  onChange: (value: LogSource) => void
}

export default function LogSourceSelect({ value, onChange }: LogSourceSelectProps) {
  return (
    <Select value={value} onChange={e => onChange(e.target.value as LogSource)}>
      <MenuItem value="all">전체</MenuItem>
      <MenuItem value="app">앱 로그</MenuItem>
      <MenuItem value="host">호스트 로그</MenuItem>
    </Select>
  )
}
