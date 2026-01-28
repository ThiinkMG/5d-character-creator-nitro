# API Integration Guide - Phase 1

Quick reference for integrating Phase 1 chat API enhancements.

---

## Quick Start

### 1. Basic Request (No Entities)

```typescript
const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        messages: [
            { role: 'user', content: 'Hello!' }
        ],
        provider: 'anthropic',
        apiKey: userApiKey
    })
});

const text = await response.text();
```

### 2. Request with Pinned Entities

```typescript
// Get pinned entities from Context Sidecar
const pinnedEntityIds = useStore(state => state.pinnedEntityIds);

// Fetch full entity data
const entities = pinnedEntityIds.map(id => {
    if (id.startsWith('#')) return useStore.getState().getCharacter(id);
    if (id.startsWith('@')) return useStore.getState().getWorld(id);
    if (id.startsWith('$')) return useStore.getState().getProject(id);
}).filter(Boolean);

const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        messages: [...],
        provider: 'anthropic',
        apiKey: userApiKey,
        pinnedEntityIds,
        entities // Full entity data
    })
});

const data = await response.json();
console.log(data.text);
console.log(data.entityReferences); // Entities mentioned in response
```

### 3. Request with @ Mentions

```typescript
// User typed: "What if @NewCharacter met Elara?"

// Extract mentions from message
import { parseEntityMentions } from '@/lib/apiValidation';
const mentions = parseEntityMentions(message);

// Get mentioned entity IDs
const mentionedEntityIds = mentions
    .filter(m => m.id)
    .map(m => m.id!);

const response = await fetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify({
        messages: [{ role: 'user', content: message }],
        mentionedEntityIds,
        entities: [...] // Include mentioned entities
    })
});
```

---

## Error Handling

### Rate Limit (429)

```typescript
if (response.status === 429) {
    const data = await response.json();
    const retryAfter = data.retryAfter; // Seconds
    const resetAt = response.headers.get('X-RateLimit-Reset');

    // Show user-friendly message
    toast.error(`Rate limit exceeded. Please wait ${retryAfter} seconds.`);

    // Disable send button with countdown
    setDisabled(true);
    setTimeout(() => setDisabled(false), retryAfter * 1000);
}
```

### Invalid API Key (401)

```typescript
if (response.status === 401) {
    const data = await response.json();

    // data.invalidKey = 'anthropicKey' or 'openaiKey'
    // Redirect to settings with highlighted field
    router.push(`/settings?highlight=${data.invalidKey}`);

    toast.error(data.error);
}
```

### Model Not Found (404)

```typescript
if (response.status === 404) {
    const data = await response.json();

    // Show detailed error with guidance
    showDialog({
        title: 'API Configuration Issue',
        message: data.error,
        actions: [
            { label: 'Check API Key', action: () => router.push('/settings') },
            { label: 'View Documentation', action: () => window.open('/docs/api-keys') }
        ]
    });
}
```

### Service Unavailable (503)

```typescript
if (response.status === 503) {
    const data = await response.json();

    // Show retry option
    toast.error(data.error, {
        action: {
            label: 'Retry',
            onClick: () => retryRequest()
        }
    });
}
```

---

## Response Enrichment

### Entity References

```typescript
const data = await response.json();

if (data.entityReferences && data.entityReferences.length > 0) {
    // Highlight mentioned entities in response
    data.entityReferences.forEach(ref => {
        // ref = { name: 'Elara', type: 'character', id: '#ELARA_902', confidence: 0.9 }

        // Make entity name clickable
        highlightEntityName(ref.name, () => {
            navigateToEntity(ref.id);
        });
    });
}
```

### Detected Facts

```typescript
if (data.detectedFacts && data.detectedFacts.length > 0) {
    // Show "Add to Profile" suggestions
    data.detectedFacts.forEach(fact => {
        // fact = {
        //   entityId: '#ELARA_902',
        //   category: 'physical',
        //   fact: 'has blue eyes',
        //   confidence: 'definite',
        //   quote: 'Elara has striking blue eyes...'
        // }

        showFactSuggestion({
            entity: getEntity(fact.entityId),
            fact: fact.fact,
            category: fact.category,
            confidence: fact.confidence,
            onAccept: () => addCanonicalFact(fact),
            onReject: () => dismissSuggestion(fact)
        });
    });
}
```

---

## Validation

### Client-Side Validation

```typescript
import { validateChatRequest } from '@/lib/apiValidation';

// Validate before sending
const validation = validateChatRequest(requestBody);

if (!validation.valid) {
    // Show validation errors
    validation.errors.forEach(error => {
        toast.error(error);
    });
    return;
}

// Use sanitized body
const response = await fetch('/api/chat', {
    body: JSON.stringify(validation.sanitized)
});
```

