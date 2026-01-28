'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface Section {
    id: string;
    title: string;
}

interface ReadingSideNavProps {
    sections: Section[];
    activeSection: string;
    onNavigate: (sectionId: string) => void;
}

export function ReadingSideNav({ sections, activeSection, onNavigate }: ReadingSideNavProps) {
    return (
        <nav className="sticky top-24 space-y-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-4 px-4">
                Contents
            </p>
            {sections.map((section) => (
                <button
                    key={section.id}
                    onClick={() => onNavigate(section.id)}
                    className={cn(
                        "w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                        "border-l-2",
                        activeSection === section.id
                            ? "bg-primary/10 text-primary border-l-primary"
                            : "text-white/60 hover:text-white hover:bg-white/5 border-l-transparent"
                    )}
                >
                    {section.title}
                </button>
            ))}
        </nav>
    );
}

// Hook for scroll-based active section detection
export function useScrollSpy(sectionIds: string[], offset: number = 100) {
    const [activeId, setActiveId] = useState(sectionIds[0] || '');

    useEffect(() => {
        const handleScroll = () => {
            const scrollPosition = window.scrollY + offset;

            for (let i = sectionIds.length - 1; i >= 0; i--) {
                const element = document.getElementById(sectionIds[i]);
                if (element && element.offsetTop <= scrollPosition) {
                    setActiveId(sectionIds[i]);
                    return;
                }
            }
            setActiveId(sectionIds[0] || '');
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll(); // Initial check

        return () => window.removeEventListener('scroll', handleScroll);
    }, [sectionIds, offset]);

    return activeId;
}
