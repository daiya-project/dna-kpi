# KPI 테이블 섹션·블록별 설정 기획

## 문서 정보

- **작성일:** 2026-02-18
- **수정:** 2026-02-18 — 행(메트릭) 제어를 **블록별**로 분리: `visibleMetrics` → `visibleMetricsQuarterly` / `visibleMetricsMonthly`. 같은 섹션 내에서도 쿼터리와 먼슬리에 서로 다른 메트릭 목록 적용 가능.
- **수정:** 2026-02-18 — **확정 반영**: (1) 파일명 `categories.ts` 유지. (2) 메트릭 ID는 `target`, `daily_target`, `achievement`, `achievement_rate`, `daily_achievement`, `daily_achievement_rate` 한 세트만 사용, quarterly/monthly 블록별 분리 없음. target은 먼슬리·쿼터리 공통 ID.
- **수정:** 2026-02-18 — **블록 행 순서**: 블록 내 행 순서를 target → achievement → achievement_rate → daily_target → daily_achievement → daily_achievement_rate 로 확정.
- **목적:** 테이블 > 섹션 > 블록(쿼터리/먼슬리) 구조에서, 섹션마다·블록마다 다른 표시 설정을 효율적으로 제어하기 위한 설정 모델 및 구현 방향 정리

---

## 1. 배경 및 목적

### 현재 구조

- **테이블**: 하나의 KPI 테이블 (월 컬럼 + Q1/Q2/Q3/Q4/Year Total).
- **섹션(Section)**: 카테고리 단위(예: Contribution Margin, Media, Ads, Media Fee). 각 섹션은 하나의 `<tbody>`로 렌더링되며, **쿼터리 블록**과 **먼슬리 블록**을 가짐.
- **블록(Block)**:
  - **QUARTERLY**: 분기별 요약. 1행(ProgressBar 뷰) 또는 6행(메트릭별 월값)으로 토글 가능.
  - **MONTHLY**: 월별 상세. 6행(동일 메트릭) 또는 접힌 1행으로 토글 가능.

현재는 모든 섹션이 동일한 6개 메트릭 행(Target, Daily Target, Achievement, Achievement Rate, Daily Achievement, Daily Achievement Rate)과 동일한 블록 구성을 사용한다.

### 요구사항

- **섹션별로 다른 설정**을 두고 싶다.
  - 예: **Contribution Margin(CM)** 섹션에서는 특정 행만 숨기기 (예: Daily Target, Daily Achievement 제거).
  - 예: **FR** 섹션에서는 **쿼터리 블록 전체를 표시하지 않기** (먼슬리만 사용).
- **블록 단위 제어**: 섹션마다 “쿼터리 표시 여부”, “먼슬리 표시 여부”를 다르게 할 수 있으면 좋다.
- 설정은 **한 곳에서 선언적으로 관리**하고, 테이블/섹션 컴포넌트는 이 설정을 구독해 렌더링만 하도록 하고 싶다.

---

## 2. 목표

- **섹션별·블록별 설정**을 타입 안전하게 정의할 수 있는 **설정 모델** 설계.
- **설정 소스**는 코드(설정 파일/상수)로 두고, 필요 시 추후 DB/API로 확장 가능한 구조.
- 기존 `TableSectionConfig`(스타일)와 역할을 나누고, “표시 제어” 전용 설정을 도입.

---

## 3. 제안: 섹션 테이블 표시 설정(Section Table Display Config)

### 3.1 설정 단위

| 단위 | 의미 | 예시 |
|------|------|------|
| **섹션** | 카테고리 하나 (category id 기준) | `cm`, `ads`, `media`, `media-fee`, `fr` |
| **블록** | QUARTERLY / MONTHLY | 블록 단위로 “표시 여부” 제어 |
| **행(메트릭)** | 한 블록 내 메트릭 한 줄 | Target, Daily Target, Achievement, … |

### 3.2 제안 설정 타입 (안)

