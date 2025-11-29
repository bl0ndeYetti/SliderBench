# LLM Sliding Puzzle Benchmark Dashboard

## Overview

This application is a real-time benchmarking platform that tests and visualizes how different Large Language Models (LLMs) solve sliding tile puzzles (n-puzzle problems). The system orchestrates puzzle games, calls LLM APIs through Vercel AI Gateway, tracks move-by-move performance, and displays live results through an interactive dashboard with WebSocket updates.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript using Vite as the build tool and development server.

**Rationale**: React provides a component-based architecture ideal for the real-time, data-dense dashboard interface. Vite offers fast hot module replacement during development and optimized production builds.

**UI Component System**: Shadcn UI with Radix UI primitives and Tailwind CSS for styling.

**Rationale**: Shadcn UI provides a comprehensive set of accessible, customizable components built on Radix UI primitives. The "New York" style variant is configured for a clean, professional look. Tailwind CSS enables rapid styling with a utility-first approach, and the custom design system (defined in `design_guidelines.md`) follows Material Design principles for data visualization clarity.

**State Management**: 
- TanStack Query (React Query) for server state management and caching
- Local React state for UI interactions and WebSocket message handling
- Custom hooks (`use-websocket`, `use-toast`, `use-mobile`) for reusable logic

**Rationale**: React Query eliminates the need for manual cache management and provides automatic background refetching. WebSocket state is managed separately to handle real-time updates efficiently without over-fetching from REST endpoints.

**Real-time Updates**: WebSocket connection for live benchmark updates.

**Rationale**: WebSockets provide bi-directional, low-latency communication essential for real-time dashboard updates. The system broadcasts events like run creation, progress updates, and completion to all connected clients.

**Routing**: Wouter for lightweight client-side routing.

**Rationale**: Wouter is a minimal routing library (~1KB) suitable for this single-page dashboard application, avoiding the overhead of larger routing solutions.

### Backend Architecture

**Framework**: Express.js with TypeScript running on Node.js.

**Rationale**: Express provides a minimal, flexible foundation for building the REST API and WebSocket server. TypeScript adds type safety across the full stack, sharing types between frontend and backend via the `shared/schema.ts` file.

**Game Engine**: Pure TypeScript implementation (`server/game-engine.ts`) for puzzle logic.

**Rationale**: Implementing the game logic in-house provides full control over puzzle generation, move validation, and state management. The engine creates solved boards, scrambles them with random valid moves, and validates LLM-suggested moves.

**Orchestration Layer** (`server/orchestrator.ts`): Manages the benchmark run lifecycle.

**Components**:
- Initializes runs with configured parameters (model, board size, max moves, scramble depth)
- Calls the LLM client for move suggestions
- Validates and applies moves using the game engine
- Updates storage with move records and LLM call logs
- Broadcasts progress via WebSocket

**Rationale**: Separating orchestration from API routes and game logic creates a clean separation of concerns. The orchestrator can be invoked from either the HTTP API or a CLI for batch benchmarks.

**Storage Layer** (`server/storage.ts`): In-memory storage using TypeScript Maps.

**Rationale**: For the initial implementation, in-memory storage is sufficient and provides the fastest read/write performance. The `IStorage` interface allows swapping to a persistent database (like Postgres) without changing the rest of the codebase. The storage tracks games, runs, move records, and LLM call logs separately for efficient queries.

**WebSocket Server**: Integrated with Express via the `ws` library.

**Rationale**: The `ws` library is lightweight and integrates directly with the HTTP server. Broadcasts are sent to all connected clients whenever runs are created, updated, or completed, keeping the dashboard synchronized across multiple viewers.

### External Dependencies

**Vercel AI Gateway**: LLM API proxy for unified access to multiple model providers.

**Configuration**:
- Base URL: `AI_GATEWAY_BASE_URL` environment variable (defaults to `https://ai-gateway.vercel.sh/v1`)
- API Key: `AI_GATEWAY_API_KEY` environment variable
- Default Model: `DEFAULT_MODEL_ID` environment variable (defaults to `openai/gpt-4.1-mini`)

**Rationale**: The AI Gateway abstracts away provider-specific API details, allowing the system to call OpenAI, Anthropic, and other LLM providers through a unified interface. This simplifies client code and enables easy model switching. The gateway handles authentication, rate limiting, and provides usage analytics.

**API Integration** (`server/llm-client.ts`):
- Sends JSON-formatted puzzle boards with system prompts instructing the LLM to respond with move directions
- Parses JSON responses to extract move suggestions
- Tracks latency and token usage for each call
- Handles errors including parse failures and API errors

**PostgreSQL** (Optional - Drizzle ORM configured but not actively used):

**Configuration**: 
- Drizzle Kit configured in `drizzle.config.ts` pointing to `shared/schema.ts`
- Database URL: `DATABASE_URL` environment variable
- Migration output: `./migrations` directory

**Rationale**: While the current implementation uses in-memory storage, Drizzle ORM is configured for future migration to Postgres. Drizzle provides type-safe database queries that integrate well with TypeScript. The Neon serverless driver (`@neondatabase/serverless`) is included for edge-compatible database connections.

**Design System**: Inter font via Google Fonts CDN, JetBrains Mono for monospaced numbers.

**Rationale**: Inter provides excellent readability for data-dense interfaces and superior number legibility. JetBrains Mono ensures move counts and statistics align consistently in tabular displays.

**Build and Deployment**:
- Client: Vite builds to `dist/public`
- Server: esbuild bundles to `dist/index.cjs` with selective dependency bundling
- Development: Concurrent Vite dev server and tsx server execution

**Rationale**: esbuild provides fast server bundling with tree-shaking. The build script bundles frequently-used dependencies (like database clients and LLM SDKs) while externalizing less-critical packages to optimize cold start times in serverless environments.