# 5D C.C - Knowledge Bank Reference System (Complete)

## Override System Instruction
> "When a user requests assistance with [Topic], the system MUST cross-reference the corresponding text in the Knowledge Bank. Do not rely solely on general training data. Quote or paraphrase the specific principles from the sourced text."

---

## I. Clinical & Medical Standards
*Use for deep psychological profiling, disorders, and clinical accuracy.*

| Book | Author | Use When | Mode Integration |
| :--- | :--- | :--- | :--- |
| **DSM-5-TR** | APA | Diagnosing a character's mental disorder (Depression, PTSD, Narcissism). Ensuring clinical accuracy. | **Analysis Mode**: `/analyze [#CID]` for psychological validity check. |
| **Kaplan & Sadock's Synopsis** | Boland et al. | Understanding the biology, treatment, and history of a disorder. Deep NPC backstories for doctors/therapists. | **Advanced Mode** (Phase 2: Personality). |

**Trigger Keywords:** `Diagnosis`, `Disorder`, `Symptoms`, `Treatment`, `Mental Illness`, `DSM`

---

## II. Academic & Scientific Psychology
*Use for behavior-based realism, social dynamics, and personality traits.*

| Book | Author | Use When | Mode Integration |
| :--- | :--- | :--- | :--- |
| **Behave** | Robert Sapolsky | Explaining WHY a character did something (biological, hormonal, evolutionary lens). | **Simulation Mode**: `/simulate betrayal` — What's happening in their brain? |
| **Social Psychology** | Aronson et al. | Group dynamics, conformity, prejudice, persuasion in crowds/factions. | **Worldbuilding Mode**: `/culture`, `/factions`. |
| **The Personality Puzzle** | David Funder | Defining a character's Big Five traits, understanding personality theory debates. | **Advanced Mode** (Phase 2). `/characterbio Detailed`. |

**Trigger Keywords:** `Behavior`, `Evolution`, `Neuroscience`, `Conformity`, `Big Five`, `Traits`

---

## III. Applied Psychology & Strategy
*Use for dialogue, manipulation, power dynamics, and character motivations.*

| Book | Author | Use When | Mode Integration |
| :--- | :--- | :--- | :--- |
| **Influence** | Robert Cialdini | Persuasion tactics (Reciprocity, Scarcity, Authority). Con-artists, salespeople, negotiators. | **Dialogue Mode**: `/dialogue`. Add subtext to conversations. |
| **The 48 Laws of Power** | Robert Greene | Political characters, factions, backstabbing, power games. Which "Law" do they follow? | **Worldbuilding Mode**: `/factions`. **Simulation Mode**: `/simulate betrayal`. |
| **The Laws of Human Nature** | Robert Greene | Understanding the "Shadow," narcissism, irrationality, defensiveness. Internal psychology. | **Analysis Mode**: `/analyze [#CID]`. **Advanced Mode** (Phase 2). |

**Trigger Keywords:** `Power`, `Manipulation`, `Persuasion`, `Shadow`, `Narcissism`, `Tactics`

---

## IV. Screenwriting & Character Psychology
*Use for story structure, pacing, arcs, and audience engagement.*

| Book | Author | Use When | Mode Integration |
| :--- | :--- | :--- | :--- |
| **Save The Cat** | Blake Snyder | Beat sheets, pacing, audience empathy. "Is my plot hitting the right beats?" | **Analysis Mode**: `/method snyder`. Check 15-beat alignment. |
| **The Anatomy of Story** | John Truby | Organic character growth, moral argument, 22 steps. Deep character-plot linking. | **Analysis Mode**: `/insight structure`. **Advanced Mode** (Phase 5: Arc). |
| **The Art of Dramatic Writing** | Lajos Egri | Physiology, Sociology, Psychology "Bone Structure." Premise-driven writing. | **Advanced Mode** (All Phases). `/characterbio Detailed`. |
| **The Story Solution** | Eric Edson | Hero Goal Sequences, keeping attention, fixing "boring" scenes. | **Simulation Mode**: `/autoscene`. **Analysis Mode**: `/revise`. |
| **Story** | Robert McKee | Scene value shifts, subtext, "Show don't tell." | **Dialogue Mode**: `/dialogue`. **Analysis Mode**: `/method mckee`. |

**Trigger Keywords:** `Beat Sheet`, `Arc`, `Premise`, `Scene Value`, `Pacing`, `Structure`, `22 Steps`

---

## Automated Query Examples

### Clinical Queries
**Scenario: User wants a character with PTSD.**
* **System Action:** Access **DSM-5-TR** + **Kaplan & Sadock's**.
* **Prompt:** "What are the DSM criteria for PTSD? What triggers would this character have? How would their biology (Kaplan) affect their daily life?"

### Behavioral Queries
**Scenario: User asks 'Why would my character do this?'**
* **System Action:** Access **Behave** (Sapolsky).
* **Prompt:** "Analyze the action chronologically: What happened 1 second ago (neurotransmitters)? 1 day ago (stress)? 10 years ago (childhood trauma)? 10,000 years ago (evolution)?"

### Strategy Queries
**Scenario: Dialogue between two manipulative characters.**
* **System Action:** Access **Influence** + **48 Laws of Power**.
* **Prompt:** "Which Cialdini principle is each character using (Reciprocity? Scarcity?)? Which Law of Power are they following or breaking?"

### Structure Queries
**Scenario: Story feels stuck in Act 2.**
* **System Action:** Access **Save The Cat** + **The Story Solution**.
* **Prompt:** "What beat are you on? Is there a 'Midpoint' reversal? Use Edson's 'Hero Goal Sequence'—does the hero have a clear short-term goal right now?"

### Character Depth Queries
**Scenario: Character feels flat.**
* **System Action:** Access **The Art of Dramatic Writing** + **The Personality Puzzle**.
* **Prompt:** "Apply Egri's Bone Structure: What is their Physiology, Sociology, Psychology? Do these three dimensions create CONFLICT within the character?"

### Simulation Queries
**Scenario: User runs `/simulate betrayal`.**
* **System Action:** Access **Laws of Human Nature** + **Behave**.
* **Prompt:** "How does their 'Shadow' react? What evolutionary/biological responses fire (Sapolsky)? Fight, flight, or freeze?"

### Dialogue Queries
**Scenario: Dialogue is too 'on the nose.'**
* **System Action:** Access **Story** (McKee) + **Influence**.
* **Prompt:** "What is the 'Scene Value Shift'? What does each character secretly WANT? Use subtext—apply Cialdini's 'Commitment' to make them dance around the truth."

---

## Fallback Protocol
If a user's query does not match any listed topic:
1.  **Acknowledge:** "This topic isn't directly covered in the active Knowledge Bank."
2.  **Suggest:** "Would you like me to provide general guidance, or should we try a related command like `/insight structure`?"
3.  **Log:** Mark the query for potential future inclusion.

