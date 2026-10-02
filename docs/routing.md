# Map, Routing, Pricing and Driver Assignment

This document explains the parts added in the second development phase:
the interactive map, the routing algorithm, the price calculation, and the
simple driver assignment. It is written to be presentable in a university
demo.

## 1. The map (Leaflet + OpenStreetMap)

- **Leaflet** is a small open-source JavaScript library for interactive maps.
  The library files are stored locally in `public/vendor/leaflet/` (served by
  Express like any static file) so no CDN is needed at demo time.
- **OpenStreetMap (OSM)** provides the map tiles (the actual street images).
  Tiles are loaded directly from `tile.openstreetmap.org`, which is free and
  needs no API key. Every map shows the required attribution
  "© OpenStreetMap contributors".
- The map is created in `public/js/map-utils.js` (`TaxiMap.createMap`), which
  is shared by all pages that display a map.

**Map elements used**

| Element    | Where                       | Purpose                                  |
|------------|-----------------------------|------------------------------------------|
| Marker     | origin / destination pins   | Show the two selected points             |
| DivIcon    | colored round pins          | Origin (green A), destination (red B), driver (dark taxi) |
| Polyline   | route line                  | Draw the shortest path returned by the server |
| Tile layer | background                  | Tehran street map                        |

The pins are drawn with CSS (`.map-pin` classes) instead of image files, so
origin, destination and driver markers are visually different without extra
assets.

**No paid API, no Google Maps, no external routing service.** The route is
computed by our own code on the server; the map only draws it.

## 2. Selecting origin and destination

On the "Request Taxi" page (`/passenger/rides/new`):

1. The passenger chooses a mode: **Select Origin** or **Select Destination**
   (the first map click sets the origin and then switches the mode to
   destination automatically).
2. Clicking the map places the corresponding marker; markers can also be
   dragged to adjust a point.
3. "Reset" clears both markers and the route.
4. "Calculate Route" sends the two coordinates to `POST /api/route`.

The selected coordinates are stored in four hidden form fields
(`originLat`, `originLng`, `destinationLat`, `destinationLng`) and end up in
the `rides` table when the form is submitted. The plain text fields
(origin / destination) still exist, so a ride can also be requested without
using the map (a driver then accepts it manually).

## 3. The simplified Tehran road graph

`src/data/tehranGraph.js` contains a deliberately small graph:

- **Node** – a place on the map (Azadi Square, Tajrish Square, Vanak, the
  airport, ...). Each node has an id, a name and real coordinates.
- **Edge** – a road between two nodes with an approximate distance in
  kilometers. Edges are undirected (a road works in both directions).

13 nodes and 20 edges, including a well-known chain:

```
Sadeghieh ---- Azadi ---- Mehrabad
    |            |
  Vanak      Enghelab ---- Valiasr ---- Ferdowsi ---- Haft-e Tir
    |            |                          |              |
 Tajrish     Rah Ahan ---- Darvazeh Shemiran ---- Imam Hossein
    |
 Resalat
```

The real distances are replaced by approximate values; the goal is to
demonstrate the algorithm, not to model every street of Tehran.

## 4. Dijkstra's shortest path algorithm

`src/services/routingService.js` implements Dijkstra directly:

1. Give every node the distance `Infinity`, except the start node (0).
2. Repeatedly pick the unvisited node with the smallest known distance.
3. For each neighbor, check whether going through the current node is
   shorter than the best known route; if yes, remember it (`previous` map).
4. Stop when the destination is reached (or nothing is reachable).
5. Walk the `previous` links backwards to build the path.

Because the graph is tiny, the "pick the smallest" step is a simple loop
instead of a priority queue. This keeps the code readable and easy to
explain while still being the real algorithm. The undirected edges are
stored as an adjacency list built once at startup.

## 5. Route calculation end to end

```
Passenger clicks "Calculate Route"
        │
        ▼
POST /api/route { originLat, originLng, destinationLat, destinationLng }
        │
        ▼
routingService.calculateRoute()
        │
        ├─ findNearestNode(origin)       (Haversine distance to each node)
        ├─ findNearestNode(destination)
        ├─ dijkstra(nearestOrigin, nearestDestination)
        └─ build polyline: origin -> graph nodes -> destination
        │
        ▼
pricingService.estimateRide(distanceKm)
        │
        ▼
JSON: { distanceKm, durationMin, price, path, nodes, usedFallback }
        │
        ▼
Browser draws the polyline on the Leaflet map and shows
"Distance: 17.8 km / Estimated time: 36 min / Estimated price: 228,000 تومان"
```

