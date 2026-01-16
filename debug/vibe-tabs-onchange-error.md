# Vibe Tabs onChange Error

**Status:** Resolved (2026-01-15)

## Problem

Clicking the "Detailed" tab in the Vibe Score component on the edit page throws a runtime error:

```
TypeError: onChange is not a function

src/components/ui/Tabs.tsx (25:26) @ onClick

  23 |           type="button"
  24 |           className={cn("tab", activeTab === tab.id && "active")}
> 25 |           onClick={() => onChange(tab.id)}
     |                          ^
  26 |         >
  27 |           {tab.label}
  28 |         </button>
```

## Root Cause

**Prop name mismatch** between consumer and component.

### Tabs Component (`src/components/ui/Tabs.tsx`)

```typescript
interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;  // <-- expects "onChange"
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  // ...
  onClick={() => onChange(tab.id)}  // <-- calls onChange
}
```

### VibeInput Component (`src/components/form/VibeInput.tsx`)

```tsx
<Tabs
  tabs={[
    { id: "overview", label: "Simple" },
    { id: "detailed", label: "Detailed" },
  ]}
  activeTab={mode}
  onTabChange={(id) => onModeChange(id as "overview" | "detailed")}  // <-- passes "onTabChange"
/>
```

The `VibeInput` component passes `onTabChange`, but `Tabs` expects `onChange`. Since `onChange` is undefined, calling it throws "onChange is not a function".

## Why TypeScript Didn't Catch This

TypeScript DOES catch this error:

```
src/components/form/VibeInput.tsx(59,9): error TS2322: Type '{ tabs: { id: string; label: string; }[];
activeTab: "overview" | "detailed"; onTabChange: (id: any) => void; }' is not assignable to type
'IntrinsicAttributes & TabsProps'.
  Property 'onTabChange' does not exist on type 'IntrinsicAttributes & TabsProps'.
  Did you mean 'onChange'?
```

The error wasn't caught during development because type checking wasn't run before testing.

## Codebase Analysis

### All Tabs Component Usages

| File | Prop Used | Status |
|------|-----------|--------|
| `apps/web/src/app/page.tsx:70` | `onChange` | ✓ Correct |
| `apps/web/src/app/admin/page.tsx:98` | `onChange` | ✓ Correct |
| `apps/web/src/components/form/VibeInput.tsx:59` | `onTabChange` | ✗ Bug |

**Finding:** Only 1 of 3 usages has the bug. The other 2 correctly use `onChange`.

## Fix Options

### Option A: Quick Fix (Minimal Change)

Change `onTabChange` to `onChange` in `VibeInput.tsx` only.

**Pros:**
- 1 file change
- Follows existing pattern used elsewhere
- `onChange` is standard React convention

**Cons:**
- Doesn't address root cause (unintuitive naming)
- Same mistake could happen again

**Files to change:**
- `apps/web/src/components/form/VibeInput.tsx` (line 59)

### Option B: Rename Prop (More Robust)

Rename the prop in `Tabs.tsx` from `onChange` to `onTabChange` for self-documenting clarity.

**Pros:**
- More intuitive - `onTabChange` clearly describes what triggers the callback
- Matches what developers naturally expect from a `Tabs` component
- Prevents future confusion

**Cons:**
- 4 files to change (component + all usages)
- Slightly more work

**Files to change:**
1. `apps/web/src/components/ui/Tabs.tsx` - Rename prop in interface and destructuring
2. `apps/web/src/app/page.tsx` - Update usage
3. `apps/web/src/app/admin/page.tsx` - Update usage
4. `apps/web/src/components/form/VibeInput.tsx` - Already uses `onTabChange` (no change needed!)

## Recommended Fix: Option B

Rename to `onTabChange` because:
1. It's more self-documenting for a domain-specific component
2. The buggy code was actually using the *intuitive* name - that's a signal
3. This same mistake has happened twice (admin page + vibe input)
4. 3 files need updates, but one of them (VibeInput) already has the correct name

## Implementation Plan

1. Update `Tabs.tsx`:
   - Change `onChange` to `onTabChange` in `TabsProps` interface
   - Change `onChange` to `onTabChange` in function destructuring

2. Update `page.tsx` (feed):
   - Change `onChange={handleSortChange}` to `onTabChange={handleSortChange}`

3. Update `admin/page.tsx`:
   - Change `onChange={(id) => ...}` to `onTabChange={(id) => ...}`

4. `VibeInput.tsx` - No change needed (already uses `onTabChange`)

5. Run type check to verify: `pnpm -F @slop/web exec tsc --noEmit`

## Resolution

Implemented Option B. Files changed:

| File | Change |
|------|--------|
| `apps/web/src/components/ui/Tabs.tsx` | Renamed `onChange` → `onTabChange` in interface and implementation |
| `apps/web/src/app/page.tsx` | Updated prop `onChange` → `onTabChange` |
| `apps/web/src/app/admin/page.tsx` | Updated prop `onChange` → `onTabChange` |
| `apps/web/src/components/form/VibeInput.tsx` | No change needed (already used `onTabChange`) |

Verified with `pnpm -F @slop/web exec tsc --noEmit` - no Tabs-related errors.
