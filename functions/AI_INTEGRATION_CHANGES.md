# AI Integration Changes: Current vs New Recap Writer

## Current AI Integration Analysis

### **Current System (`services/openAIService.js`)**
```javascript
Current Prompt Structure:
- System: "You are a warm, loving parent..."
- User: Basic aggregated journal data
- Output: Generic storytelling format
- Style: Broad emotional summaries
```

### **Current Issues**
1. **Generic prompts** - Not tailored to specific recap formats
2. **Unstructured output** - No consistent formatting
3. **Missing personalization** - Doesn't use child name/age consistently
4. **No day-by-day structure** - Lacks weekly timeline
5. **No specific voice guidance** - Generic "loving parent" tone

---

## New Recap Writer Requirements

### **New System Specifications**

#### **Prompt Structure Change**
```javascript
New Prompt Template:
{
  system: "You are Sproutbook's recap writer...",
  child: "{{child_name}} {{child_age_optional}}",
  parent_voice: "mom",
  tone: "warm, light, playful, easy to scan",
  format: "One paragraph, 4-6 sentences",
  structure: "Sun→Sat daily entries",
  rules: "Highlight milestones, avoid medical advice"
}
```

#### **Input Format Change**
```javascript
// Current: Aggregated text blob
// New: Structured weekly entries
{
  child: "Zoe (6 months)",
  entries: {
    sunday: "Shook her rattle...",
    monday: "Tried avocado...", 
    tuesday: "Rolled over...",
    wednesday: "Peek-a-boo giggles...",
    thursday: "Loved the mirror...",
    friday: "First stroller walk...",
    saturday: "Fell asleep holding my finger..."
  }
}
```

#### **Output Format Change**
```javascript
// Current: Variable length, inconsistent
// New: One paragraph, 4-6 sentences, specific structure

Example Output:
"This week, Zoe showed off her growing strength and curiosity. She's rolling over all by herself and loved shaking her rattle with surprising determination. Peek-a-boo and mirror time brought out her biggest smiles, and she had her first stroller ride through the park, soaking it all in with wide eyes. Even her first taste of avocado was memorable—though the face she made said she's not quite a fan yet! The week ended sweetly as she drifted off to sleep holding Mom's finger."
```

---

## Implementation Changes Required

### **1. Prompt Builder Update**
```javascript
// Current: Basic prompt construction
// New: Structured prompt with specific format

buildPrompt(journalData, type) {
  if (type === 'weekly') {
    return this.buildWeeklyPrompt(journalData);
  }
  // Similar for monthly/yearly with appropriate formatting
}
```

### **2. Data Structure Changes**
```javascript
// Need to transform aggregated data into daily entry format
{
  child_name: "Zoe",
  child_age: "6 months",
  daily_entries: {
    sun: "entry text",
    mon: "entry text",
    // ... etc
  }
}
```

### **3. API Settings Changes**
```javascript
// Current: Basic settings
// New: Optimized for consistent output
{
  temperature: 0.5,        // Balanced creativity/consistency
  max_tokens: 180,         // ~4-6 sentences
  frequency_penalty: 0.2,  // Reduce repetition
  presence_penalty: 0.1    // Encourage variety
}
```

---

## Migration Plan

### **Phase 1: Prompt Updates**
1. Replace current prompt builder with new structured format
2. Add child name/age injection
3. Implement daily entry formatting

### **Phase 2: Data Processing**
1. Modify journal aggregator to output daily structure
2. Transform aggregated entries into day-by-day format
3. Handle missing days gracefully

### **Phase 3: Output Standardization**
1. Ensure consistent 4-6 sentence output
2. Add quality checks for tone and format
3. Implement guardrails for health/medical content

---

## Files to Modify

1. **`services/openAIService.js`**
   - Update `buildPrompt()` method
   - Add new prompt templates
   - Modify response parsing

2. **`services/journalAggregator.js`**
   - Add daily entry formatting
   - Structure output for new prompt format

3. **`services/recapGenerator.js`**
   - Update data passing to OpenAIService
   - Ensure consistent data structure

---

## Testing Requirements

1. **Weekly recap format validation**
2. **Child name/age personalization**
3. **4-6 sentence output consistency**
4. **Tone and voice matching**
5. **Missing day handling**

---

## Current vs New Comparison

| Aspect | Current | New |
|--------|---------|-----|
| **Prompt Structure** | Generic parent voice | Specific weekly format |
| **Input Data** | Aggregated text | Daily entries (Sun-Sat) |
| **Output Format** | Variable | 4-6 sentences, one paragraph |
| **Personalization** | Inconsistent | Child name + age |
| **Tone Control** | Basic | Warm, light, playful |
| **Consistency** | Variable | Standardized |

This document provides the roadmap for transforming the current generic AI integration into the specific weekly recap writer format requested.
