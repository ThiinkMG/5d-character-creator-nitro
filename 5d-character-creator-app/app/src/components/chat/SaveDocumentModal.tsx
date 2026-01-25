'use client';

import React, { useState } from 'react';
import { X, Save, FileText, Wand2, Upload, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { CharacterDocument } from '@/types/document';
import { ImageGeneratorModal } from '@/components/gallery';
import { ImageProvider } from '@/types/image-config';
import { cn } from '@/lib/utils';

interface SaveDocumentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (doc: CharacterDocument) => void;
    defaultTitle: string;
    defaultContent: string;
    documentType: 'script' | 'roleplay';
    characterId: string;
    characterName: string;
}

export function SaveDocumentModal({
    isOpen,
    onClose,
    onSave,
    defaultTitle,
    defaultContent,
    documentType,
    characterId,
    characterName
}: SaveDocumentModalProps) {
    const [title, setTitle] = useState(defaultTitle);
    const [content, setContent] = useState(defaultContent);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [imageSource, setImageSource] = useState<'ai-generated' | 'uploaded' | 'preset' | undefined>(undefined);
    const [imageModalOpen, setImageModalOpen] = useState(false);
    const [imageModalMode, setImageModalMode] = useState<'generate' | 'upload'>('generate');

    React.useEffect(() => {
        if (isOpen) {
            setTitle(defaultTitle);
            setContent(defaultContent);
            setImageUrl(null);
            setImageSource(undefined);
        }
    }, [isOpen, defaultTitle, defaultContent]);

    const handleSave = () => {
        if (!title.trim()) {
            alert('Please enter a title');
            return;
        }

        const doc: CharacterDocument = {
            id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            characterId,
            type: documentType,
            title: title.trim(),
            content: content.trim(),
            thumbnail: imageUrl || undefined,
            image: imageUrl || undefined,
            imageSource,
            createdAt: new Date(),
            updatedAt: new Date(),
            metadata: {}
        };

        onSave(doc);
        onClose();
    };

    const handleGenerateImage = async (prompt: string, provider: ImageProvider) => {
        try {
            const savedConfig = JSON.parse(localStorage.getItem('5d-api-config') || '{}');
            const apiKey = provider === 'openai' ? savedConfig.openaiKey : savedConfig.anthropicKey;

            const response = await fetch('/api/generate-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, provider, apiKey }),
            });

            if (response.ok) {
                const data = await response.json();
                if (data.imageUrl) {
                    setImageUrl(data.imageUrl);
                    setImageSource('ai-generated');
                }
            }
        } catch (error) {
            console.error('Failed to generate image:', error);
        } finally {
            setImageModalOpen(false);
        }
    };

    const handleUploadImage = (dataUrl: string) => {
        setImageUrl(dataUrl);
        setImageSource('uploaded');
        setImageModalOpen(false);
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-2xl bg-[#0c0c14] border-white/10">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
                            <FileText className="w-6 h-6 text-primary" />
                            Save to {characterName}'s Documents
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Save this {documentType === 'script' ? 'script' : 'roleplay session'} to the character's document library
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 mt-4">
                        {/* Title Input */}
                        <div>
                            <label className="text-sm font-medium text-white mb-2 block">
                                Document Title
                            </label>
                            <Input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder={`${documentType === 'script' ? 'Script' : 'Roleplay'} Title`}
                                className="bg-white/5 border-white/10 text-white"
                                autoFocus
                            />
                        </div>

                        {/* Content Preview/Edit */}
                        <div>
                            <label className="text-sm font-medium text-white mb-2 block">
                                Content
                            </label>
                            <div className="bg-white/5 border border-white/10 rounded-lg p-4 max-h-64 overflow-y-auto">
                                <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-mono">
                                    {content.slice(0, 500)}{content.length > 500 ? '...' : ''}
                                </pre>
                                {content.length > 500 && (
                                    <p className="text-xs text-muted-foreground mt-2">
                                        {content.length} characters total
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Image Section */}
                        <div>
                            <label className="text-sm font-medium text-white mb-2 block">
                                Document Image (Optional)
                            </label>
                            <div className="flex items-center gap-3">
                                {imageUrl ? (
                                    <div className="relative group">
                                        <img
                                            src={imageUrl}
                                            alt="Document thumbnail"
                                            className="w-32 h-20 object-cover rounded-lg border border-white/10"
                                        />
                                        <button
                                            onClick={() => {
                                                setImageUrl(null);
                                                setImageSource(undefined);
                                            }}
                                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="w-4 h-4 text-white" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="w-32 h-20 rounded-lg border border-dashed border-white/20 flex items-center justify-center bg-white/5">
                                        <ImageIcon className="w-6 h-6 text-muted-foreground" />
                                    </div>
                                )}
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setImageModalMode('generate');
                                            setImageModalOpen(true);
                                        }}
                                        className="bg-white/5 border-white/10 hover:bg-white/10"
                                    >
                                        <Wand2 className="w-4 h-4 mr-2" />
                                        Generate
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setImageModalMode('upload');
                                            setImageModalOpen(true);
                                        }}
                                        className="bg-white/5 border-white/10 hover:bg-white/10"
                                    >
                                        <Upload className="w-4 h-4 mr-2" />
                                        Upload
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="mt-6">
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            className="text-muted-foreground hover:text-white"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            className="bg-primary hover:bg-primary/90 text-white"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            Save Document
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ImageGeneratorModal
                isOpen={imageModalOpen}
                onClose={() => setImageModalOpen(false)}
                onGenerate={handleGenerateImage}
                onUpload={handleUploadImage}
                itemName={title || 'Document'}
                initialMode={imageModalMode}
            />
        </>
    );
}
