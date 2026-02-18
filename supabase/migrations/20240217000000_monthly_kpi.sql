-- dna_kpi.monthly_kpi (41-data-structure.mdc)
-- Align with types/database.types.ts. Run in Supabase SQL Editor or via Supabase CLI. Then run: npm run update-types

create schema if not exists dna_kpi;

create table dna_kpi.monthly_kpi (
  id bigint generated always as identity primary key,
  month text not null,
  category text not null,
  country text not null,
  val_actual_daily int8 default null,
  val_actual_monthly int8 default null,
  val_target_daily int8 default null,
  val_target_monthly int8 default null,
  created_at timestamptz default null,
  updated_at timestamptz default null,
  constraint monthly_kpi_uniq unique (month, category, country),
  check (category in ('ads', 'media')),
  check (country in ('kr', 'us'))
);

comment on table dna_kpi.monthly_kpi is 'Monthly KPI: target & actual per category/country/month';
