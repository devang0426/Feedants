import React from 'react';
import { NavigationContainer, DefaultTheme, type LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import type { MainTabParamList, RootStackParamList } from './types';
import { ROUTE_TAB, TAB_ROUTE } from './types';
import { HomeScreen } from '../screens/HomeScreen';
import { ExploreScreen } from '../screens/ExploreScreen';
import { CreateScreen } from '../screens/CreateScreen';
import { CompetitionsListScreen } from '../screens/CompetitionsListScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { CompetitionDetailsScreen } from '../screens/CompetitionDetailsScreen';
import { BottomTabBar } from '../components/competition/BottomTabBar';
import { useAuth } from '../auth/AuthProvider';
import { colors } from '../theme';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<MainTabParamList>();

const theme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: colors.background, primary: colors.primary },
};

/** Deep links: feedants://competitions/<slug> opens the details screen directly. */
const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['feedants://', 'https://feedants.com'],
  config: {
    screens: {
      MainTabs: {
        screens: { Home: 'home', Explore: 'explore', Competitions: 'competitions', Profile: 'profile' },
      },
      CompetitionDetails: 'competitions/:idOrSlug',
    },
  },
};

/** Adapts the design's visual tab bar to React Navigation's tab navigator. */
function AppTabBar({ state, navigation }: BottomTabBarProps) {
  const { user } = useAuth();
  const activeRoute = state.routes[state.index]?.name as keyof MainTabParamList;
  return (
    <BottomTabBar
      active={ROUTE_TAB[activeRoute] ?? 'home'}
      avatarUrl={user?.avatarUrl}
      onPress={(tab) => navigation.navigate(TAB_ROUTE[tab])}
    />
  );
}

function MainTabs() {
  return (
    <Tabs.Navigator
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.background } }}
      tabBar={(props) => <AppTabBar {...props} />}
    >
      <Tabs.Screen name="Home" component={HomeScreen} />
      <Tabs.Screen name="Explore" component={ExploreScreen} />
      <Tabs.Screen name="Create" component={CreateScreen} />
      <Tabs.Screen name="Competitions" component={CompetitionsListScreen} />
      <Tabs.Screen name="Profile" component={ProfileScreen} />
    </Tabs.Navigator>
  );
}

export function RootNavigator() {
  return (
    <NavigationContainer theme={theme} linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="CompetitionDetails" component={CompetitionDetailsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
