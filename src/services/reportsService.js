import { api } from '../api/client.js';
import { endpoints } from '../api/endpoints.js';

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
