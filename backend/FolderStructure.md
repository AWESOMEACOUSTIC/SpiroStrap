# Backend Folder Structure

This document describes the backend project layout and the responsibility of each module.

## Structure (Tree)

```
backend/
├─ README.md
├─ package.json
├─ package-lock.json
├─ .env.example
├─ .gitignore
└─ src/
   ├─ server.js                    # entrypoint: starts HTTP server
   ├─ app.js                       # builds express app (middleware + routes)
   ├─ config/
   │  ├─ env.js                     # env parsing/validation (PORT, MONGO_URI, etc.)
   │  ├─ logger.js                  # logger config (pino/winston)
   │  ├─ cors.js                    # cors config
   │  └─ rateLimit.js               # rate limit config
   ├─ routes/
   │  ├─ index.js                   # mounts all route modules
   │  ├─ health.routes.js
   │  ├─ ingest.routes.js           # POST breathing samples (batch)
   │  ├─ sessions.routes.js         # session create/end/list/detail
   │  ├─ analytics.routes.js        # aggregates + anomaly stats
   │  └─ exports.routes.js          # CSV/JSON exports
   ├─ controllers/
   │  ├─ health.controller.js
   │  ├─ ingest.controller.js
   │  ├─ sessions.controller.js
   │  ├─ analytics.controller.js
   │  └─ exports.controller.js
   ├─ middlewares/
   │  ├─ error.middleware.js        # centralized error handler
   │  ├─ notFound.middleware.js
   │  ├─ requestId.middleware.js
   │  ├─ auth.middleware.js         # optional (JWT/API key)
   │  ├─ validate.middleware.js     # request schema validation
   │  └─ rateLimit.middleware.js
   ├─ domain/
   │  ├─ models/
   │  │  ├─ session.model.js         # domain-level shape (not DB schema)
   │  │  ├─ sample.model.js
   │  │  ├─ windowResult.model.js
   │  │  └─ event.model.js
   │  ├─ classifier/
   │  │  ├─ features.js              # feature extraction
   │  │  ├─ irregularityScore.js
   │  │  ├─ thresholds.js
   │  │  ├─ sustainedLogic.js
   │  │  └─ segmentEvents.js         # build anomaly intervals
   │  └─ analytics/
   │     ├─ summaries.js
   │     └─ aggregates.js
   ├─ services/
   │  ├─ ingest/
   │  │  ├─ ingestBatch.service.js
   │  │  └─ classifyBatch.service.js # optional: if backend classifies too
   │  ├─ sessions/
   │  │  ├─ createSession.service.js
   │  │  ├─ endSession.service.js
   │  │  ├─ getSession.service.js
   │  │  └─ listSessions.service.js
   │  ├─ analytics/
   │  │  ├─ getTrends.service.js
   │  │  └─ getSessionStats.service.js
   │  └─ exports/
   │     ├─ exportCsv.service.js
   │     └─ exportJson.service.js
   ├─ db/
   │  ├─ mongo/
   │  │  └─ client.js                # mongoose/mongodb client connection
   │  ├─ schemas/                   # MongoDB/Mongoose schemas
   │  │  ├─ Session.schema.js
   │  │  ├─ Sample.schema.js
   │  │  ├─ WindowResult.schema.js
   │  │  └─ Event.schema.js
   │  └─ repositories/              # DB access layer
   │     ├─ sessions.repo.js
   │     ├─ samples.repo.js
   │     ├─ windows.repo.js
   │     └─ events.repo.js
   ├─ validators/
   │  ├─ ingest.schemas.js          # zod/joi schemas
   │  ├─ sessions.schemas.js
   │  ├─ analytics.schemas.js
   │  └─ exports.schemas.js
   └─ utils/
      ├─ ids.js
      ├─ time.js
      ├─ errors.js
      └─ constants.js
```

## Notes

- Keep route logic thin; place business logic in services.
- Domain models are framework-agnostic and separate from DB schemas.
- Validators define request schemas and are used by `validate.middleware.js`.