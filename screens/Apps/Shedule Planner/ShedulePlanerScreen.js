import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { getAuth, signOut } from 'firebase/auth';

const ShedulePlannerScreen = ({ navigation }) => {
    const auth = getAuth();

    return (
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Image
               source={require('../../../Media/Images/back.png')}
              style={styles.backIcon}
            />
          </TouchableOpacity>
          <Text style={styles.header}>Shedule Planner!</Text>
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
  header: {
    fontSize: 32,
    fontWeight: 'bold',

  },
  headerContainer: {
    width: '100%',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: 70,
    paddingBottom: 20,
    shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.29,
        shadowRadius: 2,
        elevation: 5,
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 70,
    zIndex: 10,
  },
  backIcon: {
    width: 29, // Set the width of the icon
    height: 38, // Set the height of the icon
    resizeMode: 'contain', // This ensures the icon scales nicely within the dimensions
  },
});

export default ShedulePlannerScreen;
