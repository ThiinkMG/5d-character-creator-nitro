'use client';

import { useState, useEffect, useRef } from 'react';
import { User, Upload, Wand2, Save, X, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { ImagePicker } from '@/components/ui/image-picker';
import { ImageGeneratorModal } from '@/components/gallery/ImageGeneratorModal';
import { type ImageProvider } from '@/types/image-config';

interface UserProfile {
    name: string;
    description: string;
    avatar: string;
}

const DEFAULT_AVATAR = '/app-image-assets/5d-logo-solo.png';

export default function ProfilePage() {
    const [profile, setProfile] = useState<UserProfile>({
        name: '',
        description: '',
        avatar: DEFAULT_AVATAR,
    });
    const [saved, setSaved] = useState(false);
    const [showImageGenerator, setShowImageGenerator] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load profile from localStorage on mount
    useEffect(() => {
        const savedProfile = localStorage.getItem('5d-user-profile');
        if (savedProfile) {
            try {
                const parsed = JSON.parse(savedProfile);
                setProfile({
                    name: parsed.name || '',
                    description: parsed.description || '',
                    avatar: parsed.avatar || DEFAULT_AVATAR,
                });
            } catch (e) {
                console.error('Failed to parse saved profile:', e);
            }
        }
    }, []);

    const handleSave = () => {
        localStorage.setItem('5d-user-profile', JSON.stringify(profile));
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleAvatarChange = (imageUrl: string) => {
        setProfile(prev => ({ ...prev, avatar: imageUrl }));
    };

    const handleFileSelect = (file: File) => {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                handleAvatarChange(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        
        const file = e.dataTransfer.files[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleGenerateAvatar = async (prompt: string, provider: ImageProvider): Promise<string | null> => {
        try {
            const savedConfig = typeof window !== 'undefined'
                ? JSON.parse(localStorage.getItem('5d-api-config') || '{}')
                : {};

            const response = await fetch('/api/generate-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(savedConfig.geminiKey && { 'x-gemini-key': savedConfig.geminiKey }),
                    ...(savedConfig.openaiKey && { 'x-openai-key': savedConfig.openaiKey }),
                    ...(savedConfig.dalleKey && { 'x-openai-key': savedConfig.dalleKey }),
                },
                body: JSON.stringify({ 
                    prompt: `Professional avatar portrait: ${prompt}. Clean, modern, suitable for profile picture.`,
                    provider 
                }),
            });

            const data = await response.json();

            if (response.ok && data.imageUrl) {
                const imageUrl: string = data.imageUrl;
                handleAvatarChange(imageUrl);
                setShowImageGenerator(false);
                return imageUrl;
            } else {
                throw new Error(data.error || 'Failed to generate image');
            }
        } catch (error) {
            console.error('Avatar generation error:', error);
            alert('Failed to generate avatar. Please try again.');
            return null;
        }
    };

    return (
        <div className="min-h-screen p-8 lg:p-12">
            <header className="mb-12">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-primary to-primary/40" />
                    <h1 className="text-3xl font-semibold tracking-tight">User Profile</h1>
                </div>
                <p className="text-muted-foreground text-base ml-5">
                    Customize your profile information and avatar
                </p>
            </header>

            <div className="max-w-2xl space-y-8">
                {/* Avatar Section - Social Media Style */}
                <section>
                    <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
                        Profile Picture
                    </h2>
                    <div className="glass-card rounded-xl p-8">
                        <div className="flex flex-col items-center gap-8">
                            {/* Large Avatar with Hover Overlay and Drag & Drop */}
                            <div
                                className={cn(
                                    "relative group transition-all duration-300",
                                    isDragging && "scale-105"
                                )}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                            >
                                <div className={cn(
                                    "relative w-40 h-40 rounded-full overflow-hidden border-4 border-primary/30 bg-gradient-to-br from-primary/20 to-primary/10 shadow-lg ring-4 ring-primary/10 transition-all duration-300",
                                    "group-hover:ring-primary/20 group-hover:scale-105",
                                    isDragging && "ring-primary/40 border-primary/50"
                                )}>
                                    <img
                                        src={profile.avatar}
                                        alt="Profile avatar"
                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
                                        }}
                                    />
                                    {/* Hover Overlay with Edit Button */}
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-full flex items-center justify-center cursor-pointer">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30">
                                                <Camera className="h-5 w-5 text-white" />
                                            </div>
                                            <span className="text-xs font-medium text-white">Change Photo</span>
                                        </div>
                                    </div>
                                    {/* Drag Overlay */}
                                    {isDragging && (
                                        <div className="absolute inset-0 bg-primary/40 backdrop-blur-sm rounded-full flex items-center justify-center z-20">
                                            <div className="flex flex-col items-center gap-2">
                                                <Upload className="h-8 w-8 text-white animate-bounce" />
                                                <span className="text-sm font-semibold text-white">Drop image here</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {/* Hidden File Input Trigger */}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    id="avatar-upload"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            handleFileSelect(file);
                                        }
                                    }}
                                />
                                <label
                                    htmlFor="avatar-upload"
                                    className="absolute inset-0 cursor-pointer rounded-full z-10"
                                />
                            </div>

                            {/* Action Buttons - Clean Layout */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full max-w-md">
                                {/* Upload Button */}
                                <Button
                                    onClick={() => fileInputRef.current?.click()}
                                    variant="outline"
                                    className="glass flex-1 h-11 font-medium hover:bg-primary/10 hover:border-primary/40 transition-all duration-200"
                                >
                                    <Upload className="h-4 w-4 mr-2" />
                                    Upload Photo
                                </Button>

                                {/* Generate with AI Button */}
                                <Button
                                    onClick={() => setShowImageGenerator(true)}
                                    variant="outline"
                                    className="glass flex-1 h-11 font-medium hover:bg-primary/10 hover:border-primary/40 transition-all duration-200"
                                >
                                    <Wand2 className="h-4 w-4 mr-2" />
                                    Generate with AI
                                </Button>
                            </div>

                            {/* Secondary Actions */}
                            <div className="flex items-center gap-4 pt-2">
                                <button
                                    onClick={() => handleAvatarChange(DEFAULT_AVATAR)}
                                    className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-200 underline-offset-4 hover:underline"
                                >
                                    Reset to Default
                                </button>
                                <span className="text-xs text-muted-foreground">•</span>
                                <span className="text-xs text-muted-foreground">
                                    Recommended: Square image, at least 400x400px
                                </span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Profile Information */}
                <section>
                    <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
                        Profile Information
                    </h2>
                    <div className="space-y-4">
                        <div className="glass-card rounded-xl p-5">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <User className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-sm">Display Name</h3>
                                    <p className="text-xs text-muted-foreground">This name appears in chat messages</p>
                                </div>
                            </div>
                            <Input
                                value={profile.name}
                                onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Enter your name"
                                className="bg-background/50"
                            />
                        </div>

                        <div className="glass-card rounded-xl p-5">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <User className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-sm">Description</h3>
                                    <p className="text-xs text-muted-foreground">Tell us about yourself (optional)</p>
                                </div>
                            </div>
                            <Textarea
                                value={profile.description}
                                onChange={(e) => setProfile(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Write a brief description about yourself..."
                                className="bg-background/50 min-h-[100px]"
                                rows={4}
                            />
                        </div>
                    </div>
                </section>

                {/* Actions */}
                <div className="flex items-center gap-4">
                    <Button onClick={handleSave} className="premium-button">
                        {saved ? (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                Saved!
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                Save Profile
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* AI Image Generator Modal */}
            {showImageGenerator && (
                <ImageGeneratorModal
                    isOpen={showImageGenerator}
                    onClose={() => setShowImageGenerator(false)}
                    onGenerate={handleGenerateAvatar}
                    onUpload={(dataUrl) => {
                        handleAvatarChange(dataUrl);
                        setShowImageGenerator(false);
                    }}
                    itemName="avatar"
                    initialMode="generate"
                />
            )}
        </div>
    );
}
