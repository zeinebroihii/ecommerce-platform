public class SlackNotificationService {

  @future(callout=true)
  public static void sendEscalationAlert(
    String quoteId,
    String quoteName,
    String accountName,
    Decimal grandTotal,
    Decimal proposedPrice,
    String reqTerms,
    String comboAText,
    String comboBText
  ) {
    NexusSlackSettings__c cfg = NexusSlackSettings__c.getInstance();
    if (cfg == null || String.isBlank(cfg.EscalationWebhookUrl__c)) return;

    String quoteBuilderUrl = 'https://orgfarm-56b3b63a30-dev-ed.develop.lightning.force.com/lightning/n/NexusQuoteBuilder';

    // Build Slack Block Kit message
    List<Object> blocks = new List<Object>{
      new Map<String, Object>{
        'type' => 'header',
        'text' => new Map<String, Object>{
          'type' => 'plain_text',
          'text' => ':rotating_light: Escalation: ' + quoteName
        }
      },
      new Map<String, Object>{
        'type' => 'section',
        'fields' => new List<Object>{
          new Map<String, Object>{ 'type' => 'mrkdwn', 'text' => '*Account:*\n' + accountName },
          new Map<String, Object>{ 'type' => 'mrkdwn', 'text' => '*Quote Total:*\n' + grandTotal.setScale(2) + ' €' },
          new Map<String, Object>{ 'type' => 'mrkdwn', 'text' => '*Customer Offer:*\n' + proposedPrice.setScale(2) + ' €' },
          new Map<String, Object>{ 'type' => 'mrkdwn', 'text' => '*Terms Requested:*\n' + reqTerms }
        }
      },
      new Map<String, Object>{
        'type' => 'section',
        'text' => new Map<String, Object>{ 'type' => 'mrkdwn', 'text' => '*:a: Option A:* ' + comboAText }
      },
      new Map<String, Object>{
        'type' => 'section',
        'text' => new Map<String, Object>{
          'type' => 'mrkdwn',
          'text' => '*:b: Option B (AI Recommended):* ' + comboBText
        }
      },
      new Map<String, Object>{ 'type' => 'divider' },
      new Map<String, Object>{
        'type' => 'actions',
        'elements' => new List<Object>{
          new Map<String, Object>{
            'type' => 'button',
            'text' => new Map<String, Object>{ 'type' => 'plain_text', 'text' => 'Approve Recommended' },
            'style' => 'primary',
            'action_id' => 'approve_recommended',
            'value' => quoteId,
            'confirm' => new Map<String, Object>{
              'title' => new Map<String, Object>{ 'type' => 'plain_text', 'text' => 'Apply Option B?' },
              'text' => new Map<String, Object>{ 'type' => 'mrkdwn', 'text' => 'This will apply the AI-recommended terms and notify the customer immediately.' },
              'confirm' => new Map<String, Object>{ 'type' => 'plain_text', 'text' => 'Yes, approve' },
              'deny' => new Map<String, Object>{ 'type' => 'plain_text', 'text' => 'Cancel' }
            }
          },
          new Map<String, Object>{
            'type' => 'button',
            'text' => new Map<String, Object>{ 'type' => 'plain_text', 'text' => 'View in Salesforce' },
            'url' => quoteBuilderUrl,
            'action_id' => 'view_record'
          },
          new Map<String, Object>{
            'type' => 'button',
            'text' => new Map<String, Object>{ 'type' => 'plain_text', 'text' => 'Customize Terms' },
            'url' => quoteBuilderUrl,
            'action_id' => 'customize_terms'
          }
        }
      }
    };

    String body = JSON.serialize(new Map<String, Object>{ 'blocks' => blocks });

    HttpRequest req = new HttpRequest();
    req.setEndpoint(cfg.EscalationWebhookUrl__c);
    req.setMethod('POST');
    req.setHeader('Content-Type', 'application/json');
    req.setBody(body);
    req.setTimeout(10000);

    try {
      new Http().send(req);
    } catch (Exception ex) {
      System.debug(LoggingLevel.ERROR, 'SlackNotificationService.sendEscalationAlert failed: ' + ex.getMessage());
    }
  }
}
