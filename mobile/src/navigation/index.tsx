import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import { CompetitionsListScreen } from '../screens/CompetitionsListScreen';
import { CompetitionDetailsScreen } from '../screens/CompetitionDetailsScreen';
import { colors } from '../theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

const theme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: colors.background, primary: colors.primary },
};

/** Deep links: feedants://competitions/<slug> opens the details screen directly. */
const linking = {
  prefixes: ['feedants://', 'https://feedants.com'],
  config: {
    screens: {
      CompetitionsList: 'competitions',
      CompetitionDetails: 'competitions/:idOrSlug',
    },
  },
};

export function RootNavigator() {
  return (
    <NavigationContainer theme={theme} linking={linking}>
      <Stack.Navigator
        initialRouteName="CompetitionDetails"
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}
      >
        <Stack.Screen name="CompetitionsList" component={CompetitionsListScreen} />
        <Stack.Screen
          name="CompetitionDetails"
          component={CompetitionDetailsScreen}
          initialParams={{ idOrSlug: 'feedants-classical-dance' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
