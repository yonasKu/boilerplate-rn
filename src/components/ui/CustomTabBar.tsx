import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';

const CustomTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const { bottom } = useSafeAreaInsets();
  const router = useRouter();
  const [showCreateHint, setShowCreateHint] = useState(false);
  const bounceAnim = useRef(new Animated.Value(0)).current;

  const getIcon = (routeName: string): keyof typeof Feather.glyphMap => {
    switch (routeName) {
      case 'journal':
        return 'home';
      case 'recaps':
        return 'book-open';
      case 'search':
        return 'search';
      default:
        return 'home';
    }
  };

      const visibleRoutes = ['journal', 'recaps', 'search'];

  // Animation for new entry hint
  useEffect(() => {
    // Start bounce animation when component mounts
    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
        { iterations: 3 }
      ).start();
    }, 1500); // Start after 1.5 seconds of app opening
  }, []);

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
                  <Feather name={getIcon(route.name)} size={20} color={isFocused ? '#5D9275' : '#888'} />
                  <Text style={[styles.label, { color: isFocused ? '#5D9275' : '#888' }]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
        </View>

          <View style={styles.newButtonContainer}>
            <Animated.View
              style={[
                styles.newButton,
                {
                  transform: [
                    {
                      translateY: bounceAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -12]
                      })
                    }
                  ]
                }
              ]}
            >
              <TouchableOpacity
                onPress={() => router.push('/new-entry')}
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
    backgroundColor: '#fff',
    borderRadius: 30,
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    marginRight: 10,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    gap: 5,
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
    backgroundColor: '#5D9275',
  },
  newButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  newButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#5D9275',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    gap: 5,
  },
  newButtonText: {
    color: '#fff',
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
});

export default CustomTabBar;
