@isTest
private class TestOrderableProductsController {
    private static Id stdPricebookId;

    @TestSetup
    static void makeData(){
        List<Product2> prodList = new List<Product2>();
        for(Integer i=0; i<10;i++) {
            prodList.add(new Product2(ProductCode = 'C001', Name = 'Product_N'+i, isActive = true));
        }
        insert prodList;

        List<PricebookEntry> pricebookEntries = new List<PricebookEntry>();
        Id stdPricebookId =  Test.getStandardPricebookId();
        for(Integer i=0; i < 10; i++) {
            pricebookEntries.add(new PricebookEntry(
                Pricebook2Id = stdPricebookId, 
                Product2Id = prodList[i].Id, 
                UnitPrice = Decimal.valueOf(Math.random() * 100), 
                IsActive = prodList[i].IsActive
            ));
        }
        insert pricebookEntries;
    }
    @isTest
    private static void testSearchPositive() {
        List<PricebookEntry> prcBkEntries = OrderableProductsController.search('Product_N', Test.getStandardPricebookId(), 5);
        System.assertEquals(5, prcBkEntries.size());
    }

    @isTest
    private static void testGetOrderProductsPossitive() {
        List<Account> testAccts = createAccounts();
        List<Contact> testCtcts = createContacts(testAccts);
        Contract testContract = createContract(testAccts[0].Id);
        Order testOrder = createOrder(testAccts[0].Id, testContract.Id);
        List<OrderItem> listCreated = createOrderItems(testOrder.Id, Test.getStandardPricebookId());

        List<OrderItem> actualSize = OrderableProductsController.getOrderProducts(testOrder.Id, 5);
        System.assertEquals(5, actualSize.size());
    }

    @isTest
    private static void testConfirmOrderPossitive() {
        List<Account> testAccts = createAccounts();
        List<Contact> testCtcts = createContacts(testAccts);
        Contract testContract = createContract(testAccts[0].Id);
        testContract.Status = 'Activated';
        update testContract;
        Order testOrder = createOrder(testAccts[0].Id, testContract.Id);
        List<OrderItem> listCreated = createOrderItems(testOrder.Id, Test.getStandardPricebookId());

		MockHttpResponseGenerator fakeResponse = new MockHttpResponseGenerator(200);
        Test.setMock(HttpCalloutMock.class, fakeResponse);
        Test.startTest();
            OrderableProductsController.confirmOrder(testOrder.Id);
        Test.stopTest();
        Order orderWNewStat = [SELECT Id, Status FROM Order WHERE Id = :testOrder.Id];
        System.assertEquals('Activated', orderWNewStat.Status);

    }

    @isTest 
    private static void testConfirmOrderNegative() {

    }

    @isTest 
    private static void testAddOrderableProductsPositive() {
        Id stdPricebookId = Test.getStandardPricebookId();
        Integer created = 2;
        List<Account> testAccts = createAccounts();
        List<Contact> testCtcts = createContacts(testAccts);
        Contract testContract = createContract(testAccts[0].Id);
        Order testOrder = createOrder(testAccts[0].Id, testContract.Id);
        List<OrderableProductsController.OrderProduct> prodOrderLst = new List<OrderableProductsController.OrderProduct>();
        for (PricebookEntry currPrEnt:[SELECT Id, Product2.Name, UnitPrice FROM PricebookEntry WHERE Pricebook2Id = :stdPricebookId LIMIT :created]) {
            OrderableProductsController.OrderProduct pr1 = new OrderableProductsController.OrderProduct();
            pr1.Id = currPrEnt.Id;
            pr1.Name = currPrEnt.Product2.Name;
            pr1.UnitPrice = currPrEnt.UnitPrice;
            prodOrderLst.add(pr1);
        }
        String pricebookItems = JSON.serialize(prodOrderLst);
        OrderableProductsController.addOrderableProducts(pricebookItems, testOrder.Id);
        Integer orderedItems = [SELECT count() FROM OrderItem WHERE OrderId = :testOrder.Id];
        System.assertEquals(created, orderedItems);
    }



    /**
     * Helper functions
     */

    private static List<Account> createAccounts() {
        List<Account> testAccts = new List<Account>();
        for(Integer i=0;i<3;i++) {
            testAccts.add(new Account(Name = 'TestAcct'+i, AccountNumber='ACC0'+i));
        }
        insert testAccts;
        return testAccts;
    }

    private static List<Contact> createContacts(List<Account> testAccounts) {
        List<Contact> testCtcts = new List<Contact>();
        for(Integer i=0; i<3; i++) {
            testCtcts.add(new Contact(FirstName = 'Desiderius' + i, LastName='Tinitus', AccountId = testAccounts[i].Id));
        }
        insert testCtcts;
        return testCtcts;
    }

    private static Contract createContract(Id accountId) {
        Contract testContract = new Contract(
            Status = 'Draft', 
            Name = 'Test Contract', 
            AccountId = accountId, 
            ContractTerm = 6, 
            StartDate = Date.today()
        );
        insert testContract;
        return testContract;
    }

    private static Order createOrder(Id accountId, Id contractId) {
        Id stdPricebookId = Test.getStandardPricebookId();
        Order testOrder = new Order(
            Name = 'TestOrder', ContractId = contractId, AccountId = accountId, EffectiveDate = Date.today(), Status = 'Draft', Pricebook2Id = stdPricebookId
        );
        insert testOrder;
        return testOrder;
    }

    private static List<OrderItem> createOrderItems(Id orderId, Id pricebook2Id ) {
        List<OrderItem> orderItemLst = new List<OrderItem>();
        for(PricebookEntry currPbEnt: [SELECT Id, Product2Id, UnitPrice FROM PricebookEntry WHERE Pricebook2Id = :pricebook2Id]) {
            orderItemLst.add(
                new OrderItem(OrderId = orderId, PricebookEntryId = currPbEnt.Id, Quantity = 1, UnitPrice = currPbEnt.UnitPrice)
            );
        }
        insert orderItemLst;
        return orderItemLst;
    }
}