"use client"

import * as React from "react"
import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
    FolderPlus,
    ArrowRightLeft,
    Copy,
    ChevronRight,
    Check,
    Folder,
    ArrowLeft,
    Plus,
    Sparkles
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useStore } from "@/lib/store"
import { Project } from "@/types/project"

type ActionType = 'add' | 'move' | 'duplicate' | null;

interface ProjectSettingsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    itemId: string;
    itemName: string;
    itemType: 'character' | 'world';
    currentProjectId?: string;
    onAction: (action: ActionType, targetProjectId: string) => void;
}

export function ProjectSettingsModal({
    open,
    onOpenChange,
    itemId,
    itemName,
    itemType,
    currentProjectId,
    onAction
}: ProjectSettingsModalProps) {
    const { projects, addProject } = useStore();
    const [selectedAction, setSelectedAction] = useState<ActionType>(null);
    const [selectedProject, setSelectedProject] = useState<string | null>(null);
    const [step, setStep] = useState<'select-action' | 'select-project' | 'create-project' | 'confirm'>('select-action');

    // New project creation state
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectGenre, setNewProjectGenre] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const currentProject = currentProjectId ? projects.find(p => p.id === currentProjectId) : null;

    // Filter projects based on action
    const availableProjects = projects.filter(p => {
        if (selectedAction === 'move' || selectedAction === 'duplicate') {
            return p.id !== currentProjectId;
        }
        const ids = itemType === 'character' ? p.characterIds : p.worldIds;
        return !ids?.includes(itemId);
    });

    const handleActionSelect = (action: ActionType) => {
        setSelectedAction(action);
        setStep('select-project');
    };

    const handleProjectSelect = (projectId: string) => {
        setSelectedProject(projectId);
        setStep('confirm');
    };

    const handleCreateNewClick = () => {
        setStep('create-project');
        setNewProjectName('');
        setNewProjectGenre('');
    };

    const handleCreateProject = async () => {
        if (!newProjectName.trim()) return;

        setIsCreating(true);

        try {
            const newId = `PROJECT_${Date.now().toString().slice(-6)}`;
            const newProject: Project = {
                id: newId,
                name: newProjectName.trim(),
                genre: newProjectGenre.trim() || 'General',
                summary: '',
                characterIds: [],
                worldIds: [],
                progress: 0,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            addProject(newProject);

            // Auto-select the newly created project
            setSelectedProject(newId);
            setStep('confirm');
        } finally {
            setIsCreating(false);
        }
    };

    const handleConfirm = () => {
        if (selectedAction && selectedProject) {
            onAction(selectedAction, selectedProject);
            handleClose();
        }
    };

    const handleBack = () => {
        if (step === 'confirm') {
            setSelectedProject(null);
            setStep('select-project');
        } else if (step === 'create-project') {
            setStep('select-project');
        } else if (step === 'select-project') {
            setSelectedAction(null);
            setStep('select-action');
        }
    };

    const handleClose = () => {
        setSelectedAction(null);
        setSelectedProject(null);
        setStep('select-action');
        setNewProjectName('');
        setNewProjectGenre('');
        onOpenChange(false);
    };

    const actionOptions = [
        {
            id: 'add' as const,
            label: 'Add to Project',
            description: 'Link this item to an additional project',
            icon: FolderPlus,
            disabled: false // Always enabled since we can create new
        },
        {
            id: 'move' as const,
            label: 'Move to Project',
            description: 'Remove from current project and add to another',
            icon: ArrowRightLeft,
            disabled: !currentProjectId
        },
        {
            id: 'duplicate' as const,
            label: 'Duplicate to Project',
            description: 'Create a copy in another project while keeping the original',
            icon: Copy,
            disabled: false // Always enabled since we can create new
        }
    ];

    const selectedActionInfo = actionOptions.find(a => a.id === selectedAction);
    const selectedProjectInfo = projects.find(p => p.id === selectedProject);

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-lg bg-[#0c0c14] border-white/10">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        {step !== 'select-action' && (
                            <button
                                onClick={handleBack}
                                className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4 text-muted-foreground" />
                            </button>
                        )}
                        <DialogTitle className="text-lg font-semibold text-white">
                            {step === 'select-action' && 'Project Settings'}
                            {step === 'select-project' && selectedActionInfo?.label}
                            {step === 'create-project' && 'Create New Project'}
                            {step === 'confirm' && 'Confirm Action'}
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-sm text-muted-foreground">
                        {step === 'select-action' && `Manage "${itemName}" project assignment`}
                        {step === 'select-project' && 'Select a destination project or create new'}
                        {step === 'create-project' && 'Enter details for the new project'}
                        {step === 'confirm' && 'Review and confirm your changes'}
                    </DialogDescription>

                    {/* Current Project Badge */}
                    {currentProject && step === 'select-action' && (
                        <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
                            <Folder className="w-4 h-4 text-primary" />
                            <span className="text-sm text-primary">Current: {currentProject.name}</span>
                        </div>
                    )}
                </DialogHeader>

                <div className="mt-4 space-y-2">
                    {/* Step 1: Select Action */}
                    {step === 'select-action' && (
                        <>
                            {actionOptions.map((action) => (
                                <button
                                    key={action.id}
                                    onClick={() => !action.disabled && handleActionSelect(action.id)}
                                    disabled={action.disabled}
                                    className={cn(
                                        "w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all",
                                        "border border-white/5 hover:border-white/10",
                                        action.disabled
                                            ? "opacity-40 cursor-not-allowed bg-white/[0.02]"
                                            : "bg-white/[0.03] hover:bg-white/[0.06]"
                                    )}
                                >
                                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 border border-primary/20">
                                        <action.icon className="w-5 h-5 text-primary" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-sm font-medium text-white">{action.label}</h4>
                                        <p className="text-xs text-muted-foreground mt-0.5">{action.description}</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-white/30" />
                                </button>
                            ))}
                        </>
                    )}

                    {/* Step 2: Select Project */}
                    {step === 'select-project' && (
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                            {/* Create New Project Button */}
                            <button
                                onClick={handleCreateNewClick}
                                className={cn(
                                    "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all",
                                    "border border-dashed border-primary/30 hover:border-primary/50",
                                    "bg-primary/5 hover:bg-primary/10"
                                )}
                            >
                                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/20">
                                    <Plus className="w-4 h-4 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-sm font-medium text-primary">+ Create New Project</h4>
                                    <p className="text-xs text-primary/60">Start a new project for this item</p>
                                </div>
                                <Sparkles className="w-4 h-4 text-primary/50" />
                            </button>

                            {/* Existing Projects */}
                            {availableProjects.length > 0 && (
                                <div className="pt-2 border-t border-white/5 mt-2 space-y-2">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider px-1 mb-2">
                                        Existing Projects
                                    </p>
                                    {availableProjects.map((project) => (
                                        <button
                                            key={project.id}
                                            onClick={() => handleProjectSelect(project.id)}
                                            className={cn(
                                                "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all",
                                                "border border-white/5 hover:border-primary/30",
                                                "bg-white/[0.03] hover:bg-primary/5"
                                            )}
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
                                </div>
                            )}

                            {availableProjects.length === 0 && (
                                <p className="text-center text-muted-foreground text-sm py-4">
                                    No existing projects available. Create a new one above.
                                </p>
                            )}
                        </div>
                    )}

                    {/* Step 2b: Create New Project Form */}
                    {step === 'create-project' && (
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

                            <DialogFooter className="gap-2 sm:gap-2 mt-4">
                                <Button
                                    variant="outline"
                                    onClick={handleBack}
                                    className="flex-1 glass"
                                    disabled={isCreating}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleCreateProject}
                                    className="flex-1 premium-button"
                                    disabled={!newProjectName.trim() || isCreating}
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    {isCreating ? 'Creating...' : 'Create & Select'}
                                </Button>
                            </DialogFooter>
                        </div>
                    )}

                    {/* Step 3: Confirm */}
                    {step === 'confirm' && selectedActionInfo && selectedProjectInfo && (
                        <div className="space-y-4">
                            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Action</span>
                                    <span className="text-sm text-white font-medium">{selectedActionInfo.label}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Item</span>
                                    <span className="text-sm text-white">{itemName}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground uppercase tracking-wider">
                                        {selectedAction === 'move' ? 'Move to' : 'Target'}
                                    </span>
                                    <span className="text-sm text-primary font-medium">{selectedProjectInfo.name}</span>
                                </div>
                                {selectedAction === 'move' && currentProject && (
                                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                        <span className="text-xs text-muted-foreground uppercase tracking-wider">From</span>
                                        <span className="text-sm text-red-400">{currentProject.name}</span>
                                    </div>
                                )}
                            </div>

                            {selectedAction === 'duplicate' && (
                                <div className="px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                                    A copy will be created in {selectedProjectInfo.name}. The original will remain unchanged.
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {step === 'confirm' && (
                    <DialogFooter className="gap-2 sm:gap-2 mt-4">
                        <Button
                            variant="outline"
                            onClick={handleBack}
                            className="flex-1 glass"
                        >
                            Back
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            className="flex-1 premium-button"
                        >
                            <Check className="w-4 h-4 mr-2" />
                            Confirm
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
}
