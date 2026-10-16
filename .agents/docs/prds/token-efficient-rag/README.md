# RAG Token Savings — PRD Pack

**Status:** Draft — requires project owner approval before any implementation
**Project:** Gamukis
**Objective:** Reduce the number of tokens sent to the model for (1) the product’s Gen-AI features and (2) all AI Agents in the project’s folder workflow, using the “RAG Token Efficiency” flowchart, without compromising answer quality and without creating a second combo engine, gateway, or compressor.

## Package Contents

| File | Function |
|---|---|
| `PRD.md` | Issues, objectives, requirements (FR-1..FR-15), metrics, risks, questions for the owner |
| `PIPELINE_SPEC.md` | Node-by-node flowchart analysis, optimized flowchart (`optimized-pipeline.png`), decision table, loop limits |
| `AGENT_INTEGRATION.md` | L0/L1/L2 hierarchical context, namespace mapping to agents and combos, how each platform uses them |
| `IMPLEMENTATION_BLUEPRINT.md` | **Blueprint Files & Folders** according to the `gamukis-prd-guard` gate, phases, and build sequence |
| `TEST_PLAN.md` | Test matrix, fixed evaluation set, shadow mode for gates, release gates |
| `BASELINE.md` | Metrics from the `GAMUKIS.zip` archive and how to reproduce them |
| `PROPOSED_CHANGES.md` | **Unimplemented** changes: text proposals, code hygiene findings, and security findings |
| `reference/` | CommonJS reference implementation + 20 tests, baseline metrics. Not part of the repo |

## Important

- This is a specification, not an implementation. No runtime code, dependencies, database schemas, or agent instructions have been modified.
- No changes were made to `9router/`, `n8n/`, or `.kilo/` (restricted zones according to `prd-standard.md` §1.1). RAG calls 9Router via HTTP.
- No savings percentages are promised. The numbers in `BASELINE.md` are estimates ranging from 4 characters to 3 characters and serve only as a basis for before-and-after comparisons.
- `reference/` is for verifying the specification only. Do not copy it to the repo until the PRD has `APPROVED` status and the blueprint has been approved.

## Running reference verification

```text
node --test reference/ragCore.reference.test.cjs        # 20 tests
node reference/tokenAudit.cjs --root <root-repo>         # agent context baseline
node reference/tableFormatBench.cjs --root <root-repo>   # table formatting cost on the original table
```

## How to Approve

1. The owner answers the “Questions for the Owner” section in `PRD.md` §14.
2. After Phase 0 (read-only audit), the blueprint is updated with the verified path.
3. The status is changed to `APPROVED`. Only then may the files in the blueprint be created.
