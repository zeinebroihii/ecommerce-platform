public without sharing class ProductReviewController {

    // ── Wrappers ──────────────────────────────────────────────────────────────

    public class ReviewWrapper {
        @AuraEnabled public Id      reviewId;
        @AuraEnabled public String  customerName;
        @AuraEnabled public String  reviewTitle;
        @AuraEnabled public String  reviewBody;
        @AuraEnabled public Integer rating;
        @AuraEnabled public Boolean verifiedPurchase;
        @AuraEnabled public String  avatarColor;
        @AuraEnabled public String  initials;
        @AuraEnabled public String  createdDate;
        @AuraEnabled public List<StarItem> stars;
    }

    public class StarItem {
        @AuraEnabled public Integer val;
        @AuraEnabled public String  cls;
    }

    public class ReviewStats {
        @AuraEnabled public Decimal averageRating;
        @AuraEnabled public String  formattedRating;
        @AuraEnabled public Integer totalCount;
        @AuraEnabled public Integer verifiedCount;
        @AuraEnabled public Integer verifiedPercent;
        @AuraEnabled public List<StarItem> avgStars;
    }

    public class ReviewPageResult {
        @AuraEnabled public List<ReviewWrapper> reviews;
        @AuraEnabled public ReviewStats         stats;
    }

    public class EligibilityResult {
        @AuraEnabled public Boolean canReview;
        @AuraEnabled public Boolean alreadyReviewed;
    }

    // ── Read: all reviews for a product ──────────────────────────────────────

    @AuraEnabled(cacheable=true)
    public static ReviewPageResult getProductReviews(Id productId) {
        try {
            List<ProductReview__c> records = [
                SELECT
                    Id,
                    Customer_Name__c,
                    Title__c,
                    Body__c,
                    Rating__c,
                    VerifiedPurchase__c,
                    Avatar_Color__c,
                    CreatedDate
                FROM ProductReview__c
                WHERE Product__c = :productId
                ORDER BY CreatedDate DESC
                LIMIT 50
            ];

            List<ReviewWrapper> wrappers = new List<ReviewWrapper>();
            Decimal ratingSum   = 0;
            Integer verifiedCnt = 0;

            for (ProductReview__c r : records) {
                ReviewWrapper w     = new ReviewWrapper();
                w.reviewId          = r.Id;
                w.customerName      = r.Customer_Name__c != null ? r.Customer_Name__c : 'Customer';
                w.reviewTitle       = r.Title__c != null ? r.Title__c : '';
                w.reviewBody        = r.Body__c  != null ? r.Body__c  : '';
                w.rating            = r.Rating__c != null ? Integer.valueOf(r.Rating__c) : 5;
                w.verifiedPurchase  = r.VerifiedPurchase__c == true;
                w.avatarColor       = r.Avatar_Color__c != null ? r.Avatar_Color__c : 'indigo';
                w.createdDate       = r.CreatedDate != null
                    ? r.CreatedDate.format('MMM yyyy')
                    : '';
                w.initials          = buildInitials(w.customerName);
                w.stars             = buildStars(w.rating);
                ratingSum          += w.rating;
                if (w.verifiedPurchase) verifiedCnt++;
                wrappers.add(w);
            }

            ReviewStats stats    = new ReviewStats();
            stats.totalCount     = records.size();
            stats.verifiedCount  = verifiedCnt;
            stats.verifiedPercent = stats.totalCount > 0
                ? Integer.valueOf(Math.round((Decimal.valueOf(verifiedCnt) / stats.totalCount) * 100))
                : 0;
            stats.averageRating  = stats.totalCount > 0
                ? (ratingSum / stats.totalCount).setScale(1, RoundingMode.HALF_UP)
                : 0;
            stats.formattedRating = stats.totalCount > 0
                ? String.valueOf(stats.averageRating)
                : '—';
            stats.avgStars = buildStars(
                stats.totalCount > 0 ? Integer.valueOf(stats.averageRating.round()) : 0
            );

            ReviewPageResult result = new ReviewPageResult();
            result.reviews = wrappers;
            result.stats   = stats;
            return result;

        } catch (Exception ex) {
            throw new AuraHandledException(
                'Error loading reviews: ' + ex.getMessage()
            );
        }
    }

    // ── Eligibility check ─────────────────────────────────────────────────────

    /**
     * Returns whether the current portal user:
     *   canReview      — has at least one Order OR accepted Quote containing this product
     *   alreadyReviewed — has already submitted a review for this product
     */
    @AuraEnabled(cacheable=false)
    public static EligibilityResult checkPurchaseEligibility(Id productId) {
        EligibilityResult res = new EligibilityResult();
        res.canReview       = false;
        res.alreadyReviewed = false;

        // Resolve Contact + Account for the portal user
        Id contactId = resolveContactId();
        Id accountId = resolveAccountId(contactId);

        // Check: already reviewed?
        if (contactId != null) {
            try {
                List<ProductReview__c> existing = [
                    SELECT Id FROM ProductReview__c
                    WHERE Product__c = :productId AND Contact__c = :contactId
                    LIMIT 1
                ];
                if (!existing.isEmpty()) {
                    res.alreadyReviewed = true;
                }
            } catch (Exception ex) {
                System.debug('[ProductReview] duplicate check error: ' + ex.getMessage());
            }
        }

        if (accountId == null) return res;

        // Check 1: has an Order containing this product (any non-draft, non-cancelled status)
        try {
            List<OrderItem> orderItems = [
                SELECT Id FROM OrderItem
                WHERE Product2Id = :productId
                  AND Order.AccountId = :accountId
                  AND Order.Status NOT IN ('Draft', 'Cancelled')
                LIMIT 1
            ];
            if (!orderItems.isEmpty()) {
                res.canReview = true;
                return res;
            }
        } catch (Exception ex) {
            System.debug('[ProductReview] order check error: ' + ex.getMessage());
            throw new AuraHandledException('Order eligibility check failed: ' + ex.getMessage());
        }

        // Check 2: has an Accepted OR Signed (DocuSign) quote containing this product
        try {
            List<NexusQuoteLineItem__c> quoteItems = [
                SELECT Id FROM NexusQuoteLineItem__c
                WHERE Product__c = :productId
                  AND Quote__r.Opportunity__r.AccountId = :accountId
                  AND Quote__r.Status__c IN ('Accepted', 'Signed')
                LIMIT 1
            ];
            if (!quoteItems.isEmpty()) {
                res.canReview = true;
            }
        } catch (Exception ex) {
            System.debug('[ProductReview] quote check error: ' + ex.getMessage());
            throw new AuraHandledException('Quote eligibility check failed: ' + ex.getMessage());
        }

        return res;
    }

    // ── Submit ────────────────────────────────────────────────────────────────

    @AuraEnabled
    public static Id submitProductReview(
        Id      productId,
        Integer rating,
        String  title,
        String  body
    ) {
        try {
            if (rating == null || rating < 1 || rating > 5) {
                throw new AuraHandledException('Rating must be between 1 and 5.');
            }
            if (String.isBlank(body)) {
                throw new AuraHandledException('Review text is required.');
            }

            // Re-verify eligibility server-side
            EligibilityResult elig = checkPurchaseEligibility(productId);
            if (!elig.canReview) {
                throw new AuraHandledException(
                    'Only customers who purchased this product can write a review.'
                );
            }
            if (elig.alreadyReviewed) {
                throw new AuraHandledException(
                    'You have already reviewed this product.'
                );
            }

            // Resolve identity
            String customerName = UserInfo.getName();
            Id     contactId    = null;
            String avatarColor  = 'indigo';

            try {
                User u = [SELECT ContactId FROM User WHERE Id = :UserInfo.getUserId() LIMIT 1];
                contactId = u.ContactId;
                if (u.ContactId != null) {
                    Contact c = [SELECT Name FROM Contact WHERE Id = :u.ContactId LIMIT 1];
                    customerName = c.Name;
                }
            } catch (Exception ex) { /* keep UserInfo defaults */ }

            String[] colors  = new List<String>{ 'emerald', 'indigo', 'rose', 'amber' };
            Integer  colorIdx = Math.mod(Math.abs(customerName.hashCode()), 4);
            avatarColor = colors[colorIdx];

            // Check if the purchase was via order or quote (for VerifiedPurchase flag)
            Boolean verified = false;
            Id accountId = resolveAccountId(contactId);
            if (accountId != null) {
                List<OrderItem> oi = [
                    SELECT Id FROM OrderItem
                    WHERE Product2Id = :productId
                      AND Order.AccountId = :accountId
                      AND Order.Status NOT IN ('Draft', 'Cancelled')
                    LIMIT 1
                ];
                if (!oi.isEmpty()) verified = true;

                if (!verified) {
                    List<NexusQuoteLineItem__c> qi = [
                        SELECT Id FROM NexusQuoteLineItem__c
                        WHERE Product__c = :productId
                          AND Quote__r.Opportunity__r.AccountId = :accountId
                          AND Quote__r.Status__c IN ('Accepted', 'Signed')
                        LIMIT 1
                    ];
                    if (!qi.isEmpty()) verified = true;
                }
            }

            ProductReview__c rev = new ProductReview__c(
                Product__c         = productId,
                Contact__c         = contactId,
                Rating__c          = rating,
                Title__c           = String.isNotBlank(title) ? title : null,
                Body__c            = body,
                VerifiedPurchase__c = verified,
                Customer_Name__c   = customerName,
                Avatar_Color__c    = avatarColor
            );
            insert rev;
            return rev.Id;

        } catch (AuraHandledException ae) {
            throw ae;
        } catch (Exception ex) {
            throw new AuraHandledException('Submission error: ' + ex.getMessage());
        }
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private static Id resolveContactId() {
        try {
            User u = [SELECT ContactId FROM User WHERE Id = :UserInfo.getUserId() LIMIT 1];
            return u.ContactId;
        } catch (Exception ex) { return null; }
    }

    private static Id resolveAccountId(Id contactId) {
        if (contactId == null) return null;
        try {
            Contact c = [SELECT AccountId FROM Contact WHERE Id = :contactId LIMIT 1];
            return c.AccountId;
        } catch (Exception ex) { return null; }
    }

    private static String buildInitials(String name) {
        if (String.isBlank(name)) return '?';
        String[] parts = name.trim().split(' +');
        if (parts.size() >= 2) {
            return (parts[0].substring(0, 1) + parts[parts.size() - 1].substring(0, 1)).toUpperCase();
        }
        return parts[0].substring(0, Math.min(2, parts[0].length())).toUpperCase();
    }

    private static List<StarItem> buildStars(Integer rating) {
        List<StarItem> stars = new List<StarItem>();
        for (Integer i = 1; i <= 5; i++) {
            StarItem s = new StarItem();
            s.val = i;
            s.cls = i <= rating
                ? 'npdv-star npdv-star--sm npdv-star--on'
                : 'npdv-star npdv-star--sm npdv-star--off';
            stars.add(s);
        }
        return stars;
    }
}
