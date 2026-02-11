# SpiroStrap Frontend

A real-time breathing pattern monitoring and analysis dashboard for detecting respiratory irregularities.

## Overview

SpiroStrap is a comprehensive breathing monitoring application that captures respiratory waveforms, analyzes patterns in real-time, and classifies breathing quality using a traffic-light system (GREEN/YELLOW/RED). The application is designed for continuous monitoring scenarios where detecting sustained irregularities is critical.

## Features

### Real-Time Monitoring (Live Page)
- **Live Waveform Visualization**: Displays breathing patterns as a continuous waveform chart updated in real-time
- **Irregularity Classification**: Automatically classifies breathing quality into three labels:
  - **GREEN** (Normal): Score below 0.35
  - **YELLOW** (Medium): Score between 0.35 and 0.65
  - **RED** (Anomaly): Sustained high irregularity (≥8 seconds above 0.65, or ≥3 seconds above 0.85)
- **Session Tracking**: Automatic session creation with unique IDs and timestamps
- **Signal Quality Indicator**: Displays confidence level of the readings
- **Label Markers Track**: Visual timeline showing classification history

### Session Management (Sessions Page)
- **Session History**: Browse all recorded breathing sessions
- **Session Summaries**: View total samples, duration, and label distribution per session
- **Persistent Storage**: All data stored locally in IndexedDB for offline access

### Session Detail Analysis
- **Historical Waveform Playback**: Load and visualize any past session's breathing data
- **Timeline Navigation**: Zoom and pan through session timeline (60s, 3m, 10m, 30m ranges)
- **Event List**: Review all detected irregularity events with severity scores
- **Smart Downsampling**: Min/max downsampling algorithm preserves waveform peaks while optimizing performance
- **Data Export**: Export session data as CSV or JSON

### Settings
- **Threshold Configuration**: Customize classification thresholds
- **Data Retention**: Manage storage and retention policies
- **Source Controls**: Configure data input sources

## Technical Architecture

### Technology Stack
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.2 | UI framework |
| Vite | 7.2 | Build tool & dev server |
| Tailwind CSS | 4.1 | Styling |
| Zustand | 5.0 | State management |
| Dexie | 4.2 | IndexedDB wrapper for local storage |
| Recharts | 3.7 | Charting library |
| Motion | 12.29 | Page transitions & animations |
| React Router | 7.12 | Client-side routing |

### Project Structure

```
src/
├── App.jsx                 # Route configuration
├── main.jsx               # Application entry point
├── index.css              # Global styles
│
├── pages/                 # Page-level components
│   ├── Live/              # Real-time monitoring dashboard
│   ├── Session/           # Session history list
│   ├── SessionDetail/     # Individual session analysis
│   └── Settings/          # Configuration options
│
├── layouts/               # Layout components
│   ├── Shell.jsx          # Main app shell with sidebar
│   ├── Sidebar.jsx        # Navigation sidebar
│   ├── Topbar.jsx         # Top navigation bar
│   └── PageTransition.jsx # Animated page transitions
│
├── charts/                # Visualization components
│   ├── BreathWaveformChart.jsx  # SVG waveform renderer
│   ├── LabelMarkersTrack.jsx    # Classification timeline
│   └── Legend.jsx               # Color legend
│
├── domain/                # Business logic (framework-agnostic)
│   ├── classifier/        # Irregularity detection algorithms
│   │   ├── computeIrregularityScore.js  # Feature extraction & scoring
│   │   ├── windowing.js                  # Time-window management
│   │   ├── sustainedLogic.js            # Multi-window anomaly detection
│   │   └── segmentEvents.js             # Event boundary detection
│   ├── analytics/         # Data processing
│   │   ├── summaries.js                 # Session statistics
│   │   ├── downsampling.js              # Min/max downsampling
│   │   └── breathRate.js                # Breath rate calculation
│   └── models/            # Domain models
│       ├── labels.js                    # Label enum & colors
│       ├── sample.js                    # Sample data structure
│       ├── session.js                   # Session data structure
│       └── event.js                     # Irregularity event
│
├── state/                 # Global state
│   ├── store.js           # Zustand store with streaming logic
│   └── selectors.js       # State selectors
│
├── services/              # Data access & external integrations
│   ├── datasource/        # Data input sources
│   │   ├── IDataSource.js            # Interface definition
│   │   ├── DummySimulatorSource.js   # Simulated breathing data
│   │   └── WebBluetoothSource.js     # BLE device integration (stub)
│   ├── storage/           # Local persistence
│   │   ├── db.js                     # Dexie database setup
│   │   └── storage.js                # CRUD operations
│   ├── api/               # Backend communication
│   │   ├── client.js                 # HTTP client wrapper
│   │   ├── sessions.api.js           # Session endpoints
│   │   └── ingest.api.js             # Data ingestion endpoints
│   ├── export/            # Data export utilities
│   │   └── exporters.js              # CSV/JSON export
│   └── logging/           # Application logging
│       └── logger.js
│
├── components/            # Shared UI components
│   └── ErrorBoundary.jsx
│
└── providers/             # React context providers
    └── ThemeProvider.jsx
```

## Classification Algorithm

### Irregularity Score Computation
The irregularity score (0-1) is computed from breathing waveform samples using:

1. **Derivative Variability (75% weight)**: Standard deviation of consecutive sample differences - captures jitter and irregular motion patterns
2. **Amplitude Instability (15% weight)**: Standard deviation of raw sample values - detects amplitude variations
3. **Quality Penalty (10% weight)**: Inverse of signal quality - accounts for sensor reliability

```javascript
score = 0.75 * diffScore + 0.15 * ampScore + 0.10 * qualityPenalty
```

### Sustained Anomaly Detection
The system uses a "sustained logic" approach to avoid false positives:

| Condition | Result |
|-----------|--------|
| Score < 0.35 | GREEN (Normal) |
| Score 0.35-0.65 | YELLOW (Medium) |
| Score > 0.65 for ≥8 seconds | RED (Anomaly) |
| Score > 0.85 for ≥3 seconds | RED (Fast trigger) |

When RED is triggered, previous windows are **backfilled** to mark the start of the anomaly period.

### Window Configuration
- **Window Size**: 10 seconds of samples
- **Step Size**: 1 second (sliding window)
- **Sample Rate**: 25 Hz (default)

## Data Flow

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Data Source    │────▶│   Zustand Store  │────▶│  React Components│
│ (Simulator/BLE) │     │  (Classification) │     │  (Visualization) │
└─────────────────┘     └────────┬─────────┘     └─────────────────┘
                                 │
                                 ▼
                        ┌────────────────┐
                        │   IndexedDB    │
                        │ (Dexie Storage)│
                        └────────────────┘
```

1. **Data Source** generates samples at 25 Hz (simulated or from BLE device)
2. **Store** buffers samples, computes sliding windows, and classifies each window
3. **Storage** periodically flushes data to IndexedDB (every 2 seconds)
4. **Components** render real-time visualizations and allow historical playback

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

### Development Server
The app will be available at `http://localhost:5173` by default.

## Storage Schema (IndexedDB)

### Sessions Table
| Field | Type | Description |
|-------|------|-------------|
| sessionId | string | Primary key (e.g., `sess_20260206_143025`) |
| startedAt | number | Unix timestamp |
| endedAt | number | Unix timestamp (null if ongoing) |
| source | string | Data source type |
| sampleRateHz | number | Sample rate |
| thresholds | object | Classification thresholds used |
| summary | object | Aggregated statistics |

### Samples Table
| Field | Type | Description |
|-------|------|-------------|
| sessionId | string | Foreign key |
| ts | number | Unix timestamp |
| value | number | Normalized sensor value |
| quality | number | Signal quality (0-1) |

### Windows Table
| Field | Type | Description |
|-------|------|-------------|
| sessionId | string | Foreign key |
| tsStart | number | Window start timestamp |
| tsEnd | number | Window end timestamp |
| irregularityScore | number | Computed score (0-1) |
| label | string | GREEN/YELLOW/RED |

### Events Table
| Field | Type | Description |
|-------|------|-------------|
| sessionId | string | Foreign key |
| startTs | number | Event start timestamp |
| endTs | number | Event end timestamp |
| type | string | Event type (e.g., IRREGULARITY_SUSTAINED) |
| severity | number | Maximum severity score |
| redSeconds | number | Duration of anomaly |

