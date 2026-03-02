# 🔍 LogTech - Observability Dashboard Design System

> **B2B SaaS Observability 대시보드** | Datadog 유사 UI/UX | MUI 기반 | 전문가용 + AI 중심

---

## 📌 개요

이 프로젝트는 **엔지니어링 팀을 위한 전문 Observability 도구**의 완전한 디자인 시스템입니다.

### 핵심 특징
- ✨ **전문가용 인터페이스** - 신뢰성 있고 정보 과밀 없음
- 🤖 **AI 중심 설계** - 모든 페이지에서 쉽게 접근 가능한 AI 어시스턴트
- 🎨 **현대적 디자인** - 다크모드 기본, Material Design 3 + MUI
- 🔗 **자연스러운 흐름** - 에러 탐지 → 원인 분석 → 로그/트레이스 → 조치
- 📊 **시각화 중심** - 메트릭, 로그, 트레이스의 원활한 드릴다운

---

## 📚 문서 구조

### 1. **디자인 시스템** (`DESIGN_SYSTEM.md`)
완전한 UI/UX 가이드 - **여기서 시작하세요**

```
📄 DESIGN_SYSTEM.md
├── 🎨 색상 시스템 (다크/라이트 paletee)
├── 🔤 타이포그래피 (7개 계층)
├── 📐 Spacing Grid (8px base)
├── 🧩 컴포넌트 라이브러리 (10개 타입)
├── 🎭 의미론적 색상 (에러, 경고, 성공)
├── 📄 페이지별 구조
├── 👥 사용자 흐름 (3개 시나리오)
└── 🎪 Empty/Loading/Error States
```

**각 섹션별 상세 내용:**
- Palette: Purple (AI), Cyan (데이터), Neutral 그리드
- Typography: Display, H1-H3, Body Large/Regular/Small, Caption, Mono
- Spacing: xs(4px) ~ 2xl(48px)
- Components: AppBar, Sidebar, Card, KPI Card, Table, Chart, AI Chat, Alert, Empty State

### 2. **사용자 흐름** (`USER_FLOWS.md`)
3가지 핵심 작업 시나리오 - **실제 사용 사례 학습**

```
📄 USER_FLOWS.md
├── Flow 1: 에러 탐지 → 원인 분석(AI) → 로그 → 트레이스
│   └─ 실제 수행 단계 + 스크린샷 + JSON 데이터 예시
│
├── Flow 2: 메트릭 이상 → 알림 생성 → Slack 연결
│   └─ Alert modal + OAuth + Slack payload 예시
│
├── Flow 3: 로그에서 traceId → 트레이스 추적
│   └─ Drawer → Waterfall 시각화
│
└── 데이터 흐름 다이어그램
```

**각 흐름에 포함:**
- 상세한 단계별 설명 + UI 모형
- 관련 JSON 데이터 구조
- 실제 메시지/알림 형식

### 3. **구현 가이드** (`IMPLEMENTATION_GUIDE.md`)
개발자용 단계별 지침 - **코드 작성 시작**

```
📄 IMPLEMENTATION_GUIDE.md
├── ✅ 현재 완료 상황 (6개 섹션)
├── 🚀 다음 구현 단계 (Phase 1-3)
│   ├── Phase 1: 추가 페이지 (Logs, Traces, Metrics...)
│   ├── Phase 2: 차트 & 시각화
│   └── Phase 3: 고급 기능 (실시간, 협업)
├── 🔌 필요한 라이브러리
├── 🎯 구현 우선순위 (5주 로드맵)
├── 📱 반응형 설계 체크리스트
└── 🧪 테스트 & 트러블슈팅
```

---

## 🗂️ 구조

