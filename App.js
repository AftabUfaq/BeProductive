import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ThemeProvider, useTheme } from './ThemeContext'; // Adjust the path as necessary
import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';

// Import your screens
import LoadingScreen from './screens/LoadingScreen';
import RegisterScreen from './screens/Auth/RegisterScreen';
import LoginScreen from './screens/Auth/LoginScreen';
import HomeScreen from './screens/Main/HomeScreen';
import GetStarted from './screens/Auth/GetStartedScreen';
import SettingsScreen from './screens/Main/HomeDrawer/SettingsScreen';
import AccountScreen from './screens/Main/HomeDrawer/AccountScreen';
import PremiumScreen from './screens/Main/HomeDrawer/PremiumScreen';
import NotesScreen from './screens/Apps/Notes/NotesScreen';
import NotesChangeScreen from './screens/Apps/Notes/NotesChangeScreen';
import TasksScreen from './screens/Apps/Tasks/TasksScreen.js';
import ShoppingScreen from './screens/Apps/Shopping/ShoppingScreen.js';
import ListDetailsScreen from './screens/Apps/Shopping/ListDetailsScreen';
import ItemDetailsScreen from './screens/Apps/Shopping/ItemDetailsScreen';
import AlarmsScreen from './screens/Apps/Alarms/AlarmsScreen.js';
import GoalsScreen from './screens/Apps/Goals/GoalsScreen.js';
import ShedulePlannerScreen from './screens/Apps/Shedule Planner/ShedulePlanerScreen';
import GoalDetailsScreen from './screens/Apps/Goals/GoalDetailsScreen';

const Stack = createStackNavigator();
const SETTINGS_FILE_PATH = `${FileSystem.documentDirectory}settings.json`;

const AppContent = () => {
  const [loading, setLoading] = useState(true);
  const { isDarkMode, toggleTheme } = useTheme();

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const fileInfo = await FileSystem.getInfoAsync(SETTINGS_FILE_PATH);
        if (fileInfo.exists) {
          const settingsData = await FileSystem.readAsStringAsync(SETTINGS_FILE_PATH);
          const settings = JSON.parse(settingsData);
          if (settings.isDarkMode !== isDarkMode) {
            toggleTheme();
          }
        }
      } catch (error) {
        console.error("Error loading settings:", error);
        Alert.alert("Error", "Failed to load settings.");
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  if (loading) {
    return null; // or a loading spinner
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="LoadingScreen">
        <Stack.Screen 
          name="LoadingScreen" 
          component={LoadingScreen} 
          options={{ headerShown: false, gestureEnabled: false }}
        />
        <Stack.Screen 
          name="GetStarted" 
          component={GetStarted} 
          options={{ headerShown: false, gestureEnabled: false }}
        />
        <Stack.Screen 
          name="Register" 
          component={RegisterScreen} 
          options={{ headerShown: false, gestureEnabled: false }} 
        />
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false, gestureEnabled: false }} 
        />
        <Stack.Screen 
          name="HomeScreen" 
          component={HomeScreen} 
          options={{ headerShown: false, gestureEnabled: false }} 
        />
        <Stack.Screen
          name="Profile"
          component={AccountScreen}
          options={{ headerShown: false, gestureEnabled: false }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ headerShown: false, gestureEnabled: false }}
        />
        <Stack.Screen
          name="Premium"
          component={PremiumScreen}
          options={{ headerShown: false, gestureEnabled: false }}
        />
        <Stack.Screen
          name="Notes"
          component={NotesScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="NotesChange"
          component={NotesChangeScreen}
          options={{ headerShown: false, gestureEnabled: false }}
        />
        <Stack.Screen
          name="Tasks"
          component={TasksScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ShoppingScreen"
          component={ShoppingScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ListDetails"
          component={ListDetailsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ItemDetails"
          component={ItemDetailsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Alarms"
          component={AlarmsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Goals"
          component={GoalsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="GoalDetails"
          component={GoalDetailsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ShedulePlanner"
          component={ShedulePlannerScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const App = () => (
  <ThemeProvider>
    <AppContent />
  </ThemeProvider>
);

export default App;
