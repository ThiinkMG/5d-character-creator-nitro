# 5D Character Creator - Phase 1 User Guide

**Version:** 1.0
**Last Updated:** 2026-01-28
**Features Covered:** @ Mention System, Entity Stubs, Development Queue

---

## 📚 Table of Contents

1. [Introduction](#introduction)
2. [@ Mention System](#-mention-system)
3. [Creating Entity Stubs](#creating-entity-stubs)
4. [Managing the Development Queue](#managing-the-development-queue)
5. [Aliases and Fuzzy Matching](#aliases-and-fuzzy-matching)
6. [Voice Profiles](#voice-profiles)
7. [Canonical Facts](#canonical-facts)
8. [Tips and Tricks](#tips-and-tricks)
9. [Troubleshooting](#troubleshooting)
10. [FAQ](#faq)

---

## Introduction

Welcome to Phase 1 of the 5D Character Creator! This guide covers the new features that make character creation faster, easier, and more intuitive.

### What's New in Phase 1?

- **@ Mention System**: Create and reference entities inline without leaving your creative flow
- **Entity Stubs**: Quick entity creation with just a name - flesh out details later
- **Fuzzy Search**: Typo-tolerant search finds entities even with spelling mistakes
- **Development Queue**: Track incomplete entities in one place
- **Voice Profiles**: Preserve character voice consistency
- **Canonical Facts**: Maintain continuity across your story

### Who Is This Guide For?

- Writers using the 5D Character Creator for the first time
- Existing users upgrading to Phase 1
- Anyone wanting to maximize their productivity

---

## @ Mention System

### What Is the @ Mention System?

The @ Mention System lets you create and reference entities (characters, worlds, projects) while writing, without opening forms or switching pages.

### How to Use @ Mentions

#### Basic Usage

1. **In the Chat Studio**, start typing `@` followed by an entity name
2. A popup appears showing matching entities
3. Click an entity to reference it, or create a new one

**Example:**
```
You: @Kira needs to confront @The Dark Lord in @Shadowkeep Castle
```

#### Creating New Entities

If the entity doesn't exist yet:

1. Type `@NewEntityName`
2. The popup shows "Create new Character/World/Project"
3. Click the create button
4. The entity stub is created instantly

**Example:**
```
You: @Aria is a mysterious thief who steals from @The Azure Guild
```
- If "Aria" doesn't exist, select "Create new Character"
- If "The Azure Guild" doesn't exist, select "Create new World"
- Both entities are created as stubs automatically

### Mention Detection Rules

The system detects mentions using these patterns:

| Pattern | Description | Example |
|---------|-------------|---------|
| `@Word` | Single word | `@Kira` |
| `@Multiple Words` | Multi-word phrase | `@The Northern War` |
| `@Word,` | Stops at punctuation | `@Kira, how are you?` |
| `@Word @Another` | Multiple mentions | `@Kira @Luna` |

**What Triggers Mention Detection:**
- Typing `@` followed by any letter
- Continues until: space, punctuation, end of line, or another `@`

### Fuzzy Matching

Don't worry about typos! The system uses intelligent fuzzy matching.

**Examples:**

| You Type | System Finds | Reason |
|----------|-------------|--------|
| `@Kira` | "Kira Shadowbane" | Exact match on first name |
| `@Kirn` | "Kiran" | Typo tolerance (1 letter off) |
| `@Shadow` | "Kira Shadowbane" | Partial match on last name |
| `@KB` | (via alias) "Kira Shadowbane" | Alias matching |

**How It Works:**
- **Exact matches** appear first
- **Starts-with matches** appear second
- **Contains matches** appear third
- **Typos** (≤2 letters different) appear last

### Mention Popup Interface

When you type `@`, a popup appears with:

**For Existing Entities:**
- Entity icon (👤 Character, 🌍 World, 📁 Project)
- Entity name
- "via alias: [alias]" (if matched through alias)

**For New Entities:**
- "Create new Character"
- "Create new World"
- "Create new Project"

**Keyboard Navigation:**
- `↑` / `↓` - Navigate suggestions
- `Enter` - Select highlighted option
- `Esc` - Close popup
- Click outside - Close popup

---

## Creating Entity Stubs

### What Are Entity Stubs?

Entity stubs are minimal entities created with just a name. You can flesh out details later when you're ready.

### Why Use Stubs?

- **Stay in Flow**: Don't break your creative momentum
- **Write First, Organize Later**: Capture ideas immediately
- **Progressive Formalization**: Build complexity gradually

### How to Create Stubs

#### Via @ Mention (Recommended)

1. Type `@EntityName` in chat
2. Select "Create new [Type]"
3. Stub created instantly

**What Gets Created:**
```
Character Stub Example:
- ID: #ARIA_042
- Name: "Aria"
- Role: supporting (default)
- Progress: 5%
- Tags: ['stub', 'needs-development']
- Core Concept: "[Auto-created from @mention. Flesh out later.]"
```

### Stub Properties

All stubs are created with:

| Field | Value | Editable |
|-------|-------|----------|
| ID | Auto-generated (#NAME_XXX, @NAME_XXX, $NAME_XXX) | No |
| Name | From mention | Yes |
| Tags | ['stub', 'needs-development'] | Yes |
| Progress | 5% | Auto-updates |
| Created Date | Timestamp | No |

### Fleshing Out Stubs

To complete a stub entity:

1. **Find the stub** in your entity gallery (filter by 'stub' tag)
2. **Click to open** the entity detail page
3. **Fill in fields** as you develop the character
4. **Remove 'stub' tag** when complete (or let it auto-remove at >20% progress)

**Recommended Workflow:**
1. Create stubs during brainstorming (@ mentions)
2. Review development queue weekly
3. Flesh out 2-3 stubs per session
4. Remove from queue when satisfied

---

## Managing the Development Queue

### What Is the Development Queue?

The Development Queue tracks all entity stubs that need completion. Think of it as your creative to-do list.

### How to View the Queue

**Current Options:**
- Filter entity gallery by 'needs-development' tag
- Check entity completion percentage (<20% = stub)

**Coming Soon (Week 3-4):**
- Dedicated Development Queue panel
- "Flesh Out Stubs" guided workflow

### Queue Management

#### Automatic Queue Addition

Entities are added to the queue automatically when:
- Created via @ mention
- Manually tagged with 'needs-development'
- Progress drops below 20%

#### Manual Queue Management

To remove from queue:
1. Complete the entity (progress >20%)
2. Remove 'needs-development' tag

**Best Practices:**
- Review queue weekly
- Prioritize stubs by story relevance
- Keep queue under 20 items for manageability

---

## Aliases and Fuzzy Matching

### What Are Aliases?

Aliases are alternate names for entities, making them easier to find and reference.

### When to Use Aliases

**Use aliases for:**
- Nicknames (`"KB"` for `"Kira Shadowbane"`)
- Titles (`"The Dark Lord"` for `"Sauron"`)
- Translations (`"Le Roi Sombre"` for `"The Dark King"`)
- Common typos (`"Arya"` for `"Aria"`)

### How to Add Aliases

1. Open the entity detail page
2. Find the "Aliases" field
3. Add alternate names (comma-separated)
4. Save

**Example:**
```
Character: Kira Shadowbane
Aliases: Kira, KB, Shadowbane, The Shadow, Shadow Thief
```

Now typing `@KB` or `@The Shadow` will find "Kira Shadowbane"

### Alias Matching in Popup

When an entity is matched via alias, the popup shows:
```
👤 Kira Shadowbane
   via alias: "KB"
```

---

## Voice Profiles

### What Are Voice Profiles?

Voice Profiles preserve character voice consistency in AI-generated content. They capture how your character speaks, thinks, and expresses themselves.

### When to Use Voice Profiles

**Use voice profiles for:**
- Main characters with distinctive voices
- Characters in dialogue-heavy scenes
- Characters you'll write with frequently

**Skip voice profiles for:**
- Minor NPCs with generic voices
- Background characters
- Non-speaking entities

### Voice Profile Fields

| Field | Description | Example |
|-------|-------------|---------|
| Sample Dialogue | 3-5 representative lines | "I don't trust smiles." |
| Speech Patterns | Structural elements | "uses contractions", "speaks in fragments" |
| Vocabulary Level | Complexity scale | simple, moderate, complex, archaic |
| Tone | Emotional quality | sardonic, earnest, formal |
| Dialect | Regional/cultural | British English, Southern drawl |
| Catchphrases | Signature phrases | "Try me." |
| Avoids | Words they'd never say | profanity, modern slang |

### How to Create a Voice Profile

#### Method 1: Manual Entry

1. Open character detail page
2. Scroll to "Voice Profile" section
3. Fill in fields:

**Sample Dialogue (3-5 lines):**
```
- "I've seen enough betrayals to know one when it's coming."
- "You think I'm joking? Try me."
- "Trust is earned, not given."
```

**Speech Patterns:**
```
- Uses contractions frequently
- Speaks in short, declarative sentences
- Rarely asks questions
- Employs dry humor
```

**Other Fields:**
```
Vocabulary Level: simple
Tone: sardonic but weary
Catchphrases: "Try me."
Avoids: Flowery language, apologizing
```

#### Method 2: Extract from Existing Prose (Coming Soon)

AI-powered extraction will analyze your character's existing dialogue and auto-populate voice profile fields.

### Using Voice Profiles

Voice profiles are automatically used in:
- **Voice Match Mode** (coming in Phase 3)
- **Chat with Character Mode**
- AI-generated dialogue

The AI reads your voice profile and mimics the character's speech patterns, vocabulary, and tone.

---

## Canonical Facts

### What Are Canonical Facts?

Canonical Facts are immutable truths about your entities. They serve as the "source of truth" for continuity checking.

### Why Use Canonical Facts?

**Benefits:**
- Prevent AI from contradicting established lore
- Maintain consistency across long projects
- Enable Continuity Checker mode (Phase 3)
- Track fact provenance (when/where established)

**Example Problem:**
```
Chapter 1: "Her green eyes sparkled..."
Chapter 5: AI generates "Her blue eyes looked sad..."
```

**Solution with Canonical Facts:**
```
Fact: "Has green eyes"
Category: physical
Confidence: definite
Established In: Chapter 1
```

Continuity Checker (Phase 3) will flag the Chapter 5 contradiction.

### Canonical Fact Fields

| Field | Description | Example |
|-------|-------------|---------|
| Fact | Atomic fact statement | "Has green eyes" |
| Category | Fact type | physical, personality, history, relationship, ability, possession, other |
| Established In | Source reference | "Chapter 1", "Character creation" |
| Established At | Timestamp | 2026-01-28 |
| Confidence | Certainty level | definite, implied, tentative |

### Confidence Levels

**Definite:**
- Explicitly stated, immutable
- Example: "Born in 1995", "Has blue eyes"

**Implied:**
- Inferred from context, can be refined
- Example: "Probably left-handed" (based on description)

**Tentative:**
- Working assumption, subject to change
- Example: "May have attended Hogwarts" (unconfirmed)

### How to Add Canonical Facts

1. Open entity detail page
2. Scroll to "Canonical Facts" section
3. Click "Add Fact"
4. Fill in fields:

**Example: Character Fact**
```
Fact: "Lost her mother in the Northern War"
Category: history
Established In: Backstory session, 2026-01-20
Confidence: definite
```

**Example: World Fact**
```
Fact: "Magic is forbidden in the Eastern Kingdoms"
Category: other
Established In: Worldbuilding notes
Confidence: definite
```

### Best Practices for Facts

**Good Facts (Atomic):**
- ✅ "Has green eyes"
- ✅ "Born in Thornwall"
- ✅ "Allergic to silver"

**Bad Facts (Compound):**
- ❌ "Has green eyes and blonde hair"
- ❌ "Born in Thornwall to a merchant family"

**Why Atomic?**
- Easier to validate against text
- Easier to update individually
- Clearer for AI to understand

### Fact Categories Explained

| Category | Use For | Examples |
|----------|---------|----------|
| **physical** | Appearance, biology | Eye color, height, scars |
| **personality** | Traits, behaviors | Introverted, brave, cynical |
| **history** | Past events | Birth year, education, trauma |
| **relationship** | Connections | Married to X, enemy of Y |
| **ability** | Skills, powers | Can fly, speaks Elvish |
| **possession** | Owned items | Has magic sword, owns castle |
| **other** | Anything else | Favorite food, fears |

---

## Tips and Tricks

### Workflow Optimization

**Tip 1: Use @ Mentions During Brainstorming**
```
❌ Old way: Stop, create character, fill 15 fields, return to chat
✅ New way: Type @NewCharacter, continue writing
```

**Tip 2: Batch Stub Completion**
```
1. Brainstorm for 30 minutes (create 10+ stubs)
2. Review development queue
3. Flesh out 2-3 most important stubs
4. Repeat next session
```

**Tip 3: Use Aliases Liberally**
```
Character: Kira Shadowbane
Aliases: Kira, KB, Shadowbane, The Shadow, Shadow Thief, That Damn Thief
```
More aliases = easier to find = less frustration

### Keyboard Shortcuts

| Action | Shortcut | Where |
|--------|----------|-------|
| Open mention popup | `@` | Chat input |
| Navigate suggestions | `↑` `↓` | Mention popup |
| Select suggestion | `Enter` | Mention popup |
| Close popup | `Esc` | Mention popup |
| Toggle Context Sidecar | `Ctrl+Shift+C` | Chat Studio (Week 3) |

### Advanced Techniques

**Multi-Entity Mentions:**
```
@Kira and @Luna must infiltrate @The Azure Guild to steal @The Crystal of Power
```
Creates 4 entities in one sentence (if they don't exist)

**Inline Story Planning:**
```
In Act 2, @Kira discovers @The Prophecy which reveals @The True Enemy
```
Use @ mentions to outline plot without breaking flow

**Entity Linking in Prose:**
```
In my prose section, I can reference @Kira multiple times and the system
will track these mentions for context injection.
```
(Context Sidecar will auto-detect entities in prose - Week 3)

---

## Troubleshooting

### Common Issues

#### Issue: Popup Doesn't Appear

**Symptoms:** Type `@` but no popup shows

**Causes & Solutions:**
1. **Check focus:** Click inside chat input first
2. **Check character after @:** Must be a letter (not space/punctuation)
3. **Browser console errors:** Open DevTools, check for JavaScript errors

---

#### Issue: Entity Not Found Despite Existing

**Symptoms:** Type `@EntityName` but it doesn't appear in suggestions

**Possible Causes:**
1. **Spelling difference:** Try typing more letters (fuzzy match activates after 2+ characters)
2. **Wrong entity type:** Character won't show when looking for worlds
3. **Entity deleted:** Check entity gallery to confirm existence

**Solutions:**
- Try partial name: `@Kira` instead of `@Kira Shadowbane`
- Add alias: If you keep typing "Kira" but character is "Kiran", add "Kira" as alias
- Check spelling: `@Kirn` will find "Kiran" (fuzzy match ≤2 letters off)

---

#### Issue: Duplicate Entities Created

**Symptoms:** Multiple entities with similar names

**Causes:**
- Clicking "Create new" when entity exists with different spelling
- Creating before fuzzy match suggestions appear

**Prevention:**
- Wait 500ms for fuzzy suggestions to appear
- Check aliases before creating new entity

**Solution:**
- Merge duplicates manually (copy data, delete extras)
- Add aliases to prevent future duplicates

---

#### Issue: Stub Entity Not in Development Queue

**Symptoms:** Created stub but can't find in queue

**Possible Causes:**
1. **Queue filter not applied:** Check entity gallery filters
2. **LocalStorage issue:** Check browser storage settings

**Solutions:**
- Filter gallery by 'stub' tag
- Filter by 'needs-development' tag
- Check entity completion % (<20% = stub)

---

#### Issue: Voice Profile Not Working

**Symptoms:** AI-generated content doesn't match voice profile

**Causes:**
- Voice Match mode not enabled (coming in Phase 3)
- Incomplete voice profile (missing required fields)

**Current Status:**
Voice profiles are stored but not yet used for generation (Phase 3 feature)

---

### Performance Issues

#### Slow Popup Response

**Symptoms:** Popup takes >1 second to appear

**Causes:**
- Too many entities (>500)
- Browser performance issues

**Solutions:**
- Clear browser cache
- Close other browser tabs
- Wait for Phase 2 optimization (indexing)

---

#### LocalStorage Full

**Symptoms:** "QuotaExceededError" in console

**Causes:**
- Very large project (>5-10MB)
- Many entities with images

**Solutions:**
- Export and delete old entities
- Wait for Phase 2 (IndexedDB support)
- Reduce image sizes

---

## FAQ

### General Questions

**Q: Do I have to use @ mentions? Can I still create entities the old way?**

A: Yes! @ mentions are optional. You can still click "Create Character" and fill out the full form if you prefer.

---

**Q: What happens to my existing entities?**

A: All existing entities continue to work. Phase 1 added new optional fields (voiceProfile, canonicalFacts, aliases) that you can populate at your own pace.

---

**Q: Are entity stubs permanent?**

A: No. Stubs are just entities with minimal data. As you fill in fields, the entity naturally evolves from "stub" to "complete". The 'stub' tag auto-removes when progress exceeds 20%.

---

**Q: Can I @ mention entities in prose sections?**

A: Not yet. Phase 1 mentions only work in chat input. Phase 2 will add mention detection to prose sections.

---

### @ Mention System

**Q: Can I mention multiple entities in one message?**

A: Yes! Example: `@Kira and @Luna fight @The Dragon in @Shadowkeep`

---

**Q: Does the system remember my mentions across sessions?**

A: Yes. All mentions and created entities persist in LocalStorage.

---

**Q: What if I type @ for a non-entity reason (like email)?**

A: The popup still appears but you can dismiss it with Esc or by clicking outside. If the text after @ doesn't match any entities, you'll just see "Create new" options.

---

**Q: Can I customize the mention trigger? (Use # instead of @)**

A: Not currently. @ is the standard trigger symbol for Phase 1.

---

### Fuzzy Search

**Q: How "fuzzy" is the fuzzy search?**

A: It allows up to 2 letter differences (Levenshtein distance ≤2). Examples:
- `Kirn` finds `Kiran` (1 letter off) ✅
- `Krrn` finds `Kiran` (2 letters off) ✅
- `Kzzn` doesn't find `Kiran` (3 letters off) ❌

---

**Q: Why do some suggestions say "via alias"?**

A: The entity was matched through an alias rather than its main name. This helps you understand why it appeared in suggestions.

---

**Q: Can I adjust fuzzy search sensitivity?**

A: Not currently. The ≤2 letter threshold is hardcoded for optimal typo tolerance without noise.

---

### Voice Profiles & Canonical Facts

**Q: Do I need to fill out voice profiles for every character?**

A: No. Voice profiles are optional and most useful for main characters with distinctive voices. Skip them for minor NPCs.

---

**Q: When will voice profiles actually affect AI generation?**

A: Voice Match mode (coming in Phase 3) will use voice profiles for generation. For now, they're stored for future use.

---

**Q: How many canonical facts should I add?**

A: As many as you need! Main characters might have 20-50 facts. Minor characters might have 2-5. Add facts as they're established in your story.

---

**Q: Can canonical facts contradict each other?**

A: Technically yes, but it's not recommended. If you discover a contradiction, update or delete the outdated fact. Confidence levels help manage evolving lore ("tentative" facts can change, "definite" facts shouldn't).

---

### Development Queue

**Q: How do I know when an entity is no longer a stub?**

A: Check the completion percentage. Stubs start at 5%. When progress exceeds 20%, the 'stub' tag auto-removes and the entity exits the development queue.

---

**Q: Can I manually remove entities from the development queue?**

A: Yes. Remove the 'needs-development' tag from the entity.

---

**Q: Will there be a visual development queue interface?**

A: Yes! Coming in Week 3-4 of Phase 1. For now, filter the entity gallery by 'stub' or 'needs-development' tags.

---

### Data & Privacy

**Q: Where is my data stored?**

A: All data is stored in your browser's LocalStorage. Nothing is sent to external servers (except AI API calls for generation).

---

**Q: How do I back up my data?**

A: Use the Export feature (File → Export). This saves your entire project as JSON.

---

**Q: What happens if I clear my browser data?**

A: Your entities will be deleted. Always export your project regularly as backup.

---

**Q: Is there a cloud sync option?**

A: Not yet. Cloud sync is planned for Phase 2.

---

## Getting Help

### Resources

- **User Guide** (this document): Phase 1 feature usage
- **Developer Onboarding**: `docs/DEVELOPER_ONBOARDING.md`
- **Architecture Decisions**: `ai_context_learning/decisions/`
- **Phase 1 Complete Report**: `Session_Reports/February 2026/2026-01-28_PHASE1_COMPLETE.md`

### Support Channels

- **GitHub Issues**: Report bugs or request features
- **Community Discord**: Ask questions, share tips
- **Documentation**: Check `docs/` folder for guides

### Reporting Issues

When reporting bugs, please include:
1. **What you did** (steps to reproduce)
2. **What you expected** (intended behavior)
3. **What happened** (actual behavior)
4. **Browser & version** (e.g., Chrome 120)
5. **Console errors** (open DevTools → Console tab)

---

## What's Next?

### Coming in Phase 1 (Weeks 3-4)

- **Context Sidecar**: Pin entities to persistent sidebar
- **Auto-Detection**: Entities detected in prose sections
- **Just-in-Time Context Injection**: Optimized AI context
- **Development Queue UI**: Dedicated panel for stubs

### Coming in Phase 2 (Weeks 5-10)

- **Multi-Provider AI Router**: Claude, GPT-4, Gemini support
- **Mode-Aware Context Selection**: Smarter context per chat mode
- **Voice Profile Extraction**: Auto-populate from existing prose
- **Improved Performance**: IndexedDB for large projects

### Coming in Phase 3+ (Future)

- **Continuity Checker Mode**: Validate against canonical facts
- **Voice Match Mode**: Generate dialogue matching voice profiles
- **Relationship Graph Visualization**: Interactive entity connections
- **Completion Assistant Mode**: Identify gaps in your project

---

*Happy creating! May your characters be deep, your lore consistent, and your creative flow uninterrupted.*

---

*User Guide Version 1.0*
*Last Updated: 2026-01-28*
*For: 5D Character Creator Phase 1*
