/**
 * Data transformation utilities for member card reports
 * Handles date normalization, range generation, gap filling, and chart data preparation
 */

import { POS_KEYS, NEG_KEYS, ZERO_RECORD, PENDING_SERIES } from './reportChartConfig.js';

// ─── Date normalization ───────────────────────────────────────────────────────

/**
 * Normalise raw API date field to "YYYY-MM-DD" format
 * The `date` field may arrive as:
 *   • "YYYY-MM-DD"               — plain ISO date string
 *   • "YYYY-MM-DDTHH:MM:SS.sssZ" — full ISO datetime (extract date part)
 *   • { date: "YYYY-MM-DD…" }    — wrapped object (same pattern as formatDate())
 * Always returns a plain "YYYY-MM-DD" string.
 */
export function rawDate(field) {
  if (!field) return '';
  const raw = (typeof field === 'object' && typeof field.date === 'string')
    ? field.date
    : String(field);
  // Take only the date portion — handles both "YYYY-MM-DD" and full datetimes.
  return raw.slice(0, 10);
}

/**
 * Format a local Date as "YYYY-MM-DD"
 */
export function fmtISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Parse "YYYY-MM-DD" as a local Date (avoids UTC midnight → day-shift issues)
 */
export function parseLocal(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// ─── Date range generation ────────────────────────────────────────────────────

/**
 * Generate every expected bucket date for [startStr, endStr] at the given
 * resolution. Matches the API's bucketing convention:
 *  - day     → every calendar day
 *  - week    → every 7 days starting from startStr
 *  - month   → 1st of each calendar month
 *  - quarter → 1st of each calendar quarter (Jan/Apr/Jul/Oct)
 */
export function generateDateRange(startStr, endStr, resolution) {
  const start = parseLocal(startStr);
  const end   = parseLocal(endStr);
  const dates = [];

  if (resolution === 'day') {
    for (let cur = new Date(start); cur <= end; cur.setDate(cur.getDate() + 1)) {
      dates.push(fmtISO(new Date(cur)));
    }
  } else if (resolution === 'week') {
    // Snap to the Monday of the week containing start (ISO week, Monday = day 1).
    // getDay() returns 0=Sun … 6=Sat; shift so Monday lands at offset 0.
    const day = start.getDay();                        // 0–6
    const toMonday = day === 0 ? -6 : 1 - day;        // e.g. Wed(3) → -2, Sun(0) → -6
    const weekStart = new Date(start);
    weekStart.setDate(weekStart.getDate() + toMonday);
    for (let cur = weekStart; cur <= end; cur.setDate(cur.getDate() + 7)) {
      dates.push(fmtISO(new Date(cur)));
    }
  } else if (resolution === 'month') {
    let cur = new Date(start.getFullYear(), start.getMonth(), 1);
    const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);
    while (cur <= endMonth) {
      dates.push(fmtISO(cur));
      cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
    }
  } else if (resolution === 'quarter') {
    const qMonth = Math.floor(start.getMonth() / 3) * 3;
    let cur = new Date(start.getFullYear(), qMonth, 1);
    const endQMonth = Math.floor(end.getMonth() / 3) * 3;
    const endQ = new Date(end.getFullYear(), endQMonth, 1);
    while (cur <= endQ) {
      dates.push(fmtISO(cur));
      cur = new Date(cur.getFullYear(), cur.getMonth() + 3, 1);
    }
  }

  return dates;
}

// ─── Gap filling ──────────────────────────────────────────────────────────────

/**
 * Normalise + gap-fill chart data:
 *  1. normalise d.date to a plain ISO string
 *  2. generate every expected bucket for the range
 *  3. insert ZERO_RECORD for any bucket missing from the API response
 */
export function fillChartGaps(reportData, startDateStr, endDateStr, resolution) {
  const byDate = new Map(
    reportData.map(d => [rawDate(d.date), { ...d, date: rawDate(d.date) }])
  );
  const allDates = generateDateRange(startDateStr, endDateStr, resolution);
  return allDates.map(date => byDate.get(date) ?? { ...ZERO_RECORD, date });
}

// ─── Flow chart data preparation ──────────────────────────────────────────────

/**
 * Compute flow chart segments with stacked positive and negative values
 */
export function computeFlowSegments(chartData) {
  const segs = [];
  for (const d of chartData) {
    let posBase = 0;
    for (const k of POS_KEYS) {
      const v = d[k] || 0;
      if (v > 0) {
        segs.push({ key: k, date: d.date, y0: posBase, y1: posBase + v });
        posBase += v;
      }
    }
    let negBase = 0;
    for (const k of NEG_KEYS) {
      const v = d[k] || 0;
      if (v > 0) {
        segs.push({ key: k, date: d.date, y0: negBase, y1: negBase - v });
        negBase -= v;
      }
    }
  }
  return segs;
}

