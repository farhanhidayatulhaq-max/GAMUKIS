# Baseline Terukur

1. Estimated Bootstrap Footprint

The following values are derived from the individual file estimates recorded in this baseline. They must be reconciled with the actual audit-script output before being treated as final measurements.

Platform group

Required files assumed by the estimate

Estimated tokens

Codex, Hermes, OpenClaw, Copilot

AGENTS.md + INDEX.md + prd-standard.md

6,457–8,609

Antigravity, Gemini

GEMINI.md + the three files above

6,657–8,876

Claude Code

CLAUDE.md + .claude/CLAUDE.md + the three files above

7,195–9,593

Individual File Estimates

File

Estimated tokens

AGENTS.md

1,693–2,257

prd-standard.md

3,336–4,448

INDEX.md

1,428–1,904

Important: These totals assume that every listed file is loaded for the relevant prompt. A file referenced by an instruction is not necessarily loaded automatically. Verify the actual loading behavior of each platform before interpreting these figures as per-prompt context consumption.

The estimates must not be used as a substitute for actual input-token usage reported by the model provider or 9Router.

Missing Instruction References

The following referenced files were reported as absent from the analyzed repository:

.agents/docs/directory-blueprint.md

.github/instructions/backend.instructions.md

.github/instructions/frontend.instructions.md

.github/instructions/teamwork.instructions.md

Status: Repository findings pending reproduction against the exact archive.

Missing references should be classified as MISSING only after checking the actual repository paths. Determine whether each reference is mandatory, optional, outdated, or conditional before deciding whether to create, replace, or remove it.

2. Proposed L0 Instruction Budget

The proposed L0 instruction budget contains:

Component

Estimated tokens

Header

117–156

Proposed hierarchical Section 1

208–278

Section 2 — PRD Gate

268–358

Section 5 — Anti-Slop

305–406

Total

898–1,198

Proposed Section 1 is documented in reference/proposed_section1.md.

Using the corrected bootstrap estimates, the projected reduction in instruction footprint is approximately 86.1% for eligible prompts that can operate with L0 alone.

This is a projection, not an experimentally measured token saving.

The comparison is valid only when:

Both configurations use the same task and equivalent required context.

The original configuration loads the assumed baseline files.

The optimized configuration loads only the intended L0 instructions.

No additional references, skills, history, or tool outputs materially change the comparison.

Coding tasks must be measured separately because they may require domain-specific skills, PRD documents, repository context, and additional instructions.

The L0 budget is a design target, not a universal token limit for every platform.

3. Agent File Groups

The following inventory was reported in the initial audit and remains subject to reproduction.

Group

Reported file count

Estimated tokens

Copilot personas (.github/agents/)

6

3,845–5,127

Claude agents (.claude/agents/)

3

737–982

Skills (.agents/skills/)

8

6,450–8,600

Memory (.agents/memory/)

2

1,082–1,443

PRD documents (.agents/docs/)

6

9,751–13,002

These figures describe file inventories and estimated content sizes. They do not imply that every file is loaded for every prompt.

For reproducibility, record the file paths, character counts, exclusions, and inclusion rules used to produce each group total.

4. Noise and Duplication

Residual Citation Markers

The initial audit reported 37 occurrences of [cite: N] across six files, corresponding to an estimated 84–111 tokens.

This is a small potential source of noise. Remove these markers only after confirming that they are obsolete export artifacts and do not represent meaningful citations or references.

Agent Instruction Duplication

The initial audit reported these n-gram overlap figures:

File

Reported overlap

Budi.agent.md

47%

Nika.agent.md

35%

frontend-agent.md

10%

Other files

6% or less

These percentages are preliminary findings until the calculation method is documented and reproduced.

The audit must define:

The n-gram normalization rules.

Whether overlap is measured against one file, all other files, or the entire corpus.

Whether repeated generic instructions count as duplication.

Whether shared rules are intentionally duplicated for platform compatibility.

Interpretation: High overlap is a signal for review, not proof of unnecessary content. The primary optimization target is unconditional loading of irrelevant instructions, followed by genuinely redundant content.

Do not remove necessary platform-specific instructions merely to reduce textual similarity.

5. Markdown Table Format Benchmark

The initial benchmark reported the following estimates across 20 Markdown tables with at least two data rows.

Format

Estimated tokens

Difference from original Markdown

Original Markdown

5,331

Baseline

Compact Markdown

4,865

-8.74%

JSON object arrays

6,703

+25.74%

