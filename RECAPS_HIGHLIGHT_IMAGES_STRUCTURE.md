# Recap Highlight Images Structure

This document describes the correct structure for extracting highlight images from recap documents in Firestore.

## Data Structure

The recap documents in Firestore contain two distinct sets of image data:

1. **highlightPhotos** - Array of actual image URLs to be displayed
2. **imageMetadata** - Metadata for counting and statistics (not for display)

## Correct Data Path

The highlight images that should be used for frontend display are directly accessible at:

```
highlightPhotos[]
```

This is a simple array of image URLs that have been pre-processed and filtered by the AI recap generation system.

## Example Document Structure

```json
{
  "childAge": "1 month old",
  "childId": "25uAc4ILzdt3EEYRgrGM",
  "childName": "Testsss",
  "createdAt": "August 19, 2025 at 3:53:02 PM UTC-5",
  "imageMetadata": {
    "count": 10,
    "hasImages": true
  },
  "processingTime": 6998,
  "status": "completed",
  "summary": {
    "title": "Testsss's Week Aug 12 - Aug 19",
    "type": "weekly"
  },
  "userId": "HFae1tgjnvYOnEXMdUUT3eJbfI82",
  "highlightPhotos": [
    "https://firebasestorage.googleapis.com/v0/b/sproutbook-d0c8f.firebasestorage.app/o/journal_media%2Fxyz123?alt=media&token=abc",
    "https://firebasestorage.googleapis.com/v0/b/sproutbook-d0c8f.firebasestorage.app/o/journal_media%2Fdef456?alt=media&token=def",
    "https://firebasestorage.googleapis.com/v0/b/sproutbook-d0c8f.firebasestorage.app/o/journal_media%2Fghi789?alt=media&token=ghi"
  ]
}
```

## Implementation Guidelines

### Frontend Usage

1. **Use highlightPhotos directly** - This array contains the URLs of images that should be displayed
2. **Ignore imageMetadata for display** - This is only for counting/statistics
3. **No complex parsing required** - The highlightPhotos array is ready to use

### Code Example

```typescript
// Correct way to extract highlight images
const images = recap.highlightPhotos || [];

// Render images
images.map((url, index) => (
  <Image key={index} source={{ uri: url }} style={styles.image} />
));
```

## Common Mistakes to Avoid

1. **Do NOT** try to extract images from `summary.media.mediaEntries[].images[].url`
2. **Do NOT** use `imageMetadata` for displaying images
3. **Do NOT** expect nested structures - highlightPhotos is a flat array

## Benefits of This Approach

1. **Performance** - Pre-filtered images reduce frontend processing
2. **Consistency** - Images are already selected by AI for highlight reel
3. **Simplicity** - Direct array access without complex parsing
4. **Reliability** - No risk of missing nested data structures
