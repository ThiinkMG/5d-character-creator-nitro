'use client';

import React, { useState, useRef, useEffect } from 'react';
import { LayoutGrid, List, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ViewMode = 'grid' | 'list';

interface ViewToggleProps {
    view: ViewMode;
    onViewChange: (view: ViewMode) => void;
    className?: string;
}

export function ViewToggle({ view, onViewChange, className }: ViewToggleProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const options: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
        { id: 'grid', label: 'Grid View', icon: <LayoutGrid className="w-4 h-4" /> },
        { id: 'list', label: 'List View', icon: <List className="w-4 h-4" /> }
    ];

    return (
        <div className={cn("relative", className)} ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="px-4 py-2 rounded-xl text-sm font-medium glass-card-interactive flex items-center gap-2"
                title="Switch View"
            >
                {view === 'grid' ? <LayoutGrid className="w-4 h-4" /> : <List className="w-4 h-4" />}
            </button>

            {isOpen && (
                <div className="absolute top-full mt-2 right-0 min-w-[160px] rounded-xl overflow-hidden z-50 bg-[#0c0c14] border border-white/10 shadow-xl">
                    <div className="p-1.5">
                        {options.map((option) => (
                            <button
                                key={option.id}
                                onClick={() => {
                                    onViewChange(option.id);
                                    setIsOpen(false);
                                }}
                                className={cn(
                                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left",
                                    view === option.id
                                        ? "bg-primary/10 text-primary"
                                        : "hover:bg-white/5 text-white/70"
                                )}
                            >
                                {option.icon}
                                <span className="text-sm font-medium flex-1">{option.label}</span>
                                {view === option.id && <Check className="w-4 h-4" />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// Hook to manage view state with localStorage persistence
export function useViewMode(storageKey: string, defaultView: ViewMode = 'grid'): [ViewMode, (view: ViewMode) => void] {
    const [view, setView] = useState<ViewMode>(defaultView);

    // Load from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem(storageKey);
        if (stored === 'grid' || stored === 'list') {
            setView(stored);
        }
    }, [storageKey]);

    const updateView = (newView: ViewMode) => {
        setView(newView);
        localStorage.setItem(storageKey, newView);
    };

    return [view, updateView];
}
