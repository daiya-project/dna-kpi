# KPI 테이블 셀 더블클릭 → 편집 모달 수정 — 구현 기획 초안

## 1. 개요

| 항목 | 내용 |
|------|------|
| **목표** | KpiTable의 특정 값 칼럼 셀을 더블클릭하면 **편집 모달**을 열고, 값을 수정해 DB(`dna_kpi.monthly_kpi`)에 반영한다. |
| **대상 칼럼** | `val_target_monthly`, `val_target_daily`, `val_actual_monthly`, `val_actual_daily`에 대응하는 4종 메트릭 행의 **월(YYYY-MM) 셀**만. 요약 컬럼(Q1 Total, Year Total) 및 Rate 행은 1차 범위에서 제외. |
| **트리거** | 해당 셀 **더블클릭** 시 **편집 모달 오픈**. |
| **UI 방식** | **모달 기반 수정.** 더블클릭 시 **모달(Dialog)** 이 열리고, 모달 내부에 해당 월·메트릭 쌍(Monthly 값 / Daily 값) 입력 필드, 'Monthly × Daily Mapping 해제' 체크박스, **취소**·**저장** 버튼을 배치. 테이블은 그대로 보이며, 모달을 닫기 전까지 배경은 딤 처리. |

---

## 2. 현재 구조 정리

### 2.1 DB

- **테이블:** `dna_kpi.monthly_kpi`
- **식별:** **`id`** (PK, bigint). **유니크:** `(month, category, country)` — 동일 조합 중복 불가.
- **컬럼:** `month`(YYYY-MM 등), `category`('ads' \| 'media'), `country`('kr' \| 'us'), 그 외 수정 대상 컬럼.
- **수정 대상 컬럼:** `val_target_monthly`, `val_target_daily`, `val_actual_monthly`, `val_actual_daily` (모두 `int8`, nullable).
- **저장 방식:** **Upsert.**  
  - **행이 이미 있는 경우(id 존재):** 해당 행 **UPDATE**.  
  - **행이 없는 경우(미래 월·신규 목표 등 DB에 해당 행 없음):** **INSERT** — `(month, category, country)`와 수정할 `val_*`로 새 행 생성.  
  → 목표 매출 등 **데이터가 아직 없는 셀**도 새로 입력 가능해야 하므로, id만으로 update하면 안 되고 **id 없으면 insert** 로직 필요.

### 2.2 테이블 표시

- **데이터 소스:** `buildMonthlyTableSections(rows)` — `MonthlyKpiRow[]`를 카테고리(ads, media)별·월별로 **집계**한 뒤 테이블에 표시.
- **리전:** 대시보드 URL `region` = `summary` \| `kr` \| `us`. **summary는 데이터 수정 구현 안 함.**
  - **summary:** 동일 (month, category)에 대해 **country별 행을 합산**해 한 셀에 표시. (편집 불가)
  - **kr / us:** 해당 country만 필터링하므로, **한 셀 = DB 한 행**. (편집 가능)
- **메트릭 행과 DB 컬럼 매핑:**

| 테이블 메트릭명       | DB 컬럼              |
|-----------------------|----------------------|
| Target                 | val_target_monthly   |
| Daily Target           | val_target_daily     |
| Achievement            | val_actual_monthly   |
| Daily Achievement      | val_actual_daily     |
| Achievement Rate       | 계산값 (수정 대상 아님) |
| Daily Achievement Rate| 계산값 (수정 대상 아님) |

### 2.3 셀과 DB 행의 대응

- **리전이 kr 또는 us일 때:** 셀 하나 = (해당 월·카테고리·리전의) DB 행 **0개 또는 1개**. 행이 있으면 **`id`**로 식별·수정(update). **행이 없으면** (미래 월·신규 입력) **`month`, `category`, `country`**로 새 행 insert.
- **리전이 summary일 때:** 셀 하나 = KR 행 + US 행의 합. **데이터 수정 구현 안 함** (편집 불가).

---

## 3. 기능 요구사항 (초안)

### 3.1 편집 가능 셀

- **편집 가능:** 위 4개 메트릭(Target, Daily Target, Achievement, Daily Achievement)의 **월(YYYY-MM) 컬럼** 셀만.
- **편집 불가(1차 제외):** 라벨/연도/분기 셀, Q1 Total / Year Total 등 요약 컬럼, Achievement Rate / Daily Achievement Rate 행.

### 3.2 동작 흐름

1. 사용자가 편집 가능 셀을 **더블클릭** → **편집 모달 오픈**.
2. **모달**이 열리면, 더블클릭한 셀에 해당하는 **같은 월·같은 메트릭 쌍**(Monthly 값 / Daily 값)의 현재 값이 모달 내 **입력 필드**에 채워진다. (예: 2026-01 Target 셀 더블클릭 → 모달에 "Target · 2026-01" 제목, Monthly / Daily 입력란.)
3. 모달 내에서 **Monthly** 입력란을 수정하면 **Daily**가 자동 계산·반영된다.  
   **공식:** `monthly / 해당 월의 일 수 = daily` (소수 반올림하여 정수로 표시).  
   이 경우 **Daily** 입력란은 숫자만 갱신되고 **비활성화**되어 사용자가 직접 수정할 수 없다.
