// ── All Quotes via compiled class ─────────────────────────────────────────────
System.debug('=== ALL QUOTES (via NexusQuoteController) ===');
List<NexusQuoteController.QuoteDetailWrapper> allQ = NexusQuoteController.getAllQuotes();
System.debug('Total non-requested quotes: ' + allQ.size());
for (NexusQuoteController.QuoteDetailWrapper w : allQ) {
    System.debug('Q: ' + w.name
        + ' | Status: '      + w.status
        + ' | NegStatus: '   + w.negotiationStatus
        + ' | Total: '       + w.grandTotal
        + ' | Opp: '         + w.opportunityName
        + ' | Account: '     + w.accountName
        + ' | Primary: '     + w.isPrimary
        + ' | v'             + w.versionNumber
        + ' | AI: '          + w.acceptanceProbability + '%'
        + ' | OppId: '       + w.opportunityId
    );
}

// ── Quote requests ─────────────────────────────────────────────────────────────
System.debug('=== QUOTE REQUESTS (Status=Requested) ===');
List<NexusQuoteController.QuoteDetailWrapper> reqs = NexusQuoteController.getQuoteRequests();
System.debug('Total requests: ' + reqs.size());
for (NexusQuoteController.QuoteDetailWrapper w : reqs) {
    System.debug('REQ: ' + w.name
        + ' | Account: '  + w.accountName
        + ' | OppId: '    + w.opportunityId
        + ' | Opp: '      + w.opportunityName
        + ' | Total: '    + w.grandTotal
    );
}

// ── Opportunities ─────────────────────────────────────────────────────────────
System.debug('=== OPPORTUNITIES ===');
List<Opportunity> opps = [SELECT Id, Name, StageName, Account.Name, CloseDate, CreatedDate FROM Opportunity ORDER BY CreatedDate DESC LIMIT 10];
System.debug('Total opps: ' + opps.size());
for (Opportunity o : opps) {
    System.debug('OPP: ' + o.Name + ' | Stage: ' + o.StageName + ' | Account: ' + o.Account?.Name + ' | Created: ' + o.CreatedDate.format());
}

// ── Contracts ─────────────────────────────────────────────────────────────────
System.debug('=== CONTRACTS ===');
List<Contract> contracts = [SELECT Id, ContractNumber, Status, Account.Name, StartDate, ContractTerm, CreatedDate FROM Contract ORDER BY CreatedDate DESC LIMIT 10];
System.debug('Total contracts: ' + contracts.size());
for (Contract c : contracts) {
    System.debug('CONTRACT: ' + c.ContractNumber + ' | Status: ' + c.Status + ' | Account: ' + c.Account?.Name + ' | Start: ' + c.StartDate);
}

// ── Portal users ──────────────────────────────────────────────────────────────
System.debug('=== PORTAL USERS ===');
List<User> portalUsers = [SELECT Id, Name, Email, AccountId, Account.Name, UserType, Profile.Name FROM User WHERE UserType != 'Standard' AND IsActive = true ORDER BY CreatedDate DESC LIMIT 5];
for (User u : portalUsers) {
    System.debug('PORTAL_USER: ' + u.Name + ' | Email: ' + u.Email + ' | Account: ' + u.Account?.Name + ' | AccountId: ' + u.AccountId);
}

// ── Valid Opp stages ──────────────────────────────────────────────────────────
System.debug('=== VALID OPP STAGES ===');
for (Schema.PicklistEntry pe : Opportunity.StageName.getDescribe().getPicklistValues()) {
    if (pe.isActive()) System.debug('STAGE: ' + pe.getValue());
}
