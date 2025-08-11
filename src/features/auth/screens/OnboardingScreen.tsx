import React, { useState, useRef } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  Dimensions,
  StatusBar,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../../components/Button';
import { useOnboarding } from '@/context/OnboardingContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

// The slides now only contain the images
const slides = [
  {
    id: '1',
    image: require('../../../assets/images/onboarding-1.png'),
    title: 'Welcome To Sproutbook',
    subtitle: 'Easily capture everyday moments and turn them into shareable, lasting memories',
  },
  {
    id: '2',
    image: require('../../../assets/images/onboarding-2.png'),
    title: 'AI Generated Shareable Recaps',
    subtitle: 'Automatically turn your journal entries into weekly and monthly recaps to share with family',
  },
  {
    id: '3',
    image: require('../../../assets/images/onboarding-3.png'),
    title: 'Easily Search for Important Memories',
    subtitle: 'Quickly find specific entries, milestones, or photos with our powerful search feature',
  },
];

import { Animated } from 'react-native';

const OnboardingScreen = () => {
  const { setViewedOnboarding } = useOnboarding();
  const { bottom } = useSafeAreaInsets();
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const ref = useRef<FlatList>(null);
  const router = useRouter();
  const textOpacity = useRef(new Animated.Value(1)).current;

  const updateCurrentSlideIndex = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = e.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(contentOffsetX / width);

    if (currentIndex !== currentSlideIndex) {
      Animated.timing(textOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setCurrentSlideIndex(currentIndex);
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
    }
  };

  const onGetStarted = () => {
    setViewedOnboarding(true);
    // Navigate directly to welcome screen instead of relying on automatic redirect
    router.replace('/(auth)/welcome');
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
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Image Slider in the background */}
      <FlatList
        ref={ref}
        onMomentumScrollEnd={updateCurrentSlideIndex}
        data={slides}
        pagingEnabled
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={{ marginVertical: 20 ,marginBottom:100}}>
            <View style={styles.slideContainer}>
              <Image source={item.image} style={styles.image} resizeMode="contain" />
            </View>
          </View>
        )}
        keyExtractor={(item) => item.id}
        style={styles.flatList}
      />

      {/* Static Text and Footer Overlay */}
      <View style={styles.overlayContainer}>
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.0)', 'rgba(255, 255, 255, 0.9)', 'white']}
          locations={[0, 0.2, 0.6]}
          style={[styles.contentBox, { paddingBottom: bottom > 0 ? bottom : 20 }]}
        >
          <Pagination />
          <Animated.View style={{ opacity: textOpacity, alignItems: 'center' }}>
            <Text style={styles.title}>{slides[currentSlideIndex].title}</Text>
            <Text style={styles.subtitle}>{slides[currentSlideIndex].subtitle}</Text>
          </Animated.View>
          <View style={styles.separator} />
          <Button 
            title="Get Started" 
            onPress={onGetStarted}
            variant="primary"
            size="large"
          />
        </LinearGradient>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    //backgroundColor: '#FFFFFF',
  },
  flatList: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  slideContainer: {
    width: width,
    height: height,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '75%',
    height: '70%',
    resizeMode: 'cover',
    marginBottom:height/2.6,
  },

  overlayContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.55,
    justifyContent: 'flex-end',
  },
  contentBox: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 30,
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    color: '#2F4858',
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: 'Poppins',
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
    marginBottom: 20,
  },
  indicator: {
    height: 8,
    width: 8,
    backgroundColor: '#D3E0DC',
    marginHorizontal: 4,
    borderRadius: 4,
  },
  indicatorActive: {
    backgroundColor: '#5D9275',
  },
  separator: {
    height: 2,
    width: 20,
    backgroundColor: '#E58C8A',
    marginVertical: 10,
  },
});

export default OnboardingScreen;