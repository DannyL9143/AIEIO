# User Flows

## Student Flow

1. Student logs in and selects role as `student`.
2. Student chooses a scenario from a generated list that can include metadata-backed piracy scenarios or receives an assigned scenario.
3. System displays scenario brief, stakeholders, communication risks, and objectives.
4. Student drafts one or more message artifacts.
5. Student submits message for simulation.
6. System returns:
   - Audience reactions
   - Risk warnings
   - Composite scorecard
   - Rewrite suggestion
7. Student revises and re-runs evaluation.
8. System stores scored attempt for metrics.

## Instructor Flow

1. Instructor logs in and selects role as `instructor`.
2. Instructor chooses scenario mode:
   - Dataset-generated from authoritative sources (`CORSAIR`, `GlobalMaritime`)
   - Fully custom scenario
3. If dataset-generated mode is selected:
   - Instructor applies optional filters (region, period, incident attributes)
   - System returns scenario candidates with available source metadata
   - Instructor selects one generated scenario
4. If custom mode is selected, instructor creates/edits scenario:
   - Context
   - Objectives
   - Risks
   - Stakeholders
5. Instructor runs scenario test with sample messaging.
6. System returns full simulation and risk outputs.
7. Instructor reviews quality and calibrates scenario settings.
8. Instructor test runs are marked non-scored for students.

## Shared Flow States

- Draft state: message editable
- Submitted state: evaluation in progress
- Results state: scorecard and rationale displayed
- Revision state: improved text generated and resubmittable

## Error and Fallback Flow

- If model call fails:
  - Show fallback notice
  - Load deterministic mock simulation output
  - Allow continuation for demo reliability

## Permissions Summary

- Student:
  - Read scenarios
  - Submit messages
  - View own results
- Instructor:
  - Generate scenarios from authoritative datasets
  - Create/edit custom scenarios
  - Run non-scored tests
  - View class-level metrics (if implemented)
