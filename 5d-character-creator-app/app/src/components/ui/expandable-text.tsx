'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ExpandableTextProps {
    content: string;
    maxLength?: number;
    className?: string;
}

export function ExpandableText({ content, maxLength = 150, className }: ExpandableTextProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!content) return null;

    const shouldTruncate = content.length > maxLength;
    const displayContent = isExpanded || !shouldTruncate ? content : content.slice(0, maxLength) + '...';

    return (
        <div className={cn("relative", className)}>
            <p className="leading-relaxed whitespace-pre-line text-white/70">
                {displayContent}
                {shouldTruncate && !isExpanded && (
                    <button
                        onClick={() => setIsExpanded(true)}
                        className="inline-flex items-center gap-1 ml-1 text-primary hover:text-primary/80 font-medium text-sm transition-colors"
                    >
                        more
                    </button>
                )}
            </p>
            {shouldTruncate && isExpanded && (
                <button
                    onClick={() => setIsExpanded(false)}
                    className="inline-flex items-center gap-1 mt-2 text-primary hover:text-primary/80 font-medium text-sm transition-colors"
                >
                    Show less
                    <ChevronUp className="w-3 h-3" />
                </button>
            )}
        </div>
    );
}
