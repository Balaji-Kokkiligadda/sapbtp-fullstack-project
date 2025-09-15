using { balaji.project as mydb } from '../db/schema';
 
service SupplierService @(path:'SupplierService') {

  entity Supplier as projection on mydb.Supplier;

  entity PurchaseOrder as projection on mydb.PurchaseOrder
  actions{
    action confirmOrder() returns PurchaseOrder;
    action cancelOrder() returns PurchaseOrder;
  };
  entity PurchaseOrderItem as projection on mydb.PurchaseOrderItem;
  entity Shipment as projection on mydb.Shipment;
  entity Attachment as projection on mydb.Attachment;

}
