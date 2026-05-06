trigger BundleSuggestionTrigger on BundleSuggestion__c(after update) {
  // When an admin sets Status = 'Live', auto-promote to ComboPackage__c
  for (BundleSuggestion__c bs : Trigger.new) {
    BundleSuggestion__c old = Trigger.oldMap.get(bs.Id);
    if (bs.Status__c == 'Live' && old.Status__c != 'Live') {
      BundleSuggestionEngine.promoteToComboPackage(bs);
    }
  }
}
