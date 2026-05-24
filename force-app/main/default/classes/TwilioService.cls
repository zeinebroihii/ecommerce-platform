public class TwilioService {
  // Sends a WhatsApp message via Twilio REST API.
  // toNumber must include country code, e.g. +21600000000
  public static void sendWhatsApp(String toNumber, String message) {
    // Normalize: strip whitespace/dashes, ensure leading +
    toNumber = toNumber.replaceAll('[\\s\\-()]', '');
    if (!toNumber.startsWith('+'))
      toNumber = '+' + toNumber;

    String sid = LiveTrackingConfig.TWILIO_SID;
    String token = LiveTrackingConfig.TWILIO_AUTH_TOKEN;
    String fromNum = LiveTrackingConfig.TWILIO_FROM;

    String url =
      'https://api.twilio.com/2010-04-01/Accounts/' +
      sid +
      '/Messages.json';

    String auth =
      'Basic ' + EncodingUtil.base64Encode(Blob.valueOf(sid + ':' + token));

    String body =
      'From=' +
      EncodingUtil.urlEncode('whatsapp:' + fromNum, 'UTF-8') +
      '&To=' +
      EncodingUtil.urlEncode('whatsapp:' + toNumber, 'UTF-8') +
      '&Body=' +
      EncodingUtil.urlEncode(message, 'UTF-8');

    HttpRequest req = new HttpRequest();
    req.setEndpoint(url);
    req.setMethod('POST');
    req.setHeader('Authorization', auth);
    req.setHeader('Content-Type', 'application/x-www-form-urlencoded');
    req.setBody(body);
    req.setTimeout(15000);

    HttpResponse res = new Http().send(req);
    if (res.getStatusCode() != 200 && res.getStatusCode() != 201) {
      throw new CalloutException(
        'Twilio error ' + res.getStatusCode() + ': ' + res.getBody()
      );
    }
  }
}
