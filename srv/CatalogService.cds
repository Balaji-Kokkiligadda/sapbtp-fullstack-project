using { balaji.project as mydb } from '../db/schema';

service CatalogService {

    entity supplier as projection on mydb.Supplier;
    entity purchaseOrder as projection on mydb.PurchaseOrder;
    entity purchaseOrderItem as projection on mydb.PurchaseOrderItem;
    entity shipment as projection on mydb.Shipment;
    entity attachment as projection on mydb.Attachment;

}