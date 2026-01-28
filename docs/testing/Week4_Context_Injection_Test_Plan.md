# Week 4: Context Injection System - Test Plan

**Date:** 2026-01-28
**Component:** Just-in-Time Context Injection System
**Files:** `modeContextConfig.ts`, `entityFieldFilter.ts`, `contextInjection.ts`, `ContextDebugPanel.tsx`

## Overview

This test plan verifies that the Just-in-Time Context Injection system correctly filters and injects entity fields based on the active chat mode, respects token budgets, and provides accurate debugging information.

---

## Test Scenarios

### Test 1: Chat Mode - Minimal Context

**Mode:** `chat`
**Linked Entities:**
- 1 Character (Kira Shadowbane)
- 1 World (The Shattered Realms)

**Expected Behavior:**
- Character fields included: `name`, `role`, `coreConcept`
- World fields included: `name`, `genre`, `tagline`
- Token budget: 20% character, 20% world
- Format: Minimal

**Test Steps:**
1. Enable dev mode: `localStorage.setItem('5d-admin-mode', 'true')`
2. Create chat session with mode = `chat`
3. Link Kira Shadowbane (character) and The Shattered Realms (world)
4. Send message: "Tell me about the current situation"
5. Open Dev Mode Panel and click the Context tab

**Verification:**
- [ ] Context includes only specified fields
- [ ] Token count < 20% of total budget per entity
- [ ] Debug panel shows correct mode (`chat`)
- [ ] No truncated fields (context is minimal)

---

### Test 2: Character Mode - Full Character Fields

**Mode:** `character`
**Linked Entities:**
- 1 Character (in progress, phase = Personality)

**Expected Behavior:**
- Character fields included: All fields from Foundation, Personality phases
- Token budget: 70% character
- Format: Detailed

**Test Steps:**
1. Create character creation session with mode = `character`
2. Link character in progress (30% complete)
3. Send message: "Let's develop her motivations"
4. Open Dev Mode Panel and click the Context tab

**Verification:**
- [ ] Context includes high-priority fields: `name`, `role`, `phase`, `coreConcept`, `motivations`, `flaws`
- [ ] Context includes medium-priority fields: `origin`, `ghost`, `allies`, `enemies`
- [ ] Token count uses 70% of budget
- [ ] Debug panel shows 12+ fields included

---

### Test 3: World Mode - World Fields + Linked Characters

**Mode:** `world`
**Linked Entities:**
- 1 World (The Shattered Realms)
- 2 Characters (Kira, Luna)

**Expected Behavior:**
- World fields included: All world fields (name, genre, tone, description, rules, history, etc.)
- Character fields included: Minimal (name, role, coreConcept)
- Token budget: 70% world, 15% character
- Format: Detailed

**Test Steps:**
1. Create world-building session with mode = `world`
2. Link world and 2 characters
3. Send message: "Explain the magic system"
4. Open Dev Mode Panel and click the Context tab

**Verification:**
- [ ] World fields take 70% of budget
- [ ] Character fields take 15% of budget (split between 2 characters)
- [ ] Characters show only name, role, coreConcept
- [ ] Debug panel shows correct entity counts

---

### Test 4: Lore Mode - History + Cultural Elements

**Mode:** `lore`
**Linked Entities:**
- 1 World (with extensive history)

**Expected Behavior:**
- World fields included: `history`, `historyProse`, `rules`, `magicSystem`, `factions`, `societies`
- High priority on history-related fields
- Token budget: 75% world
- Format: Detailed

**Test Steps:**
1. Create lore exploration session with mode = `lore`
2. Link world with populated history
3. Send message: "Tell me about the ancient war"
4. Open Dev Mode Panel and click the Context tab

**Verification:**
- [ ] History fields have high priority
- [ ] Magic system and factions included
- [ ] Geography fields have lower priority (may be truncated)
- [ ] Token count uses 75% of budget for world