4. 반대로 **Daily** 입력란을 수정하면 **Monthly**가 자동 계산·반영된다.  
   **공식:** `daily × 해당 월의 일 수 = monthly`.  
   이 경우 **Monthly** 입력란은 숫자만 갱신되고 **비활성화**되어 사용자가 직접 수정할 수 없다.
5. 모달 내 **'Monthly × Daily Mapping 해제'** 체크박스:  
   **체크 시** Monthly·Daily 입력란 모두 활성화되어 **독립 수정** 가능. 저장 시 **두 값 모두** DB 업데이트.
6. **취소** 버튼, **ESC** 키, 또는 **모달 외부(백드롭)** 클릭 시: 입력값 **초기화**(DB 업데이트 없음), **모달 닫기**.
7. **저장** 버튼 클릭 시 **Server Action**으로 DB 업데이트 후, 페이지 데이터 갱신(예: `router.refresh()`), **모달 닫기**.
8. 모달 닫힌 뒤 테이블에 반영된 값 표시.
9. **날짜 계산**은 `lib/date-utils.ts`(해당 월의 일 수 등), **숫자 계산 및 표시**는 `lib/number-utils.ts`를 사용한다.

### 3.3 리전별 동작

- **kr / us:** 한 셀 = DB 한 행. 편집 모달에서 값 1개(또는 monthly/daily 쌍)만 해당 칼럼에 표시·저장. **편집 가능.**
- **summary:** **데이터 수정 구현 안 함** (편집 불가). 해당 셀 더블클릭 비활성화 또는 안내 처리.

---

## 4. 기술 설계 초안

### 4.1 편집 컨텍스트(identity)

- 셀을 식별하기 위해 필요한 정보:
  - **`id`:** 해당 DB 행의 PK. **있으면** update, **없으면(null)** insert. (미래 월·신규 입력 시 행이 없을 수 있음.)
  - **`month`, `category`, `country`:** 항상 필요. insert 시 필수. 표시/제목용으로도 사용.
  - **리전:** kr/us일 때만 편집 가능. summary일 때는 편집 비활성화.
- **메트릭 → DB 필드:**  
  Target → `val_target_monthly`, Daily Target → `val_target_daily`, Achievement → `val_actual_monthly`, Daily Achievement → `val_actual_daily`.
- **`field`(편집 컨텍스트):** 더블클릭한 셀이 **어떤 메트릭 쌍**을 수정하는지 구분. 예: `'target'`(Target + Daily Target), `'actual'`(Achievement + Daily Achievement). 타입 설계 시 `field: 'target' | 'actual'` 또는 `metricLabel`과 연계해 명시.

### 4.2 데이터 흐름

- **현재:** 페이지에서 `fetchMonthlyKpi(region)` → `buildMonthlyTableSections` → `KpiTable`에 `sections` 전달. **편집 구현 시** 각 월 셀에 대응하는 **`id`(있으면)** 또는 **없음(행이 없으면)** 을 내려줘야 함.
- **`monthToRowId`:** **섹션(카테고리)별**로 둔다. `buildMonthlyTableSections`는 현재 id를 다루지 않으므로, **페이지에서** `fetchMonthlyKpi(region)`으로 받은 `rows`로부터 **섹션별** `monthToRowId: Record<string, number | null>`를 생성해, 각 section과 함께 KpiTable에 전달. **표시되는 모든 월**(`months`)에 대해 해당 (category, month) 행이 없으면 **null**로 넣어 편집 시 insert 가능하게 한다.
- **수정 시 필요한 것:**  
  - **kr/us:** Server Action에 **`id`(있을 때)** 와 **`month`, `category`, `country`**(항상) 전달. **id가 있으면** 해당 행 **update**, **id가 없으면** (month, category, country)로 **insert**.  
  - **모달에 넘기는 값(편집 컨텍스트):** `id: number | null`, `month`, `category`, `country`, `field`, `currentMonthly`, `currentDaily`.

### 4.3 API / Server Action

- **위치 제안:** **권장** `app/(dashboard)/dashboard/_components/KpiTable/kpi-upsert.ts`. 대안: `lib/api/kpi.ts`, `app/.../actions/kpi-upsert.ts`.
- **함수 시그니처 예시:** (함수명은 **`kpiUpsert`** 로 통일.)
  - `kpiUpsert(params: { id?: number | null; month: string; category: string; country: string; val_target_monthly?: number | null; val_target_daily?: number | null; val_actual_monthly?: number | null; val_actual_daily?: number | null })`
