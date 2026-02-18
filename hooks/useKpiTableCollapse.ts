"use client";

import { useState, useCallback } from "react";

/**
 * Collapse state for KPI table:
 * - collapsedMonths: MONTHLY row collapse (section group id in Set = collapsed)
 * - collapsedQuarterPeriods: Q1 Total etc. header click - hide month columns for that quarter
 * - showQuarterlyProgress: section categoryIds in "1 row + progress bar" view (per-section)
 */
export function useKpiTableCollapse() {
  const [collapsedMonths, setCollapsedMonths] = useState<Set<string>>(new Set());
  const [collapsedQuarterPeriods, setCollapsedQuarterPeriods] = useState<Set<string>>(new Set());
  const [showQuarterlyProgress, setShowQuarterlyProgress] = useState<Set<string>>(new Set());

  const toggleMonthSection = useCallback((sectionGroupId: string) => {
    setCollapsedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(sectionGroupId)) next.delete(sectionGroupId);
      else next.add(sectionGroupId);
      return next;
    });
  }, []);

  const toggleQuarterPeriod = useCallback((quarterKey: string) => {
    setCollapsedQuarterPeriods((prev) => {
      const next = new Set(prev);
      if (next.has(quarterKey)) next.delete(quarterKey);
      else next.add(quarterKey);
      return next;
    });
  }, []);

  const toggleQuarterlyProgress = useCallback((categoryId: string) => {
    setShowQuarterlyProgress((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  }, []);

  return {
    collapsedMonths,
    collapsedQuarterPeriods,
    showQuarterlyProgress,
    toggleMonthSection,
    toggleQuarterPeriod,
    toggleQuarterlyProgress,
  };
}
