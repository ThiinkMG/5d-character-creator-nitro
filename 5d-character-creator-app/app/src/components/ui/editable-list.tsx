'use client';

import React, { useState } from 'react';
import { Plus, X, Pencil, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

interface EditableListProps {
    items: string[];
    onSave: (items: string[]) => void;
    label?: string;
    placeholder?: string;
    colorClass?: string;
    isEditModeActive?: boolean;
    showAIButton?: boolean;
    onAIGenerate?: () => void;
}

export function EditableList({
    items = [],
    onSave,
    label,
    placeholder = 'Add item...',
    colorClass = 'bg-white/5 text-white/70',
    isEditModeActive = false,
    showAIButton = false,
    onAIGenerate
}: EditableListProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editItems, setEditItems] = useState<string[]>(items);
    const [newItem, setNewItem] = useState('');

    const handleStartEdit = () => {
        setEditItems([...items]);
        setIsEditing(true);
    };

    const handleSave = () => {
        onSave(editItems.filter(item => item.trim()));
        setIsEditing(false);
        setNewItem('');
    };

    const handleCancel = () => {
        setEditItems([...items]);
        setIsEditing(false);
        setNewItem('');
    };

    const handleAddItem = () => {
        if (newItem.trim()) {
            setEditItems([...editItems, newItem.trim()]);
            setNewItem('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddItem();
        }
        if (e.key === 'Escape') {
            handleCancel();
        }
    };

    const handleRemoveItem = (index: number) => {
        setEditItems(editItems.filter((_, i) => i !== index));
    };

    if (isEditing) {
        return (
            <div className="space-y-3">
                {label && (
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block">
                        {label}
                    </label>
                )}

                {/* Current items */}
                <div className="flex flex-wrap gap-2">
                    {editItems.map((item, index) => {
                        // Safety: ensure item is always a string
                        let displayItem: string;
                        if (typeof item === 'string') {
                            displayItem = item;
                        } else if (item && typeof item === 'object' && item !== null) {
                            displayItem = (item as any).name || (item as any).description || JSON.stringify(item);
                        } else {
                            displayItem = String(item || '');
                        }
                        return (
                            <span
                                key={index}
                                className={cn(
                                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm",
                                    colorClass
                                )}
                            >
                                {displayItem}
                                <button
                                    onClick={() => handleRemoveItem(index)}
                                    className="p-0.5 rounded hover:bg-white/10 transition-colors"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        );
                    })}
                </div>

                {/* Add new item */}
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newItem}
                        onChange={(e) => setNewItem(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 
                                   text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50
                                   text-sm transition-colors"
                    />
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleAddItem}
                        disabled={!newItem.trim()}
                        className="h-9 px-3"
                    >
                        <Plus className="w-4 h-4 mr-1" />
                        Add
                    </Button>
                </div>

                {/* Save/Cancel */}
                <div className="flex gap-2 pt-2">
                    <Button
                        size="sm"
                        onClick={handleSave}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white"
                    >
                        Save
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCancel}
                    >
                        Cancel
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="group">
            {label && (
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-2">
                    {label}
                </label>
            )}
            <div className="flex items-start gap-2">
                <div className="flex-1 flex flex-wrap gap-2 min-h-[2rem]">
                    {items.length > 0 ? (
                        items.map((item, index) => {
                            // Safety: ensure item is always a string
                            let displayItem: string;
                            if (typeof item === 'string') {
                                displayItem = item;
                            } else if (item && typeof item === 'object' && item !== null) {
                                displayItem = (item as any).name || (item as any).description || JSON.stringify(item);
                            } else {
                                displayItem = String(item || '');
                            }
                            return (
                                <span
                                    key={index}
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg text-sm",
                                        colorClass
                                    )}
                                >
                                    {displayItem}
                                </span>
                            );
                        })
                    ) : (
                        <span className="text-white/30 italic text-sm py-1.5">No items defined</span>
                    )}
                </div>
                {isEditModeActive && (
                    <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={handleStartEdit}
                            className="p-1.5 rounded-md hover:bg-white/10 text-white/50 hover:text-white transition-all"
                            title="Edit"
                        >
                            <Pencil className="w-3.5 h-3.5" />
                        </button>
                        {showAIButton && onAIGenerate && (
                            <button
                                onClick={onAIGenerate}
                                className="p-1.5 rounded-md hover:bg-primary/10 text-primary/70 hover:text-primary transition-all"
                                title="Generate with AI"
                            >
                                <Sparkles className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