- **동작:** **Upsert.**
  - **`id`가 있고** 해당 행이 존재하면: `.from('monthly_kpi').update(payload).eq('id', id)`. payload에 수정할 `val_*` 컬럼만 포함.
  - **`id`가 없거나** null이면: `.from('monthly_kpi').upsert({ month, category, country, ...val_* }, { onConflict: 'month,category,country' })`. 해당 (month, category, country) 행이 있으면 update, 없으면 insert.
- **updated_at:** 있다면 서버/DB 기본값으로 갱신하거나, payload에 명시.

### 4.4 UI 컴포넌트 (모달 기반 수정)

| 요소 | 역할 |
|------|------|
| **편집 모달 (Dialog)** | 더블클릭 시 **모달(Dialog)** 오픈. Shadcn/ui **Dialog** 사용. 모달 **제목**에 카테고리·메트릭·월(예: "Ads · Target · 2026-01") 표시. **본문**에 Monthly / Daily **입력 필드**(Input), **'Monthly × Daily Mapping 해제'** 체크박스, **취소**·**저장** 버튼. 로딩·에러 메시지는 모달 내부에 표시. **ESC**·백드롭 클릭·취소 버튼 시 모달 닫기 및 입력 초기화. |
| **KpiTableSection 셀** | 편집 가능한 4개 메트릭의 월 컬럼 `TableCell`에 `onDoubleClick` 추가. 더블클릭 시 **`id`** 및 편집 컨텍스트를 state로 전달해 **편집 모달 오픈**. **region === 'summary'**일 때는 더블클릭 비활성화 또는 안내. |

- **구현 위치:** KpiTable 상위 또는 KpiTable 내부. **편집 모달**은 `editContext !== null`일 때만 렌더링(제어되는 Dialog). 모달은 **Portal**로 루트 근처에 렌더링되므로 테이블 스크롤과 무관하게 항상 화면 중앙/가독성 있게 표시.
- **포커스·접근성:** 모달 오픈 시 **첫 번째 입력 필드(Monthly)** 에 **autoFocus**. Tab으로 Monthly → Daily → 체크박스 → 취소 → 저장 순서로 이동.
- **상태:** 모달 오픈 여부 = `editContext !== null`. 현재 편집 중인 `(id, month, category, country, field, currentMonthly, currentDaily)`는 **editContext**로 보관.

#### 4.4.1 구현 시 상세 (모달·포커스·유틸)

| 항목 | 요구사항 |
|------|----------|
| **1. 모달 컴포넌트** | Shadcn/ui **Dialog** 사용. `open={editContext !== null}`, `onOpenChange`에서 닫을 때 `editContext = null` 및 초기화. 모달 내부에 제목, Monthly/Daily Input, 체크박스, 취소·저장 버튼, 에러/로딩 표시. |
| **2. 포커스·접근성** | 모달 오픈 시 **첫 번째 입력(Monthly)** 에 **autoFocus**. Tab으로 Monthly ↔ Daily ↔ 체크박스 ↔ 버튼 순 이동. ESC로 모달 닫기(Dialog 기본 동작 활용). |
| **3. monthly↔daily 유틸** | **`lib/date-utils.ts`:** **`getDaysInMonth(month: string): number`** — 이미 구현됨. **`lib/number-utils.ts`:** **`monthlyToDaily(monthly, daysInMonth)`**, **`dailyToMonthly(daily, daysInMonth)`** — 이미 구현됨. 모달 내 편집 로직에서 해당 유틸을 import해 사용. |

### 4.5 리전 전달

- 현재 리전(`region`: summary \| kr \| us)은 **DashboardPageClient**에서 URL/초기값으로 알고 있음.
- **KpiTable**에 `region` prop 추가 → **KpiTableSection**에 전달. **region === 'summary'**일 때는 해당 셀 더블클릭 비활성화(또는 "리전을 KR 또는 US로 선택한 뒤 수정해 주세요" 안내). kr/us일 때만 `id` 등 identity 전달해 **편집 모달 오픈**.

### 4.6 갱신 전략

- Server Action 성공 후 **`router.refresh()`** 호출로 페이지 서버 컴포넌트 재실행 → `fetchMonthlyKpi` 재호출 → 테이블 데이터 갱신.  
- 또는 부모에서 `key`를 바꾸거나, 클라이언트에서 낙관적 업데이트 후 서버 데이터로 동기화하는 방식도 가능(2차 검토).

---

## 5. 파일/폴더 변경 예상

