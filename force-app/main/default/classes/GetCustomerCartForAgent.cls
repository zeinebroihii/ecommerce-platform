/**
 * GetCustomerCartForAgent
 * @InvocableMethod — called by General FAQ subagent when customer asks about their cart.
 * Reads the cart JSON saved by nexusEmbeddedChatInit LWC at conversation start.
 */
public without sharing class GetCustomerCartForAgent {

    public class CartRequest {
        @InvocableVariable(label='Contact ID')
        public String contactId;

        @InvocableVariable(label='Messaging End User ID (fallback)')
        public String endUserId;
    }

    public class CartSummary {
        @InvocableVariable(label='Cart Summary')
        public String summary;
    }

    @InvocableMethod(
        label='Get Customer Cart'
        description='Returns a readable summary of the items currently in the customer\'s cart. Call this when the customer asks about their cart, basket, or items they have selected.'
    )
    public static List<CartSummary> getCart(List<CartRequest> requests) {
        CartSummary result = new CartSummary();

        if (requests == null || requests.isEmpty()) {
            result.summary = 'Unable to retrieve cart.';
            return new List<CartSummary>{ result };
        }

        // Resolve ContactId
        Id contactId = null;
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
        // Final fallback: most recently linked MessagingEndUser
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
            result.summary = 'I was unable to identify your account to retrieve your cart.';
            return new List<CartSummary>{ result };
        }

        List<Contact> contacts = [SELECT Agent_Cart_JSON__c FROM Contact WHERE Id = :contactId LIMIT 1];
        if (contacts.isEmpty() || String.isBlank(contacts[0].Agent_Cart_JSON__c)) {
            result.summary = 'Your cart is currently empty.';
            return new List<CartSummary>{ result };
        }

        // Parse the cart JSON and build a readable summary
        String cartJson = contacts[0].Agent_Cart_JSON__c;
        try {
            List<Object> items = (List<Object>) JSON.deserializeUntyped(cartJson);
            if (items.isEmpty()) {
                result.summary = 'Your cart is currently empty.';
                return new List<CartSummary>{ result };
            }

            List<String> lines = new List<String>();
            lines.add('You have ' + items.size() + ' item(s) in your cart:');
            lines.add('');

            Decimal grandTotal = 0;
            for (Object obj : items) {
                Map<String, Object> item = (Map<String, Object>) obj;
                String name  = item.containsKey('name')     ? String.valueOf(item.get('name'))     : 'Unknown product';
                Object qtyObj   = item.containsKey('quantity') ? item.get('quantity') : 1;
                Object priceObj = item.containsKey('price')    ? item.get('price')    : item.containsKey('Price__c') ? item.get('Price__c') : null;

                Integer qty = 1;
                try { qty = Integer.valueOf(String.valueOf(qtyObj)); } catch (Exception e) {}

                Decimal price = 0;
                try { price = Decimal.valueOf(String.valueOf(priceObj)); } catch (Exception e) {}

                Decimal lineTotal = price * qty;
                grandTotal += lineTotal;

                lines.add('• ' + name + ' x' + qty + ' — ' + lineTotal.setScale(2) + ' €');
            }
            lines.add('');
            lines.add('Cart total: ' + grandTotal.setScale(2) + ' €');

            result.summary = String.join(lines, '\n');
        } catch (Exception e) {
            result.summary = 'Your cart has items but I could not parse the details. Please check the Cart section in the portal.';
        }

        return new List<CartSummary>{ result };
    }
}
