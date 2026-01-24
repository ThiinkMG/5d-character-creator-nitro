'use client';

import { useState, useEffect, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { ProjectCard, ProjectSettingsModal, CreateProjectModal } from '@/components/project';
import { SmartFilterPanel } from '@/components/ui/smart-filter';
import { Button } from '@/components/ui/button';
import { Plus, Search, Filter, Folder, Sparkles, ChevronRight, Trash2, X, ChevronDown, Check, ArrowUpDown } from 'lucide-react';
import Link from 'next/link';
import { Pagination } from '@/components/ui/pagination';
import { ViewToggle, useViewMode } from '@/components/ui/view-toggle';
import { cn } from '@/lib/utils';
import { Project } from '@/types/project';

// Helper component for dropdowns
function Dropdown({ trigger, children, isOpen, onClose }: { trigger: React.ReactNode; children: React.ReactNode; isOpen: boolean; onClose: () => void }) {
    if (!isOpen) return <>{trigger}</>;
    return (
        <div className="relative">
            {trigger}
            <div className="absolute top-full left-0 mt-2 w-56 rounded-xl glass-card border border-white/10 shadow-2xl z-50 overflow-hidden">
                {children}
            </div>
            <div className="fixed inset-0 z-40" onClick={onClose} />
        </div>
    );
}

export default function ProjectsPage() {
    const { projects, characters, worlds, addProject, deleteProject, updateProject, updateProjectGenre, addCharacter, addWorld } = useStore();
    const [searchQuery, setSearchQuery] = useState('');

    // Selection state
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    // Filter/Sort state
    const [sortOpen, setSortOpen] = useState(false);
    const [sortBy, setSortBy] = useState<'date' | 'a-z' | 'z-a' | 'progress'>('date');
    const [filteredByPanel, setFilteredByPanel] = useState<Project[]>(projects);

    // Settings Modal State
    const [settingsModalOpen, setSettingsModalOpen] = useState(false);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [selectedProjectForSettings, setSelectedProjectForSettings] = useState<string | null>(null);

    // Pagination & View
    const ITEMS_PER_PAGE = 12;
    const [currentPage, setCurrentPage] = useState(1);
    const [viewMode, setViewMode] = useViewMode('projects-view', 'grid');

    // Base filter (Search) - passed to panel to ensure tags match search results
    const searchedProjects = useMemo(() => {
        if (!searchQuery) return projects;
        return projects.filter(p =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.genre.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [projects, searchQuery]);

    // Update filteredByPanel when projects change (fix stale data)
    useEffect(() => {
        setFilteredByPanel(searchedProjects);
    }, [searchedProjects]);

    // Final Sort applied to panel results
    const finalDisplayProjects = useMemo(() => {
        const result = [...filteredByPanel];

        // Sort
        result.sort((a, b) => {
            if (sortBy === 'a-z') return a.name.localeCompare(b.name);
            if (sortBy === 'z-a') return b.name.localeCompare(a.name);
            if (sortBy === 'progress') return b.progress - a.progress;
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });

        return result;
    }, [filteredByPanel, sortBy]);

    // Calculate pagination
    // Calculate pagination
    const totalPages = Math.ceil(finalDisplayProjects.length / ITEMS_PER_PAGE);
    const paginatedProjects = finalDisplayProjects.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    // Reset to page 1 when filter changes
    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
        } else if (totalPages === 0) {
            setCurrentPage(1);
        }
    }, [finalDisplayProjects.length, totalPages, currentPage]);

    // Clear selection when filter/search changes
    useEffect(() => {
        setSelectedItems(new Set());
    }, [searchQuery, filteredByPanel]);

    // Selection handlers
    const handleSelect = (id: string) => {
        const newSelected = new Set(selectedItems);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedItems(newSelected);
    };

    const handleSelectAll = () => {
        if (selectedItems.size === paginatedProjects.length) {
            setSelectedItems(new Set());
        } else {
            setSelectedItems(new Set(paginatedProjects.map(p => p.id)));
        }
    };

    const handleBulkDelete = () => {
        selectedItems.forEach(id => deleteProject(id));
        setSelectedItems(new Set());
        setDeleteDialogOpen(false);
    };

    const handleCreateDemo = () => {
        const pid = '#ECHO_PROJECT';

        addProject({
            id: pid,
            name: 'The Last Echo',
            genre: 'Sci-Fi Mystery',
            summary: 'A detective story set in a world where memories can be traded like currency.',
            progress: 25,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        addCharacter({
            id: '#KAI_ECHO',
            name: 'Kai Valerius',
            role: 'Protagonist',
            genre: 'Sci-Fi Noir',
            projectId: pid,
            progress: 40,
            phase: 'Personality',
            coreConcept: 'A memory broker who lost his own past.',
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        addWorld({
            id: '@ECHO_CITY',
            name: 'Mnemosyne City',
            genre: 'Cyberpunk',
            description: 'The city that never forgets, built on layers of server banks.',
            projectId: pid,
            progress: 60,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    };

    const handleOpenSettings = (projectId: string) => {
        setSelectedProjectForSettings(projectId);
        setSettingsModalOpen(true);
    };

    const handleSaveSettings = (updates: Partial<Project>) => {
        if (selectedProjectForSettings) {
            // Check for cascading genre update
            if (updates.genre && updates.genre !== projectForSettings?.genre) {
                updateProjectGenre(selectedProjectForSettings, updates.genre);
            }
            // Update other fields
            updateProject(selectedProjectForSettings, updates);
        }
    };

    const projectForSettings = selectedProjectForSettings
        ? projects.find(p => p.id === selectedProjectForSettings)
        : null;

    const handleCreateProject = (projectData: Pick<Project, 'name' | 'genre' | 'summary' | 'id'>) => {
        addProject({
            ...projectData,
            description: projectData.summary, // Map summary to description
            progress: 0,
            tags: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    };

    return (
        <>
            <div className="min-h-screen p-8 lg:p-12 mb-20 md:mb-0">
                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-cyan-500 to-teal-500" />
                            <h1 className="text-3xl font-semibold tracking-tight">Projects</h1>
                        </div>
                        <p className="text-muted-foreground text-base ml-5">
                            Organize your stories, campaigns, and universes
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            onClick={() => setCreateModalOpen(true)}
                            className="bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-500/20"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            New Project
                        </Button>
                    </div>
                </header>

                {/* Selection Toolbar */}
                {selectedItems.size > 0 && (
                    <div className="mb-6 flex items-center gap-4 p-4 rounded-xl glass-card border border-cyan-500/20 bg-cyan-500/5">
                        <span className="text-sm text-white/80">
                            {selectedItems.size} selected
                        </span>
                        <div className="h-4 w-px bg-white/20" />
                        <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            onClick={() => setDeleteDialogOpen(true)}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                        </Button>
                        <div className="flex-1" />
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedItems(new Set())}
                            className="text-white/60 hover:text-white"
                        >
                            <X className="h-4 w-4 mr-1" />
                            Clear
                        </Button>
                    </div>
                )}

                {/* Filters & Search */}
                <div className="flex flex-col md:flex-row gap-4 mb-8">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search projects..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full premium-input pl-10 focus:border-cyan-500/50"
                        />
                    </div>

                    {/* Filter Dropdown */}
                    <SmartFilterPanel
                        items={searchedProjects}
                        onFilterChange={setFilteredByPanel}
                        type="project"
                    />

                    {/* Sort Dropdown */}
                    <Dropdown
                        isOpen={sortOpen}
                        onClose={() => setSortOpen(false)}
                        trigger={
                            <Button variant="outline" className="glass gap-2" onClick={() => setSortOpen(!sortOpen)}>
                                <ArrowUpDown className="h-4 w-4" />
                                Sort
                                <ChevronDown className="h-3 w-3" />
                            </Button>
                        }
                    >
                        <div className="p-2">
                            {[
                                { value: 'date', label: 'Last Updated' },
                                { value: 'a-z', label: 'A to Z' },
                                { value: 'z-a', label: 'Z to A' },
                                { value: 'progress', label: 'Progress' }
                            ].map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => {
                                        // If clicking the same option, reset to default
                                        if (sortBy === opt.value) {
                                            setSortBy('date');
                                        } else {
                                            setSortBy(opt.value as typeof sortBy);
                                        }
                                        setSortOpen(false);
                                    }}
                                    className={cn(
                                        "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left",
                                        sortBy === opt.value ? "bg-cyan-500/20 text-cyan-400" : "hover:bg-white/5"
                                    )}
                                >
                                    {sortBy === opt.value && <Check className="w-4 h-4" />}
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </Dropdown>

                    <ViewToggle view={viewMode} onViewChange={setViewMode} />
                </div>

                {/* Select All toggle */}
                {finalDisplayProjects.length > 0 && (
                    <div className="flex items-center gap-4 mb-4">
                        <button
                            onClick={handleSelectAll}
                            className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
                        >
                            <div className={cn(
                                "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                                selectedItems.size === paginatedProjects.length && paginatedProjects.length > 0
                                    ? "bg-cyan-500 border-cyan-500"
                                    : "border-white/30 hover:border-cyan-400"
                            )}>
                                {selectedItems.size === paginatedProjects.length && paginatedProjects.length > 0 && (
                                    <Check className="w-3 h-3 text-white" />
                                )}
                            </div>
                            Select All
                        </button>
                        <span className="text-xs text-white/40">
                            {finalDisplayProjects.length} project{finalDisplayProjects.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                )}

                {/* Grid/List View */}
                {finalDisplayProjects.length > 0 ? (
                    <>
                        {viewMode === 'grid' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {paginatedProjects.map((project) => (
                                    <ProjectCard
                                        key={project.id}
                                        project={project}
                                        characterCount={characters.filter(c => c.projectId === project.id).length}
                                        worldCount={worlds.filter(w => w.projectId === project.id).length}
                                        isSelected={selectedItems.has(project.id)}
                                        onSelect={handleSelect}
                                        onSettings={handleOpenSettings}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {paginatedProjects.map((project) => {
                                    const charCount = characters.filter(c => c.projectId === project.id).length;
                                    const worldCount = worlds.filter(w => w.projectId === project.id).length;
                                    const isSelected = selectedItems.has(project.id);
                                    return (
                                        <div
                                            key={project.id}
                                            className={cn(
                                                "group flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all",
                                                "bg-white/[0.02] border hover:bg-white/[0.04]",
                                                isSelected ? "border-cyan-500/50 ring-1 ring-cyan-500/30" : "border-white/5 hover:border-cyan-500/20"
                                            )}
                                        >
                                            {/* Checkbox */}
                                            <div
                                                onClick={(e) => { e.stopPropagation(); handleSelect(project.id); }}
                                                className={cn(
                                                    "w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition-all flex-shrink-0",
                                                    isSelected
                                                        ? "bg-cyan-500 border-cyan-500"
                                                        : "border-white/30 opacity-0 group-hover:opacity-100 hover:border-cyan-400"
                                                )}
                                            >
                                                {isSelected && <Check className="w-3 h-3 text-white" />}
                                            </div>
                                            <Link href={`/projects/${project.id}`} className="flex items-center gap-4 flex-1 min-w-0">
                                                <div className="w-12 h-12 rounded-lg bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                                                    <Folder className="w-5 h-5 text-cyan-400" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-sm font-medium text-white truncate">{project.name}</h3>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-xs text-white/50">{project.genre}</span>
                                                        <span className="text-white/20">•</span>
                                                        <span className="text-xs text-white/40">{charCount} char, {worldCount} world</span>
                                                    </div>
                                                </div>
                                                <div className="text-xs text-cyan-400">{project.progress || 0}%</div>
                                                <ChevronRight className="w-4 h-4 text-white/20" />
                                            </Link>
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
                    </>
                ) : (
                    /* Empty State */
                    <div className="glass-card rounded-2xl p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
                        <div className="w-20 h-20 rounded-3xl bg-cyan-500/10 flex items-center justify-center mb-6">
                            <Folder className="h-10 w-10 text-cyan-400" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">No projects found</h3>
                        <p className="text-muted-foreground max-w-sm mb-8">
                            {searchQuery
                                ? `No results for "${searchQuery}". Try a different search term.`
                                : "Start by creating a new story project to organize your work."}
                        </p>
                        <div className="flex gap-4">
                            {searchQuery ? (
                                <Button variant="outline" onClick={() => setSearchQuery('')}>Clear Search</Button>
                            ) : (
                                <>
                                    <Button variant="outline" onClick={handleCreateDemo} className="glass">
                                        Load Demo Data
                                    </Button>
                                    <Link href="/chat?mode=project">
                                        <Button className="bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-500/20">
                                            <Sparkles className="h-4 w-4 mr-2" />
                                            Create with AI
                                        </Button>
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Bulk Delete Dialog */}
            {deleteDialogOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setDeleteDialogOpen(false)} />
                    <div className="relative glass-card rounded-2xl p-6 max-w-md mx-4 border border-white/10">
                        <h3 className="text-lg font-semibold mb-2">Delete Projects?</h3>
                        <p className="text-muted-foreground mb-6">
                            This will permanently delete {selectedItems.size} project{selectedItems.size !== 1 ? 's' : ''} and cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                            <Button className="bg-red-600 hover:bg-red-500 text-white" onClick={handleBulkDelete}>
                                Delete
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Project Settings Modal */}
            {projectForSettings && (
                <ProjectSettingsModal
                    isOpen={settingsModalOpen}
                    onClose={() => {
                        setSettingsModalOpen(false);
                        setSelectedProjectForSettings(null);
                    }}
                    project={projectForSettings}
                    onSave={handleSaveSettings}
                />
            )}

            <CreateProjectModal
                isOpen={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                onCreate={handleCreateProject}
            />
        </>
    );
}
