try {
    NewsletterSubscriber__c s = new NewsletterSubscriber__c();
    s.Email__c = 'tokentest@test.com';
    s.Token__c = 'abc123testtoken';
    insert s;
    List<NewsletterSubscriber__c> rows = [SELECT Id, Email__c, Token__c FROM NewsletterSubscriber__c WHERE Email__c = 'tokentest@test.com'];
    System.debug('OK token=' + rows[0].Token__c);
    delete rows;
} catch(Exception e) {
    System.debug('ERROR: ' + e.getMessage());
}
