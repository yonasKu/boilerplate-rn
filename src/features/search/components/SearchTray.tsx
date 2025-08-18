import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/theme';

const recentSearches = ['Teddy bear', 'Bath time', 'Reading'];
const suggestions = ['First smile', 'First laugh', 'Sleep'];

interface SearchTrayProps {
  onSuggestionPress: (text: string) => void;
}

const SearchTray: React.FC<SearchTrayProps> = ({ onSuggestionPress }) => {
  return (
    <ScrollView style={styles.trayContainer}>
      <Text style={styles.title}>Search</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recents</Text>
        <View style={styles.tagsContainer}>
          {recentSearches.map((item, index) => (
            <TouchableOpacity key={index} style={styles.recentTag} onPress={() => onSuggestionPress(item)}>
              <Text style={styles.recentTagText}>{item}</Text>
              <Ionicons name="close" size={16} color={Colors.darkGrey} />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Suggestions</Text>
        <View style={styles.suggestionsContainer}>
          <View style={styles.suggestionTags}>
            {suggestions.map((item, index) => (
              <TouchableOpacity key={index} style={styles.suggestionTag} onPress={() => onSuggestionPress(item)}>
                <Text style={styles.suggestionTagText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Image source={{ uri: 'https://i.imgur.com/S8W7O4g.jpeg' }} style={styles.suggestionImage} />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  trayContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 30,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 15,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  recentTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.offWhite,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 8,
  },
  recentTagText: {
    fontSize: 15,
    color: Colors.darkGrey,
  },
  suggestionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  suggestionTags: {
    flex: 1,
    gap: 12,
  },
  suggestionTag: {
    backgroundColor: Colors.offWhite,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  suggestionTagText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.darkGrey,
  },
  suggestionImage: {
    width: 100,
    height: 120,
    borderRadius: 10,
    marginLeft: 20,
  },
});

export default SearchTray;
