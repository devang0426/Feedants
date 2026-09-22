import type { NavigatorScreenParams } from '@react-navigation/native';

export type MainTabParamList = {
  Home: undefined;
  Explore: undefined;
  Create: undefined;
  Competitions: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  CompetitionDetails: { idOrSlug: string };
};

/** Keys used by the visual BottomTabBar, mapped to tab route names. */
export type TabKey = 'home' | 'explore' | 'create' | 'competitions' | 'profile';

export const TAB_ROUTE: Record<TabKey, keyof MainTabParamList> = {
  home: 'Home',
  explore: 'Explore',
  create: 'Create',
  competitions: 'Competitions',
  profile: 'Profile',
};

export const ROUTE_TAB: Record<keyof MainTabParamList, TabKey> = {
  Home: 'home',
  Explore: 'explore',
  Create: 'create',
  Competitions: 'competitions',
  Profile: 'profile',
};
