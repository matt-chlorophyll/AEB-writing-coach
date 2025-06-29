# AI Writing Coach

A sophisticated **AI-powered writing improvement platform** that analyzes your text and rewrites it with professional precision. Built with Next.js 15, TypeScript, and powered by OpenAI's advanced models with intelligent document retrieval capabilities.

## ✨ Features

### Two-Step Writing Enhancement Process
1. **Intelligent Analysis**: AI analyzes your text to understand its type, tone, purpose, and audience
2. **Professional Rewriting**: Uses retrieved writing guidelines to enhance your content

### Core Capabilities
- **Smart Text Analysis**: Automatically detects text type (emails, blog posts, marketing copy, etc.)
- **Context Understanding**: Extracts tone, purpose, and target audience
- **RAG-Enhanced Rewriting**: Retrieves relevant writing guidelines from a curated knowledge base
- **Real-time Streaming**: Watch your text being improved in real-time
- **Change Comparison**: Side-by-side view of original vs. rewritten text
- **Multiple UI Patterns**: Both traditional RAG chat and advanced OpenAI Agents SDK implementation

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript with strict mode
- **AI/ML**: OpenAI GPT models via AI SDK, OpenAI Agents SDK
- **Vector Search**: Vectorize.io for RAG capabilities
- **Styling**: Tailwind CSS with custom components
- **Package Manager**: pnpm

## 📋 Prerequisites

Before setting up this project, you'll need:

1. **Node.js** (v18 or higher)
2. **pnpm**: [Install pnpm](https://pnpm.io/installation)
3. **OpenAI API Key**: [Get one here](https://platform.openai.com/api-keys)
4. **Vectorize.io Account**: [Sign up here](https://vectorize.io)

## 🔧 Installation

1. **Install dependencies**

   ```bash
   pnpm install
   ```

2. **Set up environment variables**

   Create a `.env.local` file in the root directory:

   ```bash
   touch .env.local
   ```

   Add the following variables:

   ```env
   # OpenAI Configuration
   OPENAI_API_KEY=your_openai_api_key_here

   # Vectorize.io Configuration
   VECTORIZE_PIPELINE_ACCESS_TOKEN=your_vectorize_access_token_here
   VECTORIZE_ORGANIZATION_ID=your_vectorize_organization_id_here
   VECTORIZE_PIPELINE_ID=your_vectorize_pipeline_id_here
   ```

## 🔑 Environment Variables Setup

### OpenAI API Key

1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new secret key
3. Copy the key and add it to your `.env.local`

### Vectorize.io Configuration

1. Sign up at [Vectorize.io](https://vectorize.io)
2. Create a new organization and pipeline
3. Generate an access token with retrieval permissions
4. Copy the organization ID, pipeline ID, and access token to your `.env.local`

## 🚀 Getting Started

1. **Start the development server**

   ```bash
   pnpm dev
   ```

2. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

3. **Explore the features**
   - **Home Page**: Overview of available writing tools
   - **Traditional RAG Chat** (`/vectorize`): Simple document-based chat
   - **AI Writing Coach** (`/agents-sdk`): Advanced text analysis and rewriting
   - **Comparison View** (`/comparison`): Side-by-side text comparison

## 🏗️ Application Architecture

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

### Key Services

- **RetrievalService** (`lib/retrieval.ts`): Orchestrates document retrieval with context enhancement
- **VectorizeService** (`lib/vectorize.ts`): Direct integration with Vectorize.io API

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (Next.js)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │
│  │   / (Home)      │    │  /vectorize     │    │ /agents-sdk     │         │
│  │   Landing Page  │    │   RAG Chat      │    │ Writing Coach   │         │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘         │
│                          │                     │                           │
│                          ▼                     ▼                           │
│                    ┌─────────────────┐    ┌─────────────────┐               │
│                    │   chat.tsx      │    │ agent-chat.tsx  │               │
│                    │ (RAG Chat UI)   │    │ (Writing Coach) │               │
│                    └─────────────────┘    └─────────────────┘               │
│                          │                     │                           │
│                    ┌─────────────────┐    ┌─────────────────┐               │
│                    │sources-display  │    │/comparison      │               │
│                    │     .tsx        │    │   page.tsx      │               │
│                    └─────────────────┘    └─────────────────┘               │
└─────────────────────────────────────────────────────────────────────────────┘
                             │                     │
                             ▼                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API LAYER                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│    ┌─────────────────┐              ┌─────────────────┐                     │
│    │  /api/chat      │              │/api/agents-sdk  │                     │
│    │   route.ts      │              │   route.ts      │                     │
│    │ (RAG Endpoint)  │              │(Analysis Flow)  │                     │
│    └─────────────────┘              └─────────────────┘                     │
│              │                               │                              │
│              │                   ┌───────────┼───────────┐                  │
│              │                   │           │           │                  │
│              ▼                   ▼           ▼           ▼                  │
│    ┌─────────────────┐   ┌─────────────┐ ┌──────────┐ ┌──────────┐         │
│    │ generateText()  │   │/api/analysis│ │/api/     │ │/api/     │         │
│    │ (Single Call)   │   │   route.ts  │ │rewrite   │ │analyze-  │         │
│    └─────────────────┘   └─────────────┘ └──────────┘ │changes   │         │
│                                                       └──────────┘         │
└─────────────────────────────────────────────────────────────────────────────┘
                             │                           │
                             ▼                           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SERVICE LAYER                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                    ┌─────────────────┐                                     │
│                    │ RetrievalService│ ◄──────────────────────────────────┐ │
│                    │ (/lib/retrieval)│                                   │ │
│                    └─────────────────┘                                   │ │
│                             │                                           │ │
│                             ▼                                           │ │
│                    ┌─────────────────┐                                   │ │
│                    │ VectorizeService│                                   │ │
│                    │ (/lib/vectorize)│                                   │ │
│                    └─────────────────┘                                   │ │
└─────────────────────────────────────────────────────────────────────────────┘
                             │                                           │
                             ▼                                           │
┌─────────────────────────────────────────────────────────────────────────────┐ │
│                          EXTERNAL APIs                                 │ │
├─────────────────────────────────────────────────────────────────────────────┤ │
│    ┌─────────────────┐              ┌─────────────────┐                 │ │
│    │   OpenAI API    │              │  Vectorize.io   │ ◄───────────────┘ │
│    │                 │              │                 │                   │
│    │ • GPT-4o        │              │ • Document      │                   │
│    │ • GPT-4o-mini   │              │   Retrieval     │                   │
│    │ • Text Analysis │              │ • Vector Search │                   │
│    │ • Rewriting     │              │ • Writing Guide │                   │
│    └─────────────────┘              └─────────────────┘                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
ai-writing-coach/
├── app/
│   ├── agents-sdk/        # AI Writing Coach interface
│   │   └── page.tsx       # Main writing coach page
│   ├── api/
│   │   ├── agents-sdk/    # Analysis endpoint
│   │   ├── analysis/      # Text analysis API
│   │   ├── rewrite/       # Text rewriting API
│   │   ├── analyze-changes/  # Change analysis API
│   │   └── chat/          # Traditional RAG chat API
│   ├── comparison/        # Text comparison interface
│   │   └── page.tsx       # Side-by-side comparison
│   ├── vectorize/         # RAG chat interface
│   │   └── page.tsx       # Traditional chat page
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx          # Home page
├── components/
│   ├── chat.tsx          # RAG chat component
│   └── sources-display.tsx # Document sources display
├── lib/
│   ├── consts.ts         # Constants and configurations
│   ├── retrieval.ts      # Document retrieval service
│   ├── utils.ts          # Utility functions
│   └── vectorize.ts      # Vectorize.io API integration
├── types/
│   ├── analysis.ts       # Analysis and rewriting types
│   ├── chat.ts           # Chat-related types
│   └── vectorize.ts      # Vectorize API types
└── .env.local           # Environment variables
```

## 🎯 How It Works

### AI Writing Coach Flow

1. **Text Input**: User pastes their text for improvement
2. **Intelligent Analysis**: AI analyzes text type, tone, purpose, and audience
3. **Guideline Retrieval**: System searches for relevant writing guidelines
4. **Professional Rewriting**: AI rewrites text using retrieved best practices
5. **Change Comparison**: User can view original vs. improved text side-by-side

### Traditional RAG Flow

1. **Question Input**: User asks questions about documents
2. **Document Retrieval**: System queries vectorized knowledge base
3. **Context Formation**: Retrieved documents provide context
4. **AI Response**: GPT generates answer with source citations

## 🎨 User Interface Features

- **Responsive Design**: Works seamlessly on desktop and mobile
- **Real-time Streaming**: Watch text being generated in real-time
- **Dynamic Layout**: Chat interface expands when generating responses
- **Loading Animations**: Smooth animations during processing
- **Error Handling**: Graceful error messages and recovery
- **Accessibility**: Screen reader friendly with proper ARIA labels

## 🛠️ Available Scripts

- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build the application for production
- `pnpm start` - Start the production server
- `pnpm lint` - Run ESLint for code quality

## 🔍 Troubleshooting

### Common Issues

1. **Missing Environment Variables**
   - Ensure all required environment variables are set in `.env.local`
   - Check that your API keys are valid and have proper permissions

2. **Vectorize Connection Issues**
   - Verify your Vectorize.io credentials
   - Ensure your pipeline has writing guidelines documents

3. **OpenAI API Errors**
   - Check your OpenAI API key validity
   - Ensure you have sufficient credits/quota

## 📖 Learn More

### Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Vectorize.io Documentation](https://vectorize.io/docs)
- [AI SDK Documentation](https://sdk.vercel.ai)

### AI Agent Engineering

This project demonstrates several key concepts from AI agent engineering:

- **Multi-step reasoning**: Analysis → Retrieval → Rewriting
- **Tool usage**: Document search with contextual parameters
- **Streaming responses**: Real-time user feedback
- **Context management**: Maintaining conversation state
- **Error handling**: Graceful degradation and recovery

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to a Git repository
2. Connect your repository to [Vercel](https://vercel.com)
3. Add your environment variables in the Vercel dashboard
4. Deploy automatically on every push

## 🎓 Educational Context

This project was developed as part of an AI Agent Engineering Bootcamp, showcasing:

- Advanced AI application patterns
- RAG (Retrieval-Augmented Generation) implementation
- OpenAI Agents SDK integration
- Real-world UI/UX considerations
- Production-ready TypeScript/Next.js development

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

---

**Built with ❤️ for AI Agent Engineering Bootcamp**