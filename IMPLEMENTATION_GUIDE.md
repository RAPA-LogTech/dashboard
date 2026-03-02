# 구현 가이드 & 체크리스트

> LogTech Observability Dashboard 완벽 구현을 위한 단계별 가이드

---

## 📋 현재 완료 상황

### ✅ 완료된 작업

1. **디자인 시스템** (`DESIGN_SYSTEM.md`)
   - 색상 팔레트 정의 (다크/라이트 모드)
   - 타이포그래피 계층
   - Spacing 그리드 (8px base)
   - 모든 컴포넌트 스타일링 규칙

2. **MUI 테마** (`src/theme/theme.ts`)
   - 완벽한 디자인 토큰 (색상, 타이포, spacing)
   - 컴포넌트별 스타일 오버라이드
   - 다크모드 기본, 라이트모드 토글 지원

3. **타입 정의** (`src/lib/types.ts`)
   - LogEntry, MetricSeries, Trace, Dashboard
   - Alert, Integration, AiMessage 등
   - API Response 타입

4. **모킹 데이터** (`src/lib/mock.ts`)
   - 실제 시나리오 기반 Mock 데이터
   - 헬퍼 함수 (getLogsByService 등)

5. **JSON 예시 파일** (`public/data/`)
   - logs-example.json (traceId, requestId metadata)
   - metrics-example.json (시계열 데이터)
   - trace-example.json (Span waterfall + 병목 분석)
   - dashboards-example.json (위젯 설정)
   - alerts-example.json (알림 규칙 + 이벤트)

6. **핵심 컴포넌트 구현**
   - ✅ GlobalFilterBar (시간, 서비스, env, cluster 필터)
   - ✅ KPICard (상태, 트렌드 표시)
   - ✅ AiChatDrawer (메시지, AI 응답, 액션 링크)
   - ✅ AppLayout (전체 레이아웃)
   - ✅ Sidebar (네비게이션 + AI 버튼)
   - ✅ TopBar (헤더 + 사용자 메뉴)

7. **페이지 구현**
   - ✅ OverviewPage (KPI cards, 서비스 테이블, 최근 로그/알림)

8. **사용자 흐름** (`USER_FLOWS.md`)
   - Flow 1: 에러 탐지 → AI 분석 → 로그 → 트레이스
   - Flow 2: 메트릭 이상 → 알림 생성 → Slack 연결
   - Flow 3: 로그에서 traceId로 트레이스 추적
   - 각 흐름별 상세 시나리오 + JSON 데이터 예시

---

## 🚀 다음 구현 단계 (To-Do)

### Phase 1: 추가 페이지 구현 (우선순위 높음)

#### [ ] Logs Page
**파일**: `src/features/logs/LogsPage.tsx`