```ts
// 블록 종류
export type TableBlockType = "quarterly" | "monthly";

// 섹션별 “테이블 표시” 설정 (스타일이 아닌 표시 제어 전용)
export interface SectionTableDisplayConfig {
  /** 섹션(카테고리) id. getCategoryConfig(id)와 동일 키. */
  sectionId: string;

  /** QUARTERLY 블록 표시 여부. false면 해당 섹션에서 쿼터리 블록 전체 미렌더. 기본 true. */
  showQuarterly?: boolean;

  /** MONTHLY 블록 표시 여부. false면 해당 섹션에서 먼슬리 블록 전체 미렌더. 기본 true. */
  showMonthly?: boolean;

  /**
   * QUARTERLY 블록에서만 표시할 메트릭 행.
   * 비어 있거나 없으면 기본 6개 전체. 순서 유지.
   */
  visibleMetricsQuarterly?: readonly string[];

  /**
   * MONTHLY 블록에서만 표시할 메트릭 행.
   * 비어 있거나 없으면 기본 6개 전체. 순서 유지.
   */
  visibleMetricsMonthly?: readonly string[];
}
```

- **showQuarterly**: `false`이면 해당 섹션에서는 QUARTERLY 블록(1행 ProgressBar 뷰 포함)을 아예 그리지 않음. (FR에서 쿼터리 제거 예시에 대응.)
- **showMonthly**: `false`이면 해당 섹션에서 MONTHLY 블록 전체를 그리지 않음.
- **visibleMetricsQuarterly**: 쿼터리 블록에서만 적용. 이 섹션의 쿼터리에서 “보여줄 메트릭”만 지정. 없으면 6개 전체.
- **visibleMetricsMonthly**: 먼슬리 블록에서만 적용. 이 섹션의 먼슬리에서 “보여줄 메트릭”만 지정. 없으면 6개 전체.
- **같은 섹션 내에서도 블록마다 다르게 적용**: 예를 들어 CM에서 쿼터리는 요약용으로 Target/Achievement만, 먼슬리는 Daily 포함 전체를 보여주는 식으로 블록별로 다른 행 목록을 줄 수 있음.

### 3.3 기본값

| 필드 | 기본값 | 비고 |
|------|--------|------|
| `showQuarterly` | `true` | 미지정 시 쿼터리 블록 표시 |
| `showMonthly` | `true` | 미지정 시 먼슬리 블록 표시 |
| `visibleMetricsQuarterly` | (전체 6개) | 미지정 시 쿼터리 블록에서 6개 메트릭 전체 표시 |
| `visibleMetricsMonthly` | (전체 6개) | 미지정 시 먼슬리 블록에서 6개 메트릭 전체 표시 |

### 3.4 블록 행 순서 (확정)

- QUARTERLY / MONTHLY 블록 공통으로, 행은 아래 **순서**로 표시함.
  1. `target` — Target
  2. `achievement` — Achievement
  3. `achievement_rate` — Achievement Rate
  4. `daily_target` — Daily Target
  5. `daily_achievement` — Daily Achievement
  6. `daily_achievement_rate` — Daily Achievement Rate

---

## 4. 설정 소스 및 배치

### 4.1 설정 파일 위치 (제안)

- **경로**: `lib/config/kpi-table-sections.ts` (신규)  
  또는 기존 `lib/config/categories.ts`에 “표시 설정”을 붙이지 않고, **표시 전용 설정을 별도 파일**로 두는 것을 권장.  
  - 이유: `categories`는 스타일·라벨 등 “카테고리 정의”에 집중하고, “테이블에서 어떻게 보일지”는 별도 계층으로 두면 책임이 분리됨.

**역할 구분 상세**

- **categories.ts**: "어떤 섹션(카테고리)이 **존재하는지**"와 각 카테고리의 **정체성·스타일**(id, label, shortLabel, color, borderColor, gradient 등)을 정의. ControlBar, BookmarkTabs, 요약 카드, 테이블 헤더 색 등 **대시보드 전반**에서 공통 사용. 즉 **섹션 카테고리만** 여기서 정함.
- **kpi-table-sections.ts**: "**KPI 테이블** 안에서 각 섹션을 **어떻게 보여줄지**"만 담당. 어떤 블록(QUARTERLY/MONTHLY)을 켜고, 각 블록에 어떤 메트릭 행을 보여줄지. "이 섹션은 쿼터리 숨기고, 이 섹션은 이 메트릭만" 같은 **테이블 뷰 규칙**만 정의.
- 정리: **보여줄 섹션 목록**은 데이터/페이지에서 정하고, **각 섹션의 블록·행 표시 방식**만 `kpi-table-sections.ts`에서 정함.

**파일명 (확정)**

