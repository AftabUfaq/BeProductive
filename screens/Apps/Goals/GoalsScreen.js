import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Alert, StyleSheet, TouchableOpacity, FlatList, Image, Animated, TouchableWithoutFeedback, RefreshControl } from 'react-native';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, query, where, onSnapshot, updateDoc, doc, getDoc, deleteDoc, setDoc } from 'firebase/firestore';
import * as FileSystem from 'expo-file-system';

const FILE_PATH = `${FileSystem.documentDirectory}goals.json`;

const GoalsScreen = ({ navigation }) => {
  const [cloudGoals, setCloudGoals] = useState([]);
  const [localGoals, setLocalGoals] = useState([]);
  const [isPremium, setIsPremium] = useState(false);
  const [cloudExpanded, setCloudExpanded] = useState(false);
  const [localExpanded, setLocalExpanded] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedGoals, setSelectedGoals] = useState(new Set());
  const [menuVisible, setMenuVisible] = useState(false);
  const [mode, setMode] = useState('normal');
  const menuAnimation = useRef(new Animated.Value(-100)).current;
  const auth = getAuth();
  const db = getFirestore();
  const user = auth.currentUser;

  useEffect(() => {
    if (user) {
      const userRef = doc(db, "users", user.uid);
      getDoc(userRef).then(async (docSnap) => {
        if (docSnap.exists()) {
          const userIsPremium = docSnap.data().isPremium;
          setIsPremium(userIsPremium);

          if (userIsPremium) {
            const goalsRef = collection(db, "goals");
            const q = query(goalsRef, where("userId", "==", user.uid));
            const unsubscribe = onSnapshot(q, (querySnapshot) => {
              const fetchedCloudGoals = [];
              querySnapshot.forEach((doc) => {
                const goal = { ...doc.data(), id: doc.id };
                fetchedCloudGoals.push(goal);
              });
              fetchedCloudGoals.sort((a, b) => new Date(b.date) - new Date(a.date));
              setCloudGoals(fetchedCloudGoals);
            }, (error) => {
              console.error("Error fetching cloud goals: ", error);
              Alert.alert("Error", "Failed to fetch cloud goals.");
            });
            return () => unsubscribe();
          }
        } else {
          console.error("No such user document!");
        }
      }).catch((error) => {
        console.error("Error getting user document: ", error);
        Alert.alert("Error", "Failed to get user information.");
      });
    }

    fetchLocalGoals();
  }, [user]);

  const fetchLocalGoals = async () => {
    try {
      const goalFiles = await FileSystem.readDirectoryAsync(FileSystem.documentDirectory);
      const goalFilesJson = goalFiles.filter((file) => file.endsWith('.json'));
      const goals = await Promise.all(
        goalFilesJson.map(async (file) => {
          const goalData = await FileSystem.readAsStringAsync(`${FileSystem.documentDirectory}${file}`);
          const goal = JSON.parse(goalData);
          return { ...goal, id: file.replace('.json', '') };
        })
      );
      goals.sort((a, b) => new Date(b.date) - new Date(a.date));
      setLocalGoals(goals);
    } catch (e) {
      console.error("Failed to fetch local goals: ", e);
    }
  };

  const saveGoals = async (goals) => {
    try {
      const user = auth.currentUser;
      if (user) {
        if (isPremium) {
          const userGoalsRef = doc(db, 'users', user.uid, 'data', 'goals');
          await setDoc(userGoalsRef, { goals });
        } else {
          await FileSystem.writeAsStringAsync(FILE_PATH, JSON.stringify(goals));
        }
        setGoals(goals);
      }
    } catch (error) {
      console.error('Failed to save goals:', error);
      Alert.alert('Error', 'Failed to save goals.');
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    fetchLocalGoals();
    setRefreshing(false);
  }, [user]);

  const toggleMenu = () => {
    setMenuVisible(prev => !prev);
  };

  const handleMenuAction = (mode) => {
    setMode(mode);
    setMenuVisible(false);
  };

  const togglePinGoal = async (goalId, currentlyPinned, isCloud) => {
    const pinnedGoalsCount = [...cloudGoals, ...localGoals].filter(goal => goal.pinned && goal.id !== goalId).length;

    if (currentlyPinned || pinnedGoalsCount < 2) {
      if (isCloud) {
        const goalRef = doc(db, "goals", goalId);
        try {
          await updateDoc(goalRef, {
            pinned: !currentlyPinned
          });

          setCloudGoals(prevGoals => {
            const updatedGoals = prevGoals.map(goal => {
              if (goal.id === goalId) {
                return { ...goal, pinned: !currentlyPinned };
              }
              return goal;
            });

            updatedGoals.sort((a, b) => new Date(b.date) - new Date(a.date));
            return updatedGoals;
          });
        } catch (error) {
          console.error("Error updating goal: ", error);
          Alert.alert("Error", "An error occurred while updating the pin status.");
        }
      } else {
        try {
          const updatedGoals = localGoals.map(goal => {
            if (goal.id === goalId) {
              return { ...goal, pinned: !currentlyPinned };
            }
            return goal;
          });

          updatedGoals.sort((a, b) => new Date(b.date) - new Date(a.date));

          const goalPath = `${FileSystem.documentDirectory}${goalId}.json`;
          await FileSystem.writeAsStringAsync(goalPath, JSON.stringify(updatedGoals.find(goal => goal.id === goalId)));

          setLocalGoals(updatedGoals);
        } catch (error) {
          console.error("Error updating goal: ", error);
          Alert.alert("Error", "An error occurred while updating the pin status.");
        }
      }
    } else {
      Alert.alert("Pin Limit", "You already reached the maximum number of pinned goals.");
    }
  };

  const deleteGoalById = async (goalId) => {
    try {
      const goalRef = doc(db, "goals", goalId);
      await deleteDoc(goalRef);
    } catch (error) {
      console.error("Error deleting document: ", error);
    }
  };

  const deleteGoals = async (goalIds) => {
    const localGoalsToKeep = localGoals.filter(goal => !goalIds.includes(goal.id));
    setLocalGoals(localGoalsToKeep);

    const cloudGoalIds = goalIds.filter(goalId => cloudGoals.some(goal => goal.id === goalId));
    await Promise.all(cloudGoalIds.map(goalId => deleteGoalById(goalId)));

    await Promise.all(goalIds.map(async (goalId) => {
      const goalPath = `${FileSystem.documentDirectory}${goalId}.json`;
      try {
        await FileSystem.deleteAsync(goalPath, { idempotent: true });
      } catch (error) {
        console.error("Error deleting local goal file: ", error);
      }
    }));
  };

  const performDelete = async () => {
    const goalIdsToDelete = Array.from(selectedGoals);
    const itemCount = goalIdsToDelete.length;

    if (itemCount === 0) {
      Alert.alert("No Goals Selected", "You have not selected any goals to delete.");
      return;
    }

    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete these ${itemCount} items?`,
      [
        {
          text: 'Cancel',
          onPress: () => console.log('Deletion cancelled'),
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteGoals(goalIdsToDelete);
              setCloudGoals(prevGoals => prevGoals.filter(goal => !selectedGoals.has(goal.id)));
              setLocalGoals(prevGoals => prevGoals.filter(goal => !selectedGoals.has(goal.id)));
              setSelectedGoals(new Set());
              setMode('normal');
            } catch (error) {
              console.error("Error deleting goals: ", error);
              Alert.alert("Error", "An error occurred while deleting the goals.");
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  const performPin = () => {
    selectedGoals.forEach(goalId => {
      const goal = [...cloudGoals, ...localGoals].find(g => g.id === goalId);
      if (goal) {
        togglePinGoal(goalId, !goal.pinned, cloudGoals.some(g => g.id === goalId));
      }
    });
    setMode('normal');
    setSelectedGoals(new Set());
  };

  const renderGoal = ({ item }) => {
    const now = new Date();
    const goalTime = new Date(item.date);
    const timeDiff = item.isCounter ? now - goalTime : goalTime - now;
    const isPastGoal = timeDiff < 0;
    const timeInSeconds = Math.abs(timeDiff) / 1000;
    const years = Math.floor(timeInSeconds / (365.25 * 24 * 60 * 60));
    const months = Math.floor((timeInSeconds % (365.25 * 24 * 60 * 60)) / (30.44 * 24 * 60 * 60));
    const days = Math.floor((timeInSeconds % (30.44 * 24 * 60 * 60)) / (24 * 60 * 60));
    const hours = Math.floor((timeInSeconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((timeInSeconds % (60 * 60)) / 60);
    const seconds = Math.floor(timeInSeconds % 60);

    return (
      <TouchableOpacity
        style={styles.goalContainer}
        onPress={() => {
          if (mode === 'normal') {
            navigation.navigate('GoalDetails', { goal: item });
          } else if (mode === 'delete') {
            handleSelectGoal(item.id);
          } else if (mode === 'pin') {
            togglePinGoal(item.id, item.pinned, cloudGoals.some(g => g.id === item.id));
          }
        }}
        onLongPress={() => handleSelectGoal(item.id)}
      >
        {item.pinned && (
          <Image
            source={require('../../../Media/Images/pinned.png')}
            style={styles.pinIcon}
          />
        )}
        <Text style={styles.goalTitle}>{item.title}</Text>
        <Text style={styles.goalTime}>
          {years}y {months}m {days}d {hours}h {minutes}m {seconds}s
        </Text>
        {!item.isCounter && isPastGoal && <Text style={styles.completedText}>Completed</Text>}
      </TouchableOpacity>
    );
  };

  const handleSelectGoal = (goalId) => {
    const newSet = new Set(selectedGoals);
    if (newSet.has(goalId)) {
      newSet.delete(goalId);
    } else {
      newSet.add(goalId);
    }
    setSelectedGoals(newSet);
  };

  const renderMenu = () => {
    if (!menuVisible) return null;

    return (
      <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
        <View style={styles.fullScreenOverlay}>
          <Animated.View style={[styles.menu, {
            transform: [{ translateY: menuAnimation.interpolate({ inputRange: [0, 1], outputRange: [-50, 0] }) }],
          }]}>
            <TouchableOpacity onPress={() => handleMenuAction('pin')} style={styles.menuItem}>
              <Text style={styles.menuItemText}>Pin</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('GoalDetails', { goal: null })} style={styles.menuItem}>
              <Text style={styles.menuItemText}>Create Goal</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleMenuAction('delete')} style={styles.menuItem}>
              <Text style={styles.menuItemTextDelete}>Delete</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Image source={require('../../../Media/Images/back.png')} style={styles.backIcon} />
        </TouchableOpacity>
        <Text style={styles.header}>Goals!</Text>
        <TouchableOpacity onPress={toggleMenu} style={styles.moreButton}>
          <Image source={require('../../../Media/Images/more.png')} style={styles.moreIcon} />
        </TouchableOpacity>
      </View>
      <FlatList
        data={cloudExpanded ? cloudGoals : localGoals}
        renderItem={renderGoal}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.noGoalsContainer}>
            <Text style={styles.noGoalsText}>No goals created yet.</Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
      {mode === 'delete' && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={() => setMode('normal')}
          >
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={performDelete}
          >
            <Text style={styles.buttonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
      {mode === 'pin' && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.pinButton]}
            onPress={performPin}
          >
            <Text style={styles.buttonText}>Confirm</Text>
          </TouchableOpacity>
        </View>
      )}
      {menuVisible && renderMenu()}
      {mode === 'normal' && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('GoalDetails', { goal: null })}
          >
            <Text style={styles.buttonText}>Create Goal!</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    fontSize: 32,
    fontWeight: 'bold',
    elevation: 5,
  },
  headerContainer: {
    width: '100%',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: 70,
    paddingBottom: 20,
    backgroundColor: 'white',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    borderBottomWidth: 0,
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 70,
    zIndex: 10,
  },
  backIcon: {
    width: 29,
    height: 38,
    resizeMode: 'contain',
  },
  moreButton: {
    position: 'absolute',
    right: 20,
    top: 70,
    zIndex: 10,
  },
  moreIcon: {
    width: 23,
    height: 42,
    resizeMode: 'contain',
  },
  pinIcon: {
    width: 20,
    height: 20,
    position: 'absolute',
    top: 5,
    right: 5,
    resizeMode: 'contain',
  },
  goalsContainer: {
    flexDirection: 'column',
    paddingHorizontal: 30,
  },
  goalContainer: {
    padding: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
    marginBottom: 10,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  goalTime: {
    fontSize: 16,
  },
  completedText: {
    color: 'green',
    marginTop: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    marginTop: 25,
  },
  sectionHeader: {
    fontSize: 22,
    fontWeight: 'bold',
    marginRight: 5,
  },
  expandIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
  noGoalsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noGoalsText: {
    fontSize: 18,
    fontWeight: '500',
    color: 'grey',
  },
  footer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
    paddingHorizontal: 10,
  },
  cancelButton: {
    width: '40%',
    padding: 22,
    backgroundColor: 'black',
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.24)',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    shadowOpacity: 0.75,
    elevation: 4,
  },
  deleteButton: {
    backgroundColor: '#FF5252',
    width: '40%',
    padding: 22,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.24)',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    shadowOpacity: 0.75,
    elevation: 4,
  },
  pinButton: {
    backgroundColor: '#2196F3',
    width: '40%',
    padding: 22,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.24)',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    shadowOpacity: 0.75,
    elevation: 4,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  button: {
    width: '50%',
    padding: 22,
    backgroundColor: 'black',
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.24)',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    shadowOpacity: 0.75,
    elevation: 4,
  },
  menu: {
    position: 'absolute',
    right: 5,
    top: 115,
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 13,
    padding: 10,
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  menuItem: {
    padding: 10,
  },
  menuItemText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  menuItemTextDelete: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF0000',
  },
  fullScreenOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'flex-end',
  },
});

export default GoalsScreen;
