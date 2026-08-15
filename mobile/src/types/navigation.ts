export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  Main: undefined;
  AddGrocery: undefined;
  GroceryDetails: { itemId: string };
  EditGrocery: { itemId: string };
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  DashboardTab: undefined;
  InventoryTab: undefined;
  ShoppingListTab: undefined;
  AnalyticsTab: undefined;
  ProfileTab: undefined;
};
