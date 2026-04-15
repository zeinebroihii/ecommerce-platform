// Test the full SupportChatController.sendMessage with a real portal user's accountId
// First find a portal user's accountId
User portalUser = [SELECT Id, AccountId, Name FROM User WHERE Profile.Name IN ('Customer Community Plus Login User','Customer Community Plus User') AND IsActive = true AND AccountId != null LIMIT 1];
System.debug('Testing as user: ' + portalUser.Name + ' | AccountId: ' + portalUser.AccountId);

SupportChatController.ChatResponse resp = SupportChatController.sendMessage(
    'Am I a VIP customer at Nexus?',
    portalUser.AccountId
);
System.debug('text: '  + resp.text);
System.debug('chips: ' + resp.chips);
