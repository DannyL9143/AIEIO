# Data Schemas

## Scenario Schema

```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "scenarioSourceType": "dataset_generated|instructor_custom",
  "sourceDataset": "CORSAIR|GlobalMaritime|null",
  "sourceRecordIds": ["string"],
  "sourceMetadata": {
    "incidentDate": "string",
    "incidentRegion": "string",
    "incidentType": "string",
    "vesselType": "string",
    "confidenceNote": "string"
  },
  "region": "string",
  "objectives": ["string"],
  "risks": ["string"],
  "stakeholders": ["string"],
  "tags": ["string"],
  "difficulty": "low|medium|high"
}
```

## Persona Schema

```json
{
  "id": "string",
  "name": "string",
  "audienceGroup": "us_public|local_civilians|allied_governments|host_nation_media|adversary_outlets|internal_military",
  "location": "string",
  "bias": "string",
  "priority": "string",
  "trustBaseline": 0,
  "influenceLevel": 0
}
```

## Message Submission Schema

```json
{
  "role": "student|instructor",
  "scenarioId": "string",
  "messageType": "press_statement|social_post|interview_response|talking_points",
  "messageText": "string",
  "metadata": {
    "exerciseId": "string",
    "authorId": "string"
  }
}
```

## Persona Reaction Schema

```json
{
  "personaId": "string",
  "reactionSummary": "string",
  "sentiment": "negative|neutral|positive",
  "trustImpact": -100,
  "likelyInterpretation": "string",
  "repostLikelihood": "low|medium|high",
  "keyConcern": "string"
}
```

## Risk Finding Schema

```json
{
  "type": "opsec|escalation|misinterpretation|misinformation|policy",
  "severity": "low|medium|high",
  "evidence": "string",
  "recommendation": "string"
}
```

## Evaluation Result Schema

```json
{
  "evaluationId": "string",
  "scenarioId": "string",
  "overall": {
    "trustScore": 0,
    "escalationRisk": 0,
    "misinterpretationRisk": 0,
    "misinformationPotential": 0,
    "opsecConcernScore": 0
  },
  "personaReactions": [],
  "riskFindings": [],
  "explainability": {
    "scoreRationale": "string",
    "topDrivers": ["string"]
  },
  "rewrite": {
    "suggestedMessage": "string",
    "whyItImproves": ["string"]
  }
}
```

## Output Rules

- All scores use `0-100` scale except signed trust impact fields.
- Risk findings must include evidence and recommendation.
- Model output must be validated and normalized before storage.
- If `scenarioSourceType` is `dataset_generated`, `sourceDataset` and `sourceMetadata` are required.
- If `scenarioSourceType` is `instructor_custom`, `sourceDataset` must be `null` and provenance fields may be empty.