| 구분 | 경로 | 변경 내용 |
|------|------|-----------|
| API / Action | **권장:** **F.** `app/(dashboard)/dashboard/_components/KpiTable/kpi-upsert.ts` + 함수명 **`kpiUpsert`**. (KpiTable·KpiUpsertController와 같은 폴더에 두어 KPI 테이블 편집 기능을 한 곳에 모음. 사용처가 이 컴포넌트뿐이면 폴더 종속이 자연스러움.) **대안:** E. `app/.../actions/kpi-upsert.ts` / A. `lib/api/kpi.ts`. **내용:** Upsert (id 있으면 update, 없으면 insert). |
| 편집 모달 UI | `app/.../KpiTable/` 하위 | 더블클릭 시 열리는 **편집 모달(Dialog)** 컴포넌트 — 제목, Monthly/Daily 입력, 체크박스, 취소·저장, 로딩/에러 |
| 테이블 | `KpiTableSection.tsx` | 편집 가능 월 셀에 `onDoubleClick` + 편집 identity 전달 → 모달 오픈 |
| 테이블 | `KpiTable.tsx` | `region` prop 추가, `editContext` state 및 편집 모달(Dialog) 연결 |
| 페이지 | `DashboardPageClient.tsx` | `region`을 KpiTable에 전달; 필요 시 `editContext` state 상위로 올림 |
| 타입 | `types/app-db.types.ts` | 필요 시 업데이트 payload 타입 추가 |

---

## 6. 제약·에러 처리

- **권한:** 현재 프로젝트에 auth 미도입이면, Server Action/API는 서버에서만 호출 가능하도록 두고, 추후 인증 정책 적용.
- **유효성:** `month`(YYYY-MM), `category`('ads'|'media'), `country`('kr'|'us'), `value`(숫자 또는 null) 검증 후 DB 호출. id가 있으면 해당 행 존재 여부 검증(선택).
- **실패 시:** 편집 모달 내부에 에러 메시지 표시, 모달은 열린 채로 유지하며 테이블 데이터는 그대로.

---

## 7. 체크리스트 (구현 전 확인)

- [ ] summary는 데이터 수정 구현 안 함(편집 불가). kr/us만 편집 가능
- [ ] Server Action vs API Route: Server Action 권장(폼·낙관적 UI와 자연스럽게 연동)
- [ ] 편집 모달 상태(editContext) 보관 위치: KpiTable vs DashboardPageClient 결정
- [ ] Supabase RLS/정책: 업데이트 허용 여부 확인(현재 스키마 기준). **Phase 2(Server Action) 구현 전에** RLS가 비활성화되어 있거나 `monthly_kpi`에 대한 SELECT/INSERT/UPDATE 정책이 있는지 확인할 것.
- [ ] `docs/products/kpi-table.md` 및 관련 컴포넌트 doc: 편집·편집 모달·identity 추가 시 Covered files·동작 설명 갱신

---

## 8. 요약

- **트리거:** KpiTable 4개 값 메트릭(Target, Daily Target, Achievement, Daily Achievement)의 **월 셀 더블클릭**.
- **UI:** 더블클릭 시 **편집 모달(Dialog)** 오픈. 모달 내부에 제목(카테고리·메트릭·월), Monthly/Daily 입력 필드, 'Monthly × Daily Mapping 해제' 체크박스, **취소**·**저장** 버튼. ESC·백드롭 클릭·취소로 모달 닫기. **포커스:** 모달 오픈 시 첫 입력(Monthly)에 autoFocus, Tab으로 Monthly ↔ Daily ↔ 버튼 이동.
- **저장:** 모달에서 저장 클릭 → Server Action **`kpiUpsert`** 로 **Upsert** (id 있으면 update, 없으면 insert). `monthly_kpi`에 반영 후 모달 닫기.
- **리전:** `region` = summary \| kr \| us. **summary는 수정 구현 안 함.** kr/us만 편집. **행이 없어도** (month, category, country)로 새 행 insert 가능. 같은 월의 Monthly·Daily는 연동 계산 후 저장.
- **갱신:** 저장 성공 후 `router.refresh()`로 페이지 데이터 재조회.

---

## 9. 구현 프로세스 (확정 기획 반영)

아래 순서대로 진행. 새로 생성할 **파일명**, **함수명**, **상태값**을 표기한다.

### 9.1 데이터·타입 준비

| 순서 | 작업 | 파일 | 함수/타입/상태 |
|------|------|------|----------------|
| 1 | 월별 일 수 유틸 | `lib/date-utils.ts` | **함수:** `getDaysInMonth(month: string): number` — YYYY-MM 기준 해당 월 일 수 반환. **구현 완료.** |
| 2 | monthly ↔ daily 변환 | `lib/number-utils.ts` | **`monthlyToDaily(monthly, daysInMonth)`**, **`dailyToMonthly(daily, daysInMonth)`** — **이미 구현됨.** `getDaysInMonth(month)`은 `lib/date-utils.ts`에 있으므로 편집 로직에서 두 유틸을 import해 사용. |
| 3 | 업데이트 payload 타입 | `types/app-db.types.ts` | **타입:** `MonthlyKpiUpdatePayload` (id, 수정할 val_* 필드만) |
| 4 | 셀별 row id 전달 구조 | `lib/logic/kpi-table-data.ts` + 페이지 | **타입:** `monthToRowId?: Record<string, number \| null>` — 월(YYYY-MM) → 해당 행의 id. **섹션(카테고리)별**로 둠. **구현:** `buildMonthlyTableSections`는 id를 다루지 않으므로, **페이지에서** kr/us일 때 `rows`로부터 **섹션별** (category, month) → id 맵을 생성해 각 section에 붙이거나 KpiTable에 전달. 표시 월(`months`) 중 **행이 없는 월**은 null로 두어 편집 시 insert 가능하도록. |

