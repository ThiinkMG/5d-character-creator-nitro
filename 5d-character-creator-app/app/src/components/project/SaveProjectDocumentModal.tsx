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
import { ProjectDocument, ProjectDocumentType } from '@/types/document';
import { ImagePicker } from '@/components/ui/image-picker';
import { cn } from '@/lib/utils';

interface SaveProjectDocumentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (doc: ProjectDocument) => void;
    defaultTitle: string;
    defaultContent: string;
    documentType: ProjectDocumentType;
    projectId: string;
    projectName: string;
}

export function SaveProjectDocumentModal({
    isOpen,
    onClose,
    onSave,
    defaultTitle,
    defaultContent,
    documentType,
    projectId,
    projectName
}: SaveProjectDocumentModalProps) {
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

        const doc: ProjectDocument = {
            id: `proj_doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            projectId,
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
                    className="max-w-[90vw] w-[90vw] sm:max-w-5xl max-h-[90vh] overflow-y-auto bg-[#0c0c14] border-white/10"
                >
                    <DialogHeader className="relative">
                        <DialogTitle className="text-2xl font-bold text-white pr-8">
                            Save Project Document
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Save this content as a document for {projectName}
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

                    <div className="space-y-6 py-4">
                        {/* Title Input */}
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-2">
                                Document Title
                            </label>
                            <Input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter document title..."
                                className="premium-input"
                            />
                        </div>

                        {/* Content Editor */}
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-2">
                                Content
                            </label>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Document content..."
                                className="w-full h-96 px-4 py-3 rounded-xl premium-input resize-none font-mono text-sm"
                            />
                        </div>

                        {/* Image Section - Using new ImagePicker component */}
                        <ImagePicker
                            value={imageUrl}
                            onChange={handleImageChange}
                            label="Document Image (Optional)"
                            placeholder={title || projectName}
                            aspectRatio="video"
                            size="md"
                        />
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={onClose} className="glass">
                            Cancel
                        </Button>
                        <Button onClick={handleSave} className="bg-cyan-600 hover:bg-cyan-500 text-white">
                            <Save className="w-4 h-4 mr-2" />
                            Save Document
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </>
    );
}
