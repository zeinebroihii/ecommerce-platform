public without sharing class DashboardController {

    // ── KPI Metrics ───────────────────────────────────────────────────────────
    public class DashboardMetrics {
        @AuraEnabled public Integer totalLeads             = 0;
        @AuraEnabled public Integer newLeadsThisMonth     = 0;
        @AuraEnabled public Integer convertedLeads        = 0;
        @AuraEnabled public Integer notConvertedLeads     = 0;
        @AuraEnabled public Integer activeOpportunities   = 0;
        @AuraEnabled public Decimal totalPipelineValue    = 0;
        @AuraEnabled public Decimal revenueThisMonth      = 0;
        @AuraEnabled public Integer pendingQuotes         = 0;
        @AuraEnabled public Integer openCases             = 0;
        @AuraEnabled public Integer totalOrders           = 0;
        @AuraEnabled public Integer unpaidWonOpps         = 0;
    }

    @AuraEnabled(cacheable=true)
    public static DashboardMetrics getMetrics() {
        DashboardMetrics m = new DashboardMetrics();
        Date firstOfMonth = Date.today().toStartOfMonth();

        m.totalLeads           = [SELECT COUNT() FROM Lead];
        m.newLeadsThisMonth    = [SELECT COUNT() FROM Lead WHERE CreatedDate >= :firstOfMonth];
        m.convertedLeads       = [SELECT COUNT() FROM Lead WHERE IsConverted = true];
        m.notConvertedLeads    = [SELECT COUNT() FROM Lead WHERE IsConverted = false AND Status = 'Closed - Not Converted'];
        m.activeOpportunities  = [SELECT COUNT() FROM Opportunity WHERE IsClosed = false];
        m.openCases            = [SELECT COUNT() FROM Case WHERE Status != 'Closed'];
        m.totalOrders          = [SELECT COUNT() FROM Order];
        m.pendingQuotes        = [SELECT COUNT() FROM TALEXO_Quote__c WHERE Status__c = 'Presented'];
        m.unpaidWonOpps        = [SELECT COUNT() FROM Opportunity
                                  WHERE StageName = 'Closed Won' AND Payment_Status__c = 'Unpaid'];

        AggregateResult[] pipe = [SELECT SUM(Amount) tot FROM Opportunity WHERE IsClosed = false];
        m.totalPipelineValue = pipe[0].get('tot') != null ? (Decimal)pipe[0].get('tot') : 0;

        AggregateResult[] rev = [SELECT SUM(Amount) tot FROM Opportunity
                                  WHERE StageName = 'Closed Won' AND CloseDate >= :firstOfMonth];
        m.revenueThisMonth = rev[0].get('tot') != null ? (Decimal)rev[0].get('tot') : 0;

        return m;
    }

    // ── Stage & Status groups ─────────────────────────────────────────────────
    public class StageGroup {
        @AuraEnabled public String  label;
        @AuraEnabled public Integer count  = 0;
        @AuraEnabled public Decimal amount = 0;
    }

    @AuraEnabled(cacheable=true)
    public static List<StageGroup> getOpportunitiesByStage() {
        List<StageGroup> result = new List<StageGroup>();
        for (AggregateResult ar : [
            SELECT StageName lbl, COUNT(Id) cnt, SUM(Amount) tot
            FROM   Opportunity WHERE IsClosed = false
            GROUP BY StageName ORDER BY COUNT(Id) DESC
        ]) {
            StageGroup g = new StageGroup();
            g.label  = (String)ar.get('lbl');
            g.count  = (Integer)ar.get('cnt');
            g.amount = ar.get('tot') != null ? (Decimal)ar.get('tot') : 0;
            result.add(g);
        }
        return result;
    }

    public class StatusGroup {
        @AuraEnabled public String  label;
        @AuraEnabled public Integer count = 0;
    }

    @AuraEnabled(cacheable=true)
    public static List<StatusGroup> getLeadsByStatus() {
        List<StatusGroup> result = new List<StatusGroup>();
        for (AggregateResult ar : [
            SELECT Status lbl, COUNT(Id) cnt FROM Lead GROUP BY Status ORDER BY COUNT(Id) DESC
        ]) {
            StatusGroup g = new StatusGroup();
            g.label = (String)ar.get('lbl');
            g.count = (Integer)ar.get('cnt');
            result.add(g);
        }
        return result;
    }

    // ── Recent leads row ──────────────────────────────────────────────────────
    public class LeadRow {
        @AuraEnabled public Id      leadId;
        @AuraEnabled public String  name;
        @AuraEnabled public String  company;
        @AuraEnabled public String  status;
        @AuraEnabled public Integer score;
        @AuraEnabled public String  country;
        @AuraEnabled public String  email;
        @AuraEnabled public String  initials;
        @AuraEnabled public String  createdDateStr;
    }

    @AuraEnabled(cacheable=true)
    public static List<LeadRow> getRecentLeads() {
        List<LeadRow> result = new List<LeadRow>();
        for (Lead l : [
            SELECT Id, FirstName, LastName, Company, Email, Status,
                   Lead_Score__c, Country, CreatedDate
            FROM   Lead ORDER BY CreatedDate DESC LIMIT 8
        ]) {
            LeadRow r = new LeadRow();
            r.leadId        = l.Id;
            r.name          = (l.FirstName != null ? l.FirstName + ' ' : '') + (l.LastName != null ? l.LastName : '');
            r.company       = l.Company;
            r.status        = l.Status;
            r.score         = l.Lead_Score__c != null ? Integer.valueOf(l.Lead_Score__c) : 0;
            r.country       = l.Country;
            r.email         = l.Email;
            r.initials      = initials(l.FirstName, l.LastName);
            r.createdDateStr = l.CreatedDate != null ? l.CreatedDate.format() : '';
            result.add(r);
        }
        return result;
    }

    // ── Recent opportunities row ──────────────────────────────────────────────
    public class OppRow {
        @AuraEnabled public Id      oppId;
        @AuraEnabled public String  name;
        @AuraEnabled public String  accountName;
        @AuraEnabled public String  stageName;
        @AuraEnabled public Decimal amount;
        @AuraEnabled public String  formattedAmount;
        @AuraEnabled public String  paymentStatus;
        @AuraEnabled public String  closeDate;
        @AuraEnabled public Boolean isClosedWon;
        @AuraEnabled public Boolean isClosedLost;
    }

    @AuraEnabled(cacheable=true)
    public static List<OppRow> getRecentOpportunities() {
        List<OppRow> result = new List<OppRow>();
        for (Opportunity o : [
            SELECT Id, Name, StageName, Amount, CloseDate,
                   Account.Name, Payment_Status__c, IsWon, IsClosed
            FROM   Opportunity ORDER BY LastModifiedDate DESC LIMIT 8
        ]) {
            OppRow r        = new OppRow();
            r.oppId         = o.Id;
            r.name          = o.Name;
            r.accountName   = o.Account != null ? o.Account.Name : '—';
            r.stageName     = o.StageName;
            r.amount        = o.Amount;
            r.formattedAmount = o.Amount != null
                ? String.valueOf(o.Amount.setScale(0)) : '0';
            r.paymentStatus = o.Payment_Status__c != null ? o.Payment_Status__c : '—';
            r.closeDate     = o.CloseDate != null ? o.CloseDate.format() : '—';
            r.isClosedWon   = o.IsWon;
            r.isClosedLost  = o.IsClosed && !o.IsWon;
            result.add(r);
        }
        return result;
    }

    // ── Opportunities available for quoting ───────────────────────────────────
    public class OppForQuote {
        @AuraEnabled public Id      oppId;
        @AuraEnabled public String  name;
        @AuraEnabled public String  accountName;
        @AuraEnabled public String  accountEmail;
        @AuraEnabled public String  stageName;
        @AuraEnabled public Decimal amount;
        @AuraEnabled public Integer quoteCount;
    }

    @AuraEnabled(cacheable=true)
    public static List<OppForQuote> getOpportunitiesForQuoting() {
        List<OppForQuote> result = new List<OppForQuote>();
        Map<Id, Integer> quoteCountMap = new Map<Id, Integer>();
        for (AggregateResult ar : [
            SELECT Opportunity__c oppId, COUNT(Id) cnt
            FROM   TALEXO_Quote__c GROUP BY Opportunity__c
        ]) {
            quoteCountMap.put((Id)ar.get('oppId'), (Integer)ar.get('cnt'));
        }

        // Collect Account Ids to look up primary Contact email separately
        List<Opportunity> opps = [
            SELECT Id, Name, StageName, Amount, Account.Name, AccountId
            FROM   Opportunity
            WHERE  IsClosed = false
            ORDER BY LastModifiedDate DESC LIMIT 20
        ];

        // Build accountId → primary contact email map
        Set<Id> accountIds = new Set<Id>();
        for (Opportunity o : opps) { if (o.AccountId != null) accountIds.add(o.AccountId); }
        Map<Id, String> emailMap = new Map<Id, String>();
        for (Contact c : [
            SELECT AccountId, Email FROM Contact
            WHERE  AccountId IN :accountIds AND Email != null
            ORDER BY CreatedDate ASC
        ]) {
            if (!emailMap.containsKey(c.AccountId)) emailMap.put(c.AccountId, c.Email);
        }

        for (Opportunity o : opps) {
            OppForQuote r   = new OppForQuote();
            r.oppId         = o.Id;
            r.name          = o.Name;
            r.accountName   = o.Account != null ? o.Account.Name : '—';
            r.accountEmail  = emailMap.containsKey(o.AccountId) ? emailMap.get(o.AccountId) : '';
            r.stageName     = o.StageName;
            r.amount        = o.Amount;
            r.quoteCount    = quoteCountMap.containsKey(o.Id) ? quoteCountMap.get(o.Id) : 0;
            result.add(r);
        }
        return result;
    }

    // ── Create + optionally send a quote ─────────────────────────────────────
    @AuraEnabled
    public static Id createAndSendQuote(Id oppId, Decimal grandTotal,
                                         String expirationDateStr, String description,
                                         String recipientEmail, String bccEmail,
                                         String emailSubject, String bodyNote) {
        Date expDate = String.isNotBlank(expirationDateStr)
                       ? Date.valueOf(expirationDateStr) : null;

        TALEXO_Quote__c q = new TALEXO_Quote__c(
            Opportunity__c   = oppId,
            GrandTotal__c    = grandTotal,
            ExpirationDate__c = expDate,
            Description__c   = description,
            Status__c        = 'Draft'
        );
        insert q;

        if (String.isNotBlank(recipientEmail)) {
            QuoteController.sendQuoteToCustomer(q.Id, recipientEmail,
                                                emailSubject, bodyNote, bccEmail);
        }
        return q.Id;
    }

    // ── Admin: list all quotes (with optional status filter) ──────────────────
    public class AdminQuoteRow {
        @AuraEnabled public Id      quoteId;
        @AuraEnabled public String  name;
        @AuraEnabled public String  opportunityName;
        @AuraEnabled public String  accountName;
        @AuraEnabled public Decimal grandTotal;
        @AuraEnabled public String  formattedTotal;
        @AuraEnabled public String  status;
        @AuraEnabled public String  expirationDate;
        @AuraEnabled public String  description;
        @AuraEnabled public Id      opportunityId;
        @AuraEnabled public Boolean canSend;       // Draft or Sent
        @AuraEnabled public Boolean isPresented;
        @AuraEnabled public Boolean isAccepted;
        @AuraEnabled public Boolean isRejected;
    }

    @AuraEnabled(cacheable=true)
    public static List<AdminQuoteRow> getAdminQuotes(String statusFilter) {
        List<AdminQuoteRow> result = new List<AdminQuoteRow>();
        String q = 'SELECT Id, Name, Status__c, GrandTotal__c, ExpirationDate__c, '
                 + 'Description__c, Opportunity__c, Opportunity__r.Name, '
                 + 'Opportunity__r.Account.Name '
                 + 'FROM TALEXO_Quote__c ';
        if (String.isNotBlank(statusFilter) && statusFilter != 'All') {
            q += 'WHERE Status__c = :statusFilter ';
        }
        q += 'ORDER BY CreatedDate DESC LIMIT 50';
        for (TALEXO_Quote__c qt : Database.query(q)) {
            AdminQuoteRow r    = new AdminQuoteRow();
            r.quoteId          = qt.Id;
            r.name             = qt.Name;
            r.opportunityId    = qt.Opportunity__c;
            r.opportunityName  = qt.Opportunity__r != null ? qt.Opportunity__r.Name : '—';
            r.accountName      = (qt.Opportunity__r != null && qt.Opportunity__r.Account != null)
                                 ? qt.Opportunity__r.Account.Name : '—';
            r.grandTotal       = qt.GrandTotal__c;
            r.formattedTotal   = qt.GrandTotal__c != null
                                 ? qt.GrandTotal__c.setScale(0).toPlainString() : '0';
            r.status           = qt.Status__c;
            r.expirationDate   = qt.ExpirationDate__c != null
                                 ? qt.ExpirationDate__c.format() : '—';
            r.description      = qt.Description__c;
            r.canSend          = (qt.Status__c == 'Draft' || qt.Status__c == 'Sent');
            r.isPresented      = (qt.Status__c == 'Presented');
            r.isAccepted       = (qt.Status__c == 'Accepted');
            r.isRejected       = (qt.Status__c == 'Rejected');
            result.add(r);
        }
        return result;
    }

    @AuraEnabled
    public static void updateQuoteStatus(Id quoteId, String newStatus) {
        update new TALEXO_Quote__c(Id = quoteId, Status__c = newStatus);
    }

    // ── Contacts ──────────────────────────────────────────────────────────────
    public class ContactRow {
        @AuraEnabled public Id     contactId;
        @AuraEnabled public String name;
        @AuraEnabled public String firstName;
        @AuraEnabled public String lastName;
        @AuraEnabled public String email;
        @AuraEnabled public String phone;
        @AuraEnabled public String accountName;
        @AuraEnabled public String title;
        @AuraEnabled public String department;
        @AuraEnabled public String createdDate;
        @AuraEnabled public String initials;
    }

    @AuraEnabled(cacheable=true)
    public static List<ContactRow> getRecentContacts() {
        List<ContactRow> result = new List<ContactRow>();
        for (Contact c : [
            SELECT Id, FirstName, LastName, Email, Phone, Account.Name,
                   Title, Department, CreatedDate
            FROM   Contact ORDER BY CreatedDate DESC LIMIT 50
        ]) {
            ContactRow r  = new ContactRow();
            r.contactId   = c.Id;
            r.firstName   = c.FirstName;
            r.lastName    = c.LastName;
            r.name        = ((c.FirstName != null ? c.FirstName + ' ' : '')
                            + (c.LastName  != null ? c.LastName  : '')).trim();
            r.email       = c.Email;
            r.phone       = c.Phone;
            r.accountName = c.Account != null ? c.Account.Name : '—';
            r.title       = c.Title;
            r.department  = c.Department;
            r.createdDate = c.CreatedDate != null ? c.CreatedDate.format() : '';
            r.initials    = initials(c.FirstName, c.LastName);
            result.add(r);
        }
        return result;
    }

    // ── Orders ────────────────────────────────────────────────────────────────
    public class OrderRow {
        @AuraEnabled public Id      orderId;
        @AuraEnabled public String  orderNumber;
        @AuraEnabled public String  accountName;
        @AuraEnabled public String  status;
        @AuraEnabled public Decimal totalAmount;
        @AuraEnabled public String  formattedAmount;
        @AuraEnabled public String  effectiveDate;
        @AuraEnabled public String  createdDate;
    }

    @AuraEnabled(cacheable=true)
    public static List<OrderRow> getRecentOrders() {
        List<OrderRow> result = new List<OrderRow>();
        for (Order o : [
            SELECT Id, OrderNumber, Account.Name, Status,
                   TotalAmount, EffectiveDate, CreatedDate
            FROM   Order ORDER BY CreatedDate DESC LIMIT 50
        ]) {
            OrderRow r      = new OrderRow();
            r.orderId       = o.Id;
            r.orderNumber   = o.OrderNumber;
            r.accountName   = o.Account != null ? o.Account.Name : '—';
            r.status        = o.Status;
            r.totalAmount   = o.TotalAmount;
            r.formattedAmount = o.TotalAmount != null
                ? o.TotalAmount.setScale(0).toPlainString() : '0';
            r.effectiveDate = o.EffectiveDate != null ? String.valueOf(o.EffectiveDate) : '—';
            r.createdDate   = o.CreatedDate != null ? o.CreatedDate.format() : '';
            result.add(r);
        }
        return result;
    }

    // ── Cases ─────────────────────────────────────────────────────────────────
    public class CaseRow {
        @AuraEnabled public Id     caseId;
        @AuraEnabled public String caseNumber;
        @AuraEnabled public String subject;
        @AuraEnabled public String status;
        @AuraEnabled public String priority;
        @AuraEnabled public String accountName;
        @AuraEnabled public String contactName;
        @AuraEnabled public String createdDate;
    }

    @AuraEnabled(cacheable=true)
    public static List<CaseRow> getRecentCases() {
        List<CaseRow> result = new List<CaseRow>();
        for (Case c : [
            SELECT Id, CaseNumber, Subject, Status, Priority,
                   Account.Name, Contact.Name, CreatedDate
            FROM   Case ORDER BY CreatedDate DESC LIMIT 50
        ]) {
            CaseRow r     = new CaseRow();
            r.caseId      = c.Id;
            r.caseNumber  = c.CaseNumber;
            r.subject     = c.Subject;
            r.status      = c.Status;
            r.priority    = c.Priority;
            r.accountName = c.Account != null ? c.Account.Name : '—';
            r.contactName = c.Contact != null ? c.Contact.Name : '—';
            r.createdDate = c.CreatedDate != null ? c.CreatedDate.format() : '';
            result.add(r);
        }
        return result;
    }

    // ── Private helper ────────────────────────────────────────────────────────
    private static String initials(String first, String last) {
        String a = String.isNotBlank(first) ? first.substring(0,1).toUpperCase() : '';
        String b = String.isNotBlank(last)  ? last.substring(0,1).toUpperCase()  : '';
        return (a + b).trim().left(2);
    }
}
