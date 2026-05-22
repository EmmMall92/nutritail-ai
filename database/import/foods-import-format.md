# NutriTail Foods Import Format

Each food record should contain:

- id
- brand
- name
- species
- lifeStage
- activitySupport
- healthSupport
- protein
- fat
- fiber
- sodium
- magnesium
- calcium
- phosphorus
- ingredients
- tags

## Example JSON

```json
{
  "id": "dog-101",
  "brand": "Example Brand",
  "name": "Adult Chicken Formula",
  "species": "dog",
  "lifeStage": "adult",
  "activitySupport": "normal",
  "healthSupport": ["general"],
  "protein": 26,
  "fat": 14,
  "fiber": 3.5,
  "sodium": 0.3,
  "magnesium": 0.08,
  "calcium": 1.1,
  "phosphorus": 0.9,
  "ingredients": ["chicken", "rice"],
  "tags": ["adult", "general"]
}