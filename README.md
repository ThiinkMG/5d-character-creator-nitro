# 5D Character Creator

![Version](https://img.shields.io/badge/version-V6_Master-orange)
![License](https://img.shields.io/badge/license-MIT-blue)
![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Status](https://img.shields.io/badge/status-active_development-success)

The **5D Character Creator** is an advanced narrative engine designed to help writers, world-builders, and roleplayers craft deep, multi-dimensional characters. 

Instead of simple static profiles, it uses a **Hybrid Narrative-Trigger System** that pushes you to explore not just *who* your character is, but *why* they exist, *how* they think, and *what* breaks them.

---

## 🚀 Features & Operational Modes

The system operates through 6 interconnected modes, each designed for a specific stage of creation.

| Mode | Purpose | Command |
| :--- | :--- | :--- |
| **🟩 Basic Mode** | Quick-start for NPCs or lightweight ideas. | `/generate basic` |
| **🟨 Advanced Mode** | Full 5-Phase development for protagonists. | `/generate advanced` |
| **🟦 Simulation Mode** | Stress-test characters in live scenarios. | `/simulate [scenario]` |
| **🟪 Analysis Mode** | Evaluate designs using expert frameworks (Greene, Truby). | `/analyze` |
| **🟫 Worldbuilding Mode** | Build universes, magic systems, and cultures. | `/worldbio` |
| **🟥 Export Mode** | Save outputs to Notion, PDF, or Markdown. | `/export` |

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

Project documentation is organized in the `docs/` folder:

- **Testing**: `docs/testing/` - Test plans, checklists, and testing guides
- **Deployment**: `docs/deployment/` - Deployment configuration guides
- **Development**: `docs/development/` - Development guides and technical docs
- **App Docs**: `5d-character-creator-app/docs/` - Application-specific documentation

See `docs/README.md` for a complete overview.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

*Crafted with 🔥 by JrLordMoose*