Compact Markdown is approximately 27.42% smaller than JSON in this reported corpus.

These results apply only to the tested tables and estimation method. They do not prove that compact Markdown is universally more efficient.

The benchmark should record the input files, table count, row and column counts, character counts, transformation rules, and exact output for reproducibility.

Where possible, use the same tokenizer for all candidate formats.

6. Agent Configuration Validity

The initial audit reported the following issues. These findings must be verified against the actual files and the configuration schema of the relevant platform.

6.1 GitHub Copilot

Reported issue: .github/agents/Budi.agent.md has an unclosed YAML frontmatter block.

Required action:

Confirm that the opening --- has a matching closing delimiter.

Validate the YAML metadata.

Verify that the agent file follows the expected custom-agent format.

Confirm that the agent is discoverable by the intended Copilot environment.

6.2 Claude Code

Reported issues:

Three agent files lack name and description frontmatter.

backend-agent.md.md has a duplicated extension.

Required action:

Inspect each file's actual contents.

Validate metadata against the expected Claude Code subagent format.

Confirm the intended discovery paths.

Rename the duplicated extension if appropriate.

Verify that existing references are updated after any rename.

A duplicated extension alone does not prove that the agent is undiscoverable.

6.3 Claude Agent Configuration

Reported issue: .claude/config.json contains defaultAgent and keys named inspector, tilemap, combat, narrative, architect, and vision, with no corresponding agent files identified by the initial audit.

Required action:

Identify the tool or program that consumes config.json.

Determine the schema and expected meaning of each key.

Resolve explicit references to nonexistent agents.

Distinguish agent definitions from metadata, routing labels, and external-tool configuration.

Validate the resulting configuration using the relevant consumer.

Do not delete keys solely because their names do not match filenames.

7. Reproduction Commands

The initial audit provides these commands:

node reference/tokenAudit.cjs --root <root-repo>
node reference/tableFormatBench.cjs --root <root-repo>

Run them from the intended repository environment.

Before accepting their output:

Confirm that both scripts exist.

Inspect their counting and exclusion rules.

Confirm that the selected root points to the correct repository.

Capture the output and exit status.

Record warnings, skipped files, and errors.

Compare the reported totals against the inventory.

Repeat the run on the same snapshot to check reproducibility.

Do not describe the audit as successful if either script fails or skips relevant inputs without disclosure.

8. Phase 0 — Actual Usage Baseline

Before optimization, collect actual usage records from 9Router and the relevant provider integrations.

For each representative task, record:

Task identifier and category.

Model and provider.

Initial instruction files and their loading behavior.

Input tokens reported by the provider.

Cached input tokens, if reported.

Output tokens.

Tool-call or orchestration overhead, if available.

Success against predefined acceptance criteria.

Test results and unresolved failures.

Do not add provider usage fields together unless their definitions are compatible. Avoid double-counting cached input or other overlapping categories.

Where possible, compare equivalent tasks with the same model, tool permissions, repository snapshot, and acceptance criteria.

9. Phase 1 — Optimization Validation

Evaluate the original and optimized configurations against the same representative task set.

Required evaluation dimensions:

Task completion and acceptance-criteria compliance.

Functional defects and regression failures.

Security and instruction-compliance failures.

Incorrect file selection or agent routing.

Actual input and output token usage.

Latency and tool-call overhead where measurable.

Clarification frequency and unnecessary delegation.

Use repeated trials for tasks with nondeterministic outcomes. Report sample size, task mix, failures, and measurement limitations.

A lower token count is not a successful optimization if task quality, safety, or reliability deteriorates materially.

10. Status and Reporting Rules

Every significant result must be classified as one of:

MEASURED — Directly observed from a reproducible measurement.

ESTIMATED — Calculated using a documented approximation.

PROJECTED — Expected result awaiting validation.

UNVERIFIED — Not yet reproduced or supported by sufficient evidence.

BLOCKED — Could not be tested because of an identified blocker.

The final audit report must distinguish measured savings from projected savings and disclose any missing inputs.

11. Acceptance Criteria for the Baseline

This baseline is ready to support optimization decisions when:

File inventories and aggregate totals reconcile.

Estimation rules are documented and reproducible.

Platform loading assumptions have been verified.

Missing references and invalid configurations have evidence.

Original token usage is captured where actual usage records are available.

The proposed optimization can be compared against the original configuration.

Task quality and regression checks are included alongside efficiency metrics.

Until those conditions are met, treat this document as a preliminary audit baseline rather than a fully validated measurement report.