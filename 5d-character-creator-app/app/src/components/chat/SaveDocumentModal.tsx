'use client';

import React, { useState } from 'react';
import { X, Save, FileText } from 'lucide-react';
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
import { ImagePicker } from '@/components/ui/image-picker';
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

    React.useEffect(() => {
        if (isOpen) {
            setTitle(defaultTitle);
            setContent(defaultContent);
            setImageUrl(null);
            setImageSource(undefined);
        }
    }, [isOpen, defaultTitle, defaultContent]);

    const handleImageChange = (url: string | null, source?: 'ai-generated' | 'uploaded') => {
        setImageUrl(url);
        setImageSource(source);
    };

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

    const handleDialogOpenChange = (open: boolean) => {
        if (!open) {
            onClose();
        }
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
                <DialogContent 
                    showCloseButton={false}
                    className="max-w-[90vw] w-[90vw] sm:max-w-4xl bg-[#0c0c14] border-white/10"
                >
                    <DialogHeader className="relative">
                        <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2 pr-8">
                            <FileText className="w-6 h-6 text-primary" />
                            Save to {characterName}'s Documents
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Save this {documentType === 'script' ? 'script' : 'roleplay session'} to the character's document library
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

                        {/* Image Section - Using new ImagePicker component */}
                        <ImagePicker
                            value={imageUrl}
                            onChange={handleImageChange}
                            label="Document Image (Optional)"
                            placeholder={title || 'Document'}
                            aspectRatio="video"
                            size="md"
                        />
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

        </>
    );
}
