import React, { useState, useEffect } from 'react';
import { View, Text, Alert, TouchableOpacity, StyleSheet, Image, ScrollView } from 'react-native';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { getAuth, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { useTheme } from '../../ThemeContext';
import SettingsScreen from './HomeDrawer/SettingsScreen';
import AccountScreen from './HomeDrawer/AccountScreen';
import PremiumScreen from './HomeDrawer/PremiumScreen';

const Drawer = createDrawerNavigator();

function CustomDrawerContent(props) {
  const auth = getAuth();
  const { isDarkMode } = useTheme();
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const userRef = doc(getFirestore(), "users", user.uid);
        try {
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setIsPremium(userData.isPremium);
          } else {
            console.log("No such document!");
          }
        } catch (error) {
          console.error("Firestore fetch error:", error);
          Alert.alert("Error", "An error occurred while fetching user data.");
        }
      }
    };
    fetchUserData();
  }, []);

  const handleSignout = () => {
    Alert.alert(
      "Are you sure you want to Sign out",
      "",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          onPress: () => {
            signOut(auth).then(() => {
              props.navigation.replace('GetStarted');
            }).catch((error) => {
              console.error('Signout error:', error);
              Alert.alert("Error", "An error occurred while signing out. Please try again.");
            });
          },
          style: 'destructive'
        }
      ],
      { cancelable: false }
    );
  };

  return (
    <DrawerContentScrollView {...props} style={isDarkMode ? styles.drawerContentDark : styles.drawerContent} scrollEnabled={false}>
      <TouchableOpacity onPress={() => props.navigation.closeDrawer()} style={styles.closeButton}>
        <Image source={isDarkMode ? require('../../Media/Images/close-white.png') : require('../../Media/Images/close.png')} style={{ width: 24, height: 24 }} />
      </TouchableOpacity>
      <View style={styles.drawerItemsContainer}>
        <DrawerItem
          label="Home"
          onPress={() => props.navigation.navigate('Home')}
          labelStyle={[styles.drawerItemLabelLarge, isDarkMode ? styles.drawerItemLabelLargeDark : styles.drawerItemLabelLargeLight, styles.drawerItemSpacing]}
        />
        <DrawerItem
          label="Account"
          onPress={() => props.navigation.navigate('Account')}
          labelStyle={[styles.drawerItemLabelLarge, isDarkMode ? styles.drawerItemLabelLargeDark : styles.drawerItemLabelLargeLight, styles.drawerItemSpacing]}
        />
        <View style={[styles.separator, isDarkMode ? styles.separatorDark : styles.separatorLight]} />
        <DrawerItem
          label="Settings"
          onPress={() => props.navigation.navigate('Settings')}
          labelStyle={[styles.drawerItemLabelSmall, styles.drawerItemLabelSmallGray, styles.drawerItemSpacing]}
        />
        <DrawerItem
          label={isPremium ? "Premium" : "Get Premium"}
          onPress={() => props.navigation.navigate('Premium')}
          labelStyle={[styles.drawerItemLabelSmall, styles.drawerItemLabelSmallGray, { color: '#2C8DFF' }, styles.drawerItemSpacing]}
        />
        <DrawerItem
          label="Sign Out"
          onPress={handleSignout}
          labelStyle={[styles.drawerItemLabelSmall, styles.drawerItemLabelSmallGray, { color: 'red' }, styles.drawerItemSpacing]}
        />
      </View>
      <View style={styles.footerContainer}>
        <Text style={[styles.footerText, isDarkMode && styles.textDark]}>App Developed by Sérgio Santos</Text>
      </View>
    </DrawerContentScrollView>
  );
}

