import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OnboardingContextType {
  viewedOnboarding: boolean;
  setViewedOnboarding: (viewed: boolean) => void;
  isLoading: boolean;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider = ({ children }: { children: ReactNode }) => {
  const [viewedOnboarding, setViewedOnboardingState] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      setIsLoading(true);
      try {
        const value = await AsyncStorage.getItem('@viewedOnboarding');
        if (value !== null) {
          setViewedOnboardingState(JSON.parse(value));
        }
      } catch (error) {
        console.error("Error reading onboarding status from AsyncStorage", error);
        setViewedOnboardingState(false); // Default to showing onboarding on error
      } finally {
        setIsLoading(false);
      }
    };
    checkOnboardingStatus();
  }, []);

  const setViewedOnboarding = async (viewed: boolean) => {
    try {
      await AsyncStorage.setItem('@viewedOnboarding', JSON.stringify(viewed));
      setViewedOnboardingState(viewed);
    } catch (error) {
      console.error("Error saving onboarding status to AsyncStorage", error);
    }
  };

  return (
    <OnboardingContext.Provider value={{ viewedOnboarding, setViewedOnboarding, isLoading }}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};
