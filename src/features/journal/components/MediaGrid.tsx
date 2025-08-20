import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Colors } from '../../../theme/colors';

interface MediaItem {
  type: 'image' | 'video';
  url: string;
  thumbnailUrl?: string;
}

interface MediaGridProps {
  media: MediaItem[];
  dateOverlay?: {
    line1: string;
    line2: string;
    line3: number;
    line4: number;
  };
}

const renderImageWithOverlay = (item: any, style: any, key: any, overlayCount?: number, dateOverlay?: MediaGridProps['dateOverlay']) => (
    <View key={key} style={style}>
        <Image source={{ uri: item.url }} style={styles.mediaImage} />
        {overlayCount != null && overlayCount > 0 && (
            <View style={styles.overlay}>
                <Text style={styles.overlayText}>+{overlayCount}</Text>
            </View>
        )}
        {dateOverlay && dateOverlay.line1 && dateOverlay.line2 && (
            <View style={styles.dateOverlayContainer}>
                {dateOverlay.line1 ? <Text style={styles.dateOverlayText}>{dateOverlay.line1}</Text> : null}
                {dateOverlay.line2 && dateOverlay.line3 ? (
                    <Text style={[styles.dateOverlayText, styles.dateOverlayTextLarge]}>
                        {dateOverlay.line2} {dateOverlay.line3}
                    </Text>
                ) : null}
                {dateOverlay.line4 ? <Text style={styles.dateOverlayText}>{dateOverlay.line4}</Text> : null}
            </View>
        )}
    </View>
);

const MediaGrid: React.FC<MediaGridProps> = ({ media, dateOverlay }) => {
  if (!media || media.length === 0) return null;

  const mediaCount = media.length;

  if (mediaCount === 1) {
      return (
          <View style={styles.mediaGridContainer}>
              {renderImageWithOverlay(media[0], styles.fullWidthImage, 'img-0', 0, dateOverlay)}
          </View>
      );
  }

  if (mediaCount === 2) {
      return (
          <View style={styles.mediaGridContainer}>
              {renderImageWithOverlay(media[0], styles.halfWidthImage, 'img-0', 0, dateOverlay)}
              {renderImageWithOverlay(media[1], styles.halfWidthImage, 'img-1')}
          </View>
      );
  }

  if (mediaCount === 3) {
      return (
          <View style={styles.mediaGridContainer}>
              <View style={styles.leftColumn}>
                  {renderImageWithOverlay(media[0], styles.fullHeightImage, 'img-0', 0, dateOverlay)}
              </View>
              <View style={styles.rightColumn}>
                  {renderImageWithOverlay(media[1], styles.rightColumnItem, 'img-1')}
                  {renderImageWithOverlay(media[2], styles.rightColumnItem, 'img-2')}
              </View>
          </View>
      );
  }

  if (mediaCount === 4) {
      return (
          <View style={styles.mediaGridContainer}>
              <View style={styles.leftColumn}>
                  {renderImageWithOverlay(media[0], styles.fullHeightImage, 'img-0', 0, dateOverlay)}
              </View>
              <View style={styles.rightColumn}>
                  <View style={styles.rightColumnTop}>
                      {renderImageWithOverlay(media[1], styles.rightColumnTopItem, 'img-1')}
                      {renderImageWithOverlay(media[2], styles.rightColumnTopItem, 'img-2')}
                  </View>
                  {renderImageWithOverlay(media[3], styles.rightColumnBottomItem, 'img-3')}
              </View>
          </View>
      );
  }

  // 5+ images
  return (
      <View style={styles.mediaGridContainer}>
          <View style={styles.leftColumn}>
              {renderImageWithOverlay(media[0], styles.fullHeightImage, 'img-0', 0, dateOverlay)}
          </View>
          <View style={styles.rightColumn}>
               <View style={styles.rightColumnTop}>
                  {renderImageWithOverlay(media[1], styles.rightColumnTopItem, 'img-1')}
                  {renderImageWithOverlay(media[2], styles.rightColumnTopItem, 'img-2')}
              </View>
              <View style={styles.rightColumnBottom}>
                  {renderImageWithOverlay(media[3], styles.rightColumnBottomItem, 'img-3')}
                  {renderImageWithOverlay(media[4], styles.rightColumnBottomItem, 'img-4', mediaCount - 5)}
              </View>
          </View>
      </View>
  );
};

const styles = StyleSheet.create({
  mediaGridContainer: {
    flexDirection: 'row',
    borderRadius: 0,
    overflow: 'hidden',
    height: 180,
    backgroundColor: '#f0f0f0',
  },
  fullWidthImage: {
      flex: 1,
      height: '100%',
      padding: 1,
  },
  halfWidthImage: {
      flex: 1,
      height: '100%',
      padding: 1,
  },
  leftColumn: {
    flex: 0.5,
    padding: 1,
  },
  rightColumn: {
    flex: 0.5,
    flexDirection: 'column',
  },
  fullHeightImage: {
    width: '100%',
    height: '100%',
  },
  rightColumnItem: {
      flex: 1,
      width: '100%',
      padding: 1,
  },
  rightColumnTop: {
      flex: 1,
      flexDirection: 'row',
  },
  rightColumnTopItem: {
      flex: 1,
      width: '50%',
      padding: 1,
  },
  rightColumnBottom: {
      flex: 1,
      flexDirection: 'row',
  },
  rightColumnBottomItem: {
      flex: 1,
      width: '100%',
      padding: 1,
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateOverlayContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  dateOverlayText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  dateOverlayTextLarge: {
    fontSize: 36,
    lineHeight: 40,
  },
  overlayText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default MediaGrid;