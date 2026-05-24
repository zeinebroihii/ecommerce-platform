public without sharing class LeadScoringWriter {
  public class ScoreRequest {
    @InvocableVariable(label='Lead ID' required=true)
    public String leadId;
  }

  @InvocableMethod(
    label='Write AI Lead Score'
    description='Scores a lead using rule-based signals and writes AIScore__c + AIReason__c.'
  )
  public static void writeScore(List<ScoreRequest> requests) {
    if (requests == null || requests.isEmpty())
      return;

    String leadId = requests[0].leadId;

    Lead l = [
      SELECT
        Id,
        NumberOfEmployees,
        Intent__c,
        Industry,
        Website,
        Company,
        State,
        Country
      FROM Lead
      WHERE Id = :leadId
      LIMIT 1
    ];

    Integer pts = 0;
    List<String> signals = new List<String>();

    // Intent (35 pts max)
    String intent = l.Intent__c;
    if (intent == 'Bulk Purchase') {
      pts += 35;
      signals.add('bulk purchase (+35)');
    } else if (intent == 'Partnership') {
      pts += 25;
      signals.add('partnership (+25)');
    } else if (intent == 'Product Demo') {
      pts += 15;
      signals.add('product demo (+15)');
    } else if (intent == 'Single Purchase') {
      pts += 10;
      signals.add('single purchase (+10)');
    }

    // Company size (25 pts max)
    Integer emp = l.NumberOfEmployees != null ? l.NumberOfEmployees : 0;
    if (emp >= 1000) {
      pts += 25;
      signals.add('1000+ employees (+25)');
    } else if (emp >= 200) {
      pts += 20;
      signals.add('200-999 employees (+20)');
    } else if (emp >= 51) {
      pts += 15;
      signals.add('51-199 employees (+15)');
    } else if (emp >= 11) {
      pts += 10;
      signals.add('11-50 employees (+10)');
    } else {
      pts += 5;
      signals.add('small team (+5)');
    }

    // Industry (15 pts max)
    String ind = l.Industry != null ? l.Industry.toLowerCase() : '';
    if (ind.contains('technolog') || ind.contains('financ')) {
      pts += 15;
      signals.add('priority sector (+15)');
    } else if (ind.contains('manufactur') || ind.contains('health')) {
      pts += 10;
      signals.add('secondary sector (+10)');
    } else if (String.isNotBlank(ind)) {
      pts += 5;
      signals.add('sector provided (+5)');
    }

    // Domain credibility (15 pts)
    String site = l.Website != null ? l.Website.toLowerCase() : '';
    Boolean personal =
      site.contains('gmail') ||
      site.contains('yahoo') ||
      site.contains('hotmail') ||
      site.contains('outlook');
    if (String.isNotBlank(site) && !personal) {
      pts += 15;
      signals.add('professional domain (+15)');
    }

    // Data completeness (10 pts)
    Boolean complete =
      String.isNotBlank(l.Company) &&
      String.isNotBlank(l.Industry) &&
      String.isNotBlank(l.Website) &&
      String.isNotBlank(l.Intent__c);
    if (complete) {
      pts += 10;
      signals.add('complete profile (+10)');
    }

    String label = pts >= 80
      ? 'High Intent. Conversion Recommended'
      : pts >= 60
          ? 'Moderate Intent. Needs Qualification'
          : 'Low Score. Monitor Carefully';

    l.AIScore__c = pts;
    l.AIReason__c = label + '. Signals: ' + String.join(signals, ', ') + '.';
    l.AdminDecision__c = 'Pending';
    update l;

    if (pts >= 80) {
      NotificationController.pushAdminBell(
        'Hot Lead: ' + l.Company + ' (score ' + pts + '/100)',
        label,
        l.Id
      );
    }
  }
}
