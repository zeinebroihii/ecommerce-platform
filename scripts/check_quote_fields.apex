// Try querying TALEXO_Quote__c with custom fields
try {
    List<TALEXO_Quote__c> quotes = [
        SELECT Id, Name, Status__c, NegotiationStatus__c, GrandTotal__c,
               Opportunity__c, Opportunity__r.Name, IsPrimary__c, VersionNumber__c,
               CreatedDate
        FROM   TALEXO_Quote__c
        ORDER BY CreatedDate DESC
        LIMIT  10
    ];
    System.debug('Total quotes found: ' + quotes.size());
    for (TALEXO_Quote__c q : quotes) {
        System.debug('QUOTE: ' + q.Name + ' | Status: ' + q.Status__c
            + ' | NegStatus: ' + q.NegotiationStatus__c
            + ' | Opp: ' + q.Opportunity__r?.Name
            + ' | Total: ' + q.GrandTotal__c
            + ' | Primary: ' + q.IsPrimary__c
            + ' | v' + q.VersionNumber__c);
    }
} catch (Exception ex) {
    System.debug('QUOTE QUERY ERROR: ' + ex.getMessage());
}

// Opportunities
try {
    List<Opportunity> opps = [
        SELECT Id, Name, StageName, Account.Name, CloseDate, CreatedDate
        FROM   Opportunity
        ORDER BY CreatedDate DESC
        LIMIT  10
    ];
    System.debug('Total opportunities found: ' + opps.size());
    for (Opportunity o : opps) {
        System.debug('OPP: ' + o.Name + ' | Stage: ' + o.StageName
            + ' | Account: ' + o.Account?.Name
            + ' | Close: ' + o.CloseDate
            + ' | Created: ' + o.CreatedDate);
    }
} catch (Exception ex) {
    System.debug('OPP QUERY ERROR: ' + ex.getMessage());
}

// Contracts
try {
    List<Contract> contracts = [
        SELECT Id, ContractNumber, Status, Account.Name, StartDate, ContractTerm, CreatedDate
        FROM   Contract
        ORDER BY CreatedDate DESC
        LIMIT  10
    ];
    System.debug('Total contracts found: ' + contracts.size());
    for (Contract c : contracts) {
        System.debug('CONTRACT: ' + c.ContractNumber + ' | Status: ' + c.Status
            + ' | Account: ' + c.Account?.Name
            + ' | Term: ' + c.ContractTerm + 'mo'
            + ' | Start: ' + c.StartDate);
    }
} catch (Exception ex) {
    System.debug('CONTRACT QUERY ERROR: ' + ex.getMessage());
}

// Portal users with accounts
try {
    List<User> users = [
        SELECT Id, Name, Email, AccountId, Account.Name, UserType, Profile.Name, IsActive
        FROM   User
        WHERE  UserType != 'Standard' AND IsActive = true
        ORDER BY CreatedDate DESC LIMIT 5
    ];
    System.debug('Portal users: ' + users.size());
    for (User u : users) {
        System.debug('PORTAL_USER: ' + u.Name + ' | Email: ' + u.Email
            + ' | AccountId: ' + u.AccountId
            + ' | Account: ' + u.Account?.Name
            + ' | Profile: ' + u.Profile?.Name);
    }
} catch (Exception ex) {
    System.debug('USER QUERY ERROR: ' + ex.getMessage());
}

// Valid Opportunity stages
System.debug('=== VALID OPP STAGES ===');
Schema.DescribeFieldResult sfr = Opportunity.StageName.getDescribe();
for (Schema.PicklistEntry pe : sfr.getPicklistValues()) {
    if (pe.isActive()) System.debug('STAGE: ' + pe.getValue());
}
