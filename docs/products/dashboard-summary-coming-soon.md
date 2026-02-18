# Dashboard Summary Coming Soon

## Document info
- **Created:** 2026-02-18 12:00:00
- **Last updated:** 2026-02-18 12:00:00

## Revision history
| Date | Description |
|------|-------------|
| 2026-02-18 12:00:00 | 최초 버전. |

## Covered files
이 문서가 다루는 파일. **아래 파일 중 하나를 수정하면 이 문서를 갱신한다** (Last updated, Revision history, 그리고 동작/상태가 바뀌었으면 본문).

| Path | Role |
|------|------|
| `@/app/(dashboard)/dashboard/_components/Dashboard/DashboardSummaryComingSoon.tsx` | Summary 리전 전용 풀페이지: Coming Soon 메시지, KR/US 전환 버튼 |

## 1. Overview

- **Path:** `@/app/(dashboard)/dashboard/_components/Dashboard/DashboardSummaryComingSoon.tsx`
- **Purpose:** 리전이 "summary"일 때 대시보드 페이지에서 보여 주는 전용 뷰. Summary 리전은 추후 구현 예정이라 데이터/편집 없이 "추후 구현" 메시지와 KR·US로 이동하는 버튼만 제공한다.

## 2. Key Props & State

- **Props:** 없음. URL·store는 훅으로 직접 읽고 갱신한다.
- **State (훅):** `useRouter`, `useSearchParams`, `useDashboardFilterStore`의 `setRegion`.
- **Callbacks:** `updateUrl(region)` — 리전에 따라 쿼리 설정/제거 후 `router.push`. `handleRegionChange(newRegion)` — store에 리전 설정 + URL 갱신.

## 3. Core Logic & Interactions

- **렌더 조건:** `page.tsx`에서 `region === "summary"`이면 이 컴포넌트를 렌더하고, kr/us이면 `DashboardPageClient`를 렌더한다.
- **리전 전환:** "KR 보기" / "US 보기" 클릭 → `handleRegionChange("kr" | "us")` → `setStoreRegion` + `updateUrl` → `region=kr` 또는 `region=us`로 이동하면 페이지가 다시 로드되며 `DashboardPageClient`가 보인다.
- **URL 규칙:** `updateUrl`에서 `region === "summary"`이면 `region` 쿼리를 제거하고, 그 외에는 `region` 쿼리를 설정한다.

## 4. AI Implementation Guide (For vibe coding)

### State → Action → Implementation (required)

| State / condition | Meaning | Use this function / API | Where to implement |
|-------------------|---------|--------------------------|--------------------|
| Summary 리전 진입 | URL에 region 없거나 summary일 때 이 화면 표시 | `page.tsx`에서 조건 분기 | `app/(dashboard)/dashboard/page.tsx`: `region === "summary"` → `<DashboardSummaryComingSoon />`. |
| KR/US로 전환 | 사용자가 KR 또는 US 보기 클릭 | `handleRegionChange("kr" \| "us")` | `DashboardSummaryComingSoon.tsx`: 버튼 `onClick` → `handleRegionChange`. 내부에서 `setStoreRegion` + `updateUrl`. |

- **Modification rules:** 문구/레이아웃 변경 → `DashboardSummaryComingSoon.tsx` 본문. 리전 전환 로직 변경 → 동일 파일의 `handleRegionChange`·`updateUrl`.
- **Dependencies:** `DashboardHeader`, `Button` (ui), `useDashboardFilterStore`, `useRouter`, `useSearchParams`, `Construction` (lucide-react).
