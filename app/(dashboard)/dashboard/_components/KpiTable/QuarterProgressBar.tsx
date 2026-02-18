"use client";

import { motion } from "framer-motion";
import { formatNumber, formatPercent } from "@/lib/number-utils";
import { cn } from "@/lib/utils";

interface QuarterProgressBarProps {
  target: number;
  actual: number;
  className?: string;
}

/**
 * Progress bar component for collapsed quarterly view.
 * Shows target/actual with animated progress bar and overlay text.
 */
export function QuarterProgressBar({
  target,
  actual,
  className,
}: QuarterProgressBarProps) {
  const rate = target > 0 ? (actual / target) * 100 : 0;
  const progressPercent = Math.min(Math.max(rate, 0), 100);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className={cn("relative h-7 w-full overflow-hidden rounded", className)}
    >
      {/* Background */}
      <div className="absolute inset-0 bg-green-100/60 dark:bg-green-900/30" />

      {/* Progress bar */}
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${progressPercent}%` }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="absolute inset-y-0 left-0 bg-green-500/90 dark:bg-green-600/90"
      />

      {/* Overlay text */}
      <div className="relative flex h-full items-center justify-center px-2">
        <span className="text-xs font-semibold text-gray-800 dark:text-gray-100 drop-shadow-sm">
          {formatNumber(target)} / {formatNumber(actual)} ({formatPercent(rate)})
        </span>
      </div>
    </motion.div>
  );
}