- **`categories.ts` 유지.**  
  대시보드 전반(ControlBar, BookmarkTabs, 요약 카드, 테이블 헤더 색 등)에서 쓰이는 공통 카테고리 정의이므로, KPI 테이블 전용으로 오해될 수 있는 `kpi-table-categories.ts`로 변경하지 않음. `kpi-table-*` 접두사는 테이블 표시 규칙 전용인 `kpi-table-sections.ts`에만 둠.

### 4.2 설정 구조 예시

```ts
// lib/config/kpi-table-sections.ts

import type { SectionTableDisplayConfig } from "@/types/..."; // 또는 로컬 타입

const SECTION_TABLE_DISPLAY_CONFIGS: SectionTableDisplayConfig[] = [
  {
    sectionId: "cm",
    showQuarterly: true,
    showMonthly: true,
    // 쿼터리는 요약만, 먼슬리는 Daily 포함 전체 등 블록별로 다르게 지정 가능 (행 순서: target → achievement → achievement_rate → daily_*)
    visibleMetricsQuarterly: ["target", "achievement", "achievement_rate"],
    visibleMetricsMonthly: ["target", "achievement", "achievement_rate", "daily_target", "daily_achievement", "daily_achievement_rate"],
  },
  {
    sectionId: "fr",
    showQuarterly: false,  // FR은 쿼터리 블록 없음
    showMonthly: true,
  },
  // ads, media, media-fee 등은 설정 생략 → 전부 기본값(블록·행 전체 표시)
];

export function getSectionTableDisplayConfig(sectionId: string): SectionTableDisplayConfig | undefined {
  return SECTION_TABLE_DISPLAY_CONFIGS.find((c) => c.sectionId === sectionId);
}
```

- CM: 쿼터리 블록은 **표시 행만** Target, Achievement, Achievement Rate. 먼슬리 블록은 별도로 지정(위 예는 전체). 같은 섹션 내에서 블록마다 다른 행 목록 가능.
- FR: **쿼터리 블록 비표시**, 먼슬리만 표시.
- 나머지 섹션: 설정 없음 → 기본값으로 블록·행 전체 표시.

---

## 5. 데이터 흐름 및 사용처

### 5.1 흐름

1. **페이지/클라이언트**: `getSectionTableDisplayConfig(categoryId)`로 섹션별 표시 설정 조회 (또는 테이블 진입 전에 맵으로 한 번에 구성).
2. **KpiTable**: `sections`를 돌릴 때 각 `categoryId`에 대해 `SectionTableDisplayConfig`를 resolve해서 `KpiTableSection`에 전달.
3. **KpiTableSection**:
   - `showQuarterly === false` → QUARTERLY 블록 전체를 렌더하지 않음.
   - `showMonthly === false` → MONTHLY 블록 전체(접힌 행 포함)를 렌더하지 않음.
   - **쿼터리 블록**: `visibleMetricsQuarterly`가 있으면 해당 목록으로 `section.rows`를 필터/정렬해 쿼터리 블록만 렌더.
   - **먼슬리 블록**: `visibleMetricsMonthly`가 있으면 해당 목록으로 `section.rows`를 필터/정렬해 먼슬리 블록만 렌더.  
   → 같은 섹션이라도 블록마다 다른 행 집합을 사용할 수 있음.

### 5.2 KpiTableSection에 넘길 props (추가분)

- `displayConfig: SectionTableDisplayConfig | undefined`  
  또는 개별 필드:
  - `showQuarterlyBlock: boolean`
  - `showMonthlyBlock: boolean`
  - `visibleMetricsQuarterly: readonly string[] | undefined` (undefined = 쿼터리 블록 전체)
  - `visibleMetricsMonthly: readonly string[] | undefined` (undefined = 먼슬리 블록 전체)

기존 `TableSectionConfig`(스타일)와 이름이 겹치지 않도록, “표시 제어”용이라면 `displayConfig` 또는 `sectionDisplayConfig` 같은 이름을 쓰는 것이 좋다.

### 5.3 행 필터링 위치 (블록별 적용)

- **옵션 A**: `KpiTable`에서 각 섹션에 대해 **블록별로** rows를 필터한 결과를 넘김.  
  - 예: `rowsForQuarterly = filterRows(section.rows, displayConfig.visibleMetricsQuarterly)`, `rowsForMonthly = filterRows(section.rows, displayConfig.visibleMetricsMonthly)`  
  - Section에는 `quarterlyRows`와 `monthlyRows`를 각각 전달. Section은 받은 rows만 그대로 렌더.
