# Phase 4: Anonymous Voting

## Goal
Implement anonymous voting with separate normal/dev channels.

## Tasks

### 4.1 Rater identity system

**Public rater:**
- On first vote, generate UUID
- Store in HttpOnly cookie: `slop_rater`
- Server stores HMAC hash of cookie value (not raw UUID)
- This becomes `rater_key_hash`

**Dev rater:**
- Requires verified dev status
- When verified dev requests dev credential:
  - Generate separate UUID
  - Store in HttpOnly cookie: `slop_dev_rater`
  - Not linked to user_id in any stored record
- This enables anonymous dev voting

### 4.2 Dev credential issuance
```
POST /api/v1/auth/dev-credential
```
- Requires auth + dev_verified=true
- Issues `slop_dev_rater` cookie
- Returns success (no data linking user to credential)

### 4.3 Vote API
```
POST /api/v1/projects/:slug/vote
```
Request:
```typescript
{
  channel: 'normal' | 'dev'
  value: 1 | -1 | 0  // 0 = remove vote
}
```

Logic:
- Read appropriate cookie (`slop_rater` or `slop_dev_rater`)
- If no cookie and channel='normal': generate and set cookie
- If no cookie and channel='dev': return 403 (need dev credential)
- Hash cookie value with server secret
- Upsert vote record
- Update denormalized counts on project

### 4.4 Denormalized count updates
On vote insert/update/delete:
- Recalculate `normal_up`, `normal_down`, `normal_score` OR
- Recalculate `dev_up`, `dev_down`, `dev_score`

Use a transaction to ensure consistency.

### 4.5 Vote state endpoint
```
GET /api/v1/projects/:slug/vote-state
```
- Check cookies, return current vote value for each channel
- Enables UI to show "you voted up/down"

### 4.6 Rate limiting
- Apply rate limits at edge (Cloudflare/WAF)
- Additional server-side limits:
  - Max 30 votes/minute per rater_key
  - Max 10 vote changes on same project per hour

### 4.7 Suspicious activity detection (basic)
- Log unusual patterns:
  - Same rater voting on 50+ projects in 1 minute
  - Rapid vote toggling
- For MVP: just log, don't block
- Later: add CAPTCHA trigger

## Dependencies
- Phase 3 (projects exist to vote on)

## Output
- Anyone can vote (normal channel)
- Verified devs can get credential and vote (dev channel)
- Votes are anonymous but deduplicated
- Project scores update in real-time
