import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const reportPath =
  process.env.NUTRITAIL_QA_REPORT_PATH ||
  "reports/customer_chatbot_flow_links_qa.md";

const checks = [
  {
    label: "Chatbot reads petId query parameter",
    file: "app/account/chatbot/page.tsx",
    expected: 'query.get("petId")',
  },
  {
    label: "Chatbot reads progress mode query parameter",
    file: "app/account/chatbot/page.tsx",
    expected: 'query.get("mode")',
  },
  {
    label: "Chatbot opens direct progress mode",
    file: "app/account/chatbot/page.tsx",
    expected: 'mode === "progress"',
  },
  {
    label: "Chatbot stores language preference with a stable key",
    file: "app/account/chatbot/page.tsx",
    expected: "CHATBOT_LANGUAGE_STORAGE_KEY",
  },
  {
    label: "Chatbot reads saved language preference from browser storage",
    file: "app/account/chatbot/page.tsx",
    expected: "window.localStorage.getItem(CHATBOT_LANGUAGE_STORAGE_KEY)",
  },
  {
    label: "Chatbot persists language preference changes",
    file: "app/account/chatbot/page.tsx",
    expected: "window.localStorage.setItem(CHATBOT_LANGUAGE_STORAGE_KEY, chatLanguage)",
  },
  {
    label: "Chatbot avoids overwriting saved language before initial load",
    file: "app/account/chatbot/page.tsx",
    expected: "skipInitialLanguageSaveRef.current",
  },
  {
    label: "Chatbot initial welcome uses the shared language helper",
    file: "app/account/chatbot/page.tsx",
    expected: 'createMessage("bot", getChatbotWelcomeMessage("el"))',
  },
  {
    label: "Chatbot saved language restore reuses initial welcome updater",
    file: "app/account/chatbot/page.tsx",
    expected: "updateInitialWelcomeMessage(storedLanguage)",
  },
  {
    label: "Chatbot language toggle updates the initial welcome before intake starts",
    file: "app/account/chatbot/page.tsx",
    expected: "handleChatLanguageChange(language)",
  },
  {
    label: "Account dashboard progress action deep-links to saved pet",
    file: "app/account/page.tsx",
    expected: "/account/chatbot?petId=${latestPet.id}&mode=progress",
  },
  {
    label: "Account dashboard receives latest pet progress log",
    file: "app/api/account/pets/route.ts",
    expected: "latestProgressLog",
  },
  {
    label: "Account dashboard shows latest progress decision card",
    file: "app/account/page.tsx",
    expected: "Τελευταία απόφαση προόδου",
  },
  {
    label: "Account dashboard links latest progress to a new progress check",
    file: "app/account/page.tsx",
    expected: "/account/chatbot?petId=${latestProgressPet.id}&mode=progress",
  },
  {
    label: "Pets list progress action deep-links to saved pet",
    file: "app/account/pets/page.tsx",
    expected: "/account/chatbot?petId=${pet.id}&mode=progress",
  },
  {
    label: "Pets list run analysis action deep-links to saved pet",
    file: "app/account/pets/page.tsx",
    expected: "/account/chatbot?petId=${pet.id}",
  },
  {
    label: "Pets list explains resting calories in Greek customer language",
    file: "app/account/pets/page.tsx",
    expected: "Θερμίδες ηρεμίας",
  },
  {
    label: "Pets list explains daily target in Greek customer language",
    file: "app/account/pets/page.tsx",
    expected: "Ημερήσιος στόχος",
  },
  {
    label: "Pets list uses customer-facing food-fit wording",
    file: "app/account/pets/page.tsx",
    expected: "Fit τροφής:",
  },
  {
    label: "Pet detail progress action deep-links to saved pet",
    file: "app/account/pets/[id]/page.tsx",
    expected: "/account/chatbot?petId=${pet.id}&mode=progress",
  },
  {
    label: "Pet detail analysis action deep-links to saved pet",
    file: "app/account/pets/[id]/page.tsx",
    expected: "/account/chatbot?petId=${pet.id}",
  },
  {
    label: "Saved chatbot analysis links to printable report",
    file: "app/account/chatbot/page.tsx",
    expected: "/print/pet-report/${savedPetId}",
  },
  {
    label: "Saved chatbot analysis links to printable timeline",
    file: "app/account/chatbot/page.tsx",
    expected: "/print/pet-timeline/${savedPetId}",
  },
  {
    label: "Saved chatbot analysis links to progress check",
    file: "app/account/chatbot/page.tsx",
    expected: "/account/chatbot?petId=${savedPetId}&mode=progress",
  },
  {
    label: "Account chatbot uses the authenticated save endpoint",
    file: "app/account/chatbot/page.tsx",
    expected: 'fetch("/api/account/chatbot/save"',
  },
  {
    label: "Account chatbot uses the authenticated analyze endpoint",
    file: "app/account/chatbot/page.tsx",
    expected: 'fetch("/api/account/chatbot/analyze"',
  },
  {
    label: "Account chatbot analyze endpoint checks the Supabase user session",
    file: "app/api/account/chatbot/analyze/route.ts",
    expected: "supabase.auth.getUser()",
  },
  {
    label: "Account chatbot analyze endpoint reuses shared pet payload validation",
    file: "app/api/account/chatbot/analyze/route.ts",
    expected: "validatePetAnalysisPayload",
  },
  {
    label: "Legacy chatbot save endpoint is disabled",
    file: "app/api/chatbot/save/route.ts",
    expected: "{ status: 410 }",
  },
  {
    label: "Legacy chatbot save points to the account save endpoint",
    file: "app/api/chatbot/save/route.ts",
    expected: "/api/account/chatbot/save",
  },
  {
    label: "Recommendation cards preview grams before choosing food",
    file: "app/account/chatbot/page.tsx",
    expected: "getRecommendationChoicePortionPreview",
  },
  {
    label: "Recommendation cards expose customer grams/day label",
    file: "app/account/chatbot/page.tsx",
    expected: "Choose the food to start with",
  },
  {
    label: "Chosen recommendation points user to save the plan",
    file: "app/account/chatbot/page.tsx",
    expected: "Next step: press save to keep the food, calories, and first portion on the profile.",
  },
  {
    label: "Chosen recommendation explains the simple daily plan",
    file: "app/account/chatbot/page.tsx",
    expected: "Simple daily plan:",
  },
  {
    label: "Chosen recommendation gives practical monitoring guidance",
    file: "app/account/chatbot/page.tsx",
    expected: "Watch weight, appetite, stool, and energy.",
  },
  {
    label: "Recommendation cards use customer role badges",
    file: "app/account/chatbot/page.tsx",
    expected: "getRecommendationChoiceBadgeLabel",
  },
  {
    label: "Recommendation cards expose estimate portion badge",
    file: "app/account/chatbot/page.tsx",
    expected: "Get grams",
  },
  {
    label: "Recommendation composer has compact customer fallback",
    file: "app/account/chatbot/page.tsx",
    expected: "formatCompactFoodV2RecommendationFallback",
  },
  {
    label: "Chatbot locks rapid message submits immediately",
    file: "app/account/chatbot/page.tsx",
    expected: "processingMessageRef.current",
  },
  {
    label: "Chatbot disables input while preparing a reply",
    file: "app/account/chatbot/page.tsx",
    expected: "disabled={isProcessingMessage || isAnalyzing || isSaving}",
  },
  {
    label: "Chatbot uses layout scroll effect to keep newest content visible",
    file: "app/account/chatbot/page.tsx",
    expected: "useLayoutEffect(() =>",
  },
  {
    label: "Chatbot scroll effect updates the message container directly",
    file: "app/account/chatbot/page.tsx",
    expected: "container.scrollTop = targetTop",
  },
  {
    label: "Chatbot scroll effect computes the bottom of the message container",
    file: "app/account/chatbot/page.tsx",
    expected: "container.scrollHeight - container.clientHeight",
  },
  {
    label: "Chatbot scroll effect responds while a reply is being prepared",
    file: "app/account/chatbot/page.tsx",
    expected: "isProcessingMessage, recommendedFoodChoices.length",
  },
  {
    label: "Chatbot message list reserves room above sticky input",
    file: "app/account/chatbot/page.tsx",
    expected: "scroll-pb-72",
  },
  {
    label: "Chatbot message list disables browser scroll anchoring",
    file: "app/account/chatbot/page.tsx",
    expected: "[overflow-anchor:none]",
  },
  {
    label: "Compact recommendation fallback points to food cards",
    file: "app/account/chatbot/page.tsx",
    expected: "Choose one food card below to estimate daily portions.",
  },
  {
    label: "Saved chatbot analysis frames next steps as ready",
    file: "app/account/chatbot/page.tsx",
    expected: "Your pet profile, report, timeline, and progress check are ready. Choose what you want to do next.",
  },
  {
    label: "Saved chatbot analysis explains recommended next step",
    file: "app/account/chatbot/page.tsx",
    expected: "Open the report first to keep calories, portion, and food choice in one place.",
  },
  {
    label: "Saved chatbot analysis sets progress check timing",
    file: "app/account/chatbot/page.tsx",
    expected: "After 2-4 weeks, run a progress check with updated weight, grams/day, and treats.",
  },
  {
    label: "Saved chatbot analysis exposes progress check action",
    file: "app/account/chatbot/page.tsx",
    expected: "Weight, grams, treats, and results.",
  },
  {
    label: "Saved chatbot analysis uses Greek report chip wording",
    file: "app/account/chatbot/page.tsx",
    expected: "Διατροφική αναφορά",
  },
  {
    label: "Saved chatbot analysis uses Greek timeline chip wording",
    file: "app/account/chatbot/page.tsx",
    expected: "Ιστορικό αναλύσεων",
  },
  {
    label: "Saved pet selection preserves pending comparison intent",
    file: "app/account/chatbot/page.tsx",
    expected: "const pendingCompare = [...pendingCompareQueries]",
  },
  {
    label: "Initial natural pet details can start intake without button tap",
    file: "app/account/chatbot/page.tsx",
    expected: "isNewPetRequest(text) || parseSpeciesInput(text) || workingPet.species",
  },
  {
    label: "Saved pet selection clears pending comparison after handoff",
    file: "app/account/chatbot/page.tsx",
    expected: "setPendingCompareQueries([])",
  },
  {
    label: "Saved pet selection runs pending comparison with pet species",
    file: "app/account/chatbot/page.tsx",
    expected: "await runFoodComparison(pendingCompare, { species: nextPet.species })",
  },
  {
    label: "Saved pet chatbot intake uses formatted pet display names",
    file: "app/account/chatbot/page.tsx",
    expected: "name: formatPetDisplayName(savedPet.name)",
  },
  {
    label: "Saved pet chatbot messages use formatted pet display names",
    file: "app/account/chatbot/page.tsx",
    expected: "const savedPetName = formatPetDisplayName(savedPet.name)",
  },
  {
    label: "Saved pet follow-up messages use formatted pet display names",
    file: "app/account/chatbot/page.tsx",
    expected: "const targetPetName = formatPetDisplayName(targetPet.name)",
  },
  {
    label: "Saved pet handoff user echo is localized",
    file: "app/account/chatbot/page.tsx",
    expected: "formatSavedPetUserEcho(savedPetName, chatLanguage)",
  },
  {
    label: "Saved pet current-food prompt is localized",
    file: "app/account/chatbot/page.tsx",
    expected: "formatSavedPetCurrentFoodPrompt(savedPetName, chatLanguage)",
  },
  {
    label: "Saved pet mobile progress shortcut is localized",
    file: "app/account/chatbot/page.tsx",
    expected: 'botText("Έλεγχος", "Progress")',
  },
  {
    label: "Saved pet mobile change-food shortcut is localized",
    file: "app/account/chatbot/page.tsx",
    expected: 'botText("Άλλη τροφή", "Another food")',
  },
  {
    label: "Chatbot account header action is localized",
    file: "app/account/chatbot/page.tsx",
    expected: 'botText("Λογαριασμός", "Account")',
  },
  {
    label: "New account chatbot empty-pets message is localized",
    file: "app/account/chatbot/page.tsx",
    expected: "Δεν υπάρχουν ακόμη αποθηκευμένα κατοικίδια. Ας ξεκινήσουμε νέα ανάλυση.",
  },
  {
    label: "Saved pets load failure message is localized",
    file: "app/account/chatbot/page.tsx",
    expected: "Δεν μπόρεσα να φορτώσω τα αποθηκευμένα κατοικίδια, οπότε ας ξεκινήσουμε νέα ανάλυση.",
  },
  {
    label: "Chatbot restart header action is localized",
    file: "app/account/chatbot/page.tsx",
    expected: 'botText("Επανεκκίνηση", "Restart")',
  },
  {
    label: "Account shell logout action is customer-localized",
    file: "app/account/layout.tsx",
    expected: "Αποσύνδεση",
  },
  {
    label: "Account shell dashboard nav is customer-localized",
    file: "app/account/layout.tsx",
    expected: 'label="Πίνακας"',
  },
  {
    label: "Account shell pets nav is customer-localized",
    file: "app/account/layout.tsx",
    expected: 'label="Κατοικίδια"',
  },
  {
    label: "Account shell profile nav is customer-localized",
    file: "app/account/layout.tsx",
    expected: 'label="Προφίλ"',
  },
  {
    label: "Account dashboard welcome is customer-localized",
    file: "app/account/page.tsx",
    expected: "Καλώς ήρθες",
  },
  {
    label: "Account dashboard primary CTA is customer-localized",
    file: "app/account/page.tsx",
    expected: "Νέα διατροφική ανάλυση",
  },
  {
    label: "Account dashboard latest report card is customer-localized",
    file: "app/account/page.tsx",
    expected: "Τελευταίο report",
  },
  {
    label: "Account dashboard progress decision card is customer-localized",
    file: "app/account/page.tsx",
    expected: "Τελευταία απόφαση προόδου",
  },
  {
    label: "Account dashboard food fit chip is customer-localized",
    file: "app/account/page.tsx",
    expected: "Fit τροφής:",
  },
  {
    label: "Saved pet picker uses localized customer-facing pet metadata",
    file: "app/account/chatbot/page.tsx",
    expected: "formatSavedPetCardMeta(savedPet, chatLanguage)",
  },
  {
    label: "Saved pet profile summary localizes activity labels",
    file: "app/account/chatbot/page.tsx",
    expected: "formatSavedPetActivityLabel(savedPet.activity_level, language)",
  },
  {
    label: "Saved pet comparison handoff offers next actions",
    file: "app/account/chatbot/page.tsx",
    expected:
      "After the comparison, I can run a fresh analysis, a progress check, or another-food recommendation for this pet.",
  },
  {
    label: "Progress check accepts weight-only first reply",
    file: "app/account/chatbot/page.tsx",
    expected: "You can start with only the current weight, for example 7 kg.",
  },
  {
    label: "Progress check sends appetite context to the progress API",
    file: "app/account/chatbot/page.tsx",
    expected: "appetiteNote: details.appetiteNote",
  },
  {
    label: "Progress API stores appetite context in progress metadata",
    file: "app/api/account/pets/[id]/progress/route.ts",
    expected: "appetiteNote: appetiteNote || null",
  },
  {
    label: "Progress check sends deterministic decision status",
    file: "app/account/chatbot/page.tsx",
    expected: "progressDecisionStatus: progressDecision.status",
  },
  {
    label: "Progress decision exposes focused next-step action panel",
    file: "app/account/chatbot/page.tsx",
    expected: "getProgressDecisionActions(latestProgressDecisionStatus).map",
  },
  {
    label: "Progress decision panel can recommend another food",
    file: "app/account/chatbot/page.tsx",
    expected: "review_food_fit",
  },
  {
    label: "Progress API stores deterministic decision status",
    file: "app/api/account/pets/[id]/progress/route.ts",
    expected: "progressDecisionStatus: progressDecisionStatus || null",
  },
  {
    label: "Pet detail latest progress shows Greek appetite chip",
    file: "app/account/pets/[id]/page.tsx",
    expected: "Όρεξη: {formatProgressChipLabel(progressSummary.appetiteNote)}",
  },
  {
    label: "Pet detail latest progress shows Greek decision chip",
    file: "app/account/pets/[id]/page.tsx",
    expected: "Απόφαση: {formatProgressChipLabel(progressSummary.progressDecisionStatus)}",
  },
  {
    label: "Pet detail timeline shows structured progress chips",
    file: "app/account/pets/[id]/page.tsx",
    expected: "getProgressContextChips(log.metadata).map",
  },
  {
    label: "Printable timeline shows structured stool progress",
    file: "app/print/pet-timeline/[id]/page.tsx",
    expected: "formatProgressChipLabel(log.metadata?.stoolNote)",
  },
  {
    label: "Printable timeline shows Greek progress decision",
    file: "app/print/pet-timeline/[id]/page.tsx",
    expected: "Απόφαση προόδου:",
  },
  {
    label: "Analysis in-progress message is localized",
    file: "app/account/chatbot/page.tsx",
    expected: "Περίμενε λίγο, ολοκληρώνω την ανάλυση.",
  },
  {
    label: "Analysis complete message is localized",
    file: "app/account/chatbot/page.tsx",
    expected:
      "Η ανάλυση ολοκληρώθηκε. Μπορείς να την αποθηκεύσεις ή να ξεκινήσεις ξανά.",
  },
  {
    label: "Printable timeline uses Greek customer-facing food recommendation label",
    file: "app/print/pet-timeline/[id]/page.tsx",
    expected: "Πρόταση τροφής:",
  },
  {
    label: "Pet detail analysis history uses Greek customer-facing food recommendation label",
    file: "app/account/pets/[id]/page.tsx",
    expected: "Πρόταση τροφής:",
  },
  {
    label: "Pet detail food score uses Greek customer-facing recheck wording",
    file: "app/account/pets/[id]/page.tsx",
    expected: "Θέλει επανέλεγχο",
  },
  {
    label: "Pet detail uses Greek customer-facing food-fit card label",
    file: "app/account/pets/[id]/page.tsx",
    expected: "Fit τροφής",
  },
  {
    label: "Pet detail weight edit uses species-aware customer limit",
    file: "app/account/pets/[id]/page.tsx",
    expected: 'const maxPetWeightKg = pet.species === "cat" ? 15 : 90;',
  },
  {
    label: "Printable report uses Greek customer-facing saved food insights heading",
    file: "app/print/pet-report/page.tsx",
    expected: "Αποθηκευμένες σημειώσεις τροφών",
  },
  {
    label: "Printable timeline uses Greek customer-facing saved food insights heading",
    file: "app/print/pet-timeline/[id]/page.tsx",
    expected: "Τελευταία αποθηκευμένα food insights",
  },
  {
    label: "Printable report gives a Greek customer follow-up plan",
    file: "app/print/pet-report/[id]/page.tsx",
    expected: "Πλάνο επανελέγχου",
  },
  {
    label: "Printable report uses Greek customer-facing plan status wording",
    file: "app/print/pet-report/[id]/page.tsx",
    expected: "Κατάσταση πλάνου",
  },
  {
    label: "Printable report uses Greek customer-facing food-fit wording",
    file: "app/print/pet-report/[id]/page.tsx",
    expected: "Προτείνεται νέα ανάλυση",
  },
  {
    label: "Printable report explains in Greek when to ask for a new shortlist",
    file: "app/print/pet-report/[id]/page.tsx",
    expected: "Πότε ζητάμε νέα λίστα",
  },
  {
    label: "Printable timeline asks in Greek for grams and food refusal notes",
    file: "app/print/pet-timeline/[id]/page.tsx",
    expected: "Φέρε τα τωρινά ημερήσια γραμμάρια και τυχόν άρνηση τροφής στον επόμενο έλεγχο προόδου.",
  },
  {
    label: "Printable timeline explains resting calories in Greek customer language",
    file: "app/print/pet-timeline/[id]/page.tsx",
    expected: "Θερμίδες ηρεμίας",
  },
  {
    label: "Pet detail explains resting calories in Greek customer language",
    file: "app/account/pets/[id]/page.tsx",
    expected: "Θερμίδες ηρεμίας",
  },
  {
    label: "Pet detail explains daily target in Greek customer language",
    file: "app/account/pets/[id]/page.tsx",
    expected: "Ημερήσιος στόχος",
  },
  {
    label: "Printable timeline explains daily target in Greek customer language",
    file: "app/print/pet-timeline/[id]/page.tsx",
    expected: "Πρακτικές θερμίδες για το τωρινό πλάνο",
  },
  {
    label: "Printable timeline uses Greek customer nutrition-notes heading",
    file: "app/print/pet-timeline/[id]/page.tsx",
    expected: "Τελευταίες διατροφικές σημειώσεις",
  },
  {
    label: "Chat guardrails use customer-facing context notes",
    file: "lib/nutrition/chatGuardrails.ts",
    expected: "Helpful context:",
  },
  {
    label: "Greek chatbot guardrail copy uses customer-friendly caution heading",
    file: "app/account/chatbot/page.tsx",
    expected: "Μικρή προσοχή πριν δούμε τις τροφές:",
  },
];

