public without sharing class AuthController {
  /**
   * Authenticate a user on the Experience Cloud site.
   * Returns the redirect URL on success, throws AuraHandledException on failure.
   */
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
      List<Profile> profiles = [
        SELECT Id
        FROM Profile
        WHERE
          Name IN (
            'Customer Community User',
            'Customer Community Login User',
            'Customer Community Plus Login User',
            'Customer Community Plus User'
          )
        ORDER BY Name ASC
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
        Id userId = UserInfo.getUserId();
        User u = [
          SELECT FirstName, LastName, Phone, Title, ContactId
          FROM User
          WHERE Id = :userId
          LIMIT 1
        ];
        profile.put('firstName', u.FirstName != null ? u.FirstName : '');
        profile.put('lastName', u.LastName != null ? u.LastName : '');
        profile.put('phone', u.Phone != null ? u.Phone : '');
        profile.put('title', u.Title != null ? u.Title : '');

        // Enrich with Contact + Account fields
        if (u.ContactId != null) {
          Contact c = [
            SELECT
              Phone,
              AccountId,
              MailingStreet,
              MailingCity,
              MailingPostalCode,
              MailingCountry,
              Account.Name
            FROM Contact
            WHERE Id = :u.ContactId
            LIMIT 1
          ];

          if (String.isBlank(profile.get('phone')) && c.Phone != null) {
            profile.put('phone', c.Phone);
          }
          profile.put('street', c.MailingStreet != null ? c.MailingStreet : '');
          profile.put('city', c.MailingCity != null ? c.MailingCity : '');
          profile.put(
            'postalCode',
            c.MailingPostalCode != null ? c.MailingPostalCode : ''
          );
          profile.put(
            'country',
            c.MailingCountry != null ? c.MailingCountry : ''
          );
          if (c.AccountId != null) {
            profile.put('accountId', String.valueOf(c.AccountId));
          }
          if (
            c.AccountId != null &&
            c.Account != null &&
            c.Account.Name != null
          ) {
            profile.put('accountName', c.Account.Name);
          }
        }
      } catch (Exception ex) {
        /* User/Contact query failed — core fields already set */
      }

      return profile;
    } catch (Exception e) {
      throw new AuraHandledException(e.getMessage());
    }
  }
}
