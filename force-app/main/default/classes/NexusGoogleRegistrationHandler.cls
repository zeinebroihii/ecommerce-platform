global class NexusGoogleRegistrationHandler implements Auth.RegistrationHandler {
  global User createUser(Id portalId, Auth.UserData data) {
    String email = data.email;
    String firstName = String.isNotBlank(data.firstName)
      ? data.firstName
      : 'Individual';
    String lastName = String.isNotBlank(data.lastName) ? data.lastName : 'User';

    // ── Read-only queries (no DML before callout) ─────────────────────────────
    List<Contact> existingContacts = [
      SELECT Id
      FROM Contact
      WHERE Email = :email
      LIMIT 1
    ];

    Id contactId;
    if (!existingContacts.isEmpty()) {
      contactId = existingContacts[0].Id;
    } else {
      // No Contact exists — create via Named Credential REST callout
      // This runs as a separate HTTP transaction, avoiding the mixed-DML error
      // (Contact = non-setup object, User = setup object)
      Id accId = resolveIndividualAccountId();
      if (accId == null) {
        accId = createRecordViaRest(
          'Account',
          new Map<String, Object>{ 'Name' => 'Individual Customers' }
        );
      }
      contactId = createRecordViaRest(
        'Contact',
        new Map<String, Object>{
          'FirstName' => firstName,
          'LastName' => lastName,
          'Email' => email,
          'AccountId' => accId
        }
      );
    }

    // ── If portal user already exists for this contact, link Google identity ──
    List<User> existingUsers = [
      SELECT Id, FirstName, LastName, IsActive
      FROM User
      WHERE ContactId = :contactId
      LIMIT 1
    ];
    if (!existingUsers.isEmpty()) {
      User eu = existingUsers[0];
      Boolean changed = false;
      if (String.isNotBlank(firstName) && firstName != eu.FirstName) {
        eu.FirstName = firstName;
        changed = true;
      }
      if (String.isNotBlank(lastName) && lastName != eu.LastName) {
        eu.LastName = lastName;
        changed = true;
      }
      if (!eu.IsActive) {
        eu.IsActive = true;
        changed = true;
      }
      if (changed)
        update eu;
      return eu;
    }

    // ── Portal profile + role ─────────────────────────────────────────────────
    List<Profile> profs = [
      SELECT Id
      FROM Profile
      WHERE Name = 'Customer Community Plus Login User'
      LIMIT 1
    ];
    if (profs.isEmpty())
      profs = [
        SELECT Id
        FROM Profile
        WHERE Name = 'Customer Community Login User'
        LIMIT 1
      ];
    if (profs.isEmpty())
      profs = [
        SELECT Id
        FROM Profile
        WHERE Name = 'Customer Community User'
        LIMIT 1
      ];
    if (profs.isEmpty())
      throw new Auth.AuthProviderPluginException('No portal profile found.');

    List<UserRole> b2cRoles = [
      SELECT Id
      FROM UserRole
      WHERE DeveloperName = 'zeiCustomerPersonAccount'
      LIMIT 1
    ];

    String fn = firstName.replaceAll('[^a-zA-Z0-9]', '');
    String ln = lastName.replaceAll('[^a-zA-Z0-9]', '');
    String alias = (fn.left(1) + ln.left(7)).left(8);
    if (String.isBlank(alias))
      alias = 'g' + String.valueOf(Math.abs(email.hashCode())).left(5);
    String nick =
      (fn + ln).left(30) + String.valueOf(Math.abs(email.hashCode())).left(10);
    nick = nick.replaceAll('[^a-zA-Z0-9]', '').left(40);
    if (String.isBlank(nick))
      nick = 'g' + String.valueOf(Math.abs(email.hashCode())).left(7);

    return new User(
      ProfileId = profs[0].Id,
      ContactId = contactId,
      Username = email +
        '.nx' +
        String.valueOf(Math.abs(email.hashCode())).left(6),
      Email = email,
      FirstName = firstName,
      LastName = lastName,
      Alias = alias,
      CommunityNickname = nick,
      UserRoleId = b2cRoles.isEmpty() ? null : b2cRoles[0].Id,
      TimeZoneSidKey = 'Europe/London',
      LocaleSidKey = 'en_GB',
      EmailEncodingKey = 'UTF-8',
      LanguageLocaleKey = 'en_US',
      IsActive = true
    );
  }

  global void updateUser(Id userId, Id portalId, Auth.UserData data) {
    User u = [
      SELECT Id, FirstName, LastName, IsActive
      FROM User
      WHERE Id = :userId
      LIMIT 1
    ];
    Boolean changed = false;
    if (String.isNotBlank(data.firstName) && data.firstName != u.FirstName) {
      u.FirstName = data.firstName;
      changed = true;
    }
    if (String.isNotBlank(data.lastName) && data.lastName != u.LastName) {
      u.LastName = data.lastName;
      changed = true;
    }
    if (!u.IsActive) {
      u.IsActive = true;
      changed = true;
    }
    if (changed)
      update u;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private Id resolveIndividualAccountId() {
    List<Account> found = [
      SELECT Id
      FROM Account
      WHERE Name = 'Individual Customers'
      LIMIT 1
    ];
    return found.isEmpty() ? null : found[0].Id;
  }

  private Id createRecordViaRest(
    String objectType,
    Map<String, Object> fields
  ) {
    HttpRequest req = new HttpRequest();
    // Named Credential 'NexusOrgAPI' injects the OAuth Bearer token automatically
    req.setEndpoint(
      'callout:NexusOrgAPI/services/data/v62.0/sobjects/' + objectType
    );
    req.setMethod('POST');
    req.setHeader('Content-Type', 'application/json');
    req.setBody(JSON.serialize(fields));
    req.setTimeout(10000);

    HttpResponse res = new Http().send(req);

    if (res.getStatusCode() == 201) {
      Map<String, Object> body = (Map<String, Object>) JSON.deserializeUntyped(
        res.getBody()
      );
      return (Id) body.get('id');
    }

    // 400 duplicate Contact — find and return existing
    if (objectType == 'Contact') {
      String emailVal = (String) fields.get('Email');
      if (String.isNotBlank(emailVal)) {
        List<Contact> existing = [
          SELECT Id
          FROM Contact
          WHERE Email = :emailVal
          LIMIT 1
        ];
        if (!existing.isEmpty())
          return existing[0].Id;
      }
    }

    throw new Auth.AuthProviderPluginException(
      'REST create ' +
        objectType +
        ' failed (' +
        res.getStatusCode() +
        '): ' +
        res.getBody()
    );
  }
}
