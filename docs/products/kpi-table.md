# KPI Table

## Document info
- **Created:** 2025-02-18 00:00:00
- **Last updated:** 2025-02-18 00:00:00

## Revision history
| Date | Description |
|------|-------------|
| 2025-02-18 00:00:00 | Initial version. |

## Covered files
이 문서가 다루는 파일. **아래 파일 중 하나를 수정하면 이 문서를 갱신한다** (Last updated, Revision history, 그리고 동작/상태가 바뀌었으면 본문).

| Path | Role |
|------|------|
| `@/app/(dashboard)/dashboard/_components/KpiTable/KpiTable.tsx` | 루트 컴포넌트 |
| `@/app/(dashboard)/dashboard/_components/KpiTable/KpiTableSection.tsx` | 섹션 tbody, QUARTERLY/MONTHLY 행·접기 UI |
| `@/app/(dashboard)/dashboard/_components/KpiTable/KpiTableHeader.tsx` | 헤더, 분기 컬럼 접기 |
| `@/app/(dashboard)/dashboard/_components/KpiTable/QuarterProgressBar.tsx` | 분기별 ProgressBar |
| `@/hooks/useKpiTableCollapse.ts` | 접기/펼치기 상태 및 토글 |

## 1. Overview

- **Path:** `@/app/(dashboard)/dashboard/_components/KpiTable/KpiTable.tsx` (root). Collapse state: `@/hooks/useKpiTableCollapse.ts`. Section body: `KpiTableSection.tsx`, header: `KpiTableHeader.tsx`.
- **Purpose:** 사용자에게 카테고리별 월간 KPI(목표/실적 등)를 테이블로 보여 주고, QUARTERLY 1행 요약 뷰·MONTHLY 접기·분기(Q1/Q2 등) 컬럼 접기를 토글할 수 있게 한다.

## 2. Key Props & State

### Props (KpiTable)

| Prop | Description |
|------|-------------|
| `months` | YYYY-MM 배열. 테이블에 표시할 월 순서. |
| `sections` | `MonthlyTableSection[]`. 카테고리별 메트릭 행(목표, 실적 등). |
| `activeFilter` | 현재 하이라이트할 카테고리 ID. `null`이면 모두 강조 없음. |
| `sectionRefs` | ref 객체. 각 섹션 `<tbody>`를 등록해 스크롤/앵커용으로 사용. |
| `getCategoryConfig` | `(id: string) => TableSectionConfig \| undefined`. 카테고리별 스타일(색 등). |
| `scrollContainerRef` | 가로 스크롤 컨테이너 ref. 연도 네비게이터 scroll-to용. |

### Internal State (useKpiTableCollapse)

| State | Type | Meaning |
|-------|------|---------|
| `collapsedMonths` | `Set<string>` | MONTHLY 행 접힘. 키 예: `{categoryId}-monthly`. 포함되면 해당 섹션의 MONTHLY 블록이 한 행(접힘)으로만 표시. |
| `collapsedQuarterPeriods` | `Set<string>` | 분기 컬럼 접힘. 값 예: `q1`, `q2`, … 해당 분기의 월 컬럼이 숨겨지고 요약 컬럼만 표시. |
| `showQuarterlyProgress` | `Set<string>` | 카테고리 ID 집합. 포함된 카테고리는 QUARTERLY가 **1행 + ProgressBar** 뷰로 표시됨. 없으면 6행(메트릭별) 월값 표시. |

### Callbacks from useKpiTableCollapse

| Function | When to use |
|----------|-------------|
| `toggleMonthSection(sectionGroupId)` | MONTHLY 접힌 행의 ChevronRight 클릭 시. `sectionGroupId`는 `${categoryId}-monthly`. |
| `toggleQuarterPeriod(quarterKey)` | 헤더의 Q1 Total 등 요약 셀 클릭 시. 해당 분기 월 컬럼 접기/펼치기. |
| `toggleQuarterlyProgress(categoryId)` | QUARTERLY 라벨 셀(또는 1행 뷰의 ChevronRight) 클릭 시. 1행 뷰 ↔ 6행 뷰 전환. |

## 3. Core Logic & Interactions

- **State transitions:**
  - QUARTERLY 라벨/ChevronRight 클릭 → `onToggleQuarterlyProgress(categoryId)` → `showQuarterlyProgress`에 해당 `categoryId` 추가/제거 → 해당 섹션만 1행(ProgressBar) 또는 6행(월별 값)으로 전환.
  - MONTHLY 접힌 행의 ChevronRight 클릭 → `onToggleMonthSection(\`${categoryId}-monthly\`)` → `collapsedMonths`에서 해당 키 토글 → MONTHLY 블록 접힘/펼침.
  - 헤더 Q1 Total 등 클릭 → `onToggleQuarterPeriod(quarterId)` → `collapsedQuarterPeriods`에서 해당 분기 토글 → 해당 분기 월 컬럼 숨김/표시.
