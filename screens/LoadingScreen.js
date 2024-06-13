import React, { useEffect, useRef } from 'react';
import { Text, View, StyleSheet, Animated, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

const LoadingScreen = () => {
    const navigation = useNavigation();
    const widthAnim = useRef(new Animated.Value(0)).current;  // This will manage the width of the animated bar

    useEffect(() => {
        const auth = getAuth();

        const duration = 2000; // Total duration for the animation (adjust as needed)

        // Start the loading animation
        Animated.timing(widthAnim, {
            toValue: 1,
            duration: duration,
            useNativeDriver: false  // 'width' cannot be animated using the native driver
        }).start();

        // Set a timeout to change screen at the end of the animation
        const timer = setTimeout(() => {
            onAuthStateChanged(auth, user => {
                if (user) {
                    navigation.replace('HomeScreen'); // Navigate to HomeScreen if user is logged in
                } else {
                    navigation.replace('GetStarted'); // Navigate to GetStarted if no user is logged in
                }
            });
        }, duration); // Change screen when the animation finishes

        return () => {
            clearTimeout(timer); // Clear the timer on component unmount
            widthAnim.setValue(0);  // Reset animation
        };
    }, [navigation]);

    const fullWidth = Dimensions.get('window').width * 0.8;  // Calculate 80% of screen width

    return (
        <View style={styles.container}>
            <Text style={styles.text}>BeProductive!</Text>
            <View style={styles.loadingBarBackground}>
                <Animated.View style={[styles.loadingBar, {
                    width: widthAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, fullWidth]  // Animate width from 0 to full width of the background
                    }),
                }]} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    text: {
        color: 'white',
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 20,
        textShadowColor: 'rgba(255, 255, 255, 0.24)',
        textShadowOffset: { width: 0, height: 4 },
        textShadowRadius: 6,
    },
    loadingBarBackground: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        height: 7.5,
        width: '80%',
        borderRadius: 5,
        overflow: 'hidden',
    },
    loadingBar: {
        height: 7.5,
        backgroundColor: 'white',
        borderRadius: 5,
    },
});

export default LoadingScreen;
