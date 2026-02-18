# Page Skeleton

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
| `@/components/common/PageSkeleton.tsx` | 전체 페이지 로딩 스켈레톤(Suspense fallback 등) |

## 1. Overview

- **Path:** `@/components/common/PageSkeleton.tsx`
- **Purpose:** 대시보드 등 페이지의 로딩 중 레이아웃을 흉내 내어, 헤더·필터 바·카드 그리드·테이블 영역 자리에 Skeleton을 보여 준다.

## 2. Key Props & State

- **Props:** 없음. Presentational only.
- **State:** 없음. Server Component로 사용 가능.

## 3. Core Logic & Interactions

- **레이아웃:** 대시보드 페이지와 유사한 구조 — 상단 헤더 영역(제목·우측 컨트롤), 그 아래 탭/필터 바, `main` 안에 카드 그리드(4열) + 테이블 영역 Skeleton.
- **사용처:** `app/(dashboard)/dashboard/page.tsx`의 `<Suspense fallback={<PageSkeleton />}>`에서 사용.

## 4. AI Implementation Guide (For vibe coding)

### State → Action → Implementation (required)

| State / condition | Meaning | Use this function / API | Where to implement |
|-------------------|---------|--------------------------|--------------------|
| 로딩 중 | 데이터 fetch·Suspense 대기 | `fallback={<PageSkeleton />}` | `dashboard/page.tsx` (또는 다른 페이지). |
| 스켈레톤 레이아웃 변경 | 헤더/그리드/테이블 블록 배치·개수 변경 | — | `PageSkeleton.tsx` 내부 JSX. |

### Modification rules

- **대시보드 레이아웃이 바뀌면** (헤더 높이, 카드 개수, pl-14 등) → `PageSkeleton.tsx`의 구조를 실제 페이지와 맞춰 수정.
- **다른 페이지에서 재사용** 시 → 필요하면 props로 “variant”를 받거나, 페이지별 스켈레톤 컴포넌트를 두고 이 컴포넌트를 참고해 구성.

### Dependencies

- `PageSkeleton` → `Skeleton` from `@/components/ui/skeleton`.