const forbiddenChecks = [
  {
    label: "Chatbot auto-scroll does not use page-level scrollIntoView",
    file: "app/account/chatbot/page.tsx",
    forbidden: "scrollIntoView",
  },
  {
    label: "Chatbot language buttons do not bypass welcome synchronization",
    file: "app/account/chatbot/page.tsx",
    forbidden: "onClick={() => setChatLanguage(language)}",
  },
  {
    label: "Saved pet handoff does not use raw English Use echo",
    file: "app/account/chatbot/page.tsx",
    forbidden: "createMessage(\"user\", `Use ${savedPetName}`)",
  },
  {
    label: "Saved pet prompt does not use old English-only current-food text",
    file: "app/account/chatbot/page.tsx",
    forbidden: "Great. I will use ${savedPetName}'s saved profile.",
  },
  {
    label: "Saved pet mobile shortcut does not hardcode Progress",
    file: "app/account/chatbot/page.tsx",
    forbidden: ">Progress</button>",
  },
  {
    label: "Saved pet mobile shortcut does not hardcode Another food",
    file: "app/account/chatbot/page.tsx",
    forbidden: ">Another food</button>",
  },
  {
    label: "Current-food candidate copy does not expose matcher score",
    file: "app/account/chatbot/page.tsx",
    forbidden: "${confidence}, score ${score}",
  },
  {
    label: "Current-food quality note does not expose data-quality label",
    file: "app/account/chatbot/page.tsx",
    forbidden: "Data quality:",
  },
  {
    label: "Recommendation card badge does not expose raw internal score",
    file: "app/account/chatbot/page.tsx",
    forbidden: "Math.round(choice.score)}/100",
  },
  {
    label: "Recommendation cards no longer use old match-label helper",
    file: "app/account/chatbot/page.tsx",
    forbidden: "getRecommendationChoiceMatchLabel",
  },
  {
    label: "Printable timeline does not expose raw recommended food ids",
    file: "app/print/pet-timeline/[id]/page.tsx",
    forbidden: "Recommended Food IDs",
  },
  {
    label: "Printable timeline does not expose English loading copy",
    file: "app/print/pet-timeline/[id]/page.tsx",
    forbidden: "Loading timeline report...",
  },
  {
    label: "Printable timeline does not expose English title",
    file: "app/print/pet-timeline/[id]/page.tsx",
    forbidden: "Pet Nutrition Timeline Report",
  },
  {
    label: "Printable timeline does not expose English progress section",
    file: "app/print/pet-timeline/[id]/page.tsx",
    forbidden: "Progress Check-ins",
  },
  {
    label: "Printable timeline does not expose English food insights heading",
    file: "app/print/pet-timeline/[id]/page.tsx",
    forbidden: "Latest Saved Food Insights",
  },
  {
    label: "Pet detail page does not expose legacy food signal ids",
    file: "app/account/pets/[id]/page.tsx",
    forbidden: "Legacy food signal ids",
  },
  {
    label: "Pet detail food score does not expose back-office review wording",
    file: "app/account/pets/[id]/page.tsx",
    forbidden: "Needs review",
  },
  {
    label: "Pet detail does not expose raw food-score wording",
    file: "app/account/pets/[id]/page.tsx",
    forbidden: "Food score",
  },
  {
    label: "Pet detail does not expose raw score fraction",
    file: "app/account/pets/[id]/page.tsx",
    forbidden: "/100",
  },
  {
    label: "Pet detail does not expose English loading copy",
    file: "app/account/pets/[id]/page.tsx",
    forbidden: "Loading pet...",
  },
  {
    label: "Pet detail does not expose English error heading",
    file: "app/account/pets/[id]/page.tsx",
    forbidden: "Could not load this pet",
  },
  {
    label: "Pet detail does not expose English print report button",
    file: "app/account/pets/[id]/page.tsx",
    forbidden: "Print Report",
  },
  {
    label: "Pet detail does not expose English analysis history heading",
    file: "app/account/pets/[id]/page.tsx",
    forbidden: "Analysis history",
  },
  {
    label: "Pets list does not expose RER card label",
    file: "app/account/pets/page.tsx",
    forbidden: "RER {latest.rer} kcal",
  },
  {
    label: "Pets list does not expose MER card label",
    file: "app/account/pets/page.tsx",
    forbidden: "MER {latest.mer} kcal",
  },
  {
    label: "Pets list does not expose raw score fraction",
    file: "app/account/pets/page.tsx",
    forbidden: "Score {latest.food_score}/100",
  },
  {
    label: "Pets list does not expose English loading copy",
    file: "app/account/pets/page.tsx",
    forbidden: "Loading pets...",
  },
  {
    label: "Pets list does not expose English empty-state heading",
    file: "app/account/pets/page.tsx",
    forbidden: "No saved pets yet",
  },
  {
    label: "Pets list does not expose English report-ready status",
    file: "app/account/pets/page.tsx",
    forbidden: "Report ready",
  },
  {
    label: "Saved chatbot analysis does not expose mixed-language Greek report chip",
    file: "app/account/chatbot/page.tsx",
    forbidden: "Report διατροφής",
  },
  {
    label: "Saved chatbot analysis does not expose mixed-language Greek timeline chip",
    file: "app/account/chatbot/page.tsx",
    forbidden: "Ιστορικό / timeline",
  },
  {
    label: "Pets list does not expose mixed-language ready report status",
    file: "app/account/pets/page.tsx",
    forbidden: "Report έτοιμο",
  },
  {
    label: "Pets list does not expose mixed-language notes report status",
    file: "app/account/pets/page.tsx",
    forbidden: "Report με σημειώσεις",
  },
  {
    label: "Pets list does not expose mixed-language general report status",
    file: "app/account/pets/page.tsx",
    forbidden: "Γενικό report",
  },
  {
    label: "Pet detail weight edit does not allow unrealistic legacy limit",
    file: "app/account/pets/[id]/page.tsx",
    forbidden: 'max="150"',
  },
  {
    label: "Printable report does not expose legacy food analysis wording",
    file: "app/print/pet-report/page.tsx",
    forbidden: "Legacy Food Analysis Signals",
  },
  {
    label: "Printable report does not expose RER card label",
    file: "app/print/pet-report/page.tsx",
    forbidden: 'label="RER"',
  },
  {
    label: "Printable report does not expose DER card label",
    file: "app/print/pet-report/page.tsx",
    forbidden: 'label="DER"',
  },
  {
    label: "Printable report does not expose AI-branded nutrition heading",
    file: "app/print/pet-report/page.tsx",
    forbidden: 'title="AI Nutrition Advice"',
  },
  {
    label: "Printable saved report does not expose back-office review wording",
    file: "app/print/pet-report/[id]/page.tsx",
    forbidden: "Needs review",
  },
  {
    label: "Printable saved report does not expose model-confidence wording",
    file: "app/print/pet-report/[id]/page.tsx",
    forbidden: "High confidence",
  },
  {
    label: "Printable saved report does not expose moderate-confidence wording",
    file: "app/print/pet-report/[id]/page.tsx",
    forbidden: "Moderate confidence",
  },
  {
    label: "Printable saved report does not expose raw food-score wording",
    file: "app/print/pet-report/[id]/page.tsx",
    forbidden: "Food score:",
  },
  {
    label: "Printable report legacy page does not expose English loading copy",
    file: "app/print/pet-report/page.tsx",
    forbidden: "Loading report...",
  },
  {
    label: "Printable report legacy page does not expose English title",
    file: "app/print/pet-report/page.tsx",
    forbidden: "Personalized Pet Nutrition Report",
  },
  {
    label: "Printable report legacy page does not expose English pet profile heading",
    file: "app/print/pet-report/page.tsx",
    forbidden: "Pet Profile",
  },
  {
    label: "Printable report legacy page does not expose English saved food insights heading",
    file: "app/print/pet-report/page.tsx",
    forbidden: "Saved Food Insights",
  },
  {
    label: "Printable report legacy page does not expose English footer explanation",
    file: "app/print/pet-report/page.tsx",
    forbidden: "This report was generated by",
  },
  {
    label: "Printable saved report does not expose English loading copy",
    file: "app/print/pet-report/[id]/page.tsx",
    forbidden: "Loading report...",
  },
  {
    label: "Printable saved report does not expose English print button",
    file: "app/print/pet-report/[id]/page.tsx",
    forbidden: "Print / Save PDF",
  },
  {
    label: "Printable saved report does not expose English client summary heading",
    file: "app/print/pet-report/[id]/page.tsx",
    forbidden: "Client summary",
  },
  {
    label: "Printable saved report does not expose English follow-up heading",
    file: "app/print/pet-report/[id]/page.tsx",
    forbidden: "Follow-up Plan",
  },
  {
    label: "Printable timeline does not expose legacy food analysis wording",
    file: "app/print/pet-timeline/[id]/page.tsx",
    forbidden: "Legacy Food Analysis Signals",
  },
  {
    label: "Printable timeline does not expose AI-branded nutrition heading",
    file: "app/print/pet-timeline/[id]/page.tsx",
    forbidden: "Latest AI Nutrition Advice",
  },
  {
    label: "Analysis in-progress message is not raw English-only",
    file: "app/account/chatbot/page.tsx",
    forbidden:
      'createMessage("bot", "Hold on a moment, I am finishing the analysis.")',
  },
  {
    label: "Analysis complete message is not raw English-only",
    file: "app/account/chatbot/page.tsx",
    forbidden:
      'createMessage(\n        "bot",\n        "The analysis is complete. You can save it or press Restart."',
  },
  {
    label: "Greek chatbot guardrail copy does not use old English wrapper",
    file: "app/account/chatbot/page.tsx",
    forbidden: "Before food-specific advice, here are the guardrails I would keep in mind:",
  },
  {
    label: "Chat guardrails do not expose confidence heading",
    file: "lib/nutrition/chatGuardrails.ts",
    forbidden: "Confidence notes:",
  },
  {
    label: "Progress replies do not expose raw confidence label",
    file: "app/account/chatbot/page.tsx",
    forbidden: 'const confidenceLabel = isGreek ? "Σιγουριά" : "Confidence"',
  },
  {
    label: "Progress replies do not print raw confidence enum",
    file: "app/account/chatbot/page.tsx",
    forbidden: "`${confidenceLabel}: ${decision.confidence}`",
  },
  {
    label: "Account dashboard does not expose raw progress confidence label",
    file: "app/account/page.tsx",
    forbidden: "Σιγουριά:",
  },
  {
    label: "Pet detail does not expose raw progress confidence label",
    file: "app/account/pets/[id]/page.tsx",
    forbidden: "Σιγουριά:",
  },
  {
    label: "Printable timeline does not expose raw progress confidence label",
    file: "app/print/pet-timeline/[id]/page.tsx",
    forbidden: "Σιγουριά απόφασης:",
  },
  {
    label: "Account dashboard does not print raw progress confidence enum",
    file: "app/account/page.tsx",
    forbidden: "{latestProgressMetadata.progressDecisionConfidence}",
  },
  {
    label: "Pet detail does not print raw progress confidence enum",
    file: "app/account/pets/[id]/page.tsx",
    forbidden: "{progressSummary.progressDecisionConfidence}",
  },
  {
    label: "Printable timeline does not print raw progress confidence enum",
    file: "app/print/pet-timeline/[id]/page.tsx",
    forbidden: "{log.metadata?.progressDecisionConfidence ?? \"-\"}",
  },
  {
    label: "Chatbot calorie explanation does not expose RER acronym",
    file: "app/account/chatbot/page.tsx",
    forbidden: "Resting calories (RER)",
  },
  {
    label: "Chatbot calorie explanation does not expose MER/DER acronym",
    file: "app/account/chatbot/page.tsx",
    forbidden: "Base daily target (MER/DER)",
  },
  {
    label: "Pet detail does not expose RER card label",
    file: "app/account/pets/[id]/page.tsx",
    forbidden: ">RER<",
  },
  {
    label: "Pet detail does not expose MER card label",
    file: "app/account/pets/[id]/page.tsx",
    forbidden: ">MER<",
  },
  {
    label: "Printable report history does not expose RER label",
    file: "app/print/pet-report/[id]/page.tsx",
    forbidden: "<strong>RER:</strong>",
  },
  {
    label: "Printable report history does not expose MER label",
    file: "app/print/pet-report/[id]/page.tsx",
    forbidden: "<strong>MER:</strong>",
  },
];

