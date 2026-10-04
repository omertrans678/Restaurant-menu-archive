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

`_config.yml` explicitly includes `_texgo` in GitHub Pages and excludes the large raw dated folders under Istanbul_AS/Istanbul_EU from the published site. Those original files remain in the GitHub repository and can be downloaded from there. Region discovery uses the GitHub repository API or datasets.json, so excluding raw archives from Pages does not remove the regions from the picker. Build generated data before publishing a new dated folder.

Repeated restaurant IDs across regions use the most recently collected restaurant record. Product category occurrences remain intact. Payment method text, pickup minimums, delivery-fee brackets and source closure status are preserved.

The source-app button uses the native link in the source dataset. The icon's source is the original Uber Eats SVG supplied in the TexGo project; official logo information is available at [Uber Eats brand assets](https://merchants.ubereats.com/fr/en/resources/learning-center/co-marketing-tools/).
