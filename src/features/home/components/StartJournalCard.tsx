import React from 'react';
import { useRouter } from 'expo-router';
import ActionCallout from '@/components/ui/ActionCallout';
import { Colors } from '@/theme';

const StartJournalCard: React.FC = () => {
  const router = useRouter();
  return (
    <ActionCallout
      title="Start your journal"
      description="Take 30 seconds now to create memories for a lifetime."
      ctaLabel="Add first memory"
      onPress={() => router.push('/(main)/new-entry')}
      dateBadge={new Date()}
      backgroundColor={Colors.lightPink2}
    />
  );
};

export default StartJournalCard;
