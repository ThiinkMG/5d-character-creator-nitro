'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Bug, X } from 'lucide-react';
import type { AssembledContext } from '@/lib/contextInjection';

interface ContextDebugPanelProps {
    assembledContext: AssembledContext | null;
    onClose: () => void;
    isVisible: boolean;
}

/**
 * Context Debug Panel
 * Shows exactly what context is being sent to AI
 * Only visible when dev mode is enabled (localStorage: '5d-dev-mode')
 */
export function ContextDebugPanel({
    assembledContext,
    onClose,
    isVisible,
}: ContextDebugPanelProps) {
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['summary']));

    if (!isVisible || !assembledContext) {
        return null;
    }

    const toggleSection = (section: string) => {
        setExpandedSections(prev => {
            const next = new Set(prev);
            if (next.has(section)) {
                next.delete(section);
            } else {
                next.add(section);
            }
            return next;
        });
    };

    const { debugInfo } = assembledContext;
    const utilization = debugInfo
        ? (assembledContext.tokenCount / debugInfo.tokenBudget) * 100
        : 0;

    return (
        <div className="fixed bottom-4 right-4 w-[600px] max-h-[80vh] bg-gray-900/95 backdrop-blur-lg border border-purple-500/30 rounded-lg shadow-2xl overflow-hidden z-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-b border-purple-500/30 p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Bug className="w-5 h-5 text-purple-400" />
                    <h3 className="font-bold text-white">Context Debug Panel</h3>
                    <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">
                        Dev Mode
                    </span>
                </div>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-white transition-colors"
                    aria-label="Close debug panel"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(80vh-64px)] p-4 space-y-4">
                {/* Summary Section */}
                <div className="bg-gray-800/50 rounded-lg border border-gray-700">
                    <button
                        onClick={() => toggleSection('summary')}
                        className="w-full flex items-center justify-between p-3 hover:bg-gray-800/70 transition-colors"
                    >
                        <span className="font-semibold text-white">Summary</span>
                        {expandedSections.has('summary') ? (
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                    </button>
                    {expandedSections.has('summary') && (
                        <div className="p-3 pt-0 space-y-2 text-sm">
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <div className="text-gray-400">Mode</div>
                                    <div className="text-white font-mono">
                                        {debugInfo?.mode || 'N/A'}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-gray-400">Token Count</div>
                                    <div className="text-white font-mono">
                                        {assembledContext.tokenCount} / {debugInfo?.tokenBudget || 0}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <div className="text-gray-400 mb-1">Budget Utilization</div>
                                <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                                    <div
                                        className={`h-full transition-all ${
                                            utilization > 90
                                                ? 'bg-red-500'
                                                : utilization > 70
                                                ? 'bg-yellow-500'
                                                : 'bg-green-500'
                                        }`}
                                        style={{ width: `${Math.min(utilization, 100)}%` }}
                                    />
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                    {utilization.toFixed(1)}% used
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Entities Included Section */}
                <div className="bg-gray-800/50 rounded-lg border border-gray-700">
                    <button
                        onClick={() => toggleSection('entities')}
                        className="w-full flex items-center justify-between p-3 hover:bg-gray-800/70 transition-colors"
                    >
                        <span className="font-semibold text-white">Entities Included</span>
                        {expandedSections.has('entities') ? (
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                    </button>
                    {expandedSections.has('entities') && (
                        <div className="p-3 pt-0 space-y-3 text-sm">
                            {assembledContext.entitiesIncluded.characters.length > 0 && (
                                <div>
                                    <div className="text-emerald-400 font-semibold mb-1">
                                        👤 Characters ({assembledContext.entitiesIncluded.characters.length})
                                    </div>
                                    <ul className="list-disc list-inside text-gray-300 space-y-1">
                                        {assembledContext.entitiesIncluded.characters.map((name, i) => (
                                            <li key={i}>{name}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {assembledContext.entitiesIncluded.worlds.length > 0 && (
                                <div>
                                    <div className="text-blue-400 font-semibold mb-1">
                                        🌍 Worlds ({assembledContext.entitiesIncluded.worlds.length})
                                    </div>
                                    <ul className="list-disc list-inside text-gray-300 space-y-1">
                                        {assembledContext.entitiesIncluded.worlds.map((name, i) => (
                                            <li key={i}>{name}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {assembledContext.entitiesIncluded.projects.length > 0 && (
                                <div>
                                    <div className="text-orange-400 font-semibold mb-1">
                                        📁 Projects ({assembledContext.entitiesIncluded.projects.length})
                                    </div>
                                    <ul className="list-disc list-inside text-gray-300 space-y-1">
                                        {assembledContext.entitiesIncluded.projects.map((name, i) => (
                                            <li key={i}>{name}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {assembledContext.entitiesIncluded.characters.length === 0 &&
                                assembledContext.entitiesIncluded.worlds.length === 0 &&
                                assembledContext.entitiesIncluded.projects.length === 0 && (
                                    <div className="text-gray-500 italic">No entities linked</div>
                                )}
                        </div>
                    )}
                </div>

                {/* Fields Included Section */}
                <div className="bg-gray-800/50 rounded-lg border border-gray-700">
                    <button
                        onClick={() => toggleSection('fields')}
                        className="w-full flex items-center justify-between p-3 hover:bg-gray-800/70 transition-colors"
                    >
                        <span className="font-semibold text-white">Fields Per Entity</span>
                        {expandedSections.has('fields') ? (
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                    </button>
                    {expandedSections.has('fields') && (
                        <div className="p-3 pt-0 space-y-3 text-sm">
                            {assembledContext.fieldsIncluded.character.length > 0 && (
                                <div>
                                    <div className="text-emerald-400 font-semibold mb-1">
                                        Character Fields ({assembledContext.fieldsIncluded.character.length})
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {assembledContext.fieldsIncluded.character.map((field, i) => (
                                            <span
                                                key={i}
                                                className="bg-emerald-900/30 text-emerald-300 px-2 py-1 rounded text-xs font-mono"
                                            >
                                                {field}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {assembledContext.fieldsIncluded.world.length > 0 && (
                                <div>
                                    <div className="text-blue-400 font-semibold mb-1">
                                        World Fields ({assembledContext.fieldsIncluded.world.length})
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {assembledContext.fieldsIncluded.world.map((field, i) => (
                                            <span
                                                key={i}
                                                className="bg-blue-900/30 text-blue-300 px-2 py-1 rounded text-xs font-mono"
                                            >
                                                {field}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {assembledContext.fieldsIncluded.project.length > 0 && (
                                <div>
                                    <div className="text-orange-400 font-semibold mb-1">
                                        Project Fields ({assembledContext.fieldsIncluded.project.length})
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {assembledContext.fieldsIncluded.project.map((field, i) => (
                                            <span
                                                key={i}
                                                className="bg-orange-900/30 text-orange-300 px-2 py-1 rounded text-xs font-mono"
                                            >
                                                {field}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Truncated Fields Section */}
                {assembledContext.truncatedFields.length > 0 && (
                    <div className="bg-yellow-900/20 rounded-lg border border-yellow-700/50">
                        <button
                            onClick={() => toggleSection('truncated')}
                            className="w-full flex items-center justify-between p-3 hover:bg-yellow-900/30 transition-colors"
                        >
                            <span className="font-semibold text-yellow-400">
                                Truncated Fields ({assembledContext.truncatedFields.length})
                            </span>
                            {expandedSections.has('truncated') ? (
                                <ChevronUp className="w-4 h-4 text-yellow-400" />
                            ) : (
                                <ChevronDown className="w-4 h-4 text-yellow-400" />
                            )}
                        </button>
                        {expandedSections.has('truncated') && (
                            <div className="p-3 pt-0 text-sm">
                                <div className="flex flex-wrap gap-1">
                                    {assembledContext.truncatedFields.map((field, i) => (
                                        <span
                                            key={i}
                                            className="bg-yellow-900/30 text-yellow-300 px-2 py-1 rounded text-xs font-mono"
                                        >
                                            {field}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Full Context Text Section */}
                <div className="bg-gray-800/50 rounded-lg border border-gray-700">
                    <button
                        onClick={() => toggleSection('fullContext')}
                        className="w-full flex items-center justify-between p-3 hover:bg-gray-800/70 transition-colors"
                    >
                        <span className="font-semibold text-white">Full Context Text</span>
                        {expandedSections.has('fullContext') ? (
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                    </button>
                    {expandedSections.has('fullContext') && (
                        <div className="p-3 pt-0">
                            <pre className="bg-gray-950 text-gray-300 p-3 rounded text-xs overflow-x-auto whitespace-pre-wrap font-mono max-h-96 overflow-y-auto">
                                {assembledContext.contextString || '(No context generated)'}
                            </pre>
                        </div>
                    )}
                </div>

                {/* Budget Allocation Section */}
                {debugInfo && (
                    <div className="bg-gray-800/50 rounded-lg border border-gray-700">
                        <button
                            onClick={() => toggleSection('budget')}
                            className="w-full flex items-center justify-between p-3 hover:bg-gray-800/70 transition-colors"
                        >
                            <span className="font-semibold text-white">Budget Allocation</span>
                            {expandedSections.has('budget') ? (
                                <ChevronUp className="w-4 h-4 text-gray-400" />
                            ) : (
                                <ChevronDown className="w-4 h-4 text-gray-400" />
                            )}
                        </button>
                        {expandedSections.has('budget') && (
                            <div className="p-3 pt-0 space-y-2 text-sm">
                                <div className="grid grid-cols-3 gap-2">
                                    <div>
                                        <div className="text-emerald-400 font-semibold mb-1">Character</div>
                                        <div className="text-white font-mono">
                                            {debugInfo.entityBudgets.character} tokens
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-blue-400 font-semibold mb-1">World</div>
                                        <div className="text-white font-mono">
                                            {debugInfo.entityBudgets.world} tokens
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-orange-400 font-semibold mb-1">Project</div>
                                        <div className="text-white font-mono">
                                            {debugInfo.entityBudgets.project} tokens
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