- 페이지에서 `fetchMonthlyKpi`는 이미 `id`를 포함한 행을 반환. **kr/us**일 때 **섹션별** (month → id 또는 null) 맵을 만들어 KpiTable/섹션에 내려줄 것. **행이 없는 미래 월**은 null로 두어 저장 시 upsert(insert) 가능.

### 9.2 Server Action (Upsert)

| 순서 | 작업 | 파일 | 함수/타입 |
|------|------|------|-----------|
| 5 | Upsert: id 있으면 update, 없으면 insert | `app/(dashboard)/dashboard/_components/KpiTable/kpi-upsert.ts` (신규) | **함수:** `kpiUpsert(params: { id?: number \| null; month: string; category: string; country: string; val_target_monthly?: number \| null; val_target_daily?: number \| null; val_actual_monthly?: number \| null; val_actual_daily?: number \| null })` |

- **id가 있고** 해당 행이 존재하면: `.from('monthly_kpi').update(payload).eq('id', id)`.
- **id가 없거나 null이면:** `.from('monthly_kpi').upsert({ month, category, country, ...val_* }, { onConflict: 'month,category,country' })`. DB에 `unique(month, category, country)` 제약이 있으므로 conflict 시 update, 없으면 insert.
- `updated_at` 있으면 payload 또는 DB 기본값.

### 9.3 편집 컨텍스트 타입

| 순서 | 작업 | 파일 | 타입 |
|------|------|------|------|
| 6 | (선택) RLS 사전 확인 | — | Phase 2 구현 전에 `monthly_kpi` RLS/정책 확인. |
| 7 | 편집 컨텍스트(identity) 타입 | `types/app-db.types.ts` 또는 `app/.../KpiTable/types.ts` (신규) | **타입:** `KpiCellEditContext` — **`id: number \| null`** (행 없으면 null), `month`, `category`, `country`, **`field`**(어떤 메트릭 쌍 수정인지: 예 `'target'` \| `'actual'`), `currentMonthly`, `currentDaily`(쌍일 때), `metricLabel`(표시용). **`field`**는 더블클릭한 셀이 Target+Daily Target 쌍인지, Achievement+Daily Achievement 쌍인지 구분. |

### 9.4 상태·컨트롤 (KpiTable 상위 또는 KpiTable 내부)

| 순서 | 작업 | 파일 | 상태값(React state) |
|------|------|------|---------------------|
| 8 | 편집 모달 오픈 state | `KpiTable.tsx` 또는 `DashboardPageClient.tsx` | **상태:** `editContext: KpiCellEditContext \| null` — null이면 모달 닫힘, 값이 있으면 모달 오픈. 더블클릭 시 설정, 취소/저장 후 null. |
| 9 | 로컬 편집 값(모달 내) | 위와 동일 | **상태:** `editDraft: { monthly?: number \| null; daily?: number \| null }` — 모달 열려 있을 때만 사용. Mapping 해제 시 둘 다 편집 가능. |
| 10 | Mapping 해제 체크박스 | 위와 동일 | **상태:** `unmapMonthlyDaily: boolean` — 'Monthly × Daily Mapping 해제' 체크 여부. 기본 false. |
| 11 | 로딩·에러 | 위와 동일 | **상태:** `editError: string \| null`, `editPending: boolean` (저장 중이면 true). 모달 내에 표시. |

### 9.5 UI 컴포넌트 (신규·수정)

| 순서 | 작업 | 파일 | 비고 |
|------|------|------|------|
| 12 | 편집 모달 컴포넌트 | `app/(dashboard)/dashboard/_components/KpiTable/KpiUpsertModal.tsx` (신규) | Shadcn/ui **Dialog** 사용. **Props:** `open`, `editContext`, `editDraft`, `unmapMonthlyDaily`, `onUnmapChange`, `onDraftChange`, `onCancel`, `onSave`, `editError`, `editPending`. 제목(카테고리·메트릭·월), Monthly/Daily Input, 체크박스, 취소·저장, 에러/로딩. **클라이언트 컴포넌트.** ESC·백드롭 클릭은 Dialog 기본 동작으로 닫기 → `onCancel` 호출. |
| 13 | KpiTable에 편집 모달 연결 | `KpiTable.tsx` | `region` prop, `editContext` state. **KpiUpsertModal** 렌더링(open=editContext!==null). 모달에 `onCancel`/`onSave`/`onDraftChange` 등 전달. |
| 14 | 섹션·셀에 더블클릭 | `KpiTableSection.tsx` | 편집 가능 월 셀에 `onDoubleClick` → `onEnterEditMode(context, initialDraft)`. 테이블 셀은 View 전용(값만 표시), 입력은 모달 내부에서만. |
| 15 | 모달 닫기(ESC·백드롭) | `KpiUpsertModal.tsx` | Dialog의 `onOpenChange(false)` 시 `onCancel` 호출. ESC·백드롭은 Shadcn Dialog 기본 지원. |