async function runPreserveCompareIntentCheck() {
  const file = "app/account/chatbot/page.tsx";
  const content = await readFile(file, "utf8");
  const start = content.indexOf("function startNewPetFromPetChoice");
  const end = content.indexOf("async function extractIntakeFactsFromMessage", start);
  const body = start >= 0 && end > start ? content.slice(start, end) : "";

  return {
    label: "Starting a new pet preserves pending compare intent",
    file,
    ok:
      body.includes("function startNewPetFromPetChoice") &&
      !body.includes("setPendingCompareQueries([])"),
  };
}

async function runInitialCompareStartsIntakeCheck() {
  const file = "app/account/chatbot/page.tsx";
  const content = await readFile(file, "utf8");
  const start = content.indexOf('if (compareQueries.length >= 2 && step !== "analysis")');
  const end = content.indexOf("await runFoodComparison(compareQueries);", start);
  const body = start >= 0 && end > start ? content.slice(start, end) : "";

  return {
    label: "Initial compare request preserves intent and asks for pet context",
    file,
    ok:
      body.includes('if (step === "petChoice")') &&
      body.includes("setPendingCompareQueries(compareQueries)") &&
      body.includes("choose a saved pet or start a new one") &&
      !body.includes("startNewPetFromPetChoice(text, null)") &&
      !body.includes("Choose a saved pet or start with a new pet"),
  };
}

