'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ManualSaveModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'character' | 'world' | 'project';
    data: any;
    originalData?: any;
    onSave: (selectedFields: string[]) => void;
}

// Field groups for better organization
const CHARACTER_FIELD_GROUPS = {
    'Basic Info': ['name', 'role', 'genre', 'coreConcept', 'archetype'],
    'Personality': ['personalityProse', 'motivations', 'flaws'],
    'Backstory': ['backstoryProse', 'origin', 'ghost'],
    'Relationships': ['relationshipsProse', 'allies', 'enemies'],
    'Character Arc': ['arcProse', 'arcType', 'climax'],
    'Custom Sections': ['customSections']
};

const WORLD_FIELD_GROUPS = {
    'Basic Info': ['name', 'genre', 'tone', 'description'],
    'Overview': ['overviewProse'],
    'History': ['historyProse', 'history'],
    'Factions': ['factionsProse', 'factions'],
    'Geography': ['geographyProse', 'geography', 'locations'],
    'Systems': ['magicSystem', 'technology', 'rules'],
    'Custom Sections': ['customSections']
};

const PROJECT_FIELD_GROUPS = {
    'Basic Info': ['name', 'genre', 'summary', 'description'],
    'Timeline': ['timeline'],
    'Links': ['characterIds', 'worldIds'],
    'Metadata': ['tags', 'progress']
};

export function ManualSaveModal({
    isOpen,
    onClose,
    type,
    data,
    originalData,
    onSave
}: ManualSaveModalProps) {
    const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());
    const [selectAll, setSelectAll] = useState(false);

    const fieldGroups = type === 'character' 
        ? CHARACTER_FIELD_GROUPS 
        : type === 'world' 
            ? WORLD_FIELD_GROUPS 
            : PROJECT_FIELD_GROUPS;

    // Initialize: select all fields that have data and differ from original
    useEffect(() => {
        if (!isOpen) return;
        
        const fields = new Set<string>();
        Object.keys(data).forEach(key => {
            if (key === 'id' || key === 'updatedAt' || key === 'createdAt') return;
            
            // Only include fields that have data
            if (data[key] !== undefined && data[key] !== null) {
                // If original data exists, only include if different
                if (originalData) {
                    if (JSON.stringify(data[key]) !== JSON.stringify(originalData[key])) {
                        fields.add(key);
                    }
                } else {
                    fields.add(key);
                }
            }
        });
        
        setSelectedFields(fields);
        setSelectAll(fields.size > 0);
    }, [isOpen, data, originalData]);

    const toggleField = (field: string) => {
        setSelectedFields(prev => {
            const next = new Set(prev);
            if (next.has(field)) {
                next.delete(field);
            } else {
                next.add(field);
            }
            return next;
        });
    };

    const toggleGroup = (groupFields: string[]) => {
        const allSelected = groupFields.every(f => selectedFields.has(f));
        setSelectedFields(prev => {
            const next = new Set(prev);
            if (allSelected) {
                groupFields.forEach(f => next.delete(f));
            } else {
                groupFields.forEach(f => {
                    if (data[f] !== undefined && data[f] !== null) {
                        next.add(f);
                    }
                });
            }
            return next;
        });
    };

    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedFields(new Set());
        } else {
            const allFields = new Set<string>();
            Object.keys(data).forEach(key => {
                if (key !== 'id' && key !== 'updatedAt' && key !== 'createdAt') {
                    if (data[key] !== undefined && data[key] !== null) {
                        allFields.add(key);
                    }
                }
            });
            setSelectedFields(allFields);
        }
        setSelectAll(!selectAll);
    };

    const handleSave = () => {
        if (selectedFields.size === 0) {
            return;
        }
        onSave(Array.from(selectedFields));
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="relative w-full max-w-[90vw] sm:max-w-4xl max-h-[90vh] bg-[#12121a] border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
                    <div className="flex items-center gap-3">
                        <Save className="h-5 w-5 text-primary" />
                        <div>
                            <h2 className="font-semibold text-white">Manual Save</h2>
                            <p className="text-xs text-muted-foreground">
                                Select which fields to save
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Select All */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={selectAll}
                                onChange={handleSelectAll}
                                className="w-4 h-4 rounded border-white/20 bg-white/5 text-primary focus:ring-primary"
                            />
                            <span className="text-sm font-medium text-white">Select All</span>
                        </label>
                        <span className="text-xs text-muted-foreground">
                            {selectedFields.size} field{selectedFields.size !== 1 ? 's' : ''} selected
                        </span>
                    </div>

                    {/* Field Groups */}
                    {Object.entries(fieldGroups).map(([groupName, fields]) => {
                        const availableFields = fields.filter(f => data[f] !== undefined && data[f] !== null);
                        if (availableFields.length === 0) return null;

                        const allSelected = availableFields.every(f => selectedFields.has(f));
                        const someSelected = availableFields.some(f => selectedFields.has(f));

                        return (
                            <div key={groupName} className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-white/90">{groupName}</h3>
                                    <button
                                        onClick={() => toggleGroup(availableFields)}
                                        className="text-xs text-primary hover:text-primary/80"
                                    >
                                        {allSelected ? 'Deselect All' : 'Select All'}
                                    </button>
                                </div>
                                <div className="space-y-1.5 pl-2">
                                    {availableFields.map(field => {
                                        const isSelected = selectedFields.has(field);
                                        const hasChanges = originalData 
                                            ? JSON.stringify(data[field]) !== JSON.stringify(originalData[field])
                                            : true;
                                        
                                        return (
                                            <label
                                                key={field}
                                                className={cn(
                                                    "flex items-start gap-2 p-2 rounded-lg cursor-pointer transition-colors",
                                                    isSelected 
                                                        ? "bg-primary/10 border border-primary/20" 
                                                        : "bg-white/5 border border-transparent hover:bg-white/10"
                                                )}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleField(field)}
                                                    className="mt-0.5 w-4 h-4 rounded border-white/20 bg-white/5 text-primary focus:ring-primary"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm text-white/90 font-medium">
                                                            {field.replace(/([A-Z])/g, ' $1').trim()}
                                                        </span>
                                                        {hasChanges && (
                                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                                                Changed
                                                            </span>
                                                        )}
                                                    </div>
                                                    {data[field] && typeof data[field] === 'string' && (
                                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                            {data[field].slice(0, 100)}
                                                            {data[field].length > 100 && '...'}
                                                        </p>
                                                    )}
                                                    {Array.isArray(data[field]) && (
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            {data[field].length} item{data[field].length !== 1 ? 's' : ''}
                                                        </p>
                                                    )}
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-4 border-t border-white/10 bg-white/5">
                    <div className="text-xs text-muted-foreground">
                        {selectedFields.size === 0 && (
                            <div className="flex items-center gap-2 text-amber-400">
                                <AlertCircle className="h-3.5 w-3.5" />
                                <span>Select at least one field to save</span>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            className="text-muted-foreground hover:text-white"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={selectedFields.size === 0}
                            className="bg-primary hover:bg-primary/90 text-white"
                        >
                            <Save className="h-4 w-4 mr-2" />
                            Save {selectedFields.size} Field{selectedFields.size !== 1 ? 's' : ''}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