### 9.6 데이터 흐름 연결

| 순서 | 작업 | 파일 | 비고 |
|------|------|------|------|
| 16 | 페이지에서 id(또는 null) 맵 전달 | `app/(dashboard)/dashboard/page.tsx` 또는 Client 래퍼 | `region === 'kr' \| 'us'`일 때 `rows`로부터 `(category, month) → id` 맵 생성. **표시되는 모든 월**에 대해 행이 없으면 **null**로 넣어 전달. KpiTable은 id가 null인 셀도 더블클릭 시 편집 모달 오픈 가능(저장 시 insert). |
| 17 | 저장 후 갱신 | `KpiTable.tsx` 또는 DashboardPageClient | Server Action 성공 후 `router.refresh()`. 실패 시 `editError` 설정. |

### 9.7 파일·함수·상태 요약표

| 구분 | 이름 |
|------|------|
| **신규 파일** | `app/(dashboard)/dashboard/_components/KpiTable/kpi-upsert.ts`, `app/(dashboard)/dashboard/_components/KpiTable/KpiUpsertModal.tsx`, (선택) `app/.../KpiTable/types.ts` |
| **수정 파일** | `types/app-db.types.ts`, `lib/logic/kpi-table-data.ts`(타입/반환 확장 여부), `KpiTable.tsx`, `KpiTableSection.tsx`, `app/(dashboard)/dashboard/page.tsx` (또는 DashboardPageClient). **참고:** `lib/date-utils.ts`, `lib/number-utils.ts`는 이미 `getDaysInMonth`, `monthlyToDaily`, `dailyToMonthly` 구현됨 — 수정 없이 import만. |
| **사용 유틸(기존)** | `getDaysInMonth(month)` (date-utils), `monthlyToDaily`, `dailyToMonthly` (number-utils). **신규 함수:** **`kpiUpsert(params)`** (id 있으면 update, 없으면 insert). |
| **신규 타입** | `MonthlyKpiUpdatePayload`, `KpiCellEditContext`, (필요 시) `ValField` |
| **상태값** | `editContext`, `editDraft`, `unmapMonthlyDaily`, `editError`, `editPending` |

이 순서대로 구현하면 된다.

---

## 10. 기획 검토 요약

### 10.1 검토 의견

- **목표·범위:** 4개 값 메트릭의 월 셀만 모달로 수정, summary 제외, kr/us만 편집 — 명확함.
- **DB·Identity:** id 있으면 update, 없으면 (month, category, country) upsert — 요구사항과 일치.
- **UI:** 더블클릭 → 편집 모달(Dialog) 오픈, 모달 내 입력·체크박스·취소·저장 — 상세히 정의됨.
- **확인 권장:** Supabase `monthly_kpi`에 `(month, category, country)` unique 제약 존재 여부; RLS 정책 확인.

### 10.2 페이즈 구분 (구현 순서)

아래 페이즈는 **9. 구현 프로세스**의 작업을 그룹화한 것이다. 각 페이즈 완료 후 동작 확인 후 다음 페이즈로 진행하는 것을 권장한다.

---

## 11. 페이즈별 구현 계획

### Phase 1: 데이터·타입·유틸 (Foundation)

**목표:** 편집에 필요한 유틸, 타입, 셀–행 매핑을 준비한다. UI/API는 건드리지 않는다.

| 순서 | 작업 | 파일 | 비고 |
|------|------|------|------|
| 1 | 월별 일 수 유틸 | `lib/date-utils.ts` | `getDaysInMonth(month: string): number` — **이미 구현됨.** 사용만 하면 됨. |
| 2 | monthly ↔ daily 변환 | `lib/number-utils.ts` | `monthlyToDaily`, `dailyToMonthly` — **이미 구현됨.** 사용만 하면 됨. |
| 3 | 업데이트 payload 타입 | `types/app-db.types.ts` | `MonthlyKpiUpdatePayload` |
| 4 | 셀별 row id 전달 구조 | `lib/logic/kpi-table-data.ts` | `monthToRowId?: Record<string, number \| null>` 및 kr/us용 맵 생성 |

**완료 기준:** 타입/유틸/맵이 준비되어, 다른 모듈에서 import·사용 가능한 상태.

---

### Phase 2: Server Action (Upsert)

**목표:** DB Upsert를 수행하는 Server Action을 추가한다. 호출부는 Phase 4~5에서 연결한다.