/**
 * Compute Y domain for flow chart (min/max with padding)
 */
export function computeFlowYDomain(chartData) {
  if (!chartData.length) return [-1, 1];
  let maxPos = 0;
  let minNeg = 0;
  for (const d of chartData) {
    const posSum = POS_KEYS.reduce((s, k) => s + (d[k] || 0), 0);
    const negSum = NEG_KEYS.reduce((s, k) => s + (d[k] || 0), 0);
    if (posSum > maxPos) maxPos = posSum;
    if (-negSum < minNeg) minNeg = -negSum;
  }
  return [minNeg === 0 ? -1 : minNeg * 1.1, maxPos === 0 ? 1 : maxPos * 1.1];
}

// ─── Pending chart data preparation ───────────────────────────────────────────

/**
 * Compute Y domain for pending points chart
 */
export function computePendingYDomain(chartData) {
  if (!chartData.length) return [0, 1];
  let max = 0;
  for (const d of chartData) {
    for (const s of PENDING_SERIES) {
      const v = d[s.key] || 0;
      if (v > max) max = v;
    }
  }
  return [0, max === 0 ? 1 : max * 1.1];
}

/**
 * Check if chart data has any pending points data
 */
export function hasPendingData(chartData) {
  return chartData.some(d => PENDING_SERIES.some(s => (d[s.key] || 0) > 0));
}

// ─── KPI calculation ──────────────────────────────────────────────────────────

/**
 * Calculate KPI tiles from chart data
 */
export function calculateKPIs(chartData) {
  const sum = (k) => chartData.reduce((s, d) => s + (d[k] || 0), 0);
  const earned      = sum('points_earned');
  const added       = sum('points_added');
  const spent       = sum('points_spent');
  const subtracted  = sum('points_subtracted');
  const expired     = sum('points_expired');
  const refunded    = sum('points_refunded');
  const returned    = sum('points_returned');
  const locked      = sum('points_locked');
  const unlocked    = sum('points_unlocked');
  const pActivated  = sum('pending_points_activated');
  const pCanceled   = sum('pending_points_canceled');
  const net = earned + added + refunded + returned + unlocked
            - spent - subtracted - expired - locked;
  return { earned, added, spent, subtracted, expired, refunded, returned,
           locked, unlocked, pActivated, pCanceled, net };
}

// ─── Date formatters ──────────────────────────────────────────────────────────

/**
 * Returns the quarter number (1-4) for a "YYYY-MM-DD" string
 */
function quarterOf(dateStr) {
  const m = Number(dateStr.slice(5, 7));
  return Math.floor((m - 1) / 3) + 1;
}

/**
 * Short label for x-axis ticks — must be compact
 */
export function fmtDateTick(dateStr, resolution) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  if (resolution === 'quarter') return `Q${quarterOf(dateStr)} ${y}`;
  if (resolution === 'month')   return dt.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
  // day or week
  return dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * Rich label for tooltip headings — can be longer
 */
export function fmtTooltipDate(dateStr, resolution, formatDate) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  if (resolution === 'quarter') {
    const q = quarterOf(dateStr);
    const qStartMonth = (q - 1) * 3;        // 0-indexed month of quarter start
    const qEndMonth   = qStartMonth + 2;     // 0-indexed month of quarter end
    const startName = new Date(y, qStartMonth, 1).toLocaleDateString(undefined, { month: 'short' });
    const endName   = new Date(y, qEndMonth,   1).toLocaleDateString(undefined, { month: 'short' });
    return `Q${q} ${y} (${startName}–${endName})`;
  }
  if (resolution === 'month') return dt.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  if (resolution === 'week') {
    const sunday = new Date(y, m - 1, d + 6);
    return `${formatDate(dateStr)} – ${formatDate(fmtISO(sunday))}`;
  }
  return formatDate(dateStr);
}

/**
 * Format Y axis tick values (compact with K/M suffix)
 */
export function fmtYTick(n) {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (abs >= 1_000)     return (n / 1_000).toFixed(0) + 'k';
  return String(Math.round(n));
}

/**
 * Determine X tick modulus based on data density
 */
export function computeXTickMod(domainLength) {
  if (domainLength <= 12) return 1;
  if (domainLength <= 30) return 3;
  if (domainLength <= 90) return 7;
  return 30;
}
