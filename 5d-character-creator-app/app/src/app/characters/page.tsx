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
    Users,
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
    Type,
    FileText,
    Copy,
    ArrowRightLeft,
    X,
    Calendar,
    ArrowUpDown,
    ChevronDown
} from 'lucide-react';
import { ImageGeneratorModal, ProjectSettingsModal } from '@/components/gallery';
import { SmartFilterPanel } from '@/components/ui/smart-filter';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Pagination } from '@/components/ui/pagination';
import { ViewToggle, useViewMode, ViewMode } from '@/components/ui/view-toggle';
import { Character } from '@/types/character';
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
// GALLERY CARD COMPONENT
// =============================================================================

interface GalleryCardProps {
    item: Character;
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
                isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-[#08080c]"
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
                    {!item.imageUrl && <ImageIcon className="w-8 h-8 text-white/10" />}
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
                        background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, transparent 50%)'
                    }}
                />
            </div>

            {/* Content */}
            <div className="relative h-full flex flex-col p-5 md:p-6">
                {/* Top Section: Controls */}
                <div className="flex items-start justify-between mb-auto z-10">
                    {/* Left: Selection + Project Badge */}
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        {/* Selection Checkbox */}
                        <div
                            className={cn(
                                "transition-all duration-300 flex-shrink-0",
                                isHovered || isSelected ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                            )}
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelect?.(item.id);
                            }}
                        >
                            <div
                                className={cn(
                                    "w-5 h-5 rounded-md flex items-center justify-center transition-all border-2 cursor-pointer",
                                    isSelected
                                        ? "bg-primary border-primary text-white shadow-lg shadow-primary/50"
                                        : "bg-black/60 border-white/30 hover:border-primary/60 backdrop-blur-sm"
                                )}
                            >
                                {isSelected && <Check className="w-3 h-3" />}
                            </div>
                        </div>

                        {/* Project Badge */}
                        {displaySettings.showProjectName && projectName && (
                            <div
                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium backdrop-blur-sm flex-shrink-0"
                                style={{
                                    background: 'rgba(249, 115, 22, 0.15)',
                                    border: '1px solid rgba(249, 115, 22, 0.25)',
                                    color: '#F97316'
                                }}
                            >
                                <Folder className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{projectName}</span>
                            </div>
                        )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                        {/* Image Source Indicator - Always visible, more prominent */}
                        {item.imageSource && (
                            <div
                                className="p-1.5 rounded-lg backdrop-blur-sm transition-all"
                                style={{
                                    background: item.imageSource === 'generated' 
                                        ? 'rgba(249, 115, 22, 0.12)' 
                                        : item.imageSource === 'uploaded'
                                        ? 'rgba(20, 184, 166, 0.12)'
                                        : 'rgba(12, 12, 18, 0.7)',
                                    border: item.imageSource === 'generated'
                                        ? '1px solid rgba(249, 115, 22, 0.2)'
                                        : item.imageSource === 'uploaded'
                                        ? '1px solid rgba(20, 184, 166, 0.2)'
                                        : '1px solid rgba(255, 255, 255, 0.08)'
                                }}
                                title={`Image Source: ${item.imageSource}`}
                            >
                                {item.imageSource === 'generated' ? <Sparkles className="w-3.5 h-3.5 text-[#F97316]" /> :
                                    item.imageSource === 'uploaded' ? <Upload className="w-3.5 h-3.5 text-[#14B8A6]" /> :
                                        <ImageIcon className="w-3.5 h-3.5 text-white/50" />}
                            </div>
                        )}

                        {/* Action Buttons (on hover) */}
                        <div
                            className={cn(
                                "flex items-center gap-1.5 transition-all duration-300",
                                isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2 pointer-events-none'
                            )}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => onImageChange(item.id, 'generate')}
                                className="p-2 rounded-lg backdrop-blur-sm transition-all hover:scale-110 active:scale-95"
                                style={{
                                    background: 'rgba(249, 115, 22, 0.15)',
                                    border: '1px solid rgba(249, 115, 22, 0.25)'
                                }}
                                title="Generate Image"
                            >
                                <Wand2 className="w-3.5 h-3.5 text-[#F97316]" />
                            </button>
                            <button
                                onClick={() => onImageChange(item.id, 'upload')}
                                className="p-2 rounded-lg backdrop-blur-sm transition-all hover:scale-110 active:scale-95 bg-teal-500/15 border border-teal-500/25 hover:bg-teal-500/25"
                                title="Upload Image"
                            >
                                <Upload className="w-3.5 h-3.5 text-teal-400" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Bottom Section: Content */}
                <div className="mt-auto space-y-3">
                    {/* Title Section */}
                    <div className="space-y-1.5">
                        {/* Archetype Badge */}
                        {item.archetype && (
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-semibold text-primary/80 tracking-widest uppercase">
                                    {item.archetype}
                                </span>
                            </div>
                        )}
                        
                        {/* Name */}
                        <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight leading-tight line-clamp-2">
                            {item.name}
                        </h3>
                    </div>

                    {/* Description */}
                    {displaySettings.showDescription && (item.tagline || item.coreConcept) && size !== 'small' && (
                        <p className="text-sm text-white/70 line-clamp-2 leading-relaxed">
                            {item.tagline || item.coreConcept}
                        </p>
                    )}

                    {/* Metadata Row */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Role Badge */}
                        <div
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium backdrop-blur-sm"
                            style={{
                                background: 'rgba(12, 12, 18, 0.8)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                color: 'rgba(255, 255, 255, 0.8)'
                            }}
                        >
                            <Users className="w-3 h-3" />
                            <span className="capitalize">{item.role || 'Character'}</span>
                        </div>

                        {/* Genre Tag */}
                        {item.genre && (
                            <span
                                className="px-2.5 py-1 text-xs rounded-lg font-medium"
                                style={{
                                    background: 'rgba(139, 92, 246, 0.12)',
                                    color: 'rgba(167, 139, 250, 0.95)',
                                    border: '1px solid rgba(139, 92, 246, 0.2)'
                                }}
                            >
                                {item.genre}
                            </span>
                        )}
                    </div>
                </div>

                {/* View Arrow (on hover) */}
                <div
                    className={cn(
                        "absolute bottom-5 right-5 p-2.5 rounded-full transition-all duration-300 shadow-lg",
                        isHovered ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 -translate-x-2 scale-95'
                    )}
                    style={{
                        background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                        boxShadow: '0 4px 20px rgba(249, 115, 22, 0.5)'
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
                    ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, rgba(12, 12, 18, 0.9) 100%)'
                    : 'linear-gradient(135deg, rgba(20, 20, 28, 0.6) 0%, rgba(12, 12, 18, 0.8) 100%)',
                border: `1px dashed ${isHovered ? 'rgba(249, 115, 22, 0.5)' : 'rgba(255, 255, 255, 0.1)'}`,
                minHeight: '180px'
            }}
        >
            <div className="h-full flex flex-col items-center justify-center gap-3 p-6">
                <div
                    className={cn(
                        "p-4 rounded-2xl transition-all duration-500",
                        isHovered ? 'bg-[#F97316]/20 scale-110' : 'bg-white/5'
                    )}
                >
                    <Plus
                        className={cn(
                            "w-6 h-6 transition-colors duration-300",
                            isHovered ? 'text-[#F97316]' : 'text-white/30'
                        )}
                    />
                </div>
                <span
                    className={cn(
                        "text-sm font-medium transition-colors duration-300",
                        isHovered ? 'text-[#F97316]' : 'text-white/50'
                    )}
                >
                    Create New Character
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
            // Note: We don't have an 'onOpen' prop, usually controlled means parent handles toggle.
            // But if existing triggers expect to toggle, we might need a callback.
            // For now, let's assume the trigger onClick handles it for controlled, 
            // OR we just ignore internal toggle if controlled.
            // ACTUALLY: The newer usage passes `onClick={() => setSortOpen(!sortOpen)}` on the trigger button itself.
            // So we don't need to handle click on trigger here if we don't wrap it in a div that catches clicks.
            // The existing invalid implementation wrapped trigger in a div with onClick.
            // We should keep that for uncontrolled, but maybe disable it for controlled?

            // However, the `Dropdown` usage in projects page (which I copied logic from for Sort) 
            // has the trigger passed in.
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
                        "absolute top-full mt-2 min-w-[200px] rounded-xl overflow-hidden z-20", // Reduced z-index to be below modals but above card content
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
                            {/* Create New Option */}
                            <button
                                onClick={() => setShowCreateForm(true)}
                                className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all border border-dashed border-primary/30 hover:border-primary/50 bg-primary/5 hover:bg-primary/10"
                            >
                                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/20">
                                    <Plus className="w-4 h-4 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-sm font-medium text-primary">+ Create New Project</h4>
                                </div>
                            </button>

                            {/* Existing Projects */}
                            {projects.map((project) => (
                                <button
                                    key={project.id}
                                    onClick={() => {
                                        onSelectProject(project.id);
                                        handleClose();
                                    }}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all border border-white/5 hover:border-primary/30 bg-white/[0.03] hover:bg-primary/5"
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
                    checked ? "bg-primary" : "bg-white/10"
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

export default function CharactersPage() {
    const router = useRouter();
    const {
        characters,
        worlds,
        updateCharacter,
        deleteCharacter,
        getProjectForCharacter,
        addCharacterToProject,
        removeCharacterFromProject,
        duplicateCharacter
    } = useStore();

    // UI State
    const [searchQuery, setSearchQuery] = useState('');
    const [generatorModalOpen, setGeneratorModalOpen] = useState(false);
    const [worldSelectOpen, setWorldSelectOpen] = useState(false);
    const [selectedItemForImage, setSelectedItemForImage] = useState<string | null>(null);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [filteredByPanel, setFilteredByPanel] = useState<Character[]>(characters);
    const [sortBy, setSortBy] = useState<'date' | 'a-z' | 'z-a' | 'role'>('date');
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
    const [viewMode, setViewMode] = useViewMode('characters-view', 'grid');

    // Filter characters
    // Base filter (Search) - passed to panel
    const searchedCharacters = React.useMemo(() => {
        if (!searchQuery) return characters;
        const q = searchQuery.toLowerCase();
        return characters.filter(c =>
            c.name.toLowerCase().includes(q) ||
            c.role.toLowerCase().includes(q) ||
            c.archetype?.toLowerCase().includes(q)
        );
    }, [characters, searchQuery]);

    // Sort characters
    const finalDisplayCharacters = React.useMemo(() => {
        return [...filteredByPanel].sort((a, b) => {
            if (sortBy === 'date') return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
            if (sortBy === 'a-z') return a.name.localeCompare(b.name);
            if (sortBy === 'z-a') return b.name.localeCompare(a.name);
            if (sortBy === 'role') return (a.role || '').localeCompare(b.role || '');
            return 0;
        });
    }, [filteredByPanel, sortBy]);

    // Calculate pagination
    const totalPages = Math.ceil(finalDisplayCharacters.length / ITEMS_PER_PAGE);
    const paginatedCharacters = finalDisplayCharacters.slice(
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
    }, [finalDisplayCharacters.length, totalPages, currentPage]);

    const handleItemClick = (character: Character) => {
        router.push(`/characters/${character.id}`);
    };

    const handleCreateNew = () => {
        setWorldSelectOpen(true);
    };

    const proceedToCreate = (worldId?: string) => {
        const params = new URLSearchParams();
        params.set('mode', 'character');
        if (worldId) {
            params.set('parentWorldId', worldId);
        }
        router.push(`/chat?${params.toString()}`);
    };

    const handleImageChange = (itemId: string, action: 'upload' | 'generate') => {
        setSelectedItemForImage(itemId);
        setImageModalMode(action);
        setGeneratorModalOpen(true);
    };

    const handleGenerateImage = async (prompt: string, provider: ImageProvider): Promise<string | null> => {
        if (!selectedItemForImage) return null;

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

            updateCharacter(selectedItemForImage, {
                imageUrl: data.imageUrl,
                imageSource: 'generated'
            });
            return data.imageUrl;
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
            deleteCharacter(itemToDelete);
            setItemToDelete(null);
        }
    };

    // Bulk action handlers
    const handleBulkDelete = () => {
        setBulkDeleteDialogOpen(true);
    };

    const handleConfirmBulkDelete = () => {
        selectedItems.forEach(id => deleteCharacter(id));
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
                const character = characters.find(c => c.id === id);
                if (character?.projectId) {
                    removeCharacterFromProject(id, character.projectId);
                }
                addCharacterToProject(id, targetProjectId);
            });
        } else if (bulkActionType === 'duplicate') {
            selectedItems.forEach(id => {
                const newId = duplicateCharacter(id);
                if (newId) {
                    addCharacterToProject(newId, targetProjectId);
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

        const character = characters.find(c => c.id === itemForProjectSettings);
        if (!character) return;

        switch (action) {
            case 'add':
                addCharacterToProject(itemForProjectSettings, targetProjectId);
                break;
            case 'move':
                if (character.projectId) {
                    removeCharacterFromProject(itemForProjectSettings, character.projectId);
                }
                addCharacterToProject(itemForProjectSettings, targetProjectId);
                break;
            case 'duplicate':
                const newId = duplicateCharacter(itemForProjectSettings);
                if (newId) {
                    addCharacterToProject(newId, targetProjectId);
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
        if (selectedItems.size === finalDisplayCharacters.length) {
            setSelectedItems(new Set());
        } else {
            setSelectedItems(new Set(finalDisplayCharacters.map(c => c.id)));
        }
    };

    const updateDisplaySetting = (key: keyof DisplaySettings, value: boolean) => {
        setDisplaySettings(prev => ({ ...prev, [key]: value }));
    };

    const itemToDeleteInfo = itemToDelete ? characters.find(c => c.id === itemToDelete) : null;
    const itemForProjectInfo = itemForProjectSettings ? characters.find(c => c.id === itemForProjectSettings) : null;

    return (
        <div className="min-h-screen p-8 lg:p-12 mb-20 md:mb-0">
            {/* Header Section */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-primary to-primary/40" />
                        <h1 className="text-3xl font-semibold tracking-tight">Your Characters</h1>
                    </div>
                    <p className="text-muted-foreground text-base ml-5">
                        Manage your cast and track their development arcs
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
                        placeholder="Search characters by name, role, or archetype..."
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
                                    {selectedItems.size === finalDisplayCharacters.length ? 'Deselect All' : 'Select All'}
                                </span>
                            </button>
                        </div>
                    </Dropdown>

                    {/* Filter Panel (Replaces old dropdown) */}
                    <SmartFilterPanel
                        items={searchedCharacters}
                        onFilterChange={setFilteredByPanel}
                        type="character"
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
                                { value: 'z-a', label: 'Z to A' },
                                { value: 'role', label: 'Role' }
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
                <div className="flex flex-wrap items-center gap-3 mb-4 px-4 py-3 rounded-xl bg-primary/10 border border-primary/20">
                    <span className="text-sm text-primary font-medium">
                        {selectedItems.size} item{selectedItems.size > 1 ? 's' : ''} selected
                    </span>
                    <div className="h-4 w-px bg-primary/30" />

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
                        className="flex items-center gap-1 text-xs text-primary/70 hover:text-primary"
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

                    {paginatedCharacters.map((character) => {
                        const project = getProjectForCharacter(character.id);
                        return (
                            <GalleryCard
                                key={character.id}
                                item={character}
                                projectName={project?.name}
                                onClick={() => handleItemClick(character)}
                                onImageChange={handleImageChange}
                                onDelete={handleDeleteClick}
                                onProjectSettings={handleProjectSettingsClick}
                                isSelected={selectedItems.has(character.id)}
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
                            className="w-full flex items-center gap-4 p-4 rounded-xl border border-dashed border-white/10 hover:border-primary/30 bg-white/[0.02] hover:bg-primary/5 transition-all"
                        >
                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Plus className="w-5 h-5 text-primary" />
                            </div>
                            <span className="text-sm font-medium text-primary">Create New Character</span>
                        </button>
                    )}
                    {paginatedCharacters.map((character) => {
                        const project = getProjectForCharacter(character.id);
                        return (
                            <div
                                key={character.id}
                                onClick={() => handleItemClick(character)}
                                className={cn(
                                    "flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all",
                                    "bg-white/[0.02] border border-white/5 hover:border-primary/20 hover:bg-white/[0.04]",
                                    selectedItems.has(character.id) && "ring-2 ring-primary ring-offset-2 ring-offset-[#08080c]"
                                )}
                            >
                                {/* Selection Checkbox */}
                                <div
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleSelect(character.id);
                                    }}
                                >
                                    <div
                                        className={cn(
                                            "w-6 h-6 rounded-lg flex items-center justify-center transition-all border",
                                            selectedItems.has(character.id)
                                                ? "bg-primary border-primary text-white"
                                                : "bg-black/50 border-white/20 hover:border-primary/50"
                                        )}
                                    >
                                        {selectedItems.has(character.id) && <Check className="w-3.5 h-3.5" />}
                                    </div>
                                </div>

                                {/* Image */}
                                {displaySettings.showImage && (
                                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                                        {character.imageUrl ? (
                                            <img src={character.imageUrl} alt={character.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <ImageIcon className="w-5 h-5 text-white/20" />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-medium text-white truncate">{character.name}</h3>
                                    {character.tagline && (
                                        <p className="text-[10px] font-bold text-violet-400 uppercase tracking-widest leading-tight mt-0.5 line-clamp-1">
                                            {character.tagline}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-xs text-white/50 capitalize">{character.role}</span>
                                        {displaySettings.showProjectName && project && (
                                            <>
                                                <span className="text-white/20">•</span>
                                                <span className="text-xs text-primary">{project.name}</span>
                                            </>
                                        )}
                                    </div>
                                    {displaySettings.showDescription && character.coreConcept && (
                                        <p className="text-xs text-white/40 truncate mt-1">{character.coreConcept}</p>
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

            {/* Empty States */}
            {finalDisplayCharacters.length === 0 && characters.length > 0 && (
                <div className="col-span-full py-20 text-center">
                    <p className="text-muted-foreground">No characters match your search.</p>
                    <button
                        onClick={() => setSearchQuery('')}
                        className="text-primary hover:underline mt-2"
                    >
                        Clear search
                    </button>
                </div>
            )}

            {characters.length === 0 && (
                <div className="md:col-span-2 lg:col-span-3 xl:col-span-4 flex flex-col items-center justify-center py-10 opacity-50">
                    <p className="text-muted-foreground text-sm">Create your first character to begin.</p>
                </div>
            )}

            {/* Modals */}
            {/* Modals */}
            <ImageGeneratorModal
                isOpen={generatorModalOpen}
                onClose={() => setGeneratorModalOpen(false)}
                onGenerate={handleGenerateImage}
                onUpload={(dataUrl) => {
                    if (selectedItemForImage) {
                        const character = characters.find(c => c.id === selectedItemForImage);
                        if (character && updateCharacter) { // Use updateCharacter from store
                            updateCharacter(character.id, { imageUrl: dataUrl });
                        }
                    }
                    setGeneratorModalOpen(false);
                }}
                itemName={selectedItemForImage ? characters.find(c => c.id === selectedItemForImage)?.name : undefined}
                initialMode={imageModalMode}
            />

            <ConfirmDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Delete Character"
                description={`Are you sure you want to delete "${itemToDeleteInfo?.name || 'this character'}"? This action cannot be undone.`}
                confirmLabel="Delete"
                variant="danger"
                onConfirm={handleConfirmDelete}
            />

            {
                itemForProjectInfo && (
                    <ProjectSettingsModal
                        open={projectSettingsOpen}
                        onOpenChange={setProjectSettingsOpen}
                        itemId={itemForProjectInfo.id}
                        itemName={itemForProjectInfo.name}
                        itemType="character"
                        currentProjectId={itemForProjectInfo.projectId}
                        onAction={handleProjectAction}
                    />
                )
            }

            {/* Bulk Delete Confirmation */}
            <ConfirmDialog
                open={bulkDeleteDialogOpen}
                onOpenChange={setBulkDeleteDialogOpen}
                title="Delete Selected Characters"
                description={`Are you sure you want to delete ${selectedItems.size} character${selectedItems.size > 1 ? 's' : ''}? This action cannot be undone.`}
                confirmLabel={`Delete ${selectedItems.size} item${selectedItems.size > 1 ? 's' : ''}`}
                variant="danger"
                onConfirm={handleConfirmBulkDelete}
            />

            {/* Bulk Project Selection Modal */}
            <BulkProjectModal
                open={bulkProjectModalOpen}
                onOpenChange={setBulkProjectModalOpen}
                actionType={bulkActionType}
                itemCount={selectedItems.size}
                onSelectProject={handleBulkProjectAction}
            />
            {/* World Selection Modal */}
            {worldSelectOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setWorldSelectOpen(false)} />
                    <div className="relative glass-card rounded-2xl p-6 w-full max-w-lg border border-white/10 overflow-hidden">
                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-white mb-2">Create New Character</h3>
                            <p className="text-muted-foreground text-sm">
                                Would you like to add this character to an existing world?
                                This will provide context to the AI about the setting.
                            </p>
                        </div>

                        <div className="space-y-3 mb-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            <button
                                onClick={() => proceedToCreate()}
                                className="w-full flex items-center p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-primary/50 transition-all group"
                            >
                                <div className="p-2 rounded-lg bg-zinc-800 text-zinc-400 group-hover:text-white transition-colors mr-4">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <div className="font-medium text-white group-hover:text-primary transition-colors">Start from Scratch</div>
                                    <div className="text-xs text-muted-foreground">No parent world context</div>
                                </div>
                                <ChevronRight className="ml-auto w-4 h-4 text-white/30 group-hover:text-primary transition-colors" />
                            </button>

                            {worlds.length > 0 && (
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t border-white/10" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-[#0a0a0a] px-2 text-muted-foreground">Or Select World</span>
                                    </div>
                                </div>
                            )}

                            {worlds.map(world => (
                                <button
                                    key={world.id}
                                    onClick={() => proceedToCreate(world.id)}
                                    className="w-full flex items-center p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-indigo-500/30 transition-all group"
                                >
                                    <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 mr-4">
                                        <Globe className="w-5 h-5" />
                                    </div>
                                    <div className="text-left flex-1 min-w-0">
                                        <div className="font-medium text-white truncate group-hover:text-indigo-400 transition-colors">{world.name}</div>
                                        <div className="text-xs text-muted-foreground line-clamp-1">
                                            {world.genre || 'Unknown Genre'}
                                        </div>
                                    </div>
                                    <ChevronRight className="ml-auto w-4 h-4 text-white/30 group-hover:text-indigo-400 transition-colors" />
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => setWorldSelectOpen(false)}
                            className="w-full py-3 rounded-xl hover:bg-white/5 text-sm text-muted-foreground hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div >
    );
}