| 순서 | 작업 | 파일 | 비고 |
|------|------|------|------|
| 5 | Upsert 함수 | `app/.../KpiTable/kpi-upsert.ts` (신규) | `kpiUpsert(params)` — id 있으면 update, 없으면 insert |

**구현 전 확인:** Supabase RLS — `monthly_kpi`에 대한 SELECT/INSERT/UPDATE 허용 여부(또는 RLS 비활성) 확인.

**완료 기준:** `kpiUpsert`를 단독으로 호출했을 때 DB에 반영되는지 확인 가능 (테스트 또는 임시 버튼).

---

### Phase 3: 편집 컨텍스트·상태 정의

**목표:** 편집 컨텍스트(identity) 타입과 KpiTable(또는 상위)에서 쓸 state를 정의한다. UI는 아직 미구현.

| 순서 | 작업 | 파일 | 비고 |
|------|------|------|------|
| 7 | 편집 컨텍스트(identity) 타입 | `types/app-db.types.ts` 또는 `KpiTable/types.ts` | `KpiCellEditContext` |
| 8 | 편집 모달 state | `KpiTable.tsx` 또는 `DashboardPageClient.tsx` | `editContext`, `editDraft`, `unmapMonthlyDaily`, `editError`, `editPending` |

**완료 기준:** 타입과 state 변수/세터가 코드에 존재하고, 다음 페이즈에서 참조 가능.

---

### Phase 4: UI — 편집 모달·셀 더블클릭

**목표:** 더블클릭으로 편집 모달 오픈, 모달 내 입력·체크박스·취소·저장·포커스까지 구현한다.

| 순서 | 작업 | 파일 | 비고 |
|------|------|------|------|
| 12 | 편집 모달 | `KpiTable/KpiUpsertModal.tsx` (신규) | Shadcn Dialog. 제목, Monthly/Daily Input, 체크박스, 취소·저장, 에러/로딩. 오픈 시 첫 입력 autoFocus, ESC·백드롭으로 닫기 |
| 13 | KpiTable에 모달 연결 | `KpiTable.tsx` | `region` prop, `editContext` state, KpiUpsertModal 렌더(open=editContext!==null) |
| 14 | 섹션·셀 더블클릭 | `KpiTableSection.tsx` | 편집 가능 월 셀에 `onDoubleClick` → `onEnterEditMode(context, initialDraft)`. summary일 때 비활성/안내 |
| 15 | 모달 닫기 | `KpiUpsertModal.tsx` | Dialog `onOpenChange(false)` 시 `onCancel`. ESC·백드롭은 Dialog 기본 |

**완료 기준:** kr/us에서 편집 가능 셀 더블클릭 시 편집 모달이 열리고, 모달에서 취소/저장 버튼 동작(저장은 아직 API 연동 전이라 갱신만 로컬 상태 초기화 가능).

---

### Phase 5: 데이터 흐름·저장·갱신

**목표:** 페이지에서 id(또는 null) 맵 전달, 저장 시 Server Action 호출 및 `router.refresh()`로 테이블 갱신을 연결한다.

| 순서 | 작업 | 파일 | 비고 |
|------|------|------|------|
| 16 | id 맵 전달 | `page.tsx` 또는 DashboardPageClient | region kr/us일 때 `monthToRowId` 생성 후 KpiTable에 전달 |
| 17 | 저장 후 갱신 | `KpiTable.tsx` 또는 DashboardPageClient | `kpiUpsert` 호출 → 성공 시 `router.refresh()`, 실패 시 `editError` 설정 |

**완료 기준:** 셀 수정 후 저장 시 DB 반영되고 테이블이 새 데이터로 다시 그려짐.

---

### Phase 6: 문서·정리 (선택)

**목표:** 컴포넌트 문서와 체크리스트를 갱신한다.

| 순서 | 작업 | 파일 | 비고 |
|------|------|------|------|
| — | 컴포넌트·시스템 문서 갱신 | `docs/products/kpi-table.md`, `docs/SYSTEM-MAP.md` 등 | 편집·편집 모달·identity 설명 추가 |
| — | 체크리스트 정리 | 본 기획서 §7 | summary 미구현, RLS 확인 등 반영 |

---

### 페이즈 의존 관계

```
Phase 1 (Foundation) → Phase 2 (Server Action) → Phase 3 (State) → Phase 4 (UI) → Phase 5 (Data flow) → Phase 6 (Docs)
```

- Phase 4는 Phase 2 완료 전에도 모달/취소만으로 동작 확인 가능; **저장 연동**은 Phase 5에서 진행.
- Phase 1은 반드시 먼저 완료하는 것을 권장.

---

## 12. 기능 검증 (디테일)

구현 시 아래 항목을 만족하는지 검증한다.

### 12.1 트리거·진입

