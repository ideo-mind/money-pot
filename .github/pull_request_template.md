# PR Checklist

Please read and check all that apply.

Changesets

- [ ] This PR includes a Changeset under `.changeset/` describing the change (patch/minor/major) with a clear, user-focused summary
- [ ] OR this PR is docs/tests-only and I added the `skip-changeset` label

Quality

- [ ] UI builds locally: `bun run build` (Vite)
- [ ] E2E or unit tests added/updated where applicable (`playwright`, `vitest` if used)
- [ ] No breaking changes to public interfaces without a major bump

Notes

- Add a changeset via: `bun run changeset`
