# KPI 테이블: 행 높이 및 데이터 정렬 구현 정리

현재 `app/(dashboard)/dashboard/_components/KpiTable/` 내 테이블의 **행 높이**와 **텍스트(데이터) 정렬** 관련 구현 내용을 정리한 문서다. 수정 가능한 행(인라인 편집 대상)의 높이·정렬 문제 개선 시 참고용이다.

---

## 1. 구조 요약

- **KpiTable.tsx**: 테이블 루트. `Table` + `KpiTableHeader` + 여러 `KpiTableSection`. 행 높이/정렬은 직접 지정하지 않음.
- **KpiTableSection.tsx**: 실제 `TableBody`·`TableRow`·`TableCell` 렌더링. 행 높이와 셀 정렬은 여기서 클래스/스타일로 결정됨.
- **components/ui/table.tsx**: Shadcn `Table`, `TableRow`, `TableCell` 등. 기본 `p-2`, `align-middle` 등이 적용됨.

---

## 2. 행 높이 관련 구현

### 2.1 공통 상수 (KpiTableSection.tsx)

| 상수 | 값 | 용도 |
|------|-----|------|
| `LABEL_COLUMN_WIDTH` | `"2rem"` | 좌측 라벨(QUARTERLY/MONTHLY) 컬럼 너비 |
| `SUMMARY_COL_CELL_CLASS` | 아래 참조 | 요약 컬럼(분기 합계 등) 셀 스타일 |
| `EDIT_CELL_CLASS` | 아래 참조 | **수정 가능한 데이터 셀** 스타일 (인라인 편집 대상) |

### 2.2 셀 클래스 정의 (KpiTableSection.tsx 48–51행 근처)

```ts
const SUMMARY_COL_CELL_CLASS =
  "border-r border-glass-border px-3 py-1.5 text-right font-mono text-xs tabular-nums font-semibold bg-slate-100/50 dark:bg-slate-800/50";

const EDIT_CELL_CLASS =
  "border-r border-glass-border px-1 py-0.5 text-right font-mono text-xs tabular-nums min-h-9";
```

- **요약 컬럼**: `py-1.5` (세로 패딩만 지정, 명시적 행 높이 없음).
- **수정 가능 셀**: `py-0.5` + **`min-h-9`** (최소 높이 2.25rem). 행 높이는 이 `min-h-9`와 내부 래퍼로만 보장됨.

### 2.3 수정 가능 셀 내부 구조 (KpiTableSection.tsx 416–438행 근처)

편집 가능한 월별 데이터 셀은 아래 구조다.

```tsx
<TableCell
  className={cn(EDIT_CELL_CLASS, isEditingThisCell && "relative z-10 bg-white")}
  ...
>
  <div className="min-h-9 h-full w-full">
    {isEditingThisCell ? (
      <Input className="h-full w-full text-right ..." ... />
    ) : (
      formatCell(...) 또는 "—"
    )}
  </div>
</TableCell>
```

- **TableCell**: `EDIT_CELL_CLASS` → `min-h-9`, `py-0.5`.
- **내부 div**: `min-h-9 h-full w-full` → 셀과 동일한 최소 높이 유지, 편집 시 Input이 `h-full`로 채움.
- **TableRow**: 행 자체에는 `min-height`/`height` 없음. `border-b border-border/30 transition-colors hover:bg-secondary/30` 등만 적용.
- **ui/table.tsx TableCell**: 기본 `p-2 align-middle`인데, `EDIT_CELL_CLASS`에서 `px-1 py-0.5`로 패딩만 오버라이드. `align-middle`은 그대로 상속됨.

정리하면, **수정 가능한 행의 높이는**  
- 셀: `min-h-9` + `py-0.5`  
- 내부: `min-h-9 h-full w-full`  
로만 제어되며, **행(`<tr>`) 단위의 고정/최소 높이는 없음.**

---

## 3. 텍스트(데이터) 정렬 관련 구현

### 3.1 수평 정렬 (좌/우)

| 위치 | 클래스 | 비고 |
|------|--------|------|
| 요약 컬럼 | `text-right` | SUMMARY_COL_CELL_CLASS |
| 수정 가능 셀 | `text-right` | EDIT_CELL_CLASS |
| 수정 중 Input | `text-right` | Input `className`에 `text-right` |
| 일반 월별 데이터 셀(읽기 전용) | `text-right font-mono text-xs tabular-nums` | `px-3 py-1.5` |
| 헤더(월/분기) | KpiTableHeader에서 `text-right` 등 | min-w-[90px] 등과 함께 사용 |

데이터 셀은 모두 **우측 정렬(`text-right`)** 이며, 숫자 표기는 `font-mono tabular-nums`로 통일돼 있음.

### 3.2 수직 정렬

| 위치 | 클래스 | 비고 |
|------|--------|------|
| ui/table TableCell 기본 | `align-middle` | 모든 td에 적용 |
| 스티키 라벨 셀(QUARTERLY/MONTHLY) | `align-middle` | sticky left-0, left-8 셀 |
| 수정 가능 셀(TableCell) | EDIT_CELL_CLASS만 사용, 별도 `align-*` 없음 | → 기본 `align-middle` 적용 |
| 수정 가능 셀 내부 div | 정렬 클래스 없음 | `min-h-9 h-full w-full`만 있음 |
| Input | `h-full w-full` | 셀 높이를 채우도록만 지정, 수직 정렬 클래스 없음 |

즉, **데이터 정렬**은  
- 수평: 전부 `text-right`로 통일  
- 수직: `align-middle`이 기본이라 셀 기준 중앙 정렬이나, **편집 셀 내부의 div/Input**에는 수직 정렬을 추가로 지정하지 않아 브라우저/폰트에 따라 시각적 불일치가 날 수 있는 상태다.

---

## 4. 요약 표

| 항목 | 수정 가능 행(편집 셀) | 읽기 전용 데이터 행 | 비고 |
|------|------------------------|----------------------|------|
| 셀 최소 높이 | `min-h-9` (EDIT_CELL_CLASS + 내부 div) | 없음 | 행 높이 문제는 여기와 tr 미지정이 원인일 수 있음 |
| 셀 세로 패딩 | `py-0.5` | `py-1.5` | 편집 셀이 더 촘촘함 |
| 셀 가로 패딩 | `px-1` | `px-3` | 편집 셀이 더 좁음 |
| 수평 정렬 | `text-right` | `text-right` | 동일 |
| 수직 정렬 | td는 `align-middle`, 내부 div/Input은 미지정 | `align-middle` | 편집 시 내부 정렬 불일치 가능 |

---

## 5. 참고: 사용하는 UI 컴포넌트

- **Table, TableBody, TableRow, TableCell**: `@/components/ui/table`
  - TableCell: `p-2 align-middle whitespace-nowrap` 등 기본값.
- **Input**: `@/components/ui/input` (편집 시)

행 높이·정렬 개선 시에는  
- `EDIT_CELL_CLASS`와 수정 가능 셀 내부 `div`/`Input`의 높이·정렬 클래스,  
- 필요 시 `TableRow`에 `min-h-*` 추가  
를 함께 보는 것이 좋다.
