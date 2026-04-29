function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asString(value, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }

  return value.trim();
}

function asStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => asString(item)).filter(Boolean);
}

function asNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function normalizeScenarioOutput(scenario) {
  return {
    id: asString(scenario?.id),
    title: asString(scenario?.title),
    description: asString(scenario?.description),
    scenarioSourceType: asString(scenario?.scenarioSourceType),
    sourceDataset: scenario?.sourceDataset ?? null,
    sourceRecordIds: asStringArray(scenario?.sourceRecordIds),
    sourceMetadata: {
      incidentDate: asString(scenario?.sourceMetadata?.incidentDate, "Unknown"),
      incidentRegion: asString(scenario?.sourceMetadata?.incidentRegion, "Unknown"),
      incidentType: asString(scenario?.sourceMetadata?.incidentType, "Unknown"),
      vesselType: asString(scenario?.sourceMetadata?.vesselType, "Unknown"),
      confidenceNote: asString(scenario?.sourceMetadata?.confidenceNote),
      sourceSpecific: isObject(scenario?.sourceMetadata?.sourceSpecific)
        ? scenario.sourceMetadata.sourceSpecific
        : {}
    },
    region: asString(scenario?.region, "Unknown"),
    objectives: asStringArray(scenario?.objectives),
    risks: asStringArray(scenario?.risks),
    stakeholders: asStringArray(scenario?.stakeholders),
    tags: asStringArray(scenario?.tags),
    difficulty: asString(scenario?.difficulty, "medium")
  };
}

export function validateScenarioOutput(scenario) {
  if (!scenario.id || !scenario.title || !scenario.description) {
    return "Scenario must include id, title, and description.";
  }

  if (!["dataset_generated", "instructor_custom"].includes(scenario.scenarioSourceType)) {
    return "scenarioSourceType must be dataset_generated or instructor_custom.";
  }

  if (scenario.scenarioSourceType === "dataset_generated") {
    if (!["CORSAIR", "GlobalMaritime"].includes(scenario.sourceDataset)) {
      return "sourceDataset must be CORSAIR or GlobalMaritime for dataset scenarios.";
    }

    if (!isObject(scenario.sourceMetadata?.sourceSpecific)) {
      return "sourceMetadata.sourceSpecific is required for dataset scenarios.";
    }
  }

  return null;
}

export function validateMessageSubmission(body) {
  const role = asString(body?.role);
  const scenarioId = asString(body?.scenarioId);
  const messageType = asString(body?.messageType);
  const messageText = asString(body?.messageText);
  const metadata = body?.metadata;

  if (!["student", "instructor"].includes(role)) {
    return { valid: false, error: "role must be student or instructor." };
  }

  if (!scenarioId) {
    return { valid: false, error: "scenarioId is required." };
  }

  if (
    !["press_statement", "social_post", "interview_response", "talking_points"].includes(
      messageType
    )
  ) {
    return { valid: false, error: "messageType is invalid." };
  }

  if (!messageText) {
    return { valid: false, error: "messageText is required." };
  }

  if (!isObject(metadata)) {
    return { valid: false, error: "metadata object is required." };
  }

  return {
    valid: true,
    value: {
      role,
      scenarioId,
      messageType,
      messageText,
      metadata: {
        exerciseId: asString(metadata.exerciseId),
        authorId: asString(metadata.authorId)
      }
    }
  };
}

export function normalizeEvaluationOutput(evaluation) {
  return {
    evaluationId: asString(evaluation?.evaluationId),
    scenarioId: asString(evaluation?.scenarioId),
    overall: {
      trustScore: asNumber(evaluation?.overall?.trustScore),
      escalationRisk: asNumber(evaluation?.overall?.escalationRisk),
      misinterpretationRisk: asNumber(evaluation?.overall?.misinterpretationRisk),
      misinformationPotential: asNumber(evaluation?.overall?.misinformationPotential),
      opsecConcernScore: asNumber(evaluation?.overall?.opsecConcernScore)
    },
    personaReactions: Array.isArray(evaluation?.personaReactions)
      ? evaluation.personaReactions
      : [],
    riskFindings: Array.isArray(evaluation?.riskFindings) ? evaluation.riskFindings : [],
    explainability: {
      scoreRationale: asString(evaluation?.explainability?.scoreRationale),
      topDrivers: asStringArray(evaluation?.explainability?.topDrivers)
    },
    rewrite: {
      suggestedMessage: asString(evaluation?.rewrite?.suggestedMessage),
      whyItImproves: asStringArray(evaluation?.rewrite?.whyItImproves)
    }
  };
}

export function validateEvaluationOutput(evaluation) {
  if (!evaluation.evaluationId || !evaluation.scenarioId) {
    return "Evaluation output requires evaluationId and scenarioId.";
  }

  const scores = [
    evaluation.overall.trustScore,
    evaluation.overall.escalationRisk,
    evaluation.overall.misinterpretationRisk,
    evaluation.overall.misinformationPotential,
    evaluation.overall.opsecConcernScore
  ];

  const outOfRange = scores.some((score) => score < 0 || score > 100);
  if (outOfRange) {
    return "All overall scores must be in the range 0-100.";
  }

  if (!evaluation.rewrite.suggestedMessage) {
    return "rewrite.suggestedMessage is required.";
  }

  return null;
}