### Entity ID Validation

```typescript
import { parseEntityMentions } from '@/lib/apiValidation';

// Parse and validate entity IDs
const mentions = parseEntityMentions(message);

mentions.forEach(mention => {
    if (mention.id) {
        // Valid entity ID (format: #CID, @WID, $SID)
        // Fetch from store
        const entity = getEntityById(mention.id);
        if (!entity) {
            toast.warning(`Entity ${mention.name} not found`);
        }
    } else {
        // Plain @ mention (no ID)
        // Offer to create stub entity
        showCreateEntityDialog(mention.name);
    }
});
```

---

## Rate Limit Headers

```typescript
const response = await fetch('/api/chat', { ... });

// Check rate limit status
const remaining = parseInt(response.headers.get('X-RateLimit-Remaining') || '0');
const resetAt = response.headers.get('X-RateLimit-Reset');

// Show warning when low
if (remaining < 5) {
    toast.warning(`Rate limit: ${remaining} requests remaining`);
}

// Show remaining in UI
setRateLimitStatus({ remaining, resetAt });
```

---

## Debug Mode

```typescript
// Enable admin mode for debug info
const response = await fetch('/api/chat', {
    body: JSON.stringify({
        messages: [...],
        isAdminMode: true // Requires admin key in .env
    })
});

const data = await response.json();

// Access debug info
console.log('Context budget:', data.debug.context);
console.log('RAG info:', data.debug.rag);
console.log('Entity stats:', data.debug.entities);
console.log('Rate limit:', data.debug.rateLimit);

// data.debug = {
//   rag: { method: 'semantic', resultsCount: 3 },
//   context: { totalTokens: 4500, includedSections: [...], ... },
//   entities: { total: 3, pinned: 2, mentioned: 1, ... },
//   rateLimit: { remaining: 18, resetAt: 1738073520000 }
// }
```

---

## TypeScript Types

```typescript
// Request body
interface ChatRequestBody {
    messages: Array<{
        role: 'user' | 'assistant' | 'system';
        content: string;
    }>;
    provider?: 'anthropic' | 'openai';
    apiKey?: string;
    isAdminMode?: boolean;

    // Phase 1
    pinnedEntityIds?: string[];
    mentionedEntityIds?: string[];
    entities?: Entity[];

    // Legacy
    linkedCharacter?: any;
    linkedWorld?: any;
    linkedProject?: any;
    modeInstruction?: string;
    mode?: ChatMode;
}

// Response body
interface ChatResponseBody {
    text: string;
    entityReferences?: EntityReference[];
    detectedFacts?: DetectedFact[];
    debug?: DebugInfo; // Only in admin mode
}

interface EntityReference {
    name: string;
    type: 'character' | 'world' | 'project';
    id?: string;
    confidence: number; // 0-1
}

interface DetectedFact {
    entityId: string;
    entityType: 'character' | 'world' | 'project';
    category: 'physical' | 'personality' | 'history' | 'relationship' | 'ability' | 'possession' | 'other';
    fact: string;
    confidence: 'definite' | 'implied' | 'tentative';
    quote: string;
}
```

---

## Best Practices

### 1. Always Handle Rate Limits

```typescript
// Implement retry with exponential backoff
async function sendMessage(body, retries = 3) {
    for (let i = 0; i < retries; i++) {
        const response = await fetch('/api/chat', { body });

        if (response.status !== 429) {
            return response;
        }

        // Wait before retry
        const data = await response.json();
        await new Promise(resolve => setTimeout(resolve, data.retryAfter * 1000));
    }

    throw new Error('Rate limit exceeded after retries');
}
```

### 2. Minimize Entity Data

```typescript
// Don't send unnecessary fields
function serializeForAPI(entity) {
    return {
        id: entity.id,
        name: entity.name,
        aliases: entity.aliases,
        // Include only fields needed for context
        coreConcept: entity.coreConcept,
        voiceProfile: entity.voiceProfile,
        canonicalFacts: entity.canonicalFacts
        // Don't send: images, customSections, trashedSections
    };
}

const entities = pinnedEntities.map(serializeForAPI);
```

### 3. Cache Entity Serializations

```typescript
// Cache serialized entities to avoid re-serializing
const entityCache = new Map<string, string>();

function getCachedEntity(entity) {
    if (!entityCache.has(entity.id)) {
        entityCache.set(entity.id, JSON.stringify(serializeForAPI(entity)));
    }
    return entityCache.get(entity.id);
}

// Clear cache on entity update
entity.updatedAt = new Date();
entityCache.delete(entity.id);
```

### 4. Progressive Enhancement

