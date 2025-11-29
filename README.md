# LLM Sliding Puzzle Benchmark

A real-time benchmarking platform that tests how different Large Language Models (LLMs) solve sliding tile puzzles (n-puzzle problems). The system orchestrates puzzle games, calls LLM APIs, tracks move-by-move performance, and displays live results through an interactive dashboard with WebSocket updates.

## Features

- **Real-time Dashboard** - Live visualization of active puzzle games with WebSocket updates
- **Multiple LLM Support** - Test various models including GPT-4, GPT-4o, Claude 3.5 Sonnet, and more
- **Batch Benchmarking** - Run multiple configurations simultaneously for statistical comparison
- **Game Replay** - Step-by-step playback of completed games with adjustable speed
- **Analytics Panel** - Charts showing performance by model, board size, and success rates
- **Filtering & Search** - Filter games by status, model, or search by run ID
- **Dark/Light Theme** - Toggle between themes for comfortable viewing

## Prerequisites

- Node.js 18+
- pnpm package manager
- AI Gateway API key (for LLM access)

## Environment Variables

Create a `.env` file in the project root:

```bash
# Required: API key for Vercel AI Gateway
AI_GATEWAY_API_KEY=your_api_key_here

# Optional: Custom AI Gateway URL (defaults to Vercel AI Gateway)
AI_GATEWAY_BASE_URL=https://ai-gateway.vercel.sh/v1

# Optional: Default model to use (defaults to openai/gpt-4.1-mini)
DEFAULT_MODEL_ID=openai/gpt-4.1-mini

# Optional: Server port (defaults to 5000)
PORT=5000
```

## Installation

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Run type checking
pnpm check

# Build for production
pnpm build

# Start production server
pnpm start
```

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── ui/         # Shadcn UI components
│   │   │   └── ...         # App-specific components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility functions
│   │   └── pages/          # Page components
│   └── index.html
├── server/                 # Backend Express server
│   ├── index.ts            # Server entry point
│   ├── routes.ts           # API routes & WebSocket setup
│   ├── game-engine.ts      # Puzzle game logic
│   ├── llm-client.ts       # LLM API integration
│   ├── orchestrator.ts     # Benchmark run management
│   └── storage.ts          # In-memory data storage
├── shared/                 # Shared types & schemas
│   └── schema.ts           # TypeScript types & Zod schemas
└── package.json
```

## API Endpoints

### REST API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/runs` | Get all benchmark runs |
| GET | `/api/runs/:runId` | Get specific run details |
| POST | `/api/runs` | Create new benchmark run |
| POST | `/api/runs/:runId/step` | Execute single move step |
| GET | `/api/stats` | Get aggregate statistics |

### WebSocket

Connect to `/ws` for real-time updates. Message types:

- `run_created` - New benchmark run started
- `run_updated` - Run progress updated
- `run_completed` - Run finished
- `stats_updated` - Statistics refreshed

## Creating a Benchmark Run

Send a POST request to `/api/runs`:

```json
{
  "modelId": "openai/gpt-4o-mini",
  "size": 3,
  "maxMoves": 100,
  "scrambleDepth": 20
}
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| modelId | string | `DEFAULT_MODEL_ID` env | LLM model identifier |
| size | number | 4 | Board size (2-6) |
| maxMoves | number | 200 | Maximum moves before failure (10-500) |
| scrambleDepth | number | 50 | Random moves for scrambling (1-200) |

## Supported Models

The dashboard includes presets for:

- `openai/gpt-4.1-mini` - GPT-4.1 Mini
- `openai/gpt-4.1` - GPT-4.1
- `openai/gpt-4o-mini` - GPT-4o Mini
- `openai/gpt-4o` - GPT-4o
- `anthropic/claude-3.5-sonnet` - Claude 3.5 Sonnet
- `anthropic/claude-3-haiku` - Claude 3 Haiku

Additional models can be used via the AI Gateway by specifying the full model ID.

## Technology Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **Tailwind CSS** - Styling
- **Shadcn UI / Radix** - Component library
- **TanStack Query** - Server state management
- **Recharts** - Data visualization
- **Framer Motion** - Animations
- **Wouter** - Routing

### Backend
- **Express** - HTTP server
- **ws** - WebSocket server
- **Zod** - Schema validation
- **TypeScript** - Type safety

## How the Puzzle Works

The sliding puzzle (n-puzzle) consists of a grid of numbered tiles with one empty space. The goal is to arrange tiles in order by sliding tiles into the empty space. The LLM receives the current board state as JSON and must respond with a valid move direction: `up`, `down`, `left`, or `right`.

Example board state (3x3):
```json
[[1, 2, 3], [4, null, 6], [7, 5, 8]]
```

Example LLM response:
```json
{"move": "down"}
```

## Development

### Adding a New Component

1. Create component in `client/src/components/`
2. Use Shadcn UI primitives from `client/src/components/ui/`
3. Import shared types from `@shared/schema`

### Modifying the Game Engine

The game engine in `server/game-engine.ts` handles:
- Board creation and scrambling
- Move validation
- State management

### Adding New LLM Providers

Modify `server/llm-client.ts` to add new providers. The system uses the Vercel AI Gateway which supports multiple providers through a unified API.

## License

MIT
