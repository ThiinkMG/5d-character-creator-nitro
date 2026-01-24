'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import {
    Plus,
    Upload,
    Sparkles,
    Settings,
    Image as ImageIcon,
    ChevronRight,
    Wand2,
    Globe,
    Search,
    Filter,
    MoreHorizontal,
    Trash2,
    FolderCog,
    Folder,
    Check,
    CheckSquare,
    Eye,
    EyeOff,
    FileText,
    Copy,
    ArrowRightLeft,
    X,
    ArrowUpDown,
    ChevronDown
} from 'lucide-react';
import { ImageGeneratorModal, ProjectSettingsModal } from '@/components/gallery';
import { SmartFilterPanel } from '@/components/ui/smart-filter';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Pagination } from '@/components/ui/pagination';
import { ViewToggle, useViewMode } from '@/components/ui/view-toggle';
import { World } from '@/types/world';
import { cn } from '@/lib/utils';
import { ImageProvider } from '@/types/image-config';

// =============================================================================
// DISPLAY SETTINGS TYPE
// =============================================================================

interface DisplaySettings {
    showProjectName: boolean;
    showImage: boolean;
    showDescription: boolean;
}

// =============================================================================
// GALLERY CARD COMPONENT (WORLD VARIANT)
// =============================================================================

interface GalleryCardProps {
    item: World;
    projectName?: string;
    onClick: () => void;
    onImageChange: (itemId: string, action: 'upload' | 'generate') => void;
    onDelete: (itemId: string) => void;
    onProjectSettings: (itemId: string) => void;
    isSelected?: boolean;
    onSelect?: (itemId: string) => void;
    displaySettings: DisplaySettings;
}

