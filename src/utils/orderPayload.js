/**
 * Build a paid order payload from form inputs
 * Used by CreateOrderModal and OrderSelectionModal
 * 
 * @param {Object} options - Order configuration
 * @param {string} options.customerId - Customer ID
 * @param {string} options.createMode - 'simple' or 'items'
 * @param {string} options.orderAmount - Order amount (for simple mode)
 * @param {Array} options.orderItems - Order items array (for items mode)
 * @returns {Object} Order payload ready for API
 */
export function buildPaidOrderPayload({ customerId, createMode, orderAmount, orderItems }) {
  const orderPayload = {
    customer_id: customerId,
    status: 'PAID'
  };

  if (createMode === 'simple') {
    orderPayload.amount = parseInt(orderAmount);
  } else {
    // Add items to the payload
    orderPayload.items = orderItems.map(item => {
      const itemData = {
        price: parseInt(item.price),
        quantity: parseInt(item.quantity),
        amount: parseInt(item.price) * parseInt(item.quantity)
      };
      if (item.product_id && item.product_id.trim()) {
        itemData.product_id = item.product_id.trim();
      }
      if (item.sku_id && item.sku_id.trim()) {
        itemData.sku_id = item.sku_id.trim();
      }
      return itemData;
    });
    // Calculate total amount from items
    orderPayload.amount = orderPayload.items.reduce((sum, item) => sum + item.amount, 0);
  }

  return orderPayload;
}
