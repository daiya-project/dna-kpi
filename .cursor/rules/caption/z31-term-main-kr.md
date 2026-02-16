---
description: 시간/날짜 용어 및 Supabase·PostgreSQL 사용 시 구현 규칙 (ads_data_daily, week_master, public_holidays 등)
alwaysApply: true
---

# 데이터: 시간과 날짜

`ads_data_daily`, `week_master`, `public_holidays` 같은 테이블을 쓰는 Supabase/PostgreSQL 환경에서의 시간/날짜 용어와 구현 규칙.

## 1. 용어 정의

| 용어 | 의미 | 구현 |
|------|------|------|
| **Date** | 테이블 `date` 컬럼 값 | 테이블의 `date` (또는 `revenue_date`) |
| **Today / most recent day** | DB에 존재하는 가장 최근 날짜 | 시스템 날짜가 아니라 DB의 `MAX(date)` 등 사용 |
| **Current month** | 그 최근 날짜의 월(YYYY-MM) | DB 최신 날짜에서 유도 |
| **Week** | 1주일 구간 | **반드시** `week_master.start_date`, `week_master.end_date` 사용. 월/일을 수동 계산하거나 ISO 주만 쓰지 않는다 |
| **Workday** | 휴일이 아닌 날 | `public_holidays`에 없음; 일별 데이터는 `is_holiday = false`로 필터 |

## 2. 오늘 / 현재 월

- **오늘:** 시스템 날짜가 아니라 **DB에 실제로 존재하는 가장 최근 `date`**를 쓴다.
- **현재 월:** 그 최신 날짜의 월(YYYY-MM).

```typescript
// ✅ 좋음 — DB 최신 날짜 사용
const { data } = await supabase
  .from("ads_data_daily")
  .select("date")
  .order("date", { ascending: false })
  .limit(1);
const mostRecentDate = data?.[0]?.date;

// ❌ 나쁨 — 시스템 오늘 사용
const todayData = getDataForDate(new Date().toISOString().slice(0, 10));
```

## 3. 주(Week) — week_master만 사용

- "주" 관련 로직(주간 합계, 비교 등)은 **오직** `week_master` 테이블만 사용한다.
- 컬럼: `week_id`, `year`, `week_number`, `start_date`, `end_date`, `week_label` 등.

```typescript
// ✅ 좋음 — week_master에서 주 구간 사용
const { data: week } = await supabase
  .from("week_master")
  .select("start_date, end_date")
  .eq("year", year)
  .eq("week_number", weekNumber)
  .single();

const { data: dailyData } = await supabase
  .from("ads_data_daily")
  .select("amount")
  .gte("date", week.start_date)
  .lte("date", week.end_date);
```

```typescript
// ❌ 나쁨 — 주 구간 수동 계산
const weekStart = getMonday(date);
const weekEnd = getSunday(date);
```

## 4. 근무일(Workdays)

- **일별 데이터:** `is_holiday = false`(또는 동일 조건)로 필터.
- **특정 날짜가 근무일인지:** `public_holidays`에 **없으면** 근무일로 본다.

```typescript
// ✅ 근무일만
const { data } = await supabase
  .from("ads_data_daily")
  .select("*")
  .gte("date", startDate)
  .lte("date", endDate)
  .eq("is_holiday", false)
  .order("date", { ascending: true });

// ✅ 근무일인가?
const { data } = await supabase
  .from("public_holidays")
  .select("date")
  .eq("date", targetDate)
  .maybeSingle();
const isWorkday = data == null;
```

## 5. 날짜 형식 (CSV / API)

- **내부 / API:** `YYYY-MM-DD` 권장.
- **CSV / 사용자 입력:** 여러 형식을 받을 수 있다면, DB나 비즈니스 로직에 넣기 전에 **YYYY-MM-DD로 정규화**한다.

## 6. 참조 테이블

| 테이블 | 역할 |
|--------|------|
| `ads_data_daily` | 일별 데이터; `date`, `is_holiday` 등. |
| `week_master` | 주 구간(`start_date`, `end_date`) — 주(week)의 단일 출처 |
| `public_holidays` | 휴일 목록 — 근무일 판단에 사용 |

## 체크리스트

- [ ] 오늘/현재 월을 DB 최신 날짜에서 유도하는가?
- [ ] 모든 주 로직이 `week_master`를 쓰는가?
- [ ] 근무일 필터에 `is_holiday` 또는 `public_holidays`를 쓰는가?
- [ ] CSV/입력 날짜를 사용 전 YYYY-MM-DD로 정규화하는가?