### 폴더 구성
```
frontend/
├── src/
│   ├── app/
│   │   ├── page.tsx                    (Overview)
│   │   ├── layout.tsx                  (Root layout + Theme)
│   │   ├── providers.tsx               (Context providers)
│   │   ├── logs/page.tsx               (Logs 페이지)
│   │   ├── metrics/page.tsx            (Metrics 페이지)
│   │   ├── traces/page.tsx             (Traces 페이지)
│   │   ├── dashboards/page.tsx         (Dashboards 페이지)
│   │   └── integrations/slack/page.tsx (Slack 연결)
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx           ✅ 완성
│   │   │   ├── AppBar.tsx / TopBar.tsx ✅ 완성 (TopBar)
│   │   │   ├── Sidebar.tsx             ✅ 완성
│   │   │   └── GlobalFilterBar.tsx     ✅ 완성
│   │   │
│   │   ├── chat/
│   │   │   └── AiChatDrawer.tsx        ✅ 완성
│   │   │
│   │   ├── KPICard.tsx                 ✅ 완성
│   │   │
│   │   ├── tables/
│   │   │   └── LogsTable.tsx           (Logs 테이블)
│   │   │
│   │   ├── charts/
│   │   │   ├── LineChart.tsx           (Recharts)
│   │   │   ├── BarChart.tsx
│   │   │   ├── GaugeChart.tsx
│   │   │   └── HeatmapChart.tsx
│   │   │
│   │   └── common/
│   │       ├── EmptyState.tsx
│   │       ├── LoadingState.tsx
│   │       └── ErrorState.tsx
│   │
│   ├── features/
│   │   ├── overview/
│   │   │   └── OverviewPage.tsx        ✅ 완성
│   │   ├── logs/
│   │   │   └── LogsPage.tsx
│   │   ├── traces/
│   │   │   └── TracesPage.tsx
│   │   ├── metrics/
│   │   │   └── MetricsPage.tsx
│   │   ├── dashboards/
│   │   │   └── DashboardsPage.tsx
│   │   ├── integrations/
│   │   │   └── SlackIntegrationPage.tsx
│   │   ├── settings/
│   │   │   └── SettingsPage.tsx
│   │   └── ai/
│   │       └── AiPage.tsx
│   │
│   ├── lib/
│   │   ├── types.ts                    ✅ 완성 (확장됨)
│   │   ├── mock.ts                     ✅ 완성 (대폭 확장)
│   │   └── apiClient.ts                (향후 구현)
│   │
│   └── theme/
│       └── theme.ts                    ✅ 완성 (전체 토큰)
│
├── public/
│   └── data/
│       ├── logs-example.json           ✅ 생성됨
│       ├── metrics-example.json        ✅ 생성됨
│       ├── trace-example.json          ✅ 생성됨
│       ├── dashboards-example.json     ✅ 생성됨
│       └── alerts-example.json         ✅ 생성됨
│
├── DESIGN_SYSTEM.md                    ✅ 완성 (21 섹션)
├── USER_FLOWS.md                       ✅ 완성 (3 Flow + 분석)
├── IMPLEMENTATION_GUIDE.md             ✅ 완성 (5주 로드맵)
└── README.md                           (이 파일)
```

### 완료/미완료 상황
```
✅ 완료된 것
├── MUI 테마
├── 디자인 토큰
├── 타입 정의
├── Mock 데이터
├── JSON 예시
├── 핵심 컴포넌트 (6개)
├── Overview 페이지
└── 모든 문서

⏳ 구현 중 (다음 단계)
├── Logs / Traces / Metrics 페이지
├── 차트 시각화
├── Dashboards / Alerts 페이지
├── Integrations / Settings 페이지
└── 실시간 업데이트
```

---

## 🚀 빠른 시작

### 1️⃣ 프로젝트 구조 이해
```bash
# 디자인 시스템 읽기 (15분)
cat DESIGN_SYSTEM.md

# 사용자 흐름 이해 (20분)
cat USER_FLOWS.md

# 구현 가이드 확인 (10분)
cat IMPLEMENTATION_GUIDE.md
```

### 2️⃣ 현재 코드 확인
```bash
# 테마 확인
cat src/theme/theme.ts

# Mock 데이터 확인
cat src/lib/mock.ts

# 구현된 컴포넌트 확인
ls -la src/components/layout/
ls -la src/components/chat/
cat src/components/KPICard.tsx
```

### 3️⃣ 개발 서버 실행
```bash
npm install
npm run dev
# → http://localhost:3000
```

### 4️⃣ 페이지 둘러보기
- `/` (Overview) - ✅ 구현 완료
- `/logs` - 다음 구현 대상
- `/traces` - 다음 다음 구현
- `/metrics` - 우선순위 중
- `/dashboards` - 우선순위 중
- `/settings` - 우선순위 낮음

---

## 🎨 디자인 하이라이트

