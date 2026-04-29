/**
 * GetCustomerQuotesForAgent
 *
 * @InvocableMethod — called by the Nexus Support Agent (Service Agent)
 * when a customer asks about their quotes / devis.
 * Input: contactId from the endUserContactId context variable.
 * Output: plain-text summary the LLM reads and relays conversationally.
 */
public without sharing class GetCustomerQuotesForAgent {

    public class QuoteRequest {
        @InvocableVariable(label='Contact ID')
        public String contactId;

        @InvocableVariable(label='Messaging End User ID (fallback — resolves ContactId from MessagingEndUser record)')
        public String endUserId;

        @InvocableVariable(label='Customer Email (last-resort fallback)')
        public String email;
    }

    public class QuoteSummary {
        @InvocableVariable(label='Quotes Summary')
        public String summary;
    }

    @InvocableMethod(
        label='Get Customer Quotes'
        description='Fetches the quotes (devis) for the logged-in portal customer and returns a readable summary. Pass endUserContactId as the contactId input.'
    )
    public static List<QuoteSummary> getQuotes(List<QuoteRequest> requests) {
        QuoteSummary result = new QuoteSummary();

        if (requests == null || requests.isEmpty()) {
            result.summary = 'No customer information provided. I cannot retrieve your quotes.';
            return new List<QuoteSummary>{ result };
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
            return new List<QuoteSummary>{ result };
        }

        // Resolve AccountId from ContactId
        Id accountId = null;
        List<Contact> contacts = [SELECT AccountId FROM Contact WHERE Id = :contactId LIMIT 1];
        if (!contacts.isEmpty()) {
            accountId = contacts[0].AccountId;
        }

        if (accountId == null) {
            result.summary = 'No account associated with your contact. Unable to retrieve quotes.';
            return new List<QuoteSummary>{ result };
        }

        // Fetch quotes for this account
        List<TALEXO_Quote__c> quotes = [
            SELECT
                Id, Name, Status__c, NegotiationStatus__c,
                GrandTotal__c, BulkDiscount__c, PaymentTerms__c,
                ExpirationDate__c, AcceptanceProbability__c, AIReason__c,
                CreatedDate,
                (
                    SELECT ProductName__c, Quantity__c, NetTotal__c
                    FROM NexusQuoteLineItems__r
                )
            FROM TALEXO_Quote__c
            WHERE Opportunity__r.AccountId = :accountId
            ORDER BY CreatedDate DESC
            LIMIT 10
        ];

        if (quotes.isEmpty()) {
            result.summary = 'You have no quotes at the moment.';
            return new List<QuoteSummary>{ result };
        }

        List<String> lines = new List<String>();
        lines.add('You have ' + quotes.size() + ' quote(s). Here are the details:');
        lines.add('');

        for (TALEXO_Quote__c q : quotes) {
            String status = q.Status__c != null ? q.Status__c : 'Draft';
            String total = q.GrandTotal__c != null ? q.GrandTotal__c.setScale(2) + ' €' : 'N/A';
            String expiry = q.ExpirationDate__c != null ? q.ExpirationDate__c.format() : 'N/A';
            Integer daysLeft = q.ExpirationDate__c != null
                ? Date.today().daysBetween(q.ExpirationDate__c) : null;

            lines.add('Quote: ' + q.Name);
            lines.add('  Status: ' + status);
            if (q.NegotiationStatus__c != null) {
                lines.add('  Negotiation: ' + q.NegotiationStatus__c);
            }
            lines.add('  Total: ' + total);
            lines.add('  Valid until: ' + expiry +
                (daysLeft != null ? ' (' + daysLeft + ' day(s) remaining)' : ''));
            if (q.BulkDiscount__c != null && q.BulkDiscount__c > 0) {
                lines.add('  Discount: ' + q.BulkDiscount__c.intValue() + '%');
            }
            if (q.PaymentTerms__c != null) {
                lines.add('  Payment terms: ' + q.PaymentTerms__c);
            }
            if (q.AcceptanceProbability__c != null) {
                lines.add('  Acceptance probability (AI): ' + q.AcceptanceProbability__c.intValue() + '%');
            }

            if (!q.NexusQuoteLineItems__r.isEmpty()) {
                lines.add('  Products:');
                for (NexusQuoteLineItem__c li : q.NexusQuoteLineItems__r) {
                    Integer qty = li.Quantity__c != null ? Integer.valueOf(li.Quantity__c) : 1;
                    String netTotal = li.NetTotal__c != null ? li.NetTotal__c.setScale(2) + ' €' : '';
                    lines.add('    • ' + li.ProductName__c + ' x' + qty + ' — ' + netTotal);
                }
            }
            lines.add('');
        }

        result.summary = String.join(lines, '\n');
        return new List<QuoteSummary>{ result };
    }
}
