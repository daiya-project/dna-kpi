# KPI Card

## Document info
- **Created:** 2025-02-18 12:00:00
- **Last updated:** 2025-02-18 12:00:00

## Revision history
| Date | Description |
|------|-------------|
| 2025-02-18 12:00:00 | Initial version. |

## Covered files
이 문서가 다루는 파일. **아래 파일 중 하나를 수정하면 이 문서를 갱신한다** (Last updated, Revision history, 그리고 동작/상태가 바뀌었으면 본문).

| Path | Role |
|------|------|
| `@/app/(dashboard)/dashboard/_components/KpiTable/KpiCard.tsx` | 카테고리별 YTD 요약 카드 UI, 클릭 시 필터·스크롤 |
| `@/lib/logic/kpi-card.ts` | YTD 합계 산출: `buildSummaryYtdByCategory` |

## 1. Overview

- **Path:** `@/app/(dashboard)/dashboard/_components/KpiTable/KpiCard.tsx`. Data logic: `@/lib/logic/kpi-card.ts`.
- **Purpose:** 대시보드 상단에서 카테고리별 YTD(연초~현재) 합계를 카드로 보여 주고, 클릭 시 해당 카테고리 섹션으로 스크롤·하이라이트한다.

## 2. Key Props & State

### Props (KpiCard)

| Prop | Description |
|------|-------------|
| `category` | `CategoryConfig`의 id, label, color, lightColor, borderColor, fgColor. 카드 라벨·스타일. |
| `value` | 해당 카테고리 YTD 합계(숫자). `buildSummaryYtdByCategory` 결과. |
| `isActive` | 현재 필터로 선택된 카테고리 여부. true이면 테두리·배경 강조. |
| `onSelect` | 카드 클릭 시 콜백. 부모에서 필터 설정 + scrollIntoView 호출. |

### Data: buildSummaryYtdByCategory (lib/logic/kpi-card.ts)

| Signature | Description |
|-----------|-------------|
| `buildSummaryYtdByCategory(rows, year?)` | `MonthlyKpiRow[]`와 연도(기본: 현재 연도)로 카테고리별 YTD 합계 객체 반환. 키: `cm`, `media`, `ads`, `media-fee`. `cm = media + ads`. |

- **Input:** `rows` from API; `year` from `getCurrentYear()` or page.
- **Output:** `Record<string, number>` used as `initialSummaryYtd` in dashboard page and passed to each KpiCard as `value`.

## 3. Core Logic & Interactions

- **표시 포맷:** `formatYtdValue(value)`: `value >= 1000` → `$XXXK`, `value > 0` → `$N`, else `"—"`.
- **스타일:** `isActive`일 때 `lightColor`, `borderColor` 적용; 아니면 glass 스타일. 클릭 시 `onSelect()` 호출.
- **데이터 흐름:** Server Page에서 `fetchMonthlyKpi` → `buildMonthlyTableSections` + `buildSummaryYtdByCategory(rows, currentYear)` → `initialSummaryYtd` → DashboardPageClient → 각 카테고리별 `KpiCard`에 `value={initialSummaryYtd[cat.id] ?? 0}`.

## 4. AI Implementation Guide (For vibe coding)

### State → Action → Implementation (required)

| State / condition | Meaning | Use this function / API | Where to implement |
|-------------------|---------|--------------------------|--------------------|
| 카드 값 표시 | YTD 합계 포맷($1K, $N, —) | `formatYtdValue(value)` | `KpiCard.tsx` 내부. |
| 카드 선택(하이라이트) | 현재 필터 카테고리와 일치 | `isActive` prop | 부모: `DashboardPageClient`에서 `activeFilter === cat.id`. |
| 카드 클릭 | 해당 섹션으로 스크롤·필터 | `onSelect()` → 부모 `handleFilterChange(cat.id)` | `KpiCard.tsx`: button `onClick={onSelect}`. 부모에서 scrollIntoView. |
| YTD 집계 로직 | 연도별·카테고리별 합계 | `buildSummaryYtdByCategory(rows, year)` | Server: `page.tsx`에서 호출 후 `initialSummaryYtd`로 전달. 로직 변경: `lib/logic/kpi-card.ts`. |

### Modification rules

- **YTD 표시 형식** 변경(단위, 소수점 등) → `KpiCard.tsx`의 `formatYtdValue`.
- **카테고리 키/집계 규칙** 변경(예: 새 카테고리 추가) → `lib/logic/kpi-card.ts`의 `buildSummaryYtdByCategory` 및 `out` 초기값.
- **카드 활성/비활성 스타일** 변경 → `KpiCard.tsx`의 `className`(isActive 분기).

### Dependencies

- `KpiCard` → `CategoryConfig` from `@/lib/config/categories`; `cn` from `@/lib/utils`.
- `kpi-card.ts` → `MonthlyKpiRow` from `@/types/app-db.types`; `getCurrentYear`, `getYearFromMonth` from `@/lib/date-utils`.
