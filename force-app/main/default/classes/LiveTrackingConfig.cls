public class LiveTrackingConfig {
  // ── Fill these in before demo ────────────────────────────────────────────
  public static final String WEBHOOK_SECRET = 'nexus-track-2026';
  public static final String TWILIO_SID = ''; // Set via Custom Label: TwilioSID
  public static final String TWILIO_AUTH_TOKEN = ''; // Set via Custom Label: TwilioAuthToken
  // Twilio WhatsApp sandbox number (or your approved sender)
  public static final String TWILIO_FROM = '+14155238886';
  // Your Experience Cloud site base URL (no trailing slash)
  public static final String SITE_BASE_URL = 'https://orgfarm-56b3b63a30-dev-ed.develop.my.site.com/ss/s';
  // Traccar GPS server (used by Salesforce-side poller)
  public static final String TRACCAR_URL = 'https://traccar-df1i.onrender.com';
  public static final String TRACCAR_EMAIL = 'zeineb.roihi@esprit.tn';
  public static final String TRACCAR_PASSWORD = 'admin';
}
