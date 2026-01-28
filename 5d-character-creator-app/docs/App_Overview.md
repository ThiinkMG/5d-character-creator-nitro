# 5D Character Creator (Nitro)

## Overview
The **5D Character Creator** is a comprehensive brainstorming and world-building tool designed for writers, game masters, and creators. It leverages AI (via OpenAI/Anthropic APIs) to help users generate, flesh out, and organize complex characters, immersive worlds, and structured projects.

## Project Structure
- **Frontend Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS with a custom "glassmorphism" aesthetic
- **State Management**: Zustand with persistent storage
- **Backend/API**: Next.js API Routes for AI integration
- **AI Integration**: Support for OpenAI (GPT-4) and Anthropic (Claude 3.5 Sonnet)

## Key Features

### 1. Dashboard & Organization
- **Projects**: Group characters and worlds into cohesive stories or campaigns.
- **Global Search**: Filter and find entities by name, role, archetype, or tags.
- **Analytics**: Track development progress (0-100%) for each character and world.

### 2. Character Development
- **5D System**: Characters are built across 5 dimensions:
  1. **Foundation**: Core concept, archetype, and role.
  2. **Personality**: Motivations, flaws, and personality matrix.
  3. **Backstory**: Origin story, trauma ("ghost"), and timeline.
  4. **Relationships**: Allies, enemies, and improved relationship webs.
  5. **Arc**: Narrative arc type, climax, and resolution.
- **Interactive Profiles**: Rich profile pages with editable fields and custom sections.
- **AI Generation**: "Magic Wand" tools to generate specific fields or entire profiles.

### 3. World Building
- **Lore Context**: Define genre, tone, magic systems, and technology levels.
- **Entity Linking**: Link characters to specific worlds to maintain consistency.
- **Dynamic Maps**: (Planned/Partial) Placeholder for geography and location tracking.

### 4. AI Chat Studio
- **Context-Aware Chat**: specialized modes for different tasks:
  - `Chat with Character`: immersive roleplay with the character persona.
  - `Workshop`: deep-dive questioning to flesh out specific traits (e.g., "Analyze this character's flaws").
  - `Worldbuilding`: generate lore, history, and societies.
- **Entity Linking**: Link user chat sessions to specific entities (Character/World) to save generated content directly to their profiles using structured JSON blocks.
- **Flow**:
  1. User chats with AI.
  2. AI suggests updates in a `json:save` block.
  3. User reviews and applies changes with a single click.

### 5. Gallery & Visualization
- **Bento Grid Layout**: Responsive, visually rich card layout for browsing entities.
- **Image Generation**: Integrated AI image generation (DALL-E 3 / Gemini) for character avatars and world landscapes.
- **Custom Uploads**: Support for user-uploaded images.

## Workflows

### Creating a New Character
1. Navigate to **Chat** or **Characters** page.
2. Select **"Character Creator"** mode.
3. Chat with the AI to define the basics (Name, Role, Concept).
4. AI generates a `json:save:character` block.
5. Click **Apply** to create the character profile.
6. Visit the **Character Profile** page to refine details manually or use specific AI actions.

### World Building Session
1. Navigate to **Chat**.
2. Select **"World Builder"** mode.
3. Define the genre and tone (e.g., "Dark Fantasy", "Cyberpunk").
4. AI asks probing questions about geography, factions, and history.
5. Save the world configuration.

### Linking Entities in Chat
1. Open a **Chat** session.
2. Use the **Link Entity** dropdown in the header.
3. Select an existing Character or World.
4. All subsequent text generation will contextually reference that entity, and `save` actions will update that specific record.

## Technical Notes
- **State Persistence**: Data is saved to `localStorage` via Zustand persist middleware.
- **API Keys**: Users must provide their own OpenAI/Anthropic API keys in the **Settings** page.
- **File System**: The app uses a virtual file system structure within the global store to manage relationships between Projects, Worlds, and Characters.
