# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build the application for production
- `pnpm start` - Start the production server
- `pnpm lint` - Run ESLint for code quality

### Package Management
- Uses `pnpm` as the package manager
- Dependencies are managed through `package.json` and `pnpm-lock.yaml`

## Architecture Overview

This is a Next.js 15 application implementing multiple AI chat patterns:

### Core Tech Stack
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript with strict mode
- **AI/ML**: OpenAI GPT models via AI SDK, OpenAI Agents SDK
- **Vector Search**: Vectorize.io for RAG capabilities
- **Styling**: Tailwind CSS with custom components
- **Package Manager**: pnpm

### AI Implementation Patterns

The application implements two distinct AI chat patterns:

1. **Traditional RAG Chat** (`/vectorize`, `/api/chat`)
   - Single-turn document retrieval + generation
   - Uses `generateText()` from AI SDK
   - Structured response with sources

2. **OpenAI Agents SDK** (`/agents-sdk`, `/api/agents-sdk`)
   - Advanced agent with specialized rewriting capabilities
   - Document search with enhanced context (text type, tone, purpose, audience)
   - Server-sent events streaming

### Key Service Classes

- **RetrievalService** (`lib/retrieval.ts`): Orchestrates document retrieval with context enhancement
- **VectorizeService** (`lib/vectorize.ts`): Direct integration with Vectorize.io API

### Environment Variables Required

```env
OPENAI_API_KEY=
VECTORIZE_PIPELINE_ACCESS_TOKEN=
VECTORIZE_ORGANIZATION_ID=
VECTORIZE_PIPELINE_ID=
```

### Component Architecture

- **Chat Components**: `components/chat.tsx` (RAG), `components/agent-chat.tsx` (streaming agent)
- **Sources Display**: `components/sources-display.tsx` for RAG source rendering
- **Pages**: Direct component rendering in `app/` directory following Next.js App Router

### Development Notes

- TypeScript paths use `@/*` for root-level imports
- All API routes follow Next.js 15 App Router conventions
- Environment variables are loaded from `.env.local` (git-ignored)
- Uses Turbopack for fast development builds
- Components follow React 19 patterns with modern hooks

### Error Handling

- Services implement try-catch with fallback responses
- API routes return structured error responses
- Console logging for development debugging

### Testing & Quality

- ESLint configuration for code quality
- TypeScript strict mode enabled
- No test framework currently configured