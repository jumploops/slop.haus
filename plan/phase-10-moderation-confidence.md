# Phase 10: Moderation Confidence Scoring

## Problem Statement

LLMs are overly cautious when labeling content. The current moderation system rejects content if ANY label is returned, regardless of the model's certainty. This leads to false positives like flagging a 1929 stock market crash simulator as "violence."

**Example of over-flagging:**
```
Content: "Shock Market Simulator - See what a 1929-style crash would look like today"
Label: "violence"
Reason: "The content references a '1929 style crash', which could be interpreted as a violent event"
```

This is clearly incorrect - the model is being overly cautious, conflating a historical financial event with violence.

## Solution Overview

Introduce a **per-label confidence scoring system** that:
1. Forces the LLM to articulate reasoning BEFORE labeling (chain-of-thought)
2. Assigns discrete confidence levels to each label
3. Only takes action on high-confidence violations
4. Stores all moderation data for prompt tuning and analysis

---

## Design Decisions

### Confidence Levels

| Level | Meaning | Action |
|-------|---------|--------|
| `low` | Uncertain, edge case, probably fine | Approve (log for analysis) |
| `medium` | Some concern, but ambiguous | Approve (log for analysis) |
| `high` | Strong signal of violation | Flag/Hide based on label severity |
| `absolute` | Definite, unambiguous violation | Reject immediately |

### JSON Response Structure

**Key ordering matters for chain-of-thought reasoning:**

```json
{
  "reason": "Overall analysis of the content, articulating the reasoning process",
  "labels": [
    { "label": "violence", "confidence": "low" },
    { "label": "nsfw", "confidence": "high" }
  ]
}
```

**Why this order:**
1. `reason` comes first - forces the LLM to think through the content before committing to labels
2. Within each label object: `label` then `confidence` - the model identifies what it sees, then calibrates certainty
3. This structure reduces premature/overconfident labeling

**Example responses:**

Clean content:
```json
{
  "reason": "This is a financial simulation tool discussing historical market events. The '1929 crash' refers to the stock market crash, a well-documented economic event. No policy violations.",
  "labels": []
}
```

Borderline content (should approve):
```json
{
  "reason": "The content discusses market crashes which could evoke financial anxiety, but this is educational/informational content about economics.",
  "labels": [
    { "label": "violence", "confidence": "low" }
  ]
}
```

Actual violation:
```json
{
  "reason": "The content contains explicit sexual descriptions that are clearly adult-only material.",
  "labels": [
    { "label": "nsfw", "confidence": "absolute" }
  ]
}
```

### Decision Matrix

| Label Type | Confidence | Decision | Project Status |
|------------|------------|----------|----------------|
| Any | low | approved | published |
| Any | medium | approved | published |
| REJECT_LABELS* | high | hidden | hidden (pending review) |
| Other labels | high | flagged | published (flagged for review) |
| REJECT_LABELS* | absolute | rejected | removed |
| Other labels | absolute | hidden | hidden |

*REJECT_LABELS = nsfw, illegal, malware

### Label Definitions (Updated Prompt)

| Label | Description | Examples |
|-------|-------------|----------|
| `nsfw` | Sexually explicit or pornographic content | Explicit imagery, pornographic text |
| `spam` | Commercial spam, scams, phishing | "Click here to win!", fake offers |
| `violence` | Graphic violence, gore, harm instructions | Detailed violence, weapon instructions |
| `harassment` | Targeted attacks, hate speech, bullying | Slurs, personal attacks, threats |
| `illegal` | Clearly illegal activities | Drug sales, fraud schemes |
| `copyright` | Obvious copyright infringement | Pirated content, stolen assets |
| `malware` | Malicious software or hacking tools | Viruses, exploit kits |

---

## Database Schema Changes

### Update `moderation_events` table

Current schema stores `labels` as a simple array. Need to store richer data:

```sql
-- Add new columns
ALTER TABLE moderation_events
ADD COLUMN labels_detailed jsonb,
ADD COLUMN confidence_level varchar(20);

-- labels_detailed structure:
-- [{ "label": "violence", "confidence": "low" }, ...]

-- confidence_level: highest confidence among all labels (for quick filtering)
-- Values: 'none', 'low', 'medium', 'high', 'absolute'
```

**New column definitions:**

| Column | Type | Description |
|--------|------|-------------|
| `labels_detailed` | jsonb | Array of `{ label, confidence }` objects |
| `confidence_level` | varchar(20) | Highest confidence level in the response |

The existing `labels` column can remain for backwards compatibility (simple array of label names).

### Schema file changes