## Configuration

### Default Thresholds
```javascript
{
  greenMax: 0.35,        // Below this = GREEN
  yellowMax: 0.65,       // Below this = YELLOW
  highScore: 0.65,       // Candidate for RED
  veryHighScore: 0.85,   // Fast-track to RED
  sustainedSeconds: 8,   // Duration for standard RED trigger
  fastRedSeconds: 3      // Duration for fast RED trigger
}
```

### Simulator Parameters
```javascript
{
  sampleRateHz: 25,      // Samples per second
  baseFreqHz: 0.25,      // ~15 breaths per minute
  noise: 0.02            // Random noise amplitude
}
```

## Browser Support
- Chrome 90+
- Firefox 90+
- Safari 15+
- Edge 90+

Requires IndexedDB support for data persistence.

## Future Enhancements
- [ ] Web Bluetooth integration for real-time BLE device connectivity
- [ ] Backend synchronization for multi-device sessions
- [ ] Advanced analytics and trend visualization
- [ ] Customizable alert notifications
- [ ] PWA support for offline-first experience

## Related
- [Backend README](../backend/README.md) - Backend service documentation
- [Backend Folder Structure](../backend/FolderStructure.md) - Backend architecture details

## License
ISC

---

# Comprehensive Architecture Documentation

## Full Plan Ideology Structure

### Project Vision & Philosophy

SpiroStrap was architected with a clear vision: **build a clinical-grade, real-time breathing monitoring system that prioritizes reliability, performance, and maintainability**. The entire codebase follows these core principles:

1. **Separation of Concerns**: Domain logic is completely isolated from UI concerns. The `domain/` folder contains pure JavaScript functions with zero React dependencies, making the core algorithms testable, portable, and framework-agnostic.

2. **Offline-First Architecture**: The application assumes network unreliability. All critical data is stored locally in IndexedDB using Dexie, ensuring the monitoring system works even without connectivity.

3. **Real-Time Without Compromise**: The classification pipeline was designed to handle 25 Hz sample rates (25 samples/second) without dropping frames or causing UI jank.

4. **Progressive Enhancement**: Start with a functional simulator, then layer real hardware (BLE) support. The architecture allows swapping data sources without touching business logic.

5. **Sustained Detection Over Instantaneous Alerts**: Medical monitoring requires avoiding false positives. The system intentionally delays RED (anomaly) classification until irregularity is sustained for multiple seconds.

### Development Phase Methodology

The project was developed in discrete phases, each building upon the previous:

#### **Phase A: Foundation & Core Setup**
- Established Vite + React 19 + Tailwind CSS 4 project structure
- Configured ESLint for code quality
- Set up React Router for navigation
- Created initial folder architecture following domain-driven design principles

#### **Phase B: Domain Layer & Classification Engine**
- Implemented the irregularity score computation algorithm
- Built the sliding window mechanism for time-series analysis
- Created the sustained logic state machine for multi-window anomaly detection
- Defined the Label enum (GREEN/YELLOW/RED) with associated colors

#### **Phase C: Real-Time Streaming Pipeline**
- Implemented Zustand store with streaming state management
- Built the DummySimulatorSource for development and testing
- Created the sample → window → classification pipeline
- Established memory management with rolling buffers (LIVE_SAMPLES_MAX, etc.)

#### **Phase D: Persistence Layer**
- Integrated Dexie for IndexedDB abstraction
- Designed storage schema with compound indexes for efficient queries
- Implemented periodic flushing (every 2 seconds) to balance performance vs. data safety
- Created session lifecycle management (create, update on stop, summary generation)

#### **Phase E: UI Components & Visualization**
- Built the Shell layout with Sidebar and Topbar
- Implemented SVG-based waveform chart (BreathWaveformChart)
- Created the classification timeline (LabelMarkersTrack)
- Added page transitions with Framer Motion

#### **Phase F: Historical Playback & Export**
- Implemented SessionDetail page with time-range scrubbing
- Built min/max downsampling algorithm to maintain visual fidelity at any zoom
- Created JSON and CSV export functionality
- Added event segmentation from stored windows

#### **Phase G: Hardening & Edge Cases**
- Added safe teardown handlers (beforeunload, visibilitychange)
- Implemented event cooldown logic to prevent event fragmentation
- Added error boundaries for graceful failure recovery
- Established settings store with localStorage persistence

---

## Complete Codebase Documentation

### Entry Points

#### `main.jsx`
```
Purpose: Application bootstrap
Key Responsibilities:
- Mounts React 19 root via createRoot()
- Wraps App in BrowserRouter for client-side routing
- Entry point for Vite HMR (Hot Module Replacement)
```

The entry point is intentionally minimal - no global state initialization, no side effects. React's StrictMode was explicitly removed for Dexie compatibility and to avoid double-invocation of effects during development.

#### `App.jsx`
```
Purpose: Route configuration and provider setup
Key Responsibilities:
- Defines all application routes
- Wraps entire app in ThemeProvider
- Implements redirect logic (/ → /live, * → /live)
- Sets up Shell as the layout wrapper for all routes
```

The route structure follows a flat hierarchy with one nested level:
- `/live` - Live monitoring dashboard
- `/sessions` - Session history list
- `/sessions/:sessionId` - Individual session detail
- `/settings` - Configuration page

---

### Domain Layer (`src/domain/`)

The domain layer is the **heart of SpiroStrap** - pure business logic with zero UI dependencies.

#### `domain/classifier/computeIrregularityScore.js`
```
Purpose: Feature extraction and scoring algorithm
Input: Array of samples within a time window
Output: { score: 0-1, confidence: 0-1, qualityAvg }

Algorithm Breakdown:
1. Extract raw values from samples
2. Compute consecutive differences (derivative)
3. Calculate standard deviation of differences (diffVar)
4. Calculate standard deviation of raw values (ampVar)
5. Normalize scores using sigmoid-like formulas
6. Apply weighted combination:
   - 75% derivative variability
   - 15% amplitude instability  
   - 10% quality penalty
```

**Mathematical Foundation:**

The derivative variability (`diffVar`) captures breathing jitter - when breathing is irregular, the rate of change between consecutive samples varies wildly. Normal breathing produces smooth sinusoidal patterns with consistent derivatives.

The sigmoid-like normalization (`diffVar / (diffVar + 0.03)`) maps raw variance to 0-1 range while providing natural saturation - very high variance still produces scores near 1.0, avoiding runaway values.

#### `domain/classifier/sustainedLogic.js`
```
Purpose: Multi-window state machine for RED classification
Inputs: current score, high streak counter, very-high streak counter, thresholds
Output: { label, nextStreakHigh, nextStreakVeryHigh, backfillCount }

State Machine Logic:
- Tracks consecutive windows with score > highScore (0.65)
- Tracks consecutive windows with score > veryHighScore (0.85)
- Triggers RED when streakHigh >= 8 OR streakVeryHigh >= 3
- Returns backfillCount indicating how many previous windows to retroactively mark RED
```

**Why Sustained Logic?**

Medical monitoring systems must avoid false positives. A brief spike in irregularity could be:
- Patient adjusting position
- Sensor momentary disconnection
- Environmental interference

The sustained logic requires **8 consecutive seconds** of elevated scores before declaring an anomaly, or **3 seconds** of very high scores for faster response to severe events.

**Backfill Mechanism:**

When RED is finally triggered, the system retroactively marks the previous N windows as RED (where N = sustainedSeconds or fastRedSeconds). This provides accurate event timestamps - the anomaly didn't start when it was detected, it started when the pattern began.

#### `domain/classifier/windowing.js`
```
Purpose: Extract samples within a time window
Input: sample buffer, windowMs, nowTs
Output: { startTs, endTs, windowSamples }

Implementation: Simple filter over rolling buffer
Complexity: O(n) where n = buffer size
```

The windowing function is deliberately simple - it filters samples by timestamp range. The calling code (store.js) manages the rolling buffer, so windowSamples is always a small subset.

