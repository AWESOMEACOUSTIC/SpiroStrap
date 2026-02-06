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
