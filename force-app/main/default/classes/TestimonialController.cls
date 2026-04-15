public without sharing class TestimonialController {
  // ── Wrappers ──────────────────────────────────────────────────────────────

  public class TestimonialWrapper {
    @AuraEnabled
    public Id testimonialId;
    @AuraEnabled
    public String customerName;
    @AuraEnabled
    public String companyName;
    @AuraEnabled
    public String role;
    @AuraEnabled
    public String message;
    @AuraEnabled
    public Integer rating;
    @AuraEnabled
    public String status;
    @AuraEnabled
    public String avatarColor;
    @AuraEnabled
    public String initials;
    @AuraEnabled
    public String createdDate;
  }

  public class EligibleQuoteWrapper {
    @AuraEnabled
    public Id quoteId;
    @AuraEnabled
    public String quoteName;
    @AuraEnabled
    public String acceptedDate;
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  /**
   * Submit a testimonial linked to an accepted quote.
   * Auto-fills CustomerName, CompanyName, Role from Contact/Account/User.
   */
  @AuraEnabled
  public static Id submitTestimonial(
    Id quoteId,
    Integer rating,
    String message,
    String role
  ) {
    try {
      if (rating == null || rating < 1 || rating > 5) {
        throw new AuraHandledException(
          'La note doit être comprise entre 1 et 5.'
        );
      }
      if (String.isBlank(message)) {
        throw new AuraHandledException('Le message est requis.');
      }

      // Prevent duplicate review for the same quote
      if (quoteId != null) {
        List<Testimonial__c> existing = [
          SELECT Id
          FROM Testimonial__c
          WHERE
            Quote__c = :quoteId
            AND Contact__c IN (
              SELECT ContactId
              FROM User
              WHERE Id = :UserInfo.getUserId()
            )
          LIMIT 1
        ];
        if (!existing.isEmpty()) {
          throw new AuraHandledException(
            'Vous avez déjà soumis un avis pour ce devis.'
          );
        }
      }

      // Resolve Contact + Account
      String customerName = UserInfo.getName();
      String companyName = '';
      String roleFinal = String.isNotBlank(role) ? role : '';
      Id contactId = null;
      Id accountId = null;

      try {
        User u = [
          SELECT ContactId, Title
          FROM User
          WHERE Id = :UserInfo.getUserId()
          LIMIT 1
        ];
        contactId = u.ContactId;
        if (String.isBlank(roleFinal) && String.isNotBlank(u.Title)) {
          roleFinal = u.Title;
        }
        if (u.ContactId != null) {
          Contact c = [
            SELECT Name, AccountId, Account.Name
            FROM Contact
            WHERE Id = :u.ContactId
            LIMIT 1
          ];
          customerName = c.Name;
          accountId = c.AccountId;
          if (c.Account != null && c.Account.Name != null) {
            companyName = c.Account.Name;
          }
        }
      } catch (Exception ex) {
        /* keep UserInfo defaults */
      }

      // Deterministic avatar color from name hash
      String[] colors = new List<String>{
        'emerald',
        'indigo',
        'rose',
        'amber'
      };
      Integer colorIdx = Math.mod(Math.abs(customerName.hashCode()), 4);

      Testimonial__c t = new Testimonial__c(
        Customer_Name__c = customerName,
        Company_Name__c = companyName,
        Role_Title__c = roleFinal,
        Message__c = message,
        Rating__c = rating,
        Status__c = 'Approved',
        Avatar_Color__c = colors[colorIdx],
        Contact__c = contactId,
        Account__c = accountId,
        Quote__c = quoteId
      );
      insert t;
      return t.Id;
    } catch (AuraHandledException ae) {
      throw ae;
    } catch (Exception ex) {
      throw new AuraHandledException(
        'Erreur lors de la soumission : ' + ex.getMessage()
      );
    }
  }

  // ── Read: public landing page ─────────────────────────────────────────────

  /**
   * Returns up to 9 Approved testimonials for the public landing page.
   */
  @AuraEnabled(cacheable=true)
  public static List<TestimonialWrapper> getApprovedTestimonials() {
    try {
      List<Testimonial__c> records = [
        SELECT
          Customer_Name__c,
          Company_Name__c,
          Role_Title__c,
          Message__c,
          Rating__c,
          Avatar_Color__c,
          Status__c,
          CreatedDate
        FROM Testimonial__c
        WHERE Status__c = 'Approved'
        ORDER BY CreatedDate DESC
        LIMIT 9
      ];
      return toWrappers(records);
    } catch (Exception ex) {
      throw new AuraHandledException(
        'Erreur chargement témoignages : ' + ex.getMessage()
      );
    }
  }

  // ── Read: portal — my submissions ─────────────────────────────────────────

  /**
   * Returns testimonials submitted by the current logged-in user.
   */
  @AuraEnabled(cacheable=true)
  public static List<TestimonialWrapper> getMyTestimonials() {
    try {
      Id contactId = resolveContactId();
      if (contactId == null)
        return new List<TestimonialWrapper>();

      List<Testimonial__c> records = [
        SELECT
          Customer_Name__c,
          Company_Name__c,
          Role_Title__c,
          Message__c,
          Rating__c,
          Avatar_Color__c,
          Status__c,
          CreatedDate
        FROM Testimonial__c
        WHERE Contact__c = :contactId
        ORDER BY CreatedDate DESC
        LIMIT 20
      ];
      return toWrappers(records);
    } catch (Exception ex) {
      throw new AuraHandledException(
        'Erreur chargement de vos avis : ' + ex.getMessage()
      );
    }
  }

  // ── Read: portal — quotes eligible for review ─────────────────────────────

  /**
   * Returns accepted quotes that the current user has not yet reviewed.
   */
  @AuraEnabled(cacheable=true)
  public static List<EligibleQuoteWrapper> getEligibleQuotes() {
    try {
      Id contactId = resolveContactId();
      Id accountId = resolveAccountId(contactId);
      if (accountId == null)
        return new List<EligibleQuoteWrapper>();

      // Collect already-reviewed quote IDs
      Set<Id> reviewed = new Set<Id>();
      if (contactId != null) {
        for (Testimonial__c t : [
          SELECT Quote__c
          FROM Testimonial__c
          WHERE Contact__c = :contactId AND Quote__c != NULL
        ]) {
          reviewed.add(t.Quote__c);
        }
      }

      List<TALEXO_Quote__c> quotes = [
        SELECT Id, Name, LastModifiedDate
        FROM TALEXO_Quote__c
        WHERE Opportunity__r.AccountId = :accountId AND Status__c = 'Accepted'
        ORDER BY LastModifiedDate DESC
        LIMIT 10
      ];

      List<EligibleQuoteWrapper> result = new List<EligibleQuoteWrapper>();
      for (TALEXO_Quote__c q : quotes) {
        if (!reviewed.contains(q.Id)) {
          EligibleQuoteWrapper w = new EligibleQuoteWrapper();
          w.quoteId = q.Id;
          w.quoteName = q.Name;
          w.acceptedDate = q.LastModifiedDate.format('dd MMM yyyy');
          result.add(w);
        }
      }
      return result;
    } catch (Exception ex) {
      throw new AuraHandledException(
        'Erreur chargement des devis éligibles : ' + ex.getMessage()
      );
    }
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private static Id resolveContactId() {
    try {
      User u = [
        SELECT ContactId
        FROM User
        WHERE Id = :UserInfo.getUserId()
        LIMIT 1
      ];
      return u.ContactId;
    } catch (Exception ex) {
      return null;
    }
  }

  private static Id resolveAccountId(Id contactId) {
    if (contactId == null)
      return null;
    try {
      Contact c = [SELECT AccountId FROM Contact WHERE Id = :contactId LIMIT 1];
      return c.AccountId;
    } catch (Exception ex) {
      return null;
    }
  }

  private static List<TestimonialWrapper> toWrappers(
    List<Testimonial__c> records
  ) {
    List<TestimonialWrapper> result = new List<TestimonialWrapper>();
    for (Testimonial__c r : records) {
      TestimonialWrapper w = new TestimonialWrapper();
      w.testimonialId = r.Id;
      w.customerName = r.Customer_Name__c != null ? r.Customer_Name__c : '';
      w.companyName = r.Company_Name__c != null ? r.Company_Name__c : '';
      w.role = r.Role_Title__c != null ? r.Role_Title__c : '';
      w.message = r.Message__c != null ? r.Message__c : '';
      w.rating = r.Rating__c != null ? Integer.valueOf(r.Rating__c) : 5;
      w.status = r.Status__c != null ? r.Status__c : 'Pending';
      w.avatarColor = r.Avatar_Color__c != null ? r.Avatar_Color__c : 'emerald';
      w.createdDate = r.CreatedDate != null
        ? r.CreatedDate.format('dd MMM yyyy')
        : '';

      // Build initials from full name
      String[] parts = w.customerName.trim().split(' +');
      String initials = '';
      if (parts.size() >= 2) {
        initials =
          parts[0].substring(0, 1).toUpperCase() +
          parts[parts.size() - 1].substring(0, 1).toUpperCase();
      } else if (parts.size() == 1 && parts[0].length() > 0) {
        initials = parts[0]
          .substring(0, Math.min(2, parts[0].length()))
          .toUpperCase();
      }
      w.initials = initials;
      result.add(w);
    }
    return result;
  }
}
