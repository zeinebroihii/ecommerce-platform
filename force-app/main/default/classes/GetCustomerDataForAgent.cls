/**
 * GetCustomerDataForAgent
 *
 * Unified @InvocableMethod that returns all personal customer data in one call:
 * orders, quotes, and cart. The LLM calls this once and selects the relevant
 * section to relay — no ambiguity between multiple actions.
 *
 * Identity resolution (4-tier fallback, no user input required):
 *   1. Contact Id  — from MessagingEndUser.ContactId (Session Variable)
 *   2. End User Id — from MessagingEndUser.Id  → query ContactId
 *   3. Recent MEU  — most recently linked MessagingEndUser (last 10 min)
 *   4. Fail gracefully
 */
public without sharing class GetCustomerDataForAgent {

    public class DataRequest {
        @InvocableVariable(label='Contact ID')
        public String contactId;

        @InvocableVariable(label='End User ID')
        public String endUserId;
    }

    public class DataSummary {
        @InvocableVariable(label='Customer Data Summary')
        public String summary;
    }

    @InvocableMethod(
        label='Get Customer Data'
        description='Returns all personal customer data: orders, quotes, and cart. Call this whenever the customer asks about their orders, quotes, cart, basket, or any personal account data.'
    )
    public static List<DataSummary> getData(List<DataRequest> requests) {
        DataSummary result = new DataSummary();

        // ── Resolve ContactId ──────────────────────────────────────────────
        Id contactId = null;
        if (requests != null && !requests.isEmpty()) {
            String rawContactId = requests[0].contactId;
            String rawEndUserId = requests[0].endUserId;

            if (String.isNotBlank(rawContactId)) {
                try { contactId = Id.valueOf(rawContactId); } catch (Exception e) {}
            }
            if (contactId == null && String.isNotBlank(rawEndUserId)) {
                try {
                    Id meuId = Id.valueOf(rawEndUserId);
                    List<MessagingEndUser> meus = [SELECT ContactId FROM MessagingEndUser WHERE Id = :meuId LIMIT 1];
                    if (!meus.isEmpty() && meus[0].ContactId != null) contactId = meus[0].ContactId;
                } catch (Exception e) {}
            }
        }
        // Recent MEU fallback — works even when both variables are null
        if (contactId == null) {
            Datetime cutoff = Datetime.now().addMinutes(-10);
            List<MessagingEndUser> recent = [
                SELECT ContactId FROM MessagingEndUser
                WHERE ContactId != null AND LastModifiedDate >= :cutoff
                ORDER BY LastModifiedDate DESC LIMIT 1
            ];
            if (!recent.isEmpty()) contactId = recent[0].ContactId;
        }
        if (contactId == null) {
            result.summary = 'I was unable to identify your account. Please make sure you are logged in to the portal.';
            return new List<DataSummary>{ result };
        }

        // ── Resolve AccountId ──────────────────────────────────────────────
        List<Contact> contacts = [
            SELECT AccountId, Agent_Cart_JSON__c
            FROM Contact WHERE Id = :contactId LIMIT 1
        ];
        if (contacts.isEmpty()) {
            result.summary = 'No account found for your contact. Unable to retrieve data.';
            return new List<DataSummary>{ result };
        }
        Id accountId = contacts[0].AccountId;
        String cartJson = contacts[0].Agent_Cart_JSON__c;

        List<String> sections = new List<String>();

        // ── ORDERS ─────────────────────────────────────────────────────────
        List<Order> orders = new List<Order>();
        if (accountId != null) {
            orders = [
                SELECT Id, OrderNumber, Status, TotalAmount, EffectiveDate,
                       Shipping_City__c, Shipping_Country__c,
                       Shipped_Date__c, Delivered_Date__c,
                       (SELECT Product2.Name, Quantity, TotalPrice FROM OrderItems)
                FROM Order
                WHERE AccountId = :accountId
                ORDER BY CreatedDate DESC LIMIT 10
            ];
        }
        if (orders.isEmpty()) {
            sections.add('=== ORDERS ===\nYou have no orders at the moment.');
        } else {
            List<String> lines = new List<String>();
            lines.add('=== ORDERS ===');
            lines.add('You have ' + orders.size() + ' order(s):');
            for (Order o : orders) {
                String total    = o.TotalAmount != null ? o.TotalAmount.setScale(2) + ' €' : 'N/A';
                String orderDate = o.EffectiveDate != null ? o.EffectiveDate.format() : 'N/A';
                String city  = String.isNotBlank(o.Shipping_City__c) ? o.Shipping_City__c : '';
                String country = String.isNotBlank(o.Shipping_Country__c) ? o.Shipping_Country__c : '';
                String dest  = String.isNotBlank(city) ? city + (String.isNotBlank(country) ? ', ' + country : '') : 'N/A';
                lines.add('• Order #' + o.OrderNumber + ' | ' + o.Status + ' | ' + total + ' | ' + orderDate + ' | Ship to: ' + dest);
                if (o.Shipped_Date__c   != null) lines.add('  Shipped: '   + o.Shipped_Date__c.format('MM/dd/yyyy'));
                if (o.Delivered_Date__c != null) lines.add('  Delivered: ' + o.Delivered_Date__c.format('MM/dd/yyyy'));
                if (!o.OrderItems.isEmpty()) {
                    for (OrderItem oi : o.OrderItems) {
                        String pName = oi.Product2 != null ? oi.Product2.Name : 'Unknown';
                        String pTotal = oi.TotalPrice != null ? oi.TotalPrice.setScale(2) + ' €' : '';
                        lines.add('  - ' + pName + ' x' + Integer.valueOf(oi.Quantity) + ' — ' + pTotal);
                    }
                }
            }
            sections.add(String.join(lines, '\n'));
        }

        // ── QUOTES ─────────────────────────────────────────────────────────
        List<TALEXO_Quote__c> quotes = new List<TALEXO_Quote__c>();
        if (accountId != null) {
            quotes = [
                SELECT Id, Name, Status__c, NegotiationStatus__c,
                       GrandTotal__c, BulkDiscount__c, PaymentTerms__c,
                       ExpirationDate__c, AcceptanceProbability__c,
                       (SELECT ProductName__c, Quantity__c, NetTotal__c FROM NexusQuoteLineItems__r)
                FROM TALEXO_Quote__c
                WHERE Opportunity__r.AccountId = :accountId
                ORDER BY CreatedDate DESC LIMIT 10
            ];
        }
        if (quotes.isEmpty()) {
            sections.add('=== QUOTES ===\nYou have no quotes at the moment.');
        } else {
            List<String> lines = new List<String>();
            lines.add('=== QUOTES ===');
            lines.add('You have ' + quotes.size() + ' quote(s):');
            for (TALEXO_Quote__c q : quotes) {
                String total  = q.GrandTotal__c   != null ? q.GrandTotal__c.setScale(2) + ' €' : 'N/A';
                String expiry = q.ExpirationDate__c != null ? q.ExpirationDate__c.format() : 'N/A';
                Integer daysLeft = q.ExpirationDate__c != null ? Date.today().daysBetween(q.ExpirationDate__c) : null;
                String status = q.Status__c != null ? q.Status__c : 'Draft';
                lines.add('• ' + q.Name + ' | ' + status + ' | ' + total + ' | Valid until: ' + expiry +
                    (daysLeft != null ? ' (' + daysLeft + ' days)' : ''));
                if (q.NegotiationStatus__c != null) lines.add('  Negotiation: ' + q.NegotiationStatus__c);
                if (!q.NexusQuoteLineItems__r.isEmpty()) {
                    for (NexusQuoteLineItem__c li : q.NexusQuoteLineItems__r) {
                        Integer qty = li.Quantity__c != null ? Integer.valueOf(li.Quantity__c) : 1;
                        String net = li.NetTotal__c != null ? li.NetTotal__c.setScale(2) + ' €' : '';
                        lines.add('  - ' + li.ProductName__c + ' x' + qty + ' — ' + net);
                    }
                }
            }
            sections.add(String.join(lines, '\n'));
        }

        // ── CART ───────────────────────────────────────────────────────────
        if (String.isBlank(cartJson) || cartJson == '[]') {
            sections.add('=== CART ===\nYour cart is currently empty.');
        } else {
            try {
                List<Object> items = (List<Object>) JSON.deserializeUntyped(cartJson);
                if (items.isEmpty()) {
                    sections.add('=== CART ===\nYour cart is currently empty.');
                } else {
                    List<String> lines = new List<String>();
                    lines.add('=== CART ===');
                    lines.add('You have ' + items.size() + ' item(s) in your cart:');
                    Decimal grandTotal = 0;
                    for (Object obj : items) {
                        Map<String, Object> item = (Map<String, Object>) obj;
                        String name = item.containsKey('name') ? String.valueOf(item.get('name')) : 'Unknown';
                        Integer qty = 1;
                        Decimal price = 0;
                        try { qty   = Integer.valueOf(String.valueOf(item.get('quantity'))); } catch (Exception e) {}
                        try { price = Decimal.valueOf(String.valueOf(
                            item.containsKey('price') ? item.get('price') : item.get('Price__c'))); } catch (Exception e) {}
                        Decimal lineTotal = price * qty;
                        grandTotal += lineTotal;
                        lines.add('• ' + name + ' x' + qty + ' — ' + lineTotal.setScale(2) + ' €');
                    }
                    lines.add('Cart total: ' + grandTotal.setScale(2) + ' €');
                    sections.add(String.join(lines, '\n'));
                }
            } catch (Exception e) {
                sections.add('=== CART ===\nCart data could not be parsed. Please check the Cart section in the portal.');
            }
        }

        result.summary = String.join(sections, '\n\n');
        return new List<DataSummary>{ result };
    }
}
