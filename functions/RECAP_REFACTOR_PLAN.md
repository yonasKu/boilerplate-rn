# Recap Generation Refactor Plan

This document outlines the step-by-step plan to refactor the AI recap generation system. No code will be implemented until this plan is approved.

## Objective

To transform the current generic AI integration into a personalized, structured, and consistent recap writer, as detailed in `AI_INTEGRATION_CHANGES.md`.

---

## Phase 1: Data Structure Cleanup

**Goal**: Eliminate data redundancy in Firestore to create a clean and efficient data model.

*   **File to Modify**: `services/recapGenerator.js`
*   **Action**: Update the `saveRecap` function to store the AI-generated content *only* within the `aiGenerated` object. The redundant top-level fields (`title`, `content`, `highlights`, etc.) will be removed.

**Current Structure:**
```javascript
{
  title: "A special day",
  content: "...",
  highlights: ["..."],
  aiGenerated: {
    title: "A special day",
    summary: "...",
    highlights: ["..."]
  }
}
```

**New Structure:**
```javascript
{
  aiGenerated: {
    title: "A special day",
    summary: "...",
    highlights: ["..."]
  }
}
```

---

## Phase 2: Data Aggregation & Personalization

**Goal**: Fetch and format all necessary data (including child's age) into a structure optimized for the new AI prompt.

*   **Step 2.1: Create Age Calculation Utility**
    *   **Action**: Create a new file at `utils/ageCalculator.js`.
    *   **Details**: This file will export a `calculateAgeString(dateOfBirth)` function that returns a human-readable age (e.g., "6 months old").

*   **Step 2.2: Refactor `JournalAggregator` Service**
    *   **File to Modify**: `services/journalAggregator.js`
    *   **Action**: The `aggregateJournalEntries` function will be completely refactored to:
        1.  Fetch the specified child's document to get their `name` and `dateOfBirth`.
        2.  Use the new `ageCalculator` utility to get a formatted `childAge` string.
        3.  Group all journal entries from the specified period by the day of the week (e.g., `sunday`, `monday`).
        4.  Return a single, structured object ready for the AI service.

**New Aggregator Output Format:**
```javascript
{
  childName: "Zoe",
  childAge: "6 months old",
  dailyEntries: {
    sunday: "Entry text for Sunday...",
    monday: "Entry text for Monday...",
    // ... and so on for the rest of the week
  },
  totalEntries: 7
}
```

---

## Phase 3: AI Prompt & Settings Update

**Goal**: Implement the standardized prompt templates defined in `RECAP_STRUCTURE.md` for consistent, high-quality AI-generated recaps.

*   **File to Modify**: `services/openAIService.js`
*   **Reference**: `RECAP_STRUCTURE.md` contains complete templates for:
    - Weekly recaps (Sun→Sat daily entries)
    - Monthly recaps (Week 1→4 entries)
    - Yearly recaps (Month 1→12 entries)
    - Quality assurance standards and guardrails

*   **Actions**:
    1.  Update `generateRecap` to accept new data structure from Phase 2
    2.  Create `buildWeeklyPrompt()`, `buildMonthlyPrompt()`, and `buildYearlyPrompt()` methods using templates from `RECAP_STRUCTURE.md`
    3.  Implement guardrails and error handling
    4.  Ensure consistent formatting across all recap types

---

## Approval

**This plan will not be implemented until you provide explicit approval.** Please review the phases and confirm if you would like me to proceed.
