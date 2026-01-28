'use client';

import React, { useState } from 'react';
import {
    Check,
    X,
    AlertTriangle,
    FileText,
    Layout,
    ArrowRight,
    User,
    Globe,
    Folder
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PendingUpdateCardProps {
    type: 'character' | 'world' | 'project';
    data: any;
    originalData?: any;
    onConfirm: () => void;
    onCancel: () => void;
}

// Helper function to display values in a readable format
const getDisplayValue = (value: any): string | React.ReactNode => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value.length > 50 ? value.slice(0, 50) + '...' : value;

    // Handle arrays intelligently
    if (Array.isArray(value)) {
        if (value.length === 0) return '(empty)';

        // Check if it's an array of objects (like Timeline events)
        if (typeof value[0] === 'object' && value[0] !== null) {
            // For timeline/event arrays
            if (value[0].title || value[0].name) {
                return (
                    <div className="space-y-1">
                        {value.slice(0, 3).map((item, idx) => (
                            <div key={idx} className="text-xs">
                                <span className="text-violet-300 font-medium">
                                    {item.title || item.name}
                                </span>
                                {item.description && (
                                    <span className="text-white/50 ml-2">
                                        - {item.description.slice(0, 40)}...
                                    </span>
                                )}
                            </div>
                        ))}
                        {value.length > 3 && (
                            <div className="text-[10px] text-white/30">
                                +{value.length - 3} more items
                            </div>
                        )}
                    </div>
                );
            }
            // Generic object array
            return `${value.length} items`;
        }

        // Simple array (strings, numbers)
        return value.slice(0, 2).join(', ') + (value.length > 2 ? ` (+${value.length - 2} more)` : '');
    }

    if (typeof value === 'object') {
        // Show key properties for objects
        const keys = Object.keys(value).slice(0, 3);
        return `{ ${keys.join(', ')}${Object.keys(value).length > 3 ? ', ...' : ''} }`;
    }

    return String(value);
};

export function PendingUpdateCard({
    type,
    data,
    originalData,
    onConfirm,
    onCancel
}: PendingUpdateCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    // Calculate changes
    const changes: { field: string; type: 'add' | 'update' | 'delete' | 'unchanged'; labels?: string[] }[] = [];

    // Check standard fields
    Object.keys(data).forEach(key => {
        if (key === 'id' || key === 'updatedAt' || key === 'createdAt') return;

        const newValue = data[key];
        const oldValue = originalData ? originalData[key] : undefined;

        if (JSON.stringify(newValue) === JSON.stringify(oldValue)) return;

        let changeType: 'add' | 'update' | 'delete' = 'update';
        if (oldValue === undefined) changeType = 'add';

        changes.push({ field: key, type: changeType });
    });

    // Special handling for custom sections
    if (data.customSections) {
        const newSections = data.customSections;
        const oldSections = originalData?.customSections || [];

        if (newSections.length > oldSections.length) {
            changes.push({ field: 'Sections', type: 'add', labels: ['New custom sections added'] });
        }
    }

    const title = data.name || (originalData?.name) || 'Untitled Entity';

    return (
        <div className="mt-4 rounded-xl border border-violet-500/20 bg-[#12121a] overflow-hidden">
            {/* Header */}
            <div className="p-4 bg-violet-500/5 border-b border-violet-500/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center border",
                        type === 'character'
                            ? "bg-violet-500/10 border-violet-500/20 text-violet-400"
                            : type === 'world'
                                ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                                : "bg-orange-500/10 border-orange-500/20 text-orange-400"
                    )}>
                        {type === 'character' ? <User className="w-5 h-5" /> : type === 'world' ? <Globe className="w-5 h-5" /> : <Folder className="w-5 h-5" />}
                    </div>
                    <div>
                        <h3 className="font-semibold text-white text-sm">Proposed Updates</h3>
                        <p className="text-xs text-white/50">For: {title}</p>
                    </div>
                </div>

                {changes.length > 0 && (
                    <span className="text-xs font-mono px-2 py-1 rounded bg-white/5 text-white/60">
                        {changes.length} change{changes.length !== 1 ? 's' : ''}
                    </span>
                )}
            </div>

            {/* Changes List */}
            <div className="p-4 space-y-3">
                {changes.length === 0 ? (
                    <p className="text-sm text-white/40 italic">No significant changes detected.</p>
                ) : (
                    <div className="space-y-3">
                        {changes.slice(0, isExpanded ? undefined : 3).map((change, idx) => (
                            <div key={idx} className="flex items-start gap-3 text-sm">
                                <div className={cn(
                                    "w-1.5 h-1.5 rounded-full shrink-0 mt-2",
                                    change.type === 'add' ? "bg-emerald-400" : "bg-amber-400"
                                )} />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-white/70 capitalize font-medium">
                                            {change.field.replace(/([A-Z])/g, ' $1').trim()}
                                        </span>
                                        <ArrowRight className="w-3 h-3 text-white/20 shrink-0" />
                                        <span className={cn(
                                            "text-xs px-1.5 py-0.5 rounded",
                                            change.type === 'add' ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                                        )}>
                                            {change.type}
                                        </span>
                                    </div>
                                    {/* Show actual value */}
                                    <div className="mt-1.5 text-xs">
                                        {change.type === 'add' ? (
                                            <span className="text-emerald-300/80 bg-emerald-500/10 px-2 py-1 rounded inline-block">
                                                {getDisplayValue(data[change.field])}
                                            </span>
                                        ) : (
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-red-300/60 line-through bg-red-500/5 px-2 py-1 rounded">
                                                    {getDisplayValue(originalData?.[change.field])}
                                                </span>
                                                <span className="text-white/30">→</span>
                                                <span className="text-emerald-300/80 bg-emerald-500/10 px-2 py-1 rounded">
                                                    {getDisplayValue(data[change.field])}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {changes.length > 3 && (
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="text-xs text-white/40 hover:text-white transition-colors flex items-center gap-1 mt-2"
                            >
                                {isExpanded ? 'Show Less' : `Show ${changes.length - 3} more...`}
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="p-3 bg-white/[0.02] border-t border-white/5 flex gap-2">
                <Button
                    onClick={onConfirm}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                    <Check className="w-4 h-4 mr-2" />
                    Apply Changes
                </Button>
                <Button
                    onClick={onCancel}
                    variant="ghost"
                    className="flex-1 hover:bg-red-500/10 hover:text-red-400 text-white/50"
                >
                    <X className="w-4 h-4 mr-2" />
                    Reject
                </Button>
            </div>
        </div>
    );
}
