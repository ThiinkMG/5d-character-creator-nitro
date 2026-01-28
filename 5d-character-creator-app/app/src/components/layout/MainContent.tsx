'use client';

import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

export function MainContent({ children }: { children: React.ReactNode }) {
    const { isSidebarCollapsed } = useStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Prevent hydration mismatch by rendering default state initially or handling loading
    // Since persisted state might differ from server render (always expanded default or unknown)
    // We'll trust the store but ensure class is applied only after mount to avoid flicker? 
    // actually, zustand persist usually hydrates quickly. 
    // A safe approach for hydration:
    if (!mounted) {
        return (
            <main className="flex-1 ml-[260px] transition-all duration-300">
                {children}
            </main>
        );
    }

    return (
        <main
            className={cn(
                "flex-1 transition-all duration-300 ease-out",
                isSidebarCollapsed ? "ml-[72px]" : "ml-[260px]"
            )}
        >
            {children}
        </main>
    );
}
