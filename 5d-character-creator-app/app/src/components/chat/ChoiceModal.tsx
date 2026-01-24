'use client';

import React from 'react';
import { X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Choice {
    id: string;
    label: string;
    description?: string;
    icon?: string;
}

interface ChoiceModalProps {
    title: string;
    choices: Choice[];
    onSelect: (choice: Choice) => void;
    onClose: () => void;
    allowCustom?: boolean;
    customPlaceholder?: string;
}

export function ChoiceModal({
    title,
    choices,
    onSelect,
    onClose,
    allowCustom = true,
    customPlaceholder = "Or type your own...",
}: ChoiceModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-lg glass-card rounded-2xl p-6 animate-fade-in">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-foreground">{title}</h3>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Choices Grid */}
                <div className="grid gap-3 mb-4">
                    {choices.map((choice) => (
                        <button
                            key={choice.id}
                            onClick={() => onSelect(choice)}
                            className={cn(
                                "w-full text-left p-4 rounded-xl",
                                "bg-white/[0.03] hover:bg-white/[0.08]",
                                "border border-white/5 hover:border-primary/30",
                                "transition-all duration-200",
                                "group"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                {choice.icon && (
                                    <span className="text-2xl">{choice.icon}</span>
                                )}
                                <div className="flex-1">
                                    <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                                        {choice.label}
                                    </p>
                                    {choice.description && (
                                        <p className="text-sm text-muted-foreground mt-0.5">
                                            {choice.description}
                                        </p>
                                    )}
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-xs text-primary">Select →</span>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Custom Input Option */}
                {allowCustom && (
                    <div className="pt-4 border-t border-white/5">
                        <p className="text-xs text-muted-foreground mb-2">Or enter your own:</p>
                        <input
                            type="text"
                            placeholder={customPlaceholder}
                            className="w-full premium-input text-sm"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                    onSelect({
                                        id: 'custom',
                                        label: e.currentTarget.value.trim(),
                                    });
                                }
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

// Inline choice chips (for within messages)
interface ChoiceChipsProps {
    choices: Choice[];
    onSelect: (choice: Choice | Choice[]) => void;
    allowMultiple?: boolean;
    allowCustom?: boolean;
}

export function ChoiceChips({ choices, onSelect, allowMultiple = true, allowCustom = true }: ChoiceChipsProps) {
    const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
    const [isCustomMode, setIsCustomMode] = React.useState(false);
    const [customValue, setCustomValue] = React.useState('');

    const toggleSelection = (id: string) => {
        if (allowMultiple) {
            setSelectedIds(prev =>
                prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
            );
        } else {
            // Single select behavior (immediate submit unless we want confirmation?)
            // For consistency with current app, single select usually submits immediately.
            const choice = choices.find(c => c.id === id);
            if (choice) onSelect(choice);
        }
    };

    const handleSubmit = () => {
        const selectedChoices = choices.filter(c => selectedIds.includes(c.id));
        if (isCustomMode && customValue.trim()) {
            selectedChoices.push({ id: 'custom', label: customValue.trim() });
        }
        if (selectedChoices.length > 0) {
            onSelect(selectedChoices);
        }
    };

    return (
        <div className="mt-4 pt-4 border-t border-white/5">
            <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wide font-medium">
                {allowMultiple ? "Choose options (select multiple):" : "Choose an option:"}
            </p>
            <div className="space-y-2">
                {choices.map((choice) => {
                    const isSelected = selectedIds.includes(choice.id);
                    return (
                        <button
                            key={choice.id}
                            onClick={() => toggleSelection(choice.id)}
                            className={cn(
                                "w-full text-left px-4 py-3 rounded-xl text-sm transition-all duration-200 flex items-center gap-3 group",
                                isSelected
                                    ? "bg-primary/10 border-primary/40 text-primary"
                                    : "bg-white/[0.02] hover:bg-white/[0.05] border-white/10 hover:border-white/20 text-foreground"
                            )}
                        >
                            <div className={cn(
                                "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                                isSelected
                                    ? "border-primary bg-primary"
                                    : "border-muted-foreground/50 group-hover:border-primary/50"
                            )}>
                                {isSelected && <Check className="w-2.5 h-2.5 text-black" />}
                            </div>
                            <span className="flex-1">{choice.label}</span>
                        </button>
                    );
                })}

                {/* Custom Option Toggle */}
                {allowCustom && (
                    <div className={cn(
                        "rounded-xl transition-all duration-300",
                        isCustomMode
                            ? "bg-white/[0.02] border border-white/10 p-3"
                            : "pt-1"
                    )}>
                        {!isCustomMode ? (
                            <button
                                onClick={() => setIsCustomMode(true)}
                                className="w-full text-left px-4 py-3 rounded-xl text-sm bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 hover:border-white/20 text-muted-foreground hover:text-foreground transition-all flex items-center gap-3 group"
                            >
                                <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/50 group-hover:border-white/50 shrink-0" />
                                <span className="italic flex-1">Other (type your own)...</span>
                            </button>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-4 h-4 rounded-full border-2 border-primary bg-primary flex items-center justify-center shrink-0">
                                        <Check className="w-2.5 h-2.5 text-black" />
                                    </div>
                                    <span className="text-sm font-medium text-primary">Other</span>
                                    <button
                                        onClick={() => {
                                            setIsCustomMode(false);
                                            setCustomValue('');
                                        }}
                                        className="ml-auto text-xs text-muted-foreground hover:text-white"
                                    >
                                        Cancel
                                    </button>
                                </div>
                                <input
                                    autoFocus
                                    type="text"
                                    value={customValue}
                                    onChange={(e) => setCustomValue(e.target.value)}
                                    placeholder="Type your answer here..."
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault(); // Prevent newline if textarea (though this is input)
                                            if (customValue.trim()) {
                                                if (allowMultiple) {
                                                    // In multi mode, just focus submit or add to list?
                                                    // User asked for "automatically switches to a user input field".
                                                    // And "enter" submits info.
                                                    handleSubmit();
                                                } else {
                                                    // Single select submit
                                                    onSelect({ id: 'custom', label: customValue.trim() });
                                                }
                                            }
                                        }
                                    }}
                                />
                                <p className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
                                    <span className="px-1 py-0.5 rounded bg-white/10 text-white/50 font-mono text-[9px]">ENTER</span> to submit
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Submit Action for Multi-Select */}
            {allowMultiple && (selectedIds.length > 0 || (isCustomMode && customValue.trim().length > 0)) && (
                <div className="mt-4 flex justify-end animate-in fade-in slide-in-from-bottom-2">
                    <button
                        onClick={handleSubmit}
                        className="px-4 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-lg shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
                    >
                        <span>Submit Selections</span>
                        <div className="w-5 h-5 rounded-full bg-black/20 flex items-center justify-center text-[10px]">
                            {selectedIds.length + (isCustomMode && customValue.trim() ? 1 : 0)}
                        </div>
                    </button>
                </div>
            )}
        </div>
    );
}