const GalleryCard: React.FC<GalleryCardProps> = ({
    item,
    projectName,
    onClick,
    onImageChange,
    onDelete,
    onProjectSettings,
    isSelected = false,
    onSelect,
    displaySettings
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);

    const size = item.cardSize || 'medium';

    const sizeClasses = {
        small: 'col-span-1 row-span-1',
        medium: 'col-span-1 row-span-1 md:col-span-1 md:row-span-1',
        large: 'col-span-2 row-span-2',
        wide: 'col-span-2 row-span-1',
        tall: 'col-span-1 row-span-2'
    };

    return (
        <div
            className={cn(
                "group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-500",
                sizeClasses[size],
                isSelected && "ring-2 ring-violet-500 ring-offset-2 ring-offset-[#08080c]"
            )}
            style={{
                background: 'linear-gradient(135deg, rgba(20, 20, 28, 0.8) 0%, rgba(12, 12, 18, 0.9) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                minHeight: size === 'tall' ? '400px' : size === 'small' ? '180px' : '200px'
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={onClick}
        >
            {/* Image Container */}
            <div className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0c0c12] to-[#08080c] flex items-center justify-center">
                    {!item.imageUrl && <Globe className="w-8 h-8 text-white/10" />}
                </div>

                {displaySettings.showImage && item.imageUrl && (
                    <img
                        src={item.imageUrl}
                        alt={item.name}
                        className={cn(
                            "w-full h-full object-cover transition-all duration-700",
                            imageLoaded ? 'opacity-100' : 'opacity-0',
                            isHovered ? 'scale-105' : 'scale-100'
                        )}
                        onLoad={() => setImageLoaded(true)}
                    />
                )}

                <div
                    className="absolute inset-0"
                    style={{
                        background: `linear-gradient(to top, 
              rgba(8, 8, 12, 0.95) 0%, 
              rgba(8, 8, 12, 0.6) 30%, 
              rgba(8, 8, 12, 0.2) 60%,
              transparent 100%)`
                    }}
                />

                <div
                    className={cn(
                        "absolute inset-0 transition-all duration-500",
                        isHovered ? 'opacity-100' : 'opacity-0'
                    )}
                    style={{
                        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, transparent 50%)'
                    }}
                />
            </div>

            {/* Content */}
            <div className="relative h-full flex flex-col justify-between p-4 md:p-5">

                {/* Top Row */}
                <div className="flex items-start justify-between">
                    {/* Left Side: Selection + Project Badge */}
                    <div className="flex items-center gap-2">
                        {/* Selection Checkbox */}
                        <div
                            className={cn(
                                "transition-all duration-300",
                                isHovered || isSelected ? 'opacity-100' : 'opacity-0'
                            )}
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelect?.(item.id);
                            }}
                        >
                            <div
                                className={cn(
                                    "w-6 h-6 rounded-lg flex items-center justify-center transition-all border",
                                    isSelected
                                        ? "bg-violet-500 border-violet-500 text-white"
                                        : "bg-black/50 border-white/20 hover:border-violet-500/50 backdrop-blur-md"
                                )}
                            >
                                {isSelected && <Check className="w-3.5 h-3.5" />}
                            </div>
                        </div>

                        {/* Project Badge */}
                        {displaySettings.showProjectName && projectName && (
                            <div
                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-md"
                                style={{
                                    background: 'rgba(139, 92, 246, 0.2)',
                                    border: '1px solid rgba(139, 92, 246, 0.3)',
                                    color: '#A78BFA'
                                }}
                            >
                                <Folder className="w-3 h-3" />
                                <span className="max-w-[80px] truncate">{projectName}</span>
                            </div>
                        )}
                    </div>

                    {/* Right Side: Actions */}
                    <div className="flex items-center gap-1">
                        {/* Action Menu (on hover) - Simplified to just image generation */}
                        <div
                            className={cn(
                                "flex items-center gap-1 transition-all duration-300",
                                isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
                            )}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => onImageChange(item.id, 'generate')}
                                className="p-2 rounded-lg backdrop-blur-md transition-all hover:scale-110"
                                style={{
                                    background: 'rgba(139, 92, 246, 0.2)',
                                    border: '1px solid rgba(139, 92, 246, 0.3)'
                                }}
                                title="Generate Image"
                            >
                                <Wand2 className="w-3.5 h-3.5 text-violet-400" />
                            </button>
                            <button
                                onClick={() => onImageChange(item.id, 'upload')}
                                className="p-2 rounded-lg backdrop-blur-md transition-all hover:scale-110 bg-teal-500/20 border border-teal-500/30 hover:bg-teal-500/30"
                                title="Upload Image"
                            >
                                <Upload className="w-3.5 h-3.5 text-teal-400" />
                            </button>
                        </div>

                        {/* Image Source (always visible when not hovered) */}
                        <div
                            className={cn(
                                "p-1.5 rounded-full backdrop-blur-md transition-opacity",
                                isHovered ? 'opacity-0' : 'opacity-100'
                            )}
                            style={{
                                background: 'rgba(12, 12, 18, 0.7)',
                                border: '1px solid rgba(255, 255, 255, 0.1)'
                            }}
                        >
                            {item.imageSource === 'generated' ? <Sparkles className="w-3 h-3 text-violet-400" /> :
                                item.imageSource === 'uploaded' ? <Upload className="w-3 h-3 text-[#14B8A6]" /> :
                                    <ImageIcon className="w-3 h-3 text-white/50" />}
                        </div>
                    </div>
                </div>

                {/* Bottom Content */}
                <div className="space-y-2">
                    {/* Genre Badge - Now anchored at bottom */}
                    <div
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-md w-fit"
                        style={{
                            background: 'rgba(12, 12, 18, 0.7)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: 'rgba(255, 255, 255, 0.7)'
                        }}
                    >
                        <Globe className="w-3.5 h-3.5" />
                        <span className="capitalize">{item.genre || 'World'}</span>
                    </div>

                    {/* Title & Info */}
                    <div className="space-y-1">
                        {item.tone && (
                            <p className="text-xs font-medium text-violet-400 tracking-wide uppercase">
                                {item.tone}
                            </p>
                        )}
                        <h3 className="text-lg md:text-xl font-semibold text-white tracking-tight leading-tight">
                            {item.name}
                        </h3>
                        {displaySettings.showDescription && item.description && size !== 'small' && (
                            <p className="text-sm text-white/50 line-clamp-2 mt-1">
                                {item.description}
                            </p>
                        )}
                    </div>

                    {/* Tags/Rules */}
                    {item.rules && item.rules.length > 0 && size !== 'small' && (
                        <div className="flex flex-wrap gap-1.5">
                            {item.rules.slice(0, 2).map((tag, idx) => (
                                <span
                                    key={idx}
                                    className="px-2 py-0.5 text-xs rounded-md"
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        color: 'rgba(255, 255, 255, 0.5)'
                                    }}
                                >
                                    {tag}
                                </span>
                            ))}
                            {item.rules.length > 2 && (
                                <span className="px-2 py-0.5 text-xs rounded-md bg-white/5 text-white/50">+{item.rules.length - 2}</span>
                            )}
                        </div>
                    )}
                </div>

                {/* View Arrow (on hover) */}
                <div
                    className={cn(
                        "absolute bottom-4 right-4 p-2 rounded-full transition-all duration-300",
                        isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'
                    )}
                    style={{
                        background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                        boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)'
                    }}
                >
                    <ChevronRight className="w-4 h-4 text-white" />
                </div>
            </div>
        </div>
    );
};

