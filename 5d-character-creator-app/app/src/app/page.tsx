'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Send,
  Sparkles,
  Users,
  Globe,
  Wand2,
  BookOpen,
  Mic,
  Plus,
  History,
  Settings
} from "lucide-react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function Home() {
  const [input, setInput] = useState('');
  const router = useRouter();
  const { isSidebarCollapsed } = useStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      router.push(`/chat?prompt=${encodeURIComponent(input)}`);
    }
  };

  const quickActions = [
    {
      label: 'Create a Character',
      icon: Users,
      gradient: 'from-emerald-600/80 via-emerald-500/60 to-green-400/40',
      pattern: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)',
      path: '/chat?mode=character',
    },
    {
      label: 'Build a World',
      icon: Globe,
      gradient: 'from-violet-600/80 via-purple-500/60 to-fuchsia-400/40',
      pattern: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%)',
      path: '/chat?mode=world',
    },
    {
      label: 'Write a Scene',
      icon: Wand2,
      gradient: 'from-orange-600/80 via-amber-500/60 to-yellow-400/40',
      pattern: 'radial-gradient(circle at 80% 80%, rgba(255,255,255,0.1) 0%, transparent 50%)',
      path: '/chat?mode=scene',
    },
    {
      label: 'Explore Lore',
      icon: BookOpen,
      gradient: 'from-cyan-600/80 via-blue-500/60 to-sky-400/40',
      pattern: 'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)',
      path: '/chat?mode=lore',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Main Content - Centered */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-32">
        {/* Greeting */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4">
            <span className="text-gradient-ember">What would you like</span>
            <br />
            <span className="text-foreground">to create today?</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Build characters that feel alive with AI-powered depth
          </p>
        </div>

        {/* Quick Action Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-4xl mb-8">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => router.push(action.path)}
              className="group relative overflow-hidden rounded-2xl p-5 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
              style={{
                background: `linear-gradient(135deg, var(--tw-gradient-stops))`,
              }}
            >
              {/* Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient}`} />

              {/* Pattern Overlay */}
              <div
                className="absolute inset-0 opacity-60"
                style={{ background: action.pattern }}
              />

              {/* Geometric Pattern */}
              <div className="absolute inset-0 opacity-20">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <defs>
                    <pattern id={`grid-${action.label}`} width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect width="100" height="100" fill={`url(#grid-${action.label})`} />
                </svg>
              </div>

              {/* Content */}
              <div className="relative z-10">
                <action.icon className="h-6 w-6 text-white/90 mb-12 group-hover:scale-110 transition-transform" />
                <span className="text-white font-medium text-sm block">{action.label}</span>
              </div>

              {/* Hover Shine Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </button>
          ))}
        </div>
      </main>

      {/* Fixed Bottom Input */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent transition-all duration-300 ease-out",
          isSidebarCollapsed ? "ml-[72px]" : "ml-[260px]"
        )}
      >
        <div className="max-w-3xl mx-auto">
          {/* Input Box */}
          <form onSubmit={handleSubmit} className="relative">
            <div className="glass-card rounded-2xl p-2 flex items-center">
              <button
                type="button"
                className="p-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
              >
                <Mic className="h-5 w-5" />
              </button>

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Describe your character or world..."
                className="flex-1 bg-transparent px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none"
              />

              <button
                type="submit"
                disabled={!input.trim()}
                className="p-3 rounded-xl bg-primary text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition-all"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </form>

          {/* Bottom Actions */}
          <div className="flex items-center justify-center gap-6 mt-4">
            <button onClick={() => router.push('/chat')} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-all">
              <Plus className="h-4 w-4" />
              <span>New</span>
            </button>
            <button onClick={() => router.push('/history')} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-all">
              <History className="h-4 w-4" />
              <span>History</span>
            </button>
            <button onClick={() => router.push('/settings')} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-all">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>Claude 3.5</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
