# Project Plan

## Mission

Build a practical AI-enabled training assistant that improves Public Affairs and Information Operations messaging decisions through fast, explainable audience simulation.

## Problem Statement

Current PA/IO training often relies on subjective evaluator feedback. Marines need a way to stress-test messages against realistic audience reactions and communication risks before dissemination.

## Winning Angle

**AI Red Team for Public Affairs Messaging**:

- Marine drafts a message
- System simulates multiple synthetic audience reactions
- System highlights operational communication risks
- System proposes improved wording
- Marine sees measurable score improvements after revision

## Objectives

1. Deliver an end-to-end demo in under 5 minutes.
2. Provide objective, explainable outputs (not just sentiment labels).
3. Support repeatable scenario-based exercises with dual-mode scenario creation.
4. Keep implementation modular for future integration.

## Success Criteria

- At least 5 scenario choices available, including metadata-rich options generated from authoritative piracy datasets
- At least 4 audience groups simulated per run
- Risk scanner reports OPSEC, escalation, misinterpretation, misinformation, and policy concerns
- Scorecard includes trust score and actionable recommendations
- Revised message shows score or risk-profile improvement
- Instructor can explicitly choose dataset-generated or fully custom scenario path

## Non-Goals (Hackathon)

- Building a full learning management system
- Real-time social platform emulation
- Training custom foundation models
- Voice/face/avatar generation
- Deep integration with TECOM/TRASYS production systems

## Demo Narrative

1. Instructor selects scenario mode: dataset-generated or custom.
2. Choose dataset-generated scenario: piracy-related incident with source metadata context.
3. Draft initial press statement.
4. Run simulation across six audiences.
5. Show scorecard and risk warnings.
6. Apply AI rewrite recommendation.
7. Re-run and show measurable improvement.

## Dependencies

- LLM API key and account access
- Node.js runtime
- Browser-accessible frontend
- JSON seed data for scenarios and personas
- Authoritative datasets in `data/CORSAIR` and `data/GlobalMaritime`

## Risks and Mitigations

- API latency/failure -> implement canned fallback response mode.
- Prompt inconsistency -> enforce strict output schema validation.
- Over-scope risk -> prioritize only must-have flow before enhancements.
- Dataset quality/coverage gaps -> allow instructor custom scenario authoring and include provenance flags in generated scenarios.
