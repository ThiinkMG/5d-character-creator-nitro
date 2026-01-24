# 5D Character Creator — App Screens & Phases Plan

## Overview

This document outlines every screen, user flow, and feature for the V6 prototype. The app is a **premium AI-powered character development assistant** with a dark "Ember Noir" aesthetic.

---

## 🎯 Core User Journeys

| Journey | Description | Key Screens |
| :--- | :--- | :--- |
| **New User** | First-time setup → Create first character | Onboarding → Dashboard → Chat |
| **Returning User** | Resume character work | Dashboard → Character Select → Chat |
| **World Builder** | Create worlds, magic, lore | Dashboard → World Studio → Chat |
| **Power User** | Simulate, analyze, export | Chat → Analysis → Export |

---

## 📱 Screen Inventory

### 1. Onboarding Flow (First Launch Only)

#### 1.1 Welcome Screen
- **Purpose:** Brand introduction, set the tone
- **Elements:**
  - Animated logo (5D emblem with particle effects)
  - Tagline: "Create Characters That Feel Alive"
  - [Get Started] button
- **Transition:** Fade to API Setup

#### 1.2 API Setup Screen
- **Purpose:** Connect AI provider(s)
- **Elements:**
  - Provider cards: Claude, GPT-4 (with logos)
  - API key input fields (masked)
  - [Test Connection] button
  - "Free tier" option (limited generations)
- **Validation:** Test API before proceeding
- **Transition:** Slide to Quick Tour

#### 1.3 Quick Tour (Optional)
- **Purpose:** 3-panel carousel introducing key features
- **Panels:**
  1. "Meet Your AI Partner" — Chat interface preview
  2. "Build Deep Characters" — 5-Phase progress visual
  3. "Create Entire Worlds" — World building teaser
- **Elements:**
  - Skip button (top right)
  - Dot indicators
  - [Start Creating] button on final panel

---

### 2. Main Dashboard

#### 2.1 Dashboard Home
- **Layout:** Sidebar (left) + Main Content (right)
- **Sidebar Elements:**
  - Logo (top)
  - Navigation:
    - 🏠 Home
    - 💬 Chat
    - 👤 Characters
    - 🌍 Worlds
    - 📊 Analysis
    - ⚙️ Settings
  - User avatar + name (bottom)
  - Theme toggle (dark/light)

