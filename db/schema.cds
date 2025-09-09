using {cuid,managed,sap.common.CodeList,Country,Currency  } from '@sap/cds/common';

namespace balaji.project;

entity Supplier : cuid ,managed{
    name : String not null;
    taxNumber : String;
    address: String not null;
    email: EMailAddress not null;
    phone: PhoneNumber;
    status: String enum{
        Active;
        Inactive
    } not null;
}
entity PurchaseOrder: cuid,managed,{
    orderNumber:String not null;
    supplier: Association to Supplier not null;
    orderDate: Date;
    expectedDeliveryDate: Date;
    status: String enum{
        Pending;
        Confirmed;
        Shipped;
        Delivered;
        Cancelled
    }not null;
    totalAmount: Decimal(15,2) default 0;
    currency: Currency;
}
entity PurchaseOrderItem:cuid,managed{
    purchaseOrder:Association to PurchaseOrder not null;
    itemNumber: Integer;
    productCode: String not null;
    description: String;
    quantity: Decimal(15,2);
    unitPrice: Decimal(15,2);
    lineTotal: Decimal(15,2);
    // this.before(['CREATE', 'UPDATE'], 'PurchaseOrderItem', each => {
    // each.lineTotal = (each.quantity || 0) * (each.unitPrice || 0);
    // }) as to be implemented in srv
    uom: String;
}

entity Shipment: cuid,managed{
    purchaseOrderItem: Association to PurchaseOrderItem not null;
    shipmentDate: Date not null;
    quantityShipped: Decimal(15,2) not null;
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

    filename   : String(255) not null;
    fileType   : String(50);        // e.g. "invoice", "spec", "image"
    fileURL    : String(500) not null;
}

// Uniqueness constraint on taxNumber (optional field)
@assert.unique: { taxNumber: [ taxNumber ] }
@assert.unique: { orderNumber: [ orderNumber ] }

@assert.unique: { PO_Item: [ purchaseOrder, itemNumber ] }


type EMailAddress : String @assert.format : '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$';
type PhoneNumber  : String @assert.format : '^\\+?[1-9]\\d{1,14}$';

annotate PurchaseOrder with {
    expectedDeliveryDate @assert.range:{min: orderDate};
    totalAmount @assert.range:{min: 0};
    currency @cds.default: 'INR'
}
annotate PurchaseOrderItem with {
    quantity @assert.range:{min: 1};
    unitPrice @assert.range:{min: 0};
    itemNumber @assert.range:{min: 1};
};
annotate Shipment with {
    shipmentDate @assert.range:{min: orderDate};
    quantityShipped @assert.range:{
        min:0,
        max:quantity//CDS handles basic constraints (types, enums, mandatory fields, ranges)
        //CAP service logic enforces cross-entity rules (dates, remaining qty)
    };

};



