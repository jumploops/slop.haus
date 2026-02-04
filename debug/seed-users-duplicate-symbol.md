# Seed Script Error: "seedUsers" Already Declared

## Problem
Running `pnpm --filter @slop/db seed` fails with:
```
/Users/adam/code/slop.haus/packages/db/src/seed/users.ts:23:22: ERROR: The symbol "seedUsers" has already been declared
```

## Hypotheses
1. **Name collision inside `packages/db/src/seed/users.ts`**
   - There may be a local const/variable named `seedUsers` and an exported function with the same name.
   - Solution: rename the local collection (e.g., `seedUserRows`) or function.

2. **Duplicate export or re-export of `seedUsers` in the same module**
   - The file could contain multiple `export function seedUsers` declarations due to partial edits.
   - Solution: remove or rename the duplicate.

3. **Type/value namespace conflict**
   - A type or interface could be named `seedUsers` and shadowing a value declaration.
   - Solution: rename the type or the function to avoid the conflict.

4. **Build tool concatenation or wrapper re-declaring**
   - If `tsx` or an import pattern is generating duplicate declarations, the bundler could effectively inline the same module twice with conflicting identifiers.
   - Solution: check `users.ts` for duplicate exports and verify that no other file defines `seedUsers` in the same scope (unlikely but possible if using `declare global`).

## Next Steps
- Inspect `packages/db/src/seed/users.ts` for duplicate identifiers or same-name declarations.
- Adjust names to remove conflicts and rerun the seed.