- **옵션 B**: `KpiTableSection`에 `section.rows`와 `visibleMetricsQuarterly`/`visibleMetricsMonthly`를 넘기고, Section 내부에서 쿼터리/먼슬리 렌더 시점에 각각 필터링.  
  - Section이 블록별 표시 규칙을 알고 있어야 함.

권장: **옵션 A**. 테이블 레벨에서 블록별로 “이 섹션의 쿼터리용 rows”, “이 섹션의 먼슬리용 rows”를 만들어 전달하면 Section은 “쿼터리 블록에는 quarterlyRows, 먼슬리 블록에는 monthlyRows만 그린다”로 일관되게 유지할 수 있음.

---

## 6. 구현 시 고려사항

### 6.1 메트릭 이름 일관성 (확정)

**메트릭 ID: 한 세트만 사용, 블록(quarterly/monthly)과 분리**

- 메트릭 ID는 **한 세트만** 사용하며, QUARTERLY/MONTHLY 블록에 따라 ID를 나누지 **않음**. 예: `target`은 먼슬리 블록의 Target 행이자 쿼터리 블록의 Target 행 **둘 다**에 쓰이는 동일 ID. 블록별 노출 여부만 `visibleMetricsQuarterly` / `visibleMetricsMonthly`로 제어함.
- **사전 정의 후 공통 사용**: 아래 ID를 한 곳에 상수로 정의하고, 데이터 빌드·섹션 설정·필터링 모두에서 동일 상수 사용. `MonthlyMetricRow.metric` 및 `visibleMetricsQuarterly` / `visibleMetricsMonthly`는 이 ID 문자열과 매칭.

**확정 메트릭 ID (snake_case) 및 블록 내 행 순서**

- 블록 내 행 순서는 **3.4**와 동일: `target` → `achievement` → `achievement_rate` → `daily_target` → `daily_achievement` → `daily_achievement_rate`.

| 순서 | ID | 표시 라벨 |
|------|-----|----------------------------------|
| 1 | `target` | Target |
| 2 | `achievement` | Achievement |
| 3 | `achievement_rate` | Achievement Rate |
| 4 | `daily_target` | Daily Target |
| 5 | `daily_achievement` | Daily Achievement |
| 6 | `daily_achievement_rate` | Daily Achievement Rate |

- **표시 라벨**: **ID → 라벨 맵**(예: `METRIC_DISPLAY_LABELS`)으로 두고, `row.metric`에는 ID만 저장. 렌더 시 해당 라벨을 그대로 사용.

**확정 사항 (quarterly/monthly 분리 없음)**

- 메트릭 ID는 블록과 분리해 **한 세트만** 둠. target은 먼슬리 타겟이자 쿼터리 타겟에 동일 ID로 쓰이며, 블록별 노출만 `visibleMetricsQuarterly` / `visibleMetricsMonthly`로 제어함.

```ts
// 확정: 내부 ID(snake_case) 한 세트 + 블록 내 행 순서 + 기본 표시 라벨 맵
/** 블록 내 행 순서 (target → achievement → achievement_rate → daily_* ). */
export const METRIC_IDS = [
  "target", "achievement", "achievement_rate",
  "daily_target", "daily_achievement", "daily_achievement_rate",
] as const;
export type MetricId = (typeof METRIC_IDS)[number];

/** 메트릭별 표시 라벨 */
export const METRIC_DISPLAY_LABELS: Record<MetricId, string> = {
  target: "Target",
  achievement: "Achievement",
  achievement_rate: "Achievement Rate",
  daily_target: "Daily Target",
  daily_achievement: "Daily Achievement",
  daily_achievement_rate: "Daily Achievement Rate",
};
```

### 6.2 빈 행 목록

- `visibleMetricsQuarterly: []`이면 해당 섹션의 **쿼터리 블록**만 “행이 없음”.  
- `visibleMetricsMonthly: []`이면 해당 섹션의 **먼슬리 블록**만 “행이 없음”.  
  - 정책: 해당 블록은 **블록 자체를 그리지 않음**으로 처리할지, “0행”으로 빈 공간만 둘지 결정 필요.  
  - 제안: 빈 배열이면 해당 블록은 `showQuarterly`/`showMonthly`와 관계없이 렌더하지 않는 것으로 간주.

### 6.3 접기 상태와의 관계

