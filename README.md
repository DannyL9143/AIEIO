# AIEIO

Artificial Intelligence Educator for Information Operations (AIEIO)

AIEIO is a lightweight AI Red Team for Public Affairs messaging. It helps Marines draft mission communications, simulate how different audiences react, and receive explainable risk and effectiveness feedback in minutes.

## Hackathon Scope (48 Hours)

This project is intentionally scoped for a 2-day build:

- Dual-mode scenario creation:
  - Dataset-generated piracy scenarios from authoritative data in `data/CORSAIR` and `data/GlobalMaritime`
  - Instructor-authored custom scenarios
- Scenario list includes rich metadata context from source records (for dataset-generated mode)
- Synthetic audience simulation across 4-6 audience groups
- Risk scanner for OPSEC, escalation, misinterpretation, and misinformation potential
- Explainable scorecard with message rewrite recommendations

Out of scope for hackathon MVP:

- Full training platform replacement
- Complex model training pipelines
- Real-time voice/avatar simulation
- Deep military system integrations

## Quick Start (Documentation-First)

1. Read the project direction in `docs/PROJECT_PLAN.md`
2. Confirm MVP requirements in `docs/PRODUCT_REQUIREMENTS.md`
3. Lock contracts in `docs/DATA_SCHEMAS.md` and `docs/API_SPEC.md`
4. Execute task list in `docs/TODO.md`
5. Validate with `docs/TEST_PLAN.md`
6. Rehearse final presentation with `docs/DEMO_SCRIPT.md`

## Documentation Index

- `docs/PROJECT_PLAN.md` - Mission, value proposition, success criteria, non-goals
- `docs/HACKATHON_EXECUTION_PLAN.md` - Day 1/Day 2 schedule and risk fallback
- `docs/PRODUCT_REQUIREMENTS.md` - MVP requirements and acceptance criteria
- `docs/USER_FLOWS.md` - Student/instructor flow definitions
- `docs/ARCHITECTURE.md` - Node backend and web UI architecture
- `docs/DATA_SCHEMAS.md` - JSON contracts for scenario/persona/evaluation
- `docs/API_SPEC.md` - API endpoint contract draft
- `docs/PROMPT_LIBRARY.md` - Prompt templates and guardrails
- `docs/TODO.md` - Actionable, time-boxed build checklist
- `docs/TEST_PLAN.md` - Fast validation and regression checklist
- `docs/DEMO_SCRIPT.md` - 3-5 minute judge-ready walkthrough

## Team Working Rules

- Keep all features tied to visible demo value.
- Prefer deterministic output JSON from model calls.
- Use mock/fallback responses if API reliability is unstable.
- Ship end-to-end flow first, polish second.
