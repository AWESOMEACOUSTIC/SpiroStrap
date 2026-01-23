# Frontend Folder Structure

This document outlines the frontend project layout and responsibilities.

## Structure (Tree)

```
frontend/
├─ README.md
├─ package.json
├─ package-lock.json
├─ .env.example
├─ .gitignore
├─ index.html
├─ vite.config.js
└─ src/
   ├─ App.jsx
   ├─ providers/
   │  ├─ RouterProvider.jsx
   │  └─ ThemeProvider.jsx
   ├─ layouts/
   │  ├─ Shell.jsx
   │  ├─ Sidebar.jsx
   │  ├─ Topbar.jsx
   │  └─ PageTransition.jsx
   ├─ pages/
   │  ├─ Live/
   │  │  ├─ Live.jsx
   │  │  └─ components/
   │  │     ├─ LiveControls.jsx
   │  │     ├─ LiveStats.jsx
   │  │     └─ LiveStatusBadge.jsx
   │  ├─ Sessions/
   │  │  ├─ Sessions.jsx
   │  │  └─ components/
   │  │     ├─ SessionsTable.jsx
   │  │     ├─ SessionRow.jsx
   │  │     └─ SessionSummaryCard.jsx
   │  ├─ SessionDetail/
   │  │  ├─ SessionDetail.jsx
   │  │  └─ components/
   │  │     ├─ SessionHeader.jsx
   │  │     ├─ SessionChart.jsx
   │  │     ├─ EventList.jsx
   │  │     └─ ExportButtons.jsx
   │  └─ Settings/
   │     ├─ Settings.jsx
   │     └─ components/
   │        ├─ ThresholdControls.jsx
   │        ├─ DataRetentionControls.jsx
   │        └─ SourceControls.jsx
   ├─ components/
   │  ├─ Button.jsx
   │  ├─ Card.jsx
   │  ├─ Badge.jsx
   │  ├─ Input.jsx
   │  ├─ Select.jsx
   │  ├─ Toggle.jsx
   │  ├─ Tabs.jsx
   │  ├─ Modal.jsx
   │  ├─ Tooltip.jsx
   │  └─ Skeleton.jsx
   ├─ charts/
   │  ├─ BreathWaveformChart.jsx
   │  ├─ LabelMarkersTrack.jsx
   │  └─ Legend.jsx
   ├─ state/
   │  ├─ store.js
   │  └─ selectors.js
   ├─ domain/
   │  ├─ models/
   │  │  ├─ labels.js
   │  │  ├─ sample.js
   │  │  ├─ session.js
   │  │  ├─ windowResult.js
   │  │  └─ event.js
   │  ├─ classifier/
   │  │  ├─ computeIrregularityScore.js
   │  │  ├─ windowing.js
   │  │  ├─ sustainedLogic.js
   │  │  └─ segmentEvents.js
   │  ├─ analytics/
   │     ├─ summaries.js
   │     ├─ downsampling.js
   │     └─ breathRate.js
   ├─ services/
   │  ├─ datasource/
   │  │  ├─ IDataSource.js
   │  │  ├─ DummySimulatorSource.js
   │  │  └─ WebBluetoothSource.js      # stub for later
   │  ├─ storage/
   │  │  ├─ db.js                      # IndexedDB (Dexie) setup
   │  │  ├─ storage.js
   │  │  └─ migrations/
   │  │     └─ v1.js
   │  ├─ api/
   │  │  ├─ client.js                  # fetch wrapper
   │  │  ├─ sessions.api.js
   │  │  ├─ ingest.api.js
   │  │  └─ analytics.api.js
   │  ├─ export/
   │  │  └─ exporters.js
   │  └─ logging/
   │     └─ logger.js
   ├─ lib/
   │  ├─ constants.js
   │  ├─ time.js
   │  ├─ math.js
   │  └─ format.js
   └─ assets/
```

## Notes

- Page-level UI lives in `pages/`, shared UI in `components/`.
- Domain logic stays in `domain/`, and data access in `services/`.
