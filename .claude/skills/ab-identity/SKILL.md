---
name: ab-identity
description: Layer 1 of the SaaS A/B testing framework — Identity Infrastructure. Use this skill when the user wants to set up user identity tracking, anonymous ID generation, user ID / account ID schemas, session tracking, or identity stitching for A/B experimentation. Trigger whenever the user says /identity, mentions "identity layer", "anonymous ID", "user tracking setup", "identity stitching", or asks how to connect pre-signup behavior to post-signup conversions.
---

# Layer 1: Identity Infrastructure

Your job is to guide the user through designing their identity layer — the foundation every downstream experiment depends on. Without clean identity, variant assignment leaks, attribution breaks, and conversion metrics become untrustworthy.

## Step 1: Ask These Questions First

Before generating anything, collect answers to these. Ask them all at once in a numbered list so the user can reply in one message.

1. **B2B or B2C?** — B2B needs account-level identity (multiple users per org). B2C is user-level only.
2. **Auth method?** — Email/password, Google OAuth, GitHub OAuth, SSO, or magic link?
3. **Trial model?** — Free trial (no CC), free trial (CC required), freemium, or demo-only?
4. **Frontend stack?** — React, Vue, plain JS, mobile (iOS/Android), or server-rendered?
5. **Do users collaborate?** — Can multiple users share a workspace/account? (affects experiment assignment unit)

## Step 2: Generate Identity Schema

Based on answers, produce the following outputs:

### 2a. ID Generation Code (client-side)

Generate a JavaScript/TypeScript module that:
- Creates `anonymous_id` on first visit using `crypto.randomUUID()` stored in `localStorage` + cookie (belt-and-suspenders for cookie-blocked environments)
- Creates `session_id` per browser session using `sessionStorage`
- Exposes a `getIdentity()` function returning `{ anonymous_id, session_id, user_id?, account_id? }`
- Handles the identity merge when a user signs up or logs in

```typescript
// identity.ts
const ANON_KEY = 'ab_anonymous_id';
const SESSION_KEY = 'ab_session_id';

export function getAnonymousId(): string {
  let id = localStorage.getItem(ANON_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(ANON_KEY, id);
    document.cookie = `${ANON_KEY}=${id}; max-age=31536000; SameSite=Lax`;
  }
  return id;
}

export function getSessionId(): string {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function getIdentity(userId?: string, accountId?: string) {
  return {
    anonymous_id: getAnonymousId(),
    session_id:   getSessionId(),
    user_id:      userId,
    account_id:   accountId,
  };
}
```

Adapt to the user's frontend stack (React hook, Vue composable, plain module, etc.).

### 2b. Identity Stitching Table (SQL)

Generate the SQL table that joins anonymous pre-signup behavior to the authenticated user.

For B2B, include `account_id`. For B2C, omit it. Always include UTM fields — they answer "which acquisition channel converts best."

```sql
CREATE TABLE identity_stitching (
    id                  BIGSERIAL PRIMARY KEY,
    anonymous_id        VARCHAR(36)  NOT NULL,
    user_id             VARCHAR(36)  NOT NULL,
    account_id          VARCHAR(36),           -- B2B only
    stitched_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    signup_method       VARCHAR(50),           -- email | google_oauth | github_oauth
    utm_source          VARCHAR(255),
    utm_medium          VARCHAR(255),
    utm_campaign        VARCHAR(255),
    referrer            TEXT,
    UNIQUE(anonymous_id),
    UNIQUE(user_id)
);

CREATE INDEX idx_identity_user_id    ON identity_stitching(user_id);
CREATE INDEX idx_identity_account_id ON identity_stitching(account_id);
```

### 2c. Server-Side Stitch Trigger

Show a pseudocode/real handler that writes to the stitching table at signup completion:

```typescript
// Called server-side at signup completion
async function stitchIdentity(
  anonymousId: string,
  userId: string,
  accountId?: string,
  meta?: { signupMethod: string; utmSource?: string; utmMedium?: string; utmCampaign?: string; referrer?: string }
) {
  await db.query(`
    INSERT INTO identity_stitching
      (anonymous_id, user_id, account_id, signup_method, utm_source, utm_medium, utm_campaign, referrer)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (anonymous_id) DO UPDATE SET user_id = EXCLUDED.user_id
  `, [anonymousId, userId, accountId, meta?.signupMethod,
      meta?.utmSource, meta?.utmMedium, meta?.utmCampaign, meta?.referrer]);
}
```

### 2d. Experiment Assignment Unit Recommendation

Based on their answers, explicitly state:
- **B2B with collaboration** → assign at `account_id` level. Never split teammates into different variants.
- **B2C** → assign at `user_id` level (post-auth) or `anonymous_id` (if testing pre-signup flows).
- Explain why: contamination happens when users in the same account see different variants and compare notes or share state.

## Step 3: Summary

End with:
1. A recap of what was generated and where each file lives
2. The experiment assignment unit recommendation
3. "Next step" pointing to `/events`