#### `domain/classifier/segmentEvents.js`
```
Purpose: Group consecutive RED windows into discrete events
Input: Array of window results
Output: Array of events with startTs, endTs, severity, etc.

Algorithm:
1. Sort windows by timestamp
2. Track open event (started but not closed)
3. Accumulate RED windows into open event
4. Close event after cooldownSeconds (5) of non-RED windows
5. Calculate severity metrics (max score, avg score, duration)
```

This function is used for **batch processing** of historical data - when loading a past session, all windows are reprocessed to generate the event list. During live streaming, event tracking happens incrementally in the store.

#### `domain/analytics/downsampling.js`
```
Purpose: Reduce sample count while preserving visual peaks
Input: samples array, maxPoints target
Output: Downsampled array (approximately 2x targetBuckets)

Algorithm: Min/Max Bucketing
1. Divide samples into N buckets (N = maxPoints / 2)
2. For each bucket, find minimum and maximum value samples
3. Output both min and max in chronological order
```

**Why Min/Max Instead of Averaging?**

Averaging destroys peaks - if you average a spike with surrounding normal values, the spike disappears. Min/Max preserves extremes, which is critical for breathing waveforms where peaks and troughs carry diagnostic meaning.

A 30-minute session at 25 Hz = 45,000 samples. Rendering all of these would be:
- Slow (SVG with 45k points)
- Unnecessary (screen resolution limits visible detail)

Downsampling to ~900 points preserves visual fidelity while enabling smooth panning and zooming.

#### `domain/analytics/summaries.js`
```
Purpose: Compute basic statistics for a sample set
Output: { count, min, max, avg }
```

Utility function for displaying session metadata.

#### `domain/analytics/breathRate.js`
```
Purpose: Estimate breaths per minute
Formula: (sampleCount / durationMs) * 60000
Note: This is a placeholder - real breath rate would require peak detection
```

#### `domain/models/labels.js`
```
Purpose: Define Label enum and color mapping
Exports:
- Label: { GREEN, YELLOW, RED }
- labelToColor(label): Returns hex color string
```

