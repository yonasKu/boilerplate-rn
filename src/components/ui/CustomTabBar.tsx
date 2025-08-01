import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const CustomTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const { bottom } = useSafeAreaInsets();

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

    return (
    <View style={[styles.container, { paddingBottom: bottom }]}>
      <View style={styles.mainContainer}>
        <View style={styles.tabBar}>
            {state.routes.filter(r => r.name !== 'new' && r.name !== 'settings').map((route, index) => {
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

          <TouchableOpacity
            onPress={() => navigation.navigate('new')}
            style={styles.newButtonContainer}
          >
            <View style={styles.newButton}>
              <Feather name="edit" size={20} color="#fff" />
              <Text style={styles.newButtonText}>New</Text>
            </View>
          </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 10,
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
  label: {
    fontSize: 12,
    marginTop: 4,
    textTransform: 'capitalize',
  },
});

export default CustomTabBar;