```typescript
'use client';

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Chip,
  Stack,
  Drawer,
  Typography,
  Button,
  Divider,
  Table as JsonTable,
} from '@mui/material';
import { GlobalFilterState, LogEntry } from '@/lib/types';
import { mockLogs } from '@/lib/mock';

interface LogsPageProps {
  filters: GlobalFilterState;
}

export default function LogsPage({ filters }: LogsPageProps) {
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [searchText, setSearchText] = useState('');

  // Filter logs based on global filters + search
  const filteredLogs = mockLogs.filter(log => {
    const matchService = filters.service.length === 0 || 
                        filters.service.includes(log.service);
    const matchEnv = filters.env.includes(log.env);
    const matchSearch = searchText === '' || 
                       log.message.toLowerCase().includes(searchText.toLowerCase());
    return matchService && matchEnv && matchSearch;
  });

  const levelColors = {
    ERROR: { bg: '#EF444433', text: '#EF4444' },
    WARN: { bg: '#F59E0B33', text: '#F59E0B' },
    INFO: { bg: '#3B82F633', text: '#3B82F6' },
    DEBUG: { bg: '#6B728033', text: '#6B7280' },
  };

  return (
    <Stack spacing={3}>
      {/* Header + Search */}
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 700, marginBottom: 1 }}>
          Logs
        </Typography>
        <TextField
          fullWidth
          placeholder="Search logs..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          size="small"
          sx={{ maxWidth: '400px' }}
        />
      </Box>

      {/* Logs Table */}
      <Card>
        <CardContent>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Timestamp</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Service</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Level</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Message</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredLogs.map((log) => {
                const color = levelColors[log.level];
                return (
                  <TableRow
                    key={log.id}
                    hover
                    onClick={() => setSelectedLog(log)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell sx={{ fontSize: '12px' }}>
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </TableCell>
                    <TableCell sx={{ fontSize: '12px', fontWeight: 500 }}>
                      {log.service}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={log.level}
                        sx={{
                          height: '20px',
                          fontSize: '11px',
                          backgroundColor: color.bg,
                          color: color.text,
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontSize: '12px' }}>
                      {log.message}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Log Detail Drawer */}
      <Drawer anchor="right" open={!!selectedLog} onClose={() => setSelectedLog(null)}>
        {selectedLog && (
          <Box sx={{ width: 500, padding: 3 }}>
            <Typography variant="h6" sx={{ marginBottom: 2 }}>
              Log Details
            </Typography>

            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  ID
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  {selectedLog.id}
                </Typography>
              </Box>

              <Divider />

              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Message
                </Typography>
                <Typography variant="body2">{selectedLog.message}</Typography>
              </Box>

              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Metadata (JSON)
                </Typography>
                <Box
                  sx={{
                    backgroundColor: 'background.default',
                    padding: 1,
                    borderRadius: 1,
                    overflow: 'auto',
                    maxHeight: 300,
                  }}
                >
                  <pre style={{ fontSize: '11px' }}>
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </Box>
              </Box>

              {/* Trace Link */}
              {selectedLog.metadata?.traceId && (
                <>
                  <Divider />
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => {
                      window.location.href = `/traces?traceId=${selectedLog.metadata?.traceId}`;
                    }}
                  >
                    → View Trace
                  </Button>
                </>
              )}
            </Stack>
          </Box>
        )}
      </Drawer>
    </Stack>
  );
}
```

**필요 데이터**: `mockLogs` (이미 완성)

#### [ ] Traces Page
**파일**: `src/features/traces/TracesPage.tsx`

- Trace list 테이블
- Span waterfall 시각화 (timeline 라이브러리 사용)
- Bottleneck analysis
- 로그로 드릴다운 링크

**라이브러리**: `recharts` 또는 `react-timelines`

#### [ ] Metrics Page
**파일**: `src/features/metrics/MetricsPage.tsx`

- 메트릭 선택기 (드롭다운/트리)
- 멀티라인 차트 (recharts)
- 범례 토글
- 통계 테이블 (Min, Max, Avg, p99)

**라이브러리**: `recharts`

#### [ ] Dashboards Page
**파일**: `src/features/dashboards/DashboardsPage.tsx`

- 대시보드 리스트 (카드 뷰)
- 생성/편집 모달 (드래그 앤 드롭 그리드)
- 위젯 설정

**라이브러리**: `react-grid-layout` 또는 `react-dnd`

#### [ ] Integrations Page
**파일**: `src/features/integrations/SlackIntegrationPage.tsx`

- 이용 가능한 통합 목록 (카드)
- 설정된 통합 리스트
- OAuth 플로우 (Slack)
- 테스트 버튼

#### [ ] Settings Page
**파일**: `src/features/settings/SettingsPage.tsx`

- Profile (Name, Email, API Key)
- Workspace (Members, Role, 2FA)
- Preferences (Theme, Language, Notifications)
- Data Retention

### Phase 2: 차트 & 시각화 (우선순위 중)

#### [ ] Chart Components

```typescript
// src/components/charts/LineChart.tsx
export const LineChart: React.FC<LineChartProps> = ({
  data,
  series,
  timeRange,
  onRangeSelect,
  onDrilldown,
}) => {
  // Recharts ResponsiveContainer + LineChart
  // Tooltip, Legend toggle, 클릭 → drill-down
};

// src/components/charts/BarChart.tsx
// src/components/charts/GaugeChart.tsx
// src/components/charts/HeatmapChart.tsx
```

### Phase 3: 고급 기능 (우선순위 낮음)

#### [ ] 스마트 컨텍스트 감지
AI Chat에서 현재 페이지의 필터/데이터 자동 감지

#### [ ] 저장된 필터 프리셋
자주 사용하는 필터 세트 저장/로드

#### [ ] 커스텀 대시보드
기존 위젯으로 새로운 대시보드 생성

#### [ ] 실시간 업데이트
WebSocket으로 메트릭, 로그 실시간 수신

#### [ ] 공동 작업 기능
대시보드/알림 공유, 댓글

---

## 🔌 필요한 라이브러리 추가

