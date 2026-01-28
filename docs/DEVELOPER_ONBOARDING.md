# 5D Character Creator - Developer Onboarding

**Version:** 1.0
**Last Updated:** 2026-01-28
**Target Audience:** New developers joining the project

---

## 📚 Table of Contents

1. [Project Overview](#project-overview)
2. [Getting Started](#getting-started)
3. [Project Structure](#project-structure)
4. [Tech Stack](#tech-stack)
5. [Key Architectural Patterns](#key-architectural-patterns)
6. [Multi-Agent Development Workflow](#multi-agent-development-workflow)
7. [How to Add Features](#how-to-add-features)
8. [Code Style Conventions](#code-style-conventions)
9. [Testing Guidelines](#testing-guidelines)
10. [Common Tasks](#common-tasks)

---

## Project Overview

### What Is the 5D Character Creator?

An advanced narrative engine for writers, world-builders, and roleplayers to craft deep, multi-dimensional characters through a structured 5-phase development process.

### Project Goals

**Primary Goal**: Transform a form-based brainstorming tool into an AI-Augmented Word Processor with canonical memory management.

**Formula**: Visual Wiki (UI) + Smart Detection (Architecture) + Just-in-Time Injection (Workflow)

### Current Status (Phase 1)

| Phase | Status | Features |
|-------|--------|----------|
| Phase 1 | ✅ 50% Complete | @ Mention System, Entity Stubs, Enhanced Schema |
| Phase 2 | ⏳ Planned | Context Sidecar, Just-in-Time Injection |
| Phase 3 | ⏳ Planned | Continuity Checker, Voice Match Mode |
| Phase 4 | ⏳ Planned | Relationship Graphs, Completion Assistant |
| Phase 5 | 💡 Concept | Narrative Branches, Collaborative Editing |

### Key Stakeholders

- **Primary User**: Creative writers working on novels, stories, RPG campaigns
- **Secondary User**: World-builders, game designers, screenwriters
- **Development Team**: Multi-agent AI system + human oversight

---

## Getting Started

### Prerequisites

```bash
Node.js 22+  (required for Agent Runners compatibility)
npm 10+
Git
Text Editor (VS Code recommended)
```

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd 5D-Charachter-Creator-Nitro

# Navigate to app directory
cd 5d-character-creator-app/app

# Install dependencies
npm install

# Run development server
npm run dev

# Open in browser
# http://localhost:3000
```

### First Build

```bash
# Type check
npx tsc --noEmit

# Build for production
npm run build

# Run tests (when available)
npm test
```

### Verify Setup

1. Open http://localhost:3000
2. Navigate to Chat Studio
3. Type `@TestCharacter` in chat input
4. Verify mention popup appears
5. Create a test entity stub
6. Check entity gallery for new stub

---

## Project Structure

### High-Level Overview

```
F:\3. Development\5D Charachter Creator (Nitro)\
│
├── .claude/                           # Claude Code agent configurations
│   ├── agents/                        # 9 specialized agent configs
│   └── settings.local.json            # Permissions & agent settings
│
├── ai_context_learning/               # AI knowledge base
│   ├── decisions/                     # Architecture Decision Records (ADRs)
│   ├── schemas/                       # Schema evolution history
│   ├── patterns/                      # Reusable code patterns
│   ├── errors/                        # Common errors & solutions
│   └── milestones/                    # Phase learnings
│
├── Session_Reports/                   # Milestone tracking
│   ├── February 2026/                 # Monthly reports
│   └── Implementation_plans/          # Strategic plans
│
├── docs/                              # User & developer documentation
│   ├── USER_GUIDE_PHASE1.md
│   └── DEVELOPER_ONBOARDING.md        # This file
│
├── knowledge-bank/                    # PDFs and research materials
│
└── 5d-character-creator-app/
    └── app/                           # Next.js application root
        ├── public/                    # Static assets
        ├── src/
        │   ├── app/                   # Next.js App Router pages
        │   │   ├── page.tsx           # Home page
        │   │   ├── chat/              # Chat Studio
        │   │   ├── gallery/           # Entity galleries
        │   │   ├── wiki/              # Wiki views
        │   │   └── api/               # API routes
        │   ├── components/            # React components
        │   │   ├── chat/              # Chat-related components
        │   │   ├── gallery/           # Gallery components
        │   │   ├── wiki/              # Wiki components
        │   │   └── ui/                # Reusable UI components (shadcn)
        │   ├── hooks/                 # Custom React hooks
        │   ├── lib/                   # Utilities and core logic
        │   │   ├── store.ts           # Zustand global state
        │   │   ├── fuzzySearch.ts     # Fuzzy matching algorithm
        │   │   ├── migrations/        # Schema migration utilities
        │   │   └── context-budget.ts  # AI context management
        │   └── types/                 # TypeScript type definitions
        │       ├── character.ts
        │       ├── world.ts
        │       └── project.ts
        ├── package.json
        ├── tsconfig.json
        └── tailwind.config.ts
```

### Key Directories Explained

#### `/src/app` - Next.js App Router

- **Structure**: File-system based routing
- **Convention**: `page.tsx` = route, `layout.tsx` = nested layout
- **API Routes**: `app/api/*/route.ts`

Example:
```
src/app/chat/page.tsx       → /chat
src/app/gallery/page.tsx    → /gallery
src/app/api/chat/route.ts   → /api/chat (POST endpoint)
```

#### `/src/components` - React Components

- **Organized by feature**: `chat/`, `gallery/`, `wiki/`
- **Reusable UI**: `ui/` (shadcn/ui components)
- **Naming**: PascalCase for components, kebab-case for files

Example:
```
components/chat/MentionPopup.tsx      → <MentionPopup />
components/ui/button.tsx              → <Button />
```

#### `/src/lib` - Core Logic

- **State Management**: `store.ts` (Zustand)
- **Utilities**: Pure functions, no side effects
- **Migrations**: Schema evolution utilities

#### `/src/types` - TypeScript Definitions

- **Schemas**: `Character`, `World`, `Project` interfaces
- **Enums**: Reusable type enums
- **Exports**: All types exported from index

#### `/.claude/agents` - Agent Configurations

- **9 Agents**: Specialized roles (schema-architect, ui-specialist, etc.)
- **Format**: Markdown with responsibilities, workflows, communication protocols

#### `/ai_context_learning` - Knowledge Base

- **ADRs**: Why decisions were made
- **Patterns**: Reusable code snippets
- **Learnings**: What worked, what didn't

---

## Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.1.1 | React framework with App Router |
| **React** | 19+ | UI library |
| **TypeScript** | 5.7+ | Type safety |
| **Tailwind CSS** | 3.4+ | Utility-first styling |
| **shadcn/ui** | Latest | Component library |
| **Lucide React** | Latest | Icon library |
| **Framer Motion** | Latest | Animations |

### State Management

| Technology | Purpose | When to Use |
|------------|---------|-------------|
| **Zustand** | Global state | Entities, settings, queues |
| **LocalStorage** | Persistence | All state persists automatically |
| **React State** | Component state | Form inputs, UI toggles |

### Backend

| Technology | Purpose |
|------------|---------|
| **Next.js API Routes** | Server-side logic |
| **Vercel AI SDK** | AI provider integration |

### Development Tools

| Tool | Purpose |
|------|---------|
| **ESLint** | Code linting |
| **Prettier** | Code formatting |
| **TypeScript Compiler** | Type checking |

---

## Key Architectural Patterns

### 1. Zustand Store Pattern

**File**: `src/lib/store.ts`

**Structure**:
```typescript
interface StoreState {
  // State
  characters: Character[];
  worlds: World[];
  developmentQueue: DevelopmentQueueItem[];

  // Actions
  createCharacterStub: (name: string) => void;
  addToDevelopmentQueue: (entityId: string, entityType: string) => void;
}

const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      // Initial state
      characters: [],
      worlds: [],
      developmentQueue: [],

      // Actions
      createCharacterStub: (name) => set((state) => ({
        characters: [...state.characters, createStub(name)]
      })),
    }),
    {
      name: '5d-character-storage',
      partialize: (state) => ({
        characters: state.characters,
        worlds: state.worlds,
        developmentQueue: state.developmentQueue,
      })
    }
  )
);
```

**Usage in Components**:
```typescript
function ChatStudio() {
  const { characters, createCharacterStub } = useStore();

  const handleCreate = () => {
    createCharacterStub('New Character');
  };

  return <div>{characters.length} characters</div>;
}
```

**Best Practices**:
- Keep actions idempotent
- Use `partialize` to control what persists
- Avoid storing computed values

---

### 2. Optional Field Pattern (Schema Evolution)

**Problem**: Adding new fields to existing schemas breaks existing data

**Solution**: Always make new fields optional

**Implementation**:
```typescript
export interface Character {
  // Required fields (existing)
  id: string;
  name: string;

  // Optional fields (new in Phase 1)
  voiceProfile?: VoiceProfile;
  canonicalFacts?: CanonicalFact[];
  aliases?: string[];
}
```

**Benefits**:
- Zero breaking changes
- Backward compatible
- Gradual adoption

---

### 3. Fuzzy Search Pattern

**File**: `src/lib/fuzzySearch.ts`

**Algorithm**: Levenshtein distance + scoring hierarchy

**Implementation**:
```typescript
function fuzzySearchEntities(
  query: string,
  entities: Entity[],
  maxResults: number = 5
): FuzzyMatch[] {
  const matches = entities.map(entity => ({
    entity,
    score: calculateScore(query, entity.name),
    matchedField: 'name'
  }));

  // Add alias matches
  entities.forEach(entity => {
    entity.aliases?.forEach(alias => {
      matches.push({
        entity,
        score: calculateScore(query, alias),
        matchedField: 'alias',
        matchedValue: alias
      });
    });
  });

  // Sort by score, return top N
  return matches
    .filter(m => m.score !== Infinity)
    .sort((a, b) => a.score - b.score)
    .slice(0, maxResults);
}
```

**Scoring**:
- Exact match: score 0
- Starts with: score 0.5
- Contains: score 1
- Levenshtein ≤2: score 2-4
- No match: score Infinity

---

### 4. Entity Stub Pattern

**Purpose**: Low-friction entity creation

**Implementation**:
```typescript
function createEntityStub(name: string, type: EntityType): Entity {
  const prefix = type === 'character' ? '#' : type === 'world' ? '@' : '$';
  const id = `${prefix}${name.toUpperCase().replace(/\s+/g, '_')}_${randomSuffix()}`;

  return {
    id,
    name,
    aliases: [],
    tags: ['stub', 'needs-development'],
    progress: 5,
    [requiredFields]: [defaultValues],
    createdAt: new Date(),
    updatedAt: new Date()
  };
}
```

**Key Features**:
- Auto-generated unique ID
- Minimal required fields
- Tagged for tracking
- Added to development queue

---

### 5. Mention Detection Pattern

**File**: `src/hooks/useMentionDetection.ts`

**Regex**: `/@(\w+(?:\s+\w+)*?)(?=\s|$|[.,!?;:]|@)/g`

**Implementation**:
```typescript
function detectMentions(text: string): EntityMention[] {
  const regex = /@(\w+(?:\s+\w+)*?)(?=\s|$|[.,!?;:]|@)/g;
  const mentions: EntityMention[] = [];

  let match;
  while ((match = regex.exec(text)) !== null) {
    mentions.push({
      name: match[1],
      position: { start: match.index, end: match.index + match[0].length },
      exists: checkEntityExists(match[1])
    });
  }

  return mentions;
}
```

**Features**:
- Multi-word support (`@The Northern War`)
- Stops at punctuation
- Handles multiple mentions per line

---

## Multi-Agent Development Workflow

### Agent System Overview

The project uses 9 specialized AI agents for coordinated development:

| Agent | Specialization | Primary Files |
|-------|----------------|---------------|
| **schema-architect** | Data models & types | `types/` |
| **context-engineer** | AI context & prompts | `lib/context*`, `api/chat` |
| **ui-specialist** | React components | `components/`, `hooks/` |
| **mode-designer** | Chat modes | `lib/mode-registry.ts` |
| **visualization-expert** | Graphs & charts | `components/visualization/` |
| **integration-specialist** | APIs & integrations | `api/` routes |
| **test-engineer** | Testing & QA | Test files |
| **documentation-keeper** | Docs & ADRs | `docs/`, `ai_context_learning/` |
| **project-coordinator** | Milestones & tracking | `Session_Reports/` |

### Agent Workflow

#### Typical Development Flow

```
1. User requests feature
         ↓
2. project-coordinator creates task breakdown
         ↓
3. schema-architect designs data models (if needed)
         ↓
4. ui-specialist builds components
         ↓
5. integration-specialist connects to APIs (if needed)
         ↓
6. test-engineer writes tests
         ↓
7. documentation-keeper updates docs
         ↓
8. project-coordinator creates milestone report
```

#### Agent Communication Protocol

**When to notify other agents**:
- Schema changes → Notify ui-specialist, context-engineer
- New component → Notify documentation-keeper
- New API → Notify integration-specialist, test-engineer
- Feature complete → Notify project-coordinator

**How agents communicate**:
- Task comments
- Markdown files in `ai_context_learning/`
- Session reports
- ADRs (Architecture Decision Records)

### Working with Agents

#### As a Human Developer

**Before starting work**:
1. Check `ai_context_learning/decisions/` for relevant ADRs
2. Read recent milestone reports in `Session_Reports/`
3. Review relevant agent AGENT.md files in `.claude/agents/`

**During development**:
1. Follow patterns documented in `ai_context_learning/patterns/`
2. Document new patterns as you discover them
3. Create ADRs for significant decisions

**After completing work**:
1. Update relevant documentation
2. Create or update ADRs if needed
3. Notify project-coordinator for milestone tracking

#### Requesting Agent Help

**Example: Need a new component**

```markdown
@ui-specialist: Create a DevelopmentQueuePanel component

Requirements:
- Display all entities with 'needs-development' tag
- Show entity name, type, progress %
- Click to open entity detail
- Filter by entity type
- Sort by creation date or progress

Styling:
- Match existing glassmorphism aesthetic
- Use shadcn/ui components where possible
```

---

## How to Add Features

### Adding a New Chat Mode

**Files to modify**:
- `src/lib/mode-registry.ts`
- `src/app/api/chat/route.ts`
- (Optional) Mode-specific component in `src/components/chat/`

**Steps**:

1. **Define mode in registry**:
```typescript
// In mode-registry.ts
export const MODES = {
  // ... existing modes
  my_new_mode: {
    id: 'my_new_mode',
    name: 'My New Mode',
    description: 'Description of what this mode does',
    icon: 'icon-name',
    systemPrompt: 'You are a helpful assistant for...',
    contextRules: {
      includeFields: ['name', 'coreConcept'],
      excludeFields: ['imageUrl'],
      maxEntities: 5
    }
  }
};
```

2. **Add API route handling** (if custom logic needed):
```typescript
// In app/api/chat/route.ts
if (mode === 'my_new_mode') {
  // Custom pre-processing
  const enhancedContext = await enhanceContext(context);
  // Custom post-processing
  const filteredResponse = filterResponse(response);
}
```

3. **Create mode component** (optional):
```typescript
// components/chat/MyNewModePanel.tsx
export function MyNewModePanel() {
  // Mode-specific UI
  return <div>Mode-specific controls</div>;
}
```

4. **Test**:
- Select new mode in Chat Studio
- Send test messages
- Verify context injection
- Check response quality

---

### Adding a New Entity Type

**Files to modify**:
- `src/types/[entity].ts` (create new type file)
- `src/lib/store.ts` (add to state)
- `src/components/gallery/` (add gallery view)
- `src/components/wiki/` (add wiki view)

**Steps**:

1. **Define TypeScript interface**:
```typescript
// types/location.ts
export interface Location {
  id: string;
  name: string;
  aliases?: string[];
  type: 'city' | 'dungeon' | 'wilderness' | 'building';
  description?: string;
  canonicalFacts?: CanonicalFact[];
  imageUrl?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

2. **Add to Zustand store**:
```typescript
// lib/store.ts
interface StoreState {
  locations: Location[];
  createLocationStub: (name: string) => void;
  // ... other actions
}

const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      locations: [],

      createLocationStub: (name) => set((state) => ({
        locations: [...state.locations, createStub(name, 'location')],
        developmentQueue: [...state.developmentQueue, {
          entityId: id,
          entityType: 'location',
          createdAt: new Date()
        }]
      })),
    }),
    {
      name: '5d-character-storage',
      partialize: (state) => ({
        // ... add locations to persist
        locations: state.locations,
      })
    }
  )
);
```

3. **Update fuzzy search**:
```typescript
// lib/fuzzySearch.ts
export type Entity = Character | World | Project | Location;

export function fuzzySearchEntities(query: string, entities: Entity[]) {
  // Existing logic works automatically
}
```

4. **Create gallery view**:
```typescript
// components/gallery/LocationGallery.tsx
export function LocationGallery() {
  const { locations } = useStore();

  return (
    <div className="grid grid-cols-3 gap-4">
      {locations.map(location => (
        <LocationCard key={location.id} location={location} />
      ))}
    </div>
  );
}
```

5. **Add to navigation**:
```typescript
// app/gallery/page.tsx
<Tabs defaultValue="characters">
  <TabsList>
    <TabsTrigger value="characters">Characters</TabsTrigger>
    <TabsTrigger value="worlds">Worlds</TabsTrigger>
    <TabsTrigger value="locations">Locations</TabsTrigger>
  </TabsList>
</Tabs>
```

---

### Adding a New Schema Field

**Recommended Pattern**: Optional fields for backward compatibility

**Steps**:

1. **Update type definition**:
```typescript
// types/character.ts
export interface Character {
  // ... existing fields
  newField?: NewFieldType; // Optional for backward compatibility
}
```

2. **Create migration** (if transforming existing data):
```typescript
// lib/migrations/phase2-schema.ts
export function migrateToPhase2(character: Character): Character {
  return {
    ...character,
    newField: character.newField ?? defaultValue
  };
}
```

3. **Update UI**:
```typescript
// components/character/CharacterDetail.tsx
<div>
  <label>New Field</label>
  <input
    value={character.newField ?? ''}
    onChange={(e) => updateCharacter({ newField: e.target.value })}
  />
</div>
```

4. **Document in ADR**:
```markdown
# ADR-XXX: New Field Addition

## Context
Why is this field needed?

## Decision
Added optional field `newField` to Character schema

## Rationale
- Optional for backward compatibility
- Enables [feature X]
```

---

### Extending Fuzzy Search

**Example**: Add custom scoring for priority entities

**Steps**:

1. **Add priority field**:
```typescript
export interface Entity {
  // ... existing fields
  priority?: 'high' | 'normal' | 'low';
}
```

2. **Modify scoring**:
```typescript
// lib/fuzzySearch.ts
function calculateScore(query: string, entity: Entity): number {
  let baseScore = calculateLevenshteinScore(query, entity.name);

  // Boost priority entities
  if (entity.priority === 'high') {
    baseScore -= 0.5; // Higher priority = lower score = better match
  }

  return baseScore;
}
```

3. **Update tests** (when available):
```typescript
test('priority entities rank higher', () => {
  const entities = [
    { name: 'Kira', priority: 'high' },
    { name: 'Kiran', priority: 'normal' }
  ];

  const results = fuzzySearchEntities('Kir', entities);

  expect(results[0].entity.name).toBe('Kira'); // Priority wins
});
```

---

## Code Style Conventions

### TypeScript

**Naming Conventions**:
```typescript
// Interfaces: PascalCase
interface Character {}

// Types: PascalCase
type EntityType = 'character' | 'world';

// Enums: PascalCase
enum ProgressPhase {}

// Variables: camelCase
const characterName = 'Kira';

// Functions: camelCase
function createCharacter() {}

// React Components: PascalCase
function CharacterCard() {}

// Files: kebab-case
// character-card.tsx, fuzzy-search.ts
```

**Type Annotations**:
```typescript
// Always annotate function parameters
function updateCharacter(id: string, updates: Partial<Character>): void {}

// Explicit return types for public functions
export function createStub(name: string): Character {
  // ...
}

// Type inference OK for simple cases
const count = characters.length; // number inferred
```

**Optional vs. Nullable**:
```typescript
// Use optional (?) for fields that may not exist
interface Character {
  voiceProfile?: VoiceProfile; // May or may not have
}

// Use null for explicitly set to null
interface Character {
  deletedAt: Date | null; // Explicitly null or a date
}
```

---

### React / Next.js

**Component Structure**:
```typescript
// 1. Imports
import { useState } from 'react';
import { useStore } from '@/lib/store';

// 2. Types (if component-specific)
interface CharacterCardProps {
  character: Character;
  onClick?: () => void;
}

// 3. Component
export function CharacterCard({ character, onClick }: CharacterCardProps) {
  // 3a. Hooks
  const [isHovered, setIsHovered] = useState(false);

  // 3b. Event handlers
  const handleClick = () => {
    onClick?.();
  };

  // 3c. Render
  return <div onClick={handleClick}>{character.name}</div>;
}
```

**Hooks Rules**:
```typescript
// Custom hooks: use prefix
function useCharacterSearch(query: string) {}

// Extract complex logic to custom hooks
function useMentionDetection(text: string, cursorPosition: number) {
  const [mentions, setMentions] = useState<EntityMention[]>([]);

  useEffect(() => {
    const detected = detectMentions(text, cursorPosition);
    setMentions(detected);
  }, [text, cursorPosition]);

  return mentions;
}
```

**Server Components vs. Client Components**:
```typescript
// Server Component (default in App Router)
// No 'use client', can use async/await directly
export default async function CharactersPage() {
  const characters = await fetchCharacters();
  return <CharacterList characters={characters} />;
}

// Client Component (needs interactivity)
'use client';
export function CharacterCard() {
  const [selected, setSelected] = useState(false);
  // ...
}
```

---

### Zustand Store

**Action Patterns**:
```typescript
// Idempotent actions (safe to call multiple times)
addToDevelopmentQueue: (entityId, entityType) =>
  set((state) => {
    if (state.developmentQueue.some(item => item.entityId === entityId)) {
      return state; // No change
    }
    return {
      developmentQueue: [...state.developmentQueue, { entityId, entityType }]
    };
  }),

// Immutable updates (never mutate state directly)
updateCharacter: (id, updates) =>
  set((state) => ({
    characters: state.characters.map(char =>
      char.id === id ? { ...char, ...updates, updatedAt: new Date() } : char
    )
  })),

// Use get() for accessing current state within actions
deleteCharacter: (id) =>
  set((state) => {
    const character = get().characters.find(c => c.id === id);
    if (!character) return state;

    return {
      characters: state.characters.filter(c => c.id !== id),
      deletedCharacters: [...state.deletedCharacters, character]
    };
  }),
```

---

### CSS / Tailwind

**Class Ordering**:
```typescript
<div className="
  // Layout
  flex flex-col items-center justify-between
  // Spacing
  p-4 m-2 gap-2
  // Sizing
  w-full h-screen
  // Backgrounds
  bg-slate-900/80
  // Borders
  border border-slate-700 rounded-lg
  // Text
  text-white text-lg font-semibold
  // Effects
  backdrop-blur-md shadow-lg
  // Interactions
  hover:bg-slate-800 cursor-pointer
  // Responsive
  md:w-1/2 lg:w-1/3
" />
```

**Custom Styles**:
```typescript
// Prefer Tailwind utilities
<div className="bg-slate-900/80 backdrop-blur-md" /> // Good

// Use CSS modules for complex/reusable styles
import styles from './character-card.module.css';
<div className={styles.card} /> // OK for complex

// Avoid inline styles
<div style={{ background: 'red' }} /> // Avoid
```

---

## Testing Guidelines

### Test Structure (When Implemented)

```typescript
// tests/fuzzy-search.test.ts
import { fuzzySearchEntities } from '@/lib/fuzzySearch';

describe('fuzzySearchEntities', () => {
  const mockEntities = [
    { id: '1', name: 'Kira Shadowbane', aliases: ['KB'] },
    { id: '2', name: 'Kiran', aliases: [] }
  ];

  describe('exact matches', () => {
    it('should return exact match first', () => {
      const results = fuzzySearchEntities('Kira', mockEntities);
      expect(results[0].entity.name).toBe('Kira Shadowbane');
      expect(results[0].score).toBe(0);
    });
  });

  describe('typo tolerance', () => {
    it('should find entities with 1 letter difference', () => {
      const results = fuzzySearchEntities('Kirn', mockEntities);
      expect(results).toContainEqual(
        expect.objectContaining({ entity: mockEntities[1] })
      );
    });
  });

  describe('alias matching', () => {
    it('should match via aliases', () => {
      const results = fuzzySearchEntities('KB', mockEntities);
      expect(results[0].matchedField).toBe('alias');
      expect(results[0].matchedValue).toBe('KB');
    });
  });
});
```

### Testing Strategy

**Unit Tests**:
- Pure functions (fuzzySearch, migrations)
- Zustand actions (state updates)
- Utilities (ID generation, date formatting)

**Integration Tests**:
- Component interactions (mention popup + fuzzy search)
- API routes (chat endpoint + context injection)

**E2E Tests** (Future):
- User workflows (create character → mention → completion)

---

## Common Tasks

### Task: Create a New Component

```bash
# 1. Create file
touch src/components/[feature]/MyComponent.tsx

# 2. Add component structure
```

```typescript
'use client'; // If needs interactivity

import { useState } from 'react';

interface MyComponentProps {
  // Props
}

export function MyComponent({ }: MyComponentProps) {
  return <div>My Component</div>;
}
```

```bash
# 3. Export from index (if creating a component library)
echo "export * from './MyComponent';" >> src/components/[feature]/index.ts

# 4. Import and use
```

---

### Task: Add a New Zustand Action

```typescript
// 1. Add to StoreState interface
interface StoreState {
  myNewAction: (param: string) => void;
}

// 2. Implement in create()
const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      // ... existing state

      myNewAction: (param) => set((state) => ({
        // State update logic
      })),
    }),
    // ... persist config
  )
);

// 3. Use in component
function MyComponent() {
  const { myNewAction } = useStore();

  const handleClick = () => {
    myNewAction('value');
  };

  return <button onClick={handleClick}>Click</button>;
}
```

---

### Task: Create an ADR

```bash
# 1. Create file
touch ai_context_learning/decisions/ADR-XXX-feature-name.md

# 2. Use template
```

```markdown
# ADR-XXX: Feature Name

**Date:** YYYY-MM-DD
**Status:** Proposed / Accepted / Deprecated
**Decision Makers:** [Agent names]

## Context
[What problem are we solving?]

## Decision
[What did we choose?]

## Rationale
[Why this choice?]

## Consequences
[What becomes easier/harder?]

## Alternatives Considered
[What else did we consider?]

## Related ADRs
[Links to related decisions]
```

---

### Task: Debug a TypeScript Error

```bash
# 1. Run type checker
npx tsc --noEmit

# 2. Check specific file
npx tsc --noEmit src/components/MyComponent.tsx

# 3. Common errors and solutions:

# Error: "Property X does not exist on type Y"
# Solution: Check interface definition, ensure field exists

# Error: "Type 'undefined' is not assignable to type 'X'"
# Solution: Add optional chaining (?) or null check

# Error: "Cannot find module '@/lib/...'"
# Solution: Check tsconfig.json paths, ensure @ alias configured
```

---

### Task: Add a Migration

```typescript
// 1. Create migration file
// lib/migrations/phase2-schema.ts

export function runPhase2Migration() {
  const data = getStoreData();

  // Backup
  const backupKey = backupStoreData(data);

  try {
    // Transform characters
    const migratedCharacters = data.characters.map(char => ({
      ...char,
      newField: char.newField ?? defaultValue
    }));

    // Save
    saveStoreData({ ...data, characters: migratedCharacters });

    return { success: true, migratedCount: migratedCharacters.length };
  } catch (error) {
    // Rollback
    restoreFromBackup(backupKey);
    throw error;
  }
}

// 2. Run migration (in dev console or migration script)
import { runPhase2Migration } from '@/lib/migrations/phase2-schema';
runPhase2Migration();
```

---

## Additional Resources

### Internal Documentation

- **User Guide**: `docs/USER_GUIDE_PHASE1.md`
- **Phase 1 Complete Report**: `Session_Reports/February 2026/2026-01-28_PHASE1_COMPLETE.md`
- **Implementation Plan**: `Session_Reports/Implementation_plans/2026-01-28_Multi-Agent_System_Implementation_Plan.md`
- **ADRs**: `ai_context_learning/decisions/`

### External Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Community

- **GitHub Repository**: [Link]
- **Discord Server**: [Link]
- **Issue Tracker**: GitHub Issues

---

## Getting Help

**For feature requests**: Create a GitHub issue with "Feature Request" label
**For bugs**: Create a GitHub issue with "Bug" label, include reproduction steps
**For questions**: Ask in Discord #dev-questions channel
**For architecture decisions**: Review ADRs in `ai_context_learning/decisions/`

---

## Next Steps After Onboarding

1. ✅ Complete setup and verification
2. ✅ Read this onboarding guide
3. 📖 Read USER_GUIDE_PHASE1.md (user perspective)
4. 📖 Read PHASE1_COMPLETE.md (project context)
5. 🔍 Review 3-5 ADRs in `ai_context_learning/decisions/`
6. 🛠️ Pick a "good first issue" from GitHub
7. 💬 Introduce yourself in Discord
8. 🚀 Start contributing!

---

## Congratulations!

You're now ready to contribute to the 5D Character Creator. Welcome to the team! 🎉

Remember:
- **Document as you code** (ADRs, patterns, learnings)
- **Follow existing patterns** (check ai_context_learning/)
- **Communicate with agents** (notify relevant specialists)
- **Test your changes** (manual testing until test suite exists)
- **Ask questions** (Discord, GitHub Discussions)

Happy coding! 🚀

---

*Developer Onboarding Guide Version 1.0*
*Last Updated: 2026-01-28*
*Maintained by: documentation-keeper agent*
