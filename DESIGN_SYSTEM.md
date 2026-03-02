# Observability Dashboard - 디자인 시스템 v1.0

> B2B SaaS Observability Platform (Datadog 유사) 
> 신뢰성 + 단순명확성 + AI 중심의 설계

---

## 📋 목차
1. [디자인 철학](#디자인-철학)
2. [색상 시스템](#색상-시스템)
3. [타이포그래피](#타이포그래피)
4. [Spacing & Layout Grid](#spacing--layout-grid)
5. [컴포넌트 라이브러리](#컴포넌트-라이브러리)
6. [의미론적 색상](#의미론적-색상-상태)
7. [페이지별 구조](#페이지별-구조)
8. [사용자 흐름](#사용자-흐름)
9. [Empty/Loading/Error States](#emptyloadingerror-states)

---

## 🎨 디자인 철학

### 원칙 3가지
1. **전문 엔지니어를 위한 도구** - 신뢰할 수 있고, 결정할 수 있도록
2. **정보 과밀 회피** - 중요→원인탐색→조치 흐름만
3. **AI가 제품의 심장** - 모든 곳에서 쉽게 접근 가능

### 시각 원칙
- **과한 그림자 금지** - border와 background로만 구획
- **색상은 신호** - 상태, 심각도, 행동만 표현
- **다크 모드 기본** - 24h 운영 환경 고려
- **높은 대비도** - WCAG AA 이상 준수

---

## 🎭 색상 시스템

### Primary Palette (다크 모드 기준)

```
🟣 Purple (Primary - AI/핵심)
  - 900: #3D1F5C (배경 강조)
  - 700: #6B3FA0 (호버)
  - 500: #8B5CF6 (기본)
  - 300: #C9A5F4 (텍스트/활성)

🩵 Cyan (Secondary - 데이터/강조)
  - 900: #164E63 (배경)
  - 700: #06B6D4 (호버)
  - 500: #22D3EE (기본)
  - 300: #67E8F9 (텍스트)

⚪ Neutral (배경/텍스트)
  - 950: #0B1020 (배경 최상단)
  - 900: #121A2B (카드/섹션)
  - 800: #1F2937 (호버/div)
  - 700: #374151 (테두리)
  - 400: #9CA3AF (약한 텍스트)
  - 200: #E5E7EB (강한 텍스트, 다크모드)
  - 50:  #F9FAFB (라이트 모드 배경)
```

### 상태 색상
```
🔴 Error:   #EF4444 (Red-500)
🟡 Warning: #F59E0B (Amber-500)
🟢 Success: #10B981 (Emerald-500)
🔵 Info:    #3B82F6 (Blue-500)

// 밝기 조정 (다크모드)
- 배경: 상태색 + Opacity 20%
- 텍스트: 상태색 + Opacity 100%
- 테두리: 상태색 + Opacity 40%
```

---

## 🔤 타이포그래피

### 폰트 스택
```typescript
fontFamily: '"Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", sans-serif'
```

### 계층 정의

| 역할 | 크기 | 굵기 | 줄높이 | 쓰임새 |
|------|------|------|--------|--------|
| **Display** | 32px | 700 | 1.2 | 페이지 제목 |
| **Heading1** | 24px | 600 | 1.3 | 섹션 제목 |
| **Heading2** | 18px | 600 | 1.4 | 서브섹션 제목 |
| **Heading3** | 14px | 600 | 1.4 | 카드 제목 |
| **Body Large** | 16px | 400 | 1.5 | 본문 텍스트 |
| **Body Regular** | 14px | 400 | 1.5 | 기본 텍스트 |
| **Body Small** | 12px | 400 | 1.5 | 보조 정보 |
| **Caption** | 11px | 400 | 1.4 | 타임스탬프, 라벨 |
| **Mono** | 13px | 500 | 1.4 | 코드, ID, 숫자 |

---

## 📐 Spacing & Layout Grid

### Grid Base: 8px

```typescript
spacing: {
  xs: '4px',   // 간격 최소 (내부 패딩)
  sm: '8px',   // 요소 간 간격
  md: '16px',  // 섹션 내 간격 (기본)
  lg: '24px',  // 섹션 간 간격
  xl: '32px',  // 주요 섹션 간
  2xl: '48px', // 페이지 구분
}
```

### Layout 구조

```
┌─────────────────────────────────────────────────┐
│              Top Bar (48px)                      │ ← AppBar
├──────────────┬──────────────────────────────────┤
│              │  Global Filter Bar (56px)        │ ← GlobalFilterBar
│  Sidebar     ├──────────────────────────────────┤
│  (280px)     │                                  │
│  (fixed)     │   Main Content Area              │
│              │   (패딩: lg = 24px)              │
│              │                                  │  ← AI Chat Drawer
│              │   Footer (optional)              │   (400px, 토글 가능)
└──────────────┴──────────────────────────────────┘
```

---

## 🧩 컴포넌트 라이브러리

### 1. AppBar (상단 고정)
```typescript
// MUI AppBar + Toolbar
Props: {
  elevation: 0,
  sx: {
    backgroundColor: 'background.default',
    borderBottom: '1px solid',
    borderColor: 'divider',
  }
}

Content:
  L: Logo + App Title
  C: (비워두기 - 향후 검색)
  R: 사용자 메뉴 + 다크모드 토글
```

### 2. Sidebar (좌측 고정)
```typescript
width: 280px;
position: 'fixed';
backgroundColor: 'background.paper';
borderRight: '1px solid divider';

Items:
  - Logo (40px)
  - Navigation Group (Menu Items)
    • Overview
    • Logs
    • Traces
    • Metrics
    • Dashboards
    • Integrations
    • Settings
  - Divider
  - AI Chat Icon (항상 접근 가능)
```

### 3. GlobalFilterBar
```
┌─────────────────────────────────────────────────────┐
│ 🕐 Time Range  │ Service │ Environment │ Cluster │ │
└─────────────────────────────────────────────────────┘

Height: 56px
Position: sticky top (GlobalFilterBar 아래)
Components:
  - TimeRangeSelector (dropdown + preset buttons)
  - ServiceFilter (multi-select)
  - EnvFilter (toggle: prod/staging/dev)
  - ClusterFilter (multi-select, optional)
  - ClearButton (모든 필터 리셋)
```

### 4. Card / Panel
```typescript
// 기본 unit
elevation: 0,
border: '1px solid',
borderColor: 'divider',
borderRadius: '8px',
backgroundColor: 'background.paper',
padding: '16px', // md spacing

// Variants
Elevated: border + 약간의 그림자 (elevation: 1)
Outlined: border만 (elevation: 0)
Filled: background 살짝 다름 (elevation: 0)
```

### 5. KPI Card (대시보드의 중심)
```
┌─────────────────────┐
│ Error Rate      [i] │ ← heading3 + info icon
│ 2.3%                │ ← metric (큰 숫자, mono)
│ ↑ 12% from 1h ago   │ ← trend (설명, caption)
└─────────────────────┘

Width: 100% / 4 (4개 병렬 배치)
Height: auto
Components:
  - Title (heading3)
  - Value (display 크기 숫자)
  - Trend (caption, 색상: success/warning/error)
  - 선택사항: 미니 차트 (6h 추세)
```

### 6. 데이터 Table
```typescript
// 레이아웃
dense: true,
stickyHeader: true,
size: 'small'

// 헤더
backgroundColor: 'background.default' (조금 더 어두움)
fontWeight: 600
borderBottom: divider

// 행
padding: '8px 12px'
borderBottom: '1px solid divider'

// 컬럼 커스터마이징
우측 메뉴 아이콘: 헤더 우상단
  → 컬럼 숨기기 / 재정렬 / 내보내기

// 상태별 텍스트 색상
- Error: error color
- Warning: warning color
- Normal: default text color
```

### 7. 데이터 시각화 (Chart)
```typescript
// 공통 규칙
- Tooltip 표시 (hover)
- 범례 토글 가능 (우상단 버튼)
- X축 시간, Y축 값
- 클릭 → Logs/Traces로 드릴다운
- 여러 데이터셋은 색상 구분 (primary, secondary, error, warning)

// 타입별
Line Chart: 트렌드 (CPU, Memory, Request Rate)
Bar Chart: 비교 (Service별 Error Rate)
Gauge: 현재값 범위 (Availability, SLA compliance)
Heatmap: 시간-서비스 매트릭스 (에러 분포)
```

### 8. 알럿 / 알림
```typescript
// Severity Badge
- Error:   sz-sm, color: error, text: white
- Warning: sz-sm, color: warning, text: black
- Info:    sz-sm, color: info, text: white

// Alert Dialog
elevation: 0
border: left 4px (상태 색)
padding: '12px 16px'
icon + title + description + actions
```

### 9. AI Chat Drawer
```
┌────────────────────────────┐
│ 🤖 Observability AI    [x] │ ← heading2 + close btn
├────────────────────────────┤
│ Messages (scroll)          │ ← chat history
│                            │
│                            │
├────────────────────────────┤
│ [💬 Message input area..] │ ← TextField + Send button
│                       [→] │
└────────────────────────────┘

Width: 400px (토글 가능)
Position: right drawer
z-index: 위 많은 요소
Messages: 
  - User (오른쪽 정렬, 배경 primary)
  - Assistant (왼쪽 정렬, 배경 secondary)
  - Code block 지원 (syntax highlighting)
  - Link 지원 (로그/트레이스로 점프)
```

### 10. Empty / Loading / Error States

**Empty State:**
```
┌─────────────────────────┐
│                         │
│      🎯 아이콘          │
│                         │
│ "No data available"     │
│ "Try adjusting filters" │
│ [🔄 Refresh Button]    │
│                         │
└─────────────────────────┘
```

**Loading State:**
```
Skeleton (MUI Skeleton 컴포넌트):
- KPI Cards: 4개 skeleton
- Table: header + 5줄
- Chart: 로딩 박스
- Spinner: 진행중 작은 태스크
```

**Error State:**
```
┌─────────────────────────────────┐
│ ⚠️  Something went wrong         │
│ Failed to fetch metrics.         │
│ [🔄 Retry] [📞 Contact Support] │
└─────────────────────────────────┘
Text: error color
```

---

## 🎯 의미론적 색상 (상태)

### 로그 레벨
```
INFO    → Blue (#3B82F6)
WARN    → Amber (#F59E0B)
ERROR   → Red (#EF4444)
SUCCESS → Green (#10B981)
```

### 서비스 상태
```
Healthy / Running   → Green (#10B981)
Degraded           → Amber (#F59E0B)
Down / Error       → Red (#EF4444)
Unknown            → Gray (#6B7280)
```

### 트레이스 상태
```
Success (< threshold) → Green
Slow (threshold 초과, < 2x) → Amber
Very Slow (> 2x)      → Red
Error                 → Red (진함)
```

---

## 📄 페이지별 구조

### 1. Overview (대시보드)
```
Section 1: KPI Cards (4개)
  - Error Rate
  - Average Latency
  - Request/min
  - Availability

Section 2: Top Services Table
  - Service Name | Error Rate | Latency p95 | Throughput
  - 클릭 → 상세 페이지

Section 3: Error Trends Chart (Line)
  - 시간별 에러율 추이
  - 클릭 → Logs 필터링

Section 4: Service Health Matrix
  - 서비스 × 시간 히트맵
  - 색상: 상태, 짙기: 심각도
```

### 2. Logs
```
Section 1: GlobalFilterBar (이미 고정)
  + 추가: Level Filter, Free Text Search

Section 2: Logs Table (Sticky Header)
  - Timestamp (mono)
  - Service
  - Level (badge)
  - Message (truncate with expand)
  - Actions (→ Trace, Copy, Share)

Section 3: Log Detail (Right Drawer, 토글)
  - Full message
  - JSON metadata
  - Trace ID (클릭하면 traces로)
```

### 3. Traces
```
Section 1: Trace List (Table)
  - Trace ID (mono)
  - Service
  - Operation
  - Duration (mono)
  - Status (badge)
  - Timestamp

Section 2: Trace Detail (Full Page or Modal)
  - Span Waterfall (시각화)
    ┌─ service-a ────────────┐
    │  ├─ db-query ──┐       │
    │  └─ cache ─┐   │       │
    └─────────────┴───┴───────┘
  - Span Table
    - Name | Service | Duration | Status % of Trace
  - 클릭 span → 로그 필터링
```

### 4. Metrics
```
Section 1: Metric Selector (드롭다운 or tree)
  - CPU / Memory / Network
  - Request Rate / Error Rate
  - Custom Metrics (user-created)

Section 2: Multi-line Chart
  - 여러 서비스 또는 인스턴스 비교
  - Legend toggle
  - Range selector (drag on chart)

Section 3: Metric Stats Table
  - Min / Max / Avg / p99
  - Trend (1h, 24h, 7d)
```

### 5. Dashboards
```
Section 1: Dashboard List
  - Thumbnail (미니 프리뷰)
  - Title
  - Owner
  - Last Modified
  - [⋯ Menu]: Edit / Duplicate / Share / Delete

Section 2: Create / Edit Dashboard (Modal)
  - Drag-and-drop grid layout
  - Add Widget: Chart / Table / Gauge / KPI Card
  - Widget 설정 (datasource, metric, timerange override)
```

### 6. Integrations
```
Section 1: Available Integrations
  - Slack
  - PagerDuty
  - Webhook
  - Email
  - (각 카드)

Section 2: Installed Integrations
  - 설정된 통합 리스트
  - 테스트 버튼
  - 재설정 / 삭제
```

### 7. Settings
```
Section 1: Profile
  - Name, Email
  - API Key 관리

Section 2: Workspace
  - Members 관리
  - Role (Admin / Editor / Viewer)
  - 2FA 설정

Section 3: Preferences
  - Theme (Light / Dark / Auto)
  - 언어
  - 알림 설정

Section 4: Data Retention
  - 일별 보관 기간
  - 조직 규정 표시
```

---

## 👥 사용자 흐름

### Flow 1: 에러 탐지 → 원인 분석(AI) → 로그/트레이스

```
1. Overview 페이지
   ├─ KPI "Error Rate" 증가 감지
   └─ (또는 알림 수신)

2. 원인 탐색 (우측 AI Chat Drawer)
   ├─ "Why did error rate spike at 14:30?"
   ├─ AI가 context (시간, 서비스) 자동 감지
   ├─ AI 응답: "Pod restart detected in api-service"
   └─ "[View related logs]" 링크

3. Logs 페이지로 이동
   ├─ 필터: service=api-service, level=ERROR
   ├─ 시간: 14:25-14:35 (자동 설정)
   ├─ 로그에서 trace_id 발견
   └─ "[View trace]" 버튼

4. Traces 페이지로 이동
   ├─ Trace ID로 필터링
   ├─ Waterfall 시각화로 느린 span 확인
   ├─ Database query 시간 초과 발견
   └─ AI Chat: "Query took 45s (p99=100ms). Check DB?"
```

### Flow 2: 대시보드 이상 지표 → 알림 생성 → Slack 연결

```
1. 대시보드에서 이상 지표 발견 (매뉴얼 또는 자동)
   ├─ CPU 사용율 85% 이상
   ├─ 우측 메뉴: "[Create Alert]"
   └─ Alert 모달 열기

2. Alert 생성
   ├─ Condition: avg(cpu) > 80 for 5min
   ├─ Trigger: 즉시 또는 3회 연속
   ├─ Action: Slack Notification
   └─ "[Test Alert]" + "[Save]"

3. Slack 연결 (첫 사용)
   ├─ Settings → Integrations
   ├─ "Slack" 선택
   ├─ "[Install Slack App]" (OAuth 팝업)
   ├─ "#monitoring" 채널 선택
   └─ "[Authorize]"

4. Alert 전송 확인
   ├─ Slack에 Alert 메시지 수신
   ├─ 메시지 내: metric value + graph thumbnail + 대시보드 링크
   └─ Slack에서 클릭 → 대시보드로 이동
```

### Flow 3: 로그에서 Trace ID로 트레이스 추적

```
1. Logs 페이지
   ├─ 에러 로그 한 줄 찾음
   └─ Message: "Request failed | trace_id=abc123def456"

2. 로그 상세보기 (Row 클릭 or 우측 드로어)
   ├─ JSON metadata 표시
   ├─ trace_id 필드 강조
   ├─ trace_id에 마우스: "[View trace]" link 나타남
   └─ 클릭

3. Traces 페이지로 이동 (자동 필터)
   ├─ URL: /traces?traceId=abc123def456
   ├─ Trace 상세 로드 (또는 이미 표시)
   ├─ Waterfall 보기:
   │  ├─ Web Request (300ms)
   │  ├─ API Call (200ms)
   │  │  ├─ DB Query (190ms) ← 병목
   │  │  └─ Cache (5ms)
   │  └─ Response (10ms)
   └─ 이상 지점 명확

4. 추가 분석 (AI Chat)
   ├─ "Why is DB query so slow?"
   ├─ AI: "Query hit N+1 issue. See SQL: SELECT * ..."
   └─ 해결책 제시
```

---

## 🎪 Empty/Loading/Error States

### Empty State 예시
```
┌─────────────────────────────────────────┐
│                                         │
│            🎯 (Icon disabled)           │
│                                         │
│      No logs available for this         │
│      time range and filters             │
│                                         │
│  [🎨 Adjust Filters] [📚 Docs]         │
│                                         │
└─────────────────────────────────────────┘
```

### Loading State 예시
```
┌────────────────────────────────┐
│ 📊 KPI Cards                   │ ← [████░░░░] (Skeleton)
├────────────────────────────────┤
│ 📈 Error Trends Chart          │ ← [████████░]
├────────────────────────────────┤
│ 📋 Services Table              │ ← [████████░]
└────────────────────────────────┘
```

### Error State 예시
```
┌─────────────────────────────────────┐
│ ⚠️  Failed to load metrics          │
│                                     │
│ Error: API timeout (> 30s)          │
│                                     │
│ [🔄 Retry] [📞 Support] [📋 Logs]  │
└─────────────────────────────────────┘
```

---

## 🔌 컴포넌트 구현 체크리스트

- [ ] Theme provider (complete tokens)
- [ ] AppBar + Sidebar layout
- [ ] GlobalFilterBar (time, service, env, cluster)
- [ ] KPI Card component
- [ ] Data Table (sticky header, dense)
- [ ] Chart wrapper (Recharts or similar)
- [ ] AI Chat drawer component
- [ ] Alert dialog component
- [ ] Empty/Loading/Error state components
- [ ] Responsive design (mobile breakpoints)

---

## 📱 반응형 설계

```typescript
breakpoints: {
  xs: 0,    // 모바일
  sm: 640,  // 태블릿
  md: 1024, // 노트북
  lg: 1280, // 데스크탑
  xl: 1536, // 와이드
}

// Sidebar
xs-sm: 모바일 메뉴로 전환 (hamburger)
md+: Fixed sidebar

// KPI Cards
xs: 1 column
sm: 2 columns
md: 3 columns
lg+: 4 columns

// Chat Drawer
xs-md: 모바일 bottom sheet
lg+: Right drawer (400px)
```

---

## 🚀 다음 단계

1. **테마 구현** → `src/theme/theme.ts` 완성
2. **레이아웃 구현** → AppLayout, Sidebar, AppBar, GlobalFilterBar
3. **기본 페이지** → Overview, Logs, Traces (모킹 데이터)
4. **AI Chat component** 구현
5. **반응형 테스트** → 모든 breakpoint에서 검증