The total distance is the sum of three parts: walking distance from the
exact origin to its nearest graph node, the shortest path through the graph,
and the distance from the last graph node to the exact destination.

**Fallback:** when a selected point is further than 20 km from every graph
node (or the two snapped nodes are not connected), the service cannot use
the graph. Instead of failing, it returns the straight-line Haversine
distance and sets `usedFallback = true`; the page shows a friendly note.
Invalid or missing coordinates are rejected with a clear message.

## 6. Distance calculation (Haversine)

`src/utils/geo.js` implements the Haversine formula:

```
a = sin²(Δlat/2) + cos(lat1)·cos(lat2)·sin²(Δlng/2)
distance = 2 · R · asin(√a)          with R = 6371 km
```

It is used for three things: snapping coordinates to graph nodes, the
fallback distance, and the driver-to-passenger distance in the assignment.

## 7. Price calculation

All pricing values live in one place, `src/config.js`:

```
BASE_FARE    = 50,000 Toman
PRICE_PER_KM = 10,000 Toman
ROUND_TO     = 1,000 Toman
```

`src/services/pricingService.js` applies the formula:

```
price = BASE_FARE + distanceKm × PRICE_PER_KM
```

and rounds the result to the configured step. Example: 8.4 km →
50,000 + 84,000 = 134,000 Toman.

There is no surge pricing, no traffic multiplier, no discounts and no
payments – by design.

## 8. Estimated duration

```
duration = distanceKm / AVERAGE_SPEED_KMH        (converted to minutes)
```

`AVERAGE_SPEED_KMH = 30` is also configured in `src/config.js`. Example:
8.4 km at 30 km/h = 16.8 → 17 minutes. The result is at least 1 minute.
No real-time traffic is considered.

## 9. Simulated driver locations

Real GPS is explicitly out of scope. Instead, the `driver_locations` table
stores one fixed location per demo driver:

| Driver       | Area       | Coordinates          |
|--------------|------------|----------------------|
| Reza Driver  | Vanak      | 35.7575, 51.4100     |
| Sara Driver  | Tajrish    | 35.8040, 51.4340     |
| Amir Driver  | Azadi      | 35.6997, 51.3380     |
| Neda Driver  | Sadeghieh  | 35.7100, 51.3300     |

`GET /api/drivers` returns them for the map, where they appear as small
taxi markers (visual style different from the origin/destination pins). A
driver with an ACCEPTED or STARTED ride is marked as *busy*.

## 10. Nearest driver assignment

When a passenger requests a ride **with map coordinates**, the server:

1. loads all available drivers (active, has a location, no active ride),
2. computes the Haversine distance from the passenger origin to each of them,
3. picks the driver with the smallest distance,
4. creates the ride directly as `ACCEPTED` with that driver.

The assignment is visible immediately on the passenger's ride details page:
the driver marker appears on the map next to origin and destination, and the
status badge shows ACCEPTED. When no driver is available the ride stays
`REQUESTED` and any driver can still accept it manually – the manual
workflow from the first project phase is unchanged.

This is intentionally the simplest possible matching. There is no scoring,
no dispatching queue and no real-time updates; the ride details page uses
plain `fetch` polling every 4 seconds only to refresh the status badge.

## 11. API summary

| Method | Path             | Auth     | Purpose                                    |
|--------|------------------|----------|--------------------------------------------|
| POST   | /api/route       | any user | Dijkstra route + distance + price + time   |
| GET    | /api/drivers     | any user | Simulated driver locations for the map     |
| GET    | /api/rides/:id   | owner/driver | Single ride status (used for polling)  |
| GET    | /api/graph       | any user | The graph nodes and edges (for debugging)  |

All endpoints return JSON. Errors (for example invalid coordinates) are
returned as `{ "error": "..." }` with an appropriate HTTP status code.
