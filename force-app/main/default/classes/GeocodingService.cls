public class GeocodingService {
  public class GeoCoords {
    public Decimal lat;
    public Decimal lng;
  }

  // Calls Nominatim to turn GPS coordinates into a short street label.
  // zoom=18 = house-number level; returns the most specific road name available.
  public static String reverseGeocode(Decimal lat, Decimal lng) {
    if (lat == null || lng == null)
      return null;
    String url =
      'https://nominatim.openstreetmap.org/reverse?lat=' +
      lat.setScale(6) +
      '&lon=' +
      lng.setScale(6) +
      '&format=json&addressdetails=1&zoom=18';

    HttpRequest req = new HttpRequest();
    req.setEndpoint(url);
    req.setMethod('GET');
    req.setHeader('User-Agent', 'NexusCommerce/1.0');
    req.setTimeout(8000);

    HttpResponse res = new Http().send(req);
    if (res.getStatusCode() != 200)
      return null;

    try {
      Map<String, Object> result = (Map<String, Object>) JSON.deserializeUntyped(
        res.getBody()
      );
      Map<String, Object> addr = (Map<String, Object>) result.get('address');

      // display_name first segment is always the most specific label Nominatim has
      String display = (String) result.get('display_name');
      String firstSeg = display != null ? display.split(',')[0].trim() : null;

      if (addr != null) {
        // Prefer the narrowest named road present (path/pedestrian/alley rank first)
        String road = null;
        for (
          String key : new List<String>{
            'path',
            'pedestrian',
            'footway',
            'service',
            'alley',
            'residential',
            'road',
            'street'
          }
        ) {
          if (addr.containsKey(key)) {
            road = (String) addr.get(key);
            break;
          }
        }
        // If display_name first segment matches a road variant, it's more precise
        if (firstSeg != null && road != null && firstSeg != road) {
          // Take whichever is longer — longer name usually more specific
          road = firstSeg.length() >= road.length() ? firstSeg : road;
        } else if (road == null && firstSeg != null) {
          road = firstSeg;
        }

        if (road != null) {
          // Append neighbourhood / suburb for context
          String area = null;
          for (
            String key : new List<String>{
              'neighbourhood',
              'suburb',
              'city_district',
              'quarter'
            }
          ) {
            if (addr.containsKey(key)) {
              area = (String) addr.get(key);
              break;
            }
          }
          return area != null ? road + ', ' + area : road;
        }
      }

      return firstSeg;
    } catch (Exception e) {
      return null;
    }
  }

  // Calls Nominatim (OpenStreetMap) to turn a free-text address into lat/lng.
  public static GeoCoords geocodeAddress(String address) {
    if (String.isBlank(address))
      return null;

    String url =
      'https://nominatim.openstreetmap.org/search?q=' +
      EncodingUtil.urlEncode(address, 'UTF-8') +
      '&format=json&limit=1';

    HttpRequest req = new HttpRequest();
    req.setEndpoint(url);
    req.setMethod('GET');
    req.setHeader('User-Agent', 'NexusCommerce/1.0');
    req.setTimeout(10000);

    HttpResponse res = new Http().send(req);
    if (res.getStatusCode() != 200)
      return null;

    List<Object> results = (List<Object>) JSON.deserializeUntyped(
      res.getBody()
    );
    if (results.isEmpty())
      return null;

    Map<String, Object> first = (Map<String, Object>) results[0];
    try {
      GeoCoords c = new GeoCoords();
      c.lat = Decimal.valueOf(String.valueOf(first.get('lat')));
      c.lng = Decimal.valueOf(String.valueOf(first.get('lon')));
      return c;
    } catch (Exception e) {
      return null;
    }
  }
}
