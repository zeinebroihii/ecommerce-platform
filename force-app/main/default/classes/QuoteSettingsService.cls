/**
 * QuoteSettingsService
 *
 * Reads quote configuration from QuoteSettings__mdt (the "Default" record).
 * Provides static fallbacks so quotes always work even if the CMT record
 * has not been deployed yet.
 *
 * Admin edits: Setup → Custom Metadata Types → Quote Settings → Default
 * No deployment required for value changes.
 */
public without sharing class QuoteSettingsService {

  // ── Wrapper returned to LWC ───────────────────────────────────────────────

  public class QuoteSettingsWrapper {
    @AuraEnabled public Integer defaultValidityDays;
    @AuraEnabled public String  defaultPaymentTerms;
    @AuraEnabled public Decimal defaultBulkDiscount;
    @AuraEnabled public String  generalTerms;
    @AuraEnabled public Integer signatureDeadlineDays;
  }

  // ── Static fallback values ────────────────────────────────────────────────

  private static final Integer DEFAULT_VALIDITY_DAYS      = 30;
  private static final String  DEFAULT_PAYMENT_TERMS      = 'Net 30';
  private static final Decimal DEFAULT_BULK_DISCOUNT      = 10;
  private static final Integer DEFAULT_SIGNATURE_DEADLINE = 14;
  private static final String  DEFAULT_TERMS =
    'This quote is valid for the period indicated above. '
    + 'Prices are exclusive of applicable taxes. '
    + 'Payment is due within the specified payment terms from the invoice date. '
    + 'Either party may terminate recurring services with 30 days written notice.';

  // ── Main entry ────────────────────────────────────────────────────────────

  @AuraEnabled(cacheable=true)
  public static QuoteSettingsWrapper getSettings() {
    QuoteSettingsWrapper w = new QuoteSettingsWrapper();

    // Read from CMT — safe even if record doesn't exist yet
    List<QuoteSettings__mdt> rows = [
      SELECT
        DefaultValidityDays__c,
        DefaultPaymentTerms__c,
        DefaultBulkDiscount__c,
        GeneralTermsAndConditions__c,
        SignatureDeadlineDays__c
      FROM QuoteSettings__mdt
      WHERE DeveloperName = 'Default'
      LIMIT 1
    ];

    if (!rows.isEmpty()) {
      QuoteSettings__mdt r = rows[0];
      w.defaultValidityDays = r.DefaultValidityDays__c != null
        ? Integer.valueOf(r.DefaultValidityDays__c) : DEFAULT_VALIDITY_DAYS;
      w.defaultPaymentTerms = String.isNotBlank(r.DefaultPaymentTerms__c)
        ? r.DefaultPaymentTerms__c : DEFAULT_PAYMENT_TERMS;
      w.defaultBulkDiscount = r.DefaultBulkDiscount__c != null
        ? r.DefaultBulkDiscount__c : DEFAULT_BULK_DISCOUNT;
      w.generalTerms = String.isNotBlank(r.GeneralTermsAndConditions__c)
        ? r.GeneralTermsAndConditions__c : DEFAULT_TERMS;
      w.signatureDeadlineDays = r.SignatureDeadlineDays__c != null
        ? Integer.valueOf(r.SignatureDeadlineDays__c) : DEFAULT_SIGNATURE_DEADLINE;
    } else {
      // CMT record not yet deployed — use static defaults
      w.defaultValidityDays    = DEFAULT_VALIDITY_DAYS;
      w.defaultPaymentTerms    = DEFAULT_PAYMENT_TERMS;
      w.defaultBulkDiscount    = DEFAULT_BULK_DISCOUNT;
      w.generalTerms           = DEFAULT_TERMS;
      w.signatureDeadlineDays  = DEFAULT_SIGNATURE_DEADLINE;
    }

    return w;
  }

  // ── Convenience accessors (used server-side by other Apex classes) ─────────

  public static Integer getValidityDays() {
    return getSettings().defaultValidityDays;
  }

  public static String getPaymentTerms() {
    return getSettings().defaultPaymentTerms;
  }

  public static Decimal getBulkDiscount() {
    return getSettings().defaultBulkDiscount;
  }
}
