/**
 * GetCustomerOrdersForAgent
 *
 * @InvocableMethod — called by the Nexus Support Agent (Service Agent)
 * when a customer asks about their orders.
 * Input: contactId from the endUserContactId context variable.
 * Output: plain-text summary the LLM reads and relays conversationally.
 */
public without sharing class GetCustomerOrdersForAgent {

    public class OrderRequest {
        @InvocableVariable(label='Contact ID')
        public String contactId;

        @InvocableVariable(label='Messaging End User ID (fallback — resolves ContactId from MessagingEndUser record)')
        public String endUserId;

        @InvocableVariable(label='Customer Email (last-resort fallback)')
        public String email;
    }

    public class OrderSummary {
        @InvocableVariable(label='Orders Summary')
        public String summary;
    }

    @InvocableMethod(
        label='Get Customer Orders'
        description='Fetches the orders for the logged-in portal customer and returns a readable summary. Pass endUserContactId as the contactId input.'
    )
    public static List<OrderSummary> getOrders(List<OrderRequest> requests) {
        OrderSummary result = new OrderSummary();

        if (requests == null || requests.isEmpty()) {
            result.summary = 'No customer information provided. I cannot retrieve your orders.';
            return new List<OrderSummary>{ result };
        }

        String rawContactId = requests[0].contactId;
        String rawEndUserId = requests[0].endUserId;
        String email        = requests[0].email;

        // Resolve ContactId — 3-tier fallback:
        // 1. Direct ContactId from endUserContactId context variable
        // 2. MessagingEndUser.ContactId (stamped by linkContactToSession at conversation start)
        // 3. Email lookup
        Id contactId = null;
        if (String.isNotBlank(rawContactId)) {
            try { contactId = Id.valueOf(rawContactId); } catch (Exception e) {}
        }
        if (contactId == null && String.isNotBlank(rawEndUserId)) {
            try {
                Id meuId = Id.valueOf(rawEndUserId);
                List<MessagingEndUser> meus = [SELECT ContactId FROM MessagingEndUser WHERE Id = :meuId LIMIT 1];
                if (!meus.isEmpty() && meus[0].ContactId != null) {
                    contactId = meus[0].ContactId;
                }
            } catch (Exception e) {}
        }
        if (contactId == null && String.isNotBlank(email)) {
            List<Contact> byEmail = [SELECT Id FROM Contact WHERE Email = :email LIMIT 1];
            if (!byEmail.isEmpty()) contactId = byEmail[0].Id;
        }
        // Final fallback: find the most recently linked MessagingEndUser (stamped by
        // linkContactToSession at conversation start, within last 10 minutes).
        // This works even when all variable mappings are empty/null.
        if (contactId == null) {
            Datetime cutoff = Datetime.now().addMinutes(-10);
            List<MessagingEndUser> recent = [
                SELECT ContactId FROM MessagingEndUser
                WHERE ContactId != null
                AND LastModifiedDate >= :cutoff
                ORDER BY LastModifiedDate DESC
                LIMIT 1
            ];
            if (!recent.isEmpty()) contactId = recent[0].ContactId;
        }
        if (contactId == null) {
            result.summary = 'I was unable to identify your account. Please make sure you are logged in to the portal.';
            return new List<OrderSummary>{ result };
        }

        Id accountId = null;
        List<Contact> contacts = [SELECT AccountId FROM Contact WHERE Id = :contactId LIMIT 1];
        if (!contacts.isEmpty()) {
            accountId = contacts[0].AccountId;
        }

        if (accountId == null) {
            result.summary = 'No account associated with your contact. Unable to retrieve orders.';
            return new List<OrderSummary>{ result };
        }

        // Fetch last 10 orders with line items
        List<Order> orders = [
            SELECT
                Id, OrderNumber, Status, TotalAmount, EffectiveDate,
                Shipping_City__c, Shipping_Country__c,
                Shipped_Date__c, Delivered_Date__c,
                (
                    SELECT Product2.Name, Quantity, UnitPrice, TotalPrice
                    FROM OrderItems
                )
            FROM Order
            WHERE AccountId = :accountId
            ORDER BY CreatedDate DESC
            LIMIT 10
        ];

        if (orders.isEmpty()) {
            result.summary = 'You have no orders at the moment.';
            return new List<OrderSummary>{ result };
        }

        List<String> lines = new List<String>();
        lines.add('You have ' + orders.size() + ' order(s). Here are the details:');
        lines.add('');

        for (Order o : orders) {
            String status = translateStatus(o.Status);
            String orderDate = o.EffectiveDate != null ? o.EffectiveDate.format() : 'N/A';
            String total = o.TotalAmount != null ? o.TotalAmount.setScale(2) + ' €' : 'N/A';
            String city = String.isNotBlank(o.Shipping_City__c) ? o.Shipping_City__c : '';
            String country = String.isNotBlank(o.Shipping_Country__c) ? o.Shipping_Country__c : '';
            String destination = String.isNotBlank(city) ? city + (String.isNotBlank(country) ? ', ' + country : '') : 'N/A';

            lines.add('Order #' + o.OrderNumber);
            lines.add('  Status: ' + status);
            lines.add('  Date: ' + orderDate);
            lines.add('  Total: ' + total);
            lines.add('  Ship to: ' + destination);

            if (o.Shipped_Date__c != null) {
                lines.add('  Shipped on: ' + o.Shipped_Date__c.format('MM/dd/yyyy'));
            }
            if (o.Delivered_Date__c != null) {
                lines.add('  Delivered on: ' + o.Delivered_Date__c.format('MM/dd/yyyy'));
            }

            if (!o.OrderItems.isEmpty()) {
                lines.add('  Products:');
                for (OrderItem oi : o.OrderItems) {
                    String productName = oi.Product2 != null ? oi.Product2.Name : 'Unknown product';
                    Integer qty = Integer.valueOf(oi.Quantity);
                    String itemTotal = oi.TotalPrice != null ? oi.TotalPrice.setScale(2) + ' €' : '';
                    lines.add('    • ' + productName + ' x' + qty + ' — ' + itemTotal);
                }
            }
            lines.add('');
        }

        result.summary = String.join(lines, '\n');
        return new List<OrderSummary>{ result };
    }

    private static String translateStatus(String s) {
        if (s == 'Activated') return 'Activated';
        if (s == 'Draft')     return 'Draft';
        if (s == 'Shipped')   return 'Shipped';
        if (s == 'Delivered') return 'Delivered';
        if (s == 'Cancelled') return 'Cancelled';
        return s != null ? s : 'In progress';
    }
}
