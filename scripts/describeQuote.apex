List<User> users = [
    SELECT Id, Email, AccountId, UserType, IsActive
    FROM User
    WHERE Email = 'arbiahamdana296@gmail.com'
];
if (users.isEmpty()) {
    System.debug('USER: NOT FOUND — arbiahamdana296@gmail.com has no Salesforce user');
} else {
    for (User u : users) {
        System.debug('USER: ' + u.Email + ' | Type: ' + u.UserType + ' | Active: ' + u.IsActive + ' | AccountId: ' + u.AccountId);
    }
}
