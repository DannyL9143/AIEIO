# API Spec (Draft)

Base path: `/api/v1`

## GET /scenarios

Returns list of available scenarios, including source metadata for dataset-generated entries.

### Query Parameters

- `dataset` (optional): `CORSAIR|GlobalMaritime`
- `region` (optional): case-insensitive substring match
- `incidentType` (optional): case-insensitive substring match
- `limit` (optional): max results, default `20`, max `100`

### Response 200

```json
{
  "scenarios": [
    {
      "id": "scenario_corsair_ASAM-1993-00000",
      "title": "Fired Upon near Gulf of Guinea",
      "description": "Bulk Carrier attacked by Bakassi Strike Force remnant approx 265nm offshore.",
      "scenarioSourceType": "dataset_generated",
      "sourceDataset": "CORSAIR",
      "sourceRecordIds": ["ASAM-1993-00000"],
      "sourceMetadata": {
        "incidentDate": "2019-07-24T08:58:00",
        "incidentRegion": "Gulf of Guinea",
        "incidentType": "Fired Upon",
        "vesselType": "Bulk Carrier",
        "confidenceNote": "Normalized from CORSAIR source fields.",
        "sourceSpecific": {
          "crewInjured": 0,
          "hostagesTaken": 0,
          "weapons": "Unknown",
          "year": 2019,
          "month": 7
        }
      },
      "region": "Gulf of Guinea",
      "objectives": ["Build public trust", "Preserve freedom of navigation"],
      "risks": ["Perceived militarization", "Narrative exploitation by adversaries"],
      "stakeholders": ["Local civilians", "Regional partners", "Maritime operators"],
      "tags": ["piracy", "maritime-security", "corsair"],
      "difficulty": "medium"
    }
  ]
}
```

## POST /scenarios/generate

Generates scenario candidates from authoritative piracy datasets or custom constraints.

### Request

```json
{
  "mode": "dataset_generated|instructor_custom",
  "datasetOptions": {
    "datasets": ["CORSAIR", "GlobalMaritime"],
    "region": "Gulf of Aden",
    "dateRange": {
      "start": "2023-01-01",
      "end": "2025-12-31"
    },
    "incidentTypes": ["boarding", "attempted_hijack"]
  },
  "customScenario": {
    "title": "string",
    "description": "string",
    "region": "string",
    "objectives": ["string"],
    "risks": ["string"],
    "stakeholders": ["string"]
  }
}
```

### Response 200

```json
{
  "scenarios": [
    {
      "id": "scenario_piracy_001",
      "title": "Piracy Boarding Attempt Near Chokepoint",
      "scenarioSourceType": "dataset_generated",
      "sourceDataset": "CORSAIR",
      "sourceRecordIds": ["corsair_12991"],
      "sourceMetadata": {
        "incidentDate": "2024-08-14",
        "incidentRegion": "Horn of Africa",
        "incidentType": "boarding_attempt",
        "vesselType": "commercial_cargo",
        "confidenceNote": "Normalized from CORSAIR source fields.",
        "sourceSpecific": {}
      }
    }
  ]
}
```

For `instructor_custom`, response returns a single scenario with:
- `scenarioSourceType: "instructor_custom"`
- `sourceDataset: null`
- provenance fields populated as instructor-defined metadata.

## POST /personas/generate

Generates personas for a scenario.

### Request

```json
{
  "scenarioId": "scenario_pacific_hadr_01",
  "audienceGroups": [
    "us_public",
    "local_civilians",
    "allied_governments",
    "host_nation_media",
    "adversary_outlets",
    "internal_military"
  ]
}
```

### Response 200

```json
{
  "personas": []
}
```

## POST /evaluate

Runs complete simulation and scoring for submitted message.

### Request

```json
{
  "role": "student",
  "scenarioId": "scenario_pacific_hadr_01",
  "messageType": "press_statement",
  "messageText": "Marine forces are on site to coordinate aid and ensure safe distribution.",
  "metadata": {
    "exerciseId": "exercise_001",
    "authorId": "student_007"
  }
}
```

### Response 200

```json
{
  "evaluationId": "eval_671cebcc-1646-4658-ac2d-e8c7e1adce7c",
  "scenarioId": "scenario_corsair_ASAM-1993-00000",
  "overall": {
    "trustScore": 65,
    "escalationRisk": 15,
    "misinterpretationRisk": 35,
    "misinformationPotential": 30,
    "opsecConcernScore": 10
  },
  "personaReactions": [
    {
      "personaId": "persona_local_civilians",
      "reactionSummary": "Local communities focus on safety and practical outcomes.",
      "sentiment": "positive",
      "trustImpact": 3,
      "likelyInterpretation": "Intent is judged by whether messaging is protective and specific.",
      "repostLikelihood": "medium",
      "keyConcern": "Civilian protection and disruption to daily life."
    }
  ],
  "riskFindings": [],
  "explainability": {
    "scoreRationale": "Scores are derived from deterministic keyword and clarity heuristics.",
    "topDrivers": [
      "De-escalatory vs escalatory language balance",
      "Potential OPSEC leakage",
      "Message clarity and ambiguity level"
    ]
  },
  "rewrite": {
    "suggestedMessage": "Our priority is civilian safety and coordinated maritime security support with regional authorities.",
    "whyItImproves": [
      "Reinforces safety-first intent with less escalatory framing.",
      "Centers coordination with legitimate authorities to increase trust."
    ]
  }
}
```

## POST /evaluate/rewrite

Re-evaluates suggested or edited rewrite.

### Request

```json
{
  "evaluationId": "eval_123",
  "updatedMessageText": "Our priority is rapid humanitarian support in coordination with local authorities."
}
```

### Response 200

```json
{
  "evaluationId": "eval_124",
  "delta": {
    "trustScore": 11,
    "misinterpretationRisk": -9
  },
  "evaluation": {
    "evaluationId": "eval_124",
    "scenarioId": "scenario_pacific_hadr_01",
    "overall": {
      "trustScore": 76,
      "escalationRisk": 10,
      "misinterpretationRisk": 26,
      "misinformationPotential": 24,
      "opsecConcernScore": 10
    }
  }
}
```

## GET /health

Returns service and provider status for demo readiness.

### Response 200

```json
{
  "status": "ok",
  "service": "aieio-backend",
  "llmProvider": "mock|available"
}
```

## Error Format

```json
{
  "error": {
    "code": "SCHEMA_VALIDATION_FAILED",
    "message": "Output did not match EvaluationResult schema."
  }
}
```

## Notes

- In `dataset_generated` mode, response should include full available source metadata from records.
- In `instructor_custom` mode, scenario is created from request payload without dataset dependency.
