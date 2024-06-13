import React, { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useTheme } from '../../../ThemeContext';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, updateDoc, getDoc } from 'firebase/firestore';

const PremiumScreen = ({ navigation }) => {
  const auth = getAuth();
  const db = getFirestore();
  const { isDarkMode } = useTheme();
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    const fetchPremiumStatus = async () => {
      const userRef = doc(db, "users", auth.currentUser.uid);
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        setIsPremium(docSnap.data().isPremium);
      }
    };

    fetchPremiumStatus();
  }, []);

  const togglePremiumStatus = async () => {
    const newStatus = !isPremium;
    const userRef = doc(db, "users", auth.currentUser.uid);
    await updateDoc(userRef, {
      isPremium: newStatus
    });
    setIsPremium(newStatus);
  };

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <View style={[styles.headerContainer, isDarkMode && styles.headerContainerDark]}>
        <TouchableOpacity style={styles.menuButton} onPress={() => navigation.openDrawer()}>
          <Image source={isDarkMode ? require('../../../Media/Images/menu-white.png') : require('../../../Media/Images/menu.png')} style={{ width: 32, height: 32 }} />
        </TouchableOpacity>
        <Text style={[styles.header, isDarkMode && styles.textDark]}>Premium!</Text>
      </View>
      <Text style={[styles.title, isDarkMode && styles.textDark]}>Premium Status</Text>
      <Switch
        trackColor={{ false: "#767577", true: "#81b0ff" }}
        thumbColor={isPremium ? "#f5dd4b" : "#f4f3f4"}
        ios_backgroundColor="#3e3e3e"
        onValueChange={togglePremiumStatus}
        value={isPremium}
      />
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
  title: {
    fontSize: 18,
    marginTop: 20,
  },
  textDark: {
    color: 'white',
    textShadowColor: 'rgba(255, 255, 255, 0.24)',
  },
});

export default PremiumScreen;
