// ── 1. All Opportunities ──────────────────────────────────────────────────────
System.debug('=== OPPORTUNITIES ===');
for (Opportunity o : [
    SELECT Id, Name, StageName, CloseDate, AccountId, Account.Name, CreatedDate
    FROM   Opportunity
    ORDER BY CreatedDate DESC
    LIMIT  10
]) {
    System.debug('OPP: ' + o.Name + ' | Stage: ' + o.StageName + ' | Account: ' + o.Account?.Name + ' | Id: ' + o.Id + ' | Created: ' + o.CreatedDate);
}

// ── 2. All TALEXO_Quote__c records ────────────────────────────────────────────
System.debug('=== QUOTES ===');
for (TALEXO_Quote__c q : [
    SELECT Id, Name, Status__c, NegotiationStatus__c, GrandTotal__c,
           Opportunity__c, Opportunity__r.Name, IsPrimary__c, VersionNumber__c, CreatedDate
    FROM   TALEXO_Quote__c
    ORDER BY CreatedDate DESC
    LIMIT  20
]) {
    System.debug('QUOTE: ' + q.Name + ' | Status: ' + q.Status__c + ' | NegStatus: ' + q.NegotiationStatus__c + ' | Opp: ' + q.Opportunity__r?.Name + ' | Primary: ' + q.IsPrimary__c + ' | v' + q.VersionNumber__c + ' | Created: ' + q.CreatedDate);
}

// ── 3. Portal users (Experience Cloud community users) ─────────────────────────
System.debug('=== PORTAL USERS ===');
for (User u : [
    SELECT Id, Name, Email, AccountId, Account.Name, UserType, Profile.Name
    FROM   User
    WHERE  UserType != 'Standard' AND IsActive = true
    ORDER BY CreatedDate DESC
    LIMIT  5
]) {
    System.debug('USER: ' + u.Name + ' | Email: ' + u.Email + ' | Type: ' + u.UserType + ' | Account: ' + u.Account?.Name + ' | Profile: ' + u.Profile?.Name);
}

// ── 4. Contracts ──────────────────────────────────────────────────────────────
System.debug('=== CONTRACTS ===');
for (Contract c : [
    SELECT Id, ContractNumber, Status, AccountId, Account.Name, StartDate, CreatedDate
    FROM   Contract
    ORDER BY CreatedDate DESC
    LIMIT  10
]) {
    System.debug('CONTRACT: ' + c.ContractNumber + ' | Status: ' + c.Status + ' | Account: ' + c.Account?.Name + ' | Start: ' + c.StartDate);
}

// ── 5. Opportunity Stage picklist values (check what's valid) ─────────────────
System.debug('=== OPP STAGE VALUES ===');
Schema.DescribeFieldResult sfr = Opportunity.StageName.getDescribe();
for (Schema.PicklistEntry pe : sfr.getPicklistValues()) {
    System.debug('STAGE: ' + pe.getValue() + ' | Active: ' + pe.isActive() + ' | Default: ' + pe.isDefaultValue());
}
