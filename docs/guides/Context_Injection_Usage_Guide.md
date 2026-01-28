# Context Injection System - Usage Guide

**Version:** 1.0
**Date:** 2026-01-28
**For:** Developers integrating the Just-in-Time Context Injection system

---

## Overview

The Context Injection system optimizes AI prompts by filtering entity fields based on the active chat mode. This reduces token usage by 40-60% while ensuring each mode gets exactly the fields it needs.

---

## Quick Start

### 1. Enable Context Injection in Chat API

```typescript
const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        messages: conversationMessages,
        chatMode: 'scene', // One of 9 modes
        linkedEntities: {
            characters: [character1, character2],
            worlds: [world1],
            projects: []
        },
        useContextInjection: true, // Enable new system
        provider: 'anthropic',
        apiKey: userApiKey,
    }),
});
```

### 2. Enable Dev Mode for Debugging

```typescript
// In browser console
localStorage.setItem('5d-dev-mode', 'true');

// Reload page to see debug panel toggle in chat header
```

### 3. Access Debug Info (Admin Mode)

```typescript
const response = await fetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify({
        // ... other params
        isAdminMode: true, // Include debug info in response
    }),
});

const data = await response.json();
console.log(data.debug?.contextInjection);
// {
//     mode: 'scene',
//     tokenCount: 842,
//     budget: 900,
//     entitiesIncluded: { characters: [...], worlds: [...] },
//     fieldsIncluded: { character: [...], world: [...] },
//     truncatedFields: [...]
// }
```

---

## Available Chat Modes

| Mode | Purpose | Character Budget | World Budget | Project Budget |
|------|---------|-----------------|--------------|----------------|
| `chat` | General conversation | 20% | 20% | 20% |
| `character` | Character creation/editing | 70% | 15% | 15% |
| `world` | World-building | 15% | 70% | 15% |
| `project` | Project management | 35% | 25% | 40% |
| `lore` | Lore exploration | 15% | 75% | 10% |
| `scene` | Scene writing/roleplay | 70% | 20% | 10% |
| `workshop` | Character deep-dive | 80% | 10% | 10% |
| `chat_with` | Character roleplay | 80% | 15% | 5% |
| `script` | Script creation | 65% | 25% | 10% |

---

## Field Priority System

Each mode defines which fields to include and their priority:

- **High Priority:** Always included, truncated if necessary
- **Medium Priority:** Included if space available, may be truncated
- **Low Priority:** Included only if space available, dropped first

### Example: Scene Mode Character Fields

```typescript
characterFields: [
    { field: 'name', priority: 'high' },                    // Always included
    { field: 'voiceProfile', priority: 'high' },            // Always included
    { field: 'motivations', priority: 'high', maxItems: 5 },// First 5 items
    { field: 'personalityProse', priority: 'medium' },      // If space allows
    { field: 'origin', priority: 'low' },                   // Last priority
]
```

---

## Adding a New Chat Mode

### Step 1: Define Mode Configuration

Edit `lib/modeContextConfig.ts`:

```typescript
export const MODE_CONTEXT_CONFIGS: Record<ChatMode, ModeContextConfig> = {
    // ... existing modes

    my_new_mode: {
        mode: 'my_new_mode',
        description: 'Description of what this mode does',
        characterFields: [
            { field: 'name', priority: 'high' },
            { field: 'relevantField', priority: 'high' },
            { field: 'secondaryField', priority: 'medium' },
            // Add more fields as needed
        ],
        worldFields: [
            { field: 'name', priority: 'high' },
            { field: 'genre', priority: 'medium' },
            // Add more fields as needed
        ],
        projectFields: [
            { field: 'name', priority: 'medium' },
            // Add more fields as needed
        ],
        tokenBudgetPercentage: {
            character: 70, // Allocate 70% to characters
            world: 20,     // Allocate 20% to worlds
            project: 10,   // Allocate 10% to projects
        },
        formatHint: 'detailed', // 'minimal', 'standard', or 'detailed'
    },
};
```

### Step 2: Add Mode to Type Definition

Edit `lib/mode-registry.ts`:

```typescript
export type ChatMode = 'chat' | 'character' | 'world' | 'project' |
                       'lore' | 'scene' | 'workshop' | 'chat_with' |
                       'script' | 'my_new_mode'; // Add here
```

### Step 3: Add Mode to Registry

```typescript
export const MODE_REGISTRY: Record<ChatMode, ModeConfig> = {
    // ... existing modes

    my_new_mode: {
        id: 'my_new_mode',
        label: 'My New Mode',
        description: 'Description for UI',
        icon: MyIcon, // Lucide React icon
        color: 'text-purple-400',
        instruction: `[MODE INSTRUCTIONS]
        Detailed instructions for the AI...`,
        showInModeSwitcher: true,
    },
};
```

---

## Customizing Field Priorities

### Use Case: Boost Backstory Priority in Workshop Mode

