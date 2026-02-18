# 제품/컴포넌트 문서 인덱스

`.cursor/rules/24-code-component-docs.mdc`에 따라 **비즈니스 로직·상태·복잡한 상호작용**이 있는 컴포넌트/훅은 `docs/products/`에 문서를 둡니다.  
**Covered files**에 포함된 파일을 수정할 때는 해당 문서의 Last updated·Revision history·본문을 갱신해야 합니다.

## 문서 있음 (Covered files 기준)

| 문서 | 대표 경로 | 비고 |
|------|-----------|------|
| [kpi-table.md](./kpi-table.md) | `KpiTable/KpiTable.tsx`, `useKpiTableCollapse.ts` | 테이블 접기·분기 컬럼·ProgressBar |
| [dashboard-page-client.md](./dashboard-page-client.md) | `Dashboard/DashboardPageClient.tsx`, `DashboardHeader`, `BookmarkTabs` | URL·스크롤 스파이·연도 네비게이터 |
| [kpi-card.md](./kpi-card.md) | `KpiTable/KpiCard.tsx`, `lib/logic/kpi-card.ts` | YTD 카드·집계 로직 |
| [page-skeleton.md](./page-skeleton.md) | `components/common/PageSkeleton.tsx` | Suspense fallback 레이아웃 |

## 문서 없음 (현재 의도적으로 미문서화)

| 아티팩트 | 경로 | 사유 |
|----------|------|------|
| ControlBar | `dashboard/_components/ControlBar.tsx` | 현재 플로우에서 미사용(BookmarkTabs·KpiCard로 대체). 제거/통합 검토 대상. |
| Shadcn/ui 컴포넌트 | `components/ui/*.tsx` | 프로젝트 공통 UI 프리미티브; shadcn 추가 시 생성. 비즈니스 로직 없음. |
| layout, error, page 루트 | `app/layout.tsx`, `app/*/page.tsx`, `error.tsx` | 레이아웃·에러 바운더리·페이지 진입점; 로직이 늘어나면 해당 페이지/레이아웃용 문서 추가 검토. |

## 신규 문서 추가 시

- **트리거:** 새 컴포넌트/훅에 비즈니스 로직·상태·Server Action/API·2곳 이상 재사용이 있으면 `docs/products/[컴포넌트-kebab-case].md` 생성.
- **템플릿:** 24-code-component-docs.mdc의 Document info, Revision history, **Covered files**, Overview, Props & State, Core Logic, AI Guide(State → Action 테이블 포함), Modification rules, Dependencies를 채운다.
