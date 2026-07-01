"use client";

import { useReportWebVitals } from "next/web-vitals";

type WebVitalRating = "good" | "needs_improvement" | "poor";

const THRESHOLDS: Record<string, { good: number; poor: number }> = {
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  INP: { good: 200, poor: 500 },
  LCP: { good: 2500, poor: 4000 },
  TTFB: { good: 800, poor: 1800 },
};

function getRating(name: string, value: number): WebVitalRating {
  const threshold = THRESHOLDS[name];
  if (!threshold) return "good";
  if (value <= threshold.good) return "good";
  if (value <= threshold.poor) return "needs_improvement";
  return "poor";
}

export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    const rating = getRating(metric.name, metric.value);
    if (rating === "good") return;

    fetch("/api/monitoring/web-vital", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      keepalive: true,
      body: JSON.stringify({
        id: metric.id,
        name: metric.name,
        value: metric.value,
        rating,
        path: window.location.pathname,
        navigationType: metric.navigationType,
      }),
    }).catch(() => {
      // Performance monitoring should never affect the customer experience.
    });
  });

  return null;
}
