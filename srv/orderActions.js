exports.confirmOrder = async ({ SELECT, UPDATE, PurchaseOrder }, req) => {
  const purchaseOrderId = req.params[0].ID;
  const order = await SELECT.one.from(PurchaseOrder).where({ ID: purchaseOrderId });
  if (!order) return req.error(404, `PurchaseOrder with ID ${purchaseOrderId} not found`);
  if (order.status !== 'Pending') {
    return req.error(400, `Order ${purchaseOrderId} is not in Pending status (current: ${order.status})`);
  }
  await UPDATE(PurchaseOrder).set({ status: 'Confirmed' }).where({ ID: purchaseOrderId });
  const updatedOrder = await SELECT.one.from(PurchaseOrder).where({ ID: purchaseOrderId });
  return updatedOrder;
};

exports.cancelOrder = async ({ SELECT, UPDATE, PurchaseOrder }, req) => {
  const purchaseOrderId = req.params[0].ID;
  const order = await SELECT.one.from(PurchaseOrder).where({ ID: purchaseOrderId });
  if (!order) return req.error(404, `PurchaseOrder with ID ${purchaseOrderId} not found`);
  if (order.status !== 'Pending' && order.status !== 'Confirmed') {
    return req.error(400, `Order ${purchaseOrderId} can not be cancelled since its (current status: ${order.status})`);
  }
  await UPDATE(PurchaseOrder).set({ status: 'Cancelled' }).where({ ID: purchaseOrderId });
  const updatedOrder = await SELECT.one.from(PurchaseOrder).where({ ID: purchaseOrderId });
  return updatedOrder;
};