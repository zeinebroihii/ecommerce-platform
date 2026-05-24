public without sharing class EscrowApprovalController {
  public class ApprovalRequest {
    @InvocableVariable(label='Order Number' required=true)
    public String orderNumber;
    @InvocableVariable(
      label='Case ID (optional — posts approval comment on the case)'
    )
    public String caseId;
  }

  public class ApprovalResult {
    @InvocableVariable(label='Success')
    public Boolean success;
    @InvocableVariable(label='Message')
    public String message;
  }

  @InvocableMethod(
    label='Nexus: Approve Blocked Escrow'
    description='Unblocks a HIGH RISK escrow after senior review. Use when asked to approve, unblock, or authorize a blocked escrow order before releasing or refunding.'
  )
  public static List<ApprovalResult> approveHighRiskEscrow(
    List<ApprovalRequest> requests
  ) {
    List<ApprovalResult> results = new List<ApprovalResult>();
    for (ApprovalRequest req : requests) {
      ApprovalResult res = new ApprovalResult();
      try {
        List<Order> orders = [
          SELECT Id, OrderNumber, EscrowStatus__c
          FROM Order
          WHERE OrderNumber = :req.orderNumber
          LIMIT 1
        ];
        if (orders.isEmpty()) {
          res.success = false;
          res.message = 'Order not found: ' + req.orderNumber;
          results.add(res);
          continue;
        }
        Order o = orders[0];
        if (o.EscrowStatus__c != 'BLOCKED') {
          res.success = false;
          res.message =
            'Order ' +
            req.orderNumber +
            ' is not blocked (status: ' +
            o.EscrowStatus__c +
            '). No action needed.';
          results.add(res);
          continue;
        }

        // Unblock — revert to FROZEN so normal dispute resolution can proceed
        update new Order(Id = o.Id, EscrowStatus__c = 'FROZEN');

        // Post internal approval note on the Case
        if (String.isNotBlank(req.caseId)) {
          try {
            insert new CaseComment(
              ParentId = req.caseId,
              CommentBody = 'APPROVED — Senior review complete.\nEscrow unblocked by ' +
                UserInfo.getName() +
                ' on ' +
                DateTime.now().format() +
                '.\nYou may now refund or release the payment.',
              IsPublished = false
            );
          } catch (Exception e) {
            System.debug(
              '[EscrowApproval] Case comment failed: ' + e.getMessage()
            );
          }
        }

        res.success = true;
        res.message =
          'Escrow for order #' +
          req.orderNumber +
          ' is now unblocked. You can refund or release the payment.';
      } catch (Exception e) {
        res.success = false;
        res.message = e.getMessage();
      }
      results.add(res);
    }
    return results;
  }
}
