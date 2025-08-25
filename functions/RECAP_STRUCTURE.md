# AI Recap Generation Templates

This document defines the standardized prompt structures for AI-generated recaps across all temporal periods (weekly, monthly, and yearly). These templates ensure consistent, high-quality output that maintains a warm, engaging tone while preserving parental voice and child personalization.

## Weekly Recap Template

### Input Structure
```
Child: {{child_name}} {{child_age_optional}}
Week: {{week_label_optional}}
Parent voice: mom
Tone: warm, light, a touch playful, easy to scan
Entries (Sun→Sat):
Sunday — {{entry_sun}}
Monday — {{entry_mon}}
Tuesday — {{entry_tue}}
Wednesday — {{entry_wed}}
Thursday — {{entry_thu}}
Friday — {{entry_fri}}
Saturday — {{entry_sat}}
Please return one paragraph, 4–6 sentences.
```

### Example Input/Output
**Input:**
```
Child: Zoe (6 months)
Entries:
Sun—Shook her rattle… • Mon—Tried avocado… • Tue—Rolled over… • Wed—Peek-a-boo giggles… • Thu—Loved the mirror… • Fri—First stroller walk… • Sat—Fell asleep holding my finger.
```

**Output:**
```
This week, Zoe showed off her growing strength and curiosity. She’s rolling over all by herself and loved shaking her rattle with surprising determination. Peek-a-boo and mirror time brought out her biggest smiles, and she had her first stroller ride through the park, soaking it all in with wide eyes. Even her first taste of avocado was memorable—though the face she made said she’s not quite a fan yet! The week ended sweetly as she drifted off to sleep holding Mom’s finger.
```

## Monthly Recap Template

### Input Structure
```
Child: {{child_name}} {{child_age_optional}}
Month: {{month_label}}
Parent voice: mom
Tone: warm, light, a touch playful, easy to scan
Entries (Week 1→4):
Week 1 — {{entry_w1}}
Week 2 — {{entry_w2}}
Week 3 — {{entry_w3}}
Week 4 — {{entry_w4}}
Please return one paragraph, 4–6 sentences.
```

### Example Input/Output
**Input:**
```
Child: Zoe (7 months)
Entries:
Week 1—Started sitting up with support… • Week 2—First solid foods… • Week 3—Learned to wave… • Week 4—Said "mama" for the first time…
```

**Output:**
```
This month has been full of delightful surprises as Zoe continues to blossom. She’s sitting up with support and exploring solid foods with curious fingers and skeptical taste buds. Her new wave is the sweetest greeting, and hearing "mama" for the first time melted my heart completely. Each week brings new skills and bigger smiles, making this month one to remember.
```

## Yearly Recap Template

### Input Structure
```
Child: {{child_name}} {{child_age_optional}}
Year: {{year_label}}
Parent voice: mom
Tone: warm, light, a touch playful, easy to scan
Entries (Month 1→12):
January — {{entry_jan}}
February — {{entry_feb}}
March — {{entry_mar}}
April — {{entry_apr}}
May — {{entry_may}}
June — {{entry_jun}}
July — {{entry_jul}}
August — {{entry_aug}}
September — {{entry_sep}}
October — {{entry_oct}}
November — {{entry_nov}}
December — {{entry_dec}}
Please return one paragraph, 4–6 sentences.
```

### Example Input/Output
**Input:**
```
Child: Zoe (1 year)
Entries:
Jan—First smile… • Feb—Started rolling… • Mar—First solid food… • Apr—Sat up alone… • May—First word "mama"… • Jun—Started crawling… • Jul—First steps… • Aug—First birthday… • Sep—Pointing at everything… • Oct—Climbing on furniture… • Nov—Saying "no"… • Dec—Dancing to music…
```

**Output:**
```
What a magical year it's been watching Zoe grow from a tiny newborn to a curious one-year-old. She went from her first smile to taking her first steps, each milestone more exciting than the last. Her first birthday party was filled with giggles and cake-covered fingers, and now she's climbing everything and dancing to any music she hears. From "mama" to "no," her personality shines through more each day. This year has been an incredible journey of discovery for both of us.
```

## Quality Assurance Standards

### Content Guidelines
- **Insufficient Data**: Respond with "Not enough journal entries for this {{period}}." when entries are missing
- **Health References**: Maintain neutral tone without medical advice when entries mention health concerns
- **Formatting**: Exclude emojis and hashtags unless explicitly requested
- **Length**: Consistently deliver 4-6 sentences in a single paragraph format

### Consistency Requirements
- Maintain uniform tone across all recap types
- Preserve parental voice throughout
- Ensure child personalization is always present
- Apply consistent formatting standards