// =============================================================================
// CREATE NEW CARD COMPONENT
// =============================================================================

const CreateNewCard: React.FC<{ onClick: () => void }> = ({ onClick }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <button
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="relative col-span-1 row-span-1 rounded-2xl overflow-hidden transition-all duration-500 group"
            style={{
                background: isHovered
                    ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(12, 12, 18, 0.9) 100%)'
                    : 'linear-gradient(135deg, rgba(20, 20, 28, 0.6) 0%, rgba(12, 12, 18, 0.8) 100%)',
                border: `1px dashed ${isHovered ? 'rgba(139, 92, 246, 0.5)' : 'rgba(255, 255, 255, 0.1)'}`,
                minHeight: '180px'
            }}
        >
            <div className="h-full flex flex-col items-center justify-center gap-3 p-6">
                <div
                    className={cn(
                        "p-4 rounded-2xl transition-all duration-500",
                        isHovered ? 'bg-violet-500/20 scale-110' : 'bg-white/5'
                    )}
                >
                    <Plus
                        className={cn(
                            "w-6 h-6 transition-colors duration-300",
                            isHovered ? 'text-violet-400' : 'text-white/30'
                        )}
                    />
                </div>
                <span
                    className={cn(
                        "text-sm font-medium transition-colors duration-300",
                        isHovered ? 'text-violet-400' : 'text-white/50'
                    )}
                >
                    Create New World
                </span>
            </div>
        </button>
    );
};

// =============================================================================
// DROPDOWN MENU COMPONENT
// =============================================================================

interface DropdownProps {
    trigger: React.ReactNode;
    children: React.ReactNode;
    align?: 'left' | 'right';
    isOpen?: boolean;
    onClose?: () => void;
}

const Dropdown: React.FC<DropdownProps> = ({ trigger, children, align = 'right', isOpen: controlledIsOpen, onClose }) => {
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const isControlled = controlledIsOpen !== undefined;
    const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                if (isControlled) {
                    onClose?.();
                } else {
                    setInternalIsOpen(false);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isControlled, onClose]);

    const toggleOpen = () => {
        if (isControlled) {
            if (isOpen) onClose?.();
        } else {
            setInternalIsOpen(!internalIsOpen);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <div onClick={isControlled ? undefined : toggleOpen}>
                {trigger}
            </div>
            {isOpen && (
                <div
                    className={cn(
                        "absolute top-full mt-2 min-w-[200px] rounded-xl overflow-hidden z-20",
                        "bg-[#0c0c14] border border-white/10 shadow-xl",
                        align === 'right' ? 'right-0' : 'left-0'
                    )}
                >
                    {children}
                </div>
            )}
        </div>
    );
};

// =============================================================================
// BULK PROJECT MODAL COMPONENT
// =============================================================================

interface BulkProjectModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    actionType: 'move' | 'duplicate' | null;
    itemCount: number;
    onSelectProject: (projectId: string) => void;
}