| # | 요구사항 | 검증 포인트 |
|---|----------|-------------|
| 1 | 편집 가능 셀만 더블클릭 시 모달 오픈 | Target, Daily Target, Achievement, Daily Achievement 4개 메트릭의 **월(YYYY-MM) 셀**에만 `onDoubleClick` 연결. 라벨/연도/분기, Q1 Total·Year Total, Rate 행은 더블클릭 무시. |
| 2 | 리전 summary일 때 편집 비활성화 | `region === 'summary'`이면 더블클릭 비활성화 또는 툴팁 안내. |
| 3 | 한 셀 더블클릭 = 같은 월·같은 메트릭 쌍(Monthly·Daily) 편집 | 더블클릭한 셀이 Target이면 모달에서 Target + Daily Target 쌍 편집; Achievement면 Achievement + Daily Achievement 쌍 편집. |

### 12.2 모달 UI·표시

| # | 요구사항 | 검증 포인트 |
|---|----------|-------------|
| 4 | 모달 제목에 카테고리·메트릭·월 표시 | 예: "Ads · Target · 2026-01", "Media · Achievement · 2026-02". `metricLabel`은 field 기준(target → Target, actual → Achievement). |
| 5 | 모달 본문에 Monthly / Daily 입력 필드 | 두 개의 Input. 값은 `editDraft.monthly`, `editDraft.daily` 반영. 빈 값/0 표시 일관 처리. |
| 6 | 'Monthly × Daily Mapping 해제' 체크박스 | 체크 시 두 입력란 독립 편집 가능; 미체크 시 한쪽 수정 시 반대쪽 자동 계산 및 비활성화. |
| 7 | 취소·저장 버튼 | 취소 → 모달 닫기·초기화. 저장 → Server Action 호출 후 성공 시 `router.refresh()` 및 모달 닫기. |
| 8 | 에러·로딩 표시 | 저장 실패 시 모달 내 에러 메시지. 저장 중에는 버튼 비활성화 및 "저장 중…" 등 표시. |

### 12.3 Monthly ↔ Daily 연동

| # | 요구사항 | 검증 포인트 |
|---|----------|-------------|
| 9 | Mapping 미해제 시 Monthly 수정 → Daily 자동 계산 | `monthly / 해당 월 일 수 = daily` (정수 반올림). `getDaysInMonth(month)`, `monthlyToDaily(monthly, daysInMonth)` 사용. Daily 입력란 비활성화. |
| 10 | Mapping 미해제 시 Daily 수정 → Monthly 자동 계산 | `daily × 해당 월 일 수 = monthly`. `dailyToMonthly(daily, daysInMonth)` 사용. Monthly 입력란 비활성화. |
| 11 | Mapping 해제 시 두 값 독립 편집 | 체크 시 Monthly·Daily 모두 입력 가능. 저장 시 두 값 모두 payload에 포함. |

### 12.4 닫기·취소

| # | 요구사항 | 검증 포인트 |
|---|----------|-------------|
| 12 | 취소 버튼 클릭 시 모달 닫기 | `onCancel` 호출 → `editContext = null`, draft 초기화. |
| 13 | ESC 키로 모달 닫기 | Shadcn Dialog 기본 동작 또는 `onOpenChange(false)` 시 `onCancel`. |
| 14 | 백드롭(모달 외부) 클릭 시 모달 닫기 | Dialog `onOpenChange(false)` 시 `onCancel`. |

### 12.5 저장·데이터

| # | 요구사항 | 검증 포인트 |
|---|----------|-------------|
| 15 | field=target 시 val_target_monthly, val_target_daily 전달 | payload에 `val_target_monthly`, `val_target_daily`만 포함. field=actual이면 `val_actual_*`. |
| 16 | id 있으면 update, 없으면 insert | `kpiUpsert`에 id(있을 때), month, category, country, val_* 전달. id 없으면 upsert(insert). |
| 17 | 저장 성공 후 테이블 갱신 | `router.refresh()` 호출. 모달 닫기. |
| 18 | 저장 실패 시 모달 유지·에러 표시 | `editError` 설정, 모달은 열린 채, 에러 메시지 표시. |

### 12.6 접근성·포커스

| # | 요구사항 | 검증 포인트 |
|---|----------|-------------|
| 19 | 모달 오픈 시 첫 입력(Monthly) autoFocus | Dialog 열릴 때 첫 번째 Input에 focus. |
| 20 | Tab으로 Monthly → Daily → 체크박스 → 버튼 이동 | 포커스 순서 자연스럽게. |

### 12.7 파일·타입 일치

| # | 항목 | 검증 포인트 |
|---|------|-------------|
| 21 | 편집 모달 컴포넌트 | `KpiUpsertModal.tsx` — Shadcn Dialog 사용, props는 기획 §9.5 테이블과 일치. |
| 22 | 타입 KpiCellEditContext | id, month, category, country, field. (metricLabel은 파생 가능.) |
| 23 | 타입 KpiEditDraft | monthly, daily (number). |
| 24 | kpiUpsert 시그니처 | id?, month, category, country, val_target_monthly?, val_target_daily?, val_actual_monthly?, val_actual_daily? |
