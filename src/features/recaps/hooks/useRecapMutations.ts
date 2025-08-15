import { useState } from 'react';
import { RecapService, CreateRecapData } from '../../../services/aiRecapService';

export const useRecapMutations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createRecap = async (data: CreateRecapData) => {
    setLoading(true);
    setError(null);
    try {
      const recapId = await RecapService.createRecap(data);
      return recapId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create recap';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateRecap = async (
    recapId: string,
    updates: {
      aiGenerated?: { title: string; summary: string; keyMoments: string[] };
      media?: { highlightPhotos: string[] };
      status?: 'generating' | 'completed' | 'failed';
    }
  ) => {
    setLoading(true);
    setError(null);
    try {
      await RecapService.updateRecap(recapId, updates);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update recap';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteRecap = async (recapId: string) => {
    setLoading(true);
    setError(null);
    try {
      await RecapService.deleteRecap(recapId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete recap';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    createRecap,
    updateRecap,
    deleteRecap,
    loading,
    error,
  };
};
