import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, TextInput, Alert, ActivityIndicator, Animated, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '../../../ThemeContext';
import { getAuth, signOut, updateEmail, updatePassword, updateProfile } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const AccountScreen = ({ navigation }) => {
  const auth = getAuth();
  const { isDarkMode } = useTheme();
  const db = getFirestore();
  const user = auth.currentUser;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      if (user) {
        const userRef = doc(db, "users", user.uid);
        try {
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            setIsPremium(userDoc.data().isPremium);
            setName(userDoc.data().name || '');
            setEmail(user.email || '');
          }
        } catch (error) {
          console.error("Firestore fetch error:", error);
          Alert.alert("Error", "An error occurred while fetching user data.");
        }
      }
      setLoading(false);
    };

    fetchUserData();
  }, [user]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleSaveChanges = async () => {
    if (password && password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      if (name !== user.displayName) {
        await updateProfile(user, { displayName: name });
      }

      if (email !== user.email) {
        await updateEmail(user, email);
      }

      if (password) {
        await updatePassword(user, password);
      }

      Alert.alert("Success", "Your account has been updated.");
      setErrorMessage('');
    } catch (error) {
      console.error("Error updating profile:", error);
      setErrorMessage("An error occurred while updating your profile.");
    }
    setLoading(false);
  };

  const handleSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          onPress: () => {
            signOut(auth).catch((error) => {
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
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <View style={[styles.headerContainer, isDarkMode && styles.headerContainerDark]}>
        <TouchableOpacity style={styles.menuButton} onPress={() => navigation.openDrawer()}>
          <Image source={isDarkMode ? require('../../../Media/Images/menu-white.png') : require('../../../Media/Images/menu.png')} style={{ width: 32, height: 32 }} />
        </TouchableOpacity>
        <Text style={[styles.header, isDarkMode && styles.textDark]}>Account!</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <Animated.View style={[styles.formContainer, isDarkMode && styles.formContainerDark, { opacity: fadeAnim }]}>
          <Text style={[styles.label, isDarkMode && styles.textDark]}>Name</Text>
          <TextInput
            style={[styles.input, isDarkMode && styles.inputDark]}
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
            placeholderTextColor={isDarkMode ? 'lightgrey' : 'grey'}
          />

          <Text style={[styles.label, isDarkMode && styles.textDark]}>Email</Text>
          <TextInput
            style={[styles.input, isDarkMode && styles.inputDark]}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            placeholder="Enter your email"
            placeholderTextColor={isDarkMode ? 'lightgrey' : 'grey'}
          />

          <Text style={[styles.label, isDarkMode && styles.textDark]}>Password</Text>
          <TextInput
            style={[styles.input, isDarkMode && styles.inputDark]}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Enter new password"
            placeholderTextColor={isDarkMode ? 'lightgrey' : 'grey'}
          />

          <Text style={[styles.label, isDarkMode && styles.textDark]}>Confirm Password</Text>
          <TextInput
            style={[styles.input, isDarkMode && styles.inputDark]}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            placeholder="Confirm new password"
            placeholderTextColor={isDarkMode ? 'lightgrey' : 'grey'}
          />

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          {loading ? (
            <ActivityIndicator size="large" color="#2196F3" />
          ) : (
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveChanges}>
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          )}

          <View style={styles.statusContainer}>
            <Text style={[styles.premiumStatus, isDarkMode && styles.textDark]}>
              {isPremium ? 'Premium User' : 'Non Premium User'}
            </Text>
          </View>

          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Text style={styles.signOutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
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
    paddingBottom: 10, // Reduced space
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  formContainer: {
    width: '90%',
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
  },
  formContainerDark: {
    backgroundColor: 'black',
  },
  label: {
    fontSize: 18,
    marginBottom: 5,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  inputDark: {
    borderColor: 'white',
    color: 'white',
    backgroundColor: '#000',
  },
  errorText: {
    color: 'red',
    marginBottom: 20,
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    alignItems: 'center',
    borderRadius: 10,
    marginTop: 20,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
  },
  statusContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  premiumStatus: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  signOutButton: {
    backgroundColor: 'red',
    padding: 15,
    alignItems: 'center',
    borderRadius: 10,
    marginTop: 20,
  },
  signOutButtonText: {
    color: 'white',
    fontSize: 16,
  },
});

export default AccountScreen;
