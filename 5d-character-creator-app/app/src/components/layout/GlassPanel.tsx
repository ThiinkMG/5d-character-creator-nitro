import { cn } from '@/lib/utils';

interface GlassPanelProps {
    children: React.ReactNode;
    className?: string;
    variant?: 'default' | 'strong' | 'card';
    as?: 'div' | 'section' | 'article' | 'aside';
}

export function GlassPanel({
    children,
    className,
    variant = 'default',
    as: Component = 'div'
}: GlassPanelProps) {
    return (
        <Component
            className={cn(
                "rounded-xl",
                variant === 'default' && "glass",
                variant === 'strong' && "glass-strong",
                variant === 'card' && "glass-card",
                className
            )}
        >
            {children}
        </Component>
    );
}
