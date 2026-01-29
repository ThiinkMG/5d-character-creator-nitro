'use client';

/**
 * ChatAttachments Component
 * 
 * Displays and manages file attachments for chat sessions
 */

import React, { useState } from 'react';
import { X, Paperclip, Image as ImageIcon, FileText, Video, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/lib/store';
import { UserAsset } from '@/types/user-asset';
import { FileUpload } from '@/components/media/FileUpload';
import { Button } from '@/components/ui/button';
import { ChatSession } from '@/types/chat';

interface ChatAttachmentsProps {
    chatSessionId: string | null;
    className?: string;
    onCreateSession?: (sessionId: string) => void;
}

export function ChatAttachments({ chatSessionId, className, onCreateSession }: ChatAttachmentsProps) {
    const { 
        getChatSession, 
        getUserAsset, 
        attachAssetToChat, 
        detachAssetFromChat,
        getUserAssets,
        addUserAsset,
        addChatSession
    } = useStore();
    
    const [showUpload, setShowUpload] = useState(false);
    
    // Create session if it doesn't exist
    const ensureSession = (): string => {
        if (chatSessionId) {
            return chatSessionId;
        }
        
        // Create a new session
        const newSession: ChatSession = {
            id: `session-${Date.now()}`,
            title: 'New Chat',
            lastMessage: '',
            updatedAt: new Date(),
            createdAt: new Date(),
            messages: [],
            mode: 'chat',
            attachments: []
        };
        
        addChatSession(newSession);
        if (onCreateSession) {
            onCreateSession(newSession.id);
        }
        return newSession.id;
    };
    
    const session = chatSessionId ? getChatSession(chatSessionId) : null;
    const attachedAssetIds = session?.attachments || [];
    const attachedAssets = attachedAssetIds
        .map(id => getUserAsset(id))
        .filter((asset): asset is UserAsset => asset !== undefined);

    const handleUpload = (assets: UserAsset[]) => {
        const sessionId = ensureSession();
        assets.forEach(asset => {
            addUserAsset(asset);
            attachAssetToChat(sessionId, asset.id);
        });
        setShowUpload(false);
    };

    const handleDetach = (assetId: string) => {
        if (!chatSessionId) return;
        detachAssetFromChat(chatSessionId, assetId);
    };

    const handleShowUpload = () => {
        // Ensure session exists before showing upload
        if (!chatSessionId) {
            ensureSession();
        }
        setShowUpload(true);
    };

    if (attachedAssets.length === 0 && !showUpload) {
        return (
            <div className={cn("flex items-center gap-2", className)}>
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleShowUpload}
                    className="text-white/70 hover:text-white"
                >
                    <Paperclip className="w-4 h-4 mr-2" />
                    Attach Files
                </Button>
            </div>
        );
    }

    return (
        <div className={cn("space-y-3", className)}>
            {/* Attached Files */}
            {attachedAssets.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {attachedAssets.map((asset) => (
                        <div
                            key={asset.id}
                            className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg group"
                        >
                            {asset.type === 'image' && asset.thumbnailUrl ? (
                                <img
                                    src={asset.thumbnailUrl}
                                    alt={asset.altText || asset.name}
                                    className="w-8 h-8 object-cover rounded"
                                />
                            ) : asset.type === 'image' ? (
                                <ImageIcon className="w-4 h-4 text-white/60" />
                            ) : asset.type === 'document' ? (
                                <FileText className="w-4 h-4 text-white/60" />
                            ) : (
                                <Video className="w-4 h-4 text-white/60" />
                            )}
                            <span className="text-xs text-white/80 max-w-[150px] truncate">
                                {asset.name}
                            </span>
                            <button
                                onClick={() => handleDetach(asset.id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-white/40 hover:text-white"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Upload UI */}
            {showUpload && (
                <div className="border border-white/10 rounded-lg p-4 bg-white/5">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-white">Attach Files</h4>
                        <button
                            onClick={() => setShowUpload(false)}
                            className="text-white/40 hover:text-white"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <FileUpload
                        onUpload={handleUpload}
                        multiple={true}
                        maxFiles={10}
                    />
                </div>
            )}

            {/* Add More Button */}
            {!showUpload && attachedAssets.length > 0 && (
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleShowUpload}
                    className="text-white/70 hover:text-white"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add More Files
                </Button>
            )}
        </div>
    );
}