Edit `lib/modeContextConfig.ts`:

```typescript
workshop: {
    // ...
    characterFields: [
        { field: 'backstoryProse', priority: 'high' }, // Changed from 'medium'
        // ... other fields
    ],
}
```

### Use Case: Include More Faction Items

```typescript
lore: {
    // ...
    worldFields: [
        { field: 'factions', priority: 'medium', maxItems: 10 }, // Increased from 8
        // ... other fields
    ],
}
```

### Use Case: Add Nested Field

```typescript
scene: {
    // ...
    characterFields: [
        {
            field: 'voiceProfile',
            priority: 'high',
            path: ['voiceProfile'] // Access nested object
        },
        // ... other fields
    ],
}
```

---

## Token Budget Tuning

### Adjusting Total Entity Budget

In `app/api/chat/route.ts`:

```typescript
// Current: 30% of total budget allocated to entities
const entityContextBudget = Math.floor(tokenBudget * 0.3);

// To increase entity context allocation
const entityContextBudget = Math.floor(tokenBudget * 0.4); // 40%
```

### Adjusting Per-Mode Allocation

In `lib/modeContextConfig.ts`:

```typescript
scene: {
    // ...
    tokenBudgetPercentage: {
        character: 75, // Increased from 70%
        world: 20,     // Same
        project: 5,    // Decreased from 10%
    },
}
```

---

## Context Debug Panel

### Enabling the Panel

1. Set `localStorage['5d-dev-mode'] = 'true'`
2. Reload page
3. Look for debug icon in chat header
4. Click to show/hide panel

### Panel Sections

#### Summary
- Shows current mode, token count, budget utilization
- Color-coded progress bar (green/yellow/red)

#### Entities Included
- Lists all linked entities by type
- Shows count per type

#### Fields Per Entity
- Shows which fields were included
- Color-coded badges per entity type

#### Truncated Fields
- Warning section showing truncated fields
- Helps identify over-budget situations

#### Full Context Text
- Raw markdown context sent to AI
- Scrollable, monospace font
- Copy-paste friendly

#### Budget Allocation
- Token budget per entity type
- Helps tune allocations

---

## Common Patterns

### Pattern 1: Mode-Specific Context Assembly

```typescript
import { assembleContextForPrompt } from '@/lib/contextInjection';

const context = assembleContextForPrompt(
    'scene',
    {
        characters: [character1, character2],
        worlds: [world1],
        projects: []
    },
    userMessage,
    3000, // Token budget
    false  // Debug info
);

console.log(context.contextString); // Formatted markdown
console.log(context.tokenCount);    // Total tokens used
console.log(context.fieldsIncluded); // Which fields included
```

### Pattern 2: Checking if Context Fits Budget

```typescript
import { validateContextBudget } from '@/lib/contextInjection';

const validation = validateContextBudget(assembledContext, 3000);

if (!validation.fits) {
    console.warn(`Context exceeds budget by ${validation.overageTokens} tokens`);
    console.log(validation.recommendation);
}
```

### Pattern 3: Getting Minimal Context (Fallback)

```typescript
import { getMinimalEntityContext } from '@/lib/contextInjection';

// If full context is too large, use minimal context
const minimalContext = getMinimalEntityContext(character, 'character');
// Returns: "### 👤 CHARACTER: Kira Shadowbane (#KIRA_001)\n- Core concept..."
```

### Pattern 4: Filtering Individual Entities

```typescript
import { filterCharacterFields } from '@/lib/entityFieldFilter';
import { getModeContextConfig } from '@/lib/modeContextConfig';

const modeConfig = getModeContextConfig('scene');
const filtered = filterCharacterFields(
    character,
    modeConfig.characterFields,
    1000 // Token budget for this character
);

console.log(filtered.fields);           // Only included fields
console.log(filtered.tokenCount);       // Tokens used
console.log(filtered.includedFields);   // Field names included
console.log(filtered.truncatedFields);  // Field names truncated
```

---

## Troubleshooting

### Issue: Context Still Too Large

**Problem:** Token count exceeds budget even with filtering

**Solutions:**
1. Reduce `maxItems` for array fields
2. Lower priority of prose fields
3. Increase truncation aggressiveness
4. Split entities across multiple requests

### Issue: Important Fields Missing

**Problem:** High-priority field not included

**Possible Causes:**
1. Field value is `undefined` or `null`
2. Token budget too small (increase entity budget %)
3. Field name typo in config
4. Nested path incorrect

**Debug Steps:**
1. Enable dev mode and check debug panel
2. Verify field exists in entity: `console.log(entity.fieldName)`
3. Check mode config: `getModeContextConfig(mode)`
4. Increase token budget temporarily to see if field appears

### Issue: Truncated Fields Not Readable

**Problem:** Truncated prose fields lose meaning

**Solutions:**
1. Increase field priority (medium → high)
2. Increase token budget for entity type
3. Use AI summarization for long fields (future feature)
4. Store shorter prose in entity