---

### Test 5: Scene Mode - Voice Profiles + Relationships

**Mode:** `scene`
**Linked Entities:**
- 2 Characters (with voiceProfile populated)
- 1 World

**Expected Behavior:**
- Character fields included: `voiceProfile` (high priority), `motivations`, `flaws`, `relationships`
- World fields included: `tone`, `rules` (for scene context)
- Token budget: 70% character, 20% world
- Format: Detailed

**Test Steps:**
1. Create scene writing session with mode = `scene`
2. Link 2 characters with voice profiles
3. Link world
4. Send message: "Write a tense confrontation scene"
5. Open Dev Mode Panel and click the Context tab

**Verification:**
- [ ] Voice profiles included for both characters
- [ ] Speech patterns, dialogue samples visible
- [ ] Relationships between characters included
- [ ] World tone included for atmosphere
- [ ] Token budget split: 70% character (35% each), 20% world

---

### Test 6: Workshop Mode - Character Arc Deep-Dive

**Mode:** `workshop`
**Linked Entities:**
- 1 Character (focus on arc development)

**Expected Behavior:**
- Character fields included: All arc-related fields (`arcType`, `climax`, `arcProse`)
- Motivations, flaws, fears (high priority)
- Token budget: 80% character
- Format: Detailed

**Test Steps:**
1. Create workshop session with mode = `workshop`
2. Link character to develop
3. Send message: "Let's explore her character arc"
4. Open Dev Mode Panel and click the Context tab

**Verification:**
- [ ] Arc fields have high priority
- [ ] Personality and backstory fields included
- [ ] World/project context minimal (10% each)
- [ ] Token count uses 80% of budget

---

### Test 7: Chat With Mode - Voice Profile + Personality

**Mode:** `chat_with`
**Linked Entities:**
- 1 Character (roleplay as this character)

**Expected Behavior:**
- Character fields included: `voiceProfile`, `motivations`, `flaws`, `fears`, `personalityProse`
- High priority on voice and personality
- Token budget: 80% character
- Format: Detailed

**Test Steps:**
1. Create roleplay session with mode = `chat_with`
2. Link character to roleplay
3. Send message: "How do you feel about betrayal?"
4. Open Dev Mode Panel and click the Context tab

**Verification:**
- [ ] Voice profile fully included
- [ ] Personality prose included
- [ ] Speech patterns and dialogue samples visible
- [ ] Backstory included for context
- [ ] Token count uses 80% of budget

---

### Test 8: Script Mode - Dialogue Samples + Scene Context

**Mode:** `script`
**Linked Entities:**
- 3 Characters (for multi-character script)
- 1 World

**Expected Behavior:**
- Character fields included: `voiceProfile`, `motivations`, `relationships`
- World fields included: `tone`, `rules`, `societies`
- Token budget: 65% character (split between 3), 25% world
- Format: Detailed

**Test Steps:**
1. Create script creation session with mode = `script`
2. Link 3 characters
3. Link world
4. Send message: "Create a script for a council meeting scene"
5. Open Dev Mode Panel and click the Context tab

**Verification:**
- [ ] All 3 characters have voice profiles included
- [ ] Character relationships included
- [ ] World tone and rules included
- [ ] Token budget: ~21.7% per character, 25% world
- [ ] No character exceeded individual budget

---

### Test 9: Project Mode - All Linked Entities

**Mode:** `project`
**Linked Entities:**
- 1 Project
- 3 Characters (various roles)
- 2 Worlds

**Expected Behavior:**
- Project fields included: `name`, `genre`, `summary`, `timeline`
- Character fields included: `name`, `role`, `coreConcept`, `arcType`
- World fields included: `name`, `genre`, `tone`
- Token budget: 40% project, 35% character, 25% world
- Format: Standard