```bash
# 차트 시각화
npm install recharts

# 드래그 앤 드롭 (대시보드 에디터)
npm install react-grid-layout react-dnd

# HTML 파싱 (코드 블록)
npm install react-syntax-highlighter

# 날짜/시간
npm install date-fns dayjs

# 클립보드
npm install react-copy-to-clipboard

# API 호출
npm install axios  # 이미 @tanstack/react-query 있음

# Local storage (설정 저장)
npm install zustand  # 또는 Redux
```

**package.json에 추가**
```json
{
  "dependencies": {
    "recharts": "^2.12.0",
    "react-grid-layout": "^1.4.4",
    "react-syntax-highlighter": "^15.5.0",
    "date-fns": "^3.0.0"
  }
}
```

---

## 🎯 구현 우선순위 (추천)

### Week 1-2: 핵심 페이지
1. **Logs Page** (데이터 브라우징 - 가장 essential)
2. **Traces Page** (병목 분석)
3. **Metrics Page** (메트릭 시각화)

### Week 3: 관리 페이지
4. **Dashboards Page** (사용자 정의 대시보드)
5. **Alerts Page** (알림 관리)

### Week 4: 통합 & 설정
6. **Integrations Page** (Slack 연결)
7. **Settings Page** (사용자 설정)

### Week 5+: 고급 기능
8. 실시간 업데이트
9. AI 분석 고도화
10. 공동 작업

---

## 📱 반응형 설계 체크리스트

- [ ] Mobile (xs: 0-640px): Sidebar → Hamburger menu
- [ ] Tablet (sm: 641-1024px): 레이아웃 조정
- [ ] Desktop (md+: 1025px+): 풀 레이아웃

**예시**
```typescript
sx={{
  display: { xs: 'none', md: 'block' },  // Mobile에서 숨김
  padding: { xs: '12px', md: '24px' },   // 반응형 padding
}}
```

---

## 🧪 테스트 체크리스트

- [ ] 모든 페이지 로드됨
- [ ] 필터링이 작동함 (시간, 서비스, env, cluster)
- [ ] AI Chat이 context를 감지함
- [ ] 로그 → 트레이스 드릴다운 작동
- [ ] Alert 생성 → Slack 연결 작동
- [ ] 다크/라이트 모드 전환 작동
- [ ] 반응형 레이아웃 확인 (모바일, 태블릿, 데스크탑)

---

## 📚 참고 문서

- 디자인 시스템: `DESIGN_SYSTEM.md`
- 사용자 흐름: `USER_FLOWS.md`
- JSON 데이터: `public/data/` (5개 파일)
- Mock 데이터: `src/lib/mock.ts`
- 타입 정의: `src/lib/types.ts`
- 테마: `src/theme/theme.ts`

---

## 🆘 트러블슈팅

### "Module not found" 에러

확인 사항:
1. Import 경로가 올바른가? (`@/` alias 사용)
2. 컴포넌트 파일이 존재하는가?
3. 대소문자가 맞는가?

### "Cannot read property of undefined"

확인 사항:
1. Mock 데이터가 로드되었는가?
2. Optional chaining (`?.`) 사용했는가?
3. 필터링 후 배열이 비어있지는 않은가?

### 스타일이 적용 안 됨

확인 사항:
1. `sx` prop 사용했는가?
2. 클래스명 충돌 없는가?
3. 테마 프로바이더가 App 최상단에 있는가?

---

## 🎓 학습 자료

- MUI Docs: https://mui.com/
- Recharts Docs: https://recharts.org/
- React Query Docs: https://tanstack.com/query/
- TypeScript Handbook: https://www.typescriptlang.org/handbook/

---

## ✅ 최종 체크리스트

- [x] 디자인 시스템 문서 작성
- [x] MUI 테마 완성
- [x] 타입 정의 완성
- [x] Mock 데이터 빌드
- [x] JSON 예시 파일 생성
- [x] 핵심 레이아웃 컴포넌트 구현
- [x] 사용자 흐름 문서 작성
- [ ] Logs Page 구현
- [ ] Traces Page 구현
- [ ] Metrics Page 구현
- [ ] Dashboards Page 구현
- [ ] Alerts Page 구현
- [ ] Integrations Page 구현
- [ ] Settings Page 구현
- [ ] 차트 시각화 라이브러리 통합
- [ ] E2E 테스트
- [ ] 배포 & 모니터링
