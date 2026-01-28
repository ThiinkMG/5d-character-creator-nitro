'use client';

import { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Settings, BookOpen, Activity, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface DevModeLogEntry {
    id: string;
    timestamp: Date;
    type: 'rag' | 'context' | 'api' | 'error';
    message: string;
    data?: any;
}

export interface DevModeDebugInfo {
    rag?: {
        query: string;
        method: 'keyword' | 'semantic' | 'hybrid';
        results: Array<{
            item: {
                id: string;
                title: string;
                type: string;
            };
            score: number;
            matchType: 'title' | 'summary' | 'semantic';
        }>;
        embeddingGenerated: boolean;
        fallbackToKeyword: boolean;
    };
    context?: {
        totalTokens: number;
        includedSections: string[];
        truncatedSections: string[];
        droppedSections: string[];
        tokenBudget: number;
        modelId: string;
    };
    /** Week 4: Just-in-Time Context Injection debug info */
    contextInjection?: {
        mode: string;
        tokenCount: number;
        budget: number;
        entitiesIncluded: {
            characters: string[];
            worlds: string[];
            projects: string[];
        };
        fieldsIncluded: {
            character: string[];
            world: string[];
            project: string[];
        };
        truncatedFields: string[];
    };
    provider?: string;
    modelId?: string;
}

interface DevModePanelProps {
    isOpen: boolean;
    onToggle: () => void;
    logs: DevModeLogEntry[];
    debugInfo: DevModeDebugInfo | null;
    onClearLogs: () => void;
}

export function DevModePanel({ isOpen, onToggle, logs, debugInfo, onClearLogs }: DevModePanelProps) {
    const [isMinimized, setIsMinimized] = useState(false);
    const [activeTab, setActiveTab] = useState<'logs' | 'rag' | 'context' | 'settings'>('logs');
    const logsEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new logs arrive
    useEffect(() => {
        if (activeTab === 'logs' && logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs, activeTab]);

    if (!isOpen) return null;

    return (
        <div
            className={cn(
                'fixed right-0 top-0 h-full bg-background/95 backdrop-blur-sm border-l border-border z-50 transition-all duration-300',
                isMinimized ? 'w-12' : 'w-96',
                'flex flex-col shadow-2xl'
            )}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-border bg-background/50">
                {!isMinimized && (
                    <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-sm">Dev Mode</span>
                    </div>
                )}
                <div className="flex items-center gap-1 ml-auto">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsMinimized(!isMinimized)}
                        className="h-7 w-7 p-0"
                    >
                        {isMinimized ? <ChevronLeft className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                    </Button>
                    {!isMinimized && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onToggle}
                            className="h-7 w-7 p-0"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            {!isMinimized && (
                <>
                    {/* Tabs */}
                    <div className="flex border-b border-border bg-background/30">
                        <button
                            onClick={() => setActiveTab('logs')}
                            className={cn(
                                'flex-1 px-3 py-2 text-xs font-medium transition-colors',
                                activeTab === 'logs'
                                    ? 'bg-primary/10 text-primary border-b-2 border-primary'
                                    : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            <Activity className="h-3 w-3 inline mr-1" />
                            Logs
                        </button>
                        <button
                            onClick={() => setActiveTab('rag')}
                            className={cn(
                                'flex-1 px-3 py-2 text-xs font-medium transition-colors',
                                activeTab === 'rag'
                                    ? 'bg-primary/10 text-primary border-b-2 border-primary'
                                    : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            <BookOpen className="h-3 w-3 inline mr-1" />
                            RAG
                        </button>
                        <button
                            onClick={() => setActiveTab('context')}
                            className={cn(
                                'flex-1 px-3 py-2 text-xs font-medium transition-colors',
                                activeTab === 'context'
                                    ? 'bg-primary/10 text-primary border-b-2 border-primary'
                                    : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            Context
                        </button>
                        <button
                            onClick={() => setActiveTab('settings')}
                            className={cn(
                                'flex-1 px-3 py-2 text-xs font-medium transition-colors',
                                activeTab === 'settings'
                                    ? 'bg-primary/10 text-primary border-b-2 border-primary'
                                    : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            <Settings className="h-3 w-3 inline mr-1" />
                            Settings
                        </button>
                    </div>

                    {/* Content */}
                    <ScrollArea className="flex-1">
                        <div className="p-4">
                            {activeTab === 'logs' && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-sm font-semibold">Activity Logs</h3>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={onClearLogs}
                                            className="h-7 text-xs"
                                        >
                                            Clear
                                        </Button>
                                    </div>
                                    {logs.length === 0 ? (
                                        <div className="text-center text-muted-foreground text-xs py-8">
                                            No logs yet. Send a message to see activity.
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {logs.map((log) => (
                                                <div
                                                    key={log.id}
                                                    className={cn(
                                                        'p-2 rounded-md text-xs border',
                                                        log.type === 'error' && 'bg-destructive/10 border-destructive/20',
                                                        log.type === 'rag' && 'bg-blue-500/10 border-blue-500/20',
                                                        log.type === 'context' && 'bg-purple-500/10 border-purple-500/20',
                                                        log.type === 'api' && 'bg-green-500/10 border-green-500/20'
                                                    )}
                                                >
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="font-medium capitalize">{log.type}</span>
                                                                <span className="text-muted-foreground">
                                                                    {log.timestamp.toLocaleTimeString()}
                                                                </span>
                                                            </div>
                                                            <div className="text-muted-foreground">{log.message}</div>
                                                            {log.data && (
                                                                <details className="mt-1">
                                                                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                                                                        Details
                                                                    </summary>
                                                                    <pre className="mt-1 text-[10px] overflow-x-auto bg-background/50 p-2 rounded">
                                                                        {JSON.stringify(log.data, null, 2)}
                                                                    </pre>
                                                                </details>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            <div ref={logsEndRef} />
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'rag' && (
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold">Knowledge Bank Retrieval</h3>
                                    {debugInfo?.rag ? (
                                        <div className="space-y-3">
                                            <div>
                                                <div className="text-xs text-muted-foreground mb-1">Query</div>
                                                <div className="text-sm bg-background/50 p-2 rounded">
                                                    {debugInfo.rag.query}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-muted-foreground mb-1">Method</div>
                                                <div className="flex items-center gap-2">
                                                    <span className={cn(
                                                        'px-2 py-1 rounded text-xs font-medium',
                                                        debugInfo.rag.method === 'semantic' && 'bg-blue-500/20 text-blue-400',
                                                        debugInfo.rag.method === 'keyword' && 'bg-yellow-500/20 text-yellow-400',
                                                        debugInfo.rag.method === 'hybrid' && 'bg-purple-500/20 text-purple-400'
                                                    )}>
                                                        {debugInfo.rag.method}
                                                    </span>
                                                    {debugInfo.rag.embeddingGenerated && (
                                                        <span className="text-xs text-green-400">✓ Embedding</span>
                                                    )}
                                                    {debugInfo.rag.fallbackToKeyword && (
                                                        <span className="text-xs text-yellow-400">⚠ Fallback</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-muted-foreground mb-2">
                                                    Results ({debugInfo.rag.results.length})
                                                </div>
                                                <div className="space-y-2">
                                                    {debugInfo.rag.results.map((result, idx) => (
                                                        <div
                                                            key={idx}
                                                            className="p-2 bg-background/50 rounded border border-border"
                                                        >
                                                            <div className="font-medium text-sm mb-1">
                                                                {result.item.title}
                                                            </div>
                                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                <span className="capitalize">{result.matchType}</span>
                                                                <span>•</span>
                                                                <span>Score: {result.score.toFixed(3)}</span>
                                                                <span>•</span>
                                                                <span className="capitalize">{result.item.type}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center text-muted-foreground text-xs py-8">
                                            No RAG data available. Send a message to see retrieval info.
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'context' && (
                                <div className="space-y-4">
                                    {/* Context Budget Section */}
                                    <h3 className="text-sm font-semibold">Context Budget</h3>
                                    {debugInfo?.context ? (
                                        <div className="space-y-3">
                                            <div>
                                                <div className="flex items-center justify-between text-xs mb-1">
                                                    <span className="text-muted-foreground">Token Usage</span>
                                                    <span className="font-medium">
                                                        {debugInfo.context.totalTokens.toLocaleString()} / {debugInfo.context.tokenBudget.toLocaleString()}
                                                    </span>
                                                </div>
                                                <div className="w-full bg-background/50 rounded-full h-2">
                                                    <div
                                                        className="bg-primary h-2 rounded-full transition-all"
                                                        style={{
                                                            width: `${Math.min(100, (debugInfo.context.totalTokens / debugInfo.context.tokenBudget) * 100)}%`
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-muted-foreground mb-2">Included Sections</div>
                                                <div className="space-y-1">
                                                    {debugInfo.context.includedSections.map((section, idx) => (
                                                        <div
                                                            key={idx}
                                                            className="text-xs bg-green-500/10 text-green-400 px-2 py-1 rounded"
                                                        >
                                                            ✓ {section}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            {debugInfo.context.truncatedSections.length > 0 && (
                                                <div>
                                                    <div className="text-xs text-muted-foreground mb-2">Truncated Sections</div>
                                                    <div className="space-y-1">
                                                        {debugInfo.context.truncatedSections.map((section, idx) => (
                                                            <div
                                                                key={idx}
                                                                className="text-xs bg-yellow-500/10 text-yellow-400 px-2 py-1 rounded"
                                                            >
                                                                ⚠ {section}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {debugInfo.context.droppedSections.length > 0 && (
                                                <div>
                                                    <div className="text-xs text-muted-foreground mb-2">Dropped Sections</div>
                                                    <div className="space-y-1">
                                                        {debugInfo.context.droppedSections.map((section, idx) => (
                                                            <div
                                                                key={idx}
                                                                className="text-xs bg-red-500/10 text-red-400 px-2 py-1 rounded"
                                                            >
                                                                ✗ {section}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            <div>
                                                <div className="text-xs text-muted-foreground mb-1">Model</div>
                                                <div className="text-sm">{debugInfo.context.modelId}</div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center text-muted-foreground text-xs py-8">
                                            No context data available. Send a message to see context info.
                                        </div>
                                    )}

                                    {/* Context Injection Section (Week 4) */}
                                    {debugInfo?.contextInjection && (
                                        <>
                                            <div className="border-t border-border pt-4 mt-4">
                                                <h3 className="text-sm font-semibold mb-3">Entity Context Injection</h3>
                                                <div className="space-y-3">
                                                    {/* Mode and Budget */}
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="text-muted-foreground">Mode</span>
                                                        <span className="font-medium px-2 py-0.5 rounded bg-purple-500/20 text-purple-400">
                                                            {debugInfo.contextInjection.mode}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center justify-between text-xs mb-1">
                                                            <span className="text-muted-foreground">Entity Token Usage</span>
                                                            <span className="font-medium">
                                                                {debugInfo.contextInjection.tokenCount.toLocaleString()} / {debugInfo.contextInjection.budget.toLocaleString()}
                                                            </span>
                                                        </div>
                                                        <div className="w-full bg-background/50 rounded-full h-2">
                                                            <div
                                                                className="bg-purple-500 h-2 rounded-full transition-all"
                                                                style={{
                                                                    width: `${Math.min(100, (debugInfo.contextInjection.tokenCount / debugInfo.contextInjection.budget) * 100)}%`
                                                                }}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Entities Included */}
                                                    {(debugInfo.contextInjection.entitiesIncluded.characters.length > 0 ||
                                                      debugInfo.contextInjection.entitiesIncluded.worlds.length > 0 ||
                                                      debugInfo.contextInjection.entitiesIncluded.projects.length > 0) && (
                                                        <div>
                                                            <div className="text-xs text-muted-foreground mb-2">Entities Included</div>
                                                            <div className="space-y-1">
                                                                {debugInfo.contextInjection.entitiesIncluded.characters.map((name, idx) => (
                                                                    <div key={`char-${idx}`} className="text-xs bg-cyan-500/10 text-cyan-400 px-2 py-1 rounded flex items-center gap-1">
                                                                        <span>👤</span> {name}
                                                                    </div>
                                                                ))}
                                                                {debugInfo.contextInjection.entitiesIncluded.worlds.map((name, idx) => (
                                                                    <div key={`world-${idx}`} className="text-xs bg-blue-500/10 text-blue-400 px-2 py-1 rounded flex items-center gap-1">
                                                                        <span>🌍</span> {name}
                                                                    </div>
                                                                ))}
                                                                {debugInfo.contextInjection.entitiesIncluded.projects.map((name, idx) => (
                                                                    <div key={`proj-${idx}`} className="text-xs bg-orange-500/10 text-orange-400 px-2 py-1 rounded flex items-center gap-1">
                                                                        <span>📁</span> {name}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Fields Included */}
                                                    <div>
                                                        <div className="text-xs text-muted-foreground mb-2">Fields Per Entity Type</div>
                                                        {debugInfo.contextInjection.fieldsIncluded.character.length > 0 && (
                                                            <div className="mb-2">
                                                                <div className="text-xs text-cyan-400 mb-1">Character ({debugInfo.contextInjection.fieldsIncluded.character.length})</div>
                                                                <div className="flex flex-wrap gap-1">
                                                                    {debugInfo.contextInjection.fieldsIncluded.character.map((field, idx) => (
                                                                        <span key={idx} className="text-[10px] bg-cyan-500/10 text-cyan-300 px-1.5 py-0.5 rounded">
                                                                            {field}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                        {debugInfo.contextInjection.fieldsIncluded.world.length > 0 && (
                                                            <div className="mb-2">
                                                                <div className="text-xs text-blue-400 mb-1">World ({debugInfo.contextInjection.fieldsIncluded.world.length})</div>
                                                                <div className="flex flex-wrap gap-1">
                                                                    {debugInfo.contextInjection.fieldsIncluded.world.map((field, idx) => (
                                                                        <span key={idx} className="text-[10px] bg-blue-500/10 text-blue-300 px-1.5 py-0.5 rounded">
                                                                            {field}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                        {debugInfo.contextInjection.fieldsIncluded.project.length > 0 && (
                                                            <div className="mb-2">
                                                                <div className="text-xs text-orange-400 mb-1">Project ({debugInfo.contextInjection.fieldsIncluded.project.length})</div>
                                                                <div className="flex flex-wrap gap-1">
                                                                    {debugInfo.contextInjection.fieldsIncluded.project.map((field, idx) => (
                                                                        <span key={idx} className="text-[10px] bg-orange-500/10 text-orange-300 px-1.5 py-0.5 rounded">
                                                                            {field}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Truncated Fields */}
                                                    {debugInfo.contextInjection.truncatedFields.length > 0 && (
                                                        <div>
                                                            <div className="text-xs text-muted-foreground mb-2">Truncated Fields</div>
                                                            <div className="flex flex-wrap gap-1">
                                                                {debugInfo.contextInjection.truncatedFields.map((field, idx) => (
                                                                    <span key={idx} className="text-[10px] bg-yellow-500/10 text-yellow-300 px-1.5 py-0.5 rounded">
                                                                        ⚠ {field}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {activeTab === 'settings' && (
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold">Dev Mode Settings</h3>
                                    <div className="space-y-3 text-xs">
                                        <div className="p-3 bg-background/50 rounded border border-border">
                                            <div className="font-medium mb-1">Debug Information</div>
                                            <div className="text-muted-foreground">
                                                When enabled, the API returns detailed debug information including RAG retrieval details, context budget usage, and token statistics.
                                            </div>
                                        </div>
                                        <div className="p-3 bg-background/50 rounded border border-border">
                                            <div className="font-medium mb-1">Knowledge Bank</div>
                                            <div className="text-muted-foreground">
                                                Semantic search uses OpenAI embeddings for better relevance. Falls back to keyword matching if embeddings unavailable.
                                            </div>
                                        </div>
                                        <div className="p-3 bg-background/50 rounded border border-border">
                                            <div className="font-medium mb-1">RAG Priority</div>
                                            <div className="text-muted-foreground">
                                                Knowledge bank content has priority 70 (increased from 50) to ensure it's included in context when available.
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </>
            )}
        </div>
    );
}