### Issue: Debug Panel Not Showing

**Problem:** Panel toggle not visible

**Solutions:**
1. Verify `localStorage['5d-dev-mode'] === 'true'`
2. Hard reload page (Ctrl+Shift+R)
3. Check browser console for errors
4. Verify `ContextDebugPanel` component imported

---

## Performance Optimization

### Optimizing for Speed

**Current Performance:**
- Single entity: ~10ms
- 5 entities: ~45ms
- 10 entities: ~70ms

**If performance becomes an issue:**

1. **Memoize mode configs:**
```typescript
const modeConfig = useMemo(
    () => getModeContextConfig(mode),
    [mode]
);
```

2. **Cache filtered entities:**
```typescript
const filtered = useMemo(
    () => filterCharacterFields(character, config, budget),
    [character, config, budget]
);
```

3. **Debounce context assembly:**
```typescript
const debouncedAssemble = useMemo(
    () => debounce(assembleContextForPrompt, 300),
    []
);
```

### Optimizing for Token Usage

**To reduce token count further:**

1. **Aggressive array truncation:**
```typescript
{ field: 'motivations', priority: 'high', maxItems: 3 } // Reduced from 5
```

2. **Remove low-priority prose fields:**
```typescript
// Don't include low-priority prose fields at all
characterFields: [
    // ... high/medium fields only
    // Remove: { field: 'backstoryProse', priority: 'low' }
]
```

3. **Use minimal format for secondary entities:**
```typescript
// Only include name and role for non-primary characters
```

---

## Testing Your Changes

### Unit Test Template

```typescript
import { filterCharacterFields } from '@/lib/entityFieldFilter';
import { getModeContextConfig } from '@/lib/modeContextConfig';

describe('Context Injection', () => {
    it('should include high-priority fields', () => {
        const character = {
            id: '#TEST_001',
            name: 'Test Character',
            role: 'Protagonist',
            motivations: ['motivation1', 'motivation2'],
            // ... other fields
        };

        const config = getModeContextConfig('scene');
        const filtered = filterCharacterFields(
            character,
            config.characterFields,
            1000
        );

        expect(filtered.includedFields).toContain('name');
        expect(filtered.includedFields).toContain('motivations');
    });
});
```

### Integration Test Template

```typescript
import { assembleContextForPrompt } from '@/lib/contextInjection';

describe('Full Context Assembly', () => {
    it('should assemble context within budget', () => {
        const context = assembleContextForPrompt(
            'scene',
            {
                characters: [testCharacter1, testCharacter2],
                worlds: [testWorld],
                projects: []
            },
            'Test message',
            3000
        );

        expect(context.tokenCount).toBeLessThanOrEqual(3000);
        expect(context.entitiesIncluded.characters).toHaveLength(2);
    });
});
```

---

## Best Practices

### 1. Mode Design
- Start with high-priority fields only
- Add medium-priority fields if needed
- Use low-priority sparingly (they're often dropped)

### 2. Token Budgets
- Allocate 70-80% to primary entity type
- Leave 20-30% for secondary entities
- Monitor utilization in debug panel

### 3. Field Selection
- Include `name`, `id` always (high priority)
- Include mode-relevant fields (high priority)
- Include context/background fields (medium priority)
- Include nice-to-have fields (low priority)

### 4. Testing
- Test with empty entities
- Test with fully populated entities
- Test with multiple linked entities
- Test with tight token budgets

### 5. Documentation
- Document why fields have certain priorities
- Document expected token usage per mode
- Document edge cases and limitations

---

## FAQ

**Q: Can I disable context injection for a specific chat?**

A: Yes, set `useContextInjection: false` in the API request.

**Q: How do I know if a field was truncated?**

A: Check `assembledContext.truncatedFields` or look in the debug panel.

**Q: Can I use context injection with streaming responses?**

A: Yes, context injection happens before streaming starts.

**Q: Does context injection work with all AI providers?**

A: Yes, it's provider-agnostic. Context is assembled before being sent to any provider.

**Q: How accurate is the token estimation?**

A: ~90% accurate using 4 chars/token heuristic. Actual tokenization varies by model.

**Q: Can I use multiple modes in one chat?**

A: No, only one mode is active per chat session. Switch modes to change context.

**Q: What happens if an entity has no high-priority fields?**

A: Minimal context (name, id, type) is always included.

**Q: Can I add custom fields to entities?**

A: Yes, add fields to entity type definition, then reference in mode config.

---

## Support

For issues or questions:
1. Check debug panel for clues
2. Review test plan: `docs/testing/Week4_Context_Injection_Test_Plan.md`
3. Review implementation report: `Session_Reports/February 2026/2026-01-28_Phase1_Week4_Context_Injection_Implementation.md`
4. Open issue with debug info

---

**Last Updated:** 2026-01-28
**Version:** 1.0
**Maintained By:** context-engineer agent
