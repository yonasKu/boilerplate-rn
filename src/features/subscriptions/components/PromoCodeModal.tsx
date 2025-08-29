import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors } from '../../../theme/colors';
import { ReferralService } from '../../../services/referralService';

interface PromoCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (reward: any) => void;
}

export const PromoCodeModal: React.FC<PromoCodeModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRedeem = async () => {
    if (!code.trim()) {
      setError('Please enter a promo code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const trimmed = code.trim().toUpperCase();
      console.log('[PromoCodeModal] redeem:start', { code: trimmed });

      const res = await ReferralService.redeemPromoCode(trimmed);
      console.log('[PromoCodeModal] redeem:success', res);

      onSuccess?.(res);
      setCode('');
      onClose();
    } catch (err) {
      console.error('[PromoCodeModal] redeem:error', err);
      const message = (err as any)?.message || 'Failed to redeem code. Please try again.';
      // Normalize common callable errors
      if (typeof message === 'string') {
        if (message.toLowerCase().includes('already-exists')) {
          setError('This code has already been redeemed.');
        } else if (message.toLowerCase().includes('invalid') || message.toLowerCase().includes('expired') || message.toLowerCase().includes('failed-precondition')) {
          setError('Invalid or expired promo code');
        } else if (message.toLowerCase().includes('unauthenticated')) {
          setError('Please sign in to redeem a code');
        } else {
          setError('Failed to redeem code. Please try again.');
        }
      } else {
        setError('Failed to redeem code. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCode('');
    setError('');
    onClose();
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* <View style={styles.handle} /> */}
          <Text style={styles.title}>Redeem Promo Code</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Enter promo code"
            value={code}
            onChangeText={(t) => setCode(t)}
            autoCapitalize="characters"
            autoCorrect={false}
            placeholderTextColor={Colors.mediumGrey}
          />

          {error ? (
            <Text style={styles.error}>{error}</Text>
          ) : null}

          <TouchableOpacity
            style={[styles.button, styles.primaryButton, (loading || !code.trim()) && styles.disabledButton]}
            onPress={handleRedeem}
            disabled={loading || !code.trim()}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.primaryButtonText}>Redeem Code</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleClose}
            disabled={loading}
          >
            <Text style={styles.secondaryButtonText}>Cancel</Text>
          </TouchableOpacity>

          {loading && (
            <View style={styles.loading}>
              <ActivityIndicator size="small" />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    alignItems: 'stretch',
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    width: '100%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.lightGrey,
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: Colors.black,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.lightGrey,
    backgroundColor: Colors.lightPink,
    borderRadius: 25,
    padding: 15,
    marginBottom: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  error: {
    color: 'red',
    marginBottom: 12,
    textAlign: 'center',
  },
  button: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 50,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: Colors.white,
  },
  secondaryButtonText: {
    color: Colors.primary,
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  disabledButton: {
    opacity: 0.6,
  },
  loading: {
    marginTop: 12,
    alignItems: 'center',
  },
});