### 색상 시스템
```
🟣 Purple (#8B5CF6)
  └─ AI, 주요 CTA, 활성 상태

🩵 Cyan (#22D3EE)
  └─ 데이터, 강조, 보조

🟢 Green (#10B981)
  └─ 성공, 정상, 활성

🟡 Amber (#F59E0B)
  └─ 경고, 주의

🔴 Red (#EF4444)
  └─ 에러, 치명적

⚪ Neutral (950~50)
  └─ 배경, 텍스트, 테두리
```

### 핵심 컴포넌트
```
AppBar (48px)
  ├─ Logo + Title
  ├─ Theme toggle
  ├─ Notifications
  └─ User menu

Sidebar (280px, 고정)
  ├─ Navigation (6개 그룹)
  ├─ AI Assistant 버튼
  └─ About

GlobalFilterBar (꼬정, 56px)
  ├─ Time Range
  ├─ Service (다중선택)
  ├─ Environment (다중선택)
  └─ Cluster (다중선택)

Main Content
  ├─ KPI Cards (4개 병렬)
  ├─ Metrics Charts
  ├─ Data Tables (sticky header)
  └─ Alert List

AI Chat Drawer (우측, 400px)
  ├─ Conversation history
  ├─ Context awareness
  └─ Action links
```

---

## 📊 JSON 데이터

### public/data/ 에 5개 파일

#### 1. logs-example.json
```json
{
  "logs": [
    {
      "id": "log-001",
      "timestamp": "2026-03-02T10:30:21Z",
      "service": "checkout",
      "level": "ERROR",
      "message": "Payment provider timeout",
      "metadata": {
        "traceId": "trace-001-001",  // ← 중요: Traces로 연결
        "requestId": "req-abc123",
        "userId": "user-12345"
      }
    }
  ]
}
```

#### 2. metrics-example.json
```json
{
  "metrics": [
    {
      "name": "error_rate",
      "service": "checkout",
      "unit": "%",
      "timeseries": [
        { "timestamp": "2026-03-02T10:00:00Z", "value": 1.2 },
        { "timestamp": "2026-03-02T10:05:00Z", "value": 2.3 }
      ]
    }
  ]
}
```

#### 3. trace-example.json
```json
{
  "trace": {
    "id": "trace-001-001",
    "spans": [
      {
        "id": "span-1",
        "service": "api-gateway",
        "operation": "web-request",
        "duration": 520
      },
      {
        "id": "span-4-1",
        "service": "stripe",
        "operation": "call-stripe",
        "duration": 230  // ← 병목
      }
    ],
    "analysis": {
      "bottlenecks": [
        {
          "spanId": "span-4-1",
          "reason": "External API latency (Stripe)"
        }
      ]
    }
  }
}
```

#### 4. dashboards-example.json
```json
{
  "dashboards": [
    {
      "id": "db-checkout-health",
      "name": "Checkout Service Health",
      "widgets": [
        {
          "type": "kpi",
          "title": "Error Rate",
          "config": { "metric": "error_rate" }
        }
      ]
    }
  ]
}
```

#### 5. alerts-example.json
```json
{
  "alerts": [
    {
      "id": "alert-001",
      "name": "High Error Rate",
      "condition": {
        "metric": "error_rate",
        "operator": ">",
        "value": 5
      },
      "actions": [
        { "type": "slack", "target": "#alerts" }
      ]
    }
  ]
}
```

---

## 🔑 핵심 코드 위치

### 1. 테마 커스터마이징
📍 `src/theme/theme.ts`
- 색상 토큰
- 타이포그래피 정의
- 컴포넌트별 스타일

### 2. 타입 정의
📍 `src/lib/types.ts`
- LogEntry, MetricSeries, Trace
- Dashboard, Alert, Integration
- AiMessage, GlobalFilterState

### 3. Mock 데이터
📍 `src/lib/mock.ts`
- mockLogs, mockMetrics, mockTraces
- mockDashboards, mockAlerts
- globalFilterOptions

### 4. 레이아웃 컴포넌트
📍 `src/components/layout/`
- AppLayout.tsx (전체)
- Sidebar.tsx (280px)
- TopBar.tsx (48px)
- GlobalFilterBar.tsx (꼬정)

