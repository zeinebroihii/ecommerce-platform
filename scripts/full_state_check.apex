// ── TALEXO_Quote__c field count ───────────────────────────────────────────────
Integer fldCount = Schema.getGlobalDescribe().get('TALEXO_Quote__c').getDescribe().fields.getMap().size();
System.debug('TALEXO_Quote__c total fields: ' + fldCount);

// ── Quotes with all fields ────────────────────────────────────────────────────
System.debug('=== QUOTES ===');
List<TALEXO_Quote__c> quotes = [
    SELECT Id, Name, Status__c, NegotiationStatus__c, GrandTotal__c,
           Opportunity__c, Opportunity__r.Name, Opportunity__r.StageName,
           Opportunity__r.Account.Name,
           IsPrimary__c, VersionNumber__c, AcceptanceProbability__c,
           AIReason__c, CreatedDate
    FROM   TALEXO_Quote__c
    ORDER BY CreatedDate DESC
    LIMIT  15
];
System.debug('Total quotes: ' + quotes.size());
for (TALEXO_Quote__c q : quotes) {
    System.debug('QUOTE: ' + q.Name
        + ' | Status: '       + q.Status__c
        + ' | NegStatus: '    + q.NegotiationStatus__c
        + ' | Total: '        + q.GrandTotal__c
        + ' | Opp: '          + q.Opportunity__r?.Name
        + ' | OppStage: '     + q.Opportunity__r?.StageName
        + ' | Account: '      + q.Opportunity__r?.Account?.Name
        + ' | Primary: '      + q.IsPrimary__c
        + ' | v'              + q.VersionNumber__c
        + ' | AI: '           + q.AcceptanceProbability__c + '%'
        + ' | Created: '      + q.CreatedDate.format()
    );
}

// ── Opportunities ─────────────────────────────────────────────────────────────
System.debug('=== OPPORTUNITIES ===');
List<Opportunity> opps = [
    SELECT Id, Name, StageName, Account.Name, CloseDate, Amount, CreatedDate
    FROM   Opportunity
    ORDER BY CreatedDate DESC
    LIMIT  10
];
System.debug('Total opportunities: ' + opps.size());
for (Opportunity o : opps) {
    System.debug('OPP: ' + o.Name
        + ' | Stage: '   + o.StageName
        + ' | Account: ' + o.Account?.Name
        + ' | Amount: '  + o.Amount
        + ' | Close: '   + o.CloseDate
        + ' | Created: ' + o.CreatedDate.format()
    );
}

// ── NexusQuoteLineItem__c ─────────────────────────────────────────────────────
System.debug('=== LINE ITEMS (last 10) ===');
List<NexusQuoteLineItem__c> items = [
    SELECT Id, Quote__c, Quote__r.Name, ProductName__c, Quantity__c,
           ListPrice__c, UnitPrice__c, NetTotal__c
    FROM   NexusQuoteLineItem__c
    ORDER BY CreatedDate DESC
    LIMIT  10
];
System.debug('Total line items: ' + items.size());
for (NexusQuoteLineItem__c li : items) {
    System.debug('LI: Quote=' + li.Quote__r?.Name
        + ' | ' + li.ProductName__c
        + ' qty=' + li.Quantity__c
        + ' unit=' + li.UnitPrice__c
        + ' net=' + li.NetTotal__c
    );
}

// ── Contracts ─────────────────────────────────────────────────────────────────
System.debug('=== CONTRACTS ===');
List<Contract> contracts = [
    SELECT Id, ContractNumber, Status, Account.Name, StartDate, ContractTerm, CreatedDate
    FROM   Contract ORDER BY CreatedDate DESC LIMIT 10
];
System.debug('Total contracts: ' + contracts.size());
for (Contract c : contracts) {
    System.debug('CONTRACT: ' + c.ContractNumber
        + ' | Status: '  + c.Status
        + ' | Account: ' + c.Account?.Name
        + ' | Term: '    + c.ContractTerm + 'mo'
        + ' | Start: '   + c.StartDate
    );
}

// ── Portal Users ──────────────────────────────────────────────────────────────
System.debug('=== PORTAL USERS ===');
List<User> portalUsers = [
    SELECT Id, Name, Email, AccountId, Account.Name, UserType, Profile.Name
    FROM   User
    WHERE  UserType != 'Standard' AND IsActive = true
    ORDER BY CreatedDate DESC LIMIT 5
];
for (User u : portalUsers) {
    System.debug('PORTAL_USER: ' + u.Name
        + ' | Email: '     + u.Email
        + ' | Account: '   + u.Account?.Name
        + ' | AccountId: ' + u.AccountId
        + ' | Profile: '   + u.Profile?.Name
    );
}

// ── Valid Opp stages ──────────────────────────────────────────────────────────
System.debug('=== OPP STAGES ===');
for (Schema.PicklistEntry pe : Opportunity.StageName.getDescribe().getPicklistValues()) {
    if (pe.isActive()) System.debug('STAGE: ' + pe.getValue());
}
