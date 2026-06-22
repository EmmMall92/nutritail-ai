# Dog Chatbot 400 Live Cases

Generated: 2026-06-22T18:35:12.263Z
Site: https://nutritail.ai
OpenAI extraction: skipped

## Summary

- Cases checked: 400
- Passed: 371
- Needs review: 29

Checks cover OpenAI fact extraction when an API key is available, minimum missing-question flow, safety intent, Food V2 recommendation availability, allergy conflicts, puppy growth, large-breed puppy mineral data, weight-control kcal/fat/fiber logic, renal/urinary fit, sterilised calorie fit, senior fit, and active-dog/high-activity energy/protein mismatch guards.

OpenAI fact extraction was not checked in this run because no usable OPENAI_API_KEY was available to the QA runner.

## Executive Summary

### Goal Coverage

| Goal | Pass rate | Most common first picks |
| --- | ---: | --- |
| allergy | 45/49 | Monge All Breeds Adult Monoprotein Beef With Rice (12); Monge VetSolution An Hydro (10); Josera KIDS (9) |
| general | 119/122 | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί (65); Josera ACTIVE NATURE (23); Monge All Breeds Adult Active (11) |
| growth | 89/100 | Brit Premium By Nature Junior Small (49); Brit Care Grain Free Puppy Salmon (29); Purina Pro Plan SMALL&MINI PUPPY Healthy Start Κοτόπουλο (7) |
| premium | 11/11 | Josera KIDS (4); Purina Pro Plan MEDIUM ADULT Everyday Nutrition Κοτόπουλο (4); N&D Quinoa Grain Free Duck Neutered Adult Med/maxi (3) |
| renal | 2/2 | Monge VetSolution Renal And Oxalate (2) |
| senior | 18/20 | Brit Care Sustainable Senior Chicken & Insect (13); Josera MINI SENIOR SALMON (6); Acana Senior (1) |
| sensitive_digestion | 10/14 | Josera DUCK & POTATO (10); Josera GASTRO DRY (4) |
| sterilised | 64/65 | Happy Dog Fit & Vital Light (52); Josera LIGHT & VITAL (6); N&D Quinoa Grain Free Duck Neutered Adult Med/maxi (3) |
| urinary | 3/3 | Monge VetSolution Urinary Struvite (3) |
| value | 6/6 | Brit Premium By Nature Junior Medium (2); Happy Dog Naturcroq Adult Chicken (2); Happy Dog Naturcroq Duck & Rice Sterilised (2) |
| weight_control | 4/8 | Josera LIGHT & VITAL (6); Acana Wild Coast (2) |

### Safety Coverage

| Safety level | Pass rate | Common top-2 foods |
| --- | ---: | --- |
| emergency | 1/1 | Josera DUCK & POTATO (1); Josera KIDS (1) |
| normal | 275/278 | Happy Dog Fit & Vital Light (62); Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός (43); Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί (42); Purina Pro Plan Veterinary Diets CANINE OM OBESITY MANAGEMENT (40) |
| vet_referral | 95/121 | Josera DUCK & POTATO (30); Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί (23); Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός (23); Brit Premium By Nature Junior Small (20) |

### Recurring First Picks

- Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί: 65 first-pick appearances
- Happy Dog Fit & Vital Light: 52 first-pick appearances
- Brit Premium By Nature Junior Small: 49 first-pick appearances
- Brit Care Grain Free Puppy Salmon: 29 first-pick appearances
- Josera ACTIVE NATURE: 23 first-pick appearances
- Josera DUCK & POTATO: 15 first-pick appearances
- Brit Care Sustainable Senior Chicken & Insect: 13 first-pick appearances
- Josera KIDS: 13 first-pick appearances
- Josera LIGHT & VITAL: 12 first-pick appearances
- Monge All Breeds Adult Monoprotein Beef With Rice: 12 first-pick appearances
- Monge All Breeds Adult Active: 11 first-pick appearances
- N&D Quinoa Grain Free Duck Neutered Adult Med/maxi: 11 first-pick appearances

Use this section for qualitative review: repeated first picks can be healthy if they match the scenario, but they can also reveal over-dominant ranking signals.

## Results

