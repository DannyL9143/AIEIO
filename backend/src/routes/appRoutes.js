import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { randomUUID } from "node:crypto";
import { getScenarioById, listScenarios } from "../services/datasetStore.js";
import {
  appendEvaluationRecord,
  findEvaluationRecordById,
  listEvaluationRecords,
  updateEvaluationRecordById
} from "../services/evaluationRecordStore.js";
import {
  getEvaluationProviderStatus,
  runEvaluation
} from "../services/evaluationProvider.js";
import {
  normalizeEvaluationOutput,
  normalizeScenarioOutput,
  validateEvaluationOutput,
  validateMessageSubmission,
  validateScenarioOutput
} from "../services/schemaContracts.js";

const router = Router();
const generatedScenarioCache = new Map();

router.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "aieio-backend",
    llmProvider: getEvaluationProviderStatus()
  });
});

router.get("/scenarios", async (req, res) => {
  try {
    const rawScenarios = await listScenarios({
      dataset: req.query.dataset,
      region: req.query.region,
      incidentType: req.query.incidentType,
      limit: req.query.limit
    });

    const scenarios = rawScenarios.map((scenario) => {
      const normalizedScenario = normalizeScenarioOutput(scenario);
      const scenarioError = validateScenarioOutput(normalizedScenario);
      if (scenarioError) {
        throw new Error(scenarioError);
      }
      return normalizedScenario;
    });

    res.json({ scenarios });
  } catch (error) {
    res.status(500).json({
      error: {
        code: "SCHEMA_VALIDATION_FAILED",
        message: error.message || "Failed to normalize scenarios response."
      }
    });
  }
});

router.post("/scenarios/generate", async (req, res) => {
  const mode = String(req.body?.mode || "");

  if (!["dataset_generated", "instructor_custom"].includes(mode)) {
    return res.status(400).json({
      error: {
        code: "SCHEMA_VALIDATION_FAILED",
        message: "mode must be dataset_generated or instructor_custom."
      }
    });
  }

  if (mode === "dataset_generated") {
    const datasetOptions = req.body?.datasetOptions || {};
    const datasets = Array.isArray(datasetOptions.datasets) ? datasetOptions.datasets : [];
    const scenarios = [];

    const selectedDatasets = datasets.length > 0 ? datasets : ["CORSAIR", "GlobalMaritime"];
    for (const dataset of selectedDatasets) {
      // Keep dataset-generated response deterministic and small for MVP.
      const batch = await listScenarios({
        dataset,
        region: datasetOptions.region,
        incidentType: Array.isArray(datasetOptions.incidentTypes)
          ? datasetOptions.incidentTypes[0]
          : undefined,
        limit: 5
      });
      scenarios.push(...batch);
    }

    const normalized = scenarios.map((scenario) => normalizeScenarioOutput(scenario));
    normalized.forEach((scenario) => {
      generatedScenarioCache.set(scenario.id, scenario);
    });
    return res.json({ scenarios: normalized });
  }

  const custom = req.body?.customScenario || {};
  const title = String(custom.title || "").trim();
  const description = String(custom.description || "").trim();
  if (!title || !description) {
    return res.status(400).json({
      error: {
        code: "SCHEMA_VALIDATION_FAILED",
        message: "customScenario title and description are required."
      }
    });
  }

  const customScenario = normalizeScenarioOutput({
    id: `scenario_custom_${randomUUID()}`,
    title,
    description,
    scenarioSourceType: "instructor_custom",
    sourceDataset: null,
    sourceRecordIds: [],
    sourceMetadata: {
      incidentDate: "N/A",
      incidentRegion: String(custom.region || "Instructor-defined"),
      incidentType: "custom",
      vesselType: "N/A",
      confidenceNote: "Instructor-authored scenario.",
      sourceSpecific: {}
    },
    region: String(custom.region || "Instructor-defined"),
    objectives: Array.isArray(custom.objectives) ? custom.objectives : [],
    risks: Array.isArray(custom.risks) ? custom.risks : [],
    stakeholders: Array.isArray(custom.stakeholders) ? custom.stakeholders : [],
    tags: ["custom", "instructor"],
    difficulty: "medium"
  });
  generatedScenarioCache.set(customScenario.id, customScenario);

  return res.json({ scenarios: [customScenario] });
});

