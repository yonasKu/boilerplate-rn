// Debug script to check onboarding status
import { checkOnboardingStatus } from './src/services/userService';
import { getAuth } from 'firebase/auth';

async function debugOnboardingStatus() {
  const auth = getAuth();
  const user = auth.currentUser;
  
  if (!user) {
    console.log('No user logged in');
    return;
  }
  
  console.log('=== DEBUG ONBOARDING STATUS ===');
  console.log('Current user UID:', user.uid);
  console.log('Current user email:', user.email);
  
  try {
    const status = await checkOnboardingStatus(user.uid);
    console.log('Onboarding status:', status);
    
    // Let's also manually check children
    const { getUserChildren } = await import('./src/services/userService');
    const children = await getUserChildren(user.uid);
    console.log('Children found:', children.length);
    console.log('Children details:', children);
    
  } catch (error) {
    console.error('Error checking status:', error);
  }
}

// Run debug
debugOnboardingStatus();