**Test Steps:**
1. Create project management session with mode = `project`
2. Link project, 3 characters, 2 worlds
3. Send message: "Give me a project overview"
4. Open Dev Mode Panel and click the Context tab

**Verification:**
- [ ] All entities included
- [ ] Token budget distributed: 40% project, 35% character (split), 25% world (split)
- [ ] Project timeline included
- [ ] Character progress included
- [ ] World settings included

---

## Token Budget Verification Tests

### Test 10: Token Budget Enforcement

**Scenario:** Link many entities to exceed budget

**Test Steps:**
1. Create session with mode = `character`
2. Link 1 character with ALL fields populated (long prose)
3. Set token budget to 1000 tokens
4. Send message
5. Check Dev Mode Panel Context tab

**Verification:**
- [ ] Total token count < 1000
- [ ] High priority fields included
- [ ] Low priority fields truncated or dropped
- [ ] Debug panel shows truncated fields

---

### Test 11: Priority-Based Field Inclusion

**Scenario:** Verify high-priority fields always included

**Test Steps:**
1. Create session with mode = `scene`
2. Link character with `voiceProfile` (high priority) and `backstoryProse` (low priority)
3. Set token budget to 500 tokens (tight budget)
4. Send message
5. Check Dev Mode Panel Context tab

**Verification:**
- [ ] `voiceProfile` included
- [ ] `backstoryProse` truncated or dropped
- [ ] High priority fields never dropped
- [ ] Debug panel shows correct priority allocation

---

## Debug Panel Tests

### Test 12: Debug Panel Visibility

**Test Steps:**
1. Disable dev mode: `localStorage.removeItem('5d-admin-mode')`
2. Create any chat session
3. Look for debug panel toggle

**Verification:**
- [ ] Debug panel toggle NOT visible in UI

**Test Steps:**
1. Enable dev mode: `localStorage.setItem('5d-admin-mode', 'true')`
2. Create any chat session
3. Look for debug panel toggle

**Verification:**
- [ ] Debug panel toggle visible in chat header
- [ ] Clicking toggle shows/hides panel

---

### Test 13: Debug Panel Sections

**Test Steps:**
1. Enable dev mode
2. Create session with multiple linked entities
3. Send message
4. Open Dev Mode Panel and click the Context tab
5. Expand all sections

**Verification:**
- [ ] Summary section shows: mode, token count, budget utilization
- [ ] Entities Included section shows: all linked entities by type
- [ ] Fields Per Entity section shows: fields included for each entity type
- [ ] Truncated Fields section shows: any truncated fields (if applicable)
- [ ] Full Context Text section shows: raw markdown context
- [ ] Budget Allocation section shows: token budget per entity type

---

## Integration Tests

### Test 14: Mode Switching

**Test Steps:**
1. Create session with linked character
2. Set mode = `character`
3. Send message, check context
4. Switch mode to `workshop`
5. Send message, check context

**Verification:**
- [ ] Context fields change based on mode
- [ ] Token budget allocation changes
- [ ] Debug panel shows correct mode

---

### Test 15: Backward Compatibility

**Test Steps:**
1. Create session WITHOUT `useContextInjection` flag
2. Use old system (linked character/world as JSON)
3. Send message

**Verification:**
- [ ] Old system still works
- [ ] No errors in console
- [ ] Context still injected (unfiltered)

---

## Performance Tests

### Test 16: Large Entity Performance

**Test Steps:**
1. Create character with:
   - 50+ motivations
   - 50+ flaws
   - 10+ allies/enemies
   - Long prose fields (5000+ chars each)
2. Link to session with mode = `character`
3. Measure time to assemble context
4. Check token count

**Verification:**
- [ ] Context assembly < 100ms
- [ ] Token count respects budget (fields truncated)
- [ ] No browser lag

---

### Test 17: Multi-Entity Performance

**Test Steps:**
1. Create session with:
   - 5 characters
   - 3 worlds
   - 2 projects
