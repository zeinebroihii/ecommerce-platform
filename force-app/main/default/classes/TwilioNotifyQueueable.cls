// Queues a WhatsApp notification so Twilio callout runs after DML commits.
public class TwilioNotifyQueueable implements Queueable, Database.AllowsCallouts {
  private String toNumber;
  private String message;

  public TwilioNotifyQueueable(String toNumber, String message) {
    this.toNumber = toNumber;
    this.message = message;
  }

  public void execute(QueueableContext ctx) {
    try {
      TwilioService.sendWhatsApp(toNumber, message);
    } catch (Exception e) {
      System.debug('[TwilioNotifyQueueable] ' + e.getMessage());
    }
  }
}