```typescript
// packages/db/src/schema/moderation.ts

export const confidenceLevelEnum = pgEnum("confidence_level", [
  "none",
  "low",
  "medium",
  "high",
  "absolute",
]);

export const moderationEvents = pgTable("moderation_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  targetType: moderationTargetTypeEnum("target_type").notNull(),
  targetId: uuid("target_id").notNull(),
  model: varchar("model", { length: 100 }).notNull(),
  labels: jsonb("labels"),                    // Keep for backwards compat: ["nsfw", "spam"]
  labelsDetailed: jsonb("labels_detailed"),   // NEW: [{ label, confidence }, ...]
  confidenceLevel: confidenceLevelEnum("confidence_level").default("none"), // NEW
  decision: moderationDecisionEnum("decision").notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

---

## Code Changes

### 1. Shared Types (`packages/shared/src/moderation.ts`)

```typescript
export const CONFIDENCE_LEVELS = ["low", "medium", "high", "absolute"] as const;
export type ConfidenceLevel = typeof CONFIDENCE_LEVELS[number];

export const MODERATION_LABELS = [
  "nsfw", "spam", "violence", "harassment", "illegal", "copyright", "malware"
] as const;
export type ModerationLabel = typeof MODERATION_LABELS[number];

export const REJECT_LABELS: ModerationLabel[] = ["nsfw", "illegal", "malware"];

export interface LabelWithConfidence {
  label: ModerationLabel;
  confidence: ConfidenceLevel;
}

export interface ModerationResponse {
  reason: string;
  labels: LabelWithConfidence[];
}

export interface ModerationResult {
  approved: boolean;
  decision: "approved" | "flagged" | "hidden" | "rejected";
  labels: LabelWithConfidence[];
  highestConfidence: ConfidenceLevel | "none";
  reason: string;
}
```

### 2. Updated Prompt (`apps/api/src/lib/moderation.ts`)

```typescript
const MODERATION_PROMPT = `You are a content moderation system for a developer project showcase site.

Analyze the following content for policy violations. Be calibrated in your assessments - only flag content that genuinely violates policies, not content that merely touches on sensitive topics.

IMPORTANT: Historical events, educational content, and technical discussions are generally acceptable. A stock market "crash" is not violence. A security tool is not malware unless it's explicitly malicious.

Content to analyze:
"""
{CONTENT}
"""

Respond with a JSON object. The key order is important - reason MUST come first:

{
  "reason": "Your analysis of the content, explaining your reasoning",
  "labels": [
    { "label": "<label>", "confidence": "<level>" }
  ]
}

Available labels: nsfw, spam, violence, harassment, illegal, copyright, malware

Confidence levels:
- "low": Edge case, ambiguous, probably acceptable
- "medium": Some concern but not clear-cut
- "high": Strong signal of violation
- "absolute": Definite, unambiguous violation

If the content is acceptable, return an empty labels array.

Respond ONLY with valid JSON, no other text.`;
```

### 3. Moderation Logic (`apps/api/src/lib/moderation.ts`)

```typescript
export function evaluateModerationResult(
  response: ModerationResponse
): ModerationResult {
  const { reason, labels } = response;

  // No labels = approved
  if (labels.length === 0) {
    return {
      approved: true,
      decision: "approved",
      labels: [],
      highestConfidence: "none",
      reason,
    };
  }

  // Find highest confidence level
  const confidenceOrder = ["low", "medium", "high", "absolute"];
  const highestConfidence = labels.reduce((highest, { confidence }) => {
    return confidenceOrder.indexOf(confidence) > confidenceOrder.indexOf(highest)
      ? confidence
      : highest;
  }, "low" as ConfidenceLevel);

  // Low/medium confidence = approve but log
  if (highestConfidence === "low" || highestConfidence === "medium") {
    return {
      approved: true,
      decision: "approved",
      labels,
      highestConfidence,
      reason,
    };
  }

  // High/absolute confidence - check label severity
  const hasRejectLabel = labels.some(
    ({ label, confidence }) =>
      REJECT_LABELS.includes(label) &&
      (confidence === "high" || confidence === "absolute")
  );

  const hasAbsoluteReject = labels.some(
    ({ label, confidence }) =>
      REJECT_LABELS.includes(label) && confidence === "absolute"
  );

  if (hasAbsoluteReject) {
    return {
      approved: false,
      decision: "rejected",
      labels,
      highestConfidence,
      reason,
    };
  }

  if (hasRejectLabel) {
    return {
      approved: false,
      decision: "hidden",
      labels,
      highestConfidence,
      reason,
    };
  }

  // High confidence on non-reject labels = flag for review
  return {
    approved: true, // Still published, but flagged
    decision: "flagged",
    labels,
    highestConfidence,
    reason,
  };
}
```

### 4. Consolidate Duplicate Code

Currently, moderation logic is duplicated between:
- `apps/api/src/lib/moderation.ts` (sync moderation)
- `apps/worker/src/handlers/moderate-async.ts` (async moderation)

**Solution**: Extract shared moderation logic to `packages/shared` or create a shared internal package.

```
packages/
  shared/
    src/
      moderation.ts      # Types, labels, confidence levels
      index.ts           # Re-export

