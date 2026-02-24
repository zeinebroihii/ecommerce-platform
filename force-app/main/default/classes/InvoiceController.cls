/**
 * InvoiceController
 * Controller for the InvoiceTemplate Visualforce page.
 *
 * FIX: Removed Account.PersonEmail — this org uses standard B2B Accounts,
 *      not Person Accounts. Email comes from the primary Contact instead.
 */
public with sharing class InvoiceController {

    public Order ord { get; private set; }
    public String formattedDate { get; private set; }

    public InvoiceController() {
        Id orderId = ApexPages.currentPage().getParameters().get('id');

        if (orderId == null) {
            ord = new Order();
            return;
        }

        ord = [
            SELECT Id, OrderNumber, Status, TotalAmount, EffectiveDate,
                   Account.Name, Account.BillingStreet, Account.BillingCity,
                   Account.BillingState, Account.BillingPostalCode, Account.BillingCountry,
                   Shipping_Street__c, Shipping_City__c, Shipping_State__c,
                   Shipping_Zip__c, Shipping_Country__c,
                   (SELECT Product2.Name, Product2.Family, Quantity, UnitPrice, TotalPrice
                    FROM OrderItems)
            FROM Order
            WHERE Id = :orderId
            LIMIT 1
        ];

        formattedDate = ord.EffectiveDate != null
            ? ord.EffectiveDate.format()
            : Date.today().format();
    }
}