const BulkProjectModal: React.FC<BulkProjectModalProps> = ({
    open,
    onOpenChange,
    actionType,
    itemCount,
    onSelectProject
}) => {
    const { projects, addProject } = useStore();
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectGenre, setNewProjectGenre] = useState('');

    const handleClose = () => {
        setShowCreateForm(false);
        setNewProjectName('');
        setNewProjectGenre('');
        onOpenChange(false);
    };

    const handleCreateAndSelect = () => {
        if (!newProjectName.trim()) return;

        const newId = `PROJECT_${Date.now().toString().slice(-6)}`;
        addProject({
            id: newId,
            name: newProjectName.trim(),
            genre: newProjectGenre.trim() || 'General',
            summary: '',
            characterIds: [],
            worldIds: [],
            progress: 0,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        onSelectProject(newId);
        handleClose();
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
            <div className="relative bg-[#0c0c14] border border-white/10 rounded-2xl w-full max-w-md mx-4 shadow-xl">
                <div className="p-6">
                    <h2 className="text-lg font-semibold text-white mb-1">
                        {actionType === 'move' ? 'Move' : 'Duplicate'} {itemCount} Item{itemCount > 1 ? 's' : ''}
                    </h2>
                    <p className="text-sm text-muted-foreground mb-4">
                        Select a destination project
                    </p>

                    {!showCreateForm ? (
                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                            <button
                                onClick={() => setShowCreateForm(true)}
                                className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all border border-dashed border-violet-500/30 hover:border-violet-500/50 bg-violet-500/5 hover:bg-violet-500/10"
                            >
                                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-500/20">
                                    <Plus className="w-4 h-4 text-violet-400" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-sm font-medium text-violet-400">+ Create New Project</h4>
                                </div>
                            </button>

                            {projects.map((project) => (
                                <button
                                    key={project.id}
                                    onClick={() => {
                                        onSelectProject(project.id);
                                        handleClose();
                                    }}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all border border-white/5 hover:border-violet-500/30 bg-white/[0.03] hover:bg-violet-500/5"
                                >
                                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5">
                                        <Folder className="w-4 h-4 text-white/50" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-sm font-medium text-white">{project.name}</h4>
                                        <p className="text-xs text-muted-foreground">{project.genre}</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-white/30" />
                                </button>
                            ))}

                            {projects.length === 0 && (
                                <p className="text-center text-muted-foreground text-sm py-4">
                                    No projects yet. Create one above.
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs text-muted-foreground uppercase tracking-wider">
                                    Project Name *
                                </label>
                                <input
                                    type="text"
                                    value={newProjectName}
                                    onChange={(e) => setNewProjectName(e.target.value)}
                                    placeholder="My New Project"
                                    className="w-full premium-input"
                                    autoFocus
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs text-muted-foreground uppercase tracking-wider">
                                    Genre (optional)
                                </label>
                                <input
                                    type="text"
                                    value={newProjectGenre}
                                    onChange={(e) => setNewProjectGenre(e.target.value)}
                                    placeholder="Fantasy, Sci-Fi, etc."
                                    className="w-full premium-input"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowCreateForm(false)}
                                    className="flex-1 px-4 py-2 rounded-xl text-sm glass"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateAndSelect}
                                    disabled={!newProjectName.trim()}
                                    className="flex-1 px-4 py-2 rounded-xl text-sm premium-button disabled:opacity-50"
                                >
                                    Create & Select
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="border-t border-white/5 px-6 py-4">
                    <button
                        onClick={handleClose}
                        className="w-full px-4 py-2 rounded-xl text-sm text-white/50 hover:text-white transition-all"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

// =============================================================================
// TOGGLE SWITCH COMPONENT
// =============================================================================

interface ToggleSwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: string;
    icon?: React.ReactNode;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ checked, onChange, label, icon }) => {
    return (
        <button
            onClick={() => onChange(!checked)}
            className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/5 transition-colors"
        >
            <div className="flex items-center gap-2">
                {icon && <span className="text-muted-foreground">{icon}</span>}
                <span className="text-sm text-white/80">{label}</span>
            </div>
            <div
                className={cn(
                    "w-9 h-5 rounded-full relative transition-colors",
                    checked ? "bg-violet-500" : "bg-white/10"
                )}
            >
                <div
                    className={cn(
                        "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform",
                        checked ? "translate-x-4" : "translate-x-0.5"
                    )}
                />
            </div>
        </button>
    );
};

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

export default function WorldsPage() {
    const router = useRouter();
    const {
        worlds,
        updateWorld,
        deleteWorld,
        getProjectForWorld,
        addWorldToProject,
        removeWorldFromProject,
        duplicateWorld
    } = useStore();

    // UI State
    const [searchQuery, setSearchQuery] = useState('');
    const [generatorModalOpen, setGeneratorModalOpen] = useState(false);
    const [selectedItemForImage, setSelectedItemForImage] = useState<string | null>(null);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [filteredByPanel, setFilteredByPanel] = useState<World[]>(worlds);
    const [sortBy, setSortBy] = useState<'date' | 'a-z' | 'z-a'>('date');
    const [sortOpen, setSortOpen] = useState(false);

    // Display Settings
    const [displaySettings, setDisplaySettings] = useState<DisplaySettings>({
        showProjectName: true,
        showImage: true,
        showDescription: true
    });

    // Dialog State
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);
    const [projectSettingsOpen, setProjectSettingsOpen] = useState(false);
    const [itemForProjectSettings, setItemForProjectSettings] = useState<string | null>(null);
    const [imageModalMode, setImageModalMode] = useState<'generate' | 'upload'>('generate');

    // Bulk Action State
    const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
    const [bulkProjectModalOpen, setBulkProjectModalOpen] = useState(false);
    const [bulkActionType, setBulkActionType] = useState<'move' | 'duplicate' | null>(null);

    // Pagination & View State
    const ITEMS_PER_PAGE = 12;
    const [currentPage, setCurrentPage] = useState(1);
    const [viewMode, setViewMode] = useViewMode('worlds-view', 'grid');

    // Filter worlds
    // Filter worlds
    // Base filter (Search) - passed to panel
    const searchedWorlds = React.useMemo(() => {
        if (!searchQuery) return worlds;
        const q = searchQuery.toLowerCase();
        return worlds.filter(w =>
            w.name.toLowerCase().includes(q) ||
            w.genre.toLowerCase().includes(q) ||
            w.tone?.toLowerCase().includes(q)
        );
    }, [worlds, searchQuery]);

    // Sort worlds
    const finalDisplayWorlds = React.useMemo(() => {
        return [...filteredByPanel].sort((a, b) => {
            if (sortBy === 'date') return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
            if (sortBy === 'a-z') return a.name.localeCompare(b.name);
            if (sortBy === 'z-a') return b.name.localeCompare(a.name);
            return 0;
        });
    }, [filteredByPanel, sortBy]);

    // Calculate pagination
    const totalPages = Math.ceil(finalDisplayWorlds.length / ITEMS_PER_PAGE);
    const paginatedWorlds = finalDisplayWorlds.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    // Reset to page 1 when filter changes or items are deleted
    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
        } else if (totalPages === 0) {
            setCurrentPage(1);
        }
    }, [finalDisplayWorlds.length, totalPages, currentPage]);

    const handleItemClick = (world: World) => {
        router.push(`/worlds/${world.id}`);
    };

    const handleCreateNew = () => {
        router.push('/chat?mode=world');
    };

    const handleImageChange = (itemId: string, action: 'upload' | 'generate') => {
        setSelectedItemForImage(itemId);
        setImageModalMode(action);
        setGeneratorModalOpen(true);
    };

    const handleGenerateImage = async (prompt: string, provider: ImageProvider) => {
        if (!selectedItemForImage) return;

        try {
            // Get API keys from localStorage
            const savedConfig = JSON.parse(localStorage.getItem('5d-api-config') || '{}');

            const response = await fetch('/api/generate-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(savedConfig.geminiKey && { 'x-gemini-key': savedConfig.geminiKey }),
                    ...(savedConfig.openaiKey && { 'x-openai-key': savedConfig.openaiKey }),
                    ...(savedConfig.dalleKey && { 'x-openai-key': savedConfig.dalleKey }),
                },
                body: JSON.stringify({ prompt, provider })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Image generation failed');
            }

            updateWorld(selectedItemForImage, {
                imageUrl: data.imageUrl,
                imageSource: 'generated'
            });
        } catch (error) {
            console.error('Failed to generate image:', error);
            throw error;
        }
    };

    const handleDeleteClick = (itemId: string) => {
        setItemToDelete(itemId);
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = () => {
        if (itemToDelete) {
            deleteWorld(itemToDelete);
            setItemToDelete(null);
        }
    };

    // Bulk action handlers
    const handleBulkDelete = () => {
        setBulkDeleteDialogOpen(true);
    };

    const handleConfirmBulkDelete = () => {
        selectedItems.forEach(id => deleteWorld(id));
        setSelectedItems(new Set());
    };

    const handleBulkMove = () => {
        setBulkActionType('move');
        setBulkProjectModalOpen(true);
    };

    const handleBulkDuplicate = () => {
        setBulkActionType('duplicate');
        setBulkProjectModalOpen(true);
    };

    const handleBulkProjectAction = (targetProjectId: string) => {
        if (bulkActionType === 'move') {
            selectedItems.forEach(id => {
                const world = worlds.find(w => w.id === id);
                if (world?.projectId) {
                    removeWorldFromProject(id, world.projectId);
                }
                addWorldToProject(id, targetProjectId);
            });
        } else if (bulkActionType === 'duplicate') {
            selectedItems.forEach(id => {
                const newId = duplicateWorld(id);
                if (newId) {
                    addWorldToProject(newId, targetProjectId);
                }
            });
        }
        setSelectedItems(new Set());
        setBulkProjectModalOpen(false);
        setBulkActionType(null);
    };

    const handleProjectSettingsClick = (itemId: string) => {
        setItemForProjectSettings(itemId);
        setProjectSettingsOpen(true);
    };

    const handleProjectAction = (action: 'add' | 'move' | 'duplicate' | null, targetProjectId: string) => {
        if (!itemForProjectSettings || !action) return;

        const world = worlds.find(w => w.id === itemForProjectSettings);
        if (!world) return;

        switch (action) {
            case 'add':
                addWorldToProject(itemForProjectSettings, targetProjectId);
                break;
            case 'move':
                if (world.projectId) {
                    removeWorldFromProject(itemForProjectSettings, world.projectId);
                }
                addWorldToProject(itemForProjectSettings, targetProjectId);
                break;
            case 'duplicate':
                const newId = duplicateWorld(itemForProjectSettings);
                if (newId) {
                    addWorldToProject(newId, targetProjectId);
                }
                break;
        }

        setItemForProjectSettings(null);
    };

    const handleSelect = (itemId: string) => {
        setSelectedItems(prev => {
            const next = new Set(prev);
            if (next.has(itemId)) {
                next.delete(itemId);
            } else {
                next.add(itemId);
            }
            return next;
        });
    };

    const handleSelectAll = () => {
        if (selectedItems.size === finalDisplayWorlds.length) {
            setSelectedItems(new Set());
        } else {
            setSelectedItems(new Set(finalDisplayWorlds.map(w => w.id)));
        }
    };

    const updateDisplaySetting = (key: keyof DisplaySettings, value: boolean) => {
        setDisplaySettings(prev => ({ ...prev, [key]: value }));
    };

    const itemToDeleteInfo = itemToDelete ? worlds.find(w => w.id === itemToDelete) : null;
    const itemForProjectInfo = itemForProjectSettings ? worlds.find(w => w.id === itemForProjectSettings) : null;

    return (
        <div className="min-h-screen p-8 lg:p-12 mb-20 md:mb-0">
            {/* Header Section */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-violet-500 to-violet-500/40" />
                        <h1 className="text-3xl font-semibold tracking-tight">Your Worlds</h1>
                    </div>
                    <p className="text-muted-foreground text-base ml-5">
                        Build immersive settings and explore your universes
                    </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                    <a
                        href="/settings"
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-white/50 hover:text-white transition-all glass-card-interactive"
                    >
                        <Settings className="w-4 h-4" />
                        <span className="hidden sm:inline">Image Settings</span>
                    </a>
                </div>
            </header>

            {/* Search & Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search worlds by name, genre, or tone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full premium-input pl-10"
                    />
                </div>
                <div className="flex gap-2">
                    {/* Filter Dropdown */}
                    <Dropdown
                        trigger={
                            <button className="px-4 py-2 rounded-xl text-sm font-medium glass-card-interactive flex items-center gap-2">
                                <CheckSquare className="w-4 h-4" />
                                <span>Select</span>
                            </button>
                        }
                    >
                        <div className="p-2">
                            <button
                                onClick={handleSelectAll}
                                className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-white/5 rounded-lg transition-colors"
                            >
                                <CheckSquare className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm text-white/80">
                                    {selectedItems.size === finalDisplayWorlds.length ? 'Deselect All' : 'Select All'}
                                </span>
                            </button>
                        </div>
                    </Dropdown>

                    {/* Filter Panel (Replaces old dropdown) */}
                    <SmartFilterPanel
                        items={searchedWorlds}
                        onFilterChange={setFilteredByPanel}
                        type="world"
                    />

                    {/* Sort Dropdown */}
                    <Dropdown
                        isOpen={sortOpen}
                        onClose={() => setSortOpen(false)}
                        trigger={
                            <button
                                className="px-4 py-2 rounded-xl text-sm font-medium glass-card-interactive flex items-center gap-2"
                                onClick={() => setSortOpen(!sortOpen)}
                            >
                                <ArrowUpDown className="w-4 h-4" />
                                <span>Sort</span>
                                <ChevronDown className="w-3 h-3" />
                            </button>
                        }
                    >
                        <div className="p-2 w-48">
                            {[
                                { value: 'date', label: 'Last Updated' },
                                { value: 'a-z', label: 'A to Z' },
                                { value: 'z-a', label: 'Z to A' }
                            ].map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => {
                                        if (sortBy === opt.value) {
                                            setSortBy('date');
                                        } else {
                                            setSortBy(opt.value as typeof sortBy);
                                        }
                                        setSortOpen(false);
                                    }}
                                    className={cn(
                                        "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors",
                                        sortBy === opt.value
                                            ? "bg-cyan-500/20 text-cyan-400"
                                            : "hover:bg-white/5 text-muted-foreground hover:text-white"
                                    )}
                                >
                                    {sortBy === opt.value && <Check className="w-4 h-4" />}
                                    <span className="flex-1">{opt.label}</span>
                                </button>
                            ))}
                        </div>
                    </Dropdown>

                    {/* Settings Dropdown */}
                    <Dropdown
                        trigger={
                            <button className="px-4 py-2 rounded-xl text-sm font-medium glass-card-interactive flex items-center gap-2">
                                <MoreHorizontal className="w-4 h-4" />
                            </button>
                        }
                    >
                        <div className="py-2">
                            <p className="px-3 py-1.5 text-xs text-muted-foreground uppercase tracking-wider">
                                Display Options
                            </p>
                            <ToggleSwitch
                                checked={displaySettings.showProjectName}
                                onChange={(v) => updateDisplaySetting('showProjectName', v)}
                                label="Show Project Name"
                                icon={<Folder className="w-4 h-4" />}
                            />
                            <ToggleSwitch
                                checked={displaySettings.showImage}
                                onChange={(v) => updateDisplaySetting('showImage', v)}
                                label="Show Image"
                                icon={displaySettings.showImage ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            />
                            <ToggleSwitch
                                checked={displaySettings.showDescription}
                                onChange={(v) => updateDisplaySetting('showDescription', v)}
                                label="Show Description"
                                icon={<FileText className="w-4 h-4" />}
                            />
                        </div>
                    </Dropdown>

                    {/* View Toggle */}
                    <ViewToggle view={viewMode} onViewChange={setViewMode} />
                </div>
            </div>

            {/* Bulk Actions Toolbar */}
            {selectedItems.size > 0 && (
                <div className="flex flex-wrap items-center gap-3 mb-4 px-4 py-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
                    <span className="text-sm text-violet-400 font-medium">
                        {selectedItems.size} item{selectedItems.size > 1 ? 's' : ''} selected
                    </span>
                    <div className="h-4 w-px bg-violet-500/30" />

                    {/* Bulk Action Buttons */}
                    <button
                        onClick={handleBulkDelete}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                    </button>
                    <button
                        onClick={handleBulkMove}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 border border-violet-500/30"
                    >
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                        Move to Project
                    </button>
                    <button
                        onClick={handleBulkDuplicate}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30"
                    >
                        <Copy className="w-3.5 h-3.5" />
                        Duplicate to Project
                    </button>

                    <div className="flex-1" />

                    <button
                        onClick={() => setSelectedItems(new Set())}
                        className="flex items-center gap-1 text-xs text-violet-400/70 hover:text-violet-400"
                    >
                        <X className="w-3.5 h-3.5" />
                        Clear
                    </button>
                </div>
            )}

            {/* Bento Grid Gallery */}
            {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5 auto-rows-[minmax(180px,auto)]">
                    {currentPage === 1 && <CreateNewCard onClick={handleCreateNew} />}

                    {paginatedWorlds.map((world) => {
                        const project = getProjectForWorld(world.id);
                        return (
                            <GalleryCard
                                key={world.id}
                                item={world}
                                projectName={project?.name}
                                onClick={() => handleItemClick(world)}
                                onImageChange={handleImageChange}
                                onDelete={handleDeleteClick}
                                onProjectSettings={handleProjectSettingsClick}
                                isSelected={selectedItems.has(world.id)}
                                onSelect={handleSelect}
                                displaySettings={displaySettings}
                            />
                        );
                    })}
                </div>
            ) : (
                <div className="space-y-2">
                    {currentPage === 1 && (
                        <button
                            onClick={handleCreateNew}
                            className="w-full flex items-center gap-4 p-4 rounded-xl border border-dashed border-white/10 hover:border-violet-500/30 bg-white/[0.02] hover:bg-violet-500/5 transition-all"
                        >
                            <div className="w-12 h-12 rounded-lg bg-violet-500/10 flex items-center justify-center">
                                <Plus className="w-5 h-5 text-violet-400" />
                            </div>
                            <span className="text-sm font-medium text-violet-400">Create New World</span>
                        </button>
                    )}
                    {paginatedWorlds.map((world) => {
                        const project = getProjectForWorld(world.id);
                        return (
                            <div
                                key={world.id}
                                onClick={() => handleItemClick(world)}
                                className={cn(
                                    "flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all",
                                    "bg-white/[0.02] border border-white/5 hover:border-violet-500/20 hover:bg-white/[0.04]",
                                    selectedItems.has(world.id) && "ring-2 ring-violet-500 ring-offset-2 ring-offset-[#08080c]"
                                )}
                            >
                                {/* Selection Checkbox */}
                                <div
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleSelect(world.id);
                                    }}
                                >
                                    <div
                                        className={cn(
                                            "w-6 h-6 rounded-lg flex items-center justify-center transition-all border",
                                            selectedItems.has(world.id)
                                                ? "bg-violet-500 border-violet-500 text-white"
                                                : "bg-black/50 border-white/20 hover:border-violet-500/50"
                                        )}
                                    >
                                        {selectedItems.has(world.id) && <Check className="w-3.5 h-3.5" />}
                                    </div>
                                </div>

                                {/* Image */}
                                {displaySettings.showImage && (
                                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                                        {world.imageUrl ? (
                                            <img src={world.imageUrl} alt={world.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Globe className="w-5 h-5 text-white/20" />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-medium text-white truncate">{world.name}</h3>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-xs text-white/50 capitalize">{world.genre}</span>
                                        {displaySettings.showProjectName && project && (
                                            <>
                                                <span className="text-white/20">•</span>
                                                <span className="text-xs text-violet-400">{project.name}</span>
                                            </>
                                        )}
                                    </div>
                                    {displaySettings.showDescription && world.description && (
                                        <p className="text-xs text-white/40 truncate mt-1">{world.description}</p>
                                    )}
                                </div>

                                <ChevronRight className="w-4 h-4 text-white/20" />
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    className="mt-8"
                />
            )}

            {/* Empty State */}
            {finalDisplayWorlds.length === 0 && worlds.length > 0 && (
                <div className="col-span-full py-20 text-center">
                    <p className="text-muted-foreground">No worlds match your search.</p>
                    <button
                        onClick={() => setSearchQuery('')}
                        className="text-violet-400 hover:underline mt-2"
                    >
                        Clear search
                    </button>
                </div>
            )}

            {worlds.length === 0 && (
                <div className="md:col-span-2 lg:col-span-3 xl:col-span-4 flex flex-col items-center justify-center py-10 opacity-50">
                    <p className="text-muted-foreground text-sm">Create your first world to begin.</p>
                </div>
            )}

            {/* Image Generator Modal */}
            <ImageGeneratorModal
                isOpen={generatorModalOpen}
                onClose={() => setGeneratorModalOpen(false)}
                onGenerate={handleGenerateImage}
                onUpload={(dataUrl) => {
                    if (selectedItemForImage) {
                        const world = worlds.find(w => w.id === selectedItemForImage);
                        if (world && updateWorld) {
                            updateWorld(world.id, { imageUrl: dataUrl });
                        }
                    }
                    setGeneratorModalOpen(false);
                }}
                itemName={selectedItemForImage ? worlds.find(w => w.id === selectedItemForImage)?.name : undefined}
                initialMode={imageModalMode}
            />

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Delete World"
                description={`Are you sure you want to delete "${itemToDeleteInfo?.name || 'this world'}"? This action cannot be undone.`}
                confirmLabel="Delete"
                variant="danger"
                onConfirm={handleConfirmDelete}
            />

            {/* Bulk Delete Confirmation */}
            <ConfirmDialog
                open={bulkDeleteDialogOpen}
                onOpenChange={setBulkDeleteDialogOpen}
                title="Delete Selected Worlds"
                description={`Are you sure you want to delete ${selectedItems.size} world${selectedItems.size > 1 ? 's' : ''}? This action cannot be undone.`}
                confirmLabel={`Delete ${selectedItems.size} item${selectedItems.size > 1 ? 's' : ''}`}
                variant="danger"
                onConfirm={handleConfirmBulkDelete}
            />

            {/* Project Settings Modal */}
            {
                itemForProjectInfo && (
                    <ProjectSettingsModal
                        open={projectSettingsOpen}
                        onOpenChange={setProjectSettingsOpen}
                        itemId={itemForProjectInfo.id}
                        itemName={itemForProjectInfo.name}
                        itemType="world"
                        currentProjectId={itemForProjectInfo.projectId}
                        onAction={handleProjectAction}
                    />
                )
            }

            {/* Bulk Project Selection Modal */}
            <BulkProjectModal
                open={bulkProjectModalOpen}
                onOpenChange={setBulkProjectModalOpen}
                actionType={bulkActionType}
                itemCount={selectedItems.size}
                onSelectProject={handleBulkProjectAction}
            />
        </div >
    );
}
