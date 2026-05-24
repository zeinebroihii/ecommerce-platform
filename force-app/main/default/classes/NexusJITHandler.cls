/**
 * Just-In-Time (JIT) SAML provisioning handler for Nexus Experience Cloud.
 *
 * Triggered by Salesforce automatically when a SAML assertion arrives
 * but no User with a matching FederationIdentifier exists yet.
 *
 * Primary scenario (Paul, new TechCorp employee):
 *   1. Karim converted TechCorp SA → Account "TechCorp SA" exists in Salesforce.
 *   2. TechCorp IT assigns Paul to Nexus in Okta.
 *   3. SCIM provisions Paul (preferred path).
 *   4. If SCIM hasn't run yet and Paul clicks "Connexion via Okta":
 *      → JIT fires here, creates Paul's portal User, links to TechCorp SA.
 *
 * Configuration in Salesforce Setup:
 *   Setup → Single Sign-On Settings → [Okta config] → Just-in-Time User Provisioning: ✓
 *   SAML JIT Handler: NexusJITHandler
 *   Execute JIT Handler As: [integration user with Manage Users permission]
 *
 * The handler also runs on every subsequent login (updateUser) to keep
 * profile attributes in sync with Okta.
 */
global class NexusJITHandler implements Auth.SamlJitHandler {
  private static final String PORTAL_HOME = 'https://orgfarm-56b3b63a30-dev-ed.develop.my.site.com/ss/s/';

  // =========================================================================
  // createUser — called on FIRST login when no matching FederationIdentifier
  // =========================================================================
  global User createUser(
    Id samlSsoProviderId,
    Id communityId,
    Id portalId,
    String federationId, // value from SAML <NameID> — typically email
    Map<String, String> attributes,
    String assertion
  ) {
    // 1. Extract user attributes from SAML assertion
    String email = String.isNotBlank(attributes.get('email'))
      ? attributes.get('email')
      : federationId;
    String firstName = attributes.containsKey('firstName')
      ? attributes.get('firstName')
      : attributes.containsKey('given_name')
          ? attributes.get('given_name')
          : '';
    String lastName = attributes.containsKey('lastName')
      ? attributes.get('lastName')
      : attributes.containsKey('family_name')
          ? attributes.get('family_name')
          : email.substringBefore('@');
    if (String.isBlank(lastName))
      lastName = 'User';

    // 2. Find Account by email domain (techcorp.com → TechCorp SA account)
    Id accountId = resolveAccountByDomain(email);

    // 3. Find or create a Contact under that Account
    Id contactId = resolveContact(email, firstName, lastName, accountId);

    // 4. Ensure Account owner has a role (portal prerequisite)
    if (accountId != null)
      ensureAccountOwnerHasRole(accountId);

    // 5. Resolve portal profile
    Id profileId = resolvePortalProfile();
    if (profileId == null) {
      throw new AuraHandledException(
        'No portal profile found. Configure a Customer Community profile.'
      );
    }

    // 6. Build alias + nickname (must be unique)
    String fn = firstName.replaceAll('[^a-zA-Z0-9]', '');
    String ln = lastName.replaceAll('[^a-zA-Z0-9]', '');
    String alias = (fn.left(1) + ln.left(7)).left(8);
    if (String.isBlank(alias))
      alias =
        'jit' + String.valueOf(Math.abs(Crypto.getRandomInteger())).left(4);
    String nick =
      (fn + ln).left(30) + String.valueOf(Math.abs(email.hashCode())).left(10);
    nick = nick.replaceAll('[^a-zA-Z0-9]', '').left(40);
    if (String.isBlank(nick))
      nick = 'jit' + String.valueOf(Math.abs(email.hashCode())).left(7);

    // 7. Create the portal User
    User u = new User(
      ProfileId = profileId,
      ContactId = contactId,
      Username = email,
      Email = email,
      FirstName = firstName,
      LastName = lastName,
      Alias = alias,
      CommunityNickname = nick,
      // SAML bridge — must match the <NameID> from Okta assertion
      FederationIdentifier = federationId,
      IsActive = true,
      TimeZoneSidKey = 'Europe/Paris',
      LocaleSidKey = 'fr_FR',
      LanguageLocaleKey = 'fr',
      EmailEncodingKey = 'UTF-8'
    );

    return u;
  }

  // =========================================================================
  // updateUser — called on EVERY login after the first (to sync attributes)
  // =========================================================================
  global void updateUser(
    Id userId,
    Id samlSsoProviderId,
    Id communityId,
    Id portalId,
    String federationId,
    Map<String, String> attributes,
    String assertion
  ) {
    User u = [
      SELECT Id, FirstName, LastName, Email, IsActive
      FROM User
      WHERE Id = :userId
      LIMIT 1
    ];

    Boolean changed = false;

    // Sync first/last name if Okta sends them
    if (
      attributes.containsKey('firstName') &&
      String.isNotBlank(attributes.get('firstName'))
    ) {
      String newFirst = attributes.get('firstName');
      if (newFirst != u.FirstName) {
        u.FirstName = newFirst;
        changed = true;
      }
    }
    if (
      attributes.containsKey('lastName') &&
      String.isNotBlank(attributes.get('lastName'))
    ) {
      String newLast = attributes.get('lastName');
      if (newLast != u.LastName) {
        u.LastName = newLast;
        changed = true;
      }
    }

    // Ensure user stays active on each SSO login
    // (SCIM sets IsActive=false on offboarding — if that happened, this login
    //  would never reach here because Okta wouldn't issue the assertion;
    //  so a login arriving here means the user is legitimately active in Okta)
    if (!u.IsActive) {
      u.IsActive = true;
      changed = true;
    }

    if (changed)
      update u;
  }

  // =========================================================================
  // Private helpers
  // =========================================================================

  /**
   * Resolve the Account that corresponds to an email domain.
   * 'paul@techcorp.com' → looks for Account where Website LIKE '%techcorp.com'
   * Falls back to company name matching using the domain root ('techcorp').
   */
  private static Id resolveAccountByDomain(String email) {
    if (String.isBlank(email) || !email.contains('@'))
      return null;
    String domain = email.substringAfter('@').toLowerCase(); // 'techcorp.com'
    String domainRoot = domain.substringBefore('.'); // 'techcorp'

    List<Account> byWebsite = [
      SELECT Id
      FROM Account
      WHERE Website LIKE :('%' + domain)
      ORDER BY CreatedDate DESC
      LIMIT 1
    ];
    if (!byWebsite.isEmpty())
      return byWebsite[0].Id;

    List<Account> byName = [
      SELECT Id
      FROM Account
      WHERE Name LIKE :('%' + domainRoot + '%')
      ORDER BY CreatedDate DESC
      LIMIT 1
    ];
    return byName.isEmpty() ? null : byName[0].Id;
  }

  /**
   * Find or create a Contact under the resolved Account.
   * JIT must link the User to a Contact for Experience Cloud membership.
   */
  private static Id resolveContact(
    String email,
    String firstName,
    String lastName,
    Id accountId
  ) {
    List<Contact> existing = [
      SELECT Id
      FROM Contact
      WHERE Email = :email
      LIMIT 1
    ];
    if (!existing.isEmpty())
      return existing[0].Id;

    Contact c = new Contact(
      FirstName = firstName,
      LastName = String.isNotBlank(lastName) ? lastName : 'User',
      Email = email,
      AccountId = accountId
    );
    insert c;
    return c.Id;
  }

  /**
   * Salesforce requires the Account owner to have a UserRole before
   * a portal User can be inserted (MIXED_DML_OPERATION guard).
   */
  private static void ensureAccountOwnerHasRole(Id accountId) {
    try {
      Account acc = [SELECT OwnerId FROM Account WHERE Id = :accountId LIMIT 1];
      User owner = [
        SELECT Id, UserRoleId
        FROM User
        WHERE Id = :acc.OwnerId
        LIMIT 1
      ];
      if (owner.UserRoleId != null)
        return;

      List<UserRole> nexusRoles = [
        SELECT Id
        FROM UserRole
        WHERE Name = 'Nexus Admin'
        LIMIT 1
      ];
      Id roleId;
      if (!nexusRoles.isEmpty()) {
        roleId = nexusRoles[0].Id;
      } else {
        UserRole r = new UserRole(
          Name = 'Nexus Admin',
          DeveloperName = 'Nexus_Admin'
        );
        insert r;
        roleId = r.Id;
      }
      owner.UserRoleId = roleId;
      update owner;
    } catch (Exception e) {
      System.debug(
        'NexusJITHandler.ensureAccountOwnerHasRole: ' + e.getMessage()
      );
    }
  }

  private static Id resolvePortalProfile() {
    for (
      String name : new List<String>{
        'Customer Community Login User',
        'Customer Community Plus Login User',
        'Customer Community Plus User',
        'Customer Community User'
      }
    ) {
      List<Profile> p = [SELECT Id FROM Profile WHERE Name = :name LIMIT 1];
      if (!p.isEmpty())
        return p[0].Id;
    }
    return null;
  }
}
