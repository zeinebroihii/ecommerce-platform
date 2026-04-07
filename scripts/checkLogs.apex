// Get recent debug logs containing DvelopSign entries
List<ApexLog> logs = [
    SELECT Id, LogLength, LastModifiedDate, Operation, Status
    FROM ApexLog
    ORDER BY LastModifiedDate DESC
    LIMIT 10
];
for (ApexLog l : logs) {
    System.debug('LOG: ' + l.Id + ' | ' + l.Operation + ' | ' + l.Status + ' | ' + l.LastModifiedDate + ' | size:' + l.LogLength);
}
