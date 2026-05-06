/**
 * SCIM 2.0 REST endpoint for Experience Cloud portal users.
 * Okta calls this when employees are assigned/removed from the Nexus app
 * in the TechCorp Okta tenant.
 *
 * Supported operations:
 *   GET    /scim/v2/Users          → list portal users (for Okta sync)
 *   GET    /scim/v2/Users/{id}     → get single user
 *   POST   /scim/v2/Users          → create portal user (onboarding)
 *   PATCH  /scim/v2/Users/{id}     → update user (deactivate on offboarding)
 *
 * Security: requires a Named Credential or Custom Permission for Okta.
 * In Setup → Connected App, restrict to Okta's IP range and require
 * a dedicated integration user with "Manage Users" permission.
 *
 * SCIM 2.0 spec: https://tools.ietf.org/html/rfc7644
 */
@RestResource(urlMapping='/scim/v2/Users/*')
global without sharing class ScimUserController {
  // ── SCIM schemas ──────────────────────────────────────────────────────────
  private static final String SCIM_USER_SCHEMA = 'urn:ietf:params:scim:schemas:core:2.0:User';
  private static final String SCIM_PATCH_SCHEMA = 'urn:ietf:params:scim:api:messages:2.0:PatchOp';
  private static final String SCIM_LIST_SCHEMA = 'urn:ietf:params:scim:api:messages:2.0:ListResponse';
  private static final String SITE_URL = 'https://orgfarm-56b3b63a30-dev-ed.develop.my.site.com/ss/s/';

  // ── Portal user types Salesforce uses for Experience Cloud ───────────────
  private static final Set<String> PORTAL_USER_TYPES = new Set<String>{
    'PowerCustomerSuccess',
    'CspLitePortal',
    'PowerPartner'
  };

  // =========================================================================
  // GET /scim/v2/Users  or  GET /scim/v2/Users/{id}
  // Okta calls GET to discover existing users before creating duplicates.
  // =========================================================================
  @HttpGet
  global static void getUsers() {
    RestRequest req = RestContext.request;
    RestResponse resp = RestContext.response;
    resp.addHeader('Content-Type', 'application/json');

    String userId = extractIdFromUrl(req.requestURI);

    try {
      if (String.isNotBlank(userId)) {
        // Single user lookup
        List<User> users = [
          SELECT
            Id,
            FirstName,
            LastName,
            Email,
            FederationIdentifier,
            IsActive,
            Username
          FROM User
          WHERE Id = :userId AND UserType IN :PORTAL_USER_TYPES
          LIMIT 1
        ];
        if (users.isEmpty()) {
          resp.statusCode = 404;
          resp.responseBody = Blob.valueOf(scimError(404, 'User not found'));
          return;
        }
        resp.statusCode = 200;
        resp.responseBody = Blob.valueOf(JSON.serialize(toScimUser(users[0])));
      } else {
        // List — Okta uses ?filter=userName eq "email" to check existence
        String filter = req.params.get('filter');
        List<User> users = queryPortalUsers(filter);
        resp.statusCode = 200;
        resp.responseBody = Blob.valueOf(buildListResponse(users));
      }
    } catch (Exception e) {
      resp.statusCode = 500;
      resp.responseBody = Blob.valueOf(scimError(500, e.getMessage()));
    }
  }

  // =========================================================================
  // POST /scim/v2/Users
  // Okta calls POST when a new TechCorp employee is assigned the Nexus app.
  // Creates the portal User linked to the right Account (TechCorp SA).
  // =========================================================================
  @HttpPost
  global static void createUser() {
    RestRequest req = RestContext.request;
    RestResponse resp = RestContext.response;
    resp.addHeader('Content-Type', 'application/json');

    try {
      Map<String, Object> body = (Map<String, Object>) JSON.deserializeUntyped(
        req.requestBody.toString()
      );

      String email = getStr(body, 'userName');
      String extId = getStr(body, 'externalId');
      Boolean active = body.get('active') == true;

      if (String.isBlank(email)) {
        resp.statusCode = 400;
        resp.responseBody = Blob.valueOf(
          scimError(400, 'userName is required')
        );
        return;
      }

      // Idempotency — return existing user if already provisioned
      List<User> existing = [
        SELECT Id, Email, IsActive, Username, FederationIdentifier
        FROM User
        WHERE
          (Email = :email
          OR FederationIdentifier = :email)
          AND UserType IN :PORTAL_USER_TYPES
        LIMIT 1
      ];
      if (!existing.isEmpty()) {
        resp.statusCode = 409;
        resp.responseBody = Blob.valueOf(
          scimError(409, 'User already exists: ' + existing[0].Id)
        );
        return;
      }

      // Parse name from SCIM 'name' object
      Map<String, Object> nameObj = (Map<String, Object>) body.get('name');
      String firstName = nameObj != null ? getStr(nameObj, 'givenName') : '';
      String lastName = nameObj != null
        ? getStr(nameObj, 'familyName')
        : 'User';
      if (String.isBlank(lastName))
        lastName = 'User';

      // Resolve Account by email domain — finds TechCorp SA from marie@techcorp.com
      String domain = email.substringAfter('@');
      List<Account> accounts = [
        SELECT Id
        FROM Account
        WHERE
          Website LIKE :('%' + domain)
          OR Name LIKE :('%' + domain.substringBefore('.') + '%')
        ORDER BY CreatedDate DESC
        LIMIT 1
      ];
      Id accountId = accounts.isEmpty() ? null : accounts[0].Id;

      // Find or create a Contact under that Account
      Id contactId = resolveContact(email, firstName, lastName, accountId);

      // Resolve portal profile
      Id profileId = resolvePortalProfile();
      if (profileId == null) {
        resp.statusCode = 500;
        resp.responseBody = Blob.valueOf(
          scimError(500, 'Portal profile not found')
        );
        return;
      }

      // Build alias + nickname
      String fn = firstName.replaceAll('[^a-zA-Z0-9]', '');
      String ln = lastName.replaceAll('[^a-zA-Z0-9]', '');
      String alias = (fn.left(1) + ln.left(7)).left(8);
      if (String.isBlank(alias))
        alias =
          'scim' + String.valueOf(Math.abs(Crypto.getRandomInteger())).left(4);
      String nick =
        (fn + ln).left(34) +
        String.valueOf(Math.abs(Crypto.getRandomInteger())).left(6);
      nick = nick.replaceAll('[^a-zA-Z0-9]', '').left(40);
      if (String.isBlank(nick))
        nick =
          'user' + String.valueOf(Math.abs(Crypto.getRandomInteger())).left(6);

      User u = new User(
        ProfileId = profileId,
        ContactId = contactId,
        Username = email,
        Email = email,
        FirstName = firstName,
        LastName = lastName,
        Alias = alias,
        CommunityNickname = nick,
        // SAML bridge — Okta NameID matches this field
        FederationIdentifier = String.isNotBlank(extId) ? extId : email,
        IsActive = active,
        TimeZoneSidKey = 'Europe/Paris',
        LocaleSidKey = 'fr_FR',
        LanguageLocaleKey = 'fr',
        EmailEncodingKey = 'UTF-8'
      );

      try {
        insert u;
      } catch (DmlException e) {
        if (e.getMessage().contains('DUPLICATE_USERNAME')) {
          u.Username =
            email +
            '.nx' +
            String.valueOf(Math.abs(Crypto.getRandomInteger()));
          insert u;
        } else {
          throw e;
        }
      }

      resp.statusCode = 201;
      resp.addHeader('Location', '/services/apexrest/scim/v2/Users/' + u.Id);
      resp.responseBody = Blob.valueOf(
        JSON.serialize(
          toScimUser(
            [
              SELECT
                Id,
                FirstName,
                LastName,
                Email,
                FederationIdentifier,
                IsActive,
                Username
              FROM User
              WHERE Id = :u.Id
              LIMIT 1
            ]
          )
        )
      );
    } catch (Exception e) {
      resp.statusCode = 500;
      resp.responseBody = Blob.valueOf(scimError(500, e.getMessage()));
    }
  }

  // =========================================================================
  // PATCH /scim/v2/Users/{id}
  // THE KEY OPERATION: Okta sends this when an employee leaves TechCorp.
  // Payload: {"schemas":[SCIM_PATCH_SCHEMA],"Operations":[{"op":"replace","value":{"active":false}}]}
  // Result: User.IsActive = false → session invalid on next request → immediate revocation.
  // =========================================================================
  @HttpPatch
  global static void updateUser() {
    RestRequest req = RestContext.request;
    RestResponse resp = RestContext.response;
    resp.addHeader('Content-Type', 'application/json');

    String userId = extractIdFromUrl(req.requestURI);
    if (String.isBlank(userId)) {
      resp.statusCode = 400;
      resp.responseBody = Blob.valueOf(
        scimError(400, 'User ID is required in URL')
      );
      return;
    }

    try {
      List<User> users = [
        SELECT
          Id,
          FirstName,
          LastName,
          Email,
          FederationIdentifier,
          IsActive,
          Username
        FROM User
        WHERE Id = :userId AND UserType IN :PORTAL_USER_TYPES
        LIMIT 1
      ];
      if (users.isEmpty()) {
        resp.statusCode = 404;
        resp.responseBody = Blob.valueOf(
          scimError(404, 'User not found: ' + userId)
        );
        return;
      }
      User u = users[0];

      Map<String, Object> body = (Map<String, Object>) JSON.deserializeUntyped(
        req.requestBody.toString()
      );

      // Parse SCIM PatchOp — can be an array of operations
      List<Object> operations = (List<Object>) body.get('Operations');
      if (operations != null) {
        for (Object opObj : operations) {
          Map<String, Object> op = (Map<String, Object>) opObj;
          String opType = getStr(op, 'op').toLowerCase();
          Object val = op.get('value');

          if (opType == 'replace' && val instanceof Map<String, Object>) {
            Map<String, Object> valMap = (Map<String, Object>) val;
            // active: false → DEACTIVATE (the offboarding trigger)
            if (valMap.containsKey('active')) {
              u.IsActive = valMap.get('active') == true;
            }
            if (valMap.containsKey('userName')) {
              String newEmail = (String) valMap.get('userName');
              if (String.isNotBlank(newEmail))
                u.Email = newEmail;
            }
            if (valMap.containsKey('name')) {
              Map<String, Object> nameMap = (Map<String, Object>) valMap.get(
                'name'
              );
              if (nameMap != null) {
                if (nameMap.containsKey('givenName'))
                  u.FirstName = (String) nameMap.get('givenName');
                if (nameMap.containsKey('familyName'))
                  u.LastName = (String) nameMap.get('familyName');
              }
            }
          }
        }
      }

      update u;

      resp.statusCode = 200;
      resp.responseBody = Blob.valueOf(
        JSON.serialize(
          toScimUser(
            [
              SELECT
                Id,
                FirstName,
                LastName,
                Email,
                FederationIdentifier,
                IsActive,
                Username
              FROM User
              WHERE Id = :u.Id
              LIMIT 1
            ]
          )
        )
      );
    } catch (Exception e) {
      resp.statusCode = 500;
      resp.responseBody = Blob.valueOf(scimError(500, e.getMessage()));
    }
  }

  // =========================================================================
  // Private helpers
  // =========================================================================

  private static String extractIdFromUrl(String uri) {
    if (String.isBlank(uri))
      return '';
    // URI: /services/apexrest/scim/v2/Users/005xxxxxxx  or  /scim/v2/Users/005xxxxxxx
    List<String> parts = uri.split('/');
    String last = parts[parts.size() - 1];
    // Return only if it looks like a Salesforce ID (15 or 18 chars, alphanumeric)
    return (last.length() == 15 || last.length() == 18) && last.isAlphanumeric()
      ? last
      : '';
  }

  private static List<User> queryPortalUsers(String filter) {
    if (String.isNotBlank(filter) && filter.containsIgnoreCase('userName eq')) {
      // filter: userName eq "marie@techcorp.com"
      String email = filter.substringAfter('"').substringBefore('"');
      if (String.isNotBlank(email)) {
        return [
          SELECT
            Id,
            FirstName,
            LastName,
            Email,
            FederationIdentifier,
            IsActive,
            Username
          FROM User
          WHERE Email = :email AND UserType IN :PORTAL_USER_TYPES
          LIMIT 1
        ];
      }
    }
    return [
      SELECT
        Id,
        FirstName,
        LastName,
        Email,
        FederationIdentifier,
        IsActive,
        Username
      FROM User
      WHERE UserType IN :PORTAL_USER_TYPES AND IsActive = TRUE
      ORDER BY CreatedDate DESC
      LIMIT 100
    ];
  }

  private static Map<String, Object> toScimUser(User u) {
    return new Map<String, Object>{
      'schemas' => new List<String>{ SCIM_USER_SCHEMA },
      'id' => u.Id,
      'userName' => u.Email,
      'externalId' => u.FederationIdentifier,
      'active' => u.IsActive,
      'name' => new Map<String, Object>{
        'givenName' => u.FirstName,
        'familyName' => u.LastName,
        'formatted' => ((u.FirstName != null ? u.FirstName + ' ' : '') +
          u.LastName)
          .trim()
      },
      'emails' => new List<Object>{
        new Map<String, Object>{
          'value' => u.Email,
          'primary' => true,
          'type' => 'work'
        }
      },
      'meta' => new Map<String, Object>{
        'resourceType' => 'User',
        'location' => '/services/apexrest/scim/v2/Users/' + u.Id
      }
    };
  }

  private static String buildListResponse(List<User> users) {
    List<Object> resources = new List<Object>();
    for (User u : users)
      resources.add(toScimUser(u));
    return JSON.serialize(
      new Map<String, Object>{
        'schemas' => new List<String>{ SCIM_LIST_SCHEMA },
        'totalResults' => resources.size(),
        'startIndex' => 1,
        'itemsPerPage' => resources.size(),
        'Resources' => resources
      }
    );
  }

  private static String scimError(Integer status, String detail) {
    return JSON.serialize(
      new Map<String, Object>{
        'schemas' => new List<String>{
          'urn:ietf:params:scim:api:messages:2.0:Error'
        },
        'status' => String.valueOf(status),
        'detail' => detail
      }
    );
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

    // Create a new Contact linked to the Account
    Contact c = new Contact(
      FirstName = firstName,
      LastName = String.isNotBlank(lastName) ? lastName : 'User',
      Email = email,
      AccountId = accountId
    );
    insert c;
    return c.Id;
  }

  private static String getStr(Map<String, Object> m, String key) {
    Object v = m != null ? m.get(key) : null;
    return v instanceof String ? (String) v : '';
  }
}
