/**
 * InvoiceService
 *
 * FIX: Removed Account.PersonEmail — not available in B2B (non-PersonAccount) orgs.
 *      Instead, we look up the primary Contact's Email for this Account.
 *      This is the correct pattern for standard Salesforce B2B accounts.
 */
public class InvoiceService {

    @InvocableMethod(label='Generate and Email Invoice')
    public static void generateInvoice(List<Id> orderIds) {
        for (Id orderId : orderIds) {
            generateInvoiceAsync(orderId);
        }
    }

    @future(callout=true)
    private static void generateInvoiceAsync(Id orderId) {
        try {
            // 1. Query the order (no PersonEmail — use Contact lookup below)
            Order ord = [
                SELECT Id, OrderNumber, AccountId,
                       Account.Name, TotalAmount
                FROM Order
                WHERE Id = :orderId
            ];

            // 2. Get email from the Account's primary Contact
            //    This is the correct B2B pattern (no PersonAccount needed)
            String customerEmail = null;
            List<Contact> contacts = [
                SELECT Email FROM Contact
                WHERE AccountId = :ord.AccountId
                AND Email != null
                LIMIT 1
            ];
            if (!contacts.isEmpty()) {
                customerEmail = contacts[0].Email;
            }

            // 3. Generate PDF blob from the InvoiceTemplate VF page
            Blob pdfBlob;
            if (Test.isRunningTest()) {
                pdfBlob = Blob.valueOf('PDF_PLACEHOLDER');
            } else {
                PageReference pdfPage = new PageReference('/apex/InvoiceTemplate?id=' + orderId);
                pdfBlob = pdfPage.getContentAsPDF();
            }

            String fileName = 'Invoice-' + ord.OrderNumber + '.pdf';

            // 4. Attach PDF to the Order record as a File
            ContentVersion cv         = new ContentVersion();
            cv.Title                  = 'Invoice-' + ord.OrderNumber;
            cv.PathOnClient           = fileName;
            cv.VersionData            = pdfBlob;
            cv.FirstPublishLocationId = orderId;
            insert cv;

            // 5. Email the PDF only if we have a customer email
            if (String.isNotBlank(customerEmail)) {
                sendInvoiceEmail(ord, customerEmail, pdfBlob, fileName);
            }

        } catch (Exception e) {
            System.debug('InvoiceService error for Order ' + orderId + ': ' + e.getMessage());
        }
    }

    private static void sendInvoiceEmail(Order ord, String customerEmail, Blob pdfBlob, String fileName) {
        Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();
        email.setToAddresses(new List<String>{ customerEmail });
        email.setSubject('Your Invoice for Order #' + ord.OrderNumber);
        email.setHtmlBody(
            '<h2>Thank you for your order!</h2>' +
            '<p>Please find your invoice attached for Order <strong>#' + ord.OrderNumber + '</strong>.</p>' +
            '<p>Order Total: <strong>£' + ord.TotalAmount.setScale(2) + '</strong></p>' +
            '<p>If you have any questions, visit our support portal.</p>' +
            '<br/><p>Kind regards,<br/>E-Commerce Store Team</p>'
        );

        Messaging.EmailFileAttachment att = new Messaging.EmailFileAttachment();
        att.setFileName(fileName);
        att.setBody(pdfBlob);
        att.setContentType('application/pdf');
        email.setFileAttachments(new List<Messaging.EmailFileAttachment>{ att });

        Messaging.sendEmail(new List<Messaging.SingleEmailMessage>{ email });
    }
}
