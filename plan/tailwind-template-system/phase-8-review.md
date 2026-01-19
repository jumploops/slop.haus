# Phase 8 Review: LLM Theme Generation

**Date:** 2026-01-16
**Status:** Complete

## Implementation Summary

Phase 8 added LLM-powered theme generation. Users can describe a theme in natural language, and the system generates a valid ThemeSpec, compiles it to CSS, and applies it instantly.

### Architecture

```
User Prompt → API → LLM (Claude Haiku) → ThemeSpec JSON → Validation → CSS Compilation → Client
     │                         │                              │
     │                         ▼                              ▼
     │                   Zod Schema Check              :root[data-theme="user:xxx"] {
     │                   Contrast Warnings               --background: #hex;
     ▼                                                   --accent: #hex;
  "Make it cyberpunk                                     ...
   with neon pink"                                     }
```

### Files Created/Modified

| File | Action | Purpose |
|------|--------|---------|
| `packages/shared/src/theme-schema.ts` | Created | ThemeSpec schema + request schemas |
| `packages/shared/src/index.ts` | Modified | Export theme-schema |
| `apps/api/src/lib/theme-compiler.ts` | Created | Compile ThemeSpec to CSS |
| `apps/api/src/lib/theme-generator.ts` | Created | LLM theme generation |
| `apps/api/src/routes/themes.ts` | Created | API routes |
| `apps/api/src/index.ts` | Modified | Register themes routes |
| `apps/web/src/components/theme/ThemeGenerator.tsx` | Created | UI component |

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/themes/generate` | POST | Generate theme from prompt |
| `/api/v1/themes/compile` | POST | Compile ThemeSpec to CSS |
| `/api/v1/themes/presets` | GET | List preset themes |

### ThemeSpec Schema

```typescript
interface ThemeSpec {
  name: string;          // 1-50 chars
  description?: string;  // max 200 chars
  colors: {
    bg: string;          // #xxxxxx - main background
    bgSecondary: string; // #xxxxxx - cards, inputs
    fg: string;          // #xxxxxx - main text
    muted: string;       // #xxxxxx - secondary text
    border: string;      // #xxxxxx - borders
    accent: string;      // #xxxxxx - brand color
  };
  radius?: "sharp" | "subtle" | "rounded" | "pill";
  density?: "compact" | "normal" | "spacious";
}
```

### Theme Compiler Features

1. **Derived Colors:**
   - `--accent-dim`: Darkened accent for hover states
   - `--accent-foreground`: Contrast color for text on accent
   - Semantic colors (danger, warning, success)

2. **Contrast Warnings:**
   - Checks fg/bg contrast (should be ≥4.5:1)
   - Checks muted/bg contrast (should be ≥3:1)
   - Checks accent/bg contrast
   - Returns warnings in API response

3. **CSS Output:**
   - Overrides BASE variables (`--background`, not `--color-bg`)
   - Scoped to `data-theme="user:${id}"`
   - Includes radius mapping

### LLM Integration

- Model: `claude-3-haiku-20240307` (fast, cheap)
- Native fetch (no SDK, per project convention)
- System prompt with schema and guidelines
- Handles markdown code block stripping
- Validates output against Zod schema

### ThemeGenerator Component

```tsx
<ThemeGenerator />
// - Text input for theme description
// - Generate button with loading state
// - Calls API, applies theme via applyUserTheme()
// - Shows success/warning toasts
```

## Verification Results

| Check | Result |
|-------|--------|
| Shared package | Builds successfully |
| API package | Builds successfully |
| Web package | Only pre-existing AuthButtons error |
| Routes registered | themes routes in index.ts |

## TypeScript Status

**Pre-existing error (NOT from Phase 8):**
- `AuthButtons.tsx:49` - src type mismatch (string | null | undefined vs string | null)

## Testing Notes

### Manual Testing

1. **Generate endpoint:**
   ```bash
   curl -X POST http://localhost:3001/api/v1/themes/generate \
     -H "Content-Type: application/json" \
     -d '{"prompt": "cyberpunk with neon pink accents"}'
   ```

2. **Compile endpoint:**
   ```bash
   curl -X POST http://localhost:3001/api/v1/themes/compile \
     -H "Content-Type: application/json" \
     -d '{"spec": {"name": "Test", "colors": {...}}}'
   ```

3. **UI Testing:**
   - Add `<ThemeGenerator />` to a page (e.g., settings or theme-gallery)
   - Enter a prompt and click Generate
   - Theme should apply instantly
   - Check for contrast warnings in toast

### Environment Requirements

```bash
# Required in .env
ANTHROPIC_API_KEY=sk-ant-...
```

## Security Considerations

1. **Input Validation:**
   - Prompt length capped at 500 characters
   - ThemeSpec validated against strict Zod schema
   - Only hex colors allowed

2. **Output Sanitization:**
   - CSS output is template-based, not arbitrary
   - No `url()`, `@import`, or custom selectors
   - Only CSS custom property assignments

3. **Rate Limiting:**
   - Consider adding rate limiting for production
   - LLM calls are expensive

## Integration Points

**Phase 7 (Runtime Theming):**
- Uses `applyUserTheme()` from useTheme hook
- CSS injected into `<style id="user-theme-styles">`
- Persisted to localStorage

**Phase 6 (Presets):**
- Uses same CSS variable names
- User themes use `user:${id}` prefix

## Next Steps (Phase 9)

1. Clean up legacy CSS classes from globals.css
2. Remove unused CSS variables
3. Final verification of all components
4. Production deployment considerations
