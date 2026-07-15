import { api } from '../api/client.js';
import { endpoints } from '../api/endpoints.js';
import { buildFilters } from '../api/queryString.js';
import { FAILURE_REASON_KEY_MAP } from '../utils/earningRulesReportConfig.js';

/**
 * Fetch daily reports for a member's card
 * @param {string} programId - Program ID
 * @param {string} memberId - Member ID
 * @param {string} cardId - Card ID
 * @param {Object} params - Query parameters
 * @param {string} params.start_date - Start date (ISO format)
 * @param {string} params.end_date - End date (ISO format)
 * @param {string} params.resolution - Time resolution ('day', 'week', 'month', 'quarter')
 * @returns {Promise<Array>} Array of daily report data
 */
export async function fetchCardReports(programId, memberId, cardId, params) {
  const result = await api.get(
    endpoints.members.dailyReports(programId, memberId, cardId, params)
  );
  return result.data ?? [];
}

/**
 * Calculate date range for reports
 * @param {number} days - Number of days to include
 * @returns {{startDate: string, endDate: string}} ISO date strings
 */
export function calculateDateRange(days) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  };
}

/**
 * Fetch every page of a cursor-paginated daily report endpoint.
 * @param {(programId: string, query: object) => string} endpointFn - e.g. endpoints.programs.spendingDaily
 * @param {string} programId
 * @param {Object} queryParams - start_date/end_date/resolution + optional `filters`
 * @returns {Promise<Array>}
 */
async function fetchAllReportPages(endpointFn, programId, queryParams) {
  let allData = [];
  let cursor = null;

  do {
    const query = { ...queryParams };
    if (cursor) {
      query.cursor = cursor;
    }

    const result = await api.get(endpointFn(programId, query));

    allData = allData.concat(result.data ?? []);
    cursor = result.cursor?.next ?? null;
  } while (cursor);

  return allData;
}

// ─── Spending report ──────────────────────────────────────────────────────

/**
 * Fetch daily spending reports for a program (handles cursor pagination)
 * @param {string} programId - Program ID
 * @param {Object} params - Query parameters
 * @param {string} params.start_date - Start date (ISO format)
 * @param {string} params.end_date - End date (ISO format)
 * @param {string} params.resolution - Time resolution ('day', 'week', 'month', 'quarter')
 * @param {string} [params.card_definition_id] - Optional card definition filter
 * @returns {Promise<Array>} Array of daily spending report data
 */
export async function fetchProgramSpendingDaily(programId, params) {
  const { card_definition_id, ...rest } = params;
  const filters = buildFilters([{ field: 'card_definition_id', value: card_definition_id }]);
  return fetchAllReportPages(endpoints.programs.spendingDaily, programId, { ...rest, ...(filters && { filters }) });
}

/**
 * Fetch spending summary report for a program
 * @param {string} programId - Program ID
 * @param {Object} [params] - Query parameters
 * @param {string} [params.card_definition_id] - Optional card definition filter
 * @returns {Promise<Array>} Array of spending summary data
 */
export async function fetchProgramSpendingSummary(programId, params = {}) {
  const filters = buildFilters([{ field: 'card_definition_id', value: params.card_definition_id }]);
  const result = await api.get(
    endpoints.programs.spendingSummary(programId, filters ? { filters } : {})
  );
  return result.data ?? [];
}

// ─── Points-earnings report ───────────────────────────────────────────────

/**
 * Fetch daily points-earnings reports for a program (handles cursor pagination)
 * @param {string} programId - Program ID
 * @param {Object} params - Query parameters
 * @param {string} params.start_date - Start date (ISO format)
 * @param {string} params.end_date - End date (ISO format)
 * @param {string} params.resolution - Time resolution ('day', 'week', 'month', 'quarter')
 * @param {string} [params.earning_rule_id] - Optional earning rule filter
 * @param {string} [params.card_definition_id] - Optional card definition filter
 * @returns {Promise<Array>} Array of daily points-earnings report data
 */
export async function fetchProgramPointsEarningsDaily(programId, params) {
  const { earning_rule_id, card_definition_id, ...rest } = params;
  const filters = buildFilters([
    { field: 'earning_rule_id', value: earning_rule_id },
    { field: 'card_definition_id', value: card_definition_id },
  ]);
  return fetchAllReportPages(endpoints.programs.pointsEarningsDaily, programId, { ...rest, ...(filters && { filters }) });
}

/**
 * Fetch points-earnings summary report for a program
 * @param {string} programId - Program ID
 * @param {Object} [params] - Query parameters
 * @param {string} [params.earning_rule_id] - Optional earning rule filter
 * @param {string} [params.card_definition_id] - Optional card definition filter
 * @returns {Promise<Array>} Array of points-earnings summary data
 */
export async function fetchProgramPointsEarningsSummary(programId, params = {}) {
  const filters = buildFilters([
    { field: 'earning_rule_id', value: params.earning_rule_id },
    { field: 'card_definition_id', value: params.card_definition_id },
  ]);
  const result = await api.get(
    endpoints.programs.pointsEarningsSummary(programId, filters ? { filters } : {})
  );
  return result.data ?? [];
}

// ─── Earning-rules (trigger outcome) report ──────────────────────────────

/**
 * Flatten the API's `failures_breakdown` object into the flat row fields
 * used by the earning-rules chart/KPI config (see FAILURE_REASON_KEY_MAP),
 * defaulting any reason not present in the row to 0.
 * @param {Object} row
 * @returns {Object} row with flattened failure-reason fields added
 */
function flattenFailuresBreakdown(row) {
  const breakdown = row.failures_breakdown || {};
  const flat = {};
  for (const [apiKey, flatKey] of Object.entries(FAILURE_REASON_KEY_MAP)) {
    flat[flatKey] = breakdown[apiKey] || 0;
  }
  return { ...row, ...flat };
}

/**
 * Fetch daily earning-rules (trigger outcome) reports for a program (handles cursor pagination)
 * @param {string} programId - Program ID
 * @param {Object} params - Query parameters
 * @param {string} params.start_date - Start date (ISO format)
 * @param {string} params.end_date - End date (ISO format)
 * @param {string} params.resolution - Time resolution ('day', 'week', 'month', 'quarter')
 * @param {string} [params.earning_rule_id] - Optional earning rule filter
 * @returns {Promise<Array>} Array of daily earning-rules report data
 */
export async function fetchProgramEarningRulesDaily(programId, params) {
  const { earning_rule_id, ...rest } = params;
  const filters = buildFilters([{ field: 'earning_rule_id', value: earning_rule_id }]);
  const data = await fetchAllReportPages(endpoints.programs.earningRulesDaily, programId, { ...rest, ...(filters && { filters }) });
  return data.map(flattenFailuresBreakdown);
}

/**
 * Fetch earning-rules (trigger outcome) summary report for a program
 * @param {string} programId - Program ID
 * @param {Object} [params] - Query parameters
 * @param {string} [params.earning_rule_id] - Optional earning rule filter
 * @returns {Promise<Array>} Array of earning-rules summary data
 */
export async function fetchProgramEarningRulesSummary(programId, params = {}) {
  const filters = buildFilters([{ field: 'earning_rule_id', value: params.earning_rule_id }]);
  const result = await api.get(
    endpoints.programs.earningRulesSummary(programId, filters ? { filters } : {})
  );
  return (result.data ?? []).map(flattenFailuresBreakdown);
}
