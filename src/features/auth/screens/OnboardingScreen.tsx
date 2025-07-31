import React, { useState, useRef } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

// The slides now only contain the images
const slides = [
  { id: '1', image: require('../../../assets/images/onboarding-1.png') },
  { id: '2', image: require('../../../assets/images/onboarding-2.png') },
  { id: '3', image: require('../../../assets/images/onboarding-3.png') },
];

const OnboardingScreen = () => {
  const router = useRouter();
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const ref = useRef<FlatList>(null);

  const updateCurrentSlideIndex = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = e.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(contentOffsetX / width);
    setCurrentSlideIndex(currentIndex);
  };

  const onGetStarted = async () => {
    try {
      await AsyncStorage.setItem('@viewedOnboarding', 'true');
      router.replace('/(auth)/signup'); // Navigate to the signup screen
    } catch (e) {
      console.error('Failed to save onboarding status.', e);
    }
  };

  const Pagination = () => (
    <View style={styles.indicatorContainer}>
      {slides.map((_, index) => (
        <View
          key={index}
          style={[
            styles.indicator,
            currentSlideIndex === index && styles.indicatorActive,
          ]}
        />
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Image Slider in the background */}
      <FlatList
        ref={ref}
        onMomentumScrollEnd={updateCurrentSlideIndex}
        data={slides}
        pagingEnabled
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.slideContainer}>
            <Image source={item.image} style={styles.image} />
          </View>
        )}
        keyExtractor={(item) => item.id}
        style={styles.flatList}
      />

      {/* Blurry Overlay */}
      <BlurView style={styles.contentBox} intensity={95} tint="light">
        <Pagination />
        <Text style={styles.title}>{'Welcome\nTo Sproutbook'}</Text>
        <Text style={styles.subtitle}>
          Easily capture everyday moments and turn them into shareable, lasting
          memories
        </Text>
        <TouchableOpacity
          style={styles.getStartedButton}
          onPress={onGetStarted}
        >
          <Text style={styles.getStartedButtonText}>Get Started</Text>
        </TouchableOpacity>
      </BlurView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  flatList: {
    ...StyleSheet.absoluteFillObject,
  },
  slideContainer: {
    width: width,
    height: height,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '70%',
    height: '75%',
    resizeMode: 'contain',
    position: 'absolute',
    top: -height * 0.05, // Move image up slightly
  },
  contentBox: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.38, // Reduce height of the content box
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 30,
    paddingTop: 20,
    paddingBottom: 30,
    alignItems: 'center',
    overflow: 'hidden',
  },
  title: {
    fontSize: 34,
    color: '#2F4858',
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: 'serif',
    lineHeight: 42,
    marginTop: 20, // Pushes content down from the pagination
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#2F4858',
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.8,
    marginBottom: 20,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 'auto', // Pushes indicators to the top of the box
  },
  indicator: {
    height: 8,
    width: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    marginHorizontal: 4,
    borderRadius: 4,
  },
  indicatorActive: {
    backgroundColor: '#5D9275',
  },
  getStartedButton: {
    backgroundColor: '#5D9275',
    paddingVertical: 18,
    width: '100%',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto', // Push button to the bottom of the box
  },
  getStartedButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default OnboardingScreen;