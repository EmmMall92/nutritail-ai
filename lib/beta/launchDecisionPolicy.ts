export type BetaLaunchDecisionInput = {
  dogProofCandidates: number;
  catProofCandidates: number;
  returningPetProofCandidates: number;
  criticalFeedbackRepeats: number;
  overLimitUsageCount: number;
  pricingApproved: boolean;
  legalApproved: boolean;
  supportFlowReady: boolean;
  hardLimitCopyReady: boolean;
};

export type BetaLaunchDecisionId =
  | "keep_soft_beta"
  | "open_wider_beta_batch"
  | "prepare_hard_limits"
  | "prepare_paid_plan_work";

export type BetaLaunchDecision = {
  decision: BetaLaunchDecisionId;
  label: string;
  readinessLabel: string;
  rationale: string;
  nextAction: string;
  blockers: string[];
};

function normalizeCount(value: number) {
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

export function getBetaLaunchDecision(
  input: BetaLaunchDecisionInput
): BetaLaunchDecision {
  const dogProofCandidates = normalizeCount(input.dogProofCandidates);
  const catProofCandidates = normalizeCount(input.catProofCandidates);
  const returningPetProofCandidates = normalizeCount(
    input.returningPetProofCandidates
  );
  const criticalFeedbackRepeats = normalizeCount(input.criticalFeedbackRepeats);
  const overLimitUsageCount = normalizeCount(input.overLimitUsageCount);

  const proofSlotsReady =
    dogProofCandidates > 0 &&
    catProofCandidates > 0 &&
    returningPetProofCandidates > 0;
  const hasQualityBlocker = criticalFeedbackRepeats > 0;
  const hasOverLimitPressure = overLimitUsageCount > 0;
  const paidPlanPrereqsReady =
    input.pricingApproved &&
    input.legalApproved &&
    input.supportFlowReady &&
    input.hardLimitCopyReady;

  if (!proofSlotsReady || hasQualityBlocker) {
    return {
      decision: "keep_soft_beta",
      label: "Keep soft beta",
      readinessLabel: "Not ready to widen",
      rationale:
        "The product should stay in soft beta until dog, cat, and returning-pet proof are all visible and no critical feedback pattern is repeating.",
      nextAction:
        "Invite targeted testers for the missing proof slots, collect feedback, and keep limits soft.",
      blockers: [
        dogProofCandidates > 0 ? "" : "missing dog-owner beta proof candidate",
        catProofCandidates > 0 ? "" : "missing cat-owner beta proof candidate",
        returningPetProofCandidates > 0
          ? ""
          : "missing returning saved-pet beta proof candidate",
        hasQualityBlocker ? "critical feedback repeat needs product fix" : "",
      ].filter(Boolean),
    };
  }

  if (!hasOverLimitPressure) {
    return {
      decision: "open_wider_beta_batch",
      label: "Open wider beta batch",
      readinessLabel: "Ready for more beta proof",
      rationale:
        "The core beta proof slots are visible and there is no over-limit pressure yet, so the next move is more real users rather than payments.",
      nextAction:
        "Open a small wider beta batch and keep watching completion, feedback, and support load.",
      blockers: [],
    };
  }

  if (!input.hardLimitCopyReady || !input.supportFlowReady) {
    return {
      decision: "prepare_hard_limits",
      label: "Prepare hard limits",
      readinessLabel: "Limits need operating copy",
      rationale:
        "Over-limit usage exists, but hard gates should wait until customer-facing limit copy and support handling are ready.",
      nextAction:
        "Write over-limit customer copy, support responses, and admin handling before blocking customers.",
      blockers: [
        input.hardLimitCopyReady ? "" : "hard-limit customer copy not approved",
        input.supportFlowReady ? "" : "support flow not approved",
      ].filter(Boolean),
    };
  }

  if (!paidPlanPrereqsReady) {
    return {
      decision: "prepare_paid_plan_work",
      label: "Prepare paid-plan work",
      readinessLabel: "Commercial prerequisites missing",
      rationale:
        "The product can start payment planning, but checkout should not launch until pricing, legal copy, support, and hard-limit behavior are approved.",
      nextAction:
        "Finalize pricing, cancellation terms, legal review, support flow, and plan-limit enforcement before adding checkout.",
      blockers: [
        input.pricingApproved ? "" : "pricing not approved",
        input.legalApproved ? "" : "legal copy not approved",
        input.supportFlowReady ? "" : "support flow not approved",
        input.hardLimitCopyReady ? "" : "hard-limit customer copy not approved",
      ].filter(Boolean),
    };
  }

  return {
    decision: "prepare_paid_plan_work",
    label: "Ready to start paid-plan implementation",
    readinessLabel: "Commercial gate ready",
    rationale:
      "Beta proof, operating limits, support flow, legal copy, and pricing are ready enough to start paid-plan implementation.",
    nextAction:
      "Start the paid-plan implementation plan, still keeping beta access available during rollout.",
    blockers: [],
  };
}
