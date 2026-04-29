import { randomUUID } from "node:crypto";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function containsAny(text, tokens) {
  return tokens.some((token) => text.includes(token));
}

function detectTone(messageText) {
  const text = messageText.toLowerCase();
  if (containsAny(text, ["we understand", "we hear", "community", "families"])) {
    return "empathetic_reassuring";
  }
  if (containsAny(text, ["will", "must", "directive", "order"])) {
    return "firm_authoritative";
  }
  if (containsAny(text, ["verified", "facts", "update", "briefing"])) {
    return "transparent_briefing";
  }
  if (containsAny(text, ["residents", "local communities", "civilian", "neighbors"])) {
    return "community_focused";
  }
  return "calm_factual";
}

function scoreMessage(messageText, expectedTone) {
  const text = messageText.toLowerCase();
  const words = text.split(/\s+/).filter(Boolean);

  const hasDeescalationLanguage = containsAny(text, [
    "coordinate",
    "support",
    "humanitarian",
    "local authorities",
    "safety",
    "protection"
  ]);
  const hasEscalatoryLanguage = containsAny(text, [
    "retaliate",
    "destroy",
    "eliminate",
    "hunt down",
    "punish"
  ]);
  const hasOpsecLeak = containsAny(text, [
    "exact position",
    "coordinates",
    "route",
    "schedule",
    "deployment time"
  ]);
  const detectedTone = detectTone(messageText);
  const toneMismatch = expectedTone && expectedTone !== detectedTone;

  const trustScore = clamp(
    45 + (hasDeescalationLanguage ? 20 : 0) - (hasEscalatoryLanguage ? 12 : 0) - (toneMismatch ? 8 : 0),
    0,
    100
  );
  const escalationRisk = clamp(25 + (hasEscalatoryLanguage ? 30 : 0) - (hasDeescalationLanguage ? 10 : 0), 0, 100);
  const misinterpretationRisk = clamp(
    35 + (words.length < 12 ? 10 : 0) + (toneMismatch ? 10 : 0),
    0,
    100
  );
  const misinformationPotential = clamp(30 + (words.length < 10 ? 10 : 0) + (hasEscalatoryLanguage ? 12 : 0), 0, 100);
  const opsecConcernScore = clamp(10 + (hasOpsecLeak ? 45 : 0), 0, 100);

  return {
    trustScore,
    escalationRisk,
    misinterpretationRisk,
    misinformationPotential,
    opsecConcernScore,
    toneMismatch,
    detectedTone
  };
}

function buildRiskFindings(overall, expectedTone) {
  const findings = [];

  if (overall.opsecConcernScore >= 40) {
    findings.push({
      type: "opsec",
      severity: "high",
      evidence: "Message may expose operational details or movement patterns.",
      recommendation: "Remove exact timings/locations and keep details mission-generic."
    });
  }

  if (overall.escalationRisk >= 45) {
    findings.push({
      type: "escalation",
      severity: "medium",
      evidence: "Language can be interpreted as punitive or escalatory.",
      recommendation: "Use restraint-focused framing and emphasize civilian safety."
    });
  }

  if (overall.misinterpretationRisk >= 40) {
    findings.push({
      type: "misinterpretation",
      severity: "medium",
      evidence: "Short or ambiguous phrasing leaves room for competing narratives.",
      recommendation: "Add clear intent, authority coordination, and expected outcomes."
    });
  }

  if (overall.misinformationPotential >= 40) {
    findings.push({
      type: "misinformation",
      severity: "medium",
      evidence: "Statement could be selectively quoted to amplify false narratives.",
      recommendation: "Pre-bunk likely misreads and include verifiable context."
    });
  }
  if (overall.toneMismatch) {
    findings.push({
      type: "tone_alignment",
      severity: "medium",
      evidence: `Selected tone (${expectedTone}) does not match detected wording (${overall.detectedTone}).`,
      recommendation: "Align wording choices with the intended communication tone."
    });
  }

  return findings;
}

function buildPersonaReactions(overall) {
  const trustDelta = Math.round((overall.trustScore - 50) / 5);
  const sentiment = trustDelta > 2 ? "positive" : trustDelta < -2 ? "negative" : "neutral";

  return [
    {
      personaId: "persona_local_civilians",
      reactionSummary: "Local communities focus on safety and practical outcomes.",
      sentiment,
      trustImpact: trustDelta,
      likelyInterpretation: "Intent is judged by whether messaging is protective and specific.",
      repostLikelihood: sentiment === "positive" ? "medium" : "low",
      keyConcern: "Civilian protection and disruption to daily life."
    },
    {
      personaId: "persona_host_nation_media",
      reactionSummary: "Media outlets test wording for escalation cues.",
      sentiment: overall.escalationRisk > 45 ? "negative" : "neutral",
      trustImpact: overall.escalationRisk > 45 ? -6 : -1,
      likelyInterpretation: "Signals are scrutinized for political and sovereignty implications.",
      repostLikelihood: "high",
      keyConcern: "Regional stability and legal authorities."
    }
  ];
}

function buildRewrite(messageText) {
  void messageText;
  return {
    suggestedMessage:
      "Our priority is civilian safety and coordinated maritime security support with regional authorities.",
    whyItImproves: [
      "Reinforces safety-first intent with less escalatory framing.",
      "Centers coordination with legitimate authorities to increase trust."
    ]
  };
}

export function evaluateSubmission({ scenarioId, messageText, tone }) {
  const overall = scoreMessage(messageText, tone);
  const riskFindings = buildRiskFindings(overall, tone);
  const personaReactions = buildPersonaReactions(overall);

  return {
    evaluationId: `eval_${randomUUID()}`,
    scenarioId,
    overall,
    personaReactions,
    riskFindings,
    explainability: {
      scoreRationale: "Scores are derived from deterministic keyword and clarity heuristics.",
      topDrivers: [
        "De-escalatory vs escalatory language balance",
        "Potential OPSEC leakage",
        "Message clarity and ambiguity level",
        "Tone alignment between intended and observed wording"
      ]
    },
    rewrite: buildRewrite(messageText)
  };
}

