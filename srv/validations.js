exports.validatePurchaseOrderItem = (data) => {
  return (data.quantity || 0) * (data.unitPrice || 0);
};

exports.validatePurchaseOrderDates = (orderDate, expectedDeliveryDate) => {
  if (orderDate && expectedDeliveryDate) {
    const od = new Date(orderDate);
    const edd = new Date(expectedDeliveryDate);
    if (edd <= od) {
      return 'Expected Delivery Date must be after Order Date';
    }
  }
  return null;
};

exports.validateShipment = async (data, selectFn) => {
  if (!data.purchaseOrderItem_ID) {
    return 'PurchaseOrderItem reference is required';
  }
  if (!data.quantityShipped && data.quantityShipped !== 0) {
    return 'Quantity shipped is required';
  }
  const orderItem = await selectFn(data.purchaseOrderItem_ID);
  if (!orderItem) {
    return `PurchaseOrderItem ${data.purchaseOrderItem_ID} not found`;
  }
  if (data.quantityShipped > orderItem.quantity) {
    return 'Quantity shipped cannot be more than ordered quantity';
  }
  return null;
};