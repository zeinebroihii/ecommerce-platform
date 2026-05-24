public class OSRMService {
  // Returns ETA in minutes from origin to destination using free OSRM bicycle routing.
  // OSRM expects coordinates as (longitude,latitude) — not lat/lng!
  public static Integer getETA(
    Decimal fromLat,
    Decimal fromLng,
    Decimal toLat,
    Decimal toLng
  ) {
    String url =
      'https://router.project-osrm.org/route/v1/bike/' +
      fromLng.setScale(6) +
      ',' +
      fromLat.setScale(6) +
      ';' +
      toLng.setScale(6) +
      ',' +
      toLat.setScale(6) +
      '?overview=false';

    HttpRequest req = new HttpRequest();
    req.setEndpoint(url);
    req.setMethod('GET');
    req.setTimeout(10000);

    HttpResponse res = new Http().send(req);
    if (res.getStatusCode() != 200) {
      System.debug(
        '[OSRMService] HTTP ' + res.getStatusCode() + ': ' + res.getBody()
      );
      return null;
    }

    Map<String, Object> body = (Map<String, Object>) JSON.deserializeUntyped(
      res.getBody()
    );
    List<Object> routes = (List<Object>) body.get('routes');
    if (routes == null || routes.isEmpty())
      return null;

    Map<String, Object> route = (Map<String, Object>) routes[0];
    Object durationSecs = route.get('duration');
    if (durationSecs == null)
      return null;

    Decimal secs = Decimal.valueOf(String.valueOf(durationSecs));
    return (Integer) Math.max(1, Math.ceil(secs / 60));
  }
}
