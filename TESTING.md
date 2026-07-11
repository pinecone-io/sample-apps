# Testing & CI — the sample-apps test gate

This repo ships **no versioned artifact**. Its value is that every sample app
still **compiles, boots, and behaves**. CI enforces that with an
**execution-based test gate**: each app is built and then *driven* while
running. This document is the reusable pattern — other Pinecone example repos
should adopt the same shape.

## What CI does

Workflow: [`.github/workflows/ci.yml`](.github/workflows/ci.yml). One job per
app (they run in parallel):

| App | Build | Smoke / behavior check |
|-----|-------|------------------------|
| `legal-semantic-search` | `next build` | boot `next start`, expect **HTTP 200** on `/` |
| `namespace-notes/client` | `next build` | boot `next start`, expect **HTTP 200** on `/` |
| `namespace-notes/server` | `npm install --include=dev && tsc` | boot `node dist/index.js`, expect **any HTTP response** (process alive + routing) |
| `pinecone-assistant` | `next build` (pnpm) | boot `next start`, expect **HTTP 200** on `/` |
| `shop-the-look/web` | `next build` | boot `next start`, expect **HTTP 200** on `/` |
| `shop-the-look/api` | pip install | `pytest` boots the FastAPI app (Pinecone mocked) and asserts the root route serves |

**Build** catches the failure that matters most for an example: source that no
longer compiles or typechecks against its pinned Pinecone client. **Smoke** then
proves the built app actually starts and serves — not just that `tsc`/`next
build` was happy.

## Pinecone is mocked or gated — never live in CI

Per the repo `AGENTS.md` rule, CI does **not** connect to Pinecone:

- **Node apps** get a **dummy** `PINECONE_API_KEY` (`pclocal-ci-dummy-key`). The
  Pinecone TS client only requires the key to be a non-empty string at
  construction, so the app boots; the homepage smoke never triggers a live call.
  The `namespace-notes` server *does* reach Pinecone on its document routes, so
  its smoke accepts **any** HTTP response — a `500` from the gated client still
  proves the process booted and routes requests.
- **Python (`shop-the-look/api`)** mocks `pinecone.Pinecone` in
  [`shop-the-look/tests/test_smoke.py`](shop-the-look/tests/test_smoke.py) and
  sets dummy `PINECONE_*` env, then drives the app with FastAPI's `TestClient`.

No real key is ever committed or required for the gate.

## The reusable smoke helper

[`scripts/ci/smoke_http.sh`](scripts/ci/smoke_http.sh) boots a server command,
polls an HTTP endpoint until it responds (or times out), then shuts it down:

```bash
scripts/ci/smoke_http.sh <url> <200|any> -- <command to start the server...>
```

- `200` — require HTTP 200 (static homepage that doesn't need Pinecone).
- `any` — accept any HTTP response (proves the process booted and is routing,
  even if the handler errors because Pinecone is gated).

Reuse this in any Node/Python example repo that boots an HTTP server.

## Run the gate locally

```bash
# Node app (example: legal-semantic-search)
cd legal-semantic-search
npm install --legacy-peer-deps
PINECONE_API_KEY=pclocal-ci-dummy-key PINECONE_INDEX=ci-dummy-index VOYAGE_API_KEY=ci-dummy \
  npm run build
PINECONE_API_KEY=pclocal-ci-dummy-key \
  bash ../scripts/ci/smoke_http.sh "http://127.0.0.1:3000/" 200 -- npx next start -p 3000

# Python api (shop-the-look)
cd shop-the-look
pip install -r requirements.txt -r requirements-dev.txt
python -m pytest tests/ -q
```

## Run against real Pinecone (manual)

The gate above is intentionally offline. To exercise an app end-to-end against a
real Pinecone project, follow the app's own README, then export real credentials
in your shell instead of the dummy values:

```bash
export PINECONE_API_KEY="<your real key>"      # from https://app.pinecone.io
export PINECONE_INDEX="<your index>"           # legal-semantic-search
export PINECONE_INDEX_NAME="<your index>"      # shop-the-look/api
export PINECONE_TOP_K=5                         # shop-the-look/api
# ...plus any app-specific keys (VOYAGE_API_KEY, OpenAI, Google, etc.)
npm run dev        # or: uvicorn api.index:app --reload  (shop-the-look/api)
```

For the Python smoke, running against real Pinecone means dropping the
`mock.patch("pinecone.Pinecone")` in `tests/test_smoke.py` and exporting the real
`PINECONE_*` env before `pytest`.

## Live CI lane — blocked on PIN-50

A **live** validation lane (real Pinecone in CI, gated on a `PINECONE_API_KEY`
repository secret) is deliberately **not** wired up yet. It is blocked on
**PIN-50** (provision `PINECONE_API_KEY`, owner: jhamon@pinecone.io). When PIN-50
lands, add a separate job that runs only when the secret is present (self-skips
otherwise), following the `langchain-retrieval-agent-example` / `examples`
pattern from the DevRel OSS inventory.
