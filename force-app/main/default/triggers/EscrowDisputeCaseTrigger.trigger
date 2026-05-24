trigger EscrowDisputeCaseTrigger on Case(after insert) {
  List<Id> escrowCaseIds = new List<Id>();
  for (Case c : Trigger.new) {
    if (c.Subject != null && c.Subject.startsWith('Escrow Dispute')) {
      escrowCaseIds.add(c.Id);
    }
  }
  if (!escrowCaseIds.isEmpty()) {
    EscrowCaseInvestigator.investigate(escrowCaseIds);
  }
}
