# Changelog

## v3.4.2 — 2026-10-04

- Ask before downloading restaurant/product data on first use and whenever the published data revision changes. Remember acceptance or rejection per regional site and data revision.
- Leave restaurant and product lists empty when downloading is rejected. JSON file/folder import remains available, with an explicit action to reconsider downloading.
- Check updates through the small static datasets.json manifest instead of GitHub directory API listings. The dialog explains that this small update check still uses the network.
- Cache accepted JSON summaries, menus and product search chunks on the device. Reopen unchanged cached data without large network requests; remove older regional data-cache entries after a successful update. In-memory product data can still be released independently.
- Add revision, collection time and initial summary size to generated manifests. Content changes produce a new revision even if the folder/date stays the same.

Validation: no large data requests before acceptance or after rejection; rejection survives reload; local import after rejection; same-version cache reuse; new-version acceptance and rejection; cached JSON recovery offline; both regional sites and stable/content-sensitive builder revisions. Browser cache availability depends on device storage and browser settings.

## v3.4.1 — 2026-10-04

- Keep JSON file and folder import available offline, including when the remote catalog fails before any data is loaded. Show a clear local-import recovery message instead of “Failed to fetch”.
- Keep the local import buttons visible below the scrolling region list. Cancel pending remote requests when local files are selected, and prevent late responses from overwriting the local selection.
- Preserve offline reload of previously selected local files through IndexedDB.
- Replace the unqualified `ty://` shopping-app route on Android with a user-activated `intent://` link explicitly targeting `com.trendyol.go` on its verified `tgo.gl` domain. Keep the rounded Uber Eats logo.
- Use an official `https://tgo.gl/...` restaurant link when present in `info.appLink`, `info.shareUrl` or `info.commentDeeplink`. Without such a link, open the Go application's entry point rather than inventing a restaurant route. Desktop browsers use the restaurant's web page; an unresolved Android intent also falls back to that page.

Validation: fully offline startup, both actual file pickers, folder import, persisted offline reload, network-error recovery, local import during a pending remote request, Android package/domain allowlist and desktop fallback. Native application opening and restaurant routing still require a phone with the Go app installed.

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
