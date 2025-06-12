import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { RootStackParamList, MainTabParamList } from './types';
import { NewOrderScreen } from '../screens/NewOrderScreen';
import { OrdersScreen } from '../screens/OrdersScreen';
import { CashierScreen } from '../screens/CashierScreen';
import { ReportsScreen } from '../screens/ReportsScreen';
import { InventoryScreen } from '../screens/InventoryScreen';
import Ionicons from '@expo/vector-icons/Ionicons';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'add-circle';

          switch (route.name) {
            case 'NewOrder':
              iconName = 'add-circle';
              break;
            case 'Orders':
              iconName = 'receipt';
              break;
            case 'Cashier':
              iconName = 'cash';
              break;
            case 'Reports':
              iconName = 'stats-chart';
              break;
            case 'Inventory':
              iconName = 'cube';
              break;
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="NewOrder" component={NewOrderScreen} options={{ title: 'Yeni Sipariş' }} />
      <Tab.Screen name="Orders" component={OrdersScreen} options={{ title: 'Siparişler' }} />
      <Tab.Screen name="Cashier" component={CashierScreen} options={{ title: 'Kasa' }} />
      <Tab.Screen name="Reports" component={ReportsScreen} options={{ title: 'Raporlar' }} />
      <Tab.Screen name="Inventory" component={InventoryScreen} options={{ title: 'Stok' }} />
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={MainTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}; 