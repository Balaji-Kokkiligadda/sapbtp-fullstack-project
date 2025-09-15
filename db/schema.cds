using {cuid,managed,sap.common.CodeList,Country,Currency  } from '@sap/cds/common';

namespace balaji.project;

entity Supplier : cuid ,managed{
    name : String not null;
    taxNumber : String @assert.unique;// put directly on field
    address: String not null;
    email: EMailAddress not null;
    phone: PhoneNumber;
    status: String enum{
        Active;
        Inactive
    } not null;
}
entity PurchaseOrder: cuid,managed{
    orderNumber:String not null @assert.unique;
    supplier: Association to Supplier not null;
    orderDate: Date not null;
    expectedDeliveryDate: Date;// validation in srv
    status: String enum{
        Pending;
        Confirmed;
        Shipped;
        Delivered;
        Cancelled
    }not null default 'Pending';
    totalAmount: Decimal(15,2) default 0 @assert.range: { min: 0 };
    currency: Currency @cds.default: 'INR';
  
}
entity PurchaseOrderItem:cuid,managed{
    purchaseOrder:Association to PurchaseOrder not null;
    itemNumber: Integer not null @assert.range: { min: 1 } @assert.unique: [purchaseOrder, itemNumber]; // composite unique key with purchaseOrder
    productCode: String not null;
    description: String;
    quantity: Decimal(15,2)not null @assert.range: { min: 1 };
    unitPrice: Decimal(15,2)not null @assert.range: { min: 0 };
    lineTotal: Decimal(15,2);
    // this.before(['CREATE', 'UPDATE'], 'PurchaseOrderItem', each => {
    // each.lineTotal = (each.quantity || 0) * (each.unitPrice || 0);
    // }) as to be implemented in srv
    uom: String;
}

entity Shipment: cuid,managed{
    purchaseOrderItem: Association to PurchaseOrderItem not null;
    shipmentDate: Date not null; // srv validation against PO.orderDate
    quantityShipped: Decimal(15,2) not null @assert.range: { min: 1 }; // srv validation against POItem.quantity
    carrier: String;
    trackingNumber: String;
    status: String enum{
        Shipped;
        ![In Transit];
        Delivered;
        Exception;
    }not null;

}
entity Attachment : cuid, managed {
    attachedToPO     : Association to PurchaseOrder;
    attachedToPOItem : Association to PurchaseOrderItem;
    // Either attachedToPO or attachedToPOItem must be set, but not both
    filename   : String(255) not null;
    fileType   : String(50);        // e.g. "invoice", "spec", "image"
    fileURL    : String(500) not null;
}

type EMailAddress : String @assert.format : '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$';
type PhoneNumber  : String @assert.format : '^\\+?[1-9]\\d{1,14}$';