### 5. AI Chat
📍 `src/components/chat/AiChatDrawer.tsx`
- 메시지 히스토리
- 컨텍스트 감지
- 액션 링크

### 6. 페이지
📍 `src/features/*/`
- OverviewPage.tsx (완성)
- LogsPage.tsx (다음)
- TracesPage.tsx, MetricsPage.tsx 등

---

## 🎯 주요 설계 원칙

### 1. **정보 과밀 회피**
- 중요한 KPI만 우선 표시
- 추가 상세 정보는 드로어/모달에서
- 한 화면 = 한 작업

### 2. **AI 중심**
- 모든 페이지에서 AI Chat에 쉽게 접근 (우측 Drawer)
- 컨텍스트 자동 감지 (현재 필터, 페이지)
- AI 응답에서 행동 가능한 링크

### 3. **자연스러운 흐름**
```
Error Detected
    ↓
AI Analysis (원인 파악)
    ↓
View Related Logs (상세 정보)
    ↓
Follow TraceID (전체 요청 추적)
    ↓
Identify Bottleneck (병목 지점)
    ↓
Take Action (알림 생성, 공유)
```

### 4. **신뢰성 있는 비주얼**
- 과한 그림자 금지 (border로만 구획)
- 색상 = 신호 (상태, 심각도, 행동)
- 다크모드 기본 (24h 운영 고려)
- 높은 대비도 (WCAG AA+)

---

## 📖 다음 단계

### 개발자용
1. `IMPLEMENTATION_GUIDE.md` 읽기
2. Phase 1 페이지 구현 (Logs, Traces, Metrics)
3. 차트 라이브러리 통합 (Recharts)
4. E2E 테스트

### 디자이너용
1. `DESIGN_SYSTEM.md` 레퍼런스
2. Figma / Sketch로 목업 제작 가능
3. 반응형 레이아웃 테스트
4. 색상 대비도 검증

### 제품 팀용
1. `USER_FLOWS.md`에서 사용자 경험 이해
2. JSON 데이터 형식 확인
3. API 스펙 설계
4. 베타 테스트 계획

---

## 🔗 관련 문서

| 문서 | 용도 | 대상자 |
|------|------|--------|
| `DESIGN_SYSTEM.md` | 완전한 UI/UX 가이드 | 디자이너, PM |
| `USER_FLOWS.md` | 사용자 시나리오 + 데이터 예시 | 모두 |
| `IMPLEMENTATION_GUIDE.md` | 개발 로드맵 + 코드 가이드 | 개발자 |

---

## 💡 팁 & 트릭

### 다크모드 자유롭게 토글
```typescript
// 모든 페이지에서 TopBar의 아이콘으로 토글 가능
// 상태가 자동으로 저장됨 (향후: localStorage)
```

### 컨텍스트 자동 감지
```typescript
// AI Chat이 현재 페이지의 필터를 자동으로 감지
// 예: "/logs?service=checkout" → AI가 checkout 컨텍스트로 응답
```

### 빠른 드릴다운
```typescript
// 테이블 row 클릭 → 상세보기
// → Trace ID 클릭 → Traces 페이지
// 모든 링크가 URL 파라미터로 필터를 자동 적용
```

---

## ❓ FAQ

**Q: API는 어디에?**
A: 현재 Mock 데이터를 사용합니다. `src/lib/apiClient.ts`에 백엔드 API 연결 예정입니다.

**Q: 실시간 업데이트는?**
A: Phase 3에서 WebSocket 추가 예정입니다.

**Q: 커스텀 대시보드는?**
A: `react-grid-layout`을 사용해 드래그 앤 드롭 에디터 구현 예정입니다.

**Q: 공동 작업 기능은?**
A: 대시보드/알림 공유, 댓글 기능은 Advanced Phase입니다.

---

## 📞 지원

문제 또는 질문:
1. `DESIGN_SYSTEM.md`의 해당 섹션 확인
2. `USER_FLOWS.md`에서 유사한 흐름 찾기
3. `IMPLEMENTATION_GUIDE.md`의 트러블슈팅 섹션 확인

---

## 📄 라이선스

[MIT](LICENSE) - 자유롭게 사용, 수정, 배포하세요.

---

**버전**: 1.0.0 | **마지막 수정**: 2026-03-02 | **상태**: 활발히 개발 중 🚀