```typescript
// Check if new features available
async function sendChatMessage(message, options) {
    const body: any = {
        messages: [{ role: 'user', content: message }]
    };

    // Add Phase 1 features if available
    if (options.pinnedEntityIds?.length > 0) {
        body.pinnedEntityIds = options.pinnedEntityIds;
        body.entities = options.entities;
    }

    // Always include fallback to legacy context
    if (!body.pinnedEntityIds && options.linkedCharacter) {
        body.linkedCharacter = options.linkedCharacter;
    }

    return fetch('/api/chat', { body: JSON.stringify(body) });
}
```

---

## Migration from Legacy API

### Before (Legacy)

```typescript
const response = await fetch('/api/chat', {
    body: JSON.stringify({
        messages: [...],
        linkedCharacter: characterData // Single entity
    })
});
```

### After (Phase 1)

```typescript
const response = await fetch('/api/chat', {
    body: JSON.stringify({
        messages: [...],
        pinnedEntityIds: ['#CHAR_1', '@WORLD_1'], // Multiple entities
        entities: [characterData, worldData]
    })
});
```

### Backward Compatible

```typescript
// API supports both formats
const response = await fetch('/api/chat', {
    body: JSON.stringify({
        messages: [...],
        // New format
        pinnedEntityIds: ['#CHAR_1'],
        entities: [characterData],
        // Legacy format (still works)
        linkedCharacter: characterData
    })
});
```

---

## Testing

### Manual Testing

```typescript
// Test rate limit
async function testRateLimit() {
    for (let i = 0; i < 25; i++) {
        const response = await fetch('/api/chat', { ... });
        console.log(`Request ${i + 1}:`, response.status);

        if (response.status === 429) {
            console.log('Rate limited at request:', i + 1);
            break;
        }
    }
}

// Test entity context
async function testEntityContext() {
    const response = await fetch('/api/chat', {
        body: JSON.stringify({
            messages: [{ role: 'user', content: 'Tell me about Elara' }],
            pinnedEntityIds: ['#ELARA_902'],
            entities: [elaraData],
            isAdminMode: true // Get debug info
        })
    });

    const data = await response.json();
    console.log('Injected entities:', data.debug.entities);
    console.log('Context tokens:', data.debug.context.totalTokens);
}
```

---

## Troubleshooting

### Issue: Entity Not Included in Context

**Check:**
1. Entity ID in `pinnedEntityIds`?
2. Entity data in `entities` array?
3. Entity ID format correct (#, @, $)?
4. Check debug info: `data.debug.context.droppedSections`

**Solution:**
```typescript
// Verify entity sent correctly
console.log('Sending entities:', {
    ids: pinnedEntityIds,
    data: entities.map(e => ({ id: e.id, name: e.name }))
});

// Check response
const data = await response.json();
if (data.debug) {
    console.log('Context composition:', data.debug.context);
}
```

### Issue: Rate Limit Too Restrictive

**Temporary Fix:**
```typescript
// Import rate limiter
import { resetRateLimit } from '@/lib/rateLimiter';

// Reset for testing (development only)
resetRateLimit(sessionId);
```

**Permanent Fix:**
```typescript
// Adjust limits in rateLimiter.ts
const config = {
    maxTokens: 50, // Increased from 20
    refillRate: 50 / 60
};
```

### Issue: Context Too Large

**Check:**
- How many entities pinned?
- Are entities large (lots of prose)?
- Check dropped sections in debug info

**Solution:**
```typescript
// Limit entities
const maxPinnedEntities = 5;
if (pinnedEntityIds.length > maxPinnedEntities) {
    toast.warning(`Maximum ${maxPinnedEntities} entities can be pinned`);
    pinnedEntityIds = pinnedEntityIds.slice(0, maxPinnedEntities);
}

// Truncate entity data
import { serializeEntityForContext } from '@/lib/contextEntityHelpers';
const entities = pinnedEntities.map(e =>
    serializeEntityForContext(e, mode, { maxLength: 2000 })
);
```

---

## Performance Tips

1. **Minimize Request Size:** Only send necessary entity fields
2. **Cache Serializations:** Avoid re-serializing entities
3. **Debounce Requests:** Wait for user to finish typing
4. **Show Loading State:** Improve perceived performance
5. **Handle Errors Gracefully:** Don't let one error break the UI

---

## Related Documentation

- [Phase 1 Implementation Report](../Session_Reports/Implementation_plans/2026-01-28_Phase1_Integration_Specialist_README.md)
- [Multi-Agent System Plan](../Session_Reports/Implementation_plans/2026-01-28_Multi-Agent_System_Implementation_Plan.md)
- [Context Budget System](../5d-character-creator-app/app/src/lib/context-budget.ts)
- [Error Handler](../5d-character-creator-app/app/src/lib/apiErrorHandler.ts)

---

*Last updated: 2026-01-28*
*Phase 1 - Foundation Enhancements*
