# 9Router Cost-Aware Routing — PRD Pack

**Status:** Draft — requires project-owner approval before implementation  
**Project:** Gamukis / embedded 9Router codebase  
**Purpose:** Improve model-combo selection, context/token efficiency, fallback decisions, and cost-per-successful-task measurement without duplicating 9Router's existing combo engine.

## Files in this pack

- `PRD.md` — problem statement, requirements, constraints, success metrics, acceptance criteria.
- `IMPLEMENTATION_BLUEPRINT.md` — proposed file-level change boundaries; verify against the live tree before approval.
- `ROUTING_POLICY.md` — proposed routing policy and decision order.
- `TEST_PLAN.md` — test strategy and release gates.

## Important

This pack is a specification, not an implementation. It intentionally does **not** modify runtime code, dependencies, database schemas, or existing agent instructions. Follow the repository's PRD-first workflow: review this pack, approve/revise the PRD and blueprint, then implement only the approved scope.

No savings percentage is guaranteed. Establish a baseline first, then measure quality, cost, latency, retries, and completion rate.
