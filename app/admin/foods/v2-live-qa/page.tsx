import Link from "next/link";
import { readFileSync } from "node:fs";
import path from "node:path";

type ReadinessSummary = {
  result: string;
  suitesPassing: string;
  totalChecks: string;
  failedOrReview: string;
  passRate: string;
  readinessScore: string;
  minimumReadinessScore: string;
  customerReadyCoreStatus: string;
  fullOpenAiProofStatus: string;
  coreEvidenceScore: string;
  advisoryEvidenceScore: string;
  generated: string;
  maxReportAge: string;
  deployFreshnessGate: string;
  oldestSourceReport: string;
  nextStaleReport: string;
};

type CustomerProductProgressSummary = {
  customerUxEstimate: string;
  recommendationEngineEstimate: string;
  overallSaasEstimate: string;
  latestMovement: string;
  latestNoScoreMovement: string[];
  scoreReadout: string[];
  scorecard: {
    track: string;
    current: string;
    provenNow: string;
    blocksNextMove: string;
  }[];
  whyItFeelsStuck: string[];
  nextScoreMoves: string[];
  customerUxUnlockGates: {
    gate: string;
    unlocks: string;
    evidenceNeeded: string;
  }[];
  overallLaunchBlockers: string[];
};

type CustomerLaunchTrackAuditSummary = {
  customerUxReadiness: string;
  recommendationEngineConfidence: string;
  overallSaasLaunchProgress: string;
  nextHonestUnlock: string;
  tracks: {
    track: string;
    state: string;
    currentProof: string;
    nextProofNeeded: string;
  }[];
  whyFlat: string[];
  nextActions: string[];
};

type FormatCoverageScenario = {
  id: string;
  species: string;
  format: string;
  coverageStatus: string;
  visibleFoods: string;
  holdFoods: string;
  heldExamples: string[];
  warning: string;
};

type FoodV2FormatCoverageSummary = {
  status: string;
  checked: string;
  passedWithoutWarnings: string;
  wetCannedDataGaps: string;
  safeHolds: string;
  scenarios: FormatCoverageScenario[];
};

type CustomerJourneyUnlockProofSummary = {
  result: string;
  generated: string;
  journeysChecked: string;
  evidenceMarkersChecked: string;
  unlockGatesCovered: string;
  nextManualProof: string;
  journeys: {
    id: string;
    unlockGate: string;
    evidenceMarkers: string;
    filesChecked: string;
    customerGoal: string;
  }[];
  manualFollowUp: string[];
};

type CustomerLiveJourneyProofSummary = {
  status: string;
  generated: string;
  site: string;
  stepsChecked: string;
  passed: string;
  skipped: string;
  failed: string;
  authCookieSource: string;
  unlockImpact: string;
  customerJourneysTracked: string;
  manualJourneysStillRequired: string;
  journeyChecklist: {
    journey: string;
    status: string;
    proofNeeded: string;
  }[];
  nextSteps: string[];
};

type BetaUserProofSummary = {
  status: string;
  generated: string;
  proofSource: string;
  betaUsersVerified: string;
  betaUsersNeedingReview: string;
  minimumForNextMove: string;
  missingJourneyTypes: string;
  requiredJourneyTypes: string[];
  requiredEvidence: string[];
  betaUsers: {
    user: string;
    journey: string;
    status: string;
    evidenceNotes: string;
    missingTerms: string;
  }[];
  nextAction: string;
};

function readLiveReadinessSummary(): ReadinessSummary {
  const fallback = {
    result: "Not generated",
    suitesPassing: "unknown",
    totalChecks: "unknown",
    failedOrReview: "unknown",
    passRate: "unknown",
    readinessScore: "unknown",
    minimumReadinessScore: "unknown",
    customerReadyCoreStatus: "unknown",
    fullOpenAiProofStatus: "unknown",
    coreEvidenceScore: "unknown",
    advisoryEvidenceScore: "unknown",
    generated: "unknown",
    maxReportAge: "unknown",
    deployFreshnessGate: "unknown",
    oldestSourceReport: "unknown",
    nextStaleReport: "unknown",
  };

  try {
    const report = readFileSync(
      path.join(process.cwd(), "reports/live_readiness_dashboard.md"),
      "utf8",
    );

    return {
      result: report.match(/^Result:\s*([^\n\r]+)/im)?.[1]?.trim() ?? fallback.result,
      suitesPassing:
        report.match(/- Suites passing:\s*([^\n\r]+)/i)?.[1]?.trim() ??
        fallback.suitesPassing,
      totalChecks:
        report.match(/- Total checks\/cases\/routes:\s*([^\n\r]+)/i)?.[1]?.trim() ??
        fallback.totalChecks,
      failedOrReview:
        report.match(/- Failed or needs review:\s*([^\n\r]+)/i)?.[1]?.trim() ??
        fallback.failedOrReview,
      passRate: report.match(/- Pass rate:\s*([^\n\r]+)/i)?.[1]?.trim() ?? fallback.passRate,
      readinessScore:
        report.match(/- 95% readiness score:\s*([^\n\r]+)/i)?.[1]?.trim() ??
        fallback.readinessScore,
      minimumReadinessScore:
        report.match(/- Minimum readiness score:\s*([^\n\r]+)/i)?.[1]?.trim() ??
        fallback.minimumReadinessScore,
      customerReadyCoreStatus:
        report.match(/- Customer-ready core status:\s*([^\n\r]+)/i)?.[1]?.trim() ??
        fallback.customerReadyCoreStatus,
      fullOpenAiProofStatus:
        report.match(/- Full OpenAI proof status:\s*([^\n\r]+)/i)?.[1]?.trim() ??
        fallback.fullOpenAiProofStatus,
      coreEvidenceScore:
        report.match(/- Core evidence score:\s*([^\n\r]+)/i)?.[1]?.trim() ??
        fallback.coreEvidenceScore,
      advisoryEvidenceScore:
        report.match(/- Advisory evidence score:\s*([^\n\r]+)/i)?.[1]?.trim() ??
        fallback.advisoryEvidenceScore,
      generated:
        report.match(/^Generated:\s*([^\n\r]+)/im)?.[1]?.trim() ?? fallback.generated,
      maxReportAge:
        report.match(/- Max report age:\s*([^\n\r]+)/i)?.[1]?.trim() ??
        fallback.maxReportAge,
      deployFreshnessGate:
        report.match(/- Deploy freshness gate:\s*([^\n\r]+)/i)?.[1]?.trim() ??
        fallback.deployFreshnessGate,
      oldestSourceReport:
        report.match(/- Oldest source report:\s*([^\n\r]+)/i)?.[1]?.trim() ??
        fallback.oldestSourceReport,
      nextStaleReport:
        report.match(/- Next stale report:\s*([^\n\r]+)/i)?.[1]?.trim() ??
        fallback.nextStaleReport,
    };
  } catch {
    return fallback;
  }
}

