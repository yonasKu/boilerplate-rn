export function mapAuthError(error: any): string {
  if (!error) return 'Something went wrong. Please try again.';
  const code = error?.code || error?.name || '';
  const message = (typeof error?.message === 'string' && error.message) || '';
  const lowerMsg = message.toLowerCase();

  // Firebase Auth codes
  switch (code) {
    case 'auth/user-not-found':
      return 'No account found with this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/invalid-login-credentials':
      return 'The email or password you entered is incorrect.';
    case 'auth/invalid-credential':
      return 'Unable to sign in with those credentials. Please try again.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/missing-email':
      return 'Please enter your email address.';
    case 'auth/missing-password':
      return 'Please enter your password.';
    case 'auth/email-already-in-use':
      return 'This email is already in use. Try logging in instead.';
    case 'auth/weak-password':
      return 'Your password is too weak. Please choose a stronger password.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Contact support if this is unexpected.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection and try again.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
  }

  // Apple Sign In common messages
  if (message.includes('canceled') || message.toLowerCase().includes('cancel')) {
    return 'Sign in was cancelled.';
  }

  // Heuristic mapping based on message content (provider strings often come through message only)
  if (lowerMsg.includes('invalid-login-credentials') || lowerMsg.includes('wrong-password')) {
    return 'The email or password you entered is incorrect.';
  }
  if (lowerMsg.includes('invalid-credential')) {
    return 'Unable to sign in with those credentials. Please try again.';
  }
  if (lowerMsg.includes('user-not-found')) {
    return 'No account found with this email address.';
  }
  if (lowerMsg.includes('invalid-email')) {
    return 'Please enter a valid email address.';
  }

  // Generic fallback
  if (message) {
    // Strip raw provider prefix/suffix like: "Firebase: Error (auth/some-code)."
    const sanitized = message
      .replace(/^Firebase:\s*/i, '')
      .replace(/\s*\(\s*auth\/[^)]+\)\.?$/i, '')
      .trim();
    if (sanitized && !/auth\//i.test(sanitized)) return sanitized;
  }
  return 'Something went wrong. Please try again.';
}

export function validateEmail(value: string): boolean {
  return /\S+@\S+\.\S+/.test(value);
}
