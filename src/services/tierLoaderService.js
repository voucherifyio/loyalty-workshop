import { api } from '../api/client.js';
import { endpoints } from '../api/endpoints.js';

// Internal cache for tier data
const tiersCache = {};
const loadingTiers = new Set();

/**
 * Load tiers for a tier structure with caching
 * @param {string} tierStructureId 
 * @returns {Promise<Array>} Array of tiers
 */
export async function loadTiers(tierStructureId) {
  // Return cached tiers if available
  if (tiersCache[tierStructureId]) {
    return tiersCache[tierStructureId];
  }

  // Return null if already loading
  if (loadingTiers.has(tierStructureId)) {
    return null;
  }

  loadingTiers.add(tierStructureId);

  try {
    const response = await api.get(endpoints.tierStructures.tiers.list(tierStructureId));
    const tiers = response.data || [];
    tiersCache[tierStructureId] = tiers;
    return tiers;
  } catch (err) {
    // Log error but don't throw - return empty array for graceful degradation
    console.error('Failed to load tiers:', err); // eslint-disable-line no-console
    tiersCache[tierStructureId] = [];
    return [];
  } finally {
    loadingTiers.delete(tierStructureId);
  }
}

/**
 * Check if tiers are currently loading
 * @param {string} tierStructureId 
 * @returns {boolean}
 */
export function isLoading(tierStructureId) {
  return loadingTiers.has(tierStructureId);
}
