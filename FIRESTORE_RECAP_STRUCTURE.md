# Firestore Recap Document Structure

Based on the provided Firestore document structure, the correct path to extract image URLs is:

```
summary.media.mediaEntries[].images[].url
```

## Document Structure

```json
{
  "childAge": "10 months old",
  "childId": "7TvS6AuZPp9ZoNLc64oB",
  "childName": "Dggv",
  "createdAt": "August 19, 2025 at 3:04:48 PM UTC-5",
  "processingTime": 5775,
  "status": "completed",
  "summary": {
    "children": {},
    "entriesPerChild": {
      "25uAc4ILzdt3EEYRgrGM": 4,
      "7TvS6AuZPp9ZoNLc64oB": 7
    },
    "totalChildren": 2,
    "uniqueChildren": ["25uAc4ILzdt3EEYRgrGM", "7TvS6AuZPp9ZoNLc64oB"],
    "dateRange": {
      "end": "August 19, 2025 at 3:04:42 PM UTC-5",
      "start": "August 12, 2025 at 3:04:42 PM UTC-5"
    },
    "favoritedEntries": 2,
    "keyMoments": [...],
    "media": {
      "hasImages": true,
      "imageMetadata": {
        "count": 13,
        "hasImages": true,
        "imageTypes": ["image"]
      },
      "mediaEntries": [
        {
          "content": "...",
          "date": "August 19, 2025 at 7:11:35 AM UTC-5",
          "id": "DxnsfxUS6cZHJXpQHAqw",
          "imageMetadata": {
            "count": 3,
            "hasImages": true,
            "imageTypes": ["image"]
          },
          "images": [
            {
              "type": "image",
              "url": "https://firebasestorage.googleapis.com/v0/b/sproutbook-d0c8f.firebasestorage.app/o/journal_media%2Fmeii6frlpuuf30mx5os?alt=media&token=914e5536-824f-41c8-96fa-c0e968415326"
            },
            {
              "type": "image", 
              "url": "https://firebasestorage.googleapis.com/v0/b/sproutbook-d0c8f.firebasestorage.app/o/journal_media%2Fmeii6frycnzlkqbwttn?alt=media&token=158edd09-1fa4-4269-a7b7-8d3f8854c9fe"
            },
            {
              "type": "image",
              "url": "https://firebasestorage.googleapis.com/v0/b/sproutbook-d0c8f.firebasestorage.app/o/journal_media%2Fmeii6fs0hz8c73lbgm6?alt=media&token=c7c15958-6a1f-42a1-a927-4362401fd7c1"
            }
          ],
          "totalSize": 0,
          "mediaCount": 4
        }
        // ... more entries with images
      ],
      "totalImages": 13,
      "totalMediaCount": 15,
      "totalMediaEntries": 6
    },
    "milestones": {},
    "period": "weekly",
    "totalEntries": 7,
    "title": "Dggv's Week Aug 12 - Aug 19",
    "type": "weekly"
  },
  "userId": "HFae1tgjnvYOnEXMdUUT3eJbfI82"
}
```

## Correct Data Mapping

The correct TypeScript mapping should be:

```typescript
media: {
  highlightPhotos: data.summary?.media?.mediaEntries
    ?.flatMap((entry: { images?: { url: string }[] }) => 
      entry.images?.map((image) => image.url).filter(Boolean) || []
    ) || []
}
```

This extracts all image URLs from the nested `summary.media.mediaEntries` structure.
