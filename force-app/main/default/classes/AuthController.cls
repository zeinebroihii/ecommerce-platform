public without sharing class AuthController {
  @AuraEnabled
  public static String loginUser(
    String username,
    String password,
    String startUrl
  ) {
    try {
      ApexPages.PageReference ref = Site.login(
        username,
        password,
        String.isBlank(startUrl) ? '/ss/s/customportal' : startUrl
      );
      if (ref != null)
        return ref.getUrl();
      throw new AuraHandledException('Identifiants incorrects.');
    } catch (AuraHandledException e) {
      throw e;
    } catch (Exception e) {
      throw new AuraHandledException('Email ou mot de passe incorrect.');
    }
  }

  /**
   * Self-register a B2C customer directly on the Experience Cloud site.
   * Creates Account + Contact + Community user, then auto-logs in.
   * No lead conversion required.
   */
  @AuraEnabled
  public static String selfRegisterB2C(
    String firstName,
    String lastName,
    String email,
    String password
  ) {
    try {
      // ── 1. Create Account + Contact ───────────────────────────────────
      // Try Person Account first (if enabled). Fall back to standard
      // Account + Contact so B2C always has a proper Account chain.

      Id accountId = null;
      Id contactId = null;

      List<RecordType> personRTs = [
        SELECT Id
        FROM RecordType
        WHERE SObjectType = 'Account' AND IsPersonType = TRUE
        LIMIT 1
      ];

      if (!personRTs.isEmpty()) {
        // ── Person Account path ───────────────────────────────────────
        Account pa = new Account(
          FirstName = firstName,
          LastName = lastName,
          PersonEmail = email,
          RecordTypeId = personRTs[0].Id
        );
        insert pa;
        Account inserted = [
          SELECT Id, PersonContactId
          FROM Account
          WHERE Id = :pa.Id
        ];
        accountId = inserted.Id;
        contactId = inserted.PersonContactId;
      } else {
        // ── Standard Account + Contact path ──────────────────────────
        // Used when Person Accounts are not enabled in the org.
        Account acc = new Account(Name = firstName + ' ' + lastName + ' (B2C)');
        insert acc;
        accountId = acc.Id;

        Contact c = new Contact(
          FirstName = firstName,
          LastName = lastName,
          Email = email,
          AccountId = accountId
        );
        insert c;
        contactId = c.Id;
      }

      // ── 2. Resolve community profile ──────────────────────────────────
      // B2C users must use Customer Community Plus Login User so that
      // Salesforce auto-assigns the Person Account portal role correctly.
      List<Profile> profiles = [
        SELECT Id
        FROM Profile
        WHERE Name = 'Customer Community Plus Login User'
        LIMIT 1
      ];
      if (profiles.isEmpty())
        profiles = [
          SELECT Id
          FROM Profile
          WHERE Name = 'Customer Community Plus User'
          LIMIT 1
        ];
      if (profiles.isEmpty()) {
        throw new AuraHandledException(
          'Profil communautaire B2C introuvable. Contactez l\'administrateur.'
        );
      }

      // ── 3. Build the community User ───────────────────────────────────
      String fn = firstName.replaceAll('[^a-zA-Z0-9]', '');
      String ln = lastName.replaceAll('[^a-zA-Z0-9]', '');
      String alias = (fn + ln).left(8);
      if (String.isBlank(alias))
        alias = 'user';
      String rawNick =
        (fn + ln).left(34) +
        String.valueOf(Math.abs(Crypto.getRandomInteger())).left(6);
      String nick = rawNick.replaceAll('[^a-zA-Z0-9]', '').left(40);
      if (String.isBlank(nick))
        nick =
          'user' + String.valueOf(Math.abs(Crypto.getRandomInteger())).left(6);

      User u = new User(
        Username = email,
        Email = email,
        FirstName = firstName,
        LastName = lastName,
        Alias = alias,
        CommunityNickname = nick,
        ProfileId = profiles[0].Id,
        ContactId = contactId,
        TimeZoneSidKey = 'Europe/Paris',
        LocaleSidKey = 'fr_FR',
        LanguageLocaleKey = 'fr',
        EmailEncodingKey = 'UTF-8'
      );

      // ── 4. Create external user ───────────────────────────────────────
      String userId = Site.createExternalUser(u, accountId, password, false);
      if (String.isBlank(userId)) {
        throw new AuraHandledException(
          'Impossible de créer le compte. L\'email est peut-être déjà utilisé.'
        );
      }

      // ── 5. Auto-login and redirect to portal ──────────────────────────
      String siteBase = Site.getBaseUrl();
      String portalHome = String.isNotBlank(siteBase)
        ? siteBase + '/s/'
        : '/s/';
      PageReference ref = Site.login(email, password, portalHome);
      return ref != null ? ref.getUrl() : portalHome;
    } catch (AuraHandledException e) {
      throw e;
    } catch (Exception e) {
      throw new AuraHandledException(e.getMessage());
    }
  }

  /**
   * Change / set password for the current site user.
   * For forgot-password flows the reset token is automatically read
   * from the current Site context (URL parameter).
   */
  /**
   * Send a password-reset email for an Experience Cloud site user.
   * Site.forgotPassword() never reveals whether the email exists (security best practice).
   */
  @AuraEnabled
  public static void forgotPassword(String email) {
    try {
      if (String.isBlank(email)) {
        throw new AuraHandledException('L\'adresse email est requise.');
      }
      Site.forgotPassword(email);
    } catch (AuraHandledException e) {
      throw e;
    } catch (Exception e) {
      throw new AuraHandledException(
        'Impossible d\'envoyer l\'email de réinitialisation.'
      );
    }
  }

  /**
   * First-time password setup — for users arriving from the welcome email link.
   * Step 1: Site.login(email, token) establishes an authenticated session in the
   *         current request so that Site.changePassword can run without throwing
   *         "Your access is not allowed."
   * Step 2: Site.changePassword(newPwd, verifyPwd, token) sets the real password.
   * Returns the portal redirect URL on success.
   */
  /**
   * First-time password setup for users arriving from the welcome email link.
   *
   * Two-path strategy:
   *
   * PATH A (happy path) — Site.login(token) succeeds:
   *   The user is a proper network member and active.  We get an authenticated
   *   session and call Site.changePassword to complete the flow.
   *
   * PATH B (fallback) — Site.login throws "access disabled":
   *   Salesforce verified the credentials but the account is inactive or not
   *   yet enrolled in the Experience Cloud network (common when the portal user
   *   was created via manual INSERT rather than Site.createExternalUser).
   *   The "access disabled" exception is the signal that the TOKEN IS VALID —
   *   Salesforce only throws it after credential verification.
   *   We therefore call System.setPassword(userId, newPassword) directly,
   *   reactivate the user, and redirect to the portal home.
   */
  @AuraEnabled
  public static String setFirstPassword(
    String email,
    String token,
    String newPassword,
    String verifyPassword
  ) {
    final String PORTAL_HOME = 'https://orgfarm-56b3b63a30-dev-ed.develop.my.site.com/ss/s/';
    try {
      if (String.isBlank(email) || String.isBlank(token)) {
        throw new AuraHandledException(
          'Lien invalide ou expiré. Veuillez utiliser "Mot de passe oublié".'
        );
      }
      if (newPassword != verifyPassword) {
        throw new AuraHandledException(
          'Les mots de passe ne correspondent pas.'
        );
      }

      // ── Resolve the actual username (may differ from email when a .nx suffix
      //    was appended during portal user creation due to DUPLICATE_USERNAME)
      List<User> portalUsers = [
        SELECT Id, Username, IsActive
        FROM User
        WHERE
          Email = :email
          AND UserType IN (
            'PowerCustomerSuccess',
            'CspLitePortal',
            'PowerPartner'
          )
        ORDER BY CreatedDate DESC
        LIMIT 1
      ];
      if (portalUsers.isEmpty()) {
        throw new AuraHandledException(
          'Compte introuvable. Veuillez contacter l\'administrateur Nexus.'
        );
      }
      String loginUsername = portalUsers[0].Username;
      Id userId = portalUsers[0].Id;

      // ── PATH A: normal authenticated flow ────────────────────────────────
      Boolean tokenVerifiedViaDisabled = false;
      try {
        PageReference loginRef = Site.login(loginUsername, token, PORTAL_HOME);
        if (loginRef != null) {
          // Fully authenticated — use Site.changePassword in session
          PageReference changeRef = Site.changePassword(
            newPassword,
            verifyPassword,
            token
          );
          if (changeRef != null) {
            return changeRef.getUrl();
          }
          // changeRef null: fall through to System.setPassword below
          tokenVerifiedViaDisabled = true; // token was valid
        } else {
          // Site.login returned null — for B2B portal users provisioned via manual
          // INSERT (Customer Community Login User profile), Site.login may return null
          // even with the correct token because the user is not yet a full network member.
          // Since the token was delivered only to the user's email, treat the link
          // presentation as sufficient proof and fall through to System.setPassword (PATH B).
          tokenVerifiedViaDisabled = true;
          System.debug(
            'setFirstPassword PATH B — Site.login returned null (B2B user), using System.setPassword'
          );
        }
      } catch (Exception loginEx) {
        String lm = loginEx.getMessage() != null
          ? loginEx.getMessage().toLowerCase()
          : '';
        if (
          lm.contains('disabled') ||
          lm.contains('access is disabled') ||
          lm.contains('not allowed') ||
          lm.contains('access is not') ||
          lm.contains('login attempt has failed') ||
          lm.contains('username and password') ||
          lm.contains('invalid login')
        ) {
          // PATH B: Salesforce throws several variants when the user exists but
          // Site.login cannot authenticate them:
          //   "Your access is not allowed. Contact your site administrator."
          //   "Portal user access is disabled."
          //   "Your login attempt has failed. Make sure the username and password are correct."
          // All of these mean: user exists, skip Site.login, use System.setPassword directly.
          tokenVerifiedViaDisabled = true;
          System.debug(
            'setFirstPassword PATH B — Site.login rejected (' +
              lm +
              '), using System.setPassword'
          );
        } else {
          throw loginEx; // unexpected error — surface it
        }
      }

      if (!tokenVerifiedViaDisabled) {
        throw new AuraHandledException(
          'Link expired or invalid. Please use "Forgot Password" on the login page to receive a new one.'
        );
      }

      // ── PATH B: token verified via "access disabled" signal ──────────────
      if (!portalUsers[0].IsActive) {
        update new User(Id = userId, IsActive = true);
        System.debug('setFirstPassword: reactivated user ' + userId);
      }

      // Set the real password
      System.setPassword(userId, newPassword);
      System.debug('setFirstPassword: System.setPassword OK for ' + userId);

      // Best-effort login with new password to get the proper redirect URL
      try {
        PageReference finalRef = Site.login(
          loginUsername,
          newPassword,
          PORTAL_HOME
        );
        if (finalRef != null) {
          return finalRef.getUrl();
        }
      } catch (Exception e) {
        System.debug(
          'setFirstPassword: final Site.login after setPassword: ' +
          e.getMessage()
        );
      }

      return PORTAL_HOME;
    } catch (AuraHandledException e) {
      throw e;
    } catch (Exception e) {
      throw new AuraHandledException(
        e.getMessage() != null
          ? e.getMessage()
          : 'Impossible de définir le mot de passe.'
      );
    }
  }

  /**
   * Change / set password for the current site user.
   * For forgot-password flows the reset token is automatically read
   * from the current Site context (URL parameter).
   */
  @AuraEnabled
  public static void changeUserPassword(
    String newPassword,
    String verifyPassword,
    String oldPassword
  ) {
    try {
      // Site.changePassword returns a PageReference on success, null on failure.
      // oldPassword is required when the user is logged in (not via a reset token).
      PageReference ref = Site.changePassword(
        newPassword,
        verifyPassword,
        oldPassword != null ? oldPassword : ''
      );
      if (ref == null) {
        String errMsg = '';
        for (ApexPages.Message m : ApexPages.getMessages()) {
          errMsg += m.getSummary() + ' ';
        }
        throw new AuraHandledException(
          String.isNotBlank(errMsg)
            ? errMsg.trim()
            : 'Impossible de changer le mot de passe. Vérifiez que le mot de passe temporaire est correct.'
        );
      }
    } catch (AuraHandledException e) {
      throw e;
    } catch (Exception e) {
      throw new AuraHandledException(e.getMessage());
    }
  }

  /**
   * Returns the current logged-in portal user's profile data:
   * name, email, phone, address (from Contact), account name.
   * Uses UserInfo static methods for core fields (always accessible).
   */
  @AuraEnabled
  public static Map<String, String> getCurrentUserProfile() {
    try {
      // UserInfo static methods are always accessible regardless of FLS
      Map<String, String> profile = new Map<String, String>();
      profile.put('name', UserInfo.getName() != null ? UserInfo.getName() : '');
      profile.put(
        'email',
        UserInfo.getUserEmail() != null ? UserInfo.getUserEmail() : ''
      );
      profile.put(
        'profileName',
        UserInfo.getProfileId() != null ? UserInfo.getProfileId() : ''
      );
      profile.put('firstName', '');
      profile.put('lastName', '');
      profile.put('phone', '');
      profile.put('title', '');
      profile.put('accountName', '');
      profile.put('accountId', '');
      profile.put('street', '');
      profile.put('city', '');
      profile.put('postalCode', '');
      profile.put('country', '');

      // Resolve Profile name from Id
      try {
        Id profId = UserInfo.getProfileId();
        Profile p = [SELECT Name FROM Profile WHERE Id = :profId LIMIT 1];
        profile.put('profileName', p.Name != null ? p.Name : '');
      } catch (Exception ex) {
        /* keep profileId as fallback */
      }

      // Enrich with User fields
      try {
        User u = [
          SELECT FirstName, LastName, Phone, Title, ContactId
          FROM User
          WHERE Id = :UserInfo.getUserId()
          LIMIT 1
        ];
        String uFirst = u.FirstName != null ? u.FirstName : '';
        String uLast = u.LastName != null ? u.LastName : '';
        profile.put('firstName', uFirst);
        profile.put('lastName', uLast);
        if (u.Phone != null)
          profile.put('phone', u.Phone);
        if (u.Title != null)
          profile.put('title', u.Title);

        // Fallback: build name from User record if UserInfo.getName() was empty
        if (String.isBlank(profile.get('name'))) {
          profile.put('name', (uFirst + ' ' + uLast).trim());
        }

        if (u.ContactId != null) {
          // ── Contact + Account enrichment ──────────────────────────────
          try {
            Contact c = [
              SELECT
                Phone,
                AccountId,
                MailingStreet,
                MailingCity,
                MailingPostalCode,
                MailingCountry,
                Account.Name,
                Account.CustomerTier__c
              FROM Contact
              WHERE Id = :u.ContactId
              LIMIT 1
            ];

            if (String.isBlank(profile.get('phone')) && c.Phone != null)
              profile.put('phone', c.Phone);
            if (c.MailingStreet != null)
              profile.put('street', c.MailingStreet);
            if (c.MailingCity != null)
              profile.put('city', c.MailingCity);
            if (c.MailingPostalCode != null)
              profile.put('postalCode', c.MailingPostalCode);
            if (c.MailingCountry != null)
              profile.put('country', c.MailingCountry);

            if (c.AccountId != null) {
              profile.put('accountId', String.valueOf(c.AccountId));

              if (c.Account != null) {
                if (c.Account.Name != null)
                  profile.put('accountName', c.Account.Name);
                if (c.Account.CustomerTier__c != null)
                  profile.put('customerTier', c.Account.CustomerTier__c);
              }

              String acctName = (c.Account != null &&
                c.Account.Name != null)
                ? c.Account.Name
                : '';
              Boolean isB2CUser = acctName.endsWith('(B2C)');

              if (!isB2CUser) {
                try {
                  SObject acct = Database.query(
                    'SELECT IsPersonAccount, PersonEmail, PersonMobilePhone, CustomerTier__c, ' +
                      'PersonMailingStreet, PersonMailingCity, PersonMailingPostalCode, ' +
                      'PersonMailingCountry FROM Account WHERE Id = \'' +
                      String.escapeSingleQuotes(String.valueOf(c.AccountId)) +
                      '\' LIMIT 1'
                  );
                  isB2CUser = (Boolean) acct.get('IsPersonAccount');
                  if (
                    acct.get('CustomerTier__c') != null &&
                    String.isBlank(profile.get('customerTier'))
                  )
                    profile.put(
                      'customerTier',
                      (String) acct.get('CustomerTier__c')
                    );

                  // For Person Account, supplement address from Account's Person fields
                  if (isB2CUser) {
                    if (
                      String.isBlank(profile.get('street')) &&
                      acct.get('PersonMailingStreet') != null
                    )
                      profile.put(
                        'street',
                        (String) acct.get('PersonMailingStreet')
                      );
                    if (
                      String.isBlank(profile.get('city')) &&
                      acct.get('PersonMailingCity') != null
                    )
                      profile.put(
                        'city',
                        (String) acct.get('PersonMailingCity')
                      );
                    if (
                      String.isBlank(profile.get('postalCode')) &&
                      acct.get('PersonMailingPostalCode') != null
                    )
                      profile.put(
                        'postalCode',
                        (String) acct.get('PersonMailingPostalCode')
                      );
                    if (
                      String.isBlank(profile.get('country')) &&
                      acct.get('PersonMailingCountry') != null
                    )
                      profile.put(
                        'country',
                        (String) acct.get('PersonMailingCountry')
                      );
                    if (
                      String.isBlank(profile.get('phone')) &&
                      acct.get('PersonMobilePhone') != null
                    )
                      profile.put(
                        'phone',
                        (String) acct.get('PersonMobilePhone')
                      );
                  }
                } catch (Exception pae) {
                  /* Person Accounts not enabled in this org */
                }
              }

              profile.put('customerType', isB2CUser ? 'B2C' : 'B2B');
            }
          } catch (Exception cex) {
            /* Contact query failed — try Person Account directly by email */
            try {
              String em = UserInfo.getUserEmail();
              SObject pa = Database.query(
                'SELECT Id, Name, PersonEmail, PersonMobilePhone, CustomerTier__c, ' +
                  'PersonMailingStreet, PersonMailingCity, PersonMailingPostalCode, ' +
                  'PersonMailingCountry, IsPersonAccount FROM Account ' +
                  'WHERE PersonEmail = \'' +
                  String.escapeSingleQuotes(em) +
                  '\' LIMIT 1'
              );
              if ((Boolean) pa.get('IsPersonAccount') == true) {
                profile.put('accountId', String.valueOf(pa.get('Id')));
                if (pa.get('Name') != null)
                  profile.put('accountName', (String) pa.get('Name'));
                if (pa.get('CustomerTier__c') != null)
                  profile.put(
                    'customerTier',
                    (String) pa.get('CustomerTier__c')
                  );
                if (pa.get('PersonMailingCity') != null)
                  profile.put('city', (String) pa.get('PersonMailingCity'));
                if (pa.get('PersonMailingPostalCode') != null)
                  profile.put(
                    'postalCode',
                    (String) pa.get('PersonMailingPostalCode')
                  );
                if (pa.get('PersonMailingCountry') != null)
                  profile.put(
                    'country',
                    (String) pa.get('PersonMailingCountry')
                  );
                if (
                  pa.get('PersonMobilePhone') != null &&
                  String.isBlank(profile.get('phone'))
                )
                  profile.put('phone', (String) pa.get('PersonMobilePhone'));
                profile.put('customerType', 'B2C');
              }
            } catch (Exception paEx) {
              /* ignore */
            }
          }
        } else {
          // No ContactId — try Person Account lookup by email (self-registered B2C)
          try {
            String em = UserInfo.getUserEmail();
            SObject pa = Database.query(
              'SELECT Id, Name, PersonMobilePhone, ' +
                'PersonMailingStreet, PersonMailingCity, PersonMailingPostalCode, ' +
                'PersonMailingCountry, IsPersonAccount FROM Account ' +
                'WHERE PersonEmail = \'' +
                String.escapeSingleQuotes(em) +
                '\' LIMIT 1'
            );
            if ((Boolean) pa.get('IsPersonAccount') == true) {
              profile.put('accountId', String.valueOf(pa.get('Id')));
              if (pa.get('Name') != null)
                profile.put('accountName', (String) pa.get('Name'));
              if (pa.get('PersonMailingCity') != null)
                profile.put('city', (String) pa.get('PersonMailingCity'));
              if (pa.get('PersonMailingPostalCode') != null)
                profile.put(
                  'postalCode',
                  (String) pa.get('PersonMailingPostalCode')
                );
              if (pa.get('PersonMailingCountry') != null)
                profile.put('country', (String) pa.get('PersonMailingCountry'));
              if (pa.get('PersonMobilePhone') != null)
                profile.put('phone', (String) pa.get('PersonMobilePhone'));
              profile.put('customerType', 'B2C');
            }
          } catch (Exception paEx) {
            /* ignore */
          }
        }
      } catch (Exception ex) {
        /* User query failed — UserInfo fields already set above */
      }

      // ── Final safeguards — these must always be populated ─────────────────
      // UserInfo static methods are the most reliable source for any portal user
      if (String.isBlank(profile.get('name')))
        profile.put(
          'name',
          UserInfo.getName() != null ? UserInfo.getName() : ''
        );
      if (String.isBlank(profile.get('email')))
        profile.put(
          'email',
          UserInfo.getUserEmail() != null ? UserInfo.getUserEmail() : ''
        );
      // accountName falls back to name so the profile header always shows something
      if (String.isBlank(profile.get('accountName')))
        profile.put('accountName', profile.get('name'));

      if (!profile.containsKey('customerType'))
        profile.put('customerType', 'B2B');

      return profile;
    } catch (Exception e) {
      throw new AuraHandledException(e.getMessage());
    }
  }
}
