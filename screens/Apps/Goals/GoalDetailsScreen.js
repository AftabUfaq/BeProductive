import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Switch } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as FileSystem from 'expo-file-system';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

const FILE_PATH = `${FileSystem.documentDirectory}goals.json`;

const GoalDetailsScreen = ({ route, navigation }) => {
  const { goal } = route.params || {};
  const [title, setTitle] = useState(goal ? goal.title : '');
  const [goalDate, setGoalDate] = useState(goal ? new Date(goal.date) : new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isCounter, setIsCounter] = useState(goal ? goal.isCounter : true);
  const auth = getAuth();
  const db = getFirestore();

  const saveGoals = async (goals) => {
    try {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const isPremium = userDoc.data().isPremium;
          if (isPremium) {
            const userGoalsRef = doc(db, 'users', user.uid, 'data', 'goals');
            await setDoc(userGoalsRef, { goals });
          } else {
            await FileSystem.writeAsStringAsync(FILE_PATH, JSON.stringify(goals));
          }
        }
      }
    } catch (error) {
      console.error('Failed to save goals:', error);
      Alert.alert('Error', 'Failed to save goals.');
    }
  };

  const handleSave = async () => {
    if (title.trim().length === 0) {
      Alert.alert('Invalid Title', 'Title cannot be empty.');
      return;
    }

    const newGoal = {
      id: goal ? goal.id : Date.now().toString(),
      title,
      date: goalDate.toISOString(),
      isCounter,
      isCompleted: false,
    };

    try {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const isPremium = userDoc.data().isPremium;
          let goals = [];
          if (isPremium) {
            const goalsDoc = await getDoc(doc(db, 'users', user.uid, 'data', 'goals'));
            if (goalsDoc.exists()) {
              goals = goalsDoc.data().goals;
            }
          } else {
            const goalsData = await FileSystem.readAsStringAsync(FILE_PATH);
            if (goalsData) {
              goals = JSON.parse(goalsData);
            }
          }

          const updatedGoals = goal
            ? goals.map(g => (g.id === newGoal.id ? newGoal : g))
            : [...goals, newGoal];
          saveGoals(updatedGoals);
          navigation.goBack();
        }
      }
    } catch (error) {
      console.error('Failed to save goal:', error);
      Alert.alert('Error', 'Failed to save goal.');
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Goal title"
        value={title}
        onChangeText={setTitle}
      />
      <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateButton}>
        <Text style={styles.dateButtonText}>Select Date</Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={goalDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            const currentDate = selectedDate || goalDate;
            setShowDatePicker(false);
            setGoalDate(currentDate);
          }}
        />
      )}
      <View style={styles.switchContainer}>
        <Text style={styles.switchLabel}>Counter</Text>
        <Switch
          value={isCounter}
          onValueChange={setIsCounter}
        />
      </View>
      <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
        <Text style={styles.saveButtonText}>Save Goal</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
  },
  input: {
    borderBottomWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 20,
  },
  dateButton: {
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 20,
  },
  dateButtonText: {
    color: 'white',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  switchLabel: {
    marginRight: 10,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
  },
});

export default GoalDetailsScreen;
