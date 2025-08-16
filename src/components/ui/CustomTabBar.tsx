import { View, Text, TouchableOpacity, StyleSheet, Animated, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useJournal } from '@/hooks/useJournal';
import { Colors } from '@/theme';

const CustomTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const { bottom } = useSafeAreaInsets();
  const router = useRouter();
  const glowAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const { entries } = useJournal();

  const getIcon = (routeName: string, isActive: boolean) => {
    switch (routeName) {
      case 'journal':
        return isActive
          ? require('@/assets/images/journal_icon_active.png')
          : require('@/assets/images/journal_icon.png');
      case 'recaps':
        return isActive
          ? require('@/assets/images/recaps_icon_active.png')
          : require('@/assets/images/recaps_icon.png');
      case 'search':
        return isActive
          ? require('@/assets/images/search_icon_active.png')
          : require('@/assets/images/search_icon.png');
      default:
        return require('@/assets/images/journal_icon.png');
    }
  };

  const visibleRoutes = ['journal', 'recaps', 'search'];



  // Animation for new entry hint - enhanced glowing orb effect
  useEffect(() => {
    // Show enhanced glow if no entries exist
    const shouldShowGlow = entries.length === 0;

    if (shouldShowGlow) {
      // Balanced animation - noticeable but not overwhelming
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 0.8,
            duration: 2500,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.2,
            duration: 2500,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Gentle scale pulse
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.15,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [entries.length]);

  const handleNewEntryPress = () => {
    router.push('/new-entry');
  };

  return (
    <View style={[styles.container, { paddingBottom: bottom }]}>
      <View style={styles.mainContainer}>
        <View style={styles.tabBar}>
          {state.routes.filter(r => visibleRoutes.includes(r.name)).map((route, index) => {
            const { options } = descriptors[route.key];
            const label = options.title !== undefined ? options.title : route.name;
            const isFocused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            return (
              <TouchableOpacity
                key={route.key}
                onPress={onPress}
                style={styles.tabButton}
              >
                <Image
                  source={getIcon(route.name, isFocused)}
                  style={
                    route.name === 'journal'
                      ? (isFocused ? styles.journalIconActive : styles.journalIcon)
                      : route.name === 'recaps'
                        ? (isFocused ? styles.recapsIconActive : styles.recapsIcon)
                        : (isFocused ? styles.searchIconActive : styles.searchIcon)
                  }
                  resizeMode="contain"
                />
                <Text style={[
                  styles.label,
                  { color: isFocused ? Colors.primary : Colors.mediumGrey },
                  route.name === 'recaps' && styles.recapLabel
                ]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.newButtonContainer}>
          {entries.length === 0 && (
            <Animated.View
              style={[
                styles.glowOrb,
                {
                  opacity: glowAnim,
                  transform: [
                    {
                      scale: scaleAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1.1, 1.3]
                      })
                    }
                  ]
                }
              ]}
            />
          )}
          <Animated.View
            style={[
              styles.newButton,
              entries.length === 0 && {
                transform: [
                  {
                    scale: scaleAnim
                  }
                ]
              }
            ]}
          >
            <TouchableOpacity
              onPress={handleNewEntryPress}
              style={styles.newButton}
            >
              <Feather name="edit" size={20} color="#fff" />
              <Text style={styles.newButtonText}>New</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 22.5,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  mainContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 30,
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    marginRight: 10,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    gap: 4,
  },
  journalIcon: {
    width: 22,
    height: 22,
    opacity: 0.7,
  },
  journalIconActive: {
    width: 22,
    height: 22,
    opacity: 1,
  },
  recapsIcon: {
    width: 38,
    height: 30,
    opacity: 0.7,
    marginBottom: -1
  },
  recapsIconActive: {
    width: 30,
    height: 30,
    opacity: 1,
  },
  searchIcon: {
    width: 22,
    height: 22,
    opacity: 0.7,
  },
  searchIconActive: {
    width: 22,
    height: 22,
    opacity: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  activeIconContainer: {
    backgroundColor: Colors.primary,
  },
  newButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  newButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    gap: 5,
  },
  newButtonText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  createHint: {
    position: 'absolute',
    top: -45,
    backgroundColor: 'transparent',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  createHintText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  label: {
    fontSize: 12,
    marginTop: 4,
    textTransform: 'capitalize',
  },
  recapLabel: {
    fontSize: 12,
    marginTop: 0,
    textTransform: 'capitalize',
  },
  glowOrb: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    opacity: 0.3,
    shadowColor: Colors.primary,

    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 5,
    zIndex: -1,
  },
});

export default CustomTabBar;
