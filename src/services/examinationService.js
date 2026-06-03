import { api } from '../api/client.js';
import { endpoints } from '../api/endpoints.js';

/**
 * Clean empty metadata objects from a payload
 * Recursively removes metadata fields with empty objects
 * @param {Object} obj - The object to clean
 */
function cleanMetadata(obj) {
  if (obj && typeof obj === 'object') {
    Object.keys(obj).forEach(key => {
      if (key === 'metadata' && obj[key] && Object.keys(obj[key]).length === 0) {
        delete obj[key];
      } else if (typeof obj[key] === 'object') {
        cleanMetadata(obj[key]);
      }
    });
  }
}

/**
 * Build and clean examination request payload
 * @param {Object} payload - Raw payload to clean
 * @param {boolean} handleSpecificTrigger - Whether to handle SPECIFIC trigger cleanup (earnings only)
 * @returns {Object} Cleaned payload ready for API
 */
export function buildExaminationPayload(payload, handleSpecificTrigger = false) {
  const cleaned = JSON.parse(JSON.stringify(payload));
  
  // Convert amount to number if it's a string (for order paid scenarios)
  if (cleaned.customer_order_paid?.order?.amount) {
    cleaned.customer_order_paid.order.amount = parseInt(cleaned.customer_order_paid.order.amount);
  }

  // Remove empty metadata objects
  cleanMetadata(cleaned);

  // Remove customer/member if they only have empty metadata
  if (cleaned.customer && Object.keys(cleaned.customer).length === 0) {
    delete cleaned.customer;
  }
  if (cleaned.member && Object.keys(cleaned.member).length === 0) {
    delete cleaned.member;
  }

  // For SPECIFIC trigger, only include the relevant event data (earnings examination only)
  if (handleSpecificTrigger && cleaned.trigger?.type === 'SPECIFIC') {
    const event = cleaned.trigger.specific.event;
    if (event === 'customer.order.paid') {
      delete cleaned.customer_segment_entered;
      delete cleaned.customer_custom_event;
    } else if (event === 'customer.segment.entered') {
      delete cleaned.customer_order_paid;
      delete cleaned.customer_custom_event;
    } else if (event === 'customer.custom_event') {
      delete cleaned.customer_order_paid;
      delete cleaned.customer_segment_entered;
    }
  }

  return cleaned;
}

/**
 * Run earnings examination
 * @param {Object} payload - Examination scenario payload
 * @returns {Promise<Object>} Examination results
 */
export async function runEarningsExamination(payload) {
  const requestPayload = buildExaminationPayload(payload, true); // Handle SPECIFIC triggers
  return await api.post(endpoints.examine.run(), requestPayload);
}

/**
 * Run spending examination (rewards)
 * @param {Object} payload - Examination scenario payload  
 * @returns {Promise<Object>} Spending examination results
 */
export async function runSpendingExamination(payload) {
  const requestPayload = buildExaminationPayload(payload);
  return await api.post(endpoints.examine.rewards(), requestPayload);
}

/**
 * Create default "ALL" triggers payload for earnings examination
 * @param {string} memberId - Member ID to examine
 * @returns {Object} Default examination payload
 */
export function createDefaultEarningsPayload(memberId) {
  return {
    trigger: { type: 'ALL' },
    customer_identification: { type: 'member_id', member_id: memberId },
    customer_order_paid: {
      order: { amount: 10000 },
      customer: { metadata: {} },
      member: { metadata: {} }
    },
    customer_segment_entered: {
      customer: { metadata: {} },
      member: { metadata: {} }
    },
    customer_custom_event: {
      type: 'ALL',
      all: {
        custom_event: { metadata: {} },
        customer: { metadata: {} },
        member: { metadata: {} }
      }
    }
  };
}

/**
 * Create default basic payload for spending examination
 * @param {string} memberId - Member ID to examine
 * @returns {Object} Default spending payload
 */
export function createDefaultSpendingPayload(memberId) {
  return {
    customer_identification: {
      type: 'member_id',
      member_id: memberId
    }
  };
}
