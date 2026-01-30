'use client';

/**
 * ChatAttachments Component
 * 
 * Displays and manages file attachments for chat sessions
 */

import React, { useState } from 'react';
import { X, Paperclip, Image as ImageIcon, FileText, Video, Plus, FolderOpen, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/lib/store';
import { UserAsset } from '@/types/user-asset';
import { FileUpload } from '@/components/media/FileUpload';
import { AssetPicker } from '@/components/media/AssetPicker';
import { VisionAnalysisButton } from '@/components/media/VisionAnalysisButton';
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
        addChatSession,
        userAssets
    } = useStore();
    
    const [showUpload, setShowUpload] = useState(false);
    const [showPicker, setShowPicker] = useState(false);
    const [uploadMode, setUploadMode] = useState<'upload' | 'browse'>('upload');
    
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
        setUploadMode('upload');
    };

    const handleShowPicker = () => {
        // Ensure session exists before showing picker
        if (!chatSessionId) {
            ensureSession();
        }
        setShowUpload(true);
        setUploadMode('browse');
    };

    const handlePickerSelect = (assets: UserAsset[]) => {
        const sessionId = ensureSession();
        assets.forEach(asset => {
            // Add to store if it's a new asset (converted from media item)
            if (!userAssets.find(a => a.id === asset.id)) {
                addUserAsset(asset);
            }
            attachAssetToChat(sessionId, asset.id);
        });
        setShowUpload(false);
        setShowPicker(false);
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
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleShowPicker}
                    className="text-white/70 hover:text-white"
                >
                    <FolderOpen className="w-4 h-4 mr-2" />
                    Browse Assets
                </Button>
            </div>
        );
    }

    return (
        <div className={cn("space-y-3", className)}>
            {/* Attached Files */}
            {attachedAssets.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {attachedAssets.map((asset) => {
                        // Check if image is missing dataUrl (will cause vision issues)
                        const isMissingData = asset.type === 'image' && !asset.dataUrl;
                        
                        return (
                            <div
                                key={asset.id}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-2 bg-white/5 border rounded-lg group",
                                    isMissingData 
                                        ? "border-yellow-500/50 bg-yellow-500/5" 
                                        : "border-white/10"
                                )}
                                title={isMissingData ? "Image data missing - AI may not see this image. Try re-uploading." : undefined}
                            >
                                {asset.type === 'image' && asset.thumbnailUrl ? (
                                    <div className="relative">
                                        <img
                                            src={asset.thumbnailUrl}
                                            alt={asset.altText || asset.name}
                                            className="w-8 h-8 object-cover rounded"
                                        />
                                        {isMissingData && (
                                            <AlertTriangle className="w-3 h-3 text-yellow-500 absolute -top-1 -right-1" />
                                        )}
                                    </div>
                                ) : asset.type === 'image' ? (
                                    <div className="relative">
                                        <ImageIcon className="w-4 h-4 text-white/60" />
                                        {isMissingData && (
                                            <AlertTriangle className="w-3 h-3 text-yellow-500 absolute -top-1 -right-1" />
                                        )}
                                    </div>
                                ) : asset.type === 'document' ? (
                                    <FileText className="w-4 h-4 text-white/60" />
                                ) : (
                                    <Video className="w-4 h-4 text-white/60" />
                                )}
                                <span className={cn(
                                    "text-xs max-w-[150px] truncate",
                                    isMissingData ? "text-yellow-400" : "text-white/80"
                                )}>
                                    {asset.name}
                                </span>
                                {isMissingData && (
                                    <span className="text-[10px] text-yellow-500" title="Re-upload image">
                                        ⚠
                                    </span>
                                )}
                                {asset.type === 'image' && !isMissingData && (
                                    <VisionAnalysisButton asset={asset} size="sm" />
                                )}
                                <button
                                    onClick={() => handleDetach(asset.id)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-white/40 hover:text-white"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Upload/Browse UI */}
            {showUpload && (
                <div className="border border-white/10 rounded-lg overflow-hidden bg-white/5">
                    {/* Tabs */}
                    <div className="flex border-b border-white/10">
                        <button
                            onClick={() => setUploadMode('upload')}
                            className={cn(
                                "flex-1 px-4 py-2 text-sm font-medium transition-colors",
                                uploadMode === 'upload'
                                    ? "bg-white/10 text-white border-b-2 border-primary"
                                    : "text-white/60 hover:text-white/80"
                            )}
                        >
                            <Paperclip className="w-4 h-4 inline mr-2" />
                            Upload New
                        </button>
                        <button
                            onClick={() => setUploadMode('browse')}
                            className={cn(
                                "flex-1 px-4 py-2 text-sm font-medium transition-colors",
                                uploadMode === 'browse'
                                    ? "bg-white/10 text-white border-b-2 border-primary"
                                    : "text-white/60 hover:text-white/80"
                            )}
                        >
                            <FolderOpen className="w-4 h-4 inline mr-2" />
                            Browse Existing
                        </button>
                        <button
                            onClick={() => {
                                setShowUpload(false);
                                setShowPicker(false);
                            }}
                            className="px-4 py-2 text-white/40 hover:text-white transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                        {uploadMode === 'upload' ? (
                            <FileUpload
                                onUpload={handleUpload}
                                multiple={true}
                                maxFiles={10}
                            />
                        ) : (
                            <div className="h-[400px]">
                                <AssetPicker
                                    onSelect={handlePickerSelect}
                                    onCancel={() => {
                                        setShowUpload(false);
                                        setShowPicker(false);
                                    }}
                                    maxSelections={10}
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Add More Buttons */}
            {!showUpload && attachedAssets.length > 0 && (
                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleShowUpload}
                        className="text-white/70 hover:text-white"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Upload More
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleShowPicker}
                        className="text-white/70 hover:text-white"
                    >
                        <FolderOpen className="w-4 h-4 mr-2" />
                        Browse Assets
                    </Button>
                </div>
            )}
        </div>
    );
}