Colors were chosen for clinical clarity:
- GREEN (#22c55e): Standard "safe" indicator
- YELLOW (#eab308): Warning amber
- RED (#ef4444): Alert/anomaly

#### `domain/models/sample.js`, `session.js`, `event.js`, `windowResult.js`
```
Purpose: Factory functions for domain objects
Pattern: createX({ ...fields }) => object
Note: These are minimal - actual objects are plain JavaScript objects
```

The factory pattern was intended for future validation logic or immutability enforcement.

---

### State Management (`src/state/`)

#### `state/store.js`
```
Purpose: Central state management and streaming orchestration
Library: Zustand (lightweight, hook-based state management)
Lines: ~460

Major State Slices:
- streaming: boolean - Is data source active?
- sessionId: string - Current session ID
- samples: array - Rolling buffer (max 5000)
- windows: array - Rolling buffer (max 3600)
- events: array - Rolling buffer (max 200)
- currentLabel: Label - Latest classification
- currentScore: number - Latest irregularity score
- labelSeconds: object - Aggregate counts per label
- _streakHigh/VeryHigh: numbers - Sustained logic counters
- _openEvent: object - Currently accumulating event
- _source: DataSource - Active data source instance
- _windowTimer: interval - Classification compute interval
- _flushTimer: interval - Persistence flush interval
```

**Critical Functions:**

`startStreaming()`:
1. Generate unique sessionId (format: `sess_YYYYMMDD_HHMMSS`)
2. Reset all state to initial values
3. Create session record in IndexedDB
4. Instantiate DummySimulatorSource with configuration
5. Attach sample callback (`onSample`)
6. Start data source
7. Start window computation interval (1 second)
8. Start flush interval (2 seconds)
9. Bind teardown handlers for browser events

`stopStreaming()`:
1. Stop data source
2. Clear intervals
3. Unbind teardown handlers
4. Close any open event
5. Flush pending data to IndexedDB
6. Calculate final session summary
7. Update session record with endedAt and summary

`pushSample(sample)`:
1. Add to pending flush buffer
2. Trigger flush if buffer exceeds threshold
3. Add to rolling display buffer (circular array via slice+push)
4. Update display state (lastSample, totalSamples)

`computeNextWindow()`:
1. Get samples within 10-second window
2. Skip if insufficient samples (<8)
3. Compute irregularity score
4. Apply sustained logic to get label
5. Create window record
6. Handle RED backfill if triggered
7. Update/close events based on label
8. Update display state and aggregate counters

**Pending Buffers and Flushing:**

The store maintains three pending arrays (`pendingSamples`, `pendingWindows`, `pendingEvents`) that accumulate data between flushes. Every 2 seconds, `flushPending()` writes all pending data to IndexedDB in a single transaction. This batching dramatically reduces IndexedDB write operations while ensuring data isn't lost.

If a flush fails (IndexedDB error), the data is re-queued for the next attempt. This provides resilience against transient storage issues.

**Teardown Hardening (Phase G):**

Two browser events are monitored:
- `beforeunload`: When user closes/refreshes - stops source, flushes data
- `visibilitychange`: When tab becomes hidden - flushes data

This ensures data isn't lost when users abruptly close the browser.

#### `state/selectors.js`
```
Purpose: Zustand selector functions for React components
Pattern: const selectX = (s) => s.x
Usage: useAppStore(selectX)
```

Selectors enable fine-grained subscriptions - a component only re-renders when its specific state slice changes.

#### `state/settingsStore.js`
```
Purpose: Persistent application configuration
Persistence: localStorage (JSON serialized)
Key: spirostrap_app_config_v1

Configuration Categories:
- sourceMode: "SIMULATOR" | "BLE"
- simulator: { sampleRateHz, baseFreqHz, noise, testMode }
- classification: { windowMs, stepMs, greenMax, highScore, ... }
- events: { endCooldownSeconds }
- visualization: { liveRangeSeconds, historyDefaultRangeSeconds, downsampleMaxPoints }
- export: { defaultFormat, includeSamplesInJson }
- storage: { retentionEnabled, keepLastSessions }
```

**Sanitization:**

All loaded configurations pass through `sanitizeConfig()` which:
1. Validates types (number, string, boolean)
2. Clamps numeric values to valid ranges
3. Replaces invalid values with defaults
4. Handles partial configurations gracefully

This ensures corrupt localStorage data doesn't crash the app.

---

### Services Layer (`src/services/`)

#### `services/datasource/DummySimulatorSource.js`
```
Purpose: Generate synthetic breathing waveform data
Interface: start(), stop(), onSample callback

Generation Algorithm:
1. Base signal: sin(2π * freq * t) at 0.25 Hz (~15 BPM)
2. Random noise: Gaussian-like noise ±0.02
3. Irregular periods: 0.2% chance per sample to enter irregular mode
4. Irregular duration: 2.5 to 16.5 seconds
5. During irregular: frequency varies 0.6x-2.3x, amplitude varies 0.7x-1.4x
6. Quality drops occasionally during irregular periods
```

**Why Include Irregularity in Simulator?**

The simulator must exercise the classification pipeline. Pure sinusoidal data would always produce GREEN labels, making development and testing impossible. The probabilistic irregularity injection creates realistic test scenarios.

#### `services/datasource/IDataSource.js`
```
Purpose: Interface definition (TypeScript JSDoc)
Methods: start(), stop(), onSample callback
Note: JavaScript doesn't enforce interfaces, but this documents the contract
```

#### `services/datasource/WebBluetoothSource.js`
```
Purpose: Placeholder for future BLE device integration
Status: Not implemented (throws errors)
```

#### `services/storage/db.js`
```
Purpose: Dexie database schema definition
Database: spirostrap_db

Schema Evolution:
- v1: sessions, samples, windows
- v2: Added events table

Index Definitions:
- sessions: Primary key sessionId, indexes on startedAt, endedAt, updatedAt
- samples: Compound key [sessionId+ts], indexes on sessionId, ts
- windows: Compound key [sessionId+tsEnd], indexes on sessionId, tsEnd, label
- events: Compound key [sessionId+startTs], indexes on sessionId, startTs, endTs, type
```

**Why Compound Keys?**

Compound keys like `[sessionId+ts]` enable efficient range queries: "get all samples for session X between time A and time B". Without compound indexes, this would require a full table scan.

#### `services/storage/storage.js`
```
Purpose: Data access layer (CRUD operations)
Exports: storage object with async methods

Methods:
- createSession(session): Insert new session
- updateSession(sessionId, patch): Partial update
- listSessions(): Get all, ordered by startedAt DESC
- getSession(sessionId): Get single session
- addSamples(sessionId, samples): Bulk insert
- addWindows(sessionId, windows): Bulk insert
- addEvents(sessionId, events): Bulk insert
- getWindows(sessionId): Get all windows for session
- getEvents(sessionId): Get all events for session
- getSamplesRange(sessionId, fromTs, toTs): Range query
- getAllSamples(sessionId): Get all samples for session
```

#### `services/api/client.js`
```
Purpose: HTTP client wrapper for backend communication
Method: apiClient(path, { method, body, headers })
Features:
- Auto JSON serialization/deserialization
- Error handling (throws on non-2xx)
- Handles 204 No Content
```

#### `services/api/sessions.api.js`, `ingest.api.js`, `analytics.api.js`
```
Purpose: Backend endpoint wrappers
Note: Currently unused - app runs fully client-side
Future: Sync sessions to backend for multi-device access
```

#### `services/export/exporters.js`
```
Purpose: Download session data as files
Methods:
- exportSessionJSON(sessionId): Full session + windows + events + samples
- exportSamplesCSV(sessionId): Just samples in CSV format

Implementation:
1. Query all relevant data from IndexedDB
2. Construct Blob with appropriate MIME type
3. Create temporary <a> element with download attribute
4. Programmatically click to trigger download
5. Revoke blob URL to free memory
```

#### `services/logging/logger.js`
```
Purpose: Consistent console logging with prefix
Methods: info(), warn(), error()
Format: [SpiroStrap] <message>
```

---

### Layouts (`src/layouts/`)

#### `layouts/Shell.jsx`
```
Purpose: Main application layout wrapper
Structure:
- Outer container (min-h-dvh, dark theme)
- Sidebar (left, fixed width, hidden on mobile)
- Content area (flex-1)
  - Topbar (sticky top)
  - Main content (Outlet with AnimatePresence)
```

The Shell uses React Router's `<Outlet>` to render child routes, combined with Framer Motion's `AnimatePresence` for smooth page transitions.

#### `layouts/Sidebar.jsx`
```
Purpose: Navigation sidebar
Components:
- App branding (SpiroStrap + subtitle)
- NavLink items (Live, Sessions, Settings)
- Status indicator (currently hardcoded "Simulator")

NavLink Styling:
- Uses React Router's NavLink with isActive callback
- Active state: darker background, white text
- Inactive state: lighter text, subtle hover
```

#### `layouts/Topbar.jsx`
```
Purpose: Top navigation bar with controls
Components:
- Dynamic page title (derived from pathname)
- Subtitle (currently static)
- Start/Stop buttons

Button Logic:
- Start: disabled when streaming
- Stop: disabled when not streaming
- Buttons connect directly to store actions
```

#### `layouts/PageTransition.jsx`
```
Purpose: Animated wrapper for page content
Animation:
- Initial: opacity 0, y +10px, blur 2px
- Animate: opacity 1, y 0, blur 0
- Exit: opacity 0, y -10px, blur 2px
- Duration: 180ms ease-out
```

---

### Pages (`src/pages/`)

#### `pages/Live/Live.jsx`
```
Purpose: Real-time monitoring dashboard
Sections:
1. Status Grid (4 cards):
   - Stream status (Running/Stopped)
   - Session ID
   - Start time
   - Sample buffer count

2. Metrics Grid (3 cards):
   - Current status badge (GREEN/YELLOW/RED)
   - Irregularity score with progress bar
   - Signal quality percentage

3. Visualization Panel:
   - LabelMarkersTrack (120s timeline)
   - BreathWaveformChart (last 250 samples)
   - Legend
```

The Live page demonstrates the reactive nature of Zustand - all displayed values update automatically as the store state changes.

#### `pages/Session/Sessions.jsx`
```
Purpose: Session history listing
Data Source: liveQuery subscription to IndexedDB
Components:
- Session count header
- Session cards with:
  - Session ID
  - Start/End times
  - Duration (or "Running / Incomplete")
  - Summary stats (samples, GREEN/YELLOW/RED seconds)
  - View button linking to detail page
```

**liveQuery:**

Dexie's `liveQuery` creates a reactive subscription to database changes. When any session is added/updated, the component automatically re-renders with fresh data.

#### `pages/SessionDetail/SessionDetail.jsx`
```
Purpose: Historical session analysis
State:
- session: Metadata (loaded once)
- windows: All window results (loaded once)
- events: All events (loaded once)
- rangeSeconds: Current zoom level (60/180/600/1800)
- endTs: Current pan position (timestamp)
- samples: Downsampled samples for current view (reloaded on pan/zoom)

Features:
- Range selector (dropdown)
- Time scrubber (slider)
- LabelMarkersTrack (filtered to view range)
- BreathWaveformChart (downsampled data)
- EventList component
```

**Debounced Sample Loading:**

When users drag the time scrubber, `endTs` changes rapidly. A 150ms debounce prevents excessive IndexedDB queries. Only after the user pauses does the actual sample loading occur.

#### `pages/SessionDetail/components/EventList.jsx`
```
Purpose: Display anomaly events in a list
Fields:
- Event type (IRREGULARITY_SUSTAINED)
- Time range (start → end)
- Duration
- Severity score
- Max score
- Average score
- Red seconds count
```

#### `pages/SessionDetail/components/ExportButton.jsx`
```
Purpose: Export action buttons
Actions:
- Export JSON: Full session with all data
- Export CSV: Just samples
```

#### `pages/Settings/Settings.jsx`
```
Purpose: Configuration interface
Status: Placeholder - awaiting full implementation
Plan: Expose settings from settingsStore with form controls
```

---

### Charts (`src/charts/`)

#### `charts/BreathWaveformChart.jsx`
```
Purpose: Render breathing waveform as SVG polyline
Input: samples array, height
Implementation:
1. Calculate value range (min/max)
2. Calculate time range (first/last timestamp)
3. Map each sample to SVG coordinates:
   - X = (ts - minTs) / rangeTs * width
   - Y = height - (value - minV) / rangeV * height
4. Join as polyline points string
5. Render in responsive SVG container

SVG Configuration:
- viewBox: "0 0 600 {height}"
- preserveAspectRatio: "none" (stretches to container)
- Stroke: slate-400 at 90% opacity
```

**Why SVG Over Canvas?**

SVG is declarative and integrates naturally with React's rendering model. For the sample counts we're displaying (250-900 points), SVG performs adequately. Canvas would be needed for 10,000+ points, which we avoid through downsampling.

#### `charts/LabelMarkersTrack.jsx`
```
Purpose: Timeline visualization of classification history
Input: windows array, rangeSeconds, endTs, height
Implementation:
1. Calculate visible time range
2. Filter windows within range
3. Map each window to a circle:
   - X position proportional to timestamp
   - Color from labelToColor(window.label)
   - Fixed Y (centered)

SVG Configuration:
- Horizontal baseline (subtle gray line)
- Circles for each window result
- Radius: 5px
```

#### `charts/Legend.jsx`
```
Purpose: Color key for classification labels
Structure: Three items (GREEN/YELLOW/RED) with colored dots and text descriptions
```

---

### Components (`src/components/`)

#### `components/ErrorBoundary.jsx`
```
Purpose: Catch and display React rendering errors
Implementation: Class component (required for componentDidCatch)
Fallback UI:
- Error message
- Stack trace (pre-formatted)
- "Try again" button (resets error state)
- "Reload page" button (full refresh)
```

Error boundaries prevent a single component's crash from taking down the entire app.

---

### Providers (`src/providers/`)

#### `providers/ThemeProvider.jsx`
```
Purpose: Dark/light theme management
Persistence: localStorage (spirostrap_theme)
Implementation:
- React Context for theme state
- Effect to sync with document.documentElement.classList
- Currently defaults to dark, light mode not fully styled
```

---

### Configuration Files

#### `vite.config.js`
```
Plugins:
- @vitejs/plugin-react: JSX transform, Fast Refresh
- @tailwindcss/vite: JIT compilation of Tailwind CSS
```

#### `package.json`
```
Key Dependencies:
- react@19.2: Latest React with concurrent features
- zustand@5.0: Minimal state management
- dexie@4.2: IndexedDB promise wrapper
- motion@12.29: Framer Motion animation library
- react-router-dom@7.12: Client-side routing
- recharts@3.7: (Available but not currently used in favor of custom SVG)
- tailwindcss@4.1: Utility-first CSS

Dev Dependencies:
- vite@7.2: Build tool
- eslint@9: Linting
```

---

## In-Depth System Level Data Flow Diagram

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                    SPIROSTRAP FRONTEND                                  │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│  ┌───────────────────────────────────────────────────────────────────────────────────┐  │
│  │                           DATA ACQUISITION LAYER                                  │  │
│  │  ┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐   │  │
│  │  │  DummySimulator     │    │  WebBluetoothSource │    │  Future Data        │   │  │
│  │  │  Source             │    │  (Stub)             │    │  Sources            │   │  │
│  │  │                     │    │                     │    │                     │   │  │
│  │  │  - 25 Hz output     │    │  - BLE GATT        │    │  - WebSocket        │   │  │
│  │  │  - Sinusoidal wave  │    │  - Notify char.    │    │  - Serial API       │   │  │
│  │  │  - Random irregular │    │  - Real sensor     │    │  - etc.             │   │  │
│  │  │    periods          │    │    data            │    │                     │   │  │
│  │  └──────────┬──────────┘    └──────────┬─────────┘    └──────────┬──────────┘   │  │
│  │             │                          │                         │              │  │
│  │             └──────────────────────────┼─────────────────────────┘              │  │
│  │                                        │                                         │  │
│  │                                        ▼                                         │  │
│  │                          ┌─────────────────────────┐                             │  │
│  │                          │   IDataSource Interface │                             │  │
│  │                          │   onSample(sample) →    │                             │  │
│  │                          └────────────┬────────────┘                             │  │
│  └───────────────────────────────────────┼──────────────────────────────────────────┘  │
│                                          │                                              │
│                                          │ Sample: { ts, value, quality }               │
│                                          ▼                                              │
│  ┌───────────────────────────────────────────────────────────────────────────────────┐  │
│  │                            STATE MANAGEMENT LAYER                                 │  │
│  │                                                                                   │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────────┐ │  │
│  │  │                         ZUSTAND STORE (useAppStore)                         │ │  │
│  │  │                                                                             │ │  │
│  │  │  ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────────────┐   │ │  │
│  │  │  │  pushSample()   │   │ computeNext     │   │  Event Tracking         │   │ │  │
│  │  │  │                 │   │ Window()        │   │                         │   │ │  │
│  │  │  │  1. Add to      │──▶│                 │──▶│  - Open event state     │   │ │  │
│  │  │  │     pending[]   │   │  Every 1 second │   │  - Non-RED streak       │   │ │  │
│  │  │  │  2. Add to      │   │                 │   │  - Auto-close after     │   │ │  │
│  │  │  │     rolling     │   │  1. getWindow   │   │    5s cooldown          │   │ │  │
│  │  │  │     buffer      │   │     Samples()   │   │  - Generate event       │   │ │  │
│  │  │  │  3. Update      │   │  2. compute     │   │    summary on close     │   │ │  │
│  │  │  │     counters    │   │     Score()     │   │                         │   │ │  │
│  │  │  └─────────────────┘   │  3. sustained   │   └─────────────────────────┘   │ │  │
│  │  │                        │     Logic()     │                                  │ │  │
│  │  │                        │  4. Backfill    │                                  │ │  │
│  │  │                        │     RED windows │                                  │ │  │
│  │  │                        │  5. Update      │                                  │ │  │
│  │  │                        │     state       │                                  │ │  │
│  │  │                        └─────────────────┘                                  │ │  │
│  │  │                                                                             │ │  │
│  │  │  State Shape:                                                               │ │  │
│  │  │  ┌─────────────────────────────────────────────────────────────────────┐   │ │  │
│  │  │  │ {                                                                   │   │ │  │
│  │  │  │   streaming: boolean,                                               │   │ │  │
│  │  │  │   sessionId: string,                                                │   │ │  │
│  │  │  │   samples: Array<Sample> (rolling, max 5000),                       │   │ │  │
│  │  │  │   windows: Array<WindowResult> (rolling, max 3600),                 │   │ │  │
│  │  │  │   events: Array<Event> (rolling, max 200),                          │   │ │  │
│  │  │  │   currentLabel: "GREEN" | "YELLOW" | "RED",                         │   │ │  │
│  │  │  │   currentScore: number (0-1),                                       │   │ │  │
│  │  │  │   labelSeconds: { GREEN: n, YELLOW: n, RED: n },                    │   │ │  │
│  │  │  │   _streakHigh: number,        // internal                           │   │ │  │
│  │  │  │   _streakVeryHigh: number,    // internal                           │   │ │  │
│  │  │  │   _openEvent: Event | null    // internal                           │   │ │  │
│  │  │  │ }                                                                   │   │ │  │
│  │  │  └─────────────────────────────────────────────────────────────────────┘   │ │  │
│  │  └─────────────────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                                   │  │
│  │           │                              │                              │         │  │
│  │           │ Selectors                    │ Flush Timer                  │         │  │
│  │           │ (reactive)                   │ (every 2s)                   │         │  │
│  │           ▼                              ▼                              ▼         │  │
│  │  ┌─────────────────┐          ┌─────────────────────┐         ┌──────────────┐   │  │
│  │  │ React Components│          │   Pending Buffers   │         │ Settings     │   │  │
│  │  │ (subscribe via  │          │   pendingSamples[]  │         │ Store        │   │  │
│  │  │  useAppStore)   │          │   pendingWindows[]  │         │ (localStorage│   │  │
│  │  └─────────────────┘          │   pendingEvents[]   │         │  persisted)  │   │  │
│  │                               └──────────┬──────────┘         └──────────────┘   │  │
│  └──────────────────────────────────────────┼───────────────────────────────────────┘  │
│                                             │                                          │
│                                             │ flushPending()                           │
│                                             ▼                                          │
│  ┌───────────────────────────────────────────────────────────────────────────────────┐  │
│  │                            PERSISTENCE LAYER                                      │  │
│  │                                                                                   │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────────┐ │  │
│  │  │                       DEXIE (IndexedDB Wrapper)                             │ │  │
│  │  │                                                                             │ │  │
│  │  │  Database: spirostrap_db                                                    │ │  │
│  │  │                                                                             │ │  │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │ │  │
│  │  │  │  sessions   │  │  samples    │  │  windows    │  │   events    │        │ │  │
│  │  │  │             │  │             │  │             │  │             │        │ │  │
│  │  │  │ PK:         │  │ PK:         │  │ PK:         │  │ PK:         │        │ │  │
│  │  │  │ sessionId   │  │ [sessionId  │  │ [sessionId  │  │ [sessionId  │        │ │  │
│  │  │  │             │  │  +ts]       │  │  +tsEnd]    │  │  +startTs]  │        │ │  │
│  │  │  │ Indexes:    │  │             │  │             │  │             │        │ │  │
│  │  │  │ startedAt   │  │ Indexes:    │  │ Indexes:    │  │ Indexes:    │        │ │  │
│  │  │  │ endedAt     │  │ sessionId   │  │ sessionId   │  │ sessionId   │        │ │  │
│  │  │  │ updatedAt   │  │ ts          │  │ tsEnd       │  │ startTs     │        │ │  │
│  │  │  │             │  │             │  │ label       │  │ endTs       │        │ │  │
│  │  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │ │  │
│  │  │                                                                             │ │  │
│  │  │  Operations: bulkPut (batch insert), where().between (range query)          │ │  │
│  │  └─────────────────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                                   │  │
│  │           │                              │                                        │  │
│  │           │ liveQuery                    │ Direct Query                           │  │
│  │           │ (Sessions page)              │ (SessionDetail)                        │  │
│  │           ▼                              ▼                                        │  │
│  │  ┌───────────────────────────────────────────────────────────────────────────┐   │  │
│  │  │                        Storage Service (storage.js)                       │   │  │
│  │  │                                                                           │   │  │
│  │  │  - createSession()  - addSamples()   - getSamplesRange()                  │   │  │
│  │  │  - updateSession()  - addWindows()   - getAllSamples()                    │   │  │
│  │  │  - listSessions()   - addEvents()    - getWindows()                       │   │  │
│  │  │  - getSession()                      - getEvents()                        │   │  │
│  │  └───────────────────────────────────────────────────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
│  ┌───────────────────────────────────────────────────────────────────────────────────┐  │
│  │                              UI LAYER (React)                                     │  │
│  │                                                                                   │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────────┐ │  │
│  │  │                             App.jsx (Routes)                                │ │  │
│  │  │                                                                             │ │  │
│  │  │  ThemeProvider                                                              │ │  │
│  │  │    └── Routes                                                               │ │  │
│  │  │          └── Shell (Layout)                                                 │ │  │
│  │  │                ├── Sidebar (Navigation)                                     │ │  │
│  │  │                ├── Topbar (Start/Stop buttons)                              │ │  │
│  │  │                └── Main (Outlet + AnimatePresence)                          │ │  │
│  │  │                      └── PageTransition                                     │ │  │
│  │  │                            └── ErrorBoundary                                │ │  │
│  │  │                                  └── Page Component                         │ │  │
│  │  └─────────────────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                                   │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────────┐ │  │
│  │  │                              Page Components                                │ │  │
│  │  │                                                                             │ │  │
│  │  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │ │  │
│  │  │  │    Live      │  │   Sessions   │  │ SessionDetail│  │   Settings   │    │ │  │
│  │  │  │              │  │              │  │              │  │              │    │ │  │
│  │  │  │ Data:        │  │ Data:        │  │ Data:        │  │ Data:        │    │ │  │
│  │  │  │ - useAppStore│  │ - liveQuery  │  │ - storage.*  │  │ - settings   │    │ │  │
│  │  │  │   selectors  │  │   (reactive) │  │   (async)    │  │   Store      │    │ │  │
│  │  │  │              │  │              │  │              │  │              │    │ │  │
│  │  │  │ Charts:      │  │ Lists:       │  │ Charts:      │  │ Forms:       │    │ │  │
│  │  │  │ - Waveform   │  │ - Session    │  │ - Waveform   │  │ - Thresholds │    │ │  │
│  │  │  │ - Labels     │  │   cards      │  │ - Labels     │  │ - Simulator  │    │ │  │
│  │  │  │ - Stats      │  │              │  │ - EventList  │  │ - Storage    │    │ │  │
│  │  │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │ │  │
│  │  └─────────────────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                                   │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────────┐ │  │
│  │  │                           Chart Components                                  │ │  │
│  │  │                                                                             │ │  │
│  │  │  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐ │ │  │
│  │  │  │ BreathWaveformChart │  │  LabelMarkersTrack  │  │       Legend        │ │ │  │
│  │  │  │                     │  │                     │  │                     │ │ │  │
│  │  │  │ Input: samples[]    │  │ Input: windows[],   │  │ Input: none         │ │ │  │
│  │  │  │                     │  │        rangeSeconds,│  │                     │ │ │  │
│  │  │  │ Output: SVG         │  │        endTs        │  │ Output: Color key   │ │ │  │
│  │  │  │   <polyline>        │  │                     │  │   for labels        │ │ │  │
│  │  │  │                     │  │ Output: SVG         │  │                     │ │ │  │
│  │  │  │ Features:           │  │   <circle> per      │  │                     │ │ │  │
│  │  │  │ - Auto-scaling      │  │   window            │  │                     │ │ │  │
│  │  │  │ - Responsive        │  │                     │  │                     │ │ │  │
│  │  │  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘ │ │  │
│  │  └─────────────────────────────────────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
│  ┌───────────────────────────────────────────────────────────────────────────────────┐  │
│  │                              DOMAIN LAYER (Pure JS)                               │  │
│  │                                                                                   │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────────┐ │  │
│  │  │                            Classifier Module                                │ │  │
│  │  │                                                                             │ │  │
│  │  │  computeIrregularityScore(samples) → { score, confidence }                  │ │  │
│  │  │       │                                                                     │ │  │
│  │  │       ├── Extract values and compute diffs                                  │ │  │
│  │  │       ├── Calculate std(diffs) → diffVar                                    │ │  │
│  │  │       ├── Calculate std(values) → ampVar                                    │ │  │
│  │  │       ├── Normalize: diffScore = diffVar / (diffVar + 0.03)                 │ │  │
│  │  │       ├── Normalize: ampScore = ampVar / (ampVar + 0.2)                     │ │  │
│  │  │       └── Combine: score = 0.75*diff + 0.15*amp + 0.10*qualityPenalty       │ │  │
│  │  │                                                                             │ │  │
│  │  │  nextLabelWithSustainedLogic(score, streakH, streakVH, cfg) → result        │ │  │
│  │  │       │                                                                     │ │  │
│  │  │       ├── Update streaks based on score thresholds                          │ │  │
│  │  │       ├── Check if streakVeryHigh >= 3 → RED + backfill 3                   │ │  │
│  │  │       ├── Check if streakHigh >= 8 → RED + backfill 8                       │ │  │
│  │  │       └── Otherwise → GREEN (<0.35) or YELLOW (0.35-0.65)                   │ │  │
│  │  │                                                                             │ │  │
│  │  │  getWindowSamples(buffer, windowMs, nowTs) → { samples, startTs, endTs }    │ │  │
│  │  │                                                                             │ │  │
│  │  │  segmentEventsFromWindows(windows) → events[]                               │ │  │
│  │  └─────────────────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                                   │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────────┐ │  │
│  │  │                            Analytics Module                                 │ │  │
│  │  │                                                                             │ │  │
│  │  │  downsampleMinMax(samples, maxPoints) → downsampled[]                       │ │  │
│  │  │       │                                                                     │ │  │
│  │  │       ├── Divide into buckets                                               │ │  │
│  │  │       ├── Find min/max in each bucket                                       │ │  │
│  │  │       └── Output both preserving chronological order                        │ │  │
│  │  │                                                                             │ │  │
│  │  │  summarizeSession(samples) → { count, min, max, avg }                       │ │  │
│  │  │                                                                             │ │  │
│  │  │  estimateBreathRate(samples, durationMs) → BPM                              │ │  │
│  │  └─────────────────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                                   │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────────┐ │  │
│  │  │                             Models Module                                   │ │  │
│  │  │                                                                             │ │  │
│  │  │  Label = { GREEN, YELLOW, RED }                                             │ │  │
│  │  │  labelToColor(label) → hex string                                           │ │  │
│  │  │                                                                             │ │  │
│  │  │  Sample: { ts: number, value: number, quality: number }                     │ │  │
│  │  │  WindowResult: { tsStart, tsEnd, score, label, confidence }                 │ │  │
│  │  │  Event: { startTs, endTs, type, severity, maxScore, avgScore, redSeconds }  │ │  │
│  │  │  Session: { sessionId, startedAt, endedAt, source, summary, ... }           │ │  │
│  │  └─────────────────────────────────────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### Detailed Data Flow Sequence

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                        LIVE STREAMING DATA FLOW SEQUENCE                               │
└─────────────────────────────────────────────────────────────────────────────────────────┘

User clicks "Start"
       │
       ▼
┌──────────────────┐
│ startStreaming() │
│                  │
│  1. Generate     │
│     sessionId    │───────────────────────────────────────────────────────────┐
│                  │                                                           │
│  2. Reset state  │                                                           │
│                  │                                                           │
│  3. Create       │──────▶ storage.createSession() ───▶ IndexedDB.sessions   │
│     session      │                                                           │
│                  │                                                           │
│  4. Start source │                                                           │
│                  │                                                           │
│  5. Start timers │                                                           │
└────────┬─────────┘                                                           │
         │                                                                     │
         ▼                                                                     │
┌──────────────────────────────────────────────────────────────────────────────┘
│
│    Data Source Loop (every 40ms at 25Hz)
│    ┌────────────────────────────────────────────────────────────────────────┐
│    │                                                                        │
│    │    DummySimulatorSource                                                │
│    │         │                                                              │
│    │         ▼                                                              │
│    │    Generate sample:                                                    │
│    │    {                                                                   │
│    │      ts: Date.now(),                                                   │
│    │      value: sin(2π * freq * t) + noise,                                │
│    │      quality: 0.92 - 0.98 (or lower during irregular)                  │
│    │    }                                                                   │
│    │         │                                                              │
│    │         ▼                                                              │
│    │    onSample(sample) callback                                           │
│    │         │                                                              │
│    │         ▼                                                              │
│    │    store.pushSample(sample)                                            │
│    │         │                                                              │
│    │         ├──────▶ pendingSamples.push(sample)                           │
│    │         │                                                              │
│    │         ├──────▶ samples.push(sample)  // rolling buffer               │
│    │         │        if (samples.length > 5000) samples.shift()            │
│    │         │                                                              │
│    │         └──────▶ set({ lastSample: sample, totalSamples++ })           │
│    │                         │                                              │
│    │                         ▼                                              │
│    │                  React re-renders subscribed components                │
│    │                  (Live page stats update)                              │
│    │                                                                        │
│    └────────────────────────────────────────────────────────────────────────┘
│
│    Window Computation Loop (every 1000ms)
│    ┌────────────────────────────────────────────────────────────────────────┐
│    │                                                                        │
│    │    computeNextWindow()                                                 │
│    │         │                                                              │
│    │         ▼                                                              │
│    │    getWindowSamples(samples, 10000ms, now)                             │
│    │    → Filter samples where ts in [now-10s, now]                         │
│    │    → Returns ~250 samples at 25Hz                                      │
│    │         │                                                              │
│    │         ▼                                                              │
│    │    computeIrregularityScore(windowSamples)                             │
│    │         │                                                              │
│    │         ├── values = samples.map(s => s.value)                         │
│    │         ├── diffs = consecutive differences                            │
│    │         ├── diffVar = std(diffs)                                       │
│    │         ├── ampVar = std(values)                                       │
│    │         ├── diffScore = diffVar / (diffVar + 0.03)                     │
│    │         ├── ampScore = ampVar / (ampVar + 0.2)                         │
│    │         ├── qualityPenalty = 1 - avgQuality                            │
│    │         └── score = 0.75*diffScore + 0.15*ampScore + 0.10*penalty      │
│    │                                                                        │
│    │         │ score: 0.42 (example)                                        │
│    │         ▼                                                              │
│    │    nextLabelWithSustainedLogic(score, streakH, streakVH, thresholds)   │
│    │         │                                                              │
│    │         ├── Is score > 0.65? → streakHigh++                            │
│    │         ├── Is score > 0.85? → streakVeryHigh++                        │
│    │         │                                                              │
│    │         ├── If streakVeryHigh >= 3:                                    │
│    │         │      label = RED, backfill = 3                               │
│    │         ├── Else if streakHigh >= 8:                                   │
│    │         │      label = RED, backfill = 8                               │
│    │         ├── Else if score >= 0.35:                                     │
│    │         │      label = YELLOW                                          │
│    │         └── Else:                                                      │
│    │                label = GREEN                                           │
│    │                                                                        │
│    │         │ label: YELLOW (example)                                      │
│    │         ▼                                                              │
│    │    Create window record:                                               │
│    │    {                                                                   │
│    │      tsStart: now - 10000,                                             │
│    │      tsEnd: now,                                                       │
│    │      irregularityScore: 0.42,                                          │
│    │      confidence: 0.96,                                                 │
│    │      label: "YELLOW"                                                   │
│    │    }                                                                   │
│    │         │                                                              │
│    │         ├──────▶ pendingWindows.push(window)                           │
│    │         │                                                              │
│    │         ├──────▶ windows.push(window)  // rolling buffer               │
│    │         │                                                              │
│    │         ├──────▶ If label == RED && backfill > 1:                      │
│    │         │          for i in 0..backfill:                               │
│    │         │            windows[length-1-i].label = RED                   │
│    │         │                                                              │
│    │         ├──────▶ Event tracking:                                       │
│    │         │          If RED: open or extend event                        │
│    │         │          If not RED: increment nonRedStreak                  │
│    │         │          If nonRedStreak >= 5: close event                   │
│    │         │                                                              │
│    │         └──────▶ set({                                                 │
│    │                    currentLabel: YELLOW,                               │
│    │                    currentScore: 0.42,                                 │
│    │                    labelSeconds: { ...prev, YELLOW: prev.YELLOW + 1 }, │
│    │                    _streakHigh: newStreakHigh,                         │
│    │                    _streakVeryHigh: newStreakVeryHigh                  │
│    │                  })                                                    │
│    │                         │                                              │
│    │                         ▼                                              │
│    │                  React re-renders:                                     │
│    │                  - StatusBadge updates to YELLOW                       │
│    │                  - Score bar updates to 42%                            │
│    │                  - LabelMarkersTrack adds new dot                      │
│    │                                                                        │
│    └────────────────────────────────────────────────────────────────────────┘
│
│    Flush Loop (every 2000ms)
│    ┌────────────────────────────────────────────────────────────────────────┐
│    │                                                                        │
│    │    flushPending(sessionId)                                             │
│    │         │                                                              │
│    │         ├── Check: pendingSamples.length > 0?                          │
│    │         │                                                              │
│    │         ▼                                                              │
│    │    Copy pending arrays, clear originals                                │
│    │    (Allows new data to accumulate during async write)                  │
│    │         │                                                              │
│    │         ▼                                                              │
│    │    Promise.all([                                                       │
│    │      storage.addSamples(sessionId, samplesToWrite),   ──▶ IndexedDB   │
│    │      storage.addWindows(sessionId, windowsToWrite),   ──▶ IndexedDB   │
│    │      storage.addEvents(sessionId, eventsToWrite)      ──▶ IndexedDB   │
│    │    ])                                                                  │
│    │         │                                                              │
│    │         ├── On success: Data persisted                                 │
│    │         │                                                              │
│    │         └── On failure: Re-queue data for next flush                   │
│    │                                                                        │
│    │    storage.updateSession(sessionId, { updatedAt: now })                │
│    │                                                                        │
│    └────────────────────────────────────────────────────────────────────────┘
│
│
User clicks "Stop"
       │
       ▼
┌──────────────────┐
│ stopStreaming()  │
│                  │
│  1. Stop source  │
│                  │
│  2. Clear timers │
│                  │
│  3. Close open   │──────▶ If _openEvent exists, finalize and add to pending
│     event        │
│                  │
│  4. Final flush  │──────▶ flushPending() ──▶ IndexedDB
│                  │
│  5. Generate     │
│     summary:     │
│     {            │
│       totalSamples,
│       greenSeconds,
│       yellowSeconds,
│       redSeconds,
│       eventCount
│     }            │
│                  │
│  6. Update       │──────▶ storage.updateSession(sessionId, {
│     session      │          endedAt: now,
│                  │          summary: {...}
│                  │        })
└──────────────────┘
```

### Historical Playback Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                        SESSION DETAIL PAGE DATA FLOW                                   │
└─────────────────────────────────────────────────────────────────────────────────────────┘

User navigates to /sessions/:sessionId
       │
       ▼
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                          │
│  SessionDetail component mounts                                                          │
│       │                                                                                  │
│       ▼                                                                                  │
│  useEffect #1: Load metadata (runs once)                                                 │
│       │                                                                                  │
│       ├──────▶ storage.getSession(sessionId) ──────▶ IndexedDB.sessions                 │
│       │        → Returns session metadata                                                │
│       │                                                                                  │
│       ├──────▶ storage.getWindows(sessionId) ──────▶ IndexedDB.windows                  │
│       │        → Returns ALL window results for session                                  │
│       │                                                                                  │
│       ├──────▶ storage.getEvents(sessionId) ───────▶ IndexedDB.events                   │
│       │        → Returns ALL events for session                                          │
│       │                                                                                  │
│       └──────▶ setEndTs(session.endedAt ?? Date.now())                                  │
│                Set initial view position to session end                                  │
│                                                                                          │
│                                                                                          │
│  useEffect #2: Load samples for view (runs on endTs/rangeSeconds change)                │
│       │                                                                                  │
│       ├──────▶ Calculate: fromTs = endTs - rangeSeconds * 1000                          │
│       │                                                                                  │
│       ├──────▶ Debounce 150ms (prevents excessive queries while scrubbing)              │
│       │                                                                                  │
│       ├──────▶ storage.getSamplesRange(sessionId, fromTs, endTs)                        │
│       │        │                                                                         │
│       │        ▼                                                                         │
│       │   IndexedDB.samples.where("[sessionId+ts]")                                      │
│       │                    .between([sid, fromTs], [sid, endTs])                         │
│       │        │                                                                         │
│       │        ▼                                                                         │
│       │   Returns samples in time range (could be thousands)                             │
│       │                                                                                  │
│       ├──────▶ downsampleMinMax(rawSamples, 900)                                        │
│       │        │                                                                         │
│       │        ▼                                                                         │
│       │   For 30-minute range at 25Hz (45,000 samples):                                  │
│       │     targetBuckets = 900 / 2 = 450                                                │
│       │     bucketSize = 45000 / 450 = 100 samples per bucket                            │
│       │     For each bucket: find min and max sample                                     │
│       │     Output: ~900 samples (2 per bucket)                                          │
│       │                                                                                  │
│       └──────▶ setSamples(downsampled)                                                  │
│                       │                                                                  │
│                       ▼                                                                  │
│                React re-renders:                                                         │
│                - BreathWaveformChart receives new samples                                │
│                - Chart recomputes SVG polyline                                           │
│                                                                                          │
│                                                                                          │
│  User changes range dropdown (60s → 180s)                                               │
│       │                                                                                  │
│       └──────▶ setRangeSeconds(180) ──▶ Triggers useEffect #2                           │
│                                                                                          │
│                                                                                          │
│  User drags time scrubber                                                               │
│       │                                                                                  │
│       └──────▶ setEndTs(newValue) ──▶ Triggers useEffect #2 (debounced)                 │
│                                                                                          │
│                                                                                          │
│  User clicks "Export JSON"                                                              │
│       │                                                                                  │
│       └──────▶ exporters.exportSessionJSON(sessionId)                                   │
│                       │                                                                  │
│                       ├──▶ storage.getSession(sessionId)                                │
│                       ├──▶ storage.getWindows(sessionId)                                │
│                       ├──▶ storage.getEvents(sessionId)                                 │
│                       ├──▶ storage.getAllSamples(sessionId)                             │
│                       │                                                                  │
│                       ▼                                                                  │
│                  Construct JSON:                                                         │
│                  {                                                                       │
│                    exportedAt: timestamp,                                                │
│                    session: {...},                                                       │
│                    windows: [...],                                                       │
│                    events: [...],                                                        │
│                    samples: [...]  // Could be 100K+ entries                             │
│                  }                                                                       │
│                       │                                                                  │
│                       ▼                                                                  │
│                  Create Blob, trigger download                                           │
│                                                                                          │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

### Memory Management Strategy

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                           MEMORY MANAGEMENT OVERVIEW                                   │
└─────────────────────────────────────────────────────────────────────────────────────────┘

PROBLEM: Unbounded data growth during long sessions

  25 Hz × 60 seconds × 60 minutes = 90,000 samples per hour
  
  Without limits:
  - 8-hour session = 720,000 samples in memory
  - Each sample ~100 bytes = 72 MB just for samples
  - Plus windows, events, pending buffers...


SOLUTION: Rolling Buffers with Periodic Persistence

  ┌────────────────────────────────────────────────────────────────────────────┐
  │                                                                            │
  │  In-Memory (Zustand Store)                 On-Disk (IndexedDB)            │
  │                                                                            │
  │  ┌──────────────────────┐                 ┌──────────────────────┐        │
  │  │ samples (max 5000)   │────flush────────│ samples (unlimited)  │        │
  │  │ ~3.3 minutes of data │   every 2s      │ All session data     │        │
  │  │                      │                 │                      │        │
  │  │ Newest ←───────────→│                 │                      │        │
  │  │                      │                 │                      │        │
  │  │ When full: shift()   │                 │ Indexed for fast     │        │
  │  │  to remove oldest    │                 │ range queries        │        │
  │  └──────────────────────┘                 └──────────────────────┘        │
  │                                                                            │
  │  ┌──────────────────────┐                 ┌──────────────────────┐        │
  │  │ windows (max 3600)   │────flush────────│ windows (unlimited)  │        │
  │  │ ~1 hour of results   │   every 2s      │                      │        │
  │  └──────────────────────┘                 └──────────────────────┘        │
  │                                                                            │
  │  ┌──────────────────────┐                 ┌──────────────────────┐        │
  │  │ events (max 200)     │────flush────────│ events (unlimited)   │        │
  │  │ Last 200 anomalies   │   every 2s      │                      │        │
  │  └──────────────────────┘                 └──────────────────────┘        │
  │                                                                            │
  └────────────────────────────────────────────────────────────────────────────┘


RESULT: Constant memory usage regardless of session duration

  Memory stays at ~2-5 MB for display buffers
  IndexedDB grows linearly but doesn't affect app performance
  Historical playback loads data on-demand with downsampling
```

### Component Re-render Optimization

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                          REACT RENDER OPTIMIZATION                                     │
└─────────────────────────────────────────────────────────────────────────────────────────┘

PROBLEM: 25 samples/second = 25 potential re-renders/second

  Naive approach: useAppStore() returns entire state
  → Every sample triggers re-render of ALL subscribed components
  → Performance death


SOLUTION: Zustand Selectors for Fine-Grained Subscriptions

  ┌──────────────────────────────────────────────────────────────────────────────┐
  │                                                                              │
  │  Instead of:                                                                 │
  │  ─────────────                                                               │
  │  const state = useAppStore();  // Re-renders on ANY state change             │
  │  return <div>{state.currentScore}</div>                                      │
  │                                                                              │
  │                                                                              │
  │  Use:                                                                        │
  │  ────                                                                        │
  │  const score = useAppStore(selectCurrentScore);  // Only score changes       │
  │  return <div>{score}</div>                                                   │
  │                                                                              │
  │                                                                              │
  │  Render Frequency by Component:                                              │
  │  ┌────────────────────────┬──────────────────────────────────────────────┐  │
  │  │ Component              │ Re-renders when...                           │  │
  │  ├────────────────────────┼──────────────────────────────────────────────┤  │
  │  │ Sample count display   │ totalSamples changes (25/sec)                │  │
  │  │ Score display          │ currentScore changes (1/sec)                 │  │
  │  │ Label badge            │ currentLabel changes (rare)                  │  │
  │  │ LabelMarkersTrack      │ windows array changes (1/sec)                │  │
  │  │ BreathWaveformChart    │ samples array changes (25/sec, batched)      │  │
  │  │ Start/Stop buttons     │ streaming changes (user action)              │  │
  │  └────────────────────────┴──────────────────────────────────────────────┘  │
  │                                                                              │
  └──────────────────────────────────────────────────────────────────────────────┘


ADDITIONAL OPTIMIZATIONS:

  1. useMemo for computed values:
     const qualityText = useMemo(() => ..., [lastSample]);
     
  2. SVG chart points computed in useMemo:
     const { points } = useMemo(() => ..., [samples, height]);
     
  3. Array slicing instead of mutation:
     samples.slice(-250) creates new array only when needed
```

---

## Summary

SpiroStrap Frontend represents a carefully architected solution for real-time medical monitoring with these key achievements:

1. **Framework-Agnostic Domain Logic**: All classification algorithms live in pure JavaScript, making them portable and testable.

2. **Reactive State Management**: Zustand provides efficient, fine-grained subscriptions that scale to 25 Hz data rates.

3. **Robust Persistence**: IndexedDB + Dexie ensures data safety with offline-first capabilities.

4. **Memory-Efficient Design**: Rolling buffers keep memory constant while historical data persists to disk.

5. **Medical-Grade Classification**: Sustained logic prevents false positives while maintaining responsiveness to genuine anomalies.

6. **Progressive Architecture**: Clean separation allows future enhancements (BLE, backend sync) without restructuring.

The codebase embodies modern React patterns while respecting the unique constraints of real-time sensor data processing.
