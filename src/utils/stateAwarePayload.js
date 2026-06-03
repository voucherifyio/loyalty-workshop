import { getEntityProperties } from '../config/entityProperties.js';

/**
 * Build update payload based on entity state
 * Only includes fields that are:
 * 1. Allowed for the current state
 * 2. Present in formData with non-empty values
 * 
 * @param {string} entityType - The entity type (e.g., 'programs', 'rewards')
 * @param {string} entityState - The current lifecycle state (e.g., 'ACTIVE', 'DRAFT', 'INACTIVE')
 * @param {Object} formData - The form data object containing field values
 * @param {string} parentStatus - (Optional) Parent entity status for entities that use parent-based editability
 * @returns {Object} Filtered payload ready to send to API
 */
export function buildUpdatePayload(entityType, entityState, formData, parentStatus = null) {
  const properties = getEntityProperties(entityType);
  
  // Use parent status if entity type requires it
  const effectiveState = (properties._usesParentStatus && parentStatus) 
    ? parentStatus 
    : entityState;
  
  const payload = {};

  for (const [fieldName, fieldConfig] of Object.entries(properties)) {
    // Skip metadata fields (fields starting with _)
    if (fieldName.startsWith('_')) continue;
    
    // Check if field is allowed for this state
    if (!fieldConfig.states.includes(effectiveState)) {
      continue;
    }

    // Include field if present in formData
    if (fieldName in formData) {
      const value = formData[fieldName];
      
      // Skip undefined, null, and empty string values
      // Exception: always include 'name', 'status', 'type' fields even if empty
      const isRequiredField = ['name', 'status', 'type'].includes(fieldName);
      
      if (value !== undefined && value !== null && (value !== '' || isRequiredField)) {
        payload[fieldName] = value;
      }
    }
  }

  return payload;
}

/**
 * Build create payload based on entity type
 * Only includes fields that are valid for DRAFT state (default create state)
 * 
 * @param {string} entityType - The entity type
 * @param {Object} formData - The form data object containing field values
 * @returns {Object} Payload ready to send to create API
 */
export function buildCreatePayload(entityType, formData) {
  // Entities are created in DRAFT state by default
  return buildUpdatePayload(entityType, 'DRAFT', formData);
}