router.post("/evaluate", async (req, res) => {
  const submission = validateMessageSubmission(req.body);
  if (!submission.valid) {
    return res.status(400).json({
      error: {
        code: "SCHEMA_VALIDATION_FAILED",
        message: submission.error
      }
    });
  }

  const { scenarioId, messageText, tone } = submission.value;
  const scenario = (await getScenarioById(scenarioId)) || generatedScenarioCache.get(scenarioId);
  if (!scenario) {
    return res.status(404).json({
      error: {
        code: "SCENARIO_NOT_FOUND",
        message: "No scenario found for provided scenarioId."
      }
    });
  }

  const rawEvaluation = runEvaluation({ scenarioId, messageText, tone });
  const evaluation = normalizeEvaluationOutput(rawEvaluation);
  const evaluationError = validateEvaluationOutput(evaluation);
  if (evaluationError) {
    return res.status(500).json({
      error: {
        code: "SCHEMA_VALIDATION_FAILED",
        message: evaluationError
      }
    });
  }

  await appendEvaluationRecord({
    ...evaluation,
    metadata: submission.value.metadata,
    tone,
    instructorReview: {
      status: "not_submitted",
      submittedAt: null,
      assessedAt: null,
      assessment: null
    },
    reviewAudit: [
      {
        at: new Date().toISOString(),
        event: "automated_assessment_created",
        detail: "Automated assessment completed."
      }
    ],
    savedAt: new Date().toISOString(),
    providerMode: getEvaluationProviderStatus()
  });

  return res.json(evaluation);
});

router.post("/evaluate/rewrite", async (req, res) => {
  const evaluationId = String(req.body?.evaluationId || "").trim();
  const updatedMessageText = String(req.body?.updatedMessageText || "").trim();
  if (!evaluationId || !updatedMessageText) {
    return res.status(400).json({
      error: {
        code: "SCHEMA_VALIDATION_FAILED",
        message: "evaluationId and updatedMessageText are required."
      }
    });
  }

  const previousEvaluation = await findEvaluationRecordById(evaluationId);
  if (!previousEvaluation) {
    return res.status(404).json({
      error: {
        code: "EVALUATION_NOT_FOUND",
        message: "No evaluation found for provided evaluationId."
      }
    });
  }

  const scenario =
    (await getScenarioById(previousEvaluation.scenarioId)) ||
    generatedScenarioCache.get(previousEvaluation.scenarioId);
  if (!scenario) {
    return res.status(404).json({
      error: {
        code: "SCENARIO_NOT_FOUND",
        message: "No scenario found for evaluation scenarioId."
      }
    });
  }

  const rewrittenRaw = runEvaluation({
    scenarioId: previousEvaluation.scenarioId,
    messageText: updatedMessageText,
    tone: previousEvaluation.tone || "calm_factual"
  });
  const rewrittenEvaluation = normalizeEvaluationOutput(rewrittenRaw);
  const evaluationError = validateEvaluationOutput(rewrittenEvaluation);
  if (evaluationError) {
    return res.status(500).json({
      error: {
        code: "SCHEMA_VALIDATION_FAILED",
        message: evaluationError
      }
    });
  }

  await appendEvaluationRecord({
    ...rewrittenEvaluation,
    metadata: {
      ...(previousEvaluation.metadata || {}),
      rewrittenFromEvaluationId: evaluationId
    },
    instructorReview: {
      status: "not_submitted",
      submittedAt: null,
      assessedAt: null,
      assessment: null
    },
    reviewAudit: [
      {
        at: new Date().toISOString(),
        event: "rewrite_assessment_created",
        detail: `Created from ${evaluationId}.`
      }
    ],
    savedAt: new Date().toISOString(),
    providerMode: getEvaluationProviderStatus()
  });

  const delta = {
    trustScore:
      rewrittenEvaluation.overall.trustScore - previousEvaluation.overall.trustScore,
    misinterpretationRisk:
      rewrittenEvaluation.overall.misinterpretationRisk -
      previousEvaluation.overall.misinterpretationRisk
  };

  return res.json({
    evaluationId: rewrittenEvaluation.evaluationId,
    delta,
    evaluation: rewrittenEvaluation
  });
});

router.get(
  "/instructor/reviews",
  requireAuth,
  requireRole("instructor"),
  async (_req, res) => {
    const evaluations = await listEvaluationRecords();
    const reviews = evaluations
      .filter((record) => record.instructorReview?.status !== "not_submitted")
      .slice(-12)
      .reverse()
      .map((record) => ({
        evaluationId: record.evaluationId,
        scenarioId: record.scenarioId,
        authorId: record.metadata?.authorId || "unknown",
        exerciseId: record.metadata?.exerciseId || "exercise_live",
        trustScore: record.overall?.trustScore ?? 0,
        escalationRisk: record.overall?.escalationRisk ?? 0,
        reviewStatus: record.instructorReview?.status || "not_submitted",
        automatedAssessment: {
          trustScore: record.overall?.trustScore ?? 0,
          escalationRisk: record.overall?.escalationRisk ?? 0
        },
        instructorAssessment: record.instructorReview?.assessment || null,
        savedAt: record.savedAt || null
      }));
    return res.json({ reviews });
  }
);