- **Helper functions:**
  - `buildDisplayColumns(months)` (`@/lib/logic/kpi-table-data`): 월 배열에서 디스플레이 컬럼(월 + Q1/Q2/Q3/Q4/Year Total) 생성.
  - `calculateQuarterAggregates(section, months, quarterId)` (KpiTableSection 내부): 해당 분기 월의 Target/Achievement 합산 → QuarterProgressBar에 전달.
  - `formatNumber` / `formatPercent` (`@/lib/number-utils`): 셀 표시.
  - `getQuarterFromMonth(ym)` (`@/lib/date-utils`): YYYY-MM → q1/q2/q3/q4.

- **Rendering flow:**
  - `KpiTable`이 `useKpiTableCollapse()`로 상태·토글을 받아 `KpiTableHeader`와 각 `KpiTableSection`에 내려준다.
  - `KpiTableSection`은 `showQuarterlyProgress.has(categoryId)`로 1행 뷰 여부를 결정하고, `collapsedMonths.has(\`${categoryId}-monthly\`)`로 MONTHLY 접힘 여부를 결정한다.
  - `KpiTableHeader`는 `collapsedQuarterPeriods`로 각 분기 컬럼 표시/숨김을 결정하고, Q1 Total 등 클릭 시 `onToggleQuarterPeriod`를 호출한다.

## 4. AI Implementation Guide (For vibe coding)

### State → Action → Implementation (required)

| State / condition | Meaning (what the user sees) | Use this function / API | Where to implement |
|-------------------|-----------------------------|--------------------------|--------------------|
| `showQuarterlyProgress.has(categoryId)` | 해당 카테고리 섹션이 QUARTERLY 1행(ProgressBar) 뷰 | `onToggleQuarterlyProgress(categoryId)` | 토글: `useKpiTableCollapse.toggleQuarterlyProgress`. 1행 렌더: `KpiTableSection.tsx` "Quarterly row group: 1 row (progress view)" 블록. 6행 렌더: 동일 파일 `isQuarterlyProgressView ? ... : (section?.rows ?? []).map(...)`. |
| `collapsedMonths.has(\`${categoryId}-monthly\`)` | 해당 카테고리의 MONTHLY 행이 접힌 상태(한 행 + ChevronRight) | `onToggleMonthSection(\`${categoryId}-monthly\`)` | 토글: `useKpiTableCollapse.toggleMonthSection`. 접힌 행 UI: `KpiTableSection.tsx` "Monthly collapsed state: show single row with chevron" 블록. |
| `collapsedQuarterPeriods.has(quarterId)` | 해당 분기(q1/q2 등)의 월 컬럼이 숨겨지고 요약만 표시 | `onToggleQuarterPeriod(quarterId)` | 토글: `useKpiTableCollapse.toggleQuarterPeriod`. 헤더: `KpiTableHeader.tsx`에서 summary 컬럼 클릭 시 `onToggleQuarterPeriod(quarterId)` 호출. Section: `KpiTableSection.tsx`의 `columnGroups` 순회 시 `isColumnHidden = collapsedQuarterPeriods.has(group.quarterId)`로 셀 표시/숨김. |

### Modification rules

- *QUARTERLY 1행/6행 전환 동작*을 바꿀 때 → `useKpiTableCollapse.toggleQuarterlyProgress`와 `KpiTableSection` 내 QUARTERLY 라벨/ChevronRight 셀의 `onClick`.
- *MONTHLY 접힌 행 UI*(아이콘, 라벨)* 를 바꿀 때 → `KpiTableSection` "Monthly collapsed state" 블록의 `TableRow`/`ChevronRight`/라벨.
- *분기 컬럼 접기(헤더)* 를 바꿀 때 → `KpiTableHeader`의 summary 컬럼 `onClick` 및 `collapsedQuarterPeriods` 사용처.
- *ProgressBar 표시*(비율/색/레이아웃)* 를 바꿀 때 → `QuarterProgressBar.tsx`와 `calculateQuarterAggregates` 결과 전달부.

### Dependencies

- `KpiTable` → `useKpiTableCollapse`, `KpiTableHeader`, `KpiTableSection`; `buildDisplayColumns` from `@/lib/logic/kpi-table-data`.
- `KpiTableSection` → `QuarterProgressBar`, `getQuarterFromMonth`, `formatNumber`/`formatPercent`, `calculateQuarterAggregates` (local).
- `KpiTableHeader` → `getQuarterFromMonth`, `DisplayColumn` type.

## 5. Edge Cases & Error Handling

- **Empty / invalid:** `sections`·`months`가 빈 배열이면 `KpiTable`은 빈 테이블을 렌더링. `calculateQuarterAggregates`는 Target/Achievement 행이 없으면 `null` 반환 → ProgressBar 대신 "—" 표시.
- **Cleanup:** 테이블 언마운트 시 `useKpiTableCollapse` 상태는 React가 정리. 별도 구독/타이머 없음.
