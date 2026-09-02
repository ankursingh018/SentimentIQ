# Live Social Data Integration

The dashboard supports three free live data sources. Data is polled every 30 seconds and pushed to the dashboard (KPIs, Global Sentiment, Sentiment Trends, Recent Mentions).

## Data source selection

Priority order (first configured wins):

1. **Bluesky** — when `BLUESKY_HANDLE` and `BLUESKY_APP_PASSWORD` are set.
2. **Reddit** — when all Reddit env vars are set.
3. **Mastodon** — when `MASTODON_ACCESS_TOKEN` is set.

---

## Bluesky (app password)

Uses your Bluesky handle and an **app password** (created in Bluesky Settings → App passwords). The app password is the key you get when you create a new app password (e.g. `xxxx-xxxx-xxxx-xxxx`).

### Environment variables

In the project root, create or edit `.env` (do not commit real credentials):

```env
# Bluesky (both required for Bluesky as data source)
BLUESKY_HANDLE=yourhandle.bsky.social
BLUESKY_APP_PASSWORD=your_app_password_here
```

- **BLUESKY_HANDLE**: Your Bluesky handle (e.g. `user.bsky.social`).
- **BLUESKY_APP_PASSWORD**: The app password from Bluesky (Settings → App passwords → Create app password). Format is like `xxxx-xxxx-xxxx-xxxx`.

Optional:

- **BLUESKY_LIMIT** (default 50, max 100): Number of timeline posts per request.
- **BLUESKY_DEBUG** (set to `1` or `true`): Log feed item count and parsed post count to the server console to debug missing responses.

If your **home timeline is empty** (e.g. new account or no follows), the service automatically falls back to the public **What's Hot** feed so you still get Bluesky posts.

### Run the server

Start the backend (e.g. `npm run server`). If Bluesky env vars are set, the server will log:

`Live data source: Bluesky (BLUESKY_* env set)`

---

## Reddit (OAuth2 script app)

### 1. Create a Reddit app

1. Go to [Reddit Apps](https://www.reddit.com/prefs/apps).
2. Click **“create another app...”**.
3. Choose **“script”**.
4. Set name and redirect URI (e.g. `http://localhost:8080`); redirect is not used for script apps.
5. Save. Note:
   - **client_id**: under “personal use script” (short string).
   - **client_secret**: labeled “secret”.

### 2. Environment variables

In the project root, create or edit `.env` (do not commit real credentials):

```env
# Reddit (all required for Reddit as data source)
REDDIT_CLIENT_ID=your_client_id_here
REDDIT_CLIENT_SECRET=your_client_secret_here
REDDIT_USERNAME=your_reddit_username
REDDIT_PASSWORD=your_reddit_password
REDDIT_USER_AGENT=SentimentDashboard/1.0 by u/your_username
```

- **REDDIT_USER_AGENT**: Required by Reddit; identify your app (e.g. `AppName/1.0 by u/username`).
- **REDDIT_SUBREDDIT** (optional): Default is `popular`. Set to e.g. `all` or `technology` to change the feed.
- **REDDIT_LIMIT** (optional): Posts per request (default 40, max 100).

### 3. 2FA

If the account uses 2FA, set:

```env
REDDIT_PASSWORD=your_password:2fa_code
```

(Replace with the current 2FA code when it changes, or use an app password if Reddit supports it.)

### 4. Run the server

Start the backend (e.g. `npm run server`). If Bluesky is not configured but Reddit env vars are set, the server will log:

`Live data source: Reddit (REDDIT_* env set)`

Otherwise it uses Mastodon (if configured).

---

## Mastodon (fallback)

If Reddit is not configured, the server uses Mastodon:

```env
MASTODON_ACCESS_TOKEN=your_mastodon_access_token
```

Public timeline: `https://mastodon.social/api/v1/timelines/public`.

---

## Pipeline (integration points)

1. **Fetch**: `server/services/bluesky.cjs` (`fetchPublicPosts`), `server/services/reddit.cjs` (`fetchPublicPosts`), or `server/services/mastodon.cjs` (`fetchPublicTimeline`).
2. **Text cleaning** (Bluesky & Reddit): `bluesky.cjs` / `reddit.cjs` `cleanText()` — strips HTML, URLs, emojis, excess special characters.
3. **Sentiment**: `server/services/sentiment.cjs` — VADER; labels: positive, neutral, negative.
4. **Dashboard shape**: `server/services/dashboardData.cjs` — `buildDashboardData(posts)` returns the structure expected by the frontend.
5. **Store**: `server/index.cjs` — `pollAndUpdateDashboard()` merges new posts into a 24h rolling store and calls `setDashboardData(buildDashboardData(accumulated))`.
6. **API**: `GET /api/sentiment/dashboard` — returns the same structure; frontend polls every 30s.

Errors (network, API errors, rate limits) are logged; the dashboard keeps showing the last successful data.
