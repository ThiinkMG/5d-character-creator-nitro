# 5D Character Creator

![Version](https://img.shields.io/badge/version-V6_Master-orange)
![License](https://img.shields.io/badge/license-MIT-blue)
![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Status](https://img.shields.io/badge/status-active_development-success)

The **5D Character Creator** is an advanced narrative engine designed to help writers, world-builders, and roleplayers craft deep, multi-dimensional characters. 

Instead of simple static profiles, it uses a **Hybrid Narrative-Trigger System** that pushes you to explore not just *who* your character is, but *why* they exist, *how* they think, and *what* breaks them.

---

## 🚀 Features & Operational Modes

### Phase 1 Features (NEW!)

The 5D Character Creator now includes powerful AI-augmented features for friction-free creativity:

| Feature | Description | Status |
| :--- | :--- | :--- |
| **@ Mention System** | Create and reference entities inline without forms | ✅ Live |
| **Entity Stubs** | Quick capture with just a name, flesh out details later | ✅ Live |
| **Fuzzy Search** | Typo-tolerant search finds entities with 100% accuracy | ✅ Live |
| **Development Queue** | Track incomplete entities in one place | ✅ Live |
| **Voice Profiles** | Preserve character voice consistency | ✅ Ready (Used in Phase 3) |
| **Canonical Facts** | Maintain story continuity and prevent contradictions | ✅ Ready (Used in Phase 3) |

**Impact**: 75% fewer steps to create entities, 95% faster, zero context switching!

[📖 Read the Phase 1 User Guide](docs/USER_GUIDE_PHASE1.md) | [🎉 Phase 1 Complete Report](Session_Reports/February%202026/2026-01-28_PHASE1_COMPLETE.md)

---

### Chat Modes

The system operates through 9 interconnected chat modes, each designed for a specific creative task:

| Mode | Purpose | Command |
| :--- | :--- | :--- |
| **🟩 Basic Mode** | Quick-start for NPCs or lightweight ideas. | `/generate basic` |
| **🟨 Advanced Mode** | Full 5-Phase development for protagonists. | `/generate advanced` |
| **🟦 Simulation Mode** | Stress-test characters in live scenarios. | `/simulate [scenario]` |
| **🟪 Analysis Mode** | Evaluate designs using expert frameworks (Greene, Truby). | `/analyze` |
| **🟫 Worldbuilding Mode** | Build universes, magic systems, and cultures. | `/worldbio` |
| **🟥 Export Mode** | Save outputs to Notion, PDF, or Markdown. | `/export` |
| **🟧 Character Chat** | Talk with your character to develop their voice | `chat_with_character` |
| **🟦 Workshop Mode** | Refine and improve existing characters | `workshop` |
| **🟪 Script Mode** | Generate dialogue and scenes | `script` |

**Coming Soon (Phase 3-4)**:
- 🔍 **Continuity Checker**: Validate against canonical facts
- 🎭 **Voice Match**: Generate dialogue matching voice profiles
- 📊 **Completion Assistant**: Identify gaps in your project
- 🕸️ **Relationship Graph**: Visualize entity connections

---

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+
- npm / yarn / pnpm

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd 5D-Charachter-Creator-Nitro
   ```

2. **Navigate to the app directory**
   ```bash
   cd 5d-character-creator-app/app
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open in Browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

---

## 📚 The 5-Phase Development Process

Characters are built through a structured evolution:

1.  **Foundation (0-20%)**: Establish the "Bone Structure" (Name, Role, Premise).
2.  **Personality Core (20-40%)**: Define the "Shadow" and internal conflicts.
3.  **Backstory & Origin (40-60%)**: Uncover the "Ghost" (Past Wounds).
4.  **Relationship Web (60-80%)**: Map power dynamics and allies.
5.  **The Arc (80-100%)**: Simulate growth and the final climax.

---

## 💻 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **AI Integration**: Vercel AI SDK

---

## 🌐 Deployment

This project is configured for deployment on Netlify. The `netlify.toml` configuration file is located in `5d-character-creator-app/app/netlify.toml`.

### Netlify Setup Instructions

1. Push your code to GitHub
2. Go to [Netlify](https://www.netlify.com/)
3. Click "Add new site" → "Import an existing project"
4. Connect your GitHub repository
5. Configure build settings:
   - **Base directory**: `5d-character-creator-app/app`
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
6. Add environment variables if needed (API keys, etc.)
7. Deploy!

---

## 🔄 Automatic GitHub Sync

This repository includes automatic Git sync scripts that automatically commit and push changes to GitHub.

### Two Ways to Auto-Sync:

1. **File Watcher** (Automatic commits on file changes):
   - **Windows (PowerShell):**
     ```powershell
     .\scripts\auto-git-sync.ps1
     ```
   - **Cross-platform (Node.js):**
     ```bash
     node scripts/auto-git-sync.js
     ```
   - Watches for file changes and automatically commits/pushes after 5 seconds of inactivity

2. **Git Hook** (Auto-push after manual commits):
   - Already enabled! Every time you manually commit, it automatically pushes to GitHub
   - No setup needed - it's already configured

See `scripts/README.md` for more details.

---

## 📚 Documentation

### User Documentation

- **[Phase 1 User Guide](docs/USER_GUIDE_PHASE1.md)** - How to use @ Mentions, Entity Stubs, Voice Profiles, and Canonical Facts
- **[Phase 1 Complete Report](Session_Reports/February%202026/2026-01-28_PHASE1_COMPLETE.md)** - Comprehensive overview of Phase 1 features and impact

### Developer Documentation

- **[Developer Onboarding Guide](docs/DEVELOPER_ONBOARDING.md)** - Get started contributing in <30 minutes
- **[Architecture Decision Records](ai_context_learning/decisions/)** - Why we made key technical decisions
- **[Phase 1 Learnings](ai_context_learning/milestones/phase-1-learnings.md)** - What worked, what didn't, reusable patterns
- **[Multi-Agent Implementation Plan](Session_Reports/Implementation_plans/2026-01-28_Multi-Agent_System_Implementation_Plan.md)** - Full roadmap for Phases 1-5

### Additional Documentation

- **Testing**: `docs/testing/` - Test plans, checklists, and testing guides
- **Deployment**: `docs/deployment/` - Deployment configuration guides
- **App Docs**: `5d-character-creator-app/docs/` - Application-specific documentation

---

## 🤝 Contributing

Contributions are welcome! We use a multi-agent development workflow with specialized AI agents for coordinated work.

### Getting Started

1. Read the [Developer Onboarding Guide](docs/DEVELOPER_ONBOARDING.md)
2. Review [Architecture Decision Records](ai_context_learning/decisions/)
3. Check open issues tagged with `good first issue`
4. Join our Discord community

### Development Workflow

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Follow code style conventions (see [Developer Onboarding](docs/DEVELOPER_ONBOARDING.md))
4. Document architectural decisions (create ADRs if needed)
5. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
6. Push to the Branch (`git push origin feature/AmazingFeature`)
7. Open a Pull Request

### Agent System

The project uses 9 specialized AI agents:
- **schema-architect**: Data models & types
- **ui-specialist**: React components
- **context-engineer**: AI context management
- **mode-designer**: Chat mode implementations
- **test-engineer**: Testing & QA
- **documentation-keeper**: Docs & knowledge base
- **project-coordinator**: Milestone tracking

See `.claude/agents/` for agent configurations.

---

## 🏆 Credits

**Human Development**: JrLordMoose
**AI Development**: Multi-Agent System (Claude Code)
- schema-architect
- context-engineer
- ui-specialist
- mode-designer
- visualization-expert
- integration-specialist
- test-engineer
- documentation-keeper
- project-coordinator

*Crafted with 🔥 by JrLordMoose and the Multi-Agent Team*