- `useKpiTableCollapse`의 `collapsedMonths`, `showQuarterlyProgress` 등은 **사용자 토글 상태**.
- `SectionTableDisplayConfig`는 **섹션별 기본 표시 규칙** (어떤 블록/행을 아예 제공할지).
- “FR은 쿼터리를 아예 안 보여준다”는 설정이면, 해당 섹션에 대해서는 `showQuarterlyProgress` 토글 자체가 의미 없음 (블록이 없으므로).  
  → 구현 시 해당 섹션에 대해 QUARTERLY 관련 토글 UI를 노출하지 않으면 됨.

### 6.4 확장 (추후)

- **기본 접기 상태**: 예를 들어 “이 섹션은 처음부터 MONTHLY 접힌 상태” 같은 건, `SectionTableDisplayConfig`에 `defaultCollapsedMonthly?: boolean` 등을 두고, 초기 상태만 `useKpiTableCollapse`에 반영하는 방식으로 확장 가능.
- 설정 소스를 나중에 DB/API로 옮기더라도, 타입과 “표시 여부 + 블록별 visibleMetrics” 인터페이스는 그대로 두고 resolver만 `getSectionTableDisplayConfig`를 API 호출로 바꾸면 됨.

---

## 7. 예시 시나리오 요약

| 섹션 | 목표 | 설정 |
|------|------|------|
| **Contribution Margin (CM)** | 쿼터리는 요약만, 먼슬리는 Daily 포함 전체 등 **블록마다 다른 행** | `visibleMetricsQuarterly`: 요약용 3개, `visibleMetricsMonthly`: 전체 6개 또는 별도 목록 |
| **FR** | 쿼터리 블록 제거, 먼슬리만 사용 | `showQuarterly: false`, `showMonthly: true` |
| **Ads / Media / Media Fee** | 기존과 동일 (전체 블록·전체 행) | 설정 없음 → 기본값 |

- 모든 블록에서 **행 순서**는 target → achievement → achievement_rate → daily_target → daily_achievement → daily_achievement_rate.

---

## 8. 체크리스트 (구현 전 확인)

- [ ] `SectionTableDisplayConfig` 타입 정의 위치 확정 (예: `types/` 또는 `lib/config/` 내 타입 파일). 블록별 필드 `visibleMetricsQuarterly`, `visibleMetricsMonthly` 포함.
- [ ] `lib/config/kpi-table-sections.ts` 생성 및 `getSectionTableDisplayConfig(sectionId)` 구현.
- [ ] 메트릭 이름 상수 공통화 (필터/표시 설정과 데이터 빌드가 동일 이름 사용).
- [ ] KpiTable에서 섹션별 displayConfig resolve 후, `showQuarterly`/`showMonthly`가 false인 경우 해당 블록을 그리지 않도록 KpiTableSection에 props 전달.
- [ ] 블록별 행 필터링: KpiTable(또는 상위)에서 쿼터리용/먼슬리용 rows를 각각 `visibleMetricsQuarterly`/`visibleMetricsMonthly`로 필터해 KpiTableSection에 `quarterlyRows`·`monthlyRows` 등으로 전달할지, Section 내부에서 블록별 필터링할지 결정 후 반영.
- [ ] 블록 내 **행 순서**를 target → achievement → achievement_rate → daily_target → daily_achievement → daily_achievement_rate 로 유지.
- [ ] 기존 `TableSectionConfig`(스타일)와 혼동 없도록 prop 이름·주석 정리.
- [ ] 문서 갱신: `docs/products/kpi-table.md`에 “섹션·블록별 표시 설정” 단락 추가.

---

## 9. 다음 단계

1. 위 체크리스트 기준으로 타입·설정 파일·resolve 함수를 추가 (블록별 `visibleMetricsQuarterly`/`visibleMetricsMonthly` 포함).
2. KpiTable/KpiTableSection에 displayConfig 전달 및 블록별 조건부 렌더링 적용. 쿼터리/먼슬리 각각에 적용할 행 목록을 구분해 전달.
3. 테이블 레벨에서 블록별 rows 필터 유틸 적용 (또는 Section 내부에서 블록별 필터링). 같은 섹션이라도 쿼터리용 rows와 먼슬리용 rows를 다르게 구성.
4. 실제 CM/FR 예시로 한두 섹션 설정을 넣어 동작 확인 후, `kpi-table.md` 업데이트.

이 문서는 “섹션·블록별 설정” 도입을 위한 기획·설계용이며, 구현 시 이 내용을 바탕으로 작업하면 된다.
