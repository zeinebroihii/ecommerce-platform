trigger NexusSlackApprovalTrigger on NexusSlackApproval__e(after insert) {
  System.debug(
    LoggingLevel.INFO,
    '[SlackApprovalTrigger] fired events=' +
      Trigger.new.size() +
      ' runningUser=' +
      UserInfo.getUserId() +
      ' (' +
      UserInfo.getName() +
      ')'
  );
  for (NexusSlackApproval__e evt : Trigger.new) {
    System.debug(
      LoggingLevel.INFO,
      '[SlackApprovalTrigger] quoteId=' +
        evt.QuoteId__c +
        ' price=' +
        evt.ApprovedPrice__c +
        ' terms=' +
        evt.PaymentTerms__c +
        ' validity=' +
        evt.ValidityDays__c
    );
    try {
      if (String.isBlank(evt.QuoteId__c) || evt.ApprovedPrice__c == null) {
        System.debug(
          LoggingLevel.WARN,
          '[SlackApprovalTrigger] SKIP: blank quoteId or null price'
        );
        continue;
      }
      NexusQuoteController.applyNegotiatedTermsCore(
        (Id) evt.QuoteId__c,
        evt.ApprovedPrice__c,
        String.isNotBlank(evt.PaymentTerms__c) ? evt.PaymentTerms__c : 'Net 30',
        evt.ValidityDays__c != null ? Integer.valueOf(evt.ValidityDays__c) : 30,
        String.isNotBlank(evt.SalesNote__c)
          ? evt.SalesNote__c
          : 'Approved by sales team via Slack.'
      );
      System.debug(
        LoggingLevel.INFO,
        '[SlackApprovalTrigger] applyNegotiatedTermsCore completed for ' +
        evt.QuoteId__c
      );
    } catch (Exception ex) {
      System.debug(
        LoggingLevel.ERROR,
        '[SlackApprovalTrigger] ERROR: ' +
          ex.getMessage() +
          '\n' +
          ex.getStackTraceString()
      );
    }
  }
}
