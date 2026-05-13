Read the plan or design document at the path provided as an argument (e.g. `/plan-review ~/docs/refactor-plan.md`).

Review it against the actual codebase and evaluate:

1. **Feasibility** — does the plan match what's actually in the code? Are assumptions correct?
2. **Completeness** — are there missing steps, unhandled edge cases, or overlooked dependencies?
3. **Risk** — what could go wrong? Breaking changes, data migrations, downtime?
4. **Scope** — is anything over-engineered or out of scope for the stated goal?
5. **Order of operations** — is the sequence of steps correct and safe?

If no path is provided, ask the user to supply one.

Output a structured review with section headings and a final Go / Go with changes / No-go recommendation.