apps/
  api/
    src/
      lib/
        moderation.ts    # API-specific: moderateProject, moderateComment
                         # Uses shared types, calls Anthropic API

  worker/
    src/
      handlers/
        moderate-async.ts  # Import shared evaluateModerationResult
```

---

## Migration Plan

### Step 1: Database Migration

```sql
-- Add new enum type
CREATE TYPE confidence_level AS ENUM ('none', 'low', 'medium', 'high', 'absolute');

-- Add new columns to moderation_events
ALTER TABLE moderation_events
ADD COLUMN labels_detailed jsonb DEFAULT '[]',
ADD COLUMN confidence_level confidence_level DEFAULT 'none';

-- Backfill existing records (treat old labels as 'medium' confidence)
UPDATE moderation_events
SET labels_detailed = (
  SELECT jsonb_agg(jsonb_build_object('label', value, 'confidence', 'medium'))
  FROM jsonb_array_elements_text(labels)
),
confidence_level = CASE
  WHEN labels IS NULL OR labels = '[]' THEN 'none'
  ELSE 'medium'
END
WHERE labels_detailed IS NULL;
```

### Step 2: Update Shared Types

Add new types to `@slop/shared`.

### Step 3: Update API Moderation

Update `apps/api/src/lib/moderation.ts` with new prompt and evaluation logic.

### Step 4: Update Worker

Update `apps/worker/src/handlers/moderate-async.ts` to use shared types.

### Step 5: Update Project Creation

Adjust `apps/api/src/routes/projects.ts` to handle new decision types:
- `approved` → status = published
- `flagged` → status = published (add to mod queue)
- `hidden` → status = hidden
- `rejected` → status = removed

---

## Files to Modify

| File | Changes |
|------|---------|
| `packages/db/src/schema/moderation.ts` | Add `confidenceLevelEnum`, `labelsDetailed`, `confidenceLevel` columns |
| `packages/shared/src/moderation.ts` | NEW: Types, labels, confidence levels |
| `packages/shared/src/index.ts` | Export new moderation types |
| `apps/api/src/lib/moderation.ts` | New prompt, `evaluateModerationResult()`, update `moderateText()` |
| `apps/api/src/routes/projects.ts` | Handle new decision types |
| `apps/worker/src/handlers/moderate-async.ts` | Use shared evaluation logic |
| Drizzle migration | Add new columns |

---

## Testing Checklist

### Unit Tests
- [ ] `evaluateModerationResult` returns correct decisions for all confidence/label combos
- [ ] Empty labels = approved
- [ ] Low/medium confidence = approved
- [ ] High confidence + reject label = hidden
- [ ] Absolute confidence + reject label = rejected
- [ ] High confidence + non-reject label = flagged

### Integration Tests
- [ ] Create project with clean content → published
- [ ] Create project with borderline content (low confidence label) → published
- [ ] Create project with actual violation → hidden/rejected
- [ ] Verify moderation events logged with detailed labels

### Manual Validation
- [ ] Submit "Shock Market Simulator" → should be approved (low confidence at most)
- [ ] Submit project with borderline title → check logged confidence levels
- [ ] Submit obviously bad content → verify rejection works

---

## Monitoring & Tuning

### Metrics to Track

1. **Confidence distribution**: What % of submissions get each confidence level?
2. **False positive rate**: How many approved-after-review were incorrectly flagged?
3. **Label accuracy**: For each label, what's the precision at each confidence level?

### Query Examples

```sql
-- Confidence level distribution
SELECT confidence_level, COUNT(*)
FROM moderation_events
GROUP BY confidence_level;

-- Labels that are frequently low-confidence (candidates for prompt tuning)
SELECT
  label_item->>'label' as label,
  label_item->>'confidence' as confidence,
  COUNT(*) as count
FROM moderation_events,
  jsonb_array_elements(labels_detailed) as label_item
GROUP BY 1, 2
ORDER BY 1, 2;

-- Recent false positives (manually approved after being flagged)
SELECT me.*, p.title, p.status
FROM moderation_events me
JOIN projects p ON me.target_id = p.id
WHERE me.decision = 'hidden'
  AND p.status = 'published'
ORDER BY me.created_at DESC;
```

---

## Future Improvements

1. **A/B test prompts**: Store prompt version in moderation events for comparison
2. **Fine-tuning dataset**: Use confirmed decisions to create training data
3. **Confidence calibration**: Adjust thresholds based on observed accuracy
4. **Multi-model voting**: Use multiple models and take consensus for high-stakes decisions
5. **Human-in-the-loop**: Build admin UI to review flagged content and provide feedback

---

## Summary

This change makes moderation more nuanced by:
1. Requiring reasoning before labeling (reduces false positives)
2. Per-label confidence scoring (enables calibrated decisions)
3. Only acting on high-confidence violations (reduces over-moderation)
4. Storing detailed data for analysis and tuning (enables improvement over time)

The "1929 crash" simulator would now be approved because:
- The model would reason: "This is about financial/economic history"
- If it labels "violence", confidence would be "low"
- Low confidence → approved