| # | Status | Top foods | Review notes |
| --- | --- | --- | --- |
| 201 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 202 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 203 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 204 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 205 | pass | Josera GASTRO DRY; Josera SALMON & POTATO; Schesir Dry Medium Maintenance Chicken | - |
| 206 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 207 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 208 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 209 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 210 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 211 | pass | Josera ACTIVE NATURE; Monge All Breeds Adult Active; Royal Canin Sporting Life Trail 4300 | - |
| 212 | pass | Josera ACTIVE NATURE; Monge All Breeds Adult Active; Royal Canin Sporting Life Trail 4300 | - |
| 213 | pass | Josera ACTIVE NATURE; Monge All Breeds Adult Active; Royal Canin Sporting Life Trail 4300 | - |
| 214 | pass | Josera ACTIVE NATURE; Monge All Breeds Adult Active; Royal Canin Sporting Life Trail 4300 | - |
| 215 | pass | Josera ACTIVE NATURE; Monge All Breeds Adult Active; Royal Canin Sporting Life Trail 4300 | - |
| 216 | pass | Josera ACTIVE NATURE; Monge All Breeds Adult Active; Royal Canin Sporting Life Trail 4300 | - |
| 217 | pass | Josera ACTIVE NATURE; Monge All Breeds Adult Active; Royal Canin Sporting Life Trail 4300 | - |
| 218 | pass | Josera ACTIVE NATURE; Monge All Breeds Adult Active; Royal Canin Sporting Life Trail 4300 | - |
| 219 | pass | Josera ACTIVE NATURE; Monge All Breeds Adult Active; Royal Canin Sporting Life Trail 4300 | - |
| 220 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 221 | pass | Brit Premium By Nature Junior Small; Josera DUCK & POTATO; ACANA Puppy Small Breed | - |
| 222 | pass | Brit Premium By Nature Junior Small; Josera DUCK & POTATO; ACANA Puppy Small Breed | - |
| 223 | pass | Brit Premium By Nature Junior Small; Josera DUCK & POTATO; ACANA Puppy Small Breed | - |
| 224 | review | Brit Premium By Nature Junior Small; Josera DUCK & POTATO; ACANA Puppy Small Breed | safety: safety expected vet_referral, detected normal |
| 225 | pass | Brit Premium By Nature Junior Small; Josera DUCK & POTATO; ACANA Puppy Small Breed | - |
| 226 | review | Brit Premium By Nature Junior Small; Josera DUCK & POTATO; ACANA Puppy Small Breed | safety: safety expected vet_referral, detected normal |
| 227 | review | Brit Premium By Nature Junior Small; Josera DUCK & POTATO; ACANA Puppy Small Breed | safety: safety expected vet_referral, detected normal |
| 228 | review | Brit Premium By Nature Junior Small; Josera DUCK & POTATO; ACANA Puppy Small Breed | safety: safety expected vet_referral, detected normal |
| 229 | pass | Brit Premium By Nature Junior Small; Josera DUCK & POTATO; ACANA Puppy Small Breed | - |
| 230 | pass | Monge All Breeds Puppy And Junior Monoprotein Pork With Rice And Potatoes; Monge All Breeds Puppy And Junior Monoprotein Duck With Rice And Potatoes; Acana Wild Coast | - |
| 231 | pass | Monge VetSolution Urinary Struvite; Monge VetSolution Renal And Oxalate; Royal Canin Vet Diet Urinary S/O | - |
| 232 | pass | Josera GASTRO DRY; Josera SALMON & POTATO; Schesir Dry Medium Maintenance Chicken | - |
| 233 | review | Monge All Breeds Adult Monoprotein Beef With Rice; Monge All Breeds Adult Monoprotein Lamb With Rice And Potatoes; Monge All Breeds Adult Monoprotein Pork With Rice And Potatoes | safety: safety expected vet_referral, detected normal |
| 234 | review | Monge All Breeds Adult Monoprotein Beef With Rice; Monge All Breeds Adult Monoprotein Lamb With Rice And Potatoes; Monge All Breeds Adult Monoprotein Pork With Rice And Potatoes | safety: safety expected vet_referral, detected normal |
| 235 | pass | Monge All Breeds Adult Monoprotein Beef With Rice; Monge All Breeds Adult Monoprotein Lamb With Rice And Potatoes; Monge All Breeds Adult Monoprotein Pork With Rice And Potatoes | - |
| 236 | review | Monge All Breeds Adult Monoprotein Beef With Rice; Monge All Breeds Adult Monoprotein Lamb With Rice And Potatoes; Monge All Breeds Adult Monoprotein Pork With Rice And Potatoes | safety: safety expected vet_referral, detected normal |
| 237 | pass | Josera LIGHT & VITAL; Happy Dog Fit & Vital Light; N&D Quinoa Grain Free Duck Neutered Adult Med/maxi | - |
| 238 | pass | Josera LIGHT & VITAL; Happy Dog Fit & Vital Light; N&D Quinoa Grain Free Duck Neutered Adult Med/maxi | - |
| 239 | pass | Josera GASTRO DRY; Josera SALMON & POTATO; Schesir Dry Medium Maintenance Chicken | - |
| 240 | pass | Josera GASTRO DRY; Josera SALMON & POTATO; Schesir Dry Medium Maintenance Chicken | - |
| 241 | review | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | safety: safety expected vet_referral, detected normal |
| 242 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 243 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 244 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 245 | pass | Monge VetSolution Renal And Oxalate; Royal Canin Vet Diet Renal | - |
| 246 | pass | Monge VetSolution Renal And Oxalate; Royal Canin Vet Diet Renal | - |
| 247 | pass | Monge VetSolution Urinary Struvite; Monge VetSolution Renal And Oxalate; Royal Canin Vet Diet Urinary S/O | - |
| 248 | pass | Monge VetSolution Urinary Struvite; Monge VetSolution Renal And Oxalate; Royal Canin Vet Diet Urinary S/O | - |
| 249 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 250 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 251 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 252 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 253 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 254 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 255 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 256 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 257 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 258 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 259 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 260 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 261 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 262 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 263 | pass | Josera LIGHT & VITAL; Happy Dog Fit & Vital Light; N&D Quinoa Grain Free Duck Neutered Adult Med/maxi | - |
| 264 | pass | Josera LIGHT & VITAL; Happy Dog Fit & Vital Light; N&D Quinoa Grain Free Duck Neutered Adult Med/maxi | - |
| 265 | review | Josera LIGHT & VITAL; Happy Dog Fit & Vital Light; N&D Quinoa Grain Free Duck Neutered Adult Med/maxi | safety: safety expected vet_referral, detected normal |
| 266 | review | Josera LIGHT & VITAL; Happy Dog Fit & Vital Light; Purina Pro Plan Veterinary Diets CANINE OM OBESITY MANAGEMENT | safety: safety expected vet_referral, detected normal |
| 267 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 268 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 269 | review | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | safety: safety expected vet_referral, detected normal |
| 270 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 271 | pass | Monge VetSolution An Hydro; Monge Hypo With Salmon And Tuna; Josera HYPOALLERGENIC DRY | - |
| 272 | pass | Josera HYPOALLERGENIC DRY; Monge All Breeds Adult Monoprotein Beef With Rice; Monge All Breeds Adult Monoprotein Lamb With Rice And Potatoes | - |
| 273 | pass | Monge VetSolution An Hydro; Josera HYPOALLERGENIC DRY; Purina Pro Plan Veterinary Diets CANINE HA Hypoallergenic | - |
| 274 | pass | Monge Hypo With Salmon And Tuna; Monge All Breeds Adult Monoprotein Beef With Rice; Monge All Breeds Adult Monoprotein Lamb With Rice And Potatoes | - |
| 275 | pass | Monge VetSolution An Hydro; Monge Hypo With Salmon And Tuna; Brit Care Hypoallergenic Adult Show Champion Salmon & Herring | - |
| 276 | pass | Monge VetSolution An Hydro; Monge Hypo With Salmon And Tuna; Josera HYPOALLERGENIC DRY | - |
| 277 | pass | Monge VetSolution An Hydro; Monge Hypo With Salmon And Tuna; Brit Care Hypoallergenic Adult Show Champion Salmon & Herring | - |
| 278 | pass | Monge All Breeds Adult Monoprotein Beef With Rice; Monge All Breeds Adult Monoprotein Lamb With Rice And Potatoes; Monge All Breeds Adult Monoprotein Pork With Rice And Potatoes | - |
| 279 | pass | Monge All Breeds Adult Monoprotein Beef With Rice; Monge All Breeds Adult Monoprotein Lamb With Rice And Potatoes; Monge All Breeds Adult Monoprotein Pork With Rice And Potatoes | - |
| 280 | pass | Monge All Breeds Adult Monoprotein Beef With Rice; Monge All Breeds Adult Monoprotein Lamb With Rice And Potatoes; Monge All Breeds Adult Monoprotein Pork With Rice And Potatoes | - |
| 281 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 282 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 283 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 284 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 285 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 286 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 287 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 288 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 289 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 290 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 291 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 292 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 293 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 294 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 295 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 296 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 297 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 298 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 299 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 300 | pass | Purina Pro Plan MEDIUM ADULT Everyday Nutrition Κοτόπουλο; ACANA Classic Red Meat; ACANA Prairie Poultry | - |
| 301 | pass | Josera LIGHT & VITAL; Happy Dog Fit & Vital Light; N&D Quinoa Grain Free Neutered Duck Adult Mini | - |
| 302 | pass | Happy Dog Fit & Vital Light; Purina Pro Plan SMALL&MINI ADULT LIGHT/STERILISED Κοτόπουλο; Purina Pro Plan Veterinary Diets CANINE OM OBESITY MANAGEMENT | - |
| 303 | review | Happy Dog Fit & Vital Light; N&D Quinoa Grain Free Neutered Duck Adult Mini; Purina Pro Plan SMALL&MINI ADULT LIGHT/STERILISED Κοτόπουλο | safety: safety expected normal, detected vet_referral |
| 304 | pass | N&D Quinoa Grain Free Neutered Duck Adult Mini; Purina Pro Plan SMALL&MINI ADULT LIGHT/STERILISED Κοτόπουλο; Purina Pro Plan Veterinary Diets CANINE OM OBESITY MANAGEMENT | - |
| 305 | pass | Happy Dog Fit & Vital Light; N&D Quinoa Grain Free Weight Management Mini Lamb & Broccoli; Purina Pro Plan SMALL&MINI ADULT LIGHT/STERILISED Κοτόπουλο | - |
| 306 | pass | Happy Dog Fit & Vital Light; Josera LIGHT & VITAL; N&D Quinoa Grain Free Neutered Duck Adult Mini | - |
| 307 | pass | Josera LIGHT & VITAL; Happy Dog Fit & Vital Light; N&D Quinoa Grain Free Neutered Duck Adult Mini | - |
| 308 | pass | Josera LIGHT & VITAL; Happy Dog Fit & Vital Light; N&D Quinoa Grain Free Neutered Duck Adult Mini | - |
| 309 | pass | Happy Dog Fit & Vital Light; Purina Pro Plan Veterinary Diets CANINE OM OBESITY MANAGEMENT; Royal Canin Medium Sterilised Adult | - |
| 310 | pass | Josera LIGHT & VITAL; Purina Pro Plan Veterinary Diets CANINE OM OBESITY MANAGEMENT; Happy Dog Fit & Vital Light | - |
| 311 | pass | Happy Dog Fit & Vital Light; Purina Pro Plan Veterinary Diets CANINE OM OBESITY MANAGEMENT; Josera LIGHT & VITAL | - |
| 312 | pass | Happy Dog Fit & Vital Light; Purina Pro Plan Veterinary Diets CANINE OM OBESITY MANAGEMENT; Josera LIGHT & VITAL | - |
| 313 | pass | Happy Dog Fit & Vital Light; Purina Pro Plan Veterinary Diets CANINE OM OBESITY MANAGEMENT; Josera LIGHT & VITAL | - |
| 314 | pass | Happy Dog Fit & Vital Light; Purina Pro Plan Veterinary Diets CANINE OM OBESITY MANAGEMENT; Josera LIGHT & VITAL | - |
| 315 | pass | Happy Dog Fit & Vital Light; Purina Pro Plan Veterinary Diets CANINE OM OBESITY MANAGEMENT; Josera LIGHT & VITAL | - |
| 316 | pass | Happy Dog Fit & Vital Light; Purina Pro Plan Veterinary Diets CANINE OM OBESITY MANAGEMENT; Josera LIGHT & VITAL | - |
| 317 | pass | Happy Dog Fit & Vital Light; Purina Pro Plan Veterinary Diets CANINE OM OBESITY MANAGEMENT; Josera LIGHT & VITAL | - |
| 318 | pass | Happy Dog Fit & Vital Light; N&D Quinoa Grain Free Duck Neutered Adult Med/maxi; N&D Quinoa Grain Free Neutered Duck Adult Med/maxi | - |
| 319 | pass | Happy Dog Fit & Vital Light; Purina Pro Plan Veterinary Diets CANINE OM OBESITY MANAGEMENT; Josera LIGHT & VITAL | - |
| 320 | pass | Happy Dog Fit & Vital Light; Purina Pro Plan Veterinary Diets CANINE OM OBESITY MANAGEMENT; Josera LIGHT & VITAL | - |
| 321 | pass | Happy Dog Fit & Vital Light; N&D Quinoa Grain Free Duck Neutered Adult Med/maxi; N&D Quinoa Grain Free Neutered Duck Adult Med/maxi | - |
| 322 | pass | Happy Dog Fit & Vital Light; N&D Quinoa Grain Free Duck Neutered Adult Med/maxi; N&D Quinoa Grain Free Neutered Duck Adult Med/maxi | - |
| 323 | pass | Happy Dog Fit & Vital Light; N&D Quinoa Grain Free Duck Neutered Adult Med/maxi; N&D Quinoa Grain Free Neutered Duck Adult Med/maxi | - |
| 324 | pass | Purina Pro Plan Veterinary Diets CANINE OM OBESITY MANAGEMENT; Happy Dog Fit & Vital Light; ACANA Adult Light & Fit | - |
| 325 | pass | Happy Dog Fit & Vital Light; N&D Quinoa Grain Free Duck Neutered Adult Med/maxi; N&D Quinoa Grain Free Neutered Duck Adult Med/maxi | - |
| 326 | pass | N&D Quinoa Grain Free Duck Neutered Adult Med/maxi; N&D Quinoa Grain Free Neutered Duck Adult Med/maxi; Purina Pro Plan Veterinary Diets CANINE OM OBESITY MANAGEMENT | - |
| 327 | pass | Happy Dog Fit & Vital Light; N&D Quinoa Grain Free Duck Neutered Adult Med/maxi; N&D Quinoa Grain Free Neutered Duck Adult Med/maxi | - |
| 328 | pass | Happy Dog Fit & Vital Light; Purina Pro Plan Veterinary Diets CANINE OM OBESITY MANAGEMENT; ACANA Adult Light & Fit | - |
| 329 | pass | Happy Dog Fit & Vital Light; N&D Quinoa Grain Free Duck Neutered Adult Med/maxi; N&D Quinoa Grain Free Neutered Duck Adult Med/maxi | - |
| 330 | pass | N&D Quinoa Grain Free Duck Neutered Adult Med/maxi; N&D Quinoa Grain Free Neutered Duck Adult Med/maxi; Purina Pro Plan Veterinary Diets CANINE OM OBESITY MANAGEMENT | - |
| 331 | pass | Josera LIGHT & VITAL; Happy Dog Fit & Vital Light; Purina Pro Plan Veterinary Diets CANINE OM OBESITY MANAGEMENT | - |
| 332 | pass | Happy Dog Fit & Vital Light; Purina Pro Plan Veterinary Diets CANINE OM OBESITY MANAGEMENT; Josera LIGHT & VITAL | - |
| 333 | pass | Happy Dog Fit & Vital Light; Purina Pro Plan Veterinary Diets CANINE OM OBESITY MANAGEMENT; Josera LIGHT & VITAL | - |
| 334 | pass | Happy Dog Fit & Vital Light; N&D Quinoa Grain Free Duck Neutered Adult Med/maxi; N&D Quinoa Grain Free Neutered Duck Adult Med/maxi | - |
| 335 | pass | Happy Dog Fit & Vital Light; N&D Quinoa Grain Free Duck Neutered Adult Med/maxi; N&D Quinoa Grain Free Neutered Duck Adult Med/maxi | - |
| 336 | pass | Happy Dog Fit & Vital Light; Purina Pro Plan Veterinary Diets CANINE OM OBESITY MANAGEMENT; Josera LIGHT & VITAL | - |
| 337 | pass | Happy Dog Fit & Vital Light; Purina Pro Plan Veterinary Diets CANINE OM OBESITY MANAGEMENT; Josera LIGHT & VITAL | - |
| 338 | pass | Happy Dog Fit & Vital Light; Purina Pro Plan Veterinary Diets CANINE OM OBESITY MANAGEMENT; Josera LIGHT & VITAL | - |
| 339 | pass | Happy Dog Fit & Vital Light; Purina Pro Plan Veterinary Diets CANINE OM OBESITY MANAGEMENT; Josera LIGHT & VITAL | - |
| 340 | pass | Happy Dog Fit & Vital Light; Purina Pro Plan Veterinary Diets CANINE OM OBESITY MANAGEMENT; Josera LIGHT & VITAL | - |
| 341 | pass | Happy Dog Fit & Vital Light; Purina Pro Plan Veterinary Diets CANINE OM OBESITY MANAGEMENT; Josera LIGHT & VITAL | - |
| 342 | pass | Happy Dog Fit & Vital Light; Purina Pro Plan Veterinary Diets CANINE OM OBESITY MANAGEMENT; Josera LIGHT & VITAL | - |
| 343 | pass | Happy Dog Fit & Vital Light; Purina Pro Plan Veterinary Diets CANINE OM OBESITY MANAGEMENT; Josera LIGHT & VITAL | - |
| 344 | pass | Happy Dog Fit & Vital Light; Purina Pro Plan Veterinary Diets CANINE OM OBESITY MANAGEMENT; Josera LIGHT & VITAL | - |
| 345 | pass | Happy Dog Fit & Vital Light; N&D Quinoa Grain Free Duck Neutered Adult Med/maxi; N&D Quinoa Grain Free Neutered Duck Adult Med/maxi | - |
| 346 | pass | Happy Dog Fit & Vital Light; Purina Pro Plan Veterinary Diets CANINE OM OBESITY MANAGEMENT; Josera LIGHT & VITAL | - |
| 347 | pass | Happy Dog Fit & Vital Light; Purina Pro Plan Veterinary Diets CANINE OM OBESITY MANAGEMENT; Josera LIGHT & VITAL | - |
| 348 | pass | Happy Dog Fit & Vital Light; Purina Pro Plan Veterinary Diets CANINE OM OBESITY MANAGEMENT; Josera LIGHT & VITAL | - |
| 349 | pass | Happy Dog Fit & Vital Light; Purina Pro Plan Veterinary Diets CANINE OM OBESITY MANAGEMENT; Josera LIGHT & VITAL | - |
| 350 | pass | Happy Dog Fit & Vital Light; Purina Pro Plan Veterinary Diets CANINE OM OBESITY MANAGEMENT; Josera LIGHT & VITAL | - |
| 351 | pass | Josera HYPOALLERGENIC DRY; Monge Hypo With Salmon And Tuna; Monge All Breeds Adult Monoprotein Salmon With Rice | - |
| 352 | pass | Josera SALMON & POTATO; Brit Care Hypoallergenic Adult Show Champion Salmon & Herring; Monge Hypo With Salmon And Tuna | - |
| 353 | review | Monge Hypo With Salmon And Tuna; Brit Care Hypoallergenic Adult Show Champion Salmon & Herring; N&D Quinoa Grain Free Duck Neutered Adult Med/maxi | safety: safety expected vet_referral, detected normal |
| 354 | pass | Brit Care Hypoallergenic Adult Show Champion Salmon & Herring; Josera HYPOALLERGENIC DRY; N&D Quinoa Grain Free Duck Neutered Adult Med/maxi | - |
| 355 | pass | Monge Hypo With Salmon And Tuna; Brit Care Hypoallergenic Adult Show Champion Salmon & Herring; Josera HYPOALLERGENIC DRY | - |
| 356 | pass | N&D Quinoa Grain Free Duck Neutered Adult Med/maxi; N&D Quinoa Grain Free Neutered Duck Adult Med/maxi; Monge Hypo With Salmon And Tuna | - |
| 357 | pass | N&D Quinoa Grain Free Duck Neutered Adult Med/maxi; N&D Quinoa Grain Free Neutered Duck Adult Med/maxi; Purina Pro Plan MEDIUM & LARGE ADULT 7+ Sensitive Skin Σολομός | - |
| 358 | pass | N&D Quinoa Grain Free Duck Neutered Adult Med/maxi; N&D Quinoa Grain Free Neutered Duck Adult Med/maxi; Monge Hypo With Salmon And Tuna | - |
| 359 | pass | N&D Quinoa Grain Free Duck Neutered Adult Med/maxi; N&D Quinoa Grain Free Neutered Duck Adult Med/maxi; Monge Hypo With Salmon And Tuna | - |
| 360 | pass | N&D Quinoa Grain Free Duck Neutered Adult Med/maxi; N&D Quinoa Grain Free Neutered Duck Adult Med/maxi; Purina Pro Plan MEDIUM & LARGE ADULT 7+ Sensitive Skin Σολομός | - |
| 361 | pass | Acana Wild Coast; Josera KIDS; Brit Premium By Nature Junior Medium | - |
| 362 | pass | Brit Care Grain Free Puppy Salmon; Acana Puppy Large Breed; Orijen Puppy Large | - |
| 363 | pass | Brit Care Grain Free Puppy Salmon; Acana Puppy Large Breed; Orijen Puppy Large | - |
| 364 | pass | Brit Care Grain Free Puppy Salmon; Acana Puppy Large Breed; Orijen Puppy Large | - |
| 365 | pass | Brit Care Grain Free Puppy Salmon; N&D Pumpkin Grain Free Chicken & Pomegranate Puppy Med/maxi; Purina Pro Plan LARGE ROBUST PUPPY Healthy Start Κοτόπουλο | - |
| 366 | pass | Acana Wild Coast; Happy Dog Fit & Vital Junior; Josera DUCK & POTATO | - |
| 367 | pass | Josera DUCK & POTATO; Acana Wild Coast; Josera YOUNGSTAR | - |
| 368 | pass | Acana Wild Coast; Happy Dog Fit & Vital Junior; Josera DUCK & POTATO | - |
| 369 | pass | Josera DUCK & POTATO; Brit Premium By Nature Junior Small; Josera YOUNGSTAR | - |
| 370 | pass | Josera DUCK & POTATO; Acana Wild Coast; Josera YOUNGSTAR | - |
| 371 | pass | Josera MINI SENIOR SALMON; Brit Care Sustainable Senior Chicken & Insect; N&D Low Grain Chicken & Pomegranate Senior Mini | - |
| 372 | pass | Brit Care Sustainable Senior Chicken & Insect; Orijen Senior; Royal Canin Medium Adult 7+ | - |
| 373 | pass | Brit Care Sustainable Senior Chicken & Insect; Acana Senior; Orijen Senior | - |
| 374 | pass | Brit Care Sustainable Senior Chicken & Insect; Orijen Senior; Acana Senior | - |
| 375 | pass | Brit Care Sustainable Senior Chicken & Insect; Orijen Senior; Acana Senior | - |
| 376 | pass | Brit Care Sustainable Senior Chicken & Insect; Orijen Senior; Royal Canin Maxi Joint Care | - |
| 377 | pass | Brit Care Sustainable Senior Chicken & Insect; Orijen Senior; Royal Canin Medium Adult 7+ | - |
| 378 | pass | Brit Care Sustainable Senior Chicken & Insect; Orijen Senior; Royal Canin Medium Adult 7+ | - |
| 379 | pass | Josera MINI SENIOR SALMON; Brit Care Sustainable Senior Chicken & Insect; N&D Low Grain Chicken & Pomegranate Senior Mini | - |
| 380 | review | Josera MINI SENIOR SALMON; Brit Care Sustainable Senior Chicken & Insect; N&D Low Grain Chicken & Pomegranate Senior Mini | safety: safety expected vet_referral, detected normal |
| 381 | pass | Happy Dog Naturcroq Duck & Rice Sterilised; Josera Medi/maxi Adult Chicken & Rice; Happy Dog Naturcroq Adult Chicken | - |
| 382 | pass | N&D Quinoa Grain Free Duck Neutered Adult Med/maxi; N&D Quinoa Grain Free Neutered Duck Adult Med/maxi; Monge Hypo With Salmon And Tuna | - |
| 383 | pass | N&D Quinoa Grain Free Duck Neutered Adult Med/maxi; N&D Quinoa Grain Free Neutered Duck Adult Med/maxi; Royal Canin Medium Sterilised Adult | - |
| 384 | pass | N&D Quinoa Grain Free Duck Neutered Adult Med/maxi; N&D Quinoa Grain Free Neutered Duck Adult Med/maxi; Royal Canin Medium Sterilised Adult | - |
| 385 | pass | Happy Dog Naturcroq Duck & Rice Sterilised; Happy Dog Naturcroq Adult Chicken; Josera Lamb & Rice Adult | - |
| 386 | pass | Happy Dog Fit & Vital Light; Purina Pro Plan Veterinary Diets CANINE OM OBESITY MANAGEMENT; Josera LIGHT & VITAL | - |
| 387 | pass | Happy Dog Fit & Vital Light; Purina Pro Plan Veterinary Diets CANINE OM OBESITY MANAGEMENT; Josera LIGHT & VITAL | - |
| 388 | pass | Happy Dog Fit & Vital Light; Purina Pro Plan Veterinary Diets CANINE OM OBESITY MANAGEMENT; Josera LIGHT & VITAL | - |
| 389 | pass | Happy Dog Fit & Vital Light; Purina Pro Plan Veterinary Diets CANINE OM OBESITY MANAGEMENT; Josera LIGHT & VITAL | - |
| 390 | pass | Happy Dog Fit & Vital Light; Purina Pro Plan Veterinary Diets CANINE OM OBESITY MANAGEMENT; Josera LIGHT & VITAL | - |
| 391 | pass | Josera LIGHT & VITAL; Happy Dog Fit & Vital Light; N&D Quinoa Grain Free Duck Neutered Adult Med/maxi | - |
| 392 | pass | Happy Dog Fit & Vital Light; Purina Pro Plan Veterinary Diets CANINE OM OBESITY MANAGEMENT; Royal Canin Medium Sterilised Adult | - |
| 393 | pass | Happy Dog Fit & Vital Light; Purina Pro Plan Veterinary Diets CANINE OM OBESITY MANAGEMENT; Royal Canin Medium Sterilised Adult | - |
| 394 | pass | N&D Quinoa Grain Free Duck Neutered Adult Med/maxi; N&D Quinoa Grain Free Neutered Duck Adult Med/maxi; Purina Pro Plan Veterinary Diets CANINE OM OBESITY MANAGEMENT | - |
| 395 | pass | Purina Pro Plan Veterinary Diets CANINE OM OBESITY MANAGEMENT; Happy Dog Fit & Vital Light; Royal Canin Medium Sterilised Adult | - |
| 396 | pass | Happy Dog Fit & Vital Light; N&D Quinoa Grain Free Duck Neutered Adult Med/maxi; N&D Quinoa Grain Free Neutered Duck Adult Med/maxi | - |
| 397 | pass | Purina Pro Plan Veterinary Diets CANINE OM OBESITY MANAGEMENT; Happy Dog Fit & Vital Light; Royal Canin Medium Sterilised Adult | - |
| 398 | pass | Happy Dog Fit & Vital Light; Purina Pro Plan Veterinary Diets CANINE OM OBESITY MANAGEMENT; Josera LIGHT & VITAL | - |
| 399 | pass | Happy Dog Fit & Vital Light; Purina Pro Plan Veterinary Diets CANINE OM OBESITY MANAGEMENT; Josera LIGHT & VITAL | - |
| 400 | pass | Happy Dog Fit & Vital Light; N&D Quinoa Grain Free Duck Neutered Adult Med/maxi; N&D Quinoa Grain Free Neutered Duck Adult Med/maxi | - |
| 401 | pass | Purina Pro Plan SMALL&MINI ADULT Age Defence 9+ Κοτόπουλο; Purina Pro Plan SMALL&MINI ADULT Everyday Nutrition Κοτόπουλο; ACANA Prairie Poultry | - |
| 402 | review | Purina Pro Plan SMALL&MINI ADULT Sensitive Skin Σολομός; Monge All Breeds Adult Monoprotein Salmon With Rice; Monge Hypo With Salmon And Tuna | safety: safety expected normal, detected vet_referral |
| 403 | pass | ACANA Adult Grasslands; Monge All Breeds Adult Monoprotein Duck With Rice And Potatoes; Monge BWild Bwild Grain Free All Breeds Adult Anchovies With Potatoes And Peas | - |
| 404 | pass | Purina Pro Plan SMALL&MINI ADULT Sensitive Digestion Αρνί; ACANA Classic Red Meat; ACANA Prairie Poultry | - |
| 405 | pass | Josera SALMON & POTATO; Schesir Adult Small Με Ψάρι & Ρύζι; Schesir Adult Small Με Ψάρι & Ρύζι | - |
| 406 | pass | Acana Adult Small Breed; ACANA Adult Prairie Poultry; ACANA Adult Wild Prairie | - |
| 407 | pass | Schesir Dry Small Maintenance Με Κοτόπουλο; Schesir Adult Small Chicken & Rice; Acana Adult Small Breed | - |
| 408 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Monge All Breeds Adult Monoprotein Salmon With Rice; Monge Hypo With Salmon And Tuna | - |
| 409 | pass | ACANA Adult Grasslands; Monge All Breeds Adult Monoprotein Duck With Rice And Potatoes; Monge BWild Bwild Grain Free All Breeds Adult Anchovies With Potatoes And Peas | - |
| 410 | pass | Schesir Dry Small Maintenance Με Κοτόπουλο; Schesir Adult Small Chicken & Rice; Josera SALMON & POTATO | - |
| 411 | pass | Josera ACTIVE NATURE; Monge All Breeds Adult Active; Royal Canin Sporting Life Trail 4300 | - |
| 412 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; ACANA Classic Red Meat; ACANA Prairie Poultry | - |
| 413 | pass | Josera ACTIVE NATURE; Monge All Breeds Adult Active; Royal Canin Sporting Life Trail 4300 | - |
| 414 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 415 | pass | Royal Canin Medium Adult; Monge All Breeds Adult Monoprotein Salmon With Rice; Monge Hypo With Salmon And Tuna | - |
| 416 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Monge All Breeds Adult Monoprotein Salmon With Rice; Monge Hypo With Salmon And Tuna | - |
| 417 | pass | Royal Canin Medium Adult; Monge All Breeds Adult Monoprotein Salmon With Rice; Monge Hypo With Salmon And Tuna | - |
| 418 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 419 | pass | ACANA Adult Prairie Poultry; ACANA Adult Wild Prairie; Orijen Adult Original | - |
| 420 | pass | ACANA Adult Grasslands; Monge All Breeds Adult Monoprotein Duck With Rice And Potatoes; Monge BWild Bwild Grain Free All Breeds Adult Anchovies With Potatoes And Peas | - |
| 421 | pass | Monge All Breeds Adult Active; Purina Pro Plan LARGE ATHLETIC ADULT Sensitive Skin Σολομός; Happy Dog Profi High Energy 30/20 | - |
| 422 | pass | Monge All Breeds Adult Active; Purina Pro Plan LARGE ATHLETIC ADULT Sensitive Skin Σολομός; Happy Dog Profi High Energy 30/20 | - |
| 423 | pass | Monge All Breeds Adult Active; Purina Pro Plan LARGE ATHLETIC ADULT Sensitive Skin Σολομός; Happy Dog Profi High Energy 30/20 | - |
| 424 | pass | Monge All Breeds Adult Active; Purina Pro Plan LARGE ATHLETIC ADULT Everyday Nutrition Κοτόπουλο; Purina Pro Plan LARGE ATHLETIC ADULT Sensitive Skin Σολομός | - |
| 425 | pass | Monge All Breeds Adult Active; Purina Pro Plan LARGE ATHLETIC ADULT Sensitive Skin Σολομός; Happy Dog Profi High Energy 30/20 | - |
| 426 | pass | Monge All Breeds Adult Active; Purina Pro Plan LARGE ATHLETIC ADULT Sensitive Skin Σολομός; Happy Dog Profi High Energy 30/20 | - |
| 427 | pass | Monge All Breeds Adult Active; Purina Pro Plan LARGE ATHLETIC ADULT Sensitive Skin Σολομός; Happy Dog Profi High Energy 30/20 | - |
| 428 | pass | Monge All Breeds Adult Active; Purina Pro Plan LARGE ATHLETIC ADULT Everyday Nutrition Κοτόπουλο; Purina Pro Plan LARGE ATHLETIC ADULT Sensitive Skin Σολομός | - |
| 429 | pass | Monge All Breeds Adult Active; Purina Pro Plan LARGE ATHLETIC ADULT Sensitive Skin Σολομός; Happy Dog Profi High Energy 30/20 | - |
| 430 | pass | Monge All Breeds Adult Active; Purina Pro Plan LARGE ATHLETIC ADULT Sensitive Skin Σολομός; Happy Dog Profi High Energy 30/20 | - |
| 431 | pass | Josera ACTIVE NATURE; Royal Canin Sporting Life Trail 4300; Monge All Breeds Adult Active | - |
| 432 | pass | Josera ACTIVE NATURE; Monge All Breeds Adult Active; Royal Canin Sporting Life Trail 4300 | - |
| 433 | pass | Josera ACTIVE NATURE; Monge All Breeds Adult Active; Royal Canin Sporting Life Trail 4300 | - |
| 434 | pass | Josera ACTIVE NATURE; Monge All Breeds Adult Active; Purina Pro Plan LARGE ATHLETIC ADULT Everyday Nutrition Κοτόπουλο | - |
| 435 | pass | Monge All Breeds Adult Active; Purina Pro Plan LARGE ATHLETIC ADULT Sensitive Skin Σολομός; Happy Dog Profi High Energy 30/20 | - |
| 436 | pass | Josera ACTIVE NATURE; Monge All Breeds Adult Active; Royal Canin Sporting Life Trail 4300 | - |
| 437 | pass | Josera ACTIVE NATURE; Monge All Breeds Adult Active; Royal Canin Sporting Life Trail 4300 | - |
| 438 | pass | Josera ACTIVE NATURE; Monge All Breeds Adult Active; Royal Canin Sporting Life Trail 4300 | - |
| 439 | pass | Josera ACTIVE NATURE; Monge All Breeds Adult Active; Royal Canin Sporting Life Trail 4300 | - |
| 440 | pass | Josera ACTIVE NATURE; Monge All Breeds Adult Active; Royal Canin Sporting Life Trail 4300 | - |
| 441 | pass | Royal Canin Medium Adult; Purina Pro Plan Small&medium Starter Κοτόπουλο; ACANA Prairie Poultry | - |
| 442 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; ACANA Classic Red Meat; ACANA Prairie Poultry | - |
| 443 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Monge All Breeds Adult Monoprotein Salmon With Rice; Monge Hypo With Salmon And Tuna | - |
| 444 | pass | ACANA Adult Grasslands; Monge All Breeds Adult Monoprotein Duck With Rice And Potatoes; Monge BWild Bwild Grain Free All Breeds Adult Anchovies With Potatoes And Peas | - |
| 445 | pass | ACANA Adult Prairie Poultry; ACANA Adult Wild Prairie; Orijen Adult Original | - |
| 446 | pass | ACANA Classic Red Meat; ACANA Prairie Poultry; Monge All Breeds Adult Monoprotein Beef With Rice | - |
| 447 | pass | Royal Canin Medium Adult; Monge All Breeds Adult Monoprotein Salmon With Rice; Monge Hypo With Salmon And Tuna | - |
| 448 | pass | Monge All Breeds Adult Monoprotein Rabbit With Rice And Potatoes; Purina Pro Plan MEDIUM ADULT Everyday Nutrition Κοτόπουλο; Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί | - |
| 449 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 450 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 451 | pass | Monge VetSolution An Hydro; Monge Hypo With Salmon And Tuna; Josera HYPOALLERGENIC DRY | - |
| 452 | pass | Monge VetSolution An Hydro; Monge Hypo With Salmon And Tuna; Brit Care Hypoallergenic Adult Show Champion Salmon & Herring | - |
| 453 | pass | Monge VetSolution An Hydro; Monge Hypo With Salmon And Tuna; Brit Care Hypoallergenic Adult Show Champion Salmon & Herring | - |
| 454 | pass | Josera HYPOALLERGENIC DRY; Monge All Breeds Adult Monoprotein Beef With Rice; Monge All Breeds Adult Monoprotein Lamb With Rice And Potatoes | - |
| 455 | pass | Monge VetSolution An Hydro; Monge Hypo With Salmon And Tuna; Brit Care Hypoallergenic Adult Show Champion Salmon & Herring | - |
| 456 | pass | Brit Care Hypoallergenic Adult Show Champion Salmon & Herring; Josera HYPOALLERGENIC DRY; Monge All Breeds Adult Monoprotein Salmon With Rice | - |
| 457 | pass | Monge VetSolution An Hydro; Monge Hypo With Salmon And Tuna; Josera HYPOALLERGENIC DRY | - |
| 458 | pass | Monge Hypo With Salmon And Tuna; Monge All Breeds Adult Monoprotein Beef With Rice; Monge All Breeds Adult Monoprotein Lamb With Rice And Potatoes | - |
| 459 | pass | Monge All Breeds Adult Monoprotein Beef With Rice; Monge All Breeds Adult Monoprotein Lamb With Rice And Potatoes; Monge All Breeds Adult Monoprotein Pork With Rice And Potatoes | - |
| 460 | pass | Monge All Breeds Adult Monoprotein Beef With Rice; Monge All Breeds Adult Monoprotein Lamb With Rice And Potatoes; Monge All Breeds Adult Monoprotein Pork With Rice And Potatoes | - |
| 461 | pass | Brit Premium By Nature Junior Medium; Purina Pro Plan MEDIUM PUPPY Healthy Start Κοτόπουλο; Josera KIDS | - |
| 462 | pass | Brit Care Grain Free Puppy Salmon; Josera Medium/maxi Sensi Junior; N&D Pumpkin Grain Free Chicken & Pomegranate Puppy Med/maxi | - |
| 463 | pass | Brit Care Grain Free Puppy Salmon; N&D Pumpkin Grain Free Chicken & Pomegranate Puppy Med/maxi; Acana Puppy Large Breed | - |
| 464 | pass | Brit Care Grain Free Puppy Salmon; Josera Medium/maxi Sensi Junior; N&D Pumpkin Grain Free Chicken & Pomegranate Puppy Med/maxi | - |
| 465 | pass | Brit Care Grain Free Puppy Salmon; N&D Pumpkin Grain Free Chicken & Pomegranate Puppy Med/maxi; Acana Puppy Large Breed | - |
| 466 | pass | Purina Pro Plan SMALL&MINI PUPPY Healthy Start Κοτόπουλο; Monge All Breeds Puppy And Junior Monoprotein Beef With Rice; Monge All Breeds Puppy And Junior Monoprotein Pork With Rice And Potatoes | - |
| 467 | pass | Acana Wild Coast; Happy Dog Fit & Vital Junior; Josera DUCK & POTATO | - |
| 468 | pass | Brit Premium By Nature Junior Small; Josera DUCK & POTATO; ACANA Puppy Small Breed | - |
| 469 | pass | Brit Premium By Nature Junior Small; Monge All Breeds Puppy And Junior Monoprotein Beef With Rice; Monge All Breeds Puppy And Junior Monoprotein Pork With Rice And Potatoes | - |
| 470 | pass | Brit Premium By Nature Junior Small; Josera DUCK & POTATO; ACANA Puppy Small Breed | - |
| 471 | pass | Josera MINI SENIOR SALMON; Brit Care Sustainable Senior Chicken & Insect; Acana Senior | - |
| 472 | pass | Brit Care Sustainable Senior Chicken & Insect; Acana Senior; Orijen Senior | - |
| 473 | pass | Brit Care Sustainable Senior Chicken & Insect; Acana Senior; Orijen Senior | - |
| 474 | pass | Brit Care Sustainable Senior Chicken & Insect; Acana Senior; Orijen Senior | - |
| 475 | pass | Brit Care Sustainable Senior Chicken & Insect; Acana Senior; Orijen Senior | - |
| 476 | pass | Brit Care Sustainable Senior Chicken & Insect; Acana Senior; Orijen Senior | - |
| 477 | pass | Acana Senior; Brit Care Sustainable Senior Chicken & Insect; Orijen Senior | - |
| 478 | pass | Brit Care Sustainable Senior Chicken & Insect; Acana Senior; Orijen Senior | - |
| 479 | pass | Josera MINI SENIOR SALMON; Brit Care Sustainable Senior Chicken & Insect; Acana Senior | - |
| 480 | review | Josera MINI SENIOR SALMON; Brit Care Sustainable Senior Chicken & Insect; Acana Senior | safety: safety expected vet_referral, detected normal |
| 481 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 482 | pass | Purina Pro Plan MEDIUM & LARGE ADULT 7+ Sensitive Skin Σολομός; Purina Pro Plan MEDIUM & LARGE ADULT Age Defence 7+ Κοτόπουλο; N&D Low Grain Chicken & Pomegranate Adult Med/maxi | - |
| 483 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 484 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 485 | pass | Josera ACTIVE NATURE; Monge All Breeds Adult Active; Royal Canin Sporting Life Trail 4300 | - |
| 486 | pass | Josera ACTIVE NATURE; Monge All Breeds Adult Active; Royal Canin Sporting Life Trail 4300 | - |
| 487 | pass | Josera ACTIVE NATURE; Monge All Breeds Adult Active; Royal Canin Sporting Life Trail 4300 | - |
| 488 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 489 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 490 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 491 | pass | Happy Dog Naturcroq Adult Chicken; Purina Pro Plan MEDIUM ADULT Everyday Nutrition Κοτόπουλο; Ambrosia Ολιστική Τροφή Για Ενήλικους Σκύλους, Όλων Των Φυλών, Με Σαρδέλα Και Τόνο | - |
| 492 | pass | Purina Pro Plan MEDIUM ADULT Everyday Nutrition Κοτόπουλο; ACANA Classic Red Meat; ACANA Prairie Poultry | - |
| 493 | pass | Purina Pro Plan MEDIUM ADULT Everyday Nutrition Κοτόπουλο; ACANA Classic Red Meat; ACANA Prairie Poultry | - |
| 494 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 495 | pass | Purina Pro Plan MEDIUM ADULT Sensitive Digestion Αρνί; Purina Pro Plan MEDIUM ADULT Sensitive Skin Σολομός; Schesir Mature Medium Με Κοτόπουλο | - |
| 496 | pass | Monge All Breeds Adult Monoprotein Beef With Rice; Monge All Breeds Adult Monoprotein Lamb With Rice And Potatoes; Monge All Breeds Adult Monoprotein Pork With Rice And Potatoes | - |
| 497 | pass | Monge All Breeds Adult Monoprotein Beef With Rice; Monge All Breeds Adult Monoprotein Lamb With Rice And Potatoes; Monge All Breeds Adult Monoprotein Pork With Rice And Potatoes | - |
| 498 | pass | Monge All Breeds Adult Monoprotein Beef With Rice; Monge All Breeds Adult Monoprotein Lamb With Rice And Potatoes; Monge All Breeds Adult Monoprotein Pork With Rice And Potatoes | - |
| 499 | pass | Purina Pro Plan MEDIUM ADULT Everyday Nutrition Κοτόπουλο; ACANA Classic Red Meat; ACANA Prairie Poultry | - |
| 500 | pass | Happy Dog Naturcroq Adult Chicken; Purina Pro Plan MEDIUM ADULT Everyday Nutrition Κοτόπουλο; Ambrosia Ολιστική Τροφή Για Ενήλικους Σκύλους, Όλων Των Φυλών, Με Σαρδέλα Και Τόνο | - |
| 501 | pass | Purina Pro Plan SMALL&MINI PUPPY Healthy Start Κοτόπουλο; Monge All Breeds Puppy And Junior Monoprotein Beef With Rice; Monge All Breeds Puppy And Junior Monoprotein Pork With Rice And Potatoes | - |
| 502 | review | Purina Pro Plan SMALL&MINI PUPPY Healthy Start Κοτόπουλο; Monge All Breeds Puppy And Junior Monoprotein Beef With Rice; Monge All Breeds Puppy And Junior Monoprotein Pork With Rice And Potatoes | safety: safety expected normal, detected vet_referral |
| 503 | pass | Purina Pro Plan SMALL&MINI PUPPY Healthy Start Κοτόπουλο; Monge All Breeds Puppy And Junior Monoprotein Beef With Rice; Monge All Breeds Puppy And Junior Monoprotein Pork With Rice And Potatoes | - |
| 504 | pass | Purina Pro Plan SMALL&MINI PUPPY Healthy Start Κοτόπουλο; Monge All Breeds Puppy And Junior Monoprotein Beef With Rice; Monge All Breeds Puppy And Junior Monoprotein Pork With Rice And Potatoes | - |
| 505 | pass | Purina Pro Plan SMALL&MINI PUPPY Healthy Start Κοτόπουλο; Monge All Breeds Puppy And Junior Monoprotein Beef With Rice; Monge All Breeds Puppy And Junior Monoprotein Pork With Rice And Potatoes | - |
| 506 | pass | Brit Premium By Nature Junior Small; Josera DUCK & POTATO; ACANA Puppy Small Breed | - |
| 507 | pass | Brit Premium By Nature Junior Small; Josera DUCK & POTATO; ACANA Puppy Small Breed | - |
| 508 | pass | Brit Premium By Nature Junior Small; Josera DUCK & POTATO; ACANA Puppy Small Breed | - |
| 509 | pass | Brit Premium By Nature Junior Small; Josera DUCK & POTATO; ACANA Puppy Small Breed | - |
| 510 | pass | Brit Premium By Nature Junior Small; Josera DUCK & POTATO; ACANA Puppy Small Breed | - |
| 511 | pass | Purina Pro Plan SMALL&MINI PUPPY Healthy Start Κοτόπουλο; Monge All Breeds Puppy And Junior Monoprotein Beef With Rice; Monge All Breeds Puppy And Junior Monoprotein Pork With Rice And Potatoes | - |
| 512 | pass | Brit Premium By Nature Junior Small; Josera DUCK & POTATO; ACANA Puppy Small Breed | - |
| 513 | pass | Brit Premium By Nature Junior Small; Josera DUCK & POTATO; ACANA Puppy Small Breed | - |
| 514 | pass | Brit Premium By Nature Junior Medium; Purina Pro Plan MEDIUM PUPPY Healthy Start Κοτόπουλο; Josera KIDS | - |
| 515 | pass | Brit Care Grain Free Puppy Salmon; N&D Pumpkin Grain Free Chicken & Pomegranate Puppy Med/maxi; Acana Puppy Large Breed | - |
| 516 | pass | Brit Care Grain Free Puppy Salmon; N&D Pumpkin Grain Free Chicken & Pomegranate Puppy Med/maxi; Acana Puppy Large Breed | - |
| 517 | pass | Brit Premium By Nature Junior Small; Josera DUCK & POTATO; ACANA Puppy Small Breed | - |
| 518 | pass | Brit Premium By Nature Junior Small; Josera DUCK & POTATO; ACANA Puppy Small Breed | - |
| 519 | pass | Brit Premium By Nature Junior Small; Josera DUCK & POTATO; ACANA Puppy Small Breed | - |
| 520 | pass | Brit Premium By Nature Junior Small; Josera DUCK & POTATO; ACANA Puppy Small Breed | - |
| 521 | pass | Brit Care Grain Free Puppy Salmon; N&D Pumpkin Grain Free Chicken & Pomegranate Puppy Med/maxi; Acana Puppy Large Breed | - |
| 522 | pass | Brit Care Grain Free Puppy Salmon; N&D Pumpkin Grain Free Chicken & Pomegranate Puppy Med/maxi; Acana Puppy Large Breed | - |
| 523 | pass | Brit Care Grain Free Puppy Salmon; N&D Pumpkin Grain Free Chicken & Pomegranate Puppy Med/maxi; Acana Puppy Large Breed | - |
| 524 | pass | Brit Care Grain Free Puppy Salmon; N&D Pumpkin Grain Free Chicken & Pomegranate Puppy Med/maxi; Acana Puppy Large Breed | - |
| 525 | pass | Brit Care Grain Free Puppy Salmon; N&D Pumpkin Grain Free Chicken & Pomegranate Puppy Med/maxi; Acana Puppy Large Breed | - |
| 526 | pass | Brit Care Grain Free Puppy Salmon; N&D Pumpkin Grain Free Chicken & Pomegranate Puppy Med/maxi; Acana Puppy Large Breed | - |
| 527 | pass | Brit Care Grain Free Puppy Salmon; N&D Pumpkin Grain Free Chicken & Pomegranate Puppy Med/maxi; Acana Puppy Large Breed | - |
| 528 | pass | Brit Care Grain Free Puppy Salmon; N&D Pumpkin Grain Free Chicken & Pomegranate Puppy Med/maxi; Acana Puppy Large Breed | - |
| 529 | pass | Brit Care Grain Free Puppy Salmon; N&D Pumpkin Grain Free Chicken & Pomegranate Puppy Med/maxi; Acana Puppy Large Breed | - |
| 530 | pass | Brit Care Grain Free Puppy Salmon; N&D Pumpkin Grain Free Chicken & Pomegranate Puppy Med/maxi; Acana Puppy Large Breed | - |
| 531 | pass | Brit Care Grain Free Puppy Salmon; N&D Pumpkin Grain Free Chicken & Pomegranate Puppy Med/maxi; Acana Puppy Large Breed | - |
| 532 | pass | Brit Care Grain Free Puppy Salmon; N&D Pumpkin Grain Free Chicken & Pomegranate Puppy Med/maxi; Acana Puppy Large Breed | - |
| 533 | pass | Brit Care Grain Free Puppy Salmon; N&D Pumpkin Grain Free Chicken & Pomegranate Puppy Med/maxi; Acana Puppy Large Breed | - |
| 534 | review | Royal Canin German Shepherd Puppy; Royal Canin Rottweiler Puppy; Monge All Breeds Puppy And Junior Monoprotein Pork With Rice And Potatoes | food: Large-breed puppy top candidate lacks calcium/phosphorus data. |
| 535 | pass | Brit Care Grain Free Puppy Salmon; Josera Medium/maxi Sensi Junior; N&D Pumpkin Grain Free Chicken & Pomegranate Puppy Med/maxi | - |
| 536 | pass | Brit Care Grain Free Puppy Salmon; N&D Pumpkin Grain Free Chicken & Pomegranate Puppy Med/maxi; Acana Puppy Large Breed | - |
| 537 | pass | Brit Care Grain Free Puppy Salmon; N&D Pumpkin Grain Free Chicken & Pomegranate Puppy Med/maxi; Purina Pro Plan LARGE ATHLETIC PUPPY Healthy Start Κοτόπουλο | - |
| 538 | pass | Brit Care Grain Free Puppy Salmon; N&D Pumpkin Grain Free Chicken & Pomegranate Puppy Med/maxi; Purina Pro Plan LARGE ATHLETIC PUPPY Healthy Start Κοτόπουλο | - |
| 539 | pass | Brit Care Grain Free Puppy Salmon; N&D Pumpkin Grain Free Chicken & Pomegranate Puppy Med/maxi; Acana Puppy Large Breed | - |
| 540 | pass | Brit Care Grain Free Puppy Salmon; N&D Pumpkin Grain Free Chicken & Pomegranate Puppy Med/maxi; Acana Puppy Large Breed | - |
| 541 | pass | Monge All Breeds Puppy And Junior Monoprotein Pork With Rice And Potatoes; Monge All Breeds Puppy And Junior Monoprotein Duck With Rice And Potatoes; Monge BWild Bwild All Breeds Puppy E Junior Duck With Potatoes Gb | - |
| 542 | pass | Josera KIDS; Monge All Breeds Puppy And Junior Monoprotein Beef With Rice; Monge All Breeds Puppy And Junior Monoprotein Pork With Rice And Potatoes | - |
| 543 | pass | Josera KIDS; Monge All Breeds Puppy And Junior Monoprotein Pork With Rice And Potatoes; Monge All Breeds Puppy And Junior Monoprotein Salmon With Rice | - |
| 544 | pass | Monge All Breeds Puppy And Junior Lamb With Rice; Monge BWild Bwild Low Grain All Breeds Puppy And Junior Deer; Josera DUCK & POTATO | - |
| 545 | pass | Josera KIDS; Monge All Breeds Puppy And Junior Monoprotein Beef With Rice; Monge All Breeds Puppy And Junior Monoprotein Pork With Rice And Potatoes | - |
| 546 | pass | Brit Care Hypoallergenic Junior Large Lamb & Rice; Brit Care Hypoallergenic Puppy Lamb & Rice; Monge BWild Bwild Low Grain All Breeds Puppy And Junior Deer | - |
| 547 | pass | Josera KIDS; Monge All Breeds Puppy And Junior Monoprotein Beef With Rice; Monge All Breeds Puppy And Junior Monoprotein Pork With Rice And Potatoes | - |
| 548 | pass | Josera KIDS; Monge All Breeds Puppy And Junior Monoprotein Beef With Rice; Monge All Breeds Puppy And Junior Monoprotein Pork With Rice And Potatoes | - |
| 549 | pass | Josera KIDS; Monge All Breeds Puppy And Junior Monoprotein Beef With Rice; Monge All Breeds Puppy And Junior Monoprotein Pork With Rice And Potatoes | - |
| 550 | pass | Josera KIDS; Monge All Breeds Puppy And Junior Monoprotein Beef With Rice; Monge All Breeds Puppy And Junior Monoprotein Pork With Rice And Potatoes | - |
| 551 | pass | Brit Premium By Nature Junior Small; ACANA Puppy Small Breed; Josera YOUNGSTAR | - |
| 552 | pass | Brit Premium By Nature Junior Small; Josera YOUNGSTAR; Monge All Breeds Puppy And Junior Monoprotein Beef With Rice | - |
| 553 | pass | Josera DUCK & POTATO; Monge All Breeds Puppy And Junior Monoprotein Duck With Rice And Potatoes; Monge BWild Bwild All Breeds Puppy E Junior Duck With Potatoes Gb | - |
| 554 | pass | Monge All Breeds Puppy And Junior Lamb With Rice; Happy Dog Fit & Vital Junior; Brit Premium By Nature Junior Small | - |
| 555 | pass | ACANA Puppy Small Breed; Brit Premium By Nature Junior Small; ACANA Puppy & Junior | - |
| 556 | pass | Brit Premium By Nature Junior Small; Josera DUCK & POTATO; ACANA Puppy Small Breed | - |
| 557 | pass | Brit Premium By Nature Junior Small; Josera DUCK & POTATO; ACANA Puppy Small Breed | - |
| 558 | pass | Brit Premium By Nature Junior Small; Josera DUCK & POTATO; ACANA Puppy Small Breed | - |
| 559 | pass | Brit Premium By Nature Junior Small; Josera DUCK & POTATO; ACANA Puppy Small Breed | - |
| 560 | pass | Brit Premium By Nature Junior Small; Josera DUCK & POTATO; ACANA Puppy Small Breed | - |
| 561 | pass | Josera DUCK & POTATO; Josera KIDS; Josera YOUNGSTAR | - |
| 562 | pass | Josera DUCK & POTATO; Josera KIDS; Josera YOUNGSTAR | - |
| 563 | pass | Josera DUCK & POTATO; Josera KIDS; Josera YOUNGSTAR | - |
| 564 | review | Josera DUCK & POTATO; Josera KIDS; Josera YOUNGSTAR | safety: safety expected vet_referral, detected normal |
| 565 | pass | Josera DUCK & POTATO; Josera KIDS; Josera YOUNGSTAR | - |
| 566 | review | Josera DUCK & POTATO; Josera KIDS; Josera YOUNGSTAR | safety: safety expected vet_referral, detected normal |
| 567 | review | Josera DUCK & POTATO; Josera KIDS; Josera YOUNGSTAR | safety: safety expected vet_referral, detected normal |
| 568 | pass | Josera DUCK & POTATO; Josera KIDS; Josera YOUNGSTAR | - |
| 569 | pass | Josera DUCK & POTATO; Josera KIDS; Josera YOUNGSTAR | - |
| 570 | review | Josera DUCK & POTATO; Josera KIDS; Josera YOUNGSTAR | safety: safety expected vet_referral, detected normal |
| 571 | pass | Brit Premium By Nature Junior Small; Monge All Breeds Puppy And Junior Monoprotein Beef With Rice; Monge All Breeds Puppy And Junior Monoprotein Pork With Rice And Potatoes | - |
| 572 | pass | Brit Premium By Nature Junior Small; Monge All Breeds Puppy And Junior Monoprotein Beef With Rice; Monge All Breeds Puppy And Junior Monoprotein Pork With Rice And Potatoes | - |
| 573 | pass | Brit Premium By Nature Junior Small; Monge All Breeds Puppy And Junior Monoprotein Beef With Rice; Monge All Breeds Puppy And Junior Monoprotein Pork With Rice And Potatoes | - |
| 574 | pass | Brit Premium By Nature Junior Small; Monge All Breeds Puppy And Junior Monoprotein Beef With Rice; Monge All Breeds Puppy And Junior Monoprotein Pork With Rice And Potatoes | - |
| 575 | pass | Josera DUCK & POTATO; Acana Wild Coast; Josera YOUNGSTAR | - |
| 576 | pass | Brit Premium By Nature Junior Small; Josera DUCK & POTATO; ACANA Puppy Small Breed | - |
| 577 | pass | Brit Premium By Nature Junior Small; Monge All Breeds Puppy And Junior Monoprotein Beef With Rice; Monge All Breeds Puppy And Junior Monoprotein Pork With Rice And Potatoes | - |
| 578 | pass | Brit Premium By Nature Junior Small; Josera DUCK & POTATO; ACANA Puppy Small Breed | - |
| 579 | pass | Brit Premium By Nature Junior Small; Monge All Breeds Puppy And Junior Monoprotein Beef With Rice; Monge All Breeds Puppy And Junior Monoprotein Pork With Rice And Potatoes | - |
| 580 | pass | Brit Premium By Nature Junior Small; Josera DUCK & POTATO; ACANA Puppy Small Breed | - |
| 581 | review | Brit Premium By Nature Junior Small; Josera DUCK & POTATO; ACANA Puppy Small Breed | safety: safety expected vet_referral, detected normal |
| 582 | review | Acana Wild Coast; Happy Dog Fit & Vital Junior; Josera KIDS | safety: safety expected vet_referral, detected normal |
| 583 | pass | Brit Premium By Nature Junior Small; Josera DUCK & POTATO; ACANA Puppy Small Breed | - |
| 584 | review | Acana Wild Coast; Happy Dog Fit & Vital Junior; Josera KIDS | safety: safety expected vet_referral, detected normal |
| 585 | pass | Brit Premium By Nature Junior Small; Josera DUCK & POTATO; ACANA Puppy Small Breed | - |
| 586 | review | Brit Premium By Nature Junior Small; Josera DUCK & POTATO; ACANA Puppy Small Breed | safety: safety expected vet_referral, detected normal |
| 587 | pass | Brit Premium By Nature Junior Small; Josera DUCK & POTATO; ACANA Puppy Small Breed | - |
| 588 | review | Brit Premium By Nature Junior Small; Josera DUCK & POTATO; ACANA Puppy Small Breed | safety: safety expected vet_referral, detected normal |
| 589 | review | Brit Premium By Nature Junior Small; Josera DUCK & POTATO; ACANA Puppy Small Breed | safety: safety expected vet_referral, detected normal |
| 590 | review | Brit Premium By Nature Junior Small; Josera DUCK & POTATO; ACANA Puppy Small Breed | safety: safety expected vet_referral, detected normal |
| 591 | pass | Brit Premium By Nature Junior Medium; Josera KIDS; ACANA Puppy & Junior | - |
| 592 | pass | Brit Premium By Nature Junior Medium; Josera KIDS; ACANA Puppy & Junior | - |
| 593 | pass | Josera KIDS; Brit Premium By Nature Junior Medium; ACANA Puppy & Junior | - |
| 594 | pass | Josera KIDS; Brit Premium By Nature Junior Medium; ACANA Puppy & Junior | - |
| 595 | pass | Josera KIDS; Brit Premium By Nature Junior Medium; ACANA Puppy & Junior | - |
| 596 | pass | Brit Premium By Nature Junior Small; Josera DUCK & POTATO; ACANA Puppy Small Breed | - |
| 597 | pass | Brit Premium By Nature Junior Small; Josera DUCK & POTATO; ACANA Puppy Small Breed | - |
| 598 | pass | Josera KIDS; Monge All Breeds Puppy And Junior Monoprotein Beef With Rice; Monge All Breeds Puppy And Junior Monoprotein Pork With Rice And Potatoes | - |
| 599 | pass | Josera KIDS; Monge All Breeds Puppy And Junior Monoprotein Beef With Rice; Monge All Breeds Puppy And Junior Monoprotein Pork With Rice And Potatoes | - |
| 600 | pass | Josera KIDS; Brit Premium By Nature Junior Medium; ACANA Puppy & Junior | - |
