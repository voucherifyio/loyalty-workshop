import { getEntityProperties } from '../config/entityProperties.js';

/**
 * Build update payload based on entity state
 * Only includes fields that are:
 * 1. Allowed for the current state
 * 2. Present in formData
 * 
 * @param {string} entityType - The entity type (e.g., 'programs', 'rewards')
 * @param {string} entityState - The current lifecycle state (e.g., 'ACTIVE', 'DRAFT', 'INACTIVE')
 * @param {Object} formData - The form data object containing field values
 * @param {Object} originalData - (Optional) Original entity data for change detection
 * @param {string} parentStatus - (Optional) Parent entity status for entities that use parent-based editability
 * @returns {Object} Filtered payload ready to send to API
 */
export function buildUpdatePayload(entityType, entityState, formData, originalData = null, parentStatus = null) {
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
      
      // Skip undefined/null values unless they're explicitly set
      if (value !== undefined) {
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

/**
 * Initialize form data from entity data
 * Extracts only the editable fields for the current state
 * 
 * @param {string} entityType - The entity type
 * @param {string} entityState - The current lifecycle state
 * @param {Object} entityData - The full entity data from API
 * @param {string} parentStatus - (Optional) Parent entity status for entities that use parent-based editability
 * @returns {Object} Form data object with only editable fields
 */
export function initializeFormData(entityType, entityState, entityData, parentStatus = null) {
  const properties = getEntityProperties(entityType);
  
  // Use parent status if entity type requires it
  const effectiveState = (properties._usesParentStatus && parentStatus) 
    ? parentStatus 
    : entityState;
  
  const formData = {};

  for (const [fieldName, fieldConfig] of Object.entries(properties)) {
    // Skip metadata fields (fields starting with _)
    if (fieldName.startsWith('_')) continue;
    
    // Only include fields that are editable for this state
    if (fieldConfig.states.includes(effectiveState)) {
      if (fieldName in entityData) {
        formData[fieldName] = entityData[fieldName];
      } else {
        // Provide default empty value for missing fields
        formData[fieldName] = '';
      }
    }
  }

  return formData;
}

/**
 * Validate form data against property definitions
 * 
 * @param {string} entityType - The entity type
 * @param {Object} formData - The form data to validate
 * @returns {Object} Validation result { valid: boolean, errors: { fieldName: errorMessage } }
 */
export function validateFormData(entityType, formData) {
  const properties = getEntityProperties(entityType);
  const errors = {};

  for (const [fieldName, fieldConfig] of Object.entries(properties)) {
    const value = formData[fieldName];
    const validation = fieldConfig.validation || {};

    // Check required fields
    if (validation.required && (value === undefined || value === null || value === '')) {
      errors[fieldName] = `${fieldConfig.label} is required`;
    }

    // Add more validation rules as needed
    // e.g., min/max length, pattern matching, etc.
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
