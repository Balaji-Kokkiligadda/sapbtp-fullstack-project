const validations = require('../srv/validations');
const orderActions = require('../srv/orderActions');
const chai = require('chai');
const sinon = require('sinon');
const expect = chai.expect;

describe('Business Validations', () => {
  it('calculates lineTotal', () => {
    expect(validations.validatePurchaseOrderItem({ quantity: 5, unitPrice: 10 })).to.equal(50);
    expect(validations.validatePurchaseOrderItem({ quantity: null, unitPrice: 10 })).to.equal(0);
    expect(validations.validatePurchaseOrderItem({ quantity: 5, unitPrice: null })).to.equal(0);
  });

  it('validates PurchaseOrder dates', () => {
    expect(validations.validatePurchaseOrderDates('2024-06-01', '2024-06-01')).to.equal('Expected Delivery Date must be after Order Date');
    expect(validations.validatePurchaseOrderDates('2024-06-01', '2024-06-02')).to.be.null;
  });

  it('validates Shipment', async () => {
    const selectFn = sinon.stub();
    expect(await validations.validateShipment({ quantityShipped: 5 }, selectFn)).to.equal('PurchaseOrderItem reference is required');
    expect(await validations.validateShipment({ purchaseOrderItem_ID: 1 }, selectFn)).to.equal('Quantity shipped is required');
    selectFn.resolves(null);
    expect(await validations.validateShipment({ purchaseOrderItem_ID: 1, quantityShipped: 5 }, selectFn)).to.equal('PurchaseOrderItem 1 not found');
    selectFn.resolves({ quantity: 3 });
    expect(await validations.validateShipment({ purchaseOrderItem_ID: 1, quantityShipped: 5 }, selectFn)).to.equal('Quantity shipped cannot be more than ordered quantity');
    selectFn.resolves({ quantity: 5 });
    expect(await validations.validateShipment({ purchaseOrderItem_ID: 1, quantityShipped: 5 }, selectFn)).to.be.null;
  });
});
//Test cases for SupplierService actions 

// Mock entities
const PurchaseOrder = 'PurchaseOrder';

// Import the actions as pure functions for testing
// If not exported, you can refactor SupplierService.js to export them for easier testing