2. Link all entities
3. Set mode = `project`
4. Send message
5. Measure context assembly time

**Verification:**
- [ ] Context assembly < 200ms
- [ ] Token budget distributed correctly
- [ ] All entities represented (may be truncated)

---

## Edge Case Tests

### Test 18: Empty Entities

**Test Steps:**
1. Create character with only `name` and `id`
2. Link to session with mode = `character`
3. Send message
4. Check Dev Mode Panel Context tab

**Verification:**
- [ ] Context includes only available fields
- [ ] No errors for missing fields
- [ ] Debug panel shows minimal field count

---

### Test 19: Nested Field Extraction

**Test Steps:**
1. Create character with `voiceProfile` object
2. Link to session with mode = `chat_with`
3. Send message
4. Check Dev Mode Panel Context tab

**Verification:**
- [ ] Voice profile object correctly extracted
- [ ] Nested fields (sampleDialogue, speechPatterns) included
- [ ] JSON formatted correctly in context

---

### Test 20: Array Truncation

**Test Steps:**
1. Create character with 50 motivations
2. Mode config specifies `maxItems: 5`
3. Link to session with mode = `character`
4. Send message
5. Check context

**Verification:**
- [ ] Only first 5 motivations included
- [ ] No error for truncated array
- [ ] Token count reduced appropriately

---

## Success Criteria

### Overall System

- [ ] All 9 modes tested and working
- [ ] Token budgets respected in all modes
- [ ] Context injection reduces token usage vs sending full entities
- [ ] Debug panel shows accurate information
- [ ] No breaking changes to existing functionality

### Performance

- [ ] Context assembly < 200ms for multi-entity sessions
- [ ] No UI lag or freezing
- [ ] Token budget calculations accurate (±5%)

### Developer Experience

- [ ] Debug panel is easy to use
- [ ] Error messages are clear
- [ ] Code is well-documented
- [ ] Test coverage > 80%

---

## Test Execution Tracking

| Test # | Test Name | Status | Date | Notes |
|--------|-----------|--------|------|-------|
| 1 | Chat Mode - Minimal Context | ⏳ Pending | - | - |
| 2 | Character Mode - Full Fields | ⏳ Pending | - | - |
| 3 | World Mode - World + Characters | ⏳ Pending | - | - |
| 4 | Lore Mode - History + Culture | ⏳ Pending | - | - |
| 5 | Scene Mode - Voice + Relationships | ⏳ Pending | - | - |
| 6 | Workshop Mode - Arc Deep-Dive | ⏳ Pending | - | - |
| 7 | Chat With Mode - Voice + Personality | ⏳ Pending | - | - |
| 8 | Script Mode - Dialogue + Scene | ⏳ Pending | - | - |
| 9 | Project Mode - All Entities | ⏳ Pending | - | - |
| 10 | Token Budget Enforcement | ⏳ Pending | - | - |
| 11 | Priority-Based Field Inclusion | ⏳ Pending | - | - |
| 12 | Debug Panel Visibility | ⏳ Pending | - | - |
| 13 | Debug Panel Sections | ⏳ Pending | - | - |
| 14 | Mode Switching | ⏳ Pending | - | - |
| 15 | Backward Compatibility | ⏳ Pending | - | - |
| 16 | Large Entity Performance | ⏳ Pending | - | - |
| 17 | Multi-Entity Performance | ⏳ Pending | - | - |
| 18 | Empty Entities | ⏳ Pending | - | - |
| 19 | Nested Field Extraction | ⏳ Pending | - | - |
| 20 | Array Truncation | ⏳ Pending | - | - |

---

## Test Results Summary

**Date Completed:** _________
**Tester:** _________
**Overall Pass Rate:** ____%

**Critical Issues Found:**
- [ ] None
- [ ] List issues here

**Recommended Next Steps:**
- [ ] Deploy to production
- [ ] Address issues and re-test
- [ ] Document edge cases
