const cds = require("@sap/cds");
const validations = require('./validations');
const orderActions = require('./orderActions');
module.exports=cds.service.impl(async function() {
    const { PurchaseOrder, PurchaseOrderItem, Supplier, Shipment } = this.entities

  // Bound action confirmOrder
  this.on('confirmOrder', async (req) => {
    return orderActions.confirmOrder({ SELECT, UPDATE, PurchaseOrder }, req);
  });
  this.on('cancelOrder', async (req) => {
    return orderActions.cancelOrder({ SELECT, UPDATE, PurchaseOrder }, req);
  });
  this.before(['CREATE','UPDATE'], PurchaseOrderItem, (req) => {
    req.data.lineTotal = validations.validatePurchaseOrderItem(req.data);
  });
  this.before(['CREATE','UPDATE'], PurchaseOrder, (req) => {
    const error = validations.validatePurchaseOrderDates(req.data.orderDate, req.data.expectedDeliveryDate);
    if (error) req.error(400, error);
  });
  this.before(['CREATE','UPDATE'], Shipment, async (req) => {
    const error = await validations.validateShipment(req.data, async (id) => {
      return await SELECT.one.from(PurchaseOrderItem).columns('quantity').where({ ID: id });
    });
    if (error) req.error(400, error);
  });


})