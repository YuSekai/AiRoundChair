# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

IntelliRound is an AI-powered desktop application built with Electron and TypeScript that facilitates multi-role debates and consensus generation. The application creates expert AI personas to discuss topics from different professional perspectives and reach balanced conclusions.

## Development Commands

```bash
# Install dependencies
npm install

# Development mode (with TypeScript compilation and auto-restart)
npm run dev

# Build TypeScript project
npm run build

# Start the built application
npm start

# Clean build artifacts
npm run clean

# Run tests (currently not implemented)
npm test
```

## Architecture Overview

### Core Components

**DebateManager** (`src/core/DebateManager.ts`): Central orchestrator that:
- Manages AI model initialization and validation
- Handles role generation (parallel or traditional modes)
- Coordinates debate sessions and event distribution
- Provides connection testing and diagnostics

**DebateEngine** (`src/core/DebateEngine.ts`): Debate execution engine that:
- Controls multi-round discussion flow
- Manages real-time role interactions with context awareness
- Handles different statement types (opening, argument, consensus)
- Implements convergence detection and consensus generation

**AI Model Layer** (`src/ai/AIModel.ts`): Abstracted AI interface supporting:
- Ollama local models (default)
- OpenAI-compatible APIs
- Configurable timeouts and parameters
- Connection validation and error handling

**Role Generation**:
- `ParallelRoleGenerator`: Advanced role generation with intelligent topic analysis and parallel processing
- `RoleGenerator`: Traditional fallback role generation

### Application Structure

- **Main Process** (`src/main.ts`): Electron main process with IPC handlers
- **Renderer** (`src/renderer/`): Frontend HTML/JS with chat-like interface
- **Preload** (`src/preload.ts`): Secure bridge between main and renderer
- **Utils**: File export, AI diagnostics, and connection fixing tools
- **Types**: TypeScript definitions for debate sessions, roles, and configurations

### Key Features

**Real-time Discussion Flow**: The system processes roles sequentially with proper context building, ensuring experts respond to each other rather than speaking independently.

**Dual Role Generation Modes**:
- Parallel mode: 3 concurrent AI connections for faster, higher-quality role generation
- Traditional mode: Sequential generation for better compatibility

**Intelligent Context Management**: Builds discussion context by tracking recent statements and providing analysis prompts to ensure meaningful interactions.

**Export Capabilities**: JSON and Markdown export formats with complete discussion history and statistics.

## Working with the Codebase

### Adding New AI Models
1. Extend `BaseAIModel` class in `src/ai/AIModel.ts`
2. Update `AIModelFactory.create()` method
3. Add configuration templates in `DebateManager.getAIConfigTemplates()`

### Modifying Discussion Logic
- Debate flow: `DebateEngine.conductDebateRound()`
- Prompt generation: `DebateEngine.buildPromptForRole()`
- Context building: `DebateEngine.buildContextForRole()`

### Role Generation Customization
- Parallel generation: `ParallelRoleGenerator.ts`
- Topic analysis: Modify analysis prompts in `getDefaultTopicAnalysis()`
- Fallback logic: Handled automatically in `DebateManager.startDebate()`

### Frontend Modifications
- Main interface: `src/renderer/index.html`
- Frontend logic: `src/renderer/renderer.js`
- IPC communication: Handlers defined in `src/main.ts`

## Important Configuration Notes

- Default AI model: Ollama with `llama2` or `mistral`
- Timeout configuration: 30-60 seconds recommended for reliable operation
- Role generation defaults to parallel mode for better performance
- The system includes comprehensive error handling and automatic fallbacks

## Testing Approach

The project currently has basic test files in the `test/` directory but no comprehensive test suite. When implementing new features, consider adding unit tests for:
- AI model connection validation
- Role generation logic
- Debate flow control
- Export functionality