/**
 * A single source of truth for the entity-type → endpoint mapping used by
 * Designer.svelte's CRUD operations (status change, delete, load-more, refresh).
 *
 * Import `getEntityEndpoints(entityType)` instead of copy-pasting the map.
 */
import { endpoints } from '../api/endpoints.js';

const ENDPOINT_MAP = {
  programs: endpoints.programs,
  cardDefinitions: endpoints.cardDefinitions,
  earningRules: endpoints.earningRules,
  incentives: endpoints.incentives,
  rewards: endpoints.rewards,
  tierStructures: endpoints.tierStructures,
};

/**
 * Returns the endpoint group for a given entity type.
 * @param {string} entityType
 * @returns {object}
 */
export function getEntityEndpoints(entityType) {
  return ENDPOINT_MAP[entityType];
}