async function runCheck(check) {
  const content = await readFile(check.file, "utf8");
  const ok = content.includes(check.expected);
  return {
    ...check,
    ok,
  };
}

async function runForbiddenCheck(check) {
  const content = await readFile(check.file, "utf8");
  const ok = !content.includes(check.forbidden);
  return {
    label: check.label,
    file: check.file,
    ok,
  };
}

function renderTable(rows) {
  return [
    "| Check | File | Result |",
    "| --- | --- | --- |",
    ...rows.map(
      (row) =>
        `| ${row.label} | \`${row.file}\` | ${row.ok ? "pass" : "fail"} |`
    ),
  ].join("\n");
}

async function main() {
  const rows = [];

  for (const check of checks) {
    rows.push(await runCheck(check));
  }

  for (const check of forbiddenChecks) {
    rows.push(await runForbiddenCheck(check));
  }

  rows.push(await runPreserveCompareIntentCheck());
  rows.push(await runInitialCompareStartsIntakeCheck());

  const passed = rows.filter((row) => row.ok).length;
  const failed = rows.length - passed;

  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(
    reportPath,
    [
      "# Customer Chatbot Flow Link QA",
      "",
      `Generated: ${new Date().toISOString()}`,
      "",
      "## Summary",
      "",
      `- Checks: ${rows.length}`,
      `- Passed: ${passed}`,
      `- Failed: ${failed}`,
      "",
      "This guards the customer flow where account and pet pages should open the chatbot with the correct saved pet context, especially progress checks.",
      "",
      "## Results",
      "",
      renderTable(rows),
    ].join("\n"),
    "utf8"
  );

  console.log(
    JSON.stringify(
      {
        checked: rows.length,
        passed,
        failed,
        report: reportPath,
      },
      null,
      2
    )
  );

  if (failed > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
