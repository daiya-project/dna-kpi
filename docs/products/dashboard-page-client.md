# Dashboard Page Client

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
| `@/app/(dashboard)/dashboard/_components/Dashboard/DashboardPageClient.tsx` | 대시보드 페이지 루트(클라이언트): URL·필터·스크롤 스파이·연도 네비게이터 |
| `@/app/(dashboard)/dashboard/_components/Dashboard/DashboardHeader.tsx` | 상단 헤더: 리전 탭, 연도 스테퍼 [<] year [>] |
| `@/app/(dashboard)/dashboard/_components/BookmarkTabs.tsx` | 좌측 고정 북마크 탭: 섹션별 클릭 시 스크롤·필터 하이라이트 |

## 1. Overview

- **Path:** `@/app/(dashboard)/dashboard/_components/Dashboard/DashboardPageClient.tsx` (root). Header: `DashboardHeader.tsx`. Bookmark: `BookmarkTabs.tsx`.
- **Purpose:** 대시보드 페이지에서 리전(Summary/KR/US) 전환, 연도 스크롤 네비게이터, 카테고리 필터·북마크 클릭으로 섹션 스크롤 및 하이라이트를 제공하고, URL과 스크롤 위치를 동기화한다.

## 2. Key Props & State

### Props (DashboardPageClient)

| Prop | Description |
|------|-------------|
| `categories` | 카테고리 설정 배열(KpiCard용). |
| `initialMonths` | YYYY-MM 배열. 테이블·연도 범위 산출에 사용. |
| `initialSections` | 월간 테이블 섹션. KpiTable에 전달. |
| `initialSummaryYtd` | 카테고리별 YTD 합계. KpiCard 값. |
| `initialRegion` | 초기 리전. `"summary"` \| `"kr"` \| `"us"`. |
| `initialYears` | 데이터 기준 연도 목록(네비게이터 범위). |
| `initialYear` | 마운트 시 스크롤할 연도. |
| `error` | 에러 메시지. 있으면 상단 배너 표시. |

### Internal State (DashboardPageClient)

| State | Type | Meaning |
|-------|------|---------|
| `activeFilter` | `string \| null` | 사용자가 선택한 카테고리(필터/북마크 클릭). null이면 하이라이트 없음. |
| `activeScrollCategory` | `string \| null` | 세로 스크롤 스파이로 감지된 현재 보이는 섹션 ID. |
| `focusedYear` | `number` | 가로 스크롤 위치에 따른 “현재 연도”(네비게이터 표시·스테퍼 기준). |
| `sectionRefs` | `useRef<Record<string, HTMLTableSectionElement \| null>>` | 각 섹션 `<tbody>` 등록. 스크롤 스파이·scrollIntoView용. |
| `scrollContainerRef` | `useRef<HTMLDivElement \| null>` | KpiTable 가로 스크롤 컨테이너. 연도 스크롤·스파이용. |

### Callbacks / Handlers

| Handler | When to use |
|---------|-------------|
| `updateUrl({ region })` | 리전 변경 시 URL `?region=kr` 등 반영. |
| `handleRegionChange(newRegion)` | 헤더 리전 탭 클릭 → store 반영 + URL 갱신. |
| `scrollToYear(year)` | 연도 스테퍼 [<][>] 클릭 시 테이블 가로 스크롤. |
| `handleFilterChange(value)` | KpiCard 클릭 시 activeFilter 설정 + 해당 섹션 scrollIntoView. |
| `handleBookmarkClick(id)` | BookmarkTabs 클릭 시 activeFilter 설정 + 해당 섹션 scrollIntoView. |

### Displayed active category

- `displayedActiveCategory = activeFilter ?? activeScrollCategory` → BookmarkTabs·KpiTable 하이라이트에 사용.

## 3. Core Logic & Interactions

- **URL 동기화:** 리전만 쿼리(`region`)로 다룸. `region === "summary"`이면 쿼리 제거.
- **스크롤 스파이(세로):** `sectionRefs`에 등록된 각 섹션에 `IntersectionObserver` 적용. 루트 마진 `-120px 0px -50% 0px`로 “상단 근처” 섹션 ID를 `activeScrollCategory`로 설정.
- **스크롤 스파이(가로):** `scrollContainerRef`의 scroll 이벤트로 스크롤 중앙에 가장 가까운 연도 열을 찾아 `focusedYear` 갱신.
- **마운트 시 스크롤:** `initialYear`에 해당하는 `#col-year-{year}` 요소로 테이블 가로 스크롤 위치 설정.
- **Rendering flow:** Server Page가 데이터·초기값을 넘기고, Client에서 Header / BookmarkTabs / KpiCard 그리드 / KpiTable / 푸터 텍스트를 렌더. KpiTable에 `sectionRefs`, `scrollContainerRef`, `activeFilter`, `getSectionConfig` 등 전달.

## 4. AI Implementation Guide (For vibe coding)

### State → Action → Implementation (required)

| State / condition | Meaning | Use this function / API | Where to implement |
|-------------------|---------|--------------------------|--------------------|
| `activeFilter` | 사용자가 선택한 카테고리(카드/북마크 클릭) | `handleFilterChange`, `handleBookmarkClick` | `DashboardPageClient.tsx`: KpiCard `onSelect`, BookmarkTabs `onCategoryClick`. |
| `activeScrollCategory` | 스크롤로 보이는 섹션 ID | IntersectionObserver 콜백에서 `setActiveScrollCategory` | `DashboardPageClient.tsx`: useEffect 내 observer, `sectionRefs.current` 순회. |
| `focusedYear` | 테이블 가로 스크롤에 따른 “현재 연도” | scroll 이벤트에서 중앙에 가장 가까운 연도 계산 | `DashboardPageClient.tsx`: scroll listener useEffect. |
| 리전 변경 | Summary/KR/US 전환 | `handleRegionChange` → store + `updateUrl` | `DashboardHeader.tsx`: 탭 버튼 `onClick` → `onRegionChange`. |
| 연도 이동 | [<] [>] 클릭 시 해당 연도로 스크롤 | `scrollToYear(y)`, `handleYearPrev` / `handleYearNext` | `DashboardHeader.tsx`: Year navigator 버튼; `DashboardPageClient`에서 핸들러 정의. |

### Modification rules

- **리전 탭 UI/라벨** 변경 → `DashboardHeader.tsx`의 `REGIONS` 및 탭 버튼.
- **북마크 탭 아이콘/라벨** 변경 → `BookmarkTabs.tsx`의 `sectionIcons` 및 `section.tabLabel`.
- **스크롤 스파이 감지 구간** 변경 → `DashboardPageClient`의 IntersectionObserver `rootMargin` / `threshold`.
- **연도 네비게이터 표시/비활성 조건** → `DashboardHeader`의 `canGoPrev` / `canGoNext` 및 `yearNavigator` 전달 조건.

### Dependencies

- `DashboardPageClient` → `DashboardHeader`, `BookmarkTabs`, `KpiCard`, `KpiTable`; `useDashboardFilterStore`; `DASHBOARD_SECTION_IDS`, `dashboardSections`, `getDashboardSectionConfig` from `@/lib/config/dashboard-sections`; `createEmptySection` from `@/lib/logic/kpi-table-data`.
- `DashboardHeader` → `Button` (ui), `REGIONS` (local).
- `BookmarkTabs` → `framer-motion`, `DashboardSectionConfig`, `sectionIcons` (lucide-react).
