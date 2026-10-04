# Changelog

## v3.4 — 2026-10-04

- Added JSON file and folder selection below the region picker, with local selections retained in IndexedDB.
- Close the mobile filter drawer by tapping outside it.
- Persist the user's home location across reloads and region changes; remove automatic location selection from dataset coordinates.
- Use clearer home-location button labels for starting, selecting and changing the location.
- Restore the original rounded Uber Eats SVG icon on the restaurant's source-app action. Use the dataset's native application link.
- Open the operating system's share sheet for restaurant and product links instead of automatically copying them. Include the selected region in shared links.
- Open product details on a short click in Products; focus the product in its restaurant menu on a long press. Cancel a hold when scrolling or moving the pointer.
- Preserve the existing desktop/mobile layout while loading small restaurant summaries first, restaurant menus on demand and product search data only when needed.
- Load search data in bounded shards, cache at most three restaurant menus and release product-search objects when leaving Products for Restaurants/Map.
- Hide “Go ile Teslimat” and “Yedikçe İndirim” badges in Restaurant Information.
- Restrict map markers, map results and initial map bounds to restaurants offering pickup.
- Archive the previous regional HTML files under `Versions/v3.3.3` and deploy the same v3.4 HTML to `Istanbul_AS` and `Istanbul_EU`.
- Configure GitHub Pages to publish generated data while retaining the large original regional archives in the repository.

Validation: region/local folder selection and reloads, native-share API calls, home persistence, mobile filter dismissal, product modal and long press, pickup-only map and product-memory release were tested in Edge. For IstanbulAS All, measured retained JavaScript heap decreased from approximately 484 MiB to 15 MiB on initial restaurant loading. With all 339,054 product records loaded, the new interface measured approximately 182 MiB; returning to Restaurants released the product index and measured approximately 14 MiB. This measures JavaScript heap, not total browser-process RAM. Native app opening must be verified on a device with the source application installed.
