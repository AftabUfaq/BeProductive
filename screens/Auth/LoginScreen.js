import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Switch, Alert } from 'react-native';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisibility, setPasswordVisibility] = useState(true);
  const [stayLogged, setStayLogged] = useState(false);
  
  const auth = getAuth();

  const handleLogin = () => {
    // Check if email or password fields are empty
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Both email and password fields must be filled.');
      return;
    }

    signInWithEmailAndPassword(auth, email, password)
      .then(() => {
        navigation.navigate('HomeScreen');
      })
      .catch(error => {
        switch (error.code) {
          case 'auth/invalid-email':
            Alert.alert("Authentication Error", "The email address is invalid.");
            break;
          case 'auth/user-disabled':
            Alert.alert("Authentication Error", "This account has been disabled.");
            break;
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
            Alert.alert("Authentication Error", "The email or password is incorrect. Please try again.");
            break;
            case 'auth/too-many-requests':
            Alert.alert("Authentication Error", "You've made too many login attempts in a short period. Please wait a moment before trying again.");
            break;
          default:
            Alert.alert("Authentication Error", error.message);
        }
      });
  };
  


  return (
    <View style={styles.container}>
      <Text style={styles.header}>BeProductive!</Text>
      <Text style={styles.title}>Sign in</Text>
      <Text style={styles.subtitle}>Please fill in the following details!</Text>

      <View style={styles.inputContainer}>
      <TextInput
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
        textContentType="emailAddress"
      />
      </View>
      

      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Enter password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={passwordVisibility}
          style={styles.input}
          maxLength={25} 
        />
        <TouchableOpacity 
          style={styles.togglePasswordVisibilityButton}
          onPress={() => setPasswordVisibility(!passwordVisibility)}
        >
          <Text style={styles.togglePasswordVisibilityText}>
            {passwordVisibility ? 'Show' : 'Hide'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.checkboxContainer}>  
        <Switch
          value={stayLogged}
          onValueChange={setStayLogged}
          trackColor={{ false: "#767577", true: "#2C8DFF" }}
          thumbColor={stayLogged ? "#ffffff" : "#FFFFFF"}
        />
        <Text style={styles.checkboxLabel}>Keep me logged in next time! </Text>
      </View>
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login!</Text>
      </TouchableOpacity>
      <View style={styles.signUpContainer}>
        <Text style={styles.signUpPrompt}>
          Don't have an account?
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.signUpText}> Sign up</Text> 
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={() => navigation.navigate('HomeScreen')}>
          <Text>Home</Text> 
        </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 33,
    fontWeight: 'bold',
    marginBottom: 50,
    textShadowColor: 'rgba(0, 0, 0, 0.24)', // Black color with 75% opacity
    textShadowOffset: { width: 0, height: 3 }, // Horizontal and vertical offset
    textShadowRadius: 3, // Blur radius
    elevation: 4, // Android shadow
  },
  title: {
    fontSize: 28,
  fontWeight: 'bold',
  marginBottom: 3, // Adjust as needed
  alignSelf: 'center',
  textShadowColor: 'rgba(0, 0, 0, 0.18)',
  textShadowOffset: { width: 0, height: 3 },
  textShadowRadius: 2,
  elevation: 4,
  },
  subtitle: {
    fontSize: 20, // Smaller than the title
    color: '#5E5E5E', // Adjust the color as needed
    alignSelf: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.22)',
  textShadowOffset: { width: 0, height: 3 },
  textShadowRadius: 2,
    marginBottom: 33, // Adjust as needed
    elevation: 4,
  },  
  input: {
    width: '100%',
    padding: 15,
    paddingRight: 60, // Increased to ensure "Show" / "Hide" doesn't overlap the text
    borderWidth: 1,
    borderColor: 'grey',
    borderRadius: 20,
  },
  passwordContainer: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 15,
  },
  button: {
    width: '75%',
    padding: 20,
    backgroundColor: 'black', // Use your button color
    borderRadius: 100,
    alignItems: 'center',
    marginTop: 30,
  },
  buttonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 17,
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15,
  },
  signUpText: {
    fontSize: 18,
    color: '#1668C8',
  },
  signUpPrompt: {
    fontSize: 18,
    color: '#929292',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 15, // Increased space between inputs
  },
  input: {
    width: '100%',
    padding: 20,
    paddingRight: 40, // Add padding to make space for the button inside the input
    borderWidth: 1,
    borderColor: 'grey',
    borderRadius: 20,
    fontSize: 17,
  },
  togglePasswordVisibilityButton: {
    position: 'absolute',
    right: 10, // Adjusted to align with the increased padding on the input
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  togglePasswordVisibilityText: {
    color: '#2C2626', // iOS system blue color or choose your own
    fontWeight: 'bold',
  },
  passwordResetButton: {
    // Adicione seu estilo aqui, por exemplo:
    marginTop: 15,
    padding: 10
  },
});

export default LoginScreen;