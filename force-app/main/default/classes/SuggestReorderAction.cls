public without sharing class SuggestReorderAction {
  public class Input {
    @InvocableVariable(
      required=true
      description='Product name or partial name to calculate reorder for.'
    )
    public String productName;
    @InvocableVariable(
      description='Set to true to create a reorder Task assigned to procurement. Default is false — suggestion only.'
    )
    public Boolean createReorder;
    @InvocableVariable(
      description='Number of days of coverage to plan for. Default is 60 days.'
    )
    public Integer coverDays;
  }

  public class Output {
    @InvocableVariable(
      description='Full reorder recommendation text with quantity, reasoning, and action taken.'
    )
    public String recommendation;
    @InvocableVariable(description='Suggested reorder quantity in units.')
    public Integer suggestedQuantity;
    @InvocableVariable(
      description='Whether a reorder Task was created in Salesforce.'
    )
    public Boolean reorderCreated;
    @InvocableVariable(
      description='ID of the created Task record, if applicable.'
    )
    public String taskId;
  }

  @InvocableMethod(
    label='Suggest And Create Reorder'
    description='Calculates the recommended reorder quantity for a product based on sales velocity, current stock, open quote commitments, and desired coverage days. Optionally creates a procurement Task in Salesforce. Use when the user asks how much to reorder, what the suggested reorder quantity is, or wants to create a reorder request for a product.'
  )
  public static List<Output> suggestReorder(List<Input> inputs) {
    Input inp = inputs[0];
    Integer cover = (inp.coverDays != null &&
      inp.coverDays > 0)
      ? inp.coverDays
      : 60;
    Boolean doCreate = inp.createReorder == true;

    List<Product2> products = [
      SELECT Id, Name
      FROM Product2
      WHERE Name LIKE :('%' + inp.productName + '%') AND IsActive = TRUE
      LIMIT 1
    ];

    Output out = new Output();
    out.reorderCreated = false;

    if (products.isEmpty()) {
      out.suggestedQuantity = 0;
      out.recommendation =
        'Product "' +
        inp.productName +
        '" not found. Please verify the product name.';
      return new List<Output>{ out };
    }

    Id productId = products[0].Id;
    String prodName = products[0].Name;

    List<Stock__c> stocks = [
      SELECT
        Quantity_Available__c,
        Daily_Velocity__c,
        Days_Remaining__c,
        Risk_Level__c,
        Reorder_Threshold__c
      FROM Stock__c
      WHERE Product__c = :productId
      LIMIT 1
    ];

    if (stocks.isEmpty()) {
      out.suggestedQuantity = 0;
      out.recommendation = 'No stock record found for ' + prodName + '.';
      return new List<Output>{ out };
    }

    Stock__c s = stocks[0];
    Decimal stock = s.Quantity_Available__c ?? 0;
    Decimal velocity = s.Daily_Velocity__c ?? 0;
    Decimal threshold = s.Reorder_Threshold__c ?? 10;
    String risk = s.Risk_Level__c ?? 'Healthy';

    // Committed units from open quotes
    AggregateResult[] ar = [
      SELECT SUM(Quantity__c) qty, COUNT_DISTINCT(Quote__c) cnt
      FROM NexusQuoteLineItem__c
      WHERE
        Product__c = :productId
        AND Quote__r.Status__c NOT IN (
          'Accepted',
          'Rejected',
          'Signed',
          'Expired'
        )
    ];
    Decimal committed = ar.isEmpty() ? 0 : ((Decimal) (ar[0].get('qty')) ?? 0);
    Integer quoteCount = ar.isEmpty()
      ? 0
      : Integer.valueOf((Decimal) (ar[0].get('cnt')) ?? 0);
    Decimal effective = Math.max(0, stock - committed);

    // Sold in last 30 days
    Decimal sold30 = velocity * 30;

    // Suggested quantity: cover X days of velocity + buffer for committed quotes
    Decimal velocityCover = velocity * cover;
    Decimal suggested = Math.max(
        Math.max(velocityCover, sold30 * 1.5),
        threshold * 3
      )
      .setScale(0);

    // How many days does current effective stock cover?
    Integer effectiveDays = velocity > 0
      ? Integer.valueOf(Math.floor(effective / velocity))
      : 999;

    String priorityNote = risk == 'Critical'
      ? ' — URGENT, order immediately'
      : risk == 'At Risk'
          ? ' — order within 3 days'
          : committed > stock ? ' — open quotes exceed stock, order now' : '';

    String quoteNote = quoteCount > 0
      ? '\n• ' +
        quoteCount +
        ' open quote(s) committing ' +
        Integer.valueOf(committed) +
        ' units — effective stock only ' +
        Integer.valueOf(effective) +
        ' units'
      : '';

    out.suggestedQuantity = Integer.valueOf(suggested);
    out.recommendation =
      'REORDER SUGGESTION — ' +
      prodName +
      '\n' +
      '─────────────────────────────────\n' +
      'Current stock    : ' +
      Integer.valueOf(stock) +
      ' units (' +
      risk +
      ')' +
      quoteNote +
      '\n' +
      'Daily velocity   : ' +
      velocity.setScale(2) +
      ' units/day\n' +
      'Effective runway : ' +
      (effectiveDays >= 999 ? 'no sales data' : effectiveDays + ' days') +
      '\n' +
      'Coverage target  : ' +
      cover +
      ' days\n' +
      '─────────────────────────────────\n' +
      'Suggested reorder: ' +
      Integer.valueOf(suggested) +
      ' units' +
      priorityNote;

    if (!doCreate) {
      out.recommendation += '\n\nTo create a reorder request, confirm and I will log it for procurement.';
      return new List<Output>{ out };
    }

    // Create procurement Task
    List<User> admins = [
      SELECT Id
      FROM User
      WHERE
        (Profile.Name = 'System Administrator'
        OR Profile.Name = 'Administrateur système')
        AND IsActive = TRUE
      LIMIT 1
    ];

    String priority = (risk == 'Critical' ||
      committed > stock)
      ? 'High'
      : 'Normal';

    Task t = new Task(
      Subject = 'Reorder Request — ' + prodName,
      Description = out.recommendation,
      Status = 'Open',
      Priority = priority,
      ActivityDate = Date.today().addDays(risk == 'Critical' ? 1 : 3),
      OwnerId = admins.isEmpty() ? UserInfo.getUserId() : admins[0].Id
    );
    insert t;

    out.reorderCreated = true;
    out.taskId = t.Id;
    out.recommendation +=
      '\n\n✅ Reorder request created and assigned to procurement.' +
      '\nTask ID: ' +
      t.Id +
      '\nPriority: ' +
      priority +
      '\nDue: ' +
      (risk == 'Critical' ? 'Tomorrow' : 'Within 3 days');

    return new List<Output>{ out };
  }
}