- **Main Content:**
  - **Quick Actions Row:**
    - [+ New Character] (primary CTA)
    - [+ New World]
    - [Resume: #ELARA_902] (last session)
  - **Recent Activity Feed:**
    - Character cards (last 4 edited)
    - World cards (last 2 edited)
  - **Progress Widget:**
    - Current character's 5-Phase progress
    - Phase indicator with percentage

---

### 3. Chat Interface (Core Experience)

#### 3.1 Chat View
- **Layout:** Full-width chat with collapsible sidebar
- **Header:**
  - Current context badge: `#ELARA_902 → @VIRELITH_501`
  - Mode indicator: `Advanced Mode`
  - [📊 Dashboard] toggle button

- **Message Area:**
  - User messages (right-aligned, subtle glass effect)
  - AI messages (left-aligned, full width, rich formatting)
  - Streaming text with typing indicator
  - Embedded cards for:
    - Character bio snippets
    - World lore reveals
    - Analysis reports
    - Progress updates

- **Input Area:**
  - Multi-line text input
  - Command palette trigger (/)
  - Attachment button (optional image upload)
  - Send button with loading state
  - Voice input button (future)

#### 3.2 Command Palette Modal
- **Trigger:** Type `/` in input
- **Layout:** Floating modal over chat
- **Sections:**
  - **Recent Commands** (top 3)
  - **General:** /generate, /resume, /save, /progress
  - **Advanced:** /simulate, /analyze, /dialogue, /voice
  - **World:** /worldbio, /magic, /lore
  - **Help:** /help, /tutorial, /glossary
- **Search:** Fuzzy search with `/findcommand`
- **Keyboard:** Arrow keys + Enter to select

#### 3.3 Progress Dashboard Panel
- **Trigger:** Click 📊 in header or `/progress`
- **Layout:** Slide-in panel from right
- **Elements:**
  - Character name + CID
  - 5-Phase visual tracker (progress bar segments)
  - Current phase highlight with description
  - Checklist of completed items
  - [Continue] button

---

### 4. Character System

#### 4.1 Characters List View
- **Layout:** Grid of character cards (3 columns)
- **Each Card Contains:**
  - Character portrait (AI-generated or placeholder)
  - Name + Role
  - CID badge
  - Progress ring (% complete)
  - World link (@WID)
  - Last edited timestamp
- **Actions:**
  - Click → Open Character Bio
  - Hover → Quick actions (Edit, Delete, Duplicate)
- **Filters:**
  - By World (@WID)
  - By Story Project ($SID)
  - By progress (Complete, In Progress, New)

#### 4.2 Character Bio View (Full Page)
- **Layout:** Two-column (portrait left, content right)
- **Left Column:**
  - Large character portrait
  - Name (large heading)
  - Role / Archetype
  - CID + WID badges
  - [Edit Portrait] button
- **Right Column (Tabbed):**
  - **Identity Tab:** Name, Age, Ethnicity, Setting
  - **Psychology Tab:** Shadow, Ghost, Need, Want, Mindset
  - **Voice Tab:** Tone, Rhythm, Catchphrases, Quirks
  - **Relationships Tab:** Allies, Enemies, Love Interests
  - **Arc Tab:** Start → Midpoint → End
  - **Abilities Tab:** Powers, Skills
  - **Lifestyle Tab:** Food, Home, Habits
- **Actions:**
  - [Continue in Chat]
  - [Export Bio]
  - [Analyze Character]

#### 4.3 Character Creation Flow
- **Step 1:** Choose Mode
  - Basic (5-7 questions) vs Advanced (5 Phases)
- **Step 2:** Enter basic info (Name, Genre, Role)
  - CID auto-generated
- **Step 3:** Redirect to Chat for AI-guided development

---

### 5. World Building System

#### 5.1 Worlds List View
- **Layout:** Grid of world cards (2 columns, larger cards)
- **Each Card Contains:**
  - World banner image
  - World name
  - Type (Fantasy, Sci-Fi, etc.)
  - WID badge
  - Character count linked
  - Magic system indicator

#### 5.2 World Bio View
- **Layout:** Full-width hero + content sections
- **Hero Section:**
  - Banner image (full width)
  - World name overlay
  - Type + WID
- **Content Sections (Accordion):**
  - **Overview:** Core conflict, geography
  - **Factions:** List with descriptions
  - **Magic/Tech System:** Rules, classes, costs
  - **Lore & Mythology:** Myths, entities, rituals
  - **Linked Characters:** Cards of characters in this world
- **Actions:**
  - [Continue in Chat]
  - [Export World]
  - [+ New Character in World]

---

### 6. Analysis & Simulation

#### 6.1 Analysis Report View
- **Trigger:** `/analyze [#CID]` in chat
- **Layout:** Modal or dedicated page
- **Sections:**
  - **Strengths:** What's working (green cards)
  - **Weaknesses:** What needs work (amber cards)
  - **Suggestions:** Actionable improvements
  - **Methodology:** Which books were consulted
- **Actions:**
  - [Accept Suggestion] → Auto-apply
  - [Skip] → Dismiss
  - [Revise All] → Batch apply

#### 6.2 Simulation View
- **Trigger:** `/simulate [scenario]`
- **Layout:** Split screen (scenario left, outcomes right)
- **Left Panel:**
  - Scenario description
  - Characters involved
  - Tension/conflict type
- **Right Panel:**
  - AI-generated scene text
  - Multiple outcome paths (A, B, C)
  - [Play Path A] / [Play Path B] buttons
- **Output:** "Moment Log" saved to character history

---

### 7. Export System

#### 7.1 Export Modal
- **Trigger:** `/export` or [Export] button
- **Options:**
  - **Format:** Notion, Markdown, PDF
  - **Scope:** Current Character, Current World, Entire Project ($SID)
  - **Include:** Character bio, World data, Linked lore
- **Preview:** Live preview of export format
- **Actions:**
  - [Download] → Local file
  - [Copy to Clipboard] → Markdown
  - [Push to Notion] → API integration (future)

---

### 8. Settings

#### 8.1 Settings View
- **Sections:**
  - **API Keys:** Manage Claude/GPT keys
  - **Theme:** Dark (default), Light, System
  - **Default Mode:** Basic vs Advanced
  - **AI Behavior:** Verbosity, creativity slider
  - **Data:** Export all, Delete all
  - **About:** Version, credits, docs link

---

## 🚀 Development Phases

### Phase 1: Foundation (Week 1)
- [ ] Project setup (Next.js, Tailwind, Shadcn)
- [ ] Ember Noir theme CSS variables
- [ ] Sidebar + Header layout
- [ ] Basic routing (/, /chat, /characters, /worlds, /settings)
- [ ] GlassPanel component

### Phase 2: Chat Core (Week 2)
- [ ] Chat interface layout
- [ ] Message bubbles (user/AI)
- [ ] Command palette modal
- [ ] AI SDK integration (Claude + GPT-4)
- [ ] Streaming responses

### Phase 3: Character System (Week 3)
- [ ] Characters list view
- [ ] Character card component
- [ ] Character bio view (tabbed)
- [ ] CID generation logic
- [ ] Progress dashboard panel

### Phase 4: World Building (Week 4)
- [ ] Worlds list view
- [ ] World card component
- [ ] World bio view (accordion)
- [ ] WID generation + linking
- [ ] /tie command implementation

### Phase 5: Analysis & Export (Week 5)
- [ ] Analysis report component
- [ ] Simulation view
- [ ] Export modal (MD, PDF)
- [ ] Settings page

### Phase 6: Polish & Launch (Week 6)
- [ ] Onboarding flow
- [ ] Animations (Framer Motion)
- [ ] Mobile responsiveness
- [ ] Error handling + loading states
- [ ] Deploy to Vercel

---

## 🎨 Visual Priorities

| Priority | Element | Notes |
| :---: | :--- | :--- |
| ⭐⭐⭐ | Chat interface | Core experience, must feel premium |
| ⭐⭐⭐ | Character cards | First impression, needs "wow" |
| ⭐⭐ | Command palette | Power users rely on this |
| ⭐⭐ | Progress dashboard | Gamification element |
| ⭐ | Export modal | Functional > pretty |
| ⭐ | Settings | Standard layout OK |

---

## User Review Required

> [!IMPORTANT]
> Please review this plan and confirm:
> 1. Are there any screens missing?
> 2. Any features you want to deprioritize or cut?
> 3. Ready to proceed to Phase 1 (Foundation)?
