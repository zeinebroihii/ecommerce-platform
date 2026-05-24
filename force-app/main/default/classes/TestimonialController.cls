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

  // ── Read: public landing page — combined feed ─────────────────────────────

  /**
   * Returns up to 9 items for the "Trusted by Global Leaders" carousel,
   * mixing approved Testimonial__c records and 5-star ProductReview__c records,
   * sorted by most recent first.
   */
  @AuraEnabled(cacheable=true)
  public static List<TestimonialWrapper> getCombinedTestimonials() {
    try {
      // 1. Fetch approved testimonials (up to 9)
      List<Testimonial__c> tRecords = [
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

      // 2. Fetch verified, high-rated product reviews (rating >= 4, up to 9)
      List<ProductReview__c> pRecords = [
        SELECT
          Id,
          Customer_Name__c,
          Body__c,
          Title__c,
          Rating__c,
          VerifiedPurchase__c,
          Avatar_Color__c,
          Product__r.Name,
          CreatedDate
        FROM ProductReview__c
        WHERE Rating__c >= 4 AND VerifiedPurchase__c = TRUE
        ORDER BY CreatedDate DESC
        LIMIT 9
      ];

      // 3. Merge into a sortable list: (CreatedDate ms, wrapper)
      List<WrapperWithTs> combined = new List<WrapperWithTs>();

      for (Testimonial__c t : tRecords) {
        TestimonialWrapper w = new TestimonialWrapper();
        w.testimonialId = t.Id;
        w.customerName = t.Customer_Name__c != null ? t.Customer_Name__c : '';
        w.companyName = t.Company_Name__c != null ? t.Company_Name__c : '';
        String roleStr = t.Role_Title__c != null ? t.Role_Title__c : '';
        if (String.isNotBlank(t.Company_Name__c))
          roleStr += ', ' + t.Company_Name__c;
        w.role = roleStr;
        w.message = t.Message__c != null ? t.Message__c : '';
        w.rating = t.Rating__c != null ? Integer.valueOf(t.Rating__c) : 5;
        w.status = 'Approved';
        w.avatarColor = t.Avatar_Color__c != null
          ? t.Avatar_Color__c
          : 'emerald';
        w.initials = buildInitials(w.customerName);
        w.createdDate = t.CreatedDate != null
          ? t.CreatedDate.format('dd MMM yyyy')
          : '';
        combined.add(new WrapperWithTs(t.CreatedDate, w));
      }

      for (ProductReview__c r : pRecords) {
        TestimonialWrapper w = new TestimonialWrapper();
        w.testimonialId = r.Id;
        w.customerName = r.Customer_Name__c != null
          ? r.Customer_Name__c
          : 'Customer';
        w.companyName = '';
        // Role shows product name + verified badge label
        String productName = (r.Product__r != null &&
          r.Product__r.Name != null)
          ? r.Product__r.Name
          : 'Nexus Product';
        w.role = 'Verified Purchase — ' + productName;
        w.message = r.Body__c != null ? r.Body__c : '';
        w.rating = r.Rating__c != null ? Integer.valueOf(r.Rating__c) : 5;
        w.status = 'Approved';
        w.avatarColor = r.Avatar_Color__c != null
          ? r.Avatar_Color__c
          : 'indigo';
        w.initials = buildInitials(w.customerName);
        w.createdDate = r.CreatedDate != null
          ? r.CreatedDate.format('dd MMM yyyy')
          : '';
        combined.add(new WrapperWithTs(r.CreatedDate, w));
      }

      // 4. Sort by date desc, return top 9
      combined.sort();
      List<TestimonialWrapper> result = new List<TestimonialWrapper>();
      for (Integer i = 0; i < Math.min(9, combined.size()); i++) {
        result.add(combined[i].wrapper);
      }
      return result;
    } catch (Exception ex) {
      throw new AuraHandledException(
        'Erreur chargement témoignages combinés : ' + ex.getMessage()
      );
    }
  }

  /** Sortable container used only inside getCombinedTestimonials */
  private class WrapperWithTs implements Comparable {
    public Datetime ts;
    public TestimonialWrapper wrapper;
    public WrapperWithTs(Datetime dt, TestimonialWrapper w) {
      this.ts = dt != null ? dt : Datetime.now();
      this.wrapper = w;
    }
    public Integer compareTo(Object other) {
      WrapperWithTs o = (WrapperWithTs) other;
      if (this.ts > o.ts)
        return -1;
      if (this.ts < o.ts)
        return 1;
      return 0;
    }
  }

  private static String buildInitials(String name) {
    if (String.isBlank(name))
      return '?';
    String[] parts = name.trim().split(' +');
    if (parts.size() >= 2) {
      return (parts[0].substring(0, 1) +
        parts[parts.size() - 1].substring(0, 1))
        .toUpperCase();
    }
    return parts[0].substring(0, Math.min(2, parts[0].length())).toUpperCase();
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
