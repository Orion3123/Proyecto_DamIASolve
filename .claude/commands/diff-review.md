Run `git diff HEAD` and `git status` to see all current changes, then perform a thorough code review covering:

1. **Correctness** — logic errors, edge cases, off-by-one errors
2. **Security** — XSS, injection, insecure data handling, exposed secrets
3. **Performance** — unnecessary re-renders, expensive operations, N+1 queries
4. **Style** — consistency with existing patterns, naming, formatting
5. **Tests** — are changes covered? are existing tests still valid?

Format the review as:
- A short summary of what changed
- Numbered findings (severity: 🔴 critical / 🟡 warning / 🟢 suggestion)
- A final verdict: Ready / Needs changes / Blocked
