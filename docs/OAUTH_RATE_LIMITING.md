# OAuth Rate Limiting

## Configuration

A dedicated rate limit is applied to the GitHub OAuth authentication flow, covering both:

- `/external/auth/github`
- `/external/auth/github/callback`

The OAuth rate limiter uses the following configuration:

- **Threshold:** 10 requests per 15-minute window
- **Scope:** GitHub OAuth authentication and callback requests
- **Storage:** Rate-limit counters are maintained using Redis
- **Response:** Requests exceeding the OAuth threshold are rejected with HTTP `429 Too Many Requests`
- **Monitoring:** Rate-limit violations are logged through the application's existing `EventCreator` logging mechanism

## Purpose

The OAuth-specific rate limit provides a stricter security control than the application's global rate limit of 50 requests per minute.

Limiting OAuth authentication attempts reduces the opportunity for excessive automated requests, authentication-flow manipulation, and token-harvesting attempts while allowing normal authentication traffic to continue.

## Monitoring

When the OAuth rate limit is exceeded, the rejected request is logged through `EventCreator`.

These events can be monitored to identify excessive authentication attempts or other potentially abusive activity targeting the OAuth authentication flow.

## Testing

Automated tests verify that:

- Normal OAuth authentication requests are permitted within the configured threshold.
- Requests exceeding the 10-request threshold are rejected with HTTP `429`.
- Excessive requests to the OAuth callback endpoint are also rejected.
- Rate-limit violations are logged through `EventCreator`.
- Existing OAuth authentication and callback behavior continues to function within the configured rate limit.

The rate-limit tests use an isolated rate-limit state between tests so that individual test cases do not affect subsequent authentication tests.