router.post("/student/submissions", requireAuth, requireRole("student"), async (req, res) => {
  const evaluationId = String(req.body?.evaluationId || "").trim();
  if (!evaluationId) {
    return res.status(400).json({
      error: {
        code: "SCHEMA_VALIDATION_FAILED",
        message: "evaluationId is required."
      }
    });
  }
  const updated = await updateEvaluationRecordById(evaluationId, (record) => ({
    ...record,
    instructorReview: {
      status: "pending_instructor",
      submittedAt: new Date().toISOString(),
      assessment: record.instructorReview?.assessment || null
    },
    reviewAudit: [
      ...(Array.isArray(record.reviewAudit) ? record.reviewAudit : []),
      {
        at: new Date().toISOString(),
        event: "submitted_to_instructor",
        detail: "Student submitted assessment for instructor review."
      }
    ]
  }));
  if (!updated) {
    return res.status(404).json({
      error: {
        code: "EVALUATION_NOT_FOUND",
        message: "No evaluation found for provided evaluationId."
      }
    });
  }
  return res.json({
    evaluationId: updated.evaluationId,
    reviewStatus: updated.instructorReview?.status || "pending_instructor"
  });
});

router.get(
  "/student/submissions/:evaluationId/status",
  requireAuth,
  requireRole("student"),
  async (req, res) => {
    const evaluationId = String(req.params?.evaluationId || "").trim();
    const record = await findEvaluationRecordById(evaluationId);
    if (!record) {
      return res.status(404).json({
        error: {
          code: "EVALUATION_NOT_FOUND",
          message: "No evaluation found for provided evaluationId."
        }
      });
    }
    return res.json({
      evaluationId: record.evaluationId,
      reviewStatus: record.instructorReview?.status || "not_submitted",
      instructorAssessment: record.instructorReview?.assessment || null
    });
  }
);

router.get(
  "/student/submissions/:evaluationId/history",
  requireAuth,
  requireRole("student"),
  async (req, res) => {
    const evaluationId = String(req.params?.evaluationId || "").trim();
    const record = await findEvaluationRecordById(evaluationId);
    if (!record) {
      return res.status(404).json({
        error: {
          code: "EVALUATION_NOT_FOUND",
          message: "No evaluation found for provided evaluationId."
        }
      });
    }
    return res.json({
      evaluationId: record.evaluationId,
      auditLog: Array.isArray(record.reviewAudit) ? record.reviewAudit : []
    });
  }
);

router.post(
  "/instructor/reviews/:evaluationId/assess",
  requireAuth,
  requireRole("instructor"),
  async (req, res) => {
    const evaluationId = String(req.params?.evaluationId || "").trim();
    const grade = String(req.body?.grade || "").trim().toLowerCase();
    const notes = String(req.body?.notes || "").trim();
    if (!["trained", "proficient", "untrained"].includes(grade)) {
      return res.status(400).json({
        error: {
          code: "SCHEMA_VALIDATION_FAILED",
          message: "grade must be trained, proficient, or untrained."
        }
      });
    }
    const updated = await updateEvaluationRecordById(evaluationId, (record) => ({
      ...record,
      instructorReview: {
        status: "finalized",
        submittedAt:
          record.instructorReview?.submittedAt || new Date().toISOString(),
        assessedAt: new Date().toISOString(),
        assessor: req.auth.user.username,
        assessment: {
          grade,
          notes
        },
        finalDecision: "instructor_final"
      },
      reviewAudit: [
        ...(Array.isArray(record.reviewAudit) ? record.reviewAudit : []),
        {
          at: new Date().toISOString(),
          event: "instructor_assessment_finalized",
          detail: `Final grade: ${grade}.`
        }
      ]
    }));
    if (!updated) {
      return res.status(404).json({
        error: {
          code: "EVALUATION_NOT_FOUND",
          message: "No evaluation found for provided evaluationId."
        }
      });
    }
    return res.json({
      evaluationId: updated.evaluationId,
      reviewStatus: updated.instructorReview.status,
      instructorAssessment: updated.instructorReview.assessment
    });
  }
);

router.get("/trainee/dashboard", requireAuth, requireRole("student"), (req, res) => {
  res.json({
    page: "trainee",
    message: "Trainee dashboard placeholder",
    user: {
      username: req.auth.user.username,
      role: req.auth.user.role
    }
  });
});

router.get(
  "/instructor/dashboard",
  requireAuth,
  requireRole("instructor"),
  (req, res) => {
    res.json({
      page: "instructor",
      message: "Instructor dashboard placeholder",
      user: {
        username: req.auth.user.username,
        role: req.auth.user.role
      }
    });
  }
);

export default router;
