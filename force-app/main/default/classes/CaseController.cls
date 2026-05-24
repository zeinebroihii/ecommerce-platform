/**
 * CaseController
 * Apex controller for the caseManager LWC on the Experience Cloud portal.
 * Customers can view their own cases and raise new ones.
 *
 * Uses `with sharing` so Experience Cloud guest / community users only
 * see data that sharing rules allow.
 */
public with sharing class CaseController {
  // ── Result wrapper returned to LWC on create ───────────────────────────
  public class CaseResult {
    @AuraEnabled
    public String caseId;
    @AuraEnabled
    public String caseNumber;
  }

  // ── Get all cases for this Account ────────────────────────────────────
  @AuraEnabled
  public static List<Case> getMyCases(Id accountId) {
    if (accountId == null)
      return new List<Case>();

    return [
      SELECT
        Id,
        CaseNumber,
        Subject,
        Description,
        Status,
        Type,
        Priority,
        CreatedDate,
        Related_Order__c,
        Related_Order__r.Name,
        Resolution_Time_Hours__c
      FROM Case
      WHERE AccountId = :accountId
      ORDER BY CreatedDate DESC
      LIMIT 50
    ];
  }

  // ── Create a new Case on behalf of the logged-in customer ─────────────
  @AuraEnabled
  public static CaseResult createCase(
    String caseType,
    String subject,
    String priority,
    String description,
    String orderRef
  ) {
    // Resolve the current user's AccountId (community / internal)
    Id currentUserId = UserInfo.getUserId();
    User currentUser = [
      SELECT AccountId, ContactId
      FROM User
      WHERE Id = :currentUserId
      LIMIT 1
    ];

    Case newCase = new Case();
    newCase.AccountId = currentUser.AccountId;
    newCase.ContactId = currentUser.ContactId;
    newCase.Type = caseType;
    newCase.Subject = subject;
    newCase.Priority = priority;
    newCase.Description = description;
    newCase.Origin = 'Web';
    newCase.Status = 'New';

    // If the customer entered an order number, try to match an Order
    if (String.isNotBlank(orderRef)) {
      List<Order> orders = [
        SELECT Id
        FROM Order
        WHERE
          OrderNumber = :orderRef.trim()
          AND AccountId = :currentUser.AccountId
        LIMIT 1
      ];
      if (!orders.isEmpty()) {
        newCase.Related_Order__c = orders[0].Id;
      }
    }

    insert newCase;

    // Re-query to get the auto-generated CaseNumber
    Case inserted = [SELECT Id, CaseNumber FROM Case WHERE Id = :newCase.Id];

    CaseResult result = new CaseResult();
    result.caseId = inserted.Id;
    result.caseNumber = inserted.CaseNumber;
    return result;
  }

  @AuraEnabled
  public static void uploadCaseFiles(
    Id caseId,
    List<String> fileNames,
    List<String> fileTypes,
    List<String> fileData
  ) {
    if (
      caseId == null ||
      fileNames == null ||
      fileTypes == null ||
      fileData == null
    ) {
      return;
    }
    if (
      fileNames.size() != fileTypes.size() ||
      fileNames.size() != fileData.size()
    ) {
      throw new AuraHandledException('Incomplete file upload payload.');
    }

    List<ContentVersion> versions = new List<ContentVersion>();
    for (Integer i = 0; i < fileNames.size(); i++) {
      versions.add(
        new ContentVersion(
          Title = fileNames[i],
          PathOnClient = fileNames[i],
          VersionData = EncodingUtil.base64Decode(fileData[i]),
          IsMajorVersion = true
        )
      );
    }
    insert versions;

    versions = [
      SELECT Id, ContentDocumentId
      FROM ContentVersion
      WHERE Id IN :versions
    ];

    List<ContentDocumentLink> links = new List<ContentDocumentLink>();
    for (ContentVersion cv : versions) {
      links.add(
        new ContentDocumentLink(
          ContentDocumentId = cv.ContentDocumentId,
          LinkedEntityId = caseId,
          ShareType = 'V',
          Visibility = 'AllUsers'
        )
      );
    }
    insert links;
  }
}
