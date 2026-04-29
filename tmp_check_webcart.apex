// Check if WebCart is enabled and accessible
try {
    // Try to query WebCart
    List<WebCart> carts = [SELECT Id, Name FROM WebCart LIMIT 1];
    System.debug('WebCart is enabled. Found ' + carts.size() + ' carts.');
    if (carts.size() > 0) {
        System.debug('Sample Cart: ' + carts[0]);
    }
} catch (Exception e) {
    System.debug('WebCart may not be enabled or accessible: ' + e.getMessage());
}

// To create records from cart items, you can use ConnectApi or Apex
// Example: Convert cart to order
// But first, check if Commerce is enabled
try {
    // Check if Order object is accessible (part of Commerce)
    List<Order> orders = [SELECT Id FROM Order LIMIT 1];
    System.debug('Order object is accessible.');
} catch (Exception e) {
    System.debug('Order object not accessible: ' + e.getMessage());
}