import { api } from '../api/client.js';
import { getEntityEndpoints } from '../utils/entityCrud.js';

/**
 * Change entity status (activate, deactivate, draft)
 * @param {string} entityType - Type of entity (programs, cardDefinitions, etc.)
 * @param {string} id - Entity ID
 * @param {string} action - Action to perform (activate, deactivate, draft)
 * @returns {Promise<void>}
 */
export async function changeEntityStatus(entityType, id, action) {
  await api.post(getEntityEndpoints(entityType)[action](id));
}

/**
 * Delete an entity
 * @param {string} entityType - Type of entity (programs, cardDefinitions, etc.)
 * @param {string} id - Entity ID
 * @returns {Promise<void>}
 */
export async function deleteEntity(entityType, id) {
  await api.delete(getEntityEndpoints(entityType).delete(id));
}
