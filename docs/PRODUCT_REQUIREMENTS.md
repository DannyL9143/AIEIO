# Product Requirements (MVP)

## Product Goal

Provide a lightweight AI-enabled PA/IO training tool that simulates multi-audience reactions and returns explainable communication risk feedback.

## Users

- Student: drafts and tests messages
- Instructor: designs scenarios, runs non-scored test evaluations, reviews metrics

## Functional Requirements

1. **Scenario Handling**
   - System provides explicit dual-mode scenario creation:
     - Dataset-generated scenarios from authoritative piracy data (`CORSAIR`, `GlobalMaritime`)
     - Instructor-authored custom scenarios
   - Dataset-generated scenario list includes rich source metadata (for example location, date/time, incident type, vessel context, and source identifiers when available).
   - Scenario data includes objectives, stakeholders, and known risks.

2. **Audience Modeling**
   - System maps each scenario to relevant audience groups.
   - System generates or loads synthetic personas for each group.

3. **Message Input**
   - User submits at least one message artifact:
     - Press statement
     - Social post
     - Interview response
     - Commander talking points

4. **Audience Simulation**
   - System simulates likely reaction by each persona/group.
   - Output includes sentiment, trust impact, likely interpretation, and amplification tendency.

5. **Risk Scanner**
   - System identifies:
     - OPSEC leakage
     - Escalation potential
     - Misinterpretation risk
     - Viral misinformation potential
     - Policy/compliance concerns

6. **Explainable Feedback**
   - Dashboard presents transparent scoring and concise rationale per score.
   - System recommends improved wording and allows immediate re-evaluation.

7. **Role Modes**
   - Student evaluations count toward training metrics.
   - Instructor tests do not count toward student metrics.
   - Instructor chooses scenario mode each time: dataset-generated or custom.

## Non-Functional Requirements

- Fast response target: average evaluation under 10 seconds (demo environment)
- Clear, intuitive UI in browser
- Modular architecture with API contracts for future integration
- JSON-based data portability and deterministic output shape
- Clear provenance in generated scenarios so users can trace source dataset context

## Acceptance Criteria (MVP)

- User can complete scenario -> message -> simulation -> score -> rewrite loop.
- Instructor can generate scenario options from `CORSAIR` and `GlobalMaritime` data and view metadata-backed descriptions.
- Instructor can also create a fully custom scenario without dataset dependency.
- At least 4 audience groups and 1 adversarial/disinformation actor are included.
- Every risk flag includes plain-language rationale.
- Evaluation output is returned in stable JSON format.
- Demo runs with either live model mode or fallback mock mode.

## Requirement Traceability

| Requirement | Feature | Demo Evidence |
| --- | --- | --- |
| Scenario ingestion/generation | Scenario service + scenario JSON + provenance metadata | Scenario selected and displayed with source details |
| Audience identification | Persona generation/load | Persona cards in UI |
| User message evaluation | Evaluation endpoint + form | Submitted message shown in result |
| Simulated responses | Persona simulation engine | Audience-specific reactions visible |
| Explainable feedback | Scoring + rationale module | Scorecard with reason text |
| Training usability | Simple role-based flow | Student/instructor toggle in demo |

## Constraints

- Must be completed in 48 hours.
- No heavy infrastructure dependencies.
- Prefer low-maintenance implementation patterns.
- Design must tolerate partial dataset metadata while preserving scenario generation.
