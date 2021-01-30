/**
 * @name: OrderableProductsController
 * @author: Ernesto S Melgin <esmelgin@gmail.com>
 * @version 0.9
 * @description
 * Class for connecting addOrderableProduct Lightning Web Component
 */
public with sharing class OrderableProductsController {

    @AuraEnabled(cacheable=true)
    public static List<PricebookEntry> search(String searchKey, Id pricebookId, Integer pageSize) {
        searchKey = (searchKey == null?'':searchKey) + '%';

        List<PricebookEntry> result = [
            SELECT Product2.Id, Product2.Name, UnitPrice FROM PricebookEntry 
             WHERE Product2.Name LIKE :searchKey AND 
                   Pricebook2Id = :pricebookId AND 
                   IsActive = TRUE
                   LIMIT :pageSize
        ];
        return result;
    }

    @AuraEnabled 
    public static void addOrderableProducts(String pricebookItems, String orderId) {
        List<OrderProduct> itemsList = (List<OrderProduct>) JSON.deserialize(pricebookItems, List<OrderProduct>.class);
        Set<Id> setProductsInOrder = new Set<Id>();
        for (OrderProduct item: itemsList) {
            setProductsInOrder.add(item.Id);
        }
        List<OrderItem> orderItemsToSave = new List<OrderItem>();
        List<OrderItem> listItemsResult = [ SELECT Id, Quantity, Product2Id, PricebookEntryId
        FROM OrderItem WHERE OrderId = :orderId AND PricebookEntryId IN :setProductsInOrder ];

        for (OrderItem currOrdItem: listItemsResult) {
            currOrdItem.Quantity = currOrdItem.Quantity + 1;
            orderItemsToSave.add (currOrdItem);
            setProductsInOrder.remove(currOrdItem.PricebookEntryId);
        }

        for (OrderProduct currItem: itemsList) {
            if (setProductsInOrder.contains(currItem.Id)) {
                orderItemsToSave.add( 
                    new OrderItem(OrderId = orderId, PricebookEntryId = currItem.Id, Quantity = 1, UnitPrice = currItem.UnitPrice)
                );
            }
        }
        try {
            upsert orderItemsToSave;
        } catch (DmlException e) {
            String errorText = e.getMessage();
            throw new AuraHandledException(errorText);
        }        
    }

    @AuraEnabled
    public static List<OrderItem> getOrderProducts(String orderId, Integer pageSize) {
        List<OrderItem> orderList;
        orderList = [
            SELECT Id, PricebookEntryId, Product2.Name, UnitPrice, Quantity, TotalPrice FROM OrderItem
            WHERE OrderId = :orderId LIMIT :pageSize
        ];
        return orderList;
    }

    @AuraEnabled
    public static void confirmOrder(String orderId){
        try {
            Order currOrder = [
                SELECT Id, Account.AccountNumber, OrderNumber, Type, Status, 
                (SELECT Id, Product2.Name, Product2.ProductCode, UnitPrice, Quantity FROM OrderItems) 
                FROM Order WHERE Id = :orderId LIMIT 1
            ];

            // create the object based on results.
            Map<String, Object> ordToConfirm = new Map<String, Object>();
            List<Map<String,Object>> orderProducts = new List<Map<String,Object>>();
            for (OrderItem currentItem: currOrder.OrderItems) {
                Map<String, Object> ordItem = new Map<String, Object>();
                ordItem.put('name', currentItem.Product2.Name);
                ordItem.put('code', currentItem.Product2.ProductCode);
                ordItem.put('unitPrice', currentItem.UnitPrice);
                ordItem.put('quantity', Integer.valueOf(currentItem.Quantity));
                orderProducts.add(ordItem);
            }
            ordToConfirm.put('orderProducts', orderProducts);
            ordToConfirm.put('orderNumber', currOrder.OrderNumber);
            ordToConfirm.put('status', currOrder.Status);
            ordToConfirm.put('type', currOrder.Type);
            ordToConfirm.put('accountNumber', currOrder.Account.AccountNumber);

            String msgBody = JSON.Serialize(ordToConfirm);

            HttpRequest req = new HttpRequest();
            req.setEndpoint('callout:Request_Catcher');
            req.setHeader('Accept', 'application/json');
            req.setHeader('Content-Type', 'application/json');
            req.setMethod('POST');
            req.setBody(msgBody);
            Http http = new Http();
            HTTPResponse res = http.send(req);

            System.debug(res);
            if(res.getStatusCode() != 200) {
                throw new CalloutException('Order not confirmed. Response=' + String.valueOf(res.getStatusCode()));
            } else {
                currOrder.Status = 'Activated';
                update currOrder;
            }

        } catch (Exception e) {
           throw new AuraHandledException(e.getMessage());
        }
    }

    public class OrderProduct {
        public Id Id;
        public String Name;
        public Decimal UnitPrice;
    }
}