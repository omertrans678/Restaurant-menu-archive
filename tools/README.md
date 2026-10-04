# Prepare web data

Run from the repository root after adding or updating a dated API data folder:

```powershell
python tools/build_web_data.py Istanbul_AS Istanbul_EU
```

The script selects the latest dated folder, leaves the original JSON files intact, and writes:

- `datasets.json`: static fallback for region discovery.
- `_texgo/<dated folder>/catalog.json`: regions, membership and generated-file paths.
- `restaurants.json`: restaurant information and menu counts without product payloads.
- `menus/<restaurant ID>.json`: menus fetched when Restaurant Information opens.
- `search/*.json`: smaller chunks used only for Products or product searches on the map.

Commit the generated `datasets.json` and `_texgo` files together with the corresponding HTML. Both region HTML files are identical. The source files remain usable through JSON file/folder selection. If generated data is unavailable, the HTML can fall back to loading source JSON; that fallback uses more memory.

`datasets.json` is also the lightweight update manifest: it includes the data revision, collection time and initial summary size. Always commit it with the generated catalog/data files. The revision accounts for menu contents, so an edited price can trigger the download consent dialog even when collectedAt and the folder name are unchanged. Validate this behavior with `python tools/test_build_web_data.py`.

First use and a new data revision require acceptance before restaurant/product data is requested. Rejection leaves the results empty and is remembered for that revision; local JSON/folder import stays available. The region picker offers “İnternetten veri yükle” to reconsider. Opening a locally saved selection skips remote checks. For remote selections, each visit downloads only the small update manifest until permission has been granted. Accepted JSON files use versioned Cache Storage on HTTPS/localhost; repeated loads use disk cache when it is available. Browser storage eviction or disabled storage can require downloading already accepted data again. Images and map tiles continue to use normal browser caching.

`_config.yml` explicitly includes `_texgo` in GitHub Pages and excludes the large raw dated folders under Istanbul_AS/Istanbul_EU from the published site. Those original files remain in the GitHub repository and can be downloaded from there. Region discovery uses the GitHub repository API or datasets.json, so excluding raw archives from Pages does not remove the regions from the picker. Build generated data before publishing a new dated folder.

Repeated restaurant IDs across regions use the most recently collected restaurant record. Product category occurrences remain intact. Payment method text, pickup minimums, delivery-fee brackets and source closure status are preserved.

On Android, the source-app button uses a package-bound intent targeting `com.trendyol.go` on the verified `tgo.gl` domain. When the source dataset contains an official restaurant shortlink, that link is preserved. Without one, the button opens the Go app entry point; it does not assume an undocumented restaurant route. Desktop browsers and unresolved Android intents fall back to the restaurant web page. The icon's source is the original Uber Eats SVG supplied in the TexGo project; official logo information is available at [Uber Eats brand assets](https://merchants.ubereats.com/fr/en/resources/learning-center/co-marketing-tools/).

References: [Chrome Android intents](https://developer.chrome.com/docs/android/intents), [Go domain association](https://tgo.gl/.well-known/assetlinks.json).
