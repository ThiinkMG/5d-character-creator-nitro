'use client';

import { useState } from 'react';
import { X, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChatSession } from '@/types/chat';

interface LogSessionModalProps {
    isOpen: boolean;
    onClose: () => void;
    session: ChatSession | null;
    onLogged?: (path: string) => void;
}

export function LogSessionModal({ isOpen, onClose, session, onLogged }: LogSessionModalProps) {
    const [summary, setSummary] = useState('');
    const [problems, setProblems] = useState('');
    const [solutions, setSolutions] = useState('');
    const [status, setStatus] = useState('In Progress');
    const [nextSteps, setNextSteps] = useState('');
    const [confidence, setConfidence] = useState('');
    const [recommendations, setRecommendations] = useState('');
    const [isLogging, setIsLogging] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen || !session) return null;

    const handleLog = async () => {
        if (!summary.trim()) {
            setError('Summary is required');
            return;
        }

        setIsLogging(true);
        setError(null);

        try {
            // Format chat transcript
            const transcript = session.messages.map(msg => {
                const role = msg.role === 'user' ? 'User' : 'Assistant';
                const timestamp = new Date().toISOString(); // Could use actual timestamps if available
                return `**[${role}]**\n${msg.content}\n`;
            }).join('\n---\n\n');

            const response = await fetch('/api/session/log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: session.id,
                    summary: summary.trim(),
                    problems: problems.trim() || 'None documented',
                    solutions: solutions.trim() || 'N/A',
                    status: status.trim() || 'In Progress',
                    nextSteps: nextSteps.trim() || 'Continue development',
                    confidence: confidence.trim() || 'N/A',
                    recommendations: recommendations.trim() || 'None',
                    content: transcript,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to log session');
            }

            const data = await response.json();
            
            if (onLogged) {
                onLogged(data.path);
            }

            // Reset form
            setSummary('');
            setProblems('');
            setSolutions('');
            setStatus('In Progress');
            setNextSteps('');
            setConfidence('');
            setRecommendations('');
            
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to log session');
        } finally {
            setIsLogging(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="relative w-full max-w-2xl max-h-[90vh] bg-background/95 backdrop-blur-xl border border-border rounded-xl shadow-2xl flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-primary" />
                        <h2 className="text-xl font-semibold">Log Chat Session</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-white/5"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Summary <span className="text-red-400">*</span>
                        </label>
                        <textarea
                            value={summary}
                            onChange={(e) => setSummary(e.target.value)}
                            placeholder="Brief 1-sentence overview of this session..."
                            className="w-full px-3 py-2 bg-background/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                            rows={2}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Problems Encountered</label>
                        <textarea
                            value={problems}
                            onChange={(e) => setProblems(e.target.value)}
                            placeholder="Specific errors, bugs, or blockers encountered..."
                            className="w-full px-3 py-2 bg-background/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                            rows={3}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Solutions & Key Decisions</label>
                        <textarea
                            value={solutions}
                            onChange={(e) => setSolutions(e.target.value)}
                            placeholder="How problems were fixed or decisions made..."
                            className="w-full px-3 py-2 bg-background/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                            rows={3}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Current Status</label>
                            <input
                                type="text"
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                placeholder="In Progress"
                                className="w-full px-3 py-2 bg-background/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Confidence Score</label>
                            <input
                                type="text"
                                value={confidence}
                                onChange={(e) => setConfidence(e.target.value)}
                                placeholder="e.g., 85%"
                                className="w-full px-3 py-2 bg-background/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Next Steps & Action Items</label>
                        <textarea
                            value={nextSteps}
                            onChange={(e) => setNextSteps(e.target.value)}
                            placeholder="Tasks for next session..."
                            className="w-full px-3 py-2 bg-background/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                            rows={3}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">AI Recommendations</label>
                        <textarea
                            value={recommendations}
                            onChange={(e) => setRecommendations(e.target.value)}
                            placeholder="AI-suggested features or improvements..."
                            className="w-full px-3 py-2 bg-background/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                            rows={2}
                        />
                    </div>

                    <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm text-muted-foreground">
                        <strong>Session Info:</strong> {session.messages.length} messages • Mode: {session.mode} • Created: {new Date(session.createdAt).toLocaleDateString()}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        disabled={isLogging}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleLog}
                        disabled={isLogging || !summary.trim()}
                        className="gap-2"
                    >
                        {isLogging ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Logging...
                            </>
                        ) : (
                            <>
                                <FileText className="h-4 w-4" />
                                Log Session
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
