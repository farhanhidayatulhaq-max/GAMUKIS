---
name: project-workflow
description: 'Use when planning, debugging, or implementing work in this repository. Routes tasks to the correct backend, frontend, or game-dev workflow, applies the project rules, and validates the result with the smallest relevant test or lint check.'
argument-hint: 'Describe the task, bug, or feature and the relevant area (backend, frontend, or game logic)'
user-invocable: true
disable-model-invocation: false
---

# Gamukis Project Workflow

## When to Use
- Implementing or fixing backend APIs, database logic, or auth flows
- Working on frontend screens, state, user flows, or API integration
- Debugging game logic, gameplay loops, inventory state, or controller input
- Reviewing work before completion and validating with the relevant checks

This skill follows the project guidance in [AGENTS.md](../../AGENTS.md) and applies the multi-agent workflow used in this repository.

## Core Routing Rules

### 1. Backend agent
Use when the work involves API logic, server behavior, database access, authentication, validation, or error handling.

Apply these rules:
- Prefer modular, clean architecture
- Return correct HTTP status codes and structured errors
- Validate and sanitize all incoming data
- Include clear tests or type-level verification when relevant

### 2. Frontend agent
Use when the work involves UI/UX, components, state management, page flows, or API integration.

Apply these rules:
- Keep components isolated, reusable, and responsive
- Maintain consistent styling and theme behavior
- Avoid unnecessary re-renders and state churn
- Handle loading and error states clearly for users

### 3. Game dev agent
Use when the work involves gameplay loop logic, states, inventory systems, tilemap/assets, or controller input.

Apply these rules:
- Optimize gameplay performance and memory use
- Separate game logic from rendering/display logic
- Manage structured game states such as start, pause, and game over
- Keep input handling responsive and low-latency

### 4. General project rule
For every task, run the smallest relevant lint/test command if one is available before finalizing the change.

## Procedure

1. Identify the task domain.
   - Is it backend, frontend, or game logic?
   - What files or modules are likely involved?

2. Gather the minimum context needed.
   - Read only the relevant files and avoid broad exploration.
   - Confirm the actual root cause before changing code.

3. Apply the correct persona rules.
   - Choose the backend, frontend, or game dev workflow that matches the work.
   - Keep the solution focused and consistent with existing project patterns.

4. Implement the smallest correct fix.
   - Avoid unrelated refactors or speculative changes.
   - Preserve existing architecture and conventions.

5. Validate the result.
   - Run the relevant lint/test command or equivalent check.
   - Fix any breakage immediately before concluding.

6. Report concisely.
   - Summarize what changed and why.
   - Mention any validation performed and its result.
   - Keep the response direct and technical.

## Decision Points

- If the issue is API, server, database, or auth-related, choose the backend workflow.
- If the issue is page behavior, UI layout, component state, or client-side data flow, choose the frontend workflow.
- If the issue is movement, game state, inventory, assets, or input responsiveness, choose the game-dev workflow.
- If the task spans multiple domains, work in the most relevant domain first and keep the fix scoped to that layer.

## Completion Checks

Before considering the task complete, confirm all of the following:
- The root cause was identified and addressed
- The implementation is limited to the relevant area
- The relevant project rules were applied
- Lint/test validation was run if available
- The final explanation is concise and specific to the actual change

## Example Prompts
- "Debug the auth failure in the backend API"
- "Add a responsive settings panel to the frontend"
- "Fix the player movement bug in the game loop"
- "Validate this change with the smallest relevant test command"
- "Review this feature and apply the correct project workflow"