function readCustomerProductProgressSummary(): CustomerProductProgressSummary {
  const fallback = {
    customerUxEstimate: "unknown",
    recommendationEngineEstimate: "unknown",
    overallSaasEstimate: "unknown",
    latestMovement: "No product progress rubric found.",
    latestNoScoreMovement: [
      "No latest no-score movement has been recorded yet.",
    ],
    scoreReadout: [
      "Customer UX readiness, recommendation engine confidence, and overall SaaS launch progress are tracked separately.",
      "A high automated score does not mean the customer-facing journey is already polished.",
      "The next visible movement needs fresh customer journey proof, not just another merge.",
    ],
    scorecard: [
      {
        track: "Customer-facing journey",
        current: "unknown",
        provenNow:
          "Protected code paths exist for recommendations, selected food, grams/day, save, report, timeline, and progress return.",
        blocksNextMove:
          "Needs fresh logged-in production journey proof with a normal customer flow.",
      },
    ],
    whyItFeelsStuck: [
      "Customer progress moves only when a real customer-visible risk is reduced.",
    ],
    nextScoreMoves: [
      "Run live chatbot QA, fix real recommendation mistakes, and lock fixes with tests.",
    ],
    customerUxUnlockGates: [
      {
        gate: "Real beta-user proof",
        unlocks: "88-90% Customer UX readiness",
        evidenceNeeded:
          "Prove that real beta users can complete signup/login, chatbot intake, food choice, grams/day, save, report, timeline, progress, and feedback without manual explanation.",
      },
    ],
    overallLaunchBlockers: [
      "Overall SaaS launch progress still depends on live OpenAI proof, monitoring, legal review, and business readiness.",
    ],
  };

  try {
    const doc = readFileSync(
      path.join(process.cwd(), "docs/product-progress-score.md"),
      "utf8",
    );

    const customerUxEstimate =
      doc.match(/Customer UX readiness is currently \*\*([^*]+)\*\*/i)?.[1]?.trim() ??
      fallback.customerUxEstimate;
    const recommendationEngineEstimate =
      doc
        .match(/Recommendation engine beta confidence is currently \*\*([^*]+)\*\*/i)?.[1]
        ?.trim() ?? fallback.recommendationEngineEstimate;
    const overallSaasEstimate =
      doc.match(/Overall SaaS launch progress is currently \*\*([^*]+)\*\*/i)?.[1]?.trim() ??
      fallback.overallSaasEstimate;
    const latestMovement =
      doc.match(/## Latest Movement\s+([\s\S]*?)\n## /i)?.[1]?.trim().split("\n")[0] ??
      fallback.latestMovement;
    const latestNoScoreSection =
      doc.match(/## Latest No-Score Movement\s+([\s\S]*?)\n## /i)?.[1]?.trim() ?? "";
    const whySection =
      doc.match(/## Why It Feels Stuck\s+([\s\S]*?)\n## /i)?.[1]?.trim() ?? "";
    const scorecardSection =
      doc.match(/## Customer UX Scorecard\s+([\s\S]*?)\n## /i)?.[1]?.trim() ?? "";
    const nextSection =
      doc.match(/## Next Score Moves\s+([\s\S]*?)\n## /i)?.[1]?.trim() ?? "";
    const unlockGateSection =
      doc.match(/## Customer UX Unlock Gates\s+([\s\S]*?)\n## /i)?.[1]?.trim() ?? "";
    const blockersSection =
      doc.match(/## Overall SaaS Blockers\s+([\s\S]*?)\n## /i)?.[1]?.trim() ?? "";

    const whyItFeelsStuck =
      whySection
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.startsWith("- "))
        .map((line) => line.replace(/^- /, ""))
        .slice(0, 5) || fallback.whyItFeelsStuck;
    const latestNoScoreMovement =
      latestNoScoreSection
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.startsWith("- "))
        .map((line) => line.replace(/^- /, ""))
        .slice(0, 5);

    const nextScoreMoves =
      nextSection
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => /^\d+\./.test(line))
        .map((line) => line.replace(/^\d+\.\s*/, ""))
        .slice(0, 5) || fallback.nextScoreMoves;
    const overallLaunchBlockers =
      blockersSection
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.startsWith("- "))
        .map((line) => line.replace(/^- /, ""))
        .slice(0, 5) || fallback.overallLaunchBlockers;
    const scorecard = scorecardSection
      .split("\n")
      .map((line) => line.trim())
      .filter(
        (line) =>
          line.startsWith("| ") &&
          !line.includes("---") &&
          !line.includes("Track |")
      )
      .map((line) => {
        const cells = line
          .split("|")
          .map((cell) => cell.trim())
          .filter(Boolean);

        return {
          track: cells[0] ?? "Unknown track",
          current: cells[1] ?? "unknown",
          provenNow: cells[2] ?? "Evidence not listed.",
          blocksNextMove: cells[3] ?? "Next blocker not listed.",
        };
      })
      .slice(0, 5);
    const customerUxUnlockGates = unlockGateSection
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.startsWith("| ") && !line.includes("---") && !line.includes("Gate |"))
      .map((line) => {
        const cells = line
          .split("|")
          .map((cell) => cell.trim())
          .filter(Boolean);

        return {
          gate: cells[0] ?? "Unknown gate",
          unlocks: cells[1] ?? "unknown",
          evidenceNeeded: cells[2] ?? "Evidence needed is not listed.",
        };
      })
      .slice(0, 5);

    return {
      customerUxEstimate,
      recommendationEngineEstimate,
      overallSaasEstimate,
      latestMovement,
      latestNoScoreMovement:
        latestNoScoreMovement.length > 0
          ? latestNoScoreMovement
          : fallback.latestNoScoreMovement,
      scoreReadout: [
        `Customer UX readiness: ${customerUxEstimate}.`,
        `Recommendation engine beta confidence: ${recommendationEngineEstimate}.`,
        `Overall SaaS launch progress: ${overallSaasEstimate}.`,
      ],
      scorecard: scorecard.length > 0 ? scorecard : fallback.scorecard,
      whyItFeelsStuck: whyItFeelsStuck.length > 0 ? whyItFeelsStuck : fallback.whyItFeelsStuck,
      nextScoreMoves: nextScoreMoves.length > 0 ? nextScoreMoves : fallback.nextScoreMoves,
      customerUxUnlockGates:
        customerUxUnlockGates.length > 0
          ? customerUxUnlockGates
          : fallback.customerUxUnlockGates,
      overallLaunchBlockers:
        overallLaunchBlockers.length > 0
          ? overallLaunchBlockers
          : fallback.overallLaunchBlockers,
    };
  } catch {
    return fallback;
  }
}

function readCustomerLaunchTrackAuditSummary(): CustomerLaunchTrackAuditSummary {
  const fallback = {
    customerUxReadiness: "unknown",
    recommendationEngineConfidence: "unknown",
    overallSaasLaunchProgress: "unknown",
    nextHonestUnlock:
      "Run real beta-user proof across dog, cat, and returning saved-pet journeys.",
    tracks: [
      {
        track: "Final chatbot experience",
        state: "Partial",
        currentProof:
          "Controlled QA proves the main recommendation journey, but real-user proof is still needed.",
        nextProofNeeded:
          "A beta user completes intake, recommendations, food choice, grams/day, save, and next steps without help.",
      },
    ],
    whyFlat: [
      "Customer UX readiness moves only when customer-facing proof improves.",
    ],
    nextActions: [
      "Run beta-user proof with one dog owner, one cat owner, and one returning saved-pet user.",
    ],
  };

  try {
    const doc = readFileSync(
      path.join(process.cwd(), "docs/customer-launch-10-track-audit.md"),
      "utf8",
    );
    const currentPosition =
      doc.match(/## Current Position\s+([\s\S]*?)\n## /i)?.[1]?.trim() ?? "";
    const trackAudit =
      doc.match(/## Track Audit\s+([\s\S]*?)\n## /i)?.[1]?.trim() ?? "";
    const whyFlat =
      doc.match(/## Why The Percentage May Stay Flat\s+([\s\S]*?)\n## /i)?.[1]?.trim() ??
      "";
    const nextActions =
      doc.match(/## Next Actions\s+([\s\S]*)/i)?.[1]?.trim() ?? "";
    const tracks = trackAudit
      .split("\n")
      .map((line) => line.trim())
      .filter(
        (line) =>
          line.startsWith("| ") &&
          !line.includes("---") &&
          !line.includes("Track |"),
      )
      .map((line) => {
        const cells = line
          .split("|")
          .map((cell) => cell.trim())
          .filter(Boolean);

        return {
          track: cells[0] ?? "Unknown track",
          state: cells[1] ?? "unknown",
          currentProof: cells[2] ?? "Current proof is not listed.",
          nextProofNeeded: cells[3] ?? "Next proof is not listed.",
        };
      });

    return {
      customerUxReadiness:
        currentPosition.match(/Customer UX readiness:\s*([^\n\r]+)/i)?.[1]?.trim() ??
        fallback.customerUxReadiness,
      recommendationEngineConfidence:
        currentPosition
          .match(/Recommendation engine beta confidence:\s*([^\n\r]+)/i)?.[1]
          ?.trim() ?? fallback.recommendationEngineConfidence,
      overallSaasLaunchProgress:
        currentPosition.match(/Overall SaaS launch progress:\s*([^\n\r]+)/i)?.[1]?.trim() ??
        fallback.overallSaasLaunchProgress,
      nextHonestUnlock:
        currentPosition.match(/Next honest unlock:\s*([^\n\r]+)/i)?.[1]?.trim() ??
        fallback.nextHonestUnlock,
      tracks: tracks.length > 0 ? tracks : fallback.tracks,
      whyFlat: (() => {
        const items = whyFlat
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.startsWith("- "))
          .map((line) => line.replace(/^- /, ""));
        return items.length > 0 ? items : fallback.whyFlat;
      })(),
      nextActions: (() => {
        const items = nextActions
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => /^\d+\./.test(line))
          .map((line) => line.replace(/^\d+\.\s*/, ""));
        return items.length > 0 ? items : fallback.nextActions;
      })(),
    };
  } catch {
    return fallback;
  }
}

function readFoodV2FormatCoverageSummary(): FoodV2FormatCoverageSummary {
  const fallback = {
    status: "Not generated",
    checked: "unknown",
    passedWithoutWarnings: "unknown",
    wetCannedDataGaps: "unknown",
    safeHolds: "unknown",
    scenarios: [],
  };

  try {
    const report = readFileSync(
      path.join(process.cwd(), "reports/food_v2_format_coverage_qa.md"),
      "utf8",
    );
    const scenarios = [...report.matchAll(/### ([^\n\r]+)([\s\S]*?)(?=\n### |\n*$)/g)].map(
      ([, id, block]) => {
        const warningLines = [...block.matchAll(/^- (.+)$/gm)]
          .map((match) => match[1]?.trim() ?? "")
          .filter((line) => line && line !== "None");

        return {
          id: id.trim(),
          species: block.match(/- Species:\s*([^\n\r]+)/i)?.[1]?.trim() ?? "unknown",
          format:
            block.match(/- Requested format:\s*([^\n\r]+)/i)?.[1]?.trim() ?? "unknown",
          coverageStatus:
            block.match(/- Coverage status:\s*([^\n\r]+)/i)?.[1]?.trim() ??
            "unknown",
          visibleFoods:
            block.match(/- Visible premium\/value foods:\s*([^\n\r]+)/i)?.[1]?.trim() ??
            "unknown",
          holdFoods:
            block.match(/- Hold foods:\s*([^\n\r]+)/i)?.[1]?.trim() ?? "unknown",
          heldExamples:
            block
              .split("Held examples:")[1]
              ?.split("\nWarnings:")[0]
              ?.split("\n")
              .map((line) => line.trim())
              .filter((line) => line.startsWith("- ") && line !== "- None")
              .map((line) => line.replace(/^- /, ""))
              .slice(0, 2) ?? [],
          warning: warningLines[0] ?? "None",
        };
      },
    );
    const wetGapCount =
      report.match(/Wet\/canned data gaps:\s*([^\n\r]+)/i)?.[1]?.trim() ?? "unknown";
    const safeHoldCount =
      report.match(/Safe holds:\s*([^\n\r]+)/i)?.[1]?.trim() ?? "unknown";

    return {
      status: wetGapCount === "0" ? "PASS" : "DATA GAP",
      checked: report.match(/Checked:\s*([^\n\r]+)/i)?.[1]?.trim() ?? fallback.checked,
      passedWithoutWarnings:
        report.match(/Passed without warnings:\s*([^\n\r]+)/i)?.[1]?.trim() ??
        fallback.passedWithoutWarnings,
      wetCannedDataGaps: wetGapCount,
      safeHolds: safeHoldCount,
      scenarios,
    };
  } catch {
    return fallback;
  }
}

function readCustomerJourneyUnlockProofSummary(): CustomerJourneyUnlockProofSummary {
  const fallback = {
    result: "Not generated",
    generated: "unknown",
    journeysChecked: "unknown",
    evidenceMarkersChecked: "unknown",
    unlockGatesCovered: "unknown",
    nextManualProof: "Run the customer journey unlock gate QA.",
    journeys: [],
    manualFollowUp: [
      "Run qa:customer-journey-unlock-gate to generate the proof report.",
      "Then repeat the protected customer journeys on production with a logged-in customer account.",
    ],
  };

  try {
    const report = readFileSync(
      path.join(process.cwd(), "reports/customer_journey_unlock_gate_qa.md"),
      "utf8",
    );
    const journeyRows = report
      .split("\n")
      .map((line) => line.trim())
      .filter(
        (line) =>
          line.startsWith("| ") &&
          !line.includes("---") &&
          !line.includes("Journey |")
      )
      .map((line) => {
        const cells = line
          .split("|")
          .map((cell) => cell.trim())
          .filter(Boolean);

        return {
          id: cells[0] ?? "unknown",
          unlockGate: cells[1] ?? "unknown",
          evidenceMarkers: cells[2] ?? "unknown",
          filesChecked: cells[3] ?? "unknown",
          customerGoal: cells[4] ?? "Customer goal not listed.",
        };
      });
    const manualSection =
      report.match(/## Manual Live Follow-Up\s+([\s\S]*?)\n## /i)?.[1]?.trim() ??
      report.match(/## Manual Live Follow-Up\s+([\s\S]*)/i)?.[1]?.trim() ??
      "";
    const manualFollowUp = manualSection
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => /^\d+\./.test(line))
      .map((line) => line.replace(/^\d+\.\s*/, ""));

    return {
      result: report.match(/- Result:\s*([^\n\r]+)/i)?.[1]?.trim() ?? fallback.result,
      generated:
        report.match(/^Generated:\s*([^\n\r]+)/im)?.[1]?.trim() ??
        fallback.generated,
      journeysChecked:
        report.match(/- Journeys checked:\s*([^\n\r]+)/i)?.[1]?.trim() ??
        fallback.journeysChecked,
      evidenceMarkersChecked:
        report.match(/- Evidence markers checked:\s*([^\n\r]+)/i)?.[1]?.trim() ??
        fallback.evidenceMarkersChecked,
      unlockGatesCovered:
        report.match(/- Unlock gates covered:\s*([^\n\r]+)/i)?.[1]?.trim() ??
        fallback.unlockGatesCovered,
      nextManualProof:
        report.match(/- Next manual proof:\s*([^\n\r]+)/i)?.[1]?.trim() ??
        fallback.nextManualProof,
      journeys: journeyRows,
      manualFollowUp:
        manualFollowUp.length > 0 ? manualFollowUp : fallback.manualFollowUp,
    };
  } catch {
    return fallback;
  }
}

function readCustomerLiveJourneyProofSummary(): CustomerLiveJourneyProofSummary {
  const fallback = {
    status: "Not generated",
    generated: "unknown",
    site: "https://nutritail.ai",
    stepsChecked: "unknown",
    passed: "unknown",
    skipped: "unknown",
    failed: "unknown",
    authCookieSource: "missing",
    unlockImpact:
      "Run qa:customer-live-journey-proof with an authenticated QA cookie to produce non-destructive live journey evidence.",
    customerJourneysTracked: "unknown",
    manualJourneysStillRequired: "unknown",
    journeyChecklist: [
      {
        journey: "New pet recommendation",
        status: "not generated",
        proofNeeded:
          "Run the live proof and then finish the customer-facing browser flow.",
      },
    ],
    nextSteps: [
      "Put a QA account Cookie header in .qa-secrets/nutritail-auth-cookie.txt.",
      "Run npm.cmd run qa:customer-live-journey-proof.",
      "Finish the manual browser steps: choose food, grams/day, save, report, timeline, and progress.",
    ],
  };

  try {
    const report = readFileSync(
      path.join(process.cwd(), "reports/customer_live_journey_proof_qa.md"),
      "utf8",
    );
    const completeSection =
      report
        .match(/## To Complete The (?:Current|\d+(?:-\d+)?) Customer UX Gate\s+([\s\S]*)/i)?.[1]
        ?.trim() ?? "";
    const nextSteps = completeSection
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => /^\d+\./.test(line))
      .map((line) => line.replace(/^\d+\.\s*/, ""));
    const checklistSection =
      report.match(/## Customer Journey Proof Checklist\s+([\s\S]*?)\n## /i)?.[1]?.trim() ??
      "";
    const journeyChecklist = checklistSection
      .split("\n")
      .map((line) => line.trim())
      .filter(
        (line) =>
          line.startsWith("| ") &&
          !line.includes("---") &&
          !line.includes("Journey |")
      )
      .map((line) => {
        const cells = line
          .split("|")
          .map((cell) => cell.trim())
          .filter(Boolean);

        return {
          journey: cells[0] ?? "Unknown journey",
          status: cells[1] ?? "unknown",
          proofNeeded: cells[2] ?? "Proof needed is not listed.",
        };
      });

    return {
      status: report.match(/^Status:\s*([^\n\r]+)/im)?.[1]?.trim() ?? fallback.status,
      generated:
        report.match(/^Generated:\s*([^\n\r]+)/im)?.[1]?.trim() ??
        fallback.generated,
      site: report.match(/^Site:\s*([^\n\r]+)/im)?.[1]?.trim() ?? fallback.site,
      stepsChecked:
        report.match(/- Steps checked:\s*([^\n\r]+)/i)?.[1]?.trim() ??
        fallback.stepsChecked,
      passed: report.match(/- Passed:\s*([^\n\r]+)/i)?.[1]?.trim() ?? fallback.passed,
      skipped:
        report.match(/- Skipped:\s*([^\n\r]+)/i)?.[1]?.trim() ??
        fallback.skipped,
      failed: report.match(/- Failed:\s*([^\n\r]+)/i)?.[1]?.trim() ?? fallback.failed,
      authCookieSource:
        report.match(/- Auth cookie source:\s*([^\n\r]+)/i)?.[1]?.trim() ??
        fallback.authCookieSource,
      unlockImpact:
        report.match(/- Unlock impact:\s*([^\n\r]+)/i)?.[1]?.trim() ??
        fallback.unlockImpact,
      customerJourneysTracked:
        report.match(/- Customer journeys tracked:\s*([^\n\r]+)/i)?.[1]?.trim() ??
        fallback.customerJourneysTracked,
      manualJourneysStillRequired:
        report.match(/- Manual journeys still required:\s*([^\n\r]+)/i)?.[1]?.trim() ??
        fallback.manualJourneysStillRequired,
      journeyChecklist:
        journeyChecklist.length > 0 ? journeyChecklist : fallback.journeyChecklist,
      nextSteps: nextSteps.length > 0 ? nextSteps : fallback.nextSteps,
    };
  } catch {
    return fallback;
  }
}

function readBetaUserProofSummary(): BetaUserProofSummary {
  const fallback = {
    status: "Not generated",
    generated: "unknown",
    proofSource: "missing",
    betaUsersVerified: "0",
    betaUsersNeedingReview: "0",
    minimumForNextMove: "3 complete beta journeys",
    missingJourneyTypes:
      "dog owner journey, cat owner journey, returning saved-pet journey",
    requiredJourneyTypes: [
      "dog owner journey",
      "cat owner journey",
      "returning saved-pet journey",
    ],
    requiredEvidence: [
      "signup/login",
      "pet intake",
      "food cards",
      "selected food",
      "grams/day",
      "save",
      "report",
      "timeline or progress",
      "feedback",
      "no manual help",
    ],
    betaUsers: [],
    nextAction:
      "Collect at least three real beta-user journeys before moving Customer UX above 88%.",
  };

  try {
    const report = readFileSync(
      path.join(process.cwd(), "reports/beta_user_proof_qa.md"),
      "utf8",
    );
    const requiredSection =
      report.match(/## Required Evidence\s+([\s\S]*?)\n## /i)?.[1]?.trim() ?? "";
    const requiredEvidence = requiredSection
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.startsWith("- "))
      .map((line) => line.replace(/^- /, ""));
    const requiredJourneySection =
      report.match(/## Required Journey Types\s+([\s\S]*?)\n## /i)?.[1]?.trim() ?? "";
    const requiredJourneyTypes = requiredJourneySection
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.startsWith("- "))
      .map((line) => line.replace(/^- /, ""));
    const betaUsers = report
      .split("\n")
      .map((line) => line.trim())
      .filter(
        (line) =>
          line.startsWith("| ") &&
          !line.includes("---") &&
          !line.includes("User |")
      )
      .map((line) => {
        const cells = line
          .split("|")
          .map((cell) => cell.trim())
          .filter(Boolean);

        return {
          user: cells[0] ?? "unknown",
          journey: cells[1] ?? "unknown",
          status: cells[2] ?? "unknown",
          evidenceNotes: cells[3] ?? "No evidence notes yet.",
          missingTerms: cells[4] ?? "-",
        };
      });
    const nextAction =
      report.match(/## Next Action\s+([\s\S]*)/i)?.[1]?.trim() ?? fallback.nextAction;

    return {
      status: report.match(/^Status:\s*([^\n\r]+)/im)?.[1]?.trim() ?? fallback.status,
      generated:
        report.match(/^Generated:\s*([^\n\r]+)/im)?.[1]?.trim() ??
        fallback.generated,
      proofSource:
        report.match(/- Proof source:\s*([^\n\r]+)/i)?.[1]?.trim() ??
        fallback.proofSource,
      betaUsersVerified:
        report.match(/- Beta users verified:\s*([^\n\r]+)/i)?.[1]?.trim() ??
        fallback.betaUsersVerified,
      betaUsersNeedingReview:
        report.match(/- Beta users needing review:\s*([^\n\r]+)/i)?.[1]?.trim() ??
        fallback.betaUsersNeedingReview,
      minimumForNextMove:
        report.match(/- Minimum for next score move:\s*([^\n\r]+)/i)?.[1]?.trim() ??
        fallback.minimumForNextMove,
      missingJourneyTypes:
        report.match(/- Missing required journey types:\s*([^\n\r]+)/i)?.[1]?.trim() ??
        fallback.missingJourneyTypes,
      requiredJourneyTypes:
        requiredJourneyTypes.length > 0
          ? requiredJourneyTypes
          : fallback.requiredJourneyTypes,
      requiredEvidence:
        requiredEvidence.length > 0 ? requiredEvidence : fallback.requiredEvidence,
      betaUsers,
      nextAction,
    };
  } catch {
    return fallback;
  }
}

const liveChecks = [
  {
    title: "Deploy sanity",
    checks: [
      "Open https://nutritail.ai and confirm the homepage loads.",
      "Open /login and confirm auth pages render with the current design.",
      "Open /account/chatbot after login and confirm the guided intake starts.",
      "Open /account and confirm the customer dashboard renders after login.",
      "Confirm /sitemap.xml, /robots.txt, /manifest.webmanifest, and /opengraph-image respond.",
    ],
  },
  {
    title: "Admin access",
    checks: [
      "Open /admin and confirm the admin nav loads.",
      "Open /admin/foods/v2-preview and confirm the page does not redirect after login.",
      "Open /admin/foods/v2-review and confirm summary cards render.",
      "Open /admin/foods/v2-recommendation-lab and confirm the ranking form renders.",
    ],
  },
  {
    title: "Preview flow",
    checks: [
      "Click Download Template and confirm a CSV downloads.",
      "Upload the template or sample CSV.",
      "Confirm missing fields, warnings, importable rows, and blocked rows appear.",
      "Click Check Existing before committing any real rows.",
    ],
  },
  {
    title: "Commit flow",
    checks: [
      "Commit only rows marked importable.",
      "Confirm the result shows inserted, updated, blocked, failed, and audit counts.",
      "Open Food V2 Review after commit.",
      "Confirm the committed row appears in recent products.",
    ],
  },
  {
    title: "Export flow",
    checks: [
      "Click Export Products CSV from Food V2 Review.",
      "Click Export Audit CSV from Food V2 Review.",
      "Open both files and confirm headers are readable.",
      "Confirm blocked rows stay visible in audit exports.",
    ],
  },
  {
    title: "Recommendation smoke",
    checks: [
      "Run a 30kg adult dog scenario in Recommendation Lab.",
      "Confirm the top pick is not small/mini positioned.",
      "Run a chicken allergy scenario and confirm chicken/poultry is not recommended.",
      "Run urinary cat and growth puppy scenarios and review the QA verdict.",
    ],
  },
  {
    title: "Account progress smoke",
    checks: [
      "Open /account/chatbot after login and choose a saved pet.",
      "Click Progress check and send a metric-only update such as 7 κιλά.",
      "Open /account/pets/[id] and confirm Latest progress and Progress timeline render.",
      "Open /print/pet-timeline/[id] and confirm progress check-ins appear in the printable timeline.",
    ],
  },
  {
    title: "Mobile customer journey",
    checks: [
      "Test on a phone-sized viewport from /login through /account without horizontal scrolling.",
      "Open /account/chatbot and confirm saved-pet cards, starter cards, quick replies, and sticky input fit the screen.",
      "Run chatbot intake until recommendations appear and confirm long food names wrap without covering buttons.",
      "Save an analysis and confirm Open profile, Open report, and New analysis actions are easy to tap.",
      "Open /account/pets/[id] and confirm Latest result, progress, report, and timeline actions stack cleanly.",
      "Open printable report and timeline on mobile and confirm headings, cards, and tables remain readable.",
    ],
  },
];

const liveUrls = [
  "/account",
  "/account/chatbot",
  "/account/pets",
  "/login",
  "/register",
  "/print/pet-report/test-id",
  "/print/pet-timeline/test-id",
  "/admin/foods/v2-guide",
  "/admin/foods/v2-preview",
  "/admin/foods/v2-review",
  "/admin/foods/v2-nutrient-gaps",
  "/admin/foods/v2-recommendation-lab",
  "/admin/chat-feedback",
  "/api/admin/foods/v2-template",
  "/api/admin/foods/v2-export?type=products",
  "/api/admin/foods/v2-export?type=audit",
];

export default function FoodV2LiveQaPage() {
  const readiness = readLiveReadinessSummary();
  const productProgress = readCustomerProductProgressSummary();
  const launchTrackAudit = readCustomerLaunchTrackAuditSummary();
  const formatCoverage = readFoodV2FormatCoverageSummary();
  const customerJourneyProof = readCustomerJourneyUnlockProofSummary();
  const customerLiveJourneyProof = readCustomerLiveJourneyProofSummary();
  const betaUserProof = readBetaUserProofSummary();
  const isPassing = readiness.result === "PASS";

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Live deploy QA
        </p>
        <h2 className="mt-2 text-2xl font-bold text-black">
          Food V2 Live Checklist
        </h2>
        <p className="mt-2 max-w-3xl text-gray-600">
          Run this checklist after each merge/deploy that touches the Food V2
          importer, recommendation flow, or customer progress experience. It
          keeps the live check focused and repeatable.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/admin/foods/v2-preview"
            className="rounded-lg bg-black px-4 py-2 text-sm text-white transition hover:opacity-90"
          >
            Open Preview
          </Link>
          <Link
            href="/admin/foods/v2-review"
            className="rounded-lg border border-black px-4 py-2 text-sm text-black transition hover:bg-gray-100"
          >
            Open Review
          </Link>
          <Link
            href="/admin/foods/v2-recommendation-lab"
            className="rounded-lg border border-black px-4 py-2 text-sm text-black transition hover:bg-gray-100"
          >
            Open Lab
          </Link>
          <Link
            href="/admin/foods/v2-guide"
            className="rounded-lg border border-black px-4 py-2 text-sm text-black transition hover:bg-gray-100"
          >
            Open Guide
          </Link>
          <a
            href="https://github.com/EmmMall92/nutritail-ai/blob/master/reports/live_readiness_dashboard.md"
            className="rounded-lg border border-black px-4 py-2 text-sm text-black transition hover:bg-gray-100"
            target="_blank"
            rel="noreferrer"
          >
            Readiness Report
          </a>
        </div>
      </div>

      <div
        className="rounded-2xl border border-slate-200 bg-slate-950 p-5 text-white shadow-sm"
        data-testid="progress-truth-panel"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-300">
              Progress truth panel
            </p>
            <h3 className="mt-2 text-2xl font-black">
              NutriTail is past the old 78-80% foundation stage.
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-200">
              The next percentage jump needs real customer evidence, not just
              another merge. Use this panel when progress feels stuck: the
              engine, the customer journey, and the wider SaaS launch are scored
              separately on purpose.
            </p>
          </div>
          <div className="grid w-full gap-3 sm:grid-cols-3 lg:max-w-xl">
            <div className="rounded-xl border border-slate-700 bg-white/10 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-300">
                Customer UX
              </p>
              <p className="mt-1 text-3xl font-black">
                {productProgress.customerUxEstimate}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-300">
                Needs broader beta-user proof before moving higher.
              </p>
            </div>
            <div className="rounded-xl border border-emerald-500/50 bg-emerald-400/10 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-100">
                Recommendation
              </p>
              <p className="mt-1 text-3xl font-black">
                {productProgress.recommendationEngineEstimate}
              </p>
              <p className="mt-1 text-xs leading-5 text-emerald-100">
                Food V2, rules, OpenAI extraction, and dog/cat QA are strong.
              </p>
            </div>
            <div className="rounded-xl border border-amber-500/50 bg-amber-400/10 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-amber-100">
                SaaS launch
              </p>
              <p className="mt-1 text-3xl font-black">
                {productProgress.overallSaasEstimate}
              </p>
              <p className="mt-1 text-xs leading-5 text-amber-100">
                Still depends on billing, legal, monitoring, and beta feedback.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-700 bg-white/10 p-4">
            <p className="text-sm font-semibold">What proves the next move</p>
            <p className="mt-2 text-sm leading-6 text-slate-200">
              One dog owner, one cat owner, and one returning saved-pet user
              must complete signup/login, chatbot intake, food choice, grams per
              day, save, report, timeline or progress, and feedback without
              manual help.
            </p>
          </div>
          <div className="rounded-xl border border-slate-700 bg-white/10 p-4">
            <p className="text-sm font-semibold">What does not prove it</p>
            <p className="mt-2 text-sm leading-6 text-slate-200">
              Small internal polish, refactors, or green checks alone. They keep
              the product healthy, but the next customer score needs real beta
              journey evidence.
            </p>
          </div>
          <div className="rounded-xl border border-slate-700 bg-white/10 p-4">
            <p className="text-sm font-semibold">Command to unlock the gate</p>
            <p className="mt-2 rounded-lg border border-slate-700 bg-black/30 px-3 py-2 font-mono text-xs text-slate-100">
              npm.cmd run qa:beta-user-proof-contract
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-200">
              It should PASS only after the real beta proof file contains the
              required journeys.
            </p>
          </div>
        </div>
      </div>

      <div
        className="rounded-2xl border border-blue-200 bg-blue-50 p-5 text-blue-950 shadow-sm"
        data-testid="customer-product-progress-summary"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-wide">
              Customer product progress
            </p>
            <div className="mt-2 grid gap-3 lg:grid-cols-3">
              <div className="rounded-xl border border-blue-200 bg-white/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                  Customer UX readiness
                </p>
                <p className="mt-1 text-2xl font-bold">
                  {productProgress.customerUxEstimate}
                </p>
                <p className="mt-1 text-sm text-blue-900">
                  How complete the live customer journey feels: chatbot, food
                  choice, grams/day, save, report, and return progress.
                </p>
              </div>
              <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-green-950">
                <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
                  Recommendation engine
                </p>
                <p className="mt-1 text-2xl font-bold">
                  {productProgress.recommendationEngineEstimate}
                </p>
                <p className="mt-1 text-sm">
                  Food V2 retrieval, deterministic ranking, OpenAI fact
                  extraction, rules, and dog/cat QA confidence.
                </p>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                  Overall SaaS launch
                </p>
                <p className="mt-1 text-2xl font-bold">
                  {productProgress.overallSaasEstimate}
                </p>
                <p className="mt-1 text-sm">
                  Includes business layer, beta limits, payments direction,
                  monitoring, legal/trust readiness, and production operations.
                </p>
              </div>
            </div>
            <p className="mt-2 max-w-3xl text-sm">
              These are separate from automated live readiness. Customer UX moves
              when a real pet owner flow becomes clearer, safer, or more
              beautiful. Recommendation engine confidence moves when Food V2,
              ranking, OpenAI extraction, and QA evidence improve. Overall SaaS
              launch progress moves only when the wider business and production
              readiness gaps close too.
            </p>

            <div
              className="mt-4 rounded-xl border border-slate-200 bg-white/85 p-4 text-slate-950"
              data-testid="customer-progress-ladder"
            >
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm font-semibold">Progress ladder</p>
                  <p className="mt-1 text-sm text-slate-700">
                    This is why the score can look flat even while the product
                    improves: each band needs stronger proof than the previous one.
                  </p>
                </div>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-800">
                  Current band: 88-90% launch hardening
                </span>
              </div>
              <div className="mt-4 grid gap-3 lg:grid-cols-4">
                {[
                  {
                    label: "Old foundation",
                    value: "78-80%",
                    copy: "Passed. Do not treat this as the current state.",
                  },
                  {
                    label: "Customer UX",
                    value: productProgress.customerUxEstimate,
                    copy: "Controlled journey proof exists; beta-user proof unlocks the next move.",
                  },
                  {
                    label: "Engine beta confidence",
                    value: productProgress.recommendationEngineEstimate,
                    copy: "Food V2, rules, OpenAI extraction, and dog/cat QA are beta-candidate.",
                  },
                  {
                    label: "SaaS launch",
                    value: productProgress.overallSaasEstimate,
                    copy: "Needs business enforcement, trust/legal review, monitoring, and beta feedback.",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                  >
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-600">
                      {item.label}
                    </p>
                    <p className="mt-1 text-xl font-black">{item.value}</p>
                    <p className="mt-2 text-xs leading-5 text-slate-700">{item.copy}</p>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-indigo-950"
              data-testid="customer-progress-proof-gate"
            >
              <p className="text-sm font-semibold">Why the score can feel stuck</p>
              <p className="mt-2 text-sm leading-6">
                The project is no longer in the 78-80% foundation stage. The
                next visible movement is a proof gate: real beta users must
                complete the customer journey without us explaining the flow.
              </p>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <div className="rounded-lg border border-indigo-200 bg-white/80 p-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-indigo-700">
                    Current proof level
                  </p>
                  <p className="mt-1 text-sm">
                    Automated QA is strong, but live customer evidence is still
                    the limiter.
                  </p>
                </div>
                <div className="rounded-lg border border-indigo-200 bg-white/80 p-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-indigo-700">
                    What unlocks the next jump
                  </p>
                  <p className="mt-1 text-sm">
                    One dog owner, one cat owner, and one returning saved-pet
                    journey completed end to end.
                  </p>
                </div>
                <div className="rounded-lg border border-indigo-200 bg-white/80 p-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-indigo-700">
                    What does not move it
                  </p>
                  <p className="mt-1 text-sm">
                    Small merges alone. They help quality, but the next score
                    jump needs real journey proof.
                  </p>
                </div>
              </div>
            </div>

            <div
              className="mt-4 grid gap-3 sm:grid-cols-3"
              data-testid="customer-product-progress-readout"
            >
              {productProgress.scoreReadout.map((item) => (
                <div
                  key={item}
                  className="rounded-xl border border-blue-200 bg-white/80 p-3 text-sm font-medium text-blue-950"
                >
                  {item}
                </div>
              ))}
            </div>

            <div
              className="mt-4 rounded-xl border border-blue-200 bg-white/80 p-4"
              data-testid="customer-ux-scorecard"
            >
              <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-sm font-semibold">Customer UX scorecard</p>
                  <p className="mt-1 text-sm text-blue-900">
                    This separates what is already proven from what still blocks
                    the next score movement.
                  </p>
                </div>
                <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-900">
                  Current customer UX: {productProgress.customerUxEstimate}
                </span>
              </div>
              <div className="mt-4 grid gap-3 lg:grid-cols-5">
                {productProgress.scorecard.map((item) => (
                  <article
                    key={`${item.track}-${item.current}`}
                    className="rounded-xl border border-blue-100 bg-blue-50/70 p-3 text-sm text-blue-950"
                  >
                    <p className="font-semibold">{item.track}</p>
                    <p className="mt-2 inline-flex rounded-lg border border-blue-200 bg-white/80 px-2 py-1 text-xs font-bold">
                      {item.current}
                    </p>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-blue-700">
                      Proven now
                    </p>
                    <p className="mt-1 text-xs leading-5">{item.provenNow}</p>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-amber-700">
                      Blocks next move
                    </p>
                    <p className="mt-1 text-xs leading-5">{item.blocksNextMove}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
          <Link
            href="https://github.com/EmmMall92/nutritail-ai/blob/master/docs/product-progress-score.md"
            className="rounded-lg border border-blue-900 px-4 py-2 text-sm font-semibold text-blue-950 transition hover:bg-blue-100"
            target="_blank"
            rel="noreferrer"
          >
            Open rubric
          </Link>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <div
            className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950 lg:col-span-2"
            data-testid="customer-product-next-unlock"
          >
            <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
              <div>
                <p className="text-sm font-semibold">Next customer score unlock</p>
                <p className="mt-2 text-2xl font-black">
                  {productProgress.customerUxUnlockGates[0]?.unlocks ??
                    "88-90% Customer UX readiness"}
                </p>
                <p className="mt-2 text-sm leading-6">
                  The next visible movement is not another merge by itself. It is
                  proof that real beta users can finish the whole nutrition
                  journey without manual explanation.
                </p>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-white/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  Evidence needed next
                </p>
                <p className="mt-2 text-sm font-semibold">
                  {productProgress.customerUxUnlockGates[0]?.gate ??
                    "Real beta-user proof"}
                </p>
                <p className="mt-2 text-sm leading-6">
                  {productProgress.customerUxUnlockGates[0]?.evidenceNeeded ??
                    "Prove that real beta users can complete signup/login, chatbot intake, food choice, grams/day, save, report, timeline, progress, and feedback without manual explanation."}
                </p>
              </div>
            </div>
          </div>

          <div
            className="rounded-xl border border-slate-200 bg-white/80 p-4 lg:col-span-2"
            data-testid="customer-product-score-rule"
          >
            <p className="text-sm font-semibold">Score movement rule</p>
            <p className="mt-2 text-sm leading-6">
              Automated readiness can stay high while Customer UX readiness stays
              flat. Customer UX rises only when fresh production evidence shows
              that the customer journey is clearer, safer, or easier to complete.
              Recommendation engine confidence rises from Food V2/ranking/OpenAI
              QA. Overall SaaS launch progress rises from business, monitoring,
              legal, beta-user, and operating proof.
            </p>
          </div>

          <div
            className="rounded-xl border border-violet-200 bg-violet-50 p-4 text-violet-950 lg:col-span-2"
            data-testid="customer-product-no-score-movement"
          >
            <p className="text-sm font-semibold">
              Latest quality movement without score change
            </p>
            <p className="mt-2 text-sm leading-6">
              Some PRs improve the next proof gate without moving the headline
              score. Count these as evidence prep, not as an automatic percentage
              increase.
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
              {productProgress.latestNoScoreMovement.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-blue-200 bg-white/70 p-4">
            <p className="text-sm font-semibold">Why it may not move every PR</p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
              {productProgress.whyItFeelsStuck.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-blue-200 bg-white/70 p-4">
            <p className="text-sm font-semibold">Next moves toward 95%+ beta launch</p>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm">
              {productProgress.nextScoreMoves.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </div>
        </div>

        <div
          className="mt-4 rounded-xl border border-blue-200 bg-white/80 p-4"
          data-testid="customer-ux-unlock-gates"
        >
          <p className="text-sm font-semibold">
            What actually moves Customer UX readiness above {productProgress.customerUxEstimate}
          </p>
          <div className="mt-3 grid gap-3 lg:grid-cols-5">
            {productProgress.customerUxUnlockGates.map((gate) => (
              <article
                key={`${gate.gate}-${gate.unlocks}`}
                className="rounded-xl border border-blue-200 bg-blue-50/70 p-3 text-sm text-blue-950"
              >
                <p className="font-semibold">{gate.gate}</p>
                <p className="mt-2 rounded-lg border border-blue-200 bg-white/80 px-2 py-1 text-xs font-bold">
                  {gate.unlocks}
                </p>
                <p className="mt-2 text-xs leading-5">{gate.evidenceNeeded}</p>
              </article>
            ))}
          </div>
        </div>

        <div
          className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950"
          data-testid="overall-saas-launch-blockers"
        >
          <p className="text-sm font-semibold">What still keeps overall SaaS launch lower</p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
            {productProgress.overallLaunchBlockers.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <p className="mt-4 rounded-xl border border-blue-200 bg-white/70 p-4 text-sm">
          Latest movement: {productProgress.latestMovement}
        </p>
      </div>

      <div
        className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-950 shadow-sm"
        data-testid="customer-journey-unlock-proof-summary"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide">
              Customer journey unlock proof
            </p>
            <h3 className="mt-1 text-2xl font-bold">
              {customerJourneyProof.result === "PASS"
                ? "Five customer journeys are protected"
                : "Customer journey proof needs refresh"}
            </h3>
            <p className="mt-2 max-w-3xl text-sm leading-6">
              This reads the customer journey unlock report. It proves the code
              paths for recommendation cards, grams/day, save, report, timeline,
              progress check, no-result advice, and flavour/brand change before
              we run the same journeys manually on production.
            </p>
          </div>
          <code className="rounded-lg border border-emerald-300 bg-white/80 px-3 py-2 text-xs font-semibold text-emerald-950">
            npm.cmd run qa:customer-journey-unlock-gate
          </code>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-emerald-200 bg-white/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Result
            </p>
            <p className="mt-1 text-2xl font-bold">{customerJourneyProof.result}</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-white/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Journeys
            </p>
            <p className="mt-1 text-2xl font-bold">
              {customerJourneyProof.journeysChecked}
            </p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-white/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Evidence markers
            </p>
            <p className="mt-1 text-2xl font-bold">
              {customerJourneyProof.evidenceMarkersChecked}
            </p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-white/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Generated
            </p>
            <p className="mt-1 text-sm font-semibold">
              {customerJourneyProof.generated}
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-emerald-200 bg-white/80 p-4">
          <p className="text-sm font-semibold">Unlock gates covered</p>
          <p className="mt-2 text-sm leading-6">
            {customerJourneyProof.unlockGatesCovered}
          </p>
          <p className="mt-3 text-sm font-semibold">Next manual proof</p>
          <p className="mt-2 text-sm leading-6">
            {customerJourneyProof.nextManualProof}
          </p>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-5">
          {customerJourneyProof.journeys.map((journey) => (
            <article
              key={journey.id}
              className="rounded-xl border border-emerald-200 bg-white/80 p-3 text-sm"
            >
              <p className="font-semibold">{journey.id}</p>
              <p className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-bold">
                {journey.unlockGate}
              </p>
              <p className="mt-2 text-xs leading-5">{journey.customerGoal}</p>
              <p className="mt-2 text-xs font-semibold">
                {journey.evidenceMarkers} markers across {journey.filesChecked}
              </p>
            </article>
          ))}
        </div>

        <div
          className="mt-4 rounded-xl border border-emerald-200 bg-white/80 p-4"
          data-testid="customer-journey-manual-follow-up"
        >
          <p className="text-sm font-semibold">Manual live follow-up</p>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm">
            {customerJourneyProof.manualFollowUp.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
      </div>

      <div
        className="rounded-2xl border border-cyan-200 bg-cyan-50 p-5 text-cyan-950 shadow-sm"
        data-testid="customer-live-journey-proof-summary"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide">
              Customer live journey proof
            </p>
            <h3 className="mt-1 text-2xl font-bold">
              {customerLiveJourneyProof.status === "PASS"
                ? "Logged-in live journey proof is passing"
                : "Logged-in live journey proof is still pending"}
            </h3>
            <p className="mt-2 max-w-3xl text-sm leading-6">
              This reads the non-destructive live journey report. It proves the
              authenticated chatbot page, OpenAI fact extraction, and Food V2
              recommendation-card path when a QA account cookie is available.
              Save, report, timeline, and progress remain manual browser proof.
            </p>
          </div>
          <code className="rounded-lg border border-cyan-300 bg-white/80 px-3 py-2 text-xs font-semibold text-cyan-950">
            npm.cmd run qa:customer-live-journey-proof
          </code>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-5">
          <div className="rounded-xl border border-cyan-200 bg-white/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">
              Status
            </p>
            <p className="mt-1 text-2xl font-bold">{customerLiveJourneyProof.status}</p>
          </div>
          <div className="rounded-xl border border-cyan-200 bg-white/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">
              Steps
            </p>
            <p className="mt-1 text-2xl font-bold">
              {customerLiveJourneyProof.stepsChecked}
            </p>
          </div>
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-green-950">
            <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
              Passed
            </p>
            <p className="mt-1 text-2xl font-bold">{customerLiveJourneyProof.passed}</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
              Skipped
            </p>
            <p className="mt-1 text-2xl font-bold">{customerLiveJourneyProof.skipped}</p>
          </div>
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-950">
            <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
              Failed
            </p>
            <p className="mt-1 text-2xl font-bold">{customerLiveJourneyProof.failed}</p>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-cyan-200 bg-white/80 p-4">
          <p className="text-sm font-semibold">Unlock impact</p>
          <p className="mt-2 text-sm leading-6">
            {customerLiveJourneyProof.unlockImpact}
          </p>
          <p className="mt-3 text-sm">
            Site: <span className="font-semibold">{customerLiveJourneyProof.site}</span>
          </p>
          <p className="mt-1 text-sm">
            Auth cookie source:{" "}
            <span className="font-semibold">
              {customerLiveJourneyProof.authCookieSource}
            </span>
          </p>
          <p className="mt-1 text-sm">
            Generated:{" "}
            <span className="font-semibold">{customerLiveJourneyProof.generated}</span>
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <p className="rounded-lg border border-cyan-100 bg-cyan-50 px-3 py-2 text-sm">
              Customer journeys tracked:{" "}
              <span className="font-semibold">
                {customerLiveJourneyProof.customerJourneysTracked}
              </span>
            </p>
            <p className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-950">
              Manual journeys still required:{" "}
              <span className="font-semibold">
                {customerLiveJourneyProof.manualJourneysStillRequired}
              </span>
            </p>
          </div>
        </div>

        <div
          className="mt-4 rounded-xl border border-cyan-200 bg-white/80 p-4"
          data-testid="customer-live-journey-checklist"
        >
          <p className="text-sm font-semibold">Customer journey checklist</p>
          <p className="mt-2 text-sm leading-6 text-cyan-900">
            These are the customer-visible journeys that must be proven on
            production before Customer UX readiness can move above the current
            band.
          </p>
          <div className="mt-3 grid gap-3 lg:grid-cols-5">
            {customerLiveJourneyProof.journeyChecklist.map((journey) => (
              <article
                key={`${journey.journey}-${journey.status}`}
                className="rounded-xl border border-cyan-100 bg-cyan-50/70 p-3 text-sm"
              >
                <p className="font-semibold">{journey.journey}</p>
                <p className="mt-2 rounded-lg border border-cyan-200 bg-white/80 px-2 py-1 text-xs font-bold">
                  {journey.status}
                </p>
                <p className="mt-2 text-xs leading-5">{journey.proofNeeded}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-cyan-200 bg-white/80 p-4">
          <p className="text-sm font-semibold">Customer live journey proof checklist</p>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm">
            {customerLiveJourneyProof.nextSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
      </div>

      <div
        className="rounded-2xl border border-cyan-200 bg-cyan-50 p-5 text-cyan-950 shadow-sm"
        data-testid="customer-launch-10-track-audit"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">
              10-track launch audit
            </p>
            <h3 className="mt-1 text-2xl font-black">
              Why the percentage should not move until the next proof is real
            </h3>
            <p className="mt-2 max-w-4xl text-sm leading-6">
              This is the practical map for the full goal: chatbot experience,
              saved-pet continuation, report, recommendation accuracy, account,
              auth, public trust, analytics, launch QA, and business layer. It
              shows where NutriTail is strong, where it is partial, and what
              evidence is needed before we honestly raise the Customer UX or
              overall launch percentage.
            </p>
          </div>
          <Link
            href="https://github.com/EmmMall92/nutritail-ai/blob/master/docs/customer-launch-10-track-audit.md"
            className="rounded-lg border border-cyan-900 px-4 py-2 text-sm font-semibold text-cyan-950 transition hover:bg-cyan-100"
            target="_blank"
            rel="noreferrer"
          >
            Open 10-track audit
          </Link>
        </div>

        <div
          className="mt-4 grid gap-3 md:grid-cols-4"
          data-testid="customer-launch-current-position"
        >
          <div className="rounded-xl border border-cyan-200 bg-white/80 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-cyan-700">
              Customer UX
            </p>
            <p className="mt-1 text-2xl font-black">
              {launchTrackAudit.customerUxReadiness}
            </p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950">
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
              Recommendation engine
            </p>
            <p className="mt-1 text-2xl font-black">
              {launchTrackAudit.recommendationEngineConfidence}
            </p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
            <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
              Overall SaaS
            </p>
            <p className="mt-1 text-2xl font-black">
              {launchTrackAudit.overallSaasLaunchProgress}
            </p>
          </div>
          <div className="rounded-xl border border-cyan-200 bg-white/80 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-cyan-700">
              Next honest unlock
            </p>
            <p className="mt-1 text-sm font-semibold leading-6">
              {launchTrackAudit.nextHonestUnlock}
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-2 xl:grid-cols-5">
          {launchTrackAudit.tracks.map((track) => (
            <article
              key={track.track}
              className="rounded-xl border border-cyan-200 bg-white/80 p-4 text-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="font-bold">{track.track}</p>
                <span className="rounded-full border border-cyan-200 bg-cyan-100 px-2 py-1 text-xs font-bold text-cyan-950">
                  {track.state}
                </span>
              </div>
              <p className="mt-3 text-xs font-bold uppercase tracking-wide text-cyan-700">
                Current proof
              </p>
              <p className="mt-1 text-xs leading-5">{track.currentProof}</p>
              <p className="mt-3 text-xs font-bold uppercase tracking-wide text-amber-700">
                Next proof needed
              </p>
              <p className="mt-1 text-xs leading-5">{track.nextProofNeeded}</p>
            </article>
          ))}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div
            className="rounded-xl border border-cyan-200 bg-white/80 p-4"
            data-testid="customer-launch-flat-reasons"
          >
            <p className="text-sm font-semibold">
              Why the percentage may stay flat
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
              {launchTrackAudit.whyFlat.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div
            className="rounded-xl border border-cyan-200 bg-white/80 p-4"
            data-testid="customer-launch-next-actions"
          >
            <p className="text-sm font-semibold">Next actions that can move it</p>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm">
              {launchTrackAudit.nextActions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      <div
        className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950 shadow-sm"
        data-testid="beta-user-proof-summary"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide">
              Real beta-user proof
            </p>
            <h3 className="mt-1 text-2xl font-bold">
              {betaUserProof.status === "PASS"
                ? "Beta-user proof is ready for the 88-90% move"
                : "Beta-user proof is still pending"}
            </h3>
            <p className="mt-2 max-w-3xl text-sm leading-6">
              This is the next Customer UX unlock after the controlled QA
              account. It proves that real beta users can finish signup/login,
              chatbot intake, food choice, grams/day, save, report, timeline or
              progress, and feedback without manual explanation.
            </p>
          </div>
          <code className="rounded-lg border border-amber-300 bg-white/80 px-3 py-2 text-xs font-semibold text-amber-950">
            npm.cmd run qa:beta-user-proof-contract
          </code>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-amber-200 bg-white/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
              Status
            </p>
            <p className="mt-1 text-2xl font-bold">{betaUserProof.status}</p>
          </div>
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-green-950">
            <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
              Verified users
            </p>
            <p className="mt-1 text-2xl font-bold">
              {betaUserProof.betaUsersVerified}
            </p>
          </div>
          <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 text-orange-950">
            <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">
              Review users
            </p>
            <p className="mt-1 text-2xl font-bold">
              {betaUserProof.betaUsersNeedingReview}
            </p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-white/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
              Minimum
            </p>
            <p className="mt-1 text-sm font-bold">
              {betaUserProof.minimumForNextMove}
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-amber-200 bg-white/80 p-4">
            <p className="text-sm font-semibold">Required journey types</p>
            <ul
              className="mt-3 grid gap-2 text-sm"
              data-testid="beta-user-proof-required-journeys"
            >
              {betaUserProof.requiredJourneyTypes.map((item) => (
                <li
                  key={item}
                  className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2"
                >
                  {item}
                </li>
              ))}
            </ul>
            <p
              className="mt-3 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-950"
              data-testid="beta-user-proof-missing-journeys"
            >
              Missing journey types: {betaUserProof.missingJourneyTypes}
            </p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-white/80 p-4">
            <p className="text-sm font-semibold">Required evidence</p>
            <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              {betaUserProof.requiredEvidence.map((item) => (
                <li key={item} className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2">
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-amber-200 bg-white/80 p-4">
            <p className="text-sm font-semibold">Next action</p>
            <p className="mt-2 text-sm leading-6">{betaUserProof.nextAction}</p>
            <p className="mt-3 text-xs text-amber-800">
              Proof source: {betaUserProof.proofSource}. Generated:{" "}
              {betaUserProof.generated}.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {betaUserProof.betaUsers.map((user) => (
            <article
              key={`${user.user}-${user.journey}-${user.status}`}
              className="rounded-xl border border-amber-200 bg-white/80 p-4 text-sm"
            >
              <p className="font-semibold">{user.user}</p>
              <p className="mt-2 rounded-lg border border-amber-200 bg-white px-2 py-1 text-xs font-bold">
                Journey: {user.journey}
              </p>
              <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-bold">
                {user.status}
              </p>
              <p className="mt-2 text-xs leading-5">{user.evidenceNotes}</p>
              <p className="mt-2 text-xs font-semibold">
                Missing: {user.missingTerms}
              </p>
            </article>
          ))}
          {betaUserProof.betaUsers.length === 0 && (
            <div className="rounded-xl border border-amber-200 bg-white/80 p-4 text-sm">
              Run the beta-user proof QA command to generate the pending report,
              then collect real beta evidence in the ignored local proof file.
            </div>
          )}
        </div>
      </div>

      <div
        className="rounded-2xl border border-purple-200 bg-purple-50 p-5 text-purple-950 shadow-sm"
        data-testid="food-v2-format-coverage-summary"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide">
              Food V2 format coverage
            </p>
            <h3 className="mt-1 text-2xl font-bold">
              {formatCoverage.status === "PASS"
                ? "Dry and wet coverage look ready"
                : "Wet/canned data gap is still visible"}
            </h3>
            <p className="mt-2 max-w-3xl text-sm">
              This reads the live format-coverage QA report. It explains why dry
              dog/cat recommendations can be strong while wet-only customer
              journeys still need more Food V2 data before we call the broad
              recommendation experience complete.
            </p>
          </div>
          <code className="rounded-lg border border-purple-300 bg-white/70 px-3 py-2 text-xs font-semibold text-purple-950">
            npm.cmd run qa:food-v2-format-coverage
          </code>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-purple-200 bg-white/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-purple-700">
              Checked
            </p>
            <p className="mt-1 text-2xl font-bold">{formatCoverage.checked}</p>
          </div>
          <div className="rounded-xl border border-purple-200 bg-white/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-purple-700">
              Passed cleanly
            </p>
            <p className="mt-1 text-2xl font-bold">
              {formatCoverage.passedWithoutWarnings}
            </p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
              Wet/canned gaps
            </p>
            <p className="mt-1 text-2xl font-bold">{formatCoverage.wetCannedDataGaps}</p>
          </div>
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-950">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
              Safe holds
            </p>
            <p className="mt-1 text-2xl font-bold">{formatCoverage.safeHolds}</p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {formatCoverage.scenarios.map((scenario) => (
            <div
              key={scenario.id}
              className="rounded-xl border border-purple-200 bg-white/80 p-4 text-sm"
            >
              <p className="font-semibold">{scenario.id}</p>
              <p className="mt-1 text-purple-800">
                {scenario.species} / {scenario.format}
              </p>
              <p className="mt-2 rounded-lg border border-purple-200 bg-purple-50 px-2 py-1 text-xs font-semibold text-purple-950">
                {scenario.coverageStatus}
              </p>
              <p className="mt-2">
                Visible choices: <strong>{scenario.visibleFoods}</strong>
              </p>
              <p className="mt-1">
                Held choices: <strong>{scenario.holdFoods}</strong>
              </p>
              {scenario.heldExamples.length > 0 && (
                <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-purple-800">
                  {scenario.heldExamples.map((example) => (
                    <li key={example}>{example}</li>
                  ))}
                </ul>
              )}
              <p className="mt-2 text-xs text-purple-800">{scenario.warning}</p>
            </div>
          ))}
          {formatCoverage.scenarios.length === 0 && (
            <div className="rounded-xl border border-purple-200 bg-white/80 p-4 text-sm">
              Run the format coverage QA command to generate the report.
            </div>
          )}
        </div>

        <div
          className="mt-4 rounded-xl border border-purple-200 bg-white/80 p-4"
          data-testid="food-v2-format-data-action-list"
        >
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-purple-700">
                Format data action list
              </p>
              <h4 className="mt-1 text-lg font-bold text-purple-950">
                What closes the wet/canned coverage gap
              </h4>
            </div>
            <p className="max-w-2xl text-sm leading-6 text-purple-900">
              Treat wet-only requests as a data-coverage queue, not a chatbot
              failure. Do not fill the gap with dry foods when the customer
              clearly asks for wet or canned food.
            </p>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {[
              {
                title: "Add wet dog rows",
                detail:
                  "Prioritise canned/pouch dog foods with ingredients, protein, fat, fibre, ash or moisture, kcal, and source URL.",
              },
              {
                title: "Expand wet cat rows",
                detail:
                  "Keep visible wet cat options growing beyond the first Purina rows, especially sterilised, urinary, renal, senior, and kitten.",
              },
              {
                title: "Require kcal for portions",
                detail:
                  "A wet row is more useful when kcal/100g or kcal/package is present, so the customer can still get grams or packs per day.",
              },
              {
                title: "Keep format guard strict",
                detail:
                  "Wet-only journeys should either show wet foods or a clear next step; they should not silently recommend dry food.",
              },
            ].map((item) => (
              <article
                key={item.title}
                className="rounded-lg border border-purple-100 bg-purple-50 p-3 text-sm text-purple-950"
                data-testid="food-v2-format-data-action"
              >
                <p className="font-semibold">{item.title}</p>
                <p className="mt-2 text-xs leading-5 text-purple-800">
                  {item.detail}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>

      <div
        className={`rounded-2xl border p-5 shadow-sm ${
          isPassing
            ? "border-green-200 bg-green-50 text-green-950"
            : "border-amber-200 bg-amber-50 text-amber-950"
        }`}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide">
              Automated live readiness
            </p>
            <h3 className="mt-1 text-2xl font-bold">
              {isPassing ? "Live readiness passed" : "Live readiness needs review"}
            </h3>
            <p className="mt-2 max-w-3xl text-sm">
              Generated from route checks, customer-flow checks, and chatbot QA.
              Re-run the QA commands after deploys that touch account, chatbot,
              Food V2, or printable reports.
            </p>
          </div>
          <div className="rounded-xl border border-current/20 bg-white/60 px-4 py-3 text-sm">
            <p className="font-semibold">Last generated</p>
            <p className="mt-1 break-all">{readiness.generated}</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <div className="rounded-xl border border-current/20 bg-white/60 p-4">
            <p className="text-sm font-medium">Result</p>
            <p className="mt-2 text-2xl font-bold">{readiness.result}</p>
          </div>
          <div className="rounded-xl border border-current/20 bg-white/60 p-4">
            <p className="text-sm font-medium">Readiness score</p>
            <p className="mt-2 text-2xl font-bold">{readiness.readinessScore}</p>
            <p className="mt-1 text-xs">Minimum: {readiness.minimumReadinessScore}</p>
          </div>
          <div className="rounded-xl border border-current/20 bg-white/60 p-4">
            <p className="text-sm font-medium">Suites passing</p>
            <p className="mt-2 text-2xl font-bold">{readiness.suitesPassing}</p>
          </div>
          <div className="rounded-xl border border-current/20 bg-white/60 p-4">
            <p className="text-sm font-medium">Checks/routes/cases</p>
            <p className="mt-2 text-2xl font-bold">{readiness.totalChecks}</p>
          </div>
          <div className="rounded-xl border border-current/20 bg-white/60 p-4">
            <p className="text-sm font-medium">Review items</p>
            <p className="mt-2 text-2xl font-bold">{readiness.failedOrReview}</p>
            <p className="mt-1 text-xs">Pass rate: {readiness.passRate}</p>
          </div>
          <div className="rounded-xl border border-current/20 bg-white/60 p-4">
            <p className="text-sm font-medium">Freshness gate</p>
            <p className="mt-2 break-words text-sm font-semibold">
              {readiness.deployFreshnessGate}
            </p>
            <p className="mt-1 text-xs">Max age: {readiness.maxReportAge}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-current/20 bg-white/50 p-4 text-sm">
            <p className="font-semibold">Core evidence</p>
            <p className="mt-1 break-words">{readiness.coreEvidenceScore}</p>
            <p className="mt-1 text-xs">Status: {readiness.customerReadyCoreStatus}</p>
          </div>
          <div className="rounded-xl border border-current/20 bg-white/50 p-4 text-sm">
            <p className="font-semibold">Advisory evidence</p>
            <p className="mt-1 break-words">{readiness.advisoryEvidenceScore}</p>
            <p className="mt-1 text-xs">OpenAI proof: {readiness.fullOpenAiProofStatus}</p>
          </div>
          <div className="rounded-xl border border-current/20 bg-white/50 p-4 text-sm">
            <p className="font-semibold">Oldest source report</p>
            <p className="mt-1 break-words">{readiness.oldestSourceReport}</p>
          </div>
          <div className="rounded-xl border border-current/20 bg-white/50 p-4 text-sm">
            <p className="font-semibold">Next stale report</p>
            <p className="mt-1 break-words">{readiness.nextStaleReport}</p>
          </div>
        </div>

        <div
          className="mt-4 rounded-xl border border-current/20 bg-white/70 p-4 text-sm"
          data-testid="openai-full-proof-runbook"
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="font-semibold">Full OpenAI proof action</p>
              <p className="mt-1 max-w-4xl">
                Current status: {readiness.fullOpenAiProofStatus}. If this is
                PENDING, the remaining step is usually the authenticated QA
                account cookie run, not a failed OpenAI integration.
              </p>
              <p className="mt-2 text-xs">
                Keep secrets local: store the Cookie header in{" "}
                <code>.qa-secrets/nutritail-auth-cookie.txt</code>, then run the
                proof command without printing the cookie or API key.
              </p>
            </div>
            <a
              href="https://github.com/EmmMall92/nutritail-ai/blob/master/docs/openai-full-proof-runbook.md"
              className="inline-flex rounded-lg border border-current/30 px-3 py-2 text-xs font-semibold hover:bg-white"
            >
              Open runbook
            </a>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
            <code className="rounded-lg border border-current/10 bg-white/80 p-3 text-xs">
              npm.cmd run qa:openai-full-proof
            </code>
            <code className="rounded-lg border border-current/10 bg-white/80 p-3 text-xs">
              npm.cmd run qa:live-readiness-dashboard
            </code>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Order</p>
          <p className="mt-2 text-3xl font-bold text-black">
            {liveChecks.length}
          </p>
          <p className="mt-2 text-sm text-gray-600">
            Deploy, admin access, import flow, recommendations, account progress,
            and mobile customer journey.
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Critical routes</p>
          <p className="mt-2 text-3xl font-bold text-black">{liveUrls.length}</p>
          <p className="mt-2 text-sm text-gray-600">
            Routes and API exports that should work after deploy.
          </p>
        </div>
        <div className="rounded-2xl border border-green-200 bg-green-50 p-5 shadow-sm">
          <p className="text-sm font-medium text-green-700">Pass signal</p>
          <p className="mt-2 text-3xl font-bold text-green-900">0</p>
          <p className="mt-2 text-sm text-green-800">
            No redirects, no blocked imports committed, no obvious bad top pick.
          </p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <p className="text-sm font-medium text-amber-700">Review signal</p>
          <p className="mt-2 text-3xl font-bold text-amber-900">1+</p>
          <p className="mt-2 text-sm text-amber-800">
            Any QA verdict warning should become a follow-up task.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {liveChecks.map((group) => (
          <div
            key={group.title}
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <h3 className="text-lg font-semibold text-black">{group.title}</h3>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-gray-700">
              {group.checks.map((check) => (
                <li key={check}>{check}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-black">URLs To Verify</h3>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          {liveUrls.map((url) => (
            <div
              key={url}
              className="break-all rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-black"
            >
              {url}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
        <p className="font-semibold">Pass condition</p>
        <p className="mt-2">
          The flow passes when the live site loads, an admin can preview rows,
          check existing formula keys, commit only importable rows, see them in
          review, export products/audit CSVs, and run Recommendation Lab
          scenarios without obvious size, allergy, urinary, or growth mistakes.
          Customer account progress also passes when a saved pet can continue
          from history, record a progress check, and show that progress in the
          pet profile and printable timeline.
        </p>
      </div>
    </section>
  );
}
