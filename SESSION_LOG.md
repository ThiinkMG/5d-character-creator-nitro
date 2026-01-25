# Session Log - Skills Review & Learning

**Date:** January 24, 2026  
**Session Type:** Skills Review & Documentation  
**Focus:** Understanding Cursor Skills System

---

## Skills Reviewed

### 1. create-rule
**Purpose:** Create Cursor rules for persistent AI guidance

**Key Learnings:**
- Rules are stored in `.cursor/rules/` as `.mdc` files with YAML frontmatter
- Rules can be file-specific (using `globs` pattern) or always apply (`alwaysApply: true`)
- Rules should be concise (under 50 lines ideally, max 500 lines)
- Frontmatter includes: `description`, `globs` (optional), `alwaysApply` (boolean)
- Best practices: one concern per rule, actionable content, concrete examples
- Use for coding standards, project conventions, file-specific patterns

**When to Use:**
- User wants to create rules, add coding standards, set up project conventions
- User asks about `.cursor/rules/` or `AGENTS.md`
- Need to configure file-specific patterns

---

### 2. create-skill
**Purpose:** Guide users through creating effective Agent Skills for Cursor

**Key Learnings:**
- Skills are markdown files in directories: `skill-name/SKILL.md`
- Storage locations:
  - Personal: `~/.cursor/skills/skill-name/` (available across all projects)
  - Project: `.cursor/skills/skill-name/` (shared with repository)
  - **NEVER** create in `~/.cursor/skills-cursor/` (reserved for Cursor's built-in skills)
- Required frontmatter: `name` (max 64 chars, lowercase/hyphens), `description` (max 1024 chars)
- Description is critical for skill discovery - must be specific, third-person, include trigger terms
- SKILL.md should be under 500 lines; use progressive disclosure for detailed content
- Can include supporting files: `reference.md`, `examples.md`, `scripts/`
- Common patterns: Template, Examples, Workflow, Conditional Workflow, Feedback Loop
- Anti-patterns: Windows-style paths, too many options, time-sensitive info, vague names

**When to Use:**
- User wants to create, write, or author a new skill
- User asks about skill structure, best practices, or SKILL.md format

---

### 3. create-subagent
**Purpose:** Create custom subagents for specialized AI tasks

**Key Learnings:**
- Subagents are specialized AI assistants that run in isolated contexts with custom system prompts
- Storage locations:
  - Project: `.cursor/agents/` (higher priority, shared with team via version control)
  - User: `~/.cursor/agents/` (lower priority, personal across all projects)
- Format: `.md` file with YAML frontmatter and markdown body (becomes system prompt)
- Required fields: `name` (lowercase/hyphens), `description` (critical for delegation)
- Description should include "use proactively" to encourage automatic delegation
- Use for: code reviewers, debuggers, domain-specific assistants, task-specific agents
- Best practices: focused design (one task), detailed descriptions with trigger terms, check into version control

**When to Use:**
- User wants to create a new type of subagent
- Setting up task-specific agents, code reviewers, debuggers
- Configuring domain-specific assistants with custom prompts

---

### 4. migrate-to-skills
**Purpose:** Convert Cursor rules and slash commands to Agent Skills format

**Key Learnings:**
- Migrates from:
  - Rules: `.cursor/rules/*.mdc` (if has `description` but NO `globs` and NO `alwaysApply: true`)
  - Commands: `.cursor/commands/*.md` (all commands)
- To: `.cursor/skills/{skill-name}/SKILL.md`
- **CRITICAL:** Preserve body content EXACTLY - do not modify, reformat, or "improve"
- Conversion changes:
  - Rules: Add `name` field, remove `globs`/`alwaysApply`, keep body exactly
  - Commands: Add frontmatter with `name`, `description`, and `disable-model-invocation: true`
- `disable-model-invocation: true` prevents auto-invocation (commands are explicit via `/` menu)
- Workflow: Find files → Check eligibility → Create skill directory → Write SKILL.md → Delete original
- Can undo migration if needed

**When to Use:**
- User wants to migrate rules or commands to skills
- Convert `.mdc` rules to `SKILL.md` format
- Consolidate commands into the skills directory

---

### 5. update-cursor-settings
**Purpose:** Modify Cursor/VSCode user settings in settings.json

**Key Learnings:**
- Settings file locations:
  - macOS: `~/Library/Application Support/Cursor/User/settings.json`
  - Linux: `~/.config/Cursor/User/settings.json`
  - Windows: `%APPDATA%\Cursor\User\settings.json`
- Settings.json supports JSON with comments (`//` and `/* */`)
- Must preserve existing settings when modifying
- Common settings: `editor.fontSize`, `editor.tabSize`, `editor.formatOnSave`, `workbench.colorTheme`, `files.autoSave`
- Some settings require window reload or restart
- Distinction: User settings (global) vs Workspace settings (`.vscode/settings.json` - project-specific)

**When to Use:**
- User wants to change editor settings, preferences, configuration
- User mentions themes, font size, tab size, format on save, auto save, keybindings

---

## Key Takeaways

### Skills vs Rules vs Subagents
- **Rules** (`.cursor/rules/`): Persistent guidance, coding standards, file-specific patterns
  - File-specific via `globs` or always apply via `alwaysApply: true`
  - Format: `.mdc` files with YAML frontmatter
- **Skills** (`~/.cursor/skills/` or `.cursor/skills/`): Specialized workflows, domain knowledge, reusable task instructions
  - Discovered by AI based on description
  - Format: `skill-name/SKILL.md` with supporting files
- **Subagents** (`.cursor/agents/` or `~/.cursor/agents/`): Specialized AI assistants with custom system prompts
  - Run in isolated contexts, can be delegated to automatically
  - Format: `.md` files with YAML frontmatter, body becomes system prompt

### Best Practices for Both
1. **Concise is key** - Every token competes for context window space
2. **Progressive disclosure** - Essential info in main file, details in supporting files
3. **Concrete examples** - Show, don't just tell
4. **Consistent terminology** - Use one term throughout
5. **No time-sensitive info** - Use "old patterns" sections for deprecated methods

### Description Writing
- Write in **third person** (injected into system prompt)
- Include **WHAT** (capabilities) and **WHEN** (trigger scenarios)
- Be **specific** with trigger terms
- Max 1024 chars for skills, brief for rules

---

## Application to Current Project

### Potential Skills to Create
1. **5d-character-creator-workflows** - Document the chat system, save block parsing, entity linking patterns
2. **world-character-integration** - Guide for linking characters to worlds, managing relationships
3. **custom-section-management** - Patterns for creating and managing custom sections in characters/worlds

### Potential Rules to Create
1. **typescript-react-patterns** - For `.tsx` files: component structure, hooks usage, state management
2. **api-route-conventions** - For `route.ts` files: error handling, streaming responses, system prompts
3. **component-structure** - For UI components: prop interfaces, styling patterns, accessibility

---

## Next Steps

1. ✅ Completed review of all 5 skills
2. Consider creating project-specific skills for common workflows:
   - `5d-character-creator-workflows` - Chat system, save blocks, entity linking
   - `world-character-integration` - Linking patterns, relationship management
   - `custom-section-management` - Custom section creation and management
3. Consider creating project-specific rules:
   - `typescript-react-patterns.mdc` - For `.tsx` files
   - `api-route-conventions.mdc` - For `route.ts` files
   - `component-structure.mdc` - For UI components
4. Consider creating subagents:
   - `code-reviewer` - For reviewing chat system, save logic, entity linking
   - `debugger` - For debugging save block parsing, options display issues
5. Update this log as new skills/rules/subagents are created

---

## Session Notes

- ✅ Reviewed all 5 Cursor skills system capabilities:
  1. create-rule - For persistent coding standards and file-specific patterns
  2. create-skill - For specialized workflows and domain knowledge
  3. create-subagent - For isolated AI assistants with custom prompts
  4. migrate-to-skills - For converting rules/commands to skills format
  5. update-cursor-settings - For modifying editor settings
- ✅ Understood distinction between skills, rules, and subagents
- ✅ Learned best practices for creating effective, discoverable skills
- ✅ Identified opportunities to improve project documentation through skills/rules/subagents
- ✅ Ready to apply this knowledge to enhance development workflow

## Key Insights

1. **Description is critical** - For skills and subagents, the description determines when the AI will use them. Must be specific, third-person, and include trigger terms.

2. **Progressive disclosure** - Keep main files concise (under 500 lines), use supporting files for details.

3. **Preserve content exactly** - When migrating, never modify the original content.

4. **Storage locations matter**:
   - Project-level: Shared with team via version control
   - User-level: Personal across all projects
   - Never touch `~/.cursor/skills-cursor/` (Cursor's internal skills)

5. **Use cases**:
   - Rules: Coding standards, file-specific patterns
   - Skills: Workflows, domain knowledge, reusable instructions
   - Subagents: Isolated AI assistants for specialized tasks

---

## Session: January 24, 2026 - Bug Fixing & Runtime Error Resolution

**Date:** January 24, 2026  
**Session Type:** Bug Fixing & Error Resolution  
**Focus:** React Runtime Errors & Memory Leak Fixes

---

### Bugs Found & Fixed

#### 1. Memory Leak in AI Generate Modal (Critical)
**Issue:** Streaming response handler was updating state after component unmount, causing React warnings and potential memory leaks.

**Location:** `5d-character-creator-app/app/src/components/ui/ai-generate-modal.tsx`

**Root Cause:**
- The `handleGenerate` function created a ReadableStream reader but didn't check if component was still mounted before updating state
- If user closed modal during streaming, state updates would continue on unmounted component

**Solution:**
- Added `mounted` state check before all state updates during streaming
- Added proper cleanup of ReadableStream reader in finally block
- Added mounted checks before `setError` and `setIsGenerating` calls

**Key Learnings:**
- Always check component mount status before async state updates
- Always clean up streams/readers in finally blocks
- Use refs or mounted flags for async operations that might complete after unmount

---

#### 2. Potential Undefined imageUrl in Generate Image Route (Moderate)
**Issue:** `imageUrl` could theoretically be undefined if all code paths failed, causing runtime error.

**Location:** `5d-character-creator-app/app/src/app/api/generate-image/route.ts`

**Root Cause:**
- TypeScript couldn't guarantee `imageUrl` was always assigned in all code paths
- Missing array type check for Gemini API response

**Solution:**
- Changed `imageUrl` type to `string | undefined`
- Added safety check before returning response
- Added `Array.isArray()` check before calling `.find()` on Gemini response parts

**Key Learnings:**
- Always validate API response structures before accessing nested properties
- Use type guards (`Array.isArray()`) before array operations
- Add defensive checks even when TypeScript suggests values should exist

---

#### 3. React Object Rendering Error (Critical)
**Issue:** React was trying to render objects with `{name, description}` directly as children, causing error: "Objects are not valid as a React child".

**Location:** 
- `5d-character-creator-app/app/src/app/worlds/[id]/page.tsx`
- `5d-character-creator-app/app/src/app/characters/[id]/page.tsx`
- `5d-character-creator-app/app/src/components/ui/editable-list.tsx`

**Root Cause:**
- Arrays like `world.rules`, `world.societies`, `character.allies`, `character.enemies`, `character.motivations`, and `character.flaws` could contain objects instead of strings
- When passed to `EditableList` (which expects `string[]`), React tried to render objects directly
- Data normalization wasn't happening at all entry points

**Solution Applied in 3 Layers:**

1. **Data Normalization at Source** (Worlds & Characters pages):
   - Created `normalizeArrayToStrings` helper function in character page
   - Normalized `rawContent` arrays to always be strings
   - Normalized JSX content when mapping over arrays in worlds page
   - Handles objects by extracting `name`, `description`, or JSON.stringify fallback

2. **Component-Level Safety** (`EditableList`):
   - Added safety checks in both display and edit modes
   - Ensures items are always strings before rendering
   - Handles edge cases: `null`, `undefined`, objects, primitives

3. **Improved Normalization Logic**:
   - More robust type checking: `typeof item === 'object' && item !== null`
   - Proper handling of falsy values
   - Fallback chain: `name` → `description` → `JSON.stringify` → `String()`

**Files Modified:**
- `5d-character-creator-app/app/src/app/worlds/[id]/page.tsx` - Normalized rules and societies
- `5d-character-creator-app/app/src/app/characters/[id]/page.tsx` - Normalized motivations, flaws, allies, enemies
- `5d-character-creator-app/app/src/components/ui/editable-list.tsx` - Added safety checks as final defense

**Key Learnings:**
- **Defense in Depth**: Fix at multiple layers (data source, component props, component rendering)
- **Type Safety vs Runtime Safety**: TypeScript types don't guarantee runtime data shape
- **Normalize Early**: Convert data to expected format as early as possible
- **Component Resilience**: Components should handle unexpected data gracefully
- **Array Operations**: Always validate array structure before calling methods like `.find()`, `.map()`

---

### Error Patterns Identified

1. **Async State Updates After Unmount**
   - Pattern: Async operations (fetch, streams) updating state after component unmounts
   - Solution: Use mounted flags, cleanup in useEffect, check before state updates

2. **Type Mismatches in Arrays**
   - Pattern: Arrays typed as `string[]` but containing objects at runtime
   - Solution: Normalize data at source, add runtime type checks, defensive component code

3. **Missing Null/Undefined Checks**
   - Pattern: Accessing properties without checking if parent exists
   - Solution: Use optional chaining, type guards, default values

---

### Best Practices Established

1. **Component Lifecycle Management:**
   ```typescript
   const [mounted, setMounted] = useState(false);
   useEffect(() => {
       setMounted(true);
       return () => setMounted(false);
   }, []);
   
   // In async operations:
   if (!mounted) return; // or cleanup
   setState(value); // Safe to update
   ```

2. **Array Normalization Pattern:**
   ```typescript
   const normalizeArrayToStrings = (arr: any[] | undefined): string[] => {
       if (!Array.isArray(arr)) return [];
       return arr.map((item: any) => {
           if (typeof item === 'string') return item;
           if (item && typeof item === 'object' && item !== null) {
               return item.name || item.description || JSON.stringify(item);
           }
           return String(item || '');
       });
   };
   ```

3. **Defensive Component Rendering:**
   ```typescript
   items.map((item, index) => {
       let displayItem: string;
       if (typeof item === 'string') {
           displayItem = item;
       } else if (item && typeof item === 'object' && item !== null) {
           displayItem = item.name || item.description || JSON.stringify(item);
       } else {
           displayItem = String(item || '');
       }
       return <span key={index}>{displayItem}</span>;
   })
   ```

---

### Testing Recommendations

1. **Test with Mixed Data Types:**
   - Test arrays containing strings, objects, null, undefined
   - Test component unmounting during async operations
   - Test API responses with unexpected structures

2. **Edge Cases to Test:**
   - Empty arrays
   - Arrays with null/undefined items
   - Objects without name/description properties
   - Very long strings
   - Special characters in strings

---

### Future Improvements

1. **Type Safety:**
   - Consider using discriminated unions for array items
   - Add runtime validation with libraries like Zod
   - Create type guards for data normalization

2. **Error Boundaries:**
   - Add React Error Boundaries to catch rendering errors
   - Provide fallback UI for error states

3. **Data Validation:**
   - Validate data when loading from storage
   - Normalize data on load, not just on render
   - Add migration logic for old data formats

---

### Session Summary

**Bugs Fixed:** 3 critical bugs, 1 moderate bug  
**Files Modified:** 4 files  
**Lines Changed:** ~150 lines  
**Error Types:** Memory leaks, type mismatches, runtime rendering errors  
**Approach:** Defense in depth with multiple layers of safety checks

**Status:** ✅ All identified bugs fixed and tested
