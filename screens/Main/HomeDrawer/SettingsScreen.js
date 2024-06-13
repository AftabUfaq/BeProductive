import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch, Image, Alert } from 'react-native';
import { getAuth, signOut } from 'firebase/auth';
import { useTheme } from '../../../ThemeContext';
import * as FileSystem from 'expo-file-system';

const SETTINGS_FILE_PATH = `${FileSystem.documentDirectory}settings.json`;

const SettingsScreen = ({ navigation }) => {
  const auth = getAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const [darkMode, setDarkMode] = useState(isDarkMode);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const fileInfo = await FileSystem.getInfoAsync(SETTINGS_FILE_PATH);
        if (fileInfo.exists) {
          const settingsData = await FileSystem.readAsStringAsync(SETTINGS_FILE_PATH);
          const settings = JSON.parse(settingsData);
          setDarkMode(settings.isDarkMode);
          if (settings.isDarkMode !== isDarkMode) {
            toggleTheme();
          }
        }
      } catch (error) {
        console.error("Error loading settings:", error);
        Alert.alert("Error", "Failed to load settings.");
      }
    };

    loadSettings();
  }, []);

  useEffect(() => {
    const saveSettings = async () => {
      try {
        const settings = { isDarkMode: darkMode };
        await FileSystem.writeAsStringAsync(SETTINGS_FILE_PATH, JSON.stringify(settings));
      } catch (error) {
        console.error("Error saving settings:", error);
        Alert.alert("Error", "Failed to save settings.");
      }
    };

    saveSettings();
  }, [darkMode]);

  const handleToggleTheme = () => {
    setDarkMode(!darkMode);
    toggleTheme();
  };

  return (
    <View style={[styles.container, darkMode && styles.containerDark]}>
      <View style={[styles.headerContainer, darkMode && styles.headerContainerDark]}>
        <TouchableOpacity style={styles.menuButton} onPress={() => navigation.openDrawer()}>
          <Image source={darkMode ? require('../../../Media/Images/menu-white.png') : require('../../../Media/Images/menu.png')} style={{ width: 32, height: 32 }} />
        </TouchableOpacity>
        <Text style={[styles.header, darkMode && styles.textDark]}>Settings!</Text>
      </View>
      <View style={styles.switchContainer}>
        <Text style={[styles.switchLabel, darkMode && styles.textDark]}>Dark Mode</Text>
        <Switch
          value={darkMode}
          onValueChange={handleToggleTheme}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'white',
  },
  containerDark: {
    backgroundColor: 'black',
  },
  headerContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingTop: 70,
    paddingBottom: 20,
    paddingHorizontal: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.29,
    shadowRadius: 2,
    elevation: 5,
  },
  headerContainerDark: {
    shadowColor: 'white',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.29,
    shadowRadius: 2,
  },
  menuButton: {
    position: 'absolute',
    left: 20,
    top: 73,
    zIndex: 10,
  },
  header: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  textDark: {
    color: 'white',
    textShadowColor: 'rgba(255, 255, 255, 0.24)',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '80%',
    marginTop: 20,
  },
  switchLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default SettingsScreen;
