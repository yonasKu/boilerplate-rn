# AI Recap Personalization Plan

This document outlines the strategy for enhancing the AI model's ability to generate highly personalized recaps that correctly identify and use the child's name.

## 1. Objective

To transform the AI from a generic summary generator into a personal storyteller that speaks *about* the specific child, using their name to create a warmer, more engaging tone.

## 2. The Problem

The current recaps, while summarizing events, lack a personal touch. They often feel generic because the AI does not consistently and effectively use the child's name, even when it is provided.

## 3. Implementation Steps

### Step 1: Explicit Data Passing
- **File**: `services/journalAggregator.js`
- **Action**: Ensure the `childName` is passed as a distinct, top-level field in the data object sent to the `openAIService`, in addition to being part of the general `childInfo` string.

### Step 2: Refine AI Prompts for Personalization
- **File**: `services/openAIService.js`
- **Action**: Update the core prompts with explicit instructions that force the AI to focus on the child's name.
- **Example Instruction**: *"You are writing a recap for a child named **{childName}**. It is critical that you use their name at least once in the recap to make it feel personal. Analyze the journal entries and focus on moments that are clearly about **{childName}**."*

### Step 3: Add Name Validation Instruction
- **File**: `services/openAIService.js`
- **Action**: Add a simple validation instruction to the prompt to ensure the AI prioritizes the correct child.
- **Example Instruction**: *"The recap is for **{childName}**. If you see other names mentioned in the entries, keep the focus on **{childName}**'s experiences and interactions."*