function HomeView({ navigation }) {
  const { isDarkMode } = useTheme();
  const formatDate = (date) => {
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  const [currentDate, setCurrentDate] = useState(formatDate(new Date()));
  const [userEmail, setUserEmail] = useState(null);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setCurrentDate(formatDate(new Date()));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const auth = getAuth();
    const db = getFirestore();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserEmail(user.email);
        const userRef = doc(db, "users", user.uid);
        try {
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            setIsPremium(userDoc.data().isPremium);
          } else {
            console.log("No such document!");
          }
        } catch (error) {
          console.error("Firestore fetch error:", error);
          Alert.alert("Error", "An error occurred while fetching user data.");
        }
      } else {
        setUserEmail('');
        setIsPremium(false);
      }
    });

    return unsubscribe;
  }, []);

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <View style={[styles.headerContainer, isDarkMode && styles.headerContainerDark]}>
        <TouchableOpacity style={[styles.menuButton, isDarkMode && styles.menuButtonDark]} onPress={() => navigation.openDrawer()}>
          <Image source={isDarkMode ? require('../../Media/Images/menu-white.png') : require('../../Media/Images/menu.png')} style={{ width: 32, height: 32 }} />
        </TouchableOpacity>
        <Text style={[styles.header, isDarkMode && styles.headerDark]}>Be Productive!</Text>
      </View>

      <Text style={[styles.time, isDarkMode && styles.textDark]}>{currentTime}</Text>
      <Text style={[styles.date, isDarkMode && styles.textDark]}>{currentDate}</Text>

      <View style={[styles.horizontalLine, isDarkMode && styles.horizontalLineDark]}></View>

      <ScrollView contentContainerStyle={styles.iconContainer}>
        <View style={styles.appIconContainer}>
          <TouchableOpacity
            style={[styles.appIcon, isDarkMode && styles.appIconDark]}
            onPress={() => navigation.navigate('Notes')}>
            <Image source={require('../../Media/Images/Apps/notes.png')} style={styles.appIconImage} />
          </TouchableOpacity>
          <Text style={[styles.appText, isDarkMode && styles.textDark]}>Notes</Text>
        </View>

        <View style={styles.appIconContainer}>
          <TouchableOpacity
            style={[styles.appIcon, isDarkMode && styles.appIconDark]}
            onPress={() => navigation.navigate('Alarms')}>
            <Image source={require('../../Media/Images/Apps/notes.png')} style={styles.appIconImage} />
          </TouchableOpacity>
          <Text style={[styles.appText, isDarkMode && styles.textDark]}>Alarms</Text>
        </View>

        <View style={styles.appIconContainer}>
          <TouchableOpacity
            style={[styles.appIcon, isDarkMode && styles.appIconDark]}
            onPress={() => navigation.navigate('Tasks')}>
            <Image source={require('../../Media/Images/Apps/notes.png')} style={styles.appIconImage} />
          </TouchableOpacity>
          <Text style={[styles.appText, isDarkMode && styles.textDark]}>Tasks</Text>
        </View>

        <View style={styles.appIconContainer}>
          <TouchableOpacity
            style={[styles.appIcon, isDarkMode && styles.appIconDark]}
            onPress={() => navigation.navigate('ShoppingScreen')}>
            <Image source={require('../../Media/Images/Apps/notes.png')} style={styles.appIconImage} />
          </TouchableOpacity>
          <Text style={[styles.appText, isDarkMode && styles.textDark]}>Shopping</Text>
        </View>

        <View style={styles.appIconContainer}>
          <TouchableOpacity
            style={[styles.appIcon, isDarkMode && styles.appIconDark]}
            onPress={() => navigation.navigate('Goals')}>
            <Image source={require('../../Media/Images/Apps/notes.png')} style={styles.appIconImage} />
          </TouchableOpacity>
          <Text style={[styles.appText, isDarkMode && styles.textDark]}>Goals</Text>
        </View>

        <View style={styles.appIconContainer}>
          <TouchableOpacity
            style={[styles.appIcon, isDarkMode && styles.appIconDark]}
            onPress={() => navigation.navigate('ShedulePlanner')}>
            <Image source={require('../../Media/Images/Apps/notes.png')} style={styles.appIconImage} />
          </TouchableOpacity>
          <Text style={[styles.appText, isDarkMode && styles.textDark]}>{`Shedule\nPlanner`}</Text>
        </View>

      </ScrollView>
    </View>
  );
}

