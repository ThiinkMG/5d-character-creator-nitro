'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import {
    Home,
    MessageSquare,
    Users,
    Globe,
    BarChart3,
    Settings,
    ChevronLeft,
    ChevronRight,
    Sparkles,
    Folder,
    PanelLeftClose,
    PanelLeftOpen,
    Trash2,
    Image as ImageIcon,
    FolderOpen,
    BookOpen,
    UserCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/lib/store';

interface NavItem {
    label: string;
    href: string;
    icon: React.ReactNode;
}

const navItems: NavItem[] = [
    { label: 'Home', href: '/', icon: <Home className="h-5 w-5" /> },
    { label: 'Chat', href: '/chat', icon: <MessageSquare className="h-5 w-5" /> },
    { label: 'History', href: '/history', icon: <Folder className="h-5 w-5" /> },
    { label: 'Characters', href: '/characters', icon: <Users className="h-5 w-5" /> },
    { label: 'Worlds', href: '/worlds', icon: <Globe className="h-5 w-5" /> },
    { label: 'Projects', href: '/projects', icon: <Folder className="h-5 w-5" /> },
    { label: 'Media & Files', href: '/media', icon: <FolderOpen className="h-5 w-5" /> },
    { label: 'Analysis', href: '/analysis', icon: <BarChart3 className="h-5 w-5" /> },
    { label: 'Guide', href: '/guide', icon: <BookOpen className="h-5 w-5" /> },
    { label: 'Profile', href: '/profile', icon: <UserCircle className="h-5 w-5" /> },
    { label: 'Trash', href: '/trash', icon: <Trash2 className="h-5 w-5" /> },
];

export function Sidebar() {
    const pathname = usePathname();
    const { isSidebarCollapsed, toggleSidebar } = useStore();
    const collapsed = isSidebarCollapsed;

    return (
        <aside
            className={cn(
                "fixed left-0 top-0 z-40 h-screen flex flex-col",
                "bg-sidebar border-r border-sidebar-border",
                "transition-all duration-300 ease-out",
                collapsed ? "w-[72px]" : "w-[260px]"
            )}
        >
            {/* Logo Section */}
            <div className="h-16 flex items-center px-4 border-b border-sidebar-border relative overflow-hidden">
                <Link
                    href="/"
                    className={cn(
                        "flex items-center gap-3 transition-all duration-300 ease-in-out absolute left-4",
                        collapsed ? "opacity-0 -translate-x-4 pointer-events-none" : "opacity-100 translate-x-0"
                    )}
                >
                    <div className="relative shrink-0">
                        <Image
                            src="/app-image-assets/5d-logo-solo.png"
                            alt="5D"
                            width={36}
                            height={36}
                            className="rounded-xl"
                        />
                    </div>
                    <div className={cn(
                        "flex flex-col whitespace-nowrap transition-all duration-300",
                        collapsed ? "opacity-0" : "opacity-100"
                    )}>
                        <span className="font-semibold text-sm tracking-tight">
                            5D Creator
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                            Character Studio
                        </span>
                    </div>
                </Link>

                <button
                    onClick={toggleSidebar}
                    className={cn(
                        "p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all duration-300 absolute",
                        collapsed ? "left-1/2 -translate-x-1/2" : "right-4 translate-x-0"
                    )}
                >
                    {collapsed ? (
                        <PanelLeftOpen className="h-5 w-5" />
                    ) : (
                        <PanelLeftClose className="h-5 w-5" />
                    )}
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
                {/* New Chat Button */}
                <Link
                    href="/chat?new=true"
                    className={cn(
                        "flex items-center gap-3 px-3 py-3 rounded-xl mb-4",
                        "bg-gradient-to-r from-primary/20 to-primary/10",
                        "border border-primary/30",
                        "text-foreground font-medium text-sm",
                        "transition-all duration-200",
                        "hover:from-primary/25 hover:to-primary/15 hover:border-primary/40",
                        "ember-glow-subtle",
                        collapsed && "justify-center px-0"
                    )}
                >
                    <Sparkles className="h-4 w-4 text-primary" />
                    {!collapsed && <span>New Chat</span>}
                </Link>

                {/* Separator */}
                <div className="h-px bg-sidebar-border mb-4" />

                {/* Nav Links */}
                {navItems.map((item) => {
                    const isActive = pathname === item.href;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-xl",
                                "transition-all duration-200",
                                isActive
                                    ? "nav-link-active"
                                    : "nav-link",
                                collapsed && "justify-center px-0"
                            )}
                        >
                            <span className={cn("nav-icon", isActive && "text-primary")}>
                                {item.icon}
                            </span>
                            {!collapsed && (
                                <span className="text-sm font-medium">{item.label}</span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom Section */}
            <div className="p-3 border-t border-sidebar-border space-y-2">
                {/* Settings */}
                <Link
                    href="/settings"
                    className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl",
                        "transition-all duration-200",
                        pathname === '/settings' ? "nav-link-active" : "nav-link",
                        collapsed && "justify-center px-0"
                    )}
                >
                    <Settings className="h-5 w-5" />
                    {!collapsed && <span className="text-sm font-medium">Settings</span>}
                </Link>

                {/* Collapse Toggle Removed from Bottom */}
            </div>
        </aside>
    );
}