describe('SupplierService Actions', () => {
  let SELECT, UPDATE, req;

  beforeEach(() => {
    SELECT = {
      one: {
        from: sinon.stub().returnsThis(),
        where: sinon.stub()
      }
    };
    UPDATE = sinon.stub().returns({ set: sinon.stub().returns({ where: sinon.stub() }) });
    req = {
      params: [{ ID: 1 }],
      error: sinon.spy()
    };
  });

  it('confirmOrder: returns 404 if order not found', async () => {
    SELECT.one.where.resolves(null);
    const handler = async (req) => {
      const purchaseOrderId = req.params[0].ID;
      const order = await SELECT.one.from(PurchaseOrder).where({ ID: purchaseOrderId });
      if (!order) return req.error(404, `PurchaseOrder with ID ${purchaseOrderId} not found`);
    };
    await handler(req);
    expect(req.error.calledWith(404, 'PurchaseOrder with ID 1 not found')).to.be.true;
  });

  it('confirmOrder: returns 400 if order not Pending', async () => {
    SELECT.one.where.resolves({ status: 'Confirmed' });
    const handler = async (req) => {
      const purchaseOrderId = req.params[0].ID;
      const order = await SELECT.one.from(PurchaseOrder).where({ ID: purchaseOrderId });
      if (!order) return req.error(404, `PurchaseOrder with ID ${purchaseOrderId} not found`);
      if (order.status !== 'Pending') {
        return req.error(400, `Order ${purchaseOrderId} is not in Pending status (current: ${order.status})`);
      }
    };
    await handler(req);
    expect(req.error.calledWith(400, 'Order 1 is not in Pending status (current: Confirmed)')).to.be.true;
  });

  it('confirmOrder: updates status and returns updated order', async () => {
    SELECT.one.where.onFirstCall().resolves({ status: 'Pending' });
    SELECT.one.where.onSecondCall().resolves({ ID: 1, status: 'Confirmed' });
    UPDATE(PurchaseOrder).set({ status: 'Confirmed' }).where({ ID: 1 });
    const handler = async (req) => {
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
    const result = await handler(req);
    expect(result).to.deep.equal({ ID: 1, status: 'Confirmed' });
  });

  it('cancelOrder: returns 404 if order not found', async () => {
    SELECT.one.where.resolves(null);
    const handler = async (req) => {
      const purchaseOrderId = req.params[0].ID;
      const order = await SELECT.one.from(PurchaseOrder).where({ ID: purchaseOrderId });
      if (!order) return req.error(404, `PurchaseOrder with ID ${purchaseOrderId} not found`);
    };
    await handler(req);
    expect(req.error.calledWith(404, 'PurchaseOrder with ID 1 not found')).to.be.true;
  });

  it('cancelOrder: returns 400 if order not Pending or Confirmed', async () => {
    SELECT.one.where.resolves({ status: 'Delivered' });
    const handler = async (req) => {
      const purchaseOrderId = req.params[0].ID;
      const order = await SELECT.one.from(PurchaseOrder).where({ ID: purchaseOrderId });
      if (!order) return req.error(404, `PurchaseOrder with ID ${purchaseOrderId} not found`);
      if (order.status !== 'Pending' && order.status !== 'Confirmed') {
        return req.error(400, `Order ${purchaseOrderId} can not be cancelled since its (current status: ${order.status})`);
      }
    };
    await handler(req);
    expect(req.error.calledWith(400, 'Order 1 can not be cancelled since its (current status: Delivered)')).to.be.true;
  });

  it('cancelOrder: updates status and returns updated order', async () => {
    SELECT.one.where.onFirstCall().resolves({ status: 'Confirmed' });
    SELECT.one.where.onSecondCall().resolves({ ID: 1, status: 'Cancelled' });
    UPDATE(PurchaseOrder).set({ status: 'Cancelled' }).where({ ID: 1 });
    const handler = async (req) => {
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
    const result = await handler(req);
    expect(result).to.deep.equal({ ID: 1, status: 'Cancelled' });
  });
});

// writing test cases using isolated orderActions functions

describe('Order Actions (Isolated)', () => {
  let SELECT, UPDATE, PurchaseOrder, req;

  beforeEach(() => {
    PurchaseOrder = 'PurchaseOrder';
    SELECT = {
      one: {
        from: sinon.stub().returnsThis(),
        where: sinon.stub()
      }
    };
    UPDATE = sinon.stub().returns({ set: sinon.stub().returns({ where: sinon.stub() }) });
    req = {
      params: [{ ID: 1 }],
      error: sinon.spy()
    };
  });

  it('confirmOrder: returns 404 if order not found', async () => {
    SELECT.one.where.resolves(null);
    await orderActions.confirmOrder({ SELECT, UPDATE, PurchaseOrder }, req);
    expect(req.error.calledWith(404, 'PurchaseOrder with ID 1 not found')).to.be.true;
  });

  it('confirmOrder: returns 400 if order not Pending', async () => {
    SELECT.one.where.resolves({ status: 'Confirmed' });
    await orderActions.confirmOrder({ SELECT, UPDATE, PurchaseOrder }, req);
    expect(req.error.calledWith(400, 'Order 1 is not in Pending status (current: Confirmed)')).to.be.true;
  });

  it('confirmOrder: updates status and returns updated order', async () => {
    SELECT.one.where.onFirstCall().resolves({ status: 'Pending' });
    SELECT.one.where.onSecondCall().resolves({ ID: 1, status: 'Confirmed' });
    const result = await orderActions.confirmOrder({ SELECT, UPDATE, PurchaseOrder }, req);
    expect(result).to.deep.equal({ ID: 1, status: 'Confirmed' });
  });

  it('cancelOrder: returns 404 if order not found', async () => {
    SELECT.one.where.resolves(null);
    await orderActions.cancelOrder({ SELECT, UPDATE, PurchaseOrder }, req);
    expect(req.error.calledWith(404, 'PurchaseOrder with ID 1 not found')).to.be.true;
  });

  it('cancelOrder: returns 400 if order not Pending or Confirmed', async () => {
    SELECT.one.where.resolves({ status: 'Delivered' });
    await orderActions.cancelOrder({ SELECT, UPDATE, PurchaseOrder }, req);
    expect(req.error.calledWith(400, 'Order 1 can not be cancelled since its (current status: Delivered)')).to.be.true;
  });

  it('cancelOrder: updates status and returns updated order', async () => {
    SELECT.one.where.onFirstCall().resolves({ status: 'Confirmed' });
    SELECT.one.where.onSecondCall().resolves({ ID: 1, status: 'Cancelled' });
    const result = await orderActions.cancelOrder({ SELECT, UPDATE, PurchaseOrder }, req);
    expect(result).to.deep.equal({ ID: 1, status: 'Cancelled' });
  });
});