import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
} from "react-native";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [terms, setTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const auth = getAuth();
  const db = getFirestore();

  const [passwordVisibility, setPasswordVisibility] = useState(true);

  const passwordRegex = /^[a-zA-Z0-9@#$%&_-]+$/;

  const handleRegister = () => {
    if (
      !name.trim() ||
      !email.trim() ||
      !password.trim() ||
      !confirmPassword.trim()
    ) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    if (name.trim().length < 2 || name.trim().length > 36) {
      Alert.alert("Error", "Name must be between 2 and 36 characters.");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "The password must be at least 6 characters long.");
      return;
    }

    if (!passwordRegex.test(password)) {
      Alert.alert(
        "Error",
        "Password contains invalid characters. Only alphanumeric and selected special characters are allowed."
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "The passwords do not match. Please try again.");
      return;
    }

    if (!terms) {
      Alert.alert(
        "Error",
        "Please accept the terms and conditions to continue."
      );
      return;
    }

    setLoading(true);

    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredentials) => {
        const user = userCredentials.user;
        return setDoc(doc(db, "users", user.uid), {
          isPremium: false,
          name: name,
        });
      })
      .then(() => {
        setLoading(false);
        // Alert the user of success and then navigate on button press
        Alert.alert("Success", "User created successfully!", [
          {
            text:"OK"
          }
        ]);
      })
      .catch((error) => {
        setLoading(false);
        let errorMessage = "Registration failed. Please try again.";
        switch (error.code) {
          case "auth/email-already-in-use":
            errorMessage =
              "This email is already in use. Please use another email or login.";
            break;
          case "auth/invalid-email":
            errorMessage = "Please use a valid email address.";
            break;
          default:
            errorMessage = error.message;
            break;
        }
        Alert.alert("Error", errorMessage);
      });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>BeProductive!</Text>
      <Text style={styles.title}>Create an account</Text>
      <Text style={styles.subtitle}>Please fill in the following details!</Text>

      <TextInput
        placeholder="Enter your name"
        value={name}
        onChangeText={setName}
        maxLength={36}
        style={styles.input}
      />

      <TextInput
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
        textContentType="emailAddress"
      />

      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Enter password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={passwordVisibility}
          style={styles.input}
          autoCapitalize="none"
          textContentType="newPassword"
          maxLength={25}
        />
        <TouchableOpacity
          style={styles.togglePasswordVisibilityButton}
          onPress={() => setPasswordVisibility(!passwordVisibility)}
        >
          <Text style={styles.togglePasswordVisibilityText}>
            {passwordVisibility ? "Show" : "Hide"}
          </Text>
        </TouchableOpacity>
      </View>

      <TextInput
        placeholder="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        style={styles.input}
        secureTextEntry={true}
        textContentType="newPassword"
        maxLength={25}
      />

      <View style={styles.checkboxContainer}>
        <Switch
          value={terms}
          onValueChange={setTerms}
          trackColor={{ false: "#767577", true: "#2C8DFF" }}
          thumbColor={terms ? "#ffffff" : "#FFFFFF"}
        />
        <Text style={styles.checkboxLabel}>
          I agree to the{" "}
          <Text style={{ textDecorationLine: "underline", color: "blue" }}>
            Terms and Conditions
          </Text>{" "}
          and{" "}
          <Text style={{ textDecorationLine: "underline", color: "blue" }}>
            Privacy Statement
          </Text>
          .
        </Text>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={handleRegister}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Registering..." : "Register!"}
        </Text>
      </TouchableOpacity>

      <View style={styles.signInContainer}>
        <Text style={styles.signInPrompt}>Already have an account?</Text>
        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
          <Text style={styles.signInText}> Sign in</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  header: {
    fontSize: 33,
    fontWeight: "bold",
    marginBottom: 50,
    textShadowColor: "rgba(0, 0, 0, 0.24)", // Black color with 75% opacity
    textShadowOffset: { width: 0, height: 3 }, // Horizontal and vertical offset
    textShadowRadius: 3, // Blur radius
    elevation: 4, // Android shadow
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 3, // Adjust as needed
    alignSelf: "center",
    textShadowColor: "rgba(0, 0, 0, 0.18)",
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 2,
    elevation: 4,
  },
  subtitle: {
    fontSize: 20, // Smaller than the title
    color: "#5E5E5E", // Adjust the color as needed
    alignSelf: "center",
    textShadowColor: "rgba(0, 0, 0, 0.22)",
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 2,
    marginBottom: 33, // Adjust as needed
    elevation: 4,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    // Add some horizontal space around the switch
    paddingLeft: 10, // You can adjust this value as needed
    paddingRight: 10, // You can adjust this value as needed
  },
  checkbox: {
    marginRight: 10,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 16,
    marginLeft: 10,
  },
  button: {
    width: "75%",
    padding: 20,
    backgroundColor: "black", // Use your button color
    borderRadius: 100,
    alignItems: "center",
    marginTop: 30,
  },
  buttonText: {
    color: "white",
    fontSize: 20,
    fontWeight: "700",
  },
  signInText: {
    fontSize: 16,
    color: "#0000FF", // This will make "Sign up" blue
  },
  signUpPrompt: {
    fontSize: 16,
    color: "#929292", // This will make the prompt grey
  },
  input: {
    width: "100%",
    padding: 20,
    paddingRight: 40, // Add padding to make space for the button inside the input
    borderWidth: 1,
    borderColor: "grey",
    borderRadius: 20,
    marginBottom: 15,
  },
  togglePasswordVisibilityButton: {
    position: "absolute",
    right: 10, // Adjusted to align with the increased padding on the input
    height: "100%",
    paddingVertical: 22.9,
    padding: 10,
  },
  togglePasswordVisibilityText: {
    color: "#2C2626", // iOS system blue color or choose your own
    fontWeight: "bold",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  signInContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  signInText: {
    fontSize: 18,
    color: "#1668C8",
  },
  signInPrompt: {
    fontSize: 18,
    color: "#929292",
  },
});

export default RegisterScreen;
