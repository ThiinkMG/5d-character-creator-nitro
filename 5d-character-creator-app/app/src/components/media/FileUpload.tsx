'use client';

/**
 * FileUpload Component
 * 
 * Drag-and-drop file upload component for user assets
 * Supports images, documents, and videos
 */

import React, { useCallback, useState } from 'react';
import { Upload, X, FileText, Image as ImageIcon, Video, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { processUploadedFile, isFileSupported } from '@/lib/file-upload';
import { UserAsset } from '@/types/user-asset';
import { Button } from '@/components/ui/button';

interface FileUploadProps {
    onUpload: (assets: UserAsset[]) => void;
    accept?: string;
    multiple?: boolean;
    maxFiles?: number;
    className?: string;
    disabled?: boolean;
}

export function FileUpload({
    onUpload,
    accept,
    multiple = true,
    maxFiles,
    className,
    disabled = false
}: FileUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);
    const [successCount, setSuccessCount] = useState(0);

    const handleFiles = useCallback(async (files: FileList | File[]) => {
        const fileArray = Array.from(files);
        
        if (maxFiles && fileArray.length > maxFiles) {
            setErrors([`Maximum ${maxFiles} file(s) allowed`]);
            return;
        }

        setUploading(true);
        setErrors([]);
        setSuccessCount(0);

        const processedAssets: UserAsset[] = [];
        const newErrors: string[] = [];

        for (const file of fileArray) {
            try {
                if (!isFileSupported(file)) {
                    newErrors.push(`${file.name}: Unsupported file type or too large (max 50MB)`);
                    continue;
                }

                const processed = await processUploadedFile(file);
                const asset: UserAsset = {
                    ...processed,
                    id: `asset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    uploadedAt: new Date(),
                    updatedAt: new Date(),
                };

                processedAssets.push(asset);
                setSuccessCount(processedAssets.length);
            } catch (error) {
                newErrors.push(`${file.name}: ${error instanceof Error ? error.message : 'Upload failed'}`);
            }
        }

        setUploading(false);
        setErrors(newErrors);

        if (processedAssets.length > 0) {
            onUpload(processedAssets);
            // Clear success count after a delay
            setTimeout(() => setSuccessCount(0), 2000);
        }
    }, [onUpload, maxFiles]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) {
            setIsDragging(true);
        }
    }, [disabled]);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (disabled) return;

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFiles(files);
        }
    }, [handleFiles, disabled]);

    const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFiles(files);
        }
        // Reset input so same file can be selected again
        e.target.value = '';
    }, [handleFiles]);

    return (
        <div className={cn("w-full", className)}>
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                    "relative border-2 border-dashed rounded-xl p-8 transition-all duration-200",
                    isDragging && !disabled
                        ? "border-primary bg-primary/10"
                        : "border-white/20 bg-white/5 hover:border-white/30",
                    disabled && "opacity-50 cursor-not-allowed",
                    uploading && "pointer-events-none"
                )}
            >
                <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    accept={accept || "image/*,application/pdf,text/*,video/*"}
                    multiple={multiple}
                    onChange={handleFileInput}
                    disabled={disabled || uploading}
                />

                <div className="flex flex-col items-center justify-center text-center">
                    {uploading ? (
                        <>
                            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                            <p className="text-sm text-white/80">
                                Uploading {successCount > 0 && `${successCount} file(s)...`}
                            </p>
                        </>
                    ) : (
                        <>
                            <Upload className="w-12 h-12 text-white/40 mb-4" />
                            <p className="text-sm font-medium text-white mb-1">
                                Drag and drop files here, or click to browse
                            </p>
                            <p className="text-xs text-white/60 mb-4">
                                Supports images, documents (PDF, TXT, MD), and videos (max 50MB)
                            </p>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => document.getElementById('file-upload')?.click()}
                                disabled={disabled}
                                className="mt-2"
                            >
                                <Upload className="w-4 h-4 mr-2" />
                                Select Files
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Error Messages */}
            {errors.length > 0 && (
                <div className="mt-4 space-y-2">
                    {errors.map((error, index) => (
                        <div
                            key={index}
                            className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
                        >
                            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                            <p className="text-sm text-red-400 flex-1">{error}</p>
                            <button
                                onClick={() => setErrors(errors.filter((_, i) => i !== index))}
                                className="text-red-400 hover:text-red-300"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Success Message */}
            {successCount > 0 && !uploading && errors.length === 0 && (
                <div className="mt-4 flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    <p className="text-sm text-green-400">
                        Successfully uploaded {successCount} file(s)
                    </p>
                </div>
            )}
        </div>
    );
}
