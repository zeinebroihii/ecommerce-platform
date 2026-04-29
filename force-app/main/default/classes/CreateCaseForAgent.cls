/**
 * CreateCaseForAgent
 *
 * @InvocableMethod — called by the Nexus Support Agent (Service Agent)
 * when a customer wants to open a support ticket from the chat.
 * Input: subject, description, priority, optional order number.
 * Output: confirmation text with the new Case number.
 */
public without sharing class CreateCaseForAgent {

    public class CaseRequest {
        @InvocableVariable(label='Contact ID' required=true)
        public String contactId;

        @InvocableVariable(label='Subject' required=true)
        public String subject;

        @InvocableVariable(label='Description')
        public String description;

        @InvocableVariable(label='Priority (Low / Medium / High / Critical)')
        public String priority;

        @InvocableVariable(label='Order Number (optional)')
        public String orderNumber;
    }

    public class CaseConfirmation {
        @InvocableVariable(label='Confirmation Message')
        public String message;
    }

    @InvocableMethod(
        label='Create Support Case'
        description='Creates a new Salesforce Case on behalf of the logged-in portal customer. Use when the customer wants to open a support ticket, report an issue, or request a return/refund.'
    )
    public static List<CaseConfirmation> createCase(List<CaseRequest> requests) {
        CaseConfirmation result = new CaseConfirmation();

        if (requests == null || requests.isEmpty() || String.isBlank(requests[0].contactId)) {
            result.message = 'Unable to create a case: customer identity not found. Please log in and try again.';
            return new List<CaseConfirmation>{ result };
        }

        CaseRequest req = requests[0];

        // Resolve AccountId from ContactId
        Id contactId;
        try {
            contactId = Id.valueOf(req.contactId);
        } catch (Exception e) {
            result.message = 'Invalid customer ID. Unable to create case.';
            return new List<CaseConfirmation>{ result };
        }

        Id accountId = null;
        List<Contact> contacts = [SELECT AccountId FROM Contact WHERE Id = :contactId LIMIT 1];
        if (!contacts.isEmpty()) {
            accountId = contacts[0].AccountId;
        }

        // Build the Case
        Case newCase = new Case();
        newCase.ContactId   = contactId;
        newCase.AccountId   = accountId;
        newCase.Subject     = String.isNotBlank(req.subject) ? req.subject : 'Support request from chat';
        newCase.Description = req.description;
        newCase.Origin      = 'Web';
        newCase.Status      = 'New';
        newCase.Priority    = resolvePriority(req.priority);

        // Link to order if provided
        if (String.isNotBlank(req.orderNumber) && accountId != null) {
            List<Order> orders = [
                SELECT Id FROM Order
                WHERE OrderNumber = :req.orderNumber.trim()
                AND   AccountId   = :accountId
                LIMIT 1
            ];
            if (!orders.isEmpty()) {
                newCase.Related_Order__c = orders[0].Id;
            }
        }

        try {
            insert newCase;
            Case inserted = [SELECT CaseNumber FROM Case WHERE Id = :newCase.Id];
            result.message =
                'Your support case has been created successfully.\n' +
                'Case number: **' + inserted.CaseNumber + '**\n' +
                'Subject: ' + newCase.Subject + '\n' +
                'Priority: ' + newCase.Priority + '\n\n' +
                'Our team will respond within ' +
                (newCase.Priority == 'Critical' ? '1 hour' :
                 newCase.Priority == 'High'     ? '2 hours' : '4 business hours') +
                '. You can track this case in the **Support** tab of your portal.';
        } catch (Exception e) {
            result.message = 'An error occurred while creating your case: ' + e.getMessage() +
                             '. Please try again or go to the Support tab directly.';
        }

        return new List<CaseConfirmation>{ result };
    }

    private static String resolvePriority(String p) {
        if (String.isBlank(p)) return 'Medium';
        String lower = p.toLowerCase();
        if (lower.contains('critical')) return 'Critical';
        if (lower.contains('high'))     return 'High';
        if (lower.contains('low'))      return 'Low';
        return 'Medium';
    }
}
