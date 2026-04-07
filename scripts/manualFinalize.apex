// Manually finalize DEVIS-0022 as if the DocuSign webhook had fired
TALEXO_Quote__c q = [
    SELECT Id, Name, Status__c, Opportunity__c, Opportunity__r.AccountId,
           Opportunity__r.Owner.Email, Opportunity__r.Account.Name
    FROM TALEXO_Quote__c WHERE Name = 'DEVIS-0022' LIMIT 1
];
System.debug('Before — Status: ' + q.Status__c);

// Update quote to Signed
update new TALEXO_Quote__c(
    Id = q.Id,
    Status__c = 'Signed',
    NegotiationStatus__c = 'Final'
);

// Close opportunity as Won
update new Opportunity(Id = q.Opportunity__c, StageName = 'Closed Won');

System.debug('Done — Quote: Signed | Opp: Closed Won');
