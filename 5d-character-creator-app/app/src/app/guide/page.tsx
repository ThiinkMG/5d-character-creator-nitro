'use client';

import { useState, useMemo, useEffect } from 'react';
import { 
    BookOpen, 
    Sparkles, 
    MessageSquare, 
    User, 
    Globe, 
    Folder, 
    Command, 
    FileText,
    Wand2,
    Settings,
    BarChart3,
    Image as ImageIcon,
    Link2,
    Search,
    HelpCircle,
    PlayCircle,
    ChevronRight,
    ChevronDown,
    Lightbulb,
    Zap,
    Layers,
    Eye,
    ChevronsUpDown,
    X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface GuideSection {
    id: string;
    title: string;
    icon: React.ReactNode;
    content: React.ReactNode;
}

// Define sections outside component to avoid dependency issues
const createSections = (): GuideSection[] => [
        {
            id: 'getting-started',
            title: 'Getting Started',
            icon: <PlayCircle className="h-5 w-5" />,
            content: (
                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold mb-3">Welcome to 5D Character Creator</h3>
                        <p className="text-muted-foreground mb-4">
                            5D Character Creator is an AI-powered tool for building deep, psychologically rich characters, 
                            worlds, and story projects. This guide will help you master all the features and workflows.
                        </p>
                    </div>

                    <div className="glass-card rounded-xl p-5">
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <Zap className="h-4 w-4 text-primary" />
                            Quick Start Tutorial
                        </h4>
                        <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                            <li>Go to <Link href="/chat" className="text-primary hover:underline">Chat</Link> to start creating</li>
                            <li>Type <code className="px-1.5 py-0.5 rounded bg-primary/10 text-primary">/generate basic</code> for a quick character</li>
                            <li>Or use <code className="px-1.5 py-0.5 rounded bg-primary/10 text-primary">/generate advanced</code> for full development</li>
                            <li>Save your work using the <code className="px-1.5 py-0.5 rounded bg-primary/10 text-primary">/save</code> command</li>
                            <li>View your characters in the <Link href="/characters" className="text-primary hover:underline">Characters</Link> page</li>
                        </ol>
                    </div>

                    <div className="glass-card rounded-xl p-5">
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <Settings className="h-4 w-4 text-primary" />
                            First-Time Setup
                        </h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li className="flex items-start gap-2">
                                <ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                <span>Configure your API keys in <Link href="/settings" className="text-primary hover:underline">Settings</Link></span>
                            </li>
                            <li className="flex items-start gap-2">
                                <ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                <span>Choose between Anthropic Claude or OpenAI GPT-4</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                <span>Set up image generation API keys if you want AI-generated images</span>
                            </li>
                        </ul>
                    </div>
                </div>
            )
        },
        {
            id: 'features',
            title: 'Features Overview',
            icon: <Sparkles className="h-5 w-5" />,
            content: (
                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Core Features</h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="glass-card rounded-xl p-5">
                                <div className="flex items-center gap-3 mb-3">
                                    <User className="h-5 w-5 text-primary" />
                                    <h4 className="font-semibold">Character Creation</h4>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Build complex characters with 5-phase development, psychological depth, 
                                    relationships, and detailed backstories.
                                </p>
                            </div>

                            <div className="glass-card rounded-xl p-5">
                                <div className="flex items-center gap-3 mb-3">
                                    <Globe className="h-5 w-5 text-primary" />
                                    <h4 className="font-semibold">World Building</h4>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Create rich worlds with magic systems, cultures, locations, 
                                    and interconnected lore.
                                </p>
                            </div>

                            <div className="glass-card rounded-xl p-5">
                                <div className="flex items-center gap-3 mb-3">
                                    <Folder className="h-5 w-5 text-primary" />
                                    <h4 className="font-semibold">Story Projects</h4>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Organize characters and worlds into cohesive story projects 
                                    with narrative sessions and documents.
                                </p>
                            </div>

                            <div className="glass-card rounded-xl p-5">
                                <div className="flex items-center gap-3 mb-3">
                                    <MessageSquare className="h-5 w-5 text-primary" />
                                    <h4 className="font-semibold">AI Chat Interface</h4>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Interactive chat with multiple modes, commands, and 
                                    context-aware AI assistance.
                                </p>
                            </div>

                            <div className="glass-card rounded-xl p-5">
                                <div className="flex items-center gap-3 mb-3">
                                    <ImageIcon className="h-5 w-5 text-primary" />
                                    <h4 className="font-semibold">Image Generation</h4>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Generate character and world images using AI (Gemini, DALL-E, 
                                    or free Pollinations).
                                </p>
                            </div>

                            <div className="glass-card rounded-xl p-5">
                                <div className="flex items-center gap-3 mb-3">
                                    <BarChart3 className="h-5 w-5 text-primary" />
                                    <h4 className="font-semibold">Analysis Dashboard</h4>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    View statistics, progress tracking, and distribution 
                                    analysis of your creations.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'chat-modes',
            title: 'Chat Modes Explained',
            icon: <MessageSquare className="h-5 w-5" />,
            content: (
                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Understanding Chat Modes</h3>
                        <p className="text-muted-foreground mb-6">
                            The chat interface has different modes that change how the AI interacts with you. 
                            Each mode is optimized for specific tasks and workflows.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="glass-card rounded-xl p-5">
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-primary" />
                                Character Mode
                            </h4>
                            <p className="text-sm text-muted-foreground mb-3">
                                Focused on character development. The AI helps you build detailed character profiles, 
                                explore psychology, develop relationships, and refine character arcs.
                            </p>
                            <div className="text-xs text-muted-foreground bg-white/5 rounded-lg p-3">
                                <strong className="text-foreground">Best for:</strong> Creating new characters, 
                                expanding character details, character analysis
                            </div>
                        </div>

                        <div className="glass-card rounded-xl p-5">
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                                <Globe className="h-4 w-4 text-primary" />
                                World Mode
                            </h4>
                            <p className="text-sm text-muted-foreground mb-3">
                                Specialized for world-building. Helps create settings, magic systems, cultures, 
                                locations, and world history.
                            </p>
                            <div className="text-xs text-muted-foreground bg-white/5 rounded-lg p-3">
                                <strong className="text-foreground">Best for:</strong> Building worlds, 
                                creating lore, developing settings
                            </div>
                        </div>

                        <div className="glass-card rounded-xl p-5">
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                                <Folder className="h-4 w-4 text-primary" />
                                Project Mode
                            </h4>
                            <p className="text-sm text-muted-foreground mb-3">
                                Designed for story project management. Helps organize characters and worlds 
                                into cohesive narratives, create story documents, and manage project structure.
                            </p>
                            <div className="text-xs text-muted-foreground bg-white/5 rounded-lg p-3">
                                <strong className="text-foreground">Best for:</strong> Story development, 
                                project organization, narrative sessions
                            </div>
                        </div>

                        <div className="glass-card rounded-xl p-5">
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                                <User className="h-4 w-4 text-primary" />
                                Roleplay Mode
                            </h4>
                            <p className="text-sm text-muted-foreground mb-3">
                                Interactive roleplay with your characters. Have conversations, test dialogue, 
                                and explore character voice and personality.
                            </p>
                            <div className="text-xs text-muted-foreground bg-white/5 rounded-lg p-3">
                                <strong className="text-foreground">Best for:</strong> Character interaction, 
                                dialogue testing, voice development
                            </div>
                        </div>
                    </div>

                    <div className="glass-card rounded-xl p-5 border-primary/20">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <Lightbulb className="h-4 w-4 text-primary" />
                            Switching Modes
                        </h4>
                        <p className="text-sm text-muted-foreground">
                            Use the mode switcher in the chat header to change modes. You can also link entities 
                            (characters, worlds, projects) to provide context to the AI regardless of the current mode.
                        </p>
                    </div>
                </div>
            )
        },
        {
            id: 'commands',
            title: 'Commands Reference',
            icon: <Command className="h-5 w-5" />,
            content: (
                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Command System</h3>
                        <p className="text-muted-foreground mb-6">
                            Commands are shortcuts that trigger specific actions or workflows. 
                            Type <code className="px-1.5 py-0.5 rounded bg-primary/10 text-primary">/</code> in the chat to see available commands.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <h4 className="font-semibold mb-3 text-primary">Character Commands</h4>
                            <div className="space-y-2">
                                <div className="glass-card rounded-xl p-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <code className="text-primary font-mono">/generate basic</code>
                                        <span className="text-xs text-muted-foreground">Quick Start</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Creates a character with 5-7 essential questions. Perfect for quick character concepts.
                                    </p>
                                </div>

                                <div className="glass-card rounded-xl p-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <code className="text-primary font-mono">/generate advanced</code>
                                        <span className="text-xs text-muted-foreground">Full Development</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Full 5-phase character development with comprehensive psychological profiling.
                                    </p>
                                </div>

                                <div className="glass-card rounded-xl p-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <code className="text-primary font-mono">/workshop [section]</code>
                                        <span className="text-xs text-muted-foreground">Deep Dive</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Deep-dive into a specific character section (e.g., <code className="text-xs">/workshop backstory</code>).
                                    </p>
                                </div>

                                <div className="glass-card rounded-xl p-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <code className="text-primary font-mono">/expand [field]</code>
                                        <span className="text-xs text-muted-foreground">Enhancement</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Expand a specific field with more details and depth.
                                    </p>
                                </div>

                                <div className="glass-card rounded-xl p-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <code className="text-primary font-mono">/revise [field]</code>
                                        <span className="text-xs text-muted-foreground">Improvement</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Revise and improve existing character content.
                                    </p>
                                </div>

                                <div className="glass-card rounded-xl p-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <code className="text-primary font-mono">/analyze [#CID]</code>
                                        <span className="text-xs text-muted-foreground">Analysis</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Expert framework analysis of a character (use character ID).
                                    </p>
                                </div>

                                <div className="glass-card rounded-xl p-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <code className="text-primary font-mono">/simulate [scenario]</code>
                                        <span className="text-xs text-muted-foreground">Testing</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Stress-test a character in specific scenarios to see how they react.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold mb-3 text-primary">World Commands</h4>
                            <div className="space-y-2">
                                <div className="glass-card rounded-xl p-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <code className="text-primary font-mono">/worldbio</code>
                                        <span className="text-xs text-muted-foreground">World Creation</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Create a new world setting with geography, culture, and history.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold mb-3 text-primary">General Commands</h4>
                            <div className="space-y-2">
                                <div className="glass-card rounded-xl p-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <code className="text-primary font-mono">/menu</code>
                                        <span className="text-xs text-muted-foreground">Navigation</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Opens the command menu to see all available commands.
                                    </p>
                                </div>

                                <div className="glass-card rounded-xl p-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <code className="text-primary font-mono">/help [command]</code>
                                        <span className="text-xs text-muted-foreground">Help</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Get detailed help for any command (e.g., <code className="text-xs">/help generate</code>).
                                    </p>
                                </div>

                                <div className="glass-card rounded-xl p-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <code className="text-primary font-mono">/save</code>
                                        <span className="text-xs text-muted-foreground">Save</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Save your current work. The system will show you the saved item's ID.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'detail-pages',
            title: 'Detail Page Views',
            icon: <Eye className="h-5 w-5" />,
            content: (
                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Understanding Detail Pages</h3>
                        <p className="text-muted-foreground mb-6">
                            Each character, world, and project has a dedicated detail page with comprehensive 
                            information and editing capabilities.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="glass-card rounded-xl p-5">
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                                <User className="h-4 w-4 text-primary" />
                                Character Detail Page
                            </h4>
                            <div className="space-y-3 text-sm text-muted-foreground">
                                <div>
                                    <strong className="text-foreground">Header Section:</strong> Character image, 
                                    name, archetype, role, and quick stats. Click the image to generate or upload a new one.
                                </div>
                                <div>
                                    <strong className="text-foreground">Overview Tab:</strong> Basic information, 
                                    description, personality traits, and key details.
                                </div>
                                <div>
                                    <strong className="text-foreground">Documents Tab:</strong> All documents 
                                    associated with this character. Upload files or generate new documents.
                                </div>
                                <div>
                                    <strong className="text-foreground">Relationships Tab:</strong> Connections 
                                    to other characters, worlds, and projects.
                                </div>
                                <div>
                                    <strong className="text-foreground">AI Actions:</strong> Use AI to generate, 
                                    expand, or revise any section of the character.
                                </div>
                            </div>
                        </div>

                        <div className="glass-card rounded-xl p-5">
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                                <Globe className="h-4 w-4 text-primary" />
                                World Detail Page
                            </h4>
                            <div className="space-y-3 text-sm text-muted-foreground">
                                <div>
                                    <strong className="text-foreground">Header Section:</strong> World image, 
                                    name, genre, and overview. Similar image management as characters.
                                </div>
                                <div>
                                    <strong className="text-foreground">Overview Tab:</strong> World description, 
                                    geography, culture, magic systems, and key locations.
                                </div>
                                <div>
                                    <strong className="text-foreground">Documents Tab:</strong> World-related 
                                    documents and lore files.
                                </div>
                                <div>
                                    <strong className="text-foreground">Relationships Tab:</strong> Characters 
                                    and projects connected to this world.
                                </div>
                            </div>
                        </div>

                        <div className="glass-card rounded-xl p-5">
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                                <Folder className="h-4 w-4 text-primary" />
                                Project Detail Page
                            </h4>
                            <div className="space-y-3 text-sm text-muted-foreground">
                                <div>
                                    <strong className="text-foreground">Header Section:</strong> Project name, 
                                    type, and linked characters/worlds.
                                </div>
                                <div>
                                    <strong className="text-foreground">Overview Tab:</strong> Project description, 
                                    synopsis, and key information.
                                </div>
                                <div>
                                    <strong className="text-foreground">Documents Tab:</strong> Story documents 
                                    like treatments, pitches, synopses, and story bibles.
                                </div>
                                <div>
                                    <strong className="text-foreground">Narrative Sessions Tab:</strong> Chat 
                                    sessions specifically for this project with project context.
                                </div>
                                <div>
                                    <strong className="text-foreground">Linked Entities:</strong> View and manage 
                                    all characters and worlds linked to this project.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'ai-guides',
            title: 'AI Guides & Tips',
            icon: <Wand2 className="h-5 w-5" />,
            content: (
                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Getting the Most from AI</h3>
                        <p className="text-muted-foreground mb-6">
                            Learn how to effectively use AI features to enhance your creative workflow.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="glass-card rounded-xl p-5">
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                                <Link2 className="h-4 w-4 text-primary" />
                                Entity Linking
                            </h4>
                            <p className="text-sm text-muted-foreground mb-3">
                                Link characters, worlds, or projects to provide context to the AI. This helps 
                                the AI understand relationships and generate more coherent content.
                            </p>
                            <div className="text-xs text-muted-foreground bg-white/5 rounded-lg p-3">
                                <strong className="text-foreground">Tip:</strong> Use <code className="px-1 py-0.5 rounded bg-primary/10 text-primary">@</code> in chat 
                                to mention entities. The AI will automatically use their information as context.
                            </div>
                        </div>

                        <div className="glass-card rounded-xl p-5">
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                                <Search className="h-4 w-4 text-primary" />
                                Mention System
                            </h4>
                            <p className="text-sm text-muted-foreground mb-3">
                                Type <code className="px-1.5 py-0.5 rounded bg-primary/10 text-primary">@</code> followed by 
                                a name to mention characters, worlds, or projects. The AI will pull their information 
                                into the conversation context.
                            </p>
                            <div className="text-xs text-muted-foreground bg-white/5 rounded-lg p-3">
                                <strong className="text-foreground">Example:</strong> "How would @CharacterName react to betrayal?" 
                                - The AI uses that character's personality and backstory.
                            </div>
                        </div>

                        <div className="glass-card rounded-xl p-5">
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                                <Layers className="h-4 w-4 text-primary" />
                                Context Management
                            </h4>
                            <p className="text-sm text-muted-foreground mb-3">
                                The AI automatically manages context from linked entities, previous messages, 
                                and current mode. Be specific in your requests for best results.
                            </p>
                            <ul className="text-xs text-muted-foreground space-y-1 mt-3">
                                <li className="flex items-start gap-2">
                                    <ChevronRight className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                                    <span>Link entities before asking complex questions</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <ChevronRight className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                                    <span>Use specific commands for focused tasks</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <ChevronRight className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                                    <span>Reference previous messages for continuity</span>
                                </li>
                            </ul>
                        </div>

                        <div className="glass-card rounded-xl p-5">
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                                <ImageIcon className="h-4 w-4 text-primary" />
                                AI Image Generation
                            </h4>
                            <p className="text-sm text-muted-foreground mb-3">
                                Generate character and world images using AI. Configure API keys in Settings 
                                for Gemini or DALL-E, or use the free Pollinations option.
                            </p>
                            <div className="text-xs text-muted-foreground bg-white/5 rounded-lg p-3">
                                <strong className="text-foreground">How to:</strong> Click on any character/world image 
                                → Choose "Generate" → Describe the image you want → Select provider → Generate
                            </div>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'how-tos',
            title: 'How-To Guides',
            icon: <HelpCircle className="h-5 w-5" />,
            content: (
                <div className="space-y-6">
                    <div className="space-y-4">
                        <div className="glass-card rounded-xl p-5">
                            <h4 className="font-semibold mb-3">How to Create Your First Character</h4>
                            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                                <li>Go to <Link href="/chat" className="text-primary hover:underline">Chat</Link></li>
                                <li>Type <code className="px-1.5 py-0.5 rounded bg-primary/10 text-primary">/generate basic</code></li>
                                <li>Answer the 5-7 questions the AI asks</li>
                                <li>Review the generated character</li>
                                <li>Use <code className="px-1.5 py-0.5 rounded bg-primary/10 text-primary">/save</code> to save</li>
                                <li>Find your character in the <Link href="/characters" className="text-primary hover:underline">Characters</Link> page</li>
                            </ol>
                        </div>

                        <div className="glass-card rounded-xl p-5">
                            <h4 className="font-semibold mb-3">How to Link Characters to Projects</h4>
                            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                                <li>Open a project detail page</li>
                                <li>Go to the "Linked Entities" section</li>
                                <li>Click "Link Character" or "Link World"</li>
                                <li>Select from your existing characters/worlds</li>
                                <li>Linked entities appear in project context automatically</li>
                            </ol>
                        </div>

                        <div className="glass-card rounded-xl p-5">
                            <h4 className="font-semibold mb-3">How to Upload Documents</h4>
                            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                                <li>Navigate to a character, world, or project detail page</li>
                                <li>Click the "Documents" tab</li>
                                <li>Click "Upload Document"</li>
                                <li>Select a file (PDF, Markdown, Text, or JSON)</li>
                                <li>The document will be parsed and added to the entity</li>
                                <li>Documents can be viewed, edited, or deleted</li>
                            </ol>
                        </div>

                        <div className="glass-card rounded-xl p-5">
                            <h4 className="font-semibold mb-3">How to Use Roleplay Mode</h4>
                            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                                <li>Go to <Link href="/chat" className="text-primary hover:underline">Chat</Link></li>
                                <li>Switch to "Roleplay" mode using the mode switcher</li>
                                <li>Link a character using the entity linker</li>
                                <li>Start chatting - the AI will respond as that character</li>
                                <li>Test dialogue, explore personality, and develop voice</li>
                            </ol>
                        </div>

                        <div className="glass-card rounded-xl p-5">
                            <h4 className="font-semibold mb-3">How to Generate Story Documents</h4>
                            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                                <li>Open a project detail page</li>
                                <li>Go to the "Documents" tab</li>
                                <li>Click "Generate Document"</li>
                                <li>Choose document type (Treatment, Pitch, Synopsis, etc.)</li>
                                <li>Provide context and requirements</li>
                                <li>The AI generates the document using project context</li>
                            </ol>
                        </div>
                    </div>
                </div>
            )
        }
];

export default function GuidePage() {
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['getting-started']));
    const [searchQuery, setSearchQuery] = useState('');
    
    // Create sections array
    const sections = useMemo(() => createSections(), []);

    const toggleSection = (id: string) => {
        const newExpanded = new Set(expandedSections);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedSections(newExpanded);
    };

    const foldAllSections = () => {
        setExpandedSections(new Set());
    };

    const expandAllSections = () => {
        setExpandedSections(new Set(sections.map(s => s.id)));
    };

    // Extract searchable text from section content
    const getSectionSearchText = (section: GuideSection): string => {
        // Create a text representation of the section for searching
        const title = section.title.toLowerCase();
        const keywords: Record<string, string[]> = {
            'getting-started': ['tutorial', 'setup', 'first time', 'quick start', 'begin', 'welcome', 'start'],
            'features': ['feature', 'character', 'world', 'project', 'image', 'analysis', 'dashboard', 'chat'],
            'chat-modes': ['mode', 'character mode', 'world mode', 'project mode', 'roleplay', 'switch', 'context'],
            'commands': ['command', '/generate', '/workshop', '/expand', '/revise', '/analyze', '/simulate', '/worldbio', '/menu', '/help', '/save'],
            'detail-pages': ['detail', 'page', 'view', 'character page', 'world page', 'project page', 'tab', 'document'],
            'ai-guides': ['ai', 'mention', '@', 'link', 'entity', 'context', 'image generation', 'gemini', 'dalle'],
            'how-tos': ['how to', 'tutorial', 'step', 'guide', 'create', 'upload', 'link', 'generate']
        };
        return `${title} ${(keywords[section.id] || []).join(' ')}`;
    };

    // Filter sections based on search query
    const filteredSections = useMemo(() => {
        if (!searchQuery.trim()) {
            return sections;
        }

        const query = searchQuery.toLowerCase().trim();
        return sections.filter(section => {
            const searchText = getSectionSearchText(section);
            const matchesTitle = section.title.toLowerCase().includes(query);
            const matchesContent = searchText.includes(query);
            return matchesTitle || matchesContent;
        });
    }, [searchQuery, sections]);

    // Auto-expand sections that match search
    useEffect(() => {
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            const matchingSections = sections
                .filter(section => {
                    const searchText = getSectionSearchText(section);
                    return section.title.toLowerCase().includes(query) || searchText.includes(query);
                })
                .map(s => s.id);
            
            if (matchingSections.length > 0) {
                setExpandedSections(prev => new Set([...prev, ...matchingSections]));
            }
        }
    }, [searchQuery, sections]);

    return (
        <div className="min-h-screen p-8 lg:p-12">
            <header className="mb-12">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-primary to-primary/40" />
                    <h1 className="text-3xl font-semibold tracking-tight">Guide</h1>
                </div>
                <p className="text-muted-foreground text-base ml-5">
                    Comprehensive tutorials, features, and how-to guides
                </p>
            </header>

            {/* Search and Controls */}
            <div className="max-w-4xl mb-6 space-y-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Search guides, features, commands, tutorials..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-10 bg-background/50"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        onClick={expandAllSections}
                        variant="outline"
                        size="sm"
                        className="glass"
                    >
                        <ChevronsUpDown className="h-4 w-4 mr-2" />
                        Expand All
                    </Button>
                    <Button
                        onClick={foldAllSections}
                        variant="outline"
                        size="sm"
                        className="glass"
                    >
                        <ChevronsUpDown className="h-4 w-4 mr-2 rotate-180" />
                        Fold All
                    </Button>
                    {searchQuery && (
                        <span className="text-sm text-muted-foreground ml-auto">
                            {filteredSections.length} section{filteredSections.length !== 1 ? 's' : ''} found
                        </span>
                    )}
                </div>
            </div>

            <div className="max-w-4xl space-y-4">
                {filteredSections.length === 0 ? (
                    <div className="glass-card rounded-xl p-8 text-center">
                        <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No results found</h3>
                        <p className="text-muted-foreground">
                            Try searching for: commands, features, modes, tutorials, or how-to guides
                        </p>
                    </div>
                ) : (
                    filteredSections.map((section) => {
                    const isExpanded = expandedSections.has(section.id);
                    return (
                        <div key={section.id} className="glass-card rounded-xl overflow-hidden">
                            <button
                                onClick={() => toggleSection(section.id)}
                                className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="text-primary">
                                        {section.icon}
                                    </div>
                                    <h2 className="text-xl font-semibold">{section.title}</h2>
                                </div>
                                {isExpanded ? (
                                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                ) : (
                                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                )}
                            </button>
                            {isExpanded && (
                                <div className="px-5 pb-5 border-t border-white/5 pt-5">
                                    {section.content}
                                </div>
                            )}
                        </div>
                    );
                    })
                )}
            </div>
        </div>
    );
}