const HomeScreen = () => {
  const { isDarkMode } = useTheme();
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={({ route }) => ({
        drawerStyle: isDarkMode ? { backgroundColor: 'black' } : { backgroundColor: 'white' },
        drawerActiveTintColor: isDarkMode ? 'white' : 'black',
        drawerInactiveTintColor: isDarkMode ? 'white' : 'black',
        drawerLabelStyle: {
          fontWeight: '600',
        },
        drawerItemStyle: ({ focused }) => ({
          backgroundColor: focused ? (isDarkMode ? 'grey' : 'lightgrey') : 'transparent',
          borderRadius: 4,
        }),
      })}
    >
      <Drawer.Screen name="Home" component={HomeView} options={{ headerShown: false }} />
      <Drawer.Screen name="Account" component={AccountScreen} options={{ headerShown: false }} />
      <Drawer.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
      <Drawer.Screen name="Premium" component={PremiumScreen} options={{
        headerShown: false,
        drawerActiveBackgroundColor: '#2C8DFF',
        drawerActiveTintColor: 'white',
        drawerLabelStyle: {
          fontWeight: '600',
        }
      }} />
    </Drawer.Navigator>
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
  menuButtonDark: {
    shadowColor: 'white',
  },
  closeButton: {
    position: 'absolute',
    left: 20,
    top: 70,
    zIndex: 10,
  },
  header: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  headerDark: {
    color: 'white',
    textShadowColor: 'rgba(255, 255, 255, 0.24)',
  },
  textDark: {
    color: 'white',
    textShadowColor: 'rgba(255, 255, 255, 0.24)',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  drawerContentDark: {
    backgroundColor: 'black',
  },
  drawerItemsContainer: {
    marginTop: 80, // Add margin top to move the items down
  },
  drawerItemLabelLarge: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  drawerItemLabelLargeDark: {
    color: 'white',
  },
  drawerItemLabelLargeLight: {
    color: 'black',
  },
  drawerItemLabelSmall: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  drawerItemLabelSmallDark: {
    color: 'white',
  },
  drawerItemLabelSmallGray: {
    color: 'gray',
  },
  separator: {
    height: 1,
    marginHorizontal: 10,
    marginVertical: 15,
  },
  separatorDark: {
    backgroundColor: 'white',
  },
  separatorLight: {
    backgroundColor: 'black',
  },
  drawerItemSpacing: {
    marginVertical: -2,
  },
  time: {
    fontSize: 64,
    fontWeight: 'bold',
    marginTop: 20,
  },
  date: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  iconContainer: {
    flexWrap: 'wrap',
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 20,
    paddingTop: 10,
    marginHorizontal: 10,
  },
  appIconContainer: {
    alignItems: 'center',
    marginHorizontal: 15,
    marginBottom: 20,
  },
  appIcon: {
    width: 65,
    height: 65,
    backgroundColor: 'white',
    justifyContent: 'center',
    marginHorizontal: 3.5,
    alignItems: 'center',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 3 },
    shadowOpacity: 0.30,
    shadowRadius: 3,
    elevation: 5,
  },
  appIconDark: {
    backgroundColor: '#333',
    shadowColor: '#fff',
  },
  appIconImage: {
    width: 50,
    height: 50,
  },
  appText: {
    color: '#000',
    fontSize: 15.2,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 13,
  },
  textDark: {
    color: 'white',
  },
  horizontalLine: {
    height: 1,
    backgroundColor: 'black',
    width: '90%',
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 4,
  },
  horizontalLineDark: {
    backgroundColor: 'white',
    shadowColor: 'white',
  },
  footerContainer: {
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    marginTop: 340,
    fontSize: 12,
  },
});

export default HomeScreen;
