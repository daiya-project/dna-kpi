---
description: dna-kpi 프로젝트의 마스터 플랜. 진행 상황, 현재 포커스, 향후 마일스톤을 추적한다.
globs: "*"
---

# 프로젝트 로드맵: DNA-KPI

## 🧠 AI 지침 (메타 규칙)
1. **컨텍스트 우선**: 코드 생성 전에 이 파일을 읽고 현재 프로젝트 단계를 파악한다.
2. **자동 갱신**: 기능 구현을 성공적으로 마친 후 반드시:
   - 해당 작업을 완료로 표시한다 (`[x]`).
   - 해당 단계가 완료되면 "Current Status"를 다음 단계로 옮긴다.
   - 사용자에게 다음 작업으로 진행할지 묻는다.

## 앱의 전체 구조

- **헤더**: Shadcn **Tabs**로 섹션 구분 — **summary**, **kr**, **us** (탭당 한 섹션).
- **상단**: 필터 및 테이블 컨트롤 (연·분기·월 토글 등).
- **하단**: 컨텐츠 영역 — **TanStack Table**로 목표 매출, 달성 매출, 달성률, 수익률 등 메트릭 표시.

## Current Status
**Phase:** Phase 7 완료 — 전체 기간 연속 스크롤, 연도 네비게이터 스테퍼, MONTHLY 세로 라벨, YYYY-MM 열(분기 합산 없음), 가로 스크롤 스파이  
*(현재 단계가 바뀔 때 이 줄을 갱신한다.)*

## Implementation Phases

### Phase 0 — Foundation
- [x] 프로젝트 셋업 (Next.js, Supabase, Tailwind, Shadcn/ui)
- [x] DB 타입 생성 및 app-db 타입 정렬
- [x] dna_kpi 스키마 / monthly_kpi 테이블 정의 (41-data-structure 참조; 본 프로젝트는 인증 없음)

### Phase 1 — Data & API
- [x] lib/api KPI fetch (fetchMonthlyKpi)
- [x] lib/logic 집계 및 타입 (app-db.types, categories config)

### Phase 2 — UI Shell
- [x] Layout 및 globals.css
- [x] Header with Shadcn Tabs (summary, kr, us)
- [x] ControlBar (카테고리 필터), BookmarkTabs, 클라이언트 경계

### Phase 3 — Core Features
- [x] TanStack Table (목표 매출, 달성, 달성률, 수익률)
- [x] 테이블과 lib/api 데이터 연동 (서버 fetch, buildKpiTableSections)
- [x] 카테고리 섹션 및 소계 행; 월/분기/YTD 컬럼

### Phase 4 — Summary & Filters
- [x] API 실데이터 기반 Summary 카드
- [x] Zustand store (대시보드 필터: region); URL과 region 동기화
- [x] Region 필터 → URL 갱신 → 서버 리패치; 연도는 스크롤 전용(리패치 없음)

### Phase 5 — UX
- [x] Scroll spy (IntersectionObserver, useEffect cleanup) — 세로(카테고리 섹션)
- [x] Loading (Suspense + DashboardPageSkeleton), 에러 상태
- [x] 헤더 연도 네비게이터 스테퍼 ([<] 연도 [>]); 연도 컬럼으로 스크롤, 데이터 재로드 없음

### Phase 6 — Glassmorphism & Table UX
- [x] Glassmorphism(참조): 테이블 스타일(max-w-7xl, backdrop-blur, border-glass), CategoryConfig.gradient
- [x] v0 UI 이식 Phase 1: Framer Motion(BookmarkTabs, KpiTable), ControlBar, Summary 스타일
- [x] (이전) 분기 접기·펼치기, CSS 프로그레스 바 → 이후 월별 열 전용 구조로 전환

### Phase 7 — All-Year Continuous Scroll
- [x] Data: 연도 필터 제거; fetchMonthlyKpi 전체 기간 로드, buildMonthlyTableSections(rows) without year
- [x] 테이블 열: YYYY-MM만(과거→최신), 분기 합산 열 없음; getMonthsFromRows / getMonthsForYear
- [x] Year Navigator: Select 제거 → Stepper [<] year [>]; 클릭 시 #col-year-YYYY로 스무스 스크롤(재로드 없음)
- [x] Horizontal scroll spy: 가로 스크롤 시 네비게이터 연도 자동 갱신(getBoundingClientRect)
- [x] Vertical Section Label: 각 섹션 좌측 "MONTHLY" 세로 라벨(rowSpan, writing-mode vertical, bg-muted/30)
- [x] Sticky: Section Label 열 + Metric 열 좌측 고정(overflow-x-auto 내)

## Future Milestones
- [x] Glassmorphism(참조) 적용(docs): gradient, 테이블 스타일
- [x] v0 UI 이식 Phase 1 (temp/v0-ui-migration-spec.md)
- [x] All-year continuous scroll + Year Navigator stepper + MONTHLY vertical label
- [ ] *(다음 계획 기능을 여기에 추가한다.)*
