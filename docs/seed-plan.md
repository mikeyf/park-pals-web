# Seed Data Plan (Petah Tikvah)

## Goals
- Launch with a credible starter set of parks in Petah Tikvah
- Each park includes: name, coordinates, address, age-fit tags, amenities, parking summary

## Data Sources (initial)
- OpenStreetMap (parks, playgrounds, leisure=park)
- Municipal open data (if available)
- Manual curation for top parks to ensure quality

## Suggested Seed Set (Phase 1)
- 10-15 parks in central Petah Tikvah
- Include a mix: large city parks, neighborhood playgrounds, shaded/fenced areas

## Fields to Capture
- Park
  - name
  - lat, lng
  - address
  - hours (if known)
  - ageTags: 0-2, 3-5, 6-9, 10-12
  - amenities: bathrooms, shade, fenced, water, picnic
  - photos (optional, url placeholders)
- Parking
  - type: lot/street
  - paid: true/false
  - walkMins (estimate)
  - availability (low/med/high)

## Curation Workflow
1) Export OSM parks for Petah Tikvah bounding box
2) Filter for parks/playgrounds
3) Manually verify top 10-15 with quick map checks
4) Add age-fit tags + amenities
5) Add parking summary (best effort)

## Data Format (v1)
- JSON file stored at `web/public/data/parks.json`

Example:
{
  "parks": [
    {
      "id": "pt-001",
      "name": "Sample Park",
      "lat": 32.0,
      "lng": 34.9,
      "address": "Petah Tikvah",
      "ageTags": ["3-5", "6-9"],
      "amenities": ["shade", "bathrooms"],
      "parking": {
        "type": "street",
        "paid": false,
        "walkMins": 3,
        "availability": "med"
      }
    }
  ]
}
