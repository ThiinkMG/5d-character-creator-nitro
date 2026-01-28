/**
 * Hooks Index
 *
 * Central export point for all custom React hooks.
 * Phase 1 Week 3: Context Sidecar System
 */

// @ Mention Detection Hook
export {
    useMentionDetection,
    useLiveMentionDetection,
    type EntityMention
} from './useMentionDetection';

// Context Sidecar Hook
export {
    useContextSidecar,
    type DetectedEntity,
    type PinnedEntityData,
    type EntityWithType,
    type UseContextSidecarOptions
} from './useContextSidecar';
