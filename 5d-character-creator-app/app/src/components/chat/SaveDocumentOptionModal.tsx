'use client';

import React, { useState } from 'react';
import { FileText, MessageSquare, Sparkles, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ChatSession } from '@/types/chat';
import { cn } from '@/lib/utils';

interface SaveDocumentOptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectOption: (option: 'whole' | 'generated') => void;
    documentType: 'script' | 'roleplay';
    characterName: string;
    session: ChatSession | null;
    isProcessing?: boolean;
}

export function SaveDocumentOptionModal({
    isOpen,
    onClose,
    onSelectOption,
    documentType,
    characterName,
    session,
    isProcessing = false
}: SaveDocumentOptionModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent 
                showCloseButton={false}
                className="max-w-[90vw] w-[90vw] sm:max-w-4xl bg-[#0c0c14] border-white/10"
            >
                <DialogHeader className="relative">
                    <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2 pr-8">
                        <FileText className="w-6 h-6 text-primary" />
                        Save {documentType === 'script' ? 'Script' : 'Roleplay'} Document
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Choose how you want to save this {documentType === 'script' ? 'script' : 'roleplay session'} to {characterName}'s document library
                    </DialogDescription>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="absolute top-0 right-0 h-8 w-8 p-0 text-muted-foreground hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors"
                        title="Close"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </DialogHeader>

                <div className="space-y-4 mt-6">
                    {/* Save Whole Chat Option */}
                    <button
                        onClick={() => onSelectOption('whole')}
                        disabled={isProcessing}
                        className={cn(
                            "w-full p-6 rounded-xl border-2 transition-all text-left",
                            "bg-white/5 border-white/10 hover:border-primary/50 hover:bg-white/10",
                            "disabled:opacity-50 disabled:cursor-not-allowed",
                            "group"
                        )}
                    >
                        <div className="flex items-start gap-4">
                            <div className="p-3 rounded-lg bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
                                <MessageSquare className="w-6 h-6 text-blue-400" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-white mb-2">
                                    Save Whole Chat
                                </h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Save the complete conversation including all messages, setup details, and metadata. 
                                    This preserves the full context of your {documentType === 'script' ? 'script creation' : 'roleplay'} session.
                                </p>
                                {session && (
                                    <div className="mt-3 text-xs text-muted-foreground">
                                        {session.messages.length} message{session.messages.length !== 1 ? 's' : ''} • {new Date(session.createdAt).toLocaleDateString()}
                                    </div>
                                )}
                            </div>
                        </div>
                    </button>

                    {/* Save Generated Content Only Option */}
                    <button
                        onClick={() => onSelectOption('generated')}
                        disabled={isProcessing}
                        className={cn(
                            "w-full p-6 rounded-xl border-2 transition-all text-left",
                            "bg-white/5 border-white/10 hover:border-primary/50 hover:bg-white/10",
                            "disabled:opacity-50 disabled:cursor-not-allowed",
                            "group"
                        )}
                    >
                        <div className="flex items-start gap-4">
                            <div className="p-3 rounded-lg bg-violet-500/20 group-hover:bg-violet-500/30 transition-colors">
                                <Sparkles className="w-6 h-6 text-violet-400" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                                    Save Generated Content Only
                                    {isProcessing && (
                                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                    )}
                                </h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Extract and convert only the {documentType === 'script' ? 'script content' : 'roleplay content'} generated by the AI. 
                                    The AI will process the conversation and create a clean, formatted document with just the {documentType === 'script' ? 'script' : 'roleplay'} content, 
                                    removing setup messages and metadata.
                                </p>
                                {isProcessing && (
                                    <div className="mt-3 text-xs text-primary">
                                        Processing content with AI...
                                    </div>
                                )}
                            </div>
                        </div>
                    </button>
                </div>

                <div className="mt-6 flex justify-end">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        disabled={isProcessing}
                        className="text-muted-foreground hover:text-white"
                    >
                        Cancel
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
