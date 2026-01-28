# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

5D Character Creator is an AI-augmented narrative engine for writers and world-builders. It transforms character creation from form-filling to inline brainstorming with @ mentions, entity stubs, and context-aware AI assistance.

**Current Phase**: Phase 1 Complete (@ Mention System, Entity Stubs, Context Sidecar, Context Injection).

## Build & Run Commands

All commands run from `5d-character-creator-app/app/`:

```bash
npm run dev          # Start Next.js dev server on port 3000
npm run build        # Production build
npm run lint         # ESLint
npm test             # Run Jest tests (162 tests)
npm run test:watch   # Jest watch mode
npm run test:coverage # Coverage report
npx tsc --noEmit     # Type check without emit
```

## Architecture

### Tech Stack
- **Framework**: Next.js 16.1.1 with App Router (React 19)
- **State**: Zustand with localStorage persistence (`src/lib/store.ts` - central store)
- **AI**: Vercel AI SDK with Anthropic + OpenAI providers
- **Styling**: Tailwind CSS 4, Radix UI primitives, Framer Motion
- **Testing**: Jest with React Testing Library

### Key Directories

```
5d-character-creator-app/app/src/
├── app/                    # Next.js App Router
│   ├── api/chat/route.ts   # Main streaming chat endpoint
│   └── [feature]/page.tsx  # Feature pages
├── components/             # Feature-organized React components
├── lib/
│   ├── store.ts            # Zustand global state (33KB)
│   ├── mode-registry.ts    # Chat mode definitions (9 modes)
│   ├── modeContextConfig.ts # Per-mode context configuration
│   ├── contextInjection.ts # AI context assembly
│   ├── fuzzySearch.ts      # @ mention fuzzy matching
│   └── migrations/         # Data migration scripts
├── hooks/
│   └── useMentionDetection.ts # @ mention parsing hook
└── types/                  # TypeScript interfaces (Character, World, Project, ChatSession)
```

### Chat Mode System

Modes are defined in `mode-registry.ts`. Each mode has specific context requirements configured in `modeContextConfig.ts`. The main modes are: `chat`, `character`, `world`, `project`, `lore`, `scene`, `workshop`, `chat_with`, `script`.

### Entity System

Three entity types with shared patterns:
- **Character** (`#NAME_XXX`): Full prose fields, voiceProfile, canonicalFacts
- **World** (`@NAME_XXX`): Settings, magic systems, factions
- **Project** (`$NAME_XXX`): Links entities together

All entities support:
- `aliases[]` for fuzzy matching
- `voiceProfile` for voice consistency (Characters)
- `canonicalFacts[]` for continuity checking
- Soft delete with 30-day trash retention

### State Management Patterns

```typescript
// Zustand store actions follow this pattern:
createCharacterStub: (name: string) => {
  set((state) => ({
    characters: [...state.characters, stubEntity],
    developmentQueue: [...state.developmentQueue, queueItem]
  }));
}
```

All new schema fields must be optional to preserve backward compatibility.

## Testing

Coverage thresholds enforced:
- `fuzzySearch.ts`: 80% all metrics
- `useMentionDetection.ts`: 70% branches, 80% others

Tests live in `src/lib/__tests__/` and use patterns: `*.test.ts`, `*.spec.ts`.

## Multi-Agent System

Project uses specialized agents in `.claude/agents/`:
- **schema-architect**: Data models, type system
- **ui-specialist**: React components
- **context-engineer**: AI context management
- **integration-specialist**: API routes, third-party
- **test-engineer**: Testing & QA
- **deployment-verifier**: Pre-push build validation, Netlify readiness

Session reports tracked in `Session_Reports/[Month]/`.

## Phase Development

| Phase | Focus | Status |
|-------|-------|--------|
| Week 1-2 | @ Mentions, Entity Stubs, Schema | Complete |
| Week 3 | Context Sidecar (pinnable sidebar) | Complete |
| Week 4 | Just-in-Time Context Injection | Complete |
| Phase 2+ | Continuity Checker, Voice Match, Relationship Graph | Future |

## Key Files for Common Tasks

| Task | Files |
|------|-------|
| Add chat mode | `lib/mode-registry.ts`, `lib/modeContextConfig.ts` |
| Modify AI behavior | `app/api/chat/route.ts` |
| Add entity field | `types/*.ts`, `lib/store.ts`, `lib/migrations/` |
| Add UI component | `components/[feature]/`, export in `index.ts` |
| Context injection | `lib/contextInjection.ts`, `lib/context-budget.ts` |

## Path Aliases

Configured in `tsconfig.json`:
- `@/*` → `src/*`
- `@/templates/*` → `../app-page-idea-templates/*`

## Deployment

Netlify deployment configured in `netlify.toml`. Base directory: `5d-character-creator-app/app`.

### Pre-Push Verification

A deployment verification agent runs automatically before pushing to GitHub via the pre-push hook. This ensures:
- Build compiles successfully
- No ESLint errors
- Tests pass
- No sensitive files staged
- No large files outside Git LFS

To run verification manually:
```bash
cd 5d-character-creator-app/app
npm run verify:deploy

# Or directly:
./scripts/verify-deployment.sh
```

To skip verification (not recommended):
```bash
git push --no-verify
```

### Deployment Verifier Agent

Located in `.claude/agents/deployment-verifier/AGENT.md`. Use this agent for:
- Pre-deployment checks
- Build validation
- Security scanning
- Netlify configuration verification
