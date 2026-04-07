try {
    SupportChatController.ChatResponse r = SupportChatController.sendMessage('how many products are there', '');
    System.debug('TEXT: ' + r.text);
    System.debug('CHIPS: ' + r.chips);
} catch(Exception e) {
    System.debug('ERROR: ' + e.getTypeName() + ' - ' + e.getMessage());
    System.debug('STACK: ' + e.getStackTraceString());
}
