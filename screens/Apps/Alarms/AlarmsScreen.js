import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, Alert, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Image, Animated, TouchableWithoutFeedback, Modal, TextInput, Switch
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import AlarmModal from './AlarmModal';

const AlarmsScreen = ({ navigation }) => {
  const [alarms, setAlarms] = useState([]);
  const [categories, setCategories] = useState(['default']);
  const [selectedAlarms, setSelectedAlarms] = useState(new Set());
  const [selectedCategories, setSelectedCategories] = useState(new Set());
  const [menuVisible, setMenuVisible] = useState(false);
  const [mode, setMode] = useState('normal');
  const [isPremium, setIsPremium] = useState(false); // Change based on user premium status
  const [expandedCategory, setExpandedCategory] = useState(new Set());
  const [modalVisible, setModalVisible] = useState(false);
  const [editAlarm, setEditAlarm] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [miniModalVisible, setMiniModalVisible] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const menuAnimation = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    loadAlarms();
    loadCategories();
  }, []);

  useEffect(() => {
    if (menuVisible) {
      Animated.timing(menuAnimation, {
        toValue: 1,
        duration: 0,
        useNativeDriver: true,
      }).start();
    }
  }, [menuVisible]);

  const loadAlarms = async () => {
    try {
      const alarmFiles = await FileSystem.readDirectoryAsync(FileSystem.documentDirectory);
      const alarmFilesJson = alarmFiles.filter((file) => file.startsWith('alarm_') && file.endsWith('.json'));
      const loadedAlarms = await Promise.all(
        alarmFilesJson.map(async (file) => {
          const alarmData = await FileSystem.readAsStringAsync(`${FileSystem.documentDirectory}${file}`);
          const alarm = JSON.parse(alarmData);
          return { ...alarm, id: file.replace('alarm_', '').replace('.json', '') };
        })
      );
      setAlarms(loadedAlarms);
    } catch (e) {
      console.error("Failed to load alarms: ", e);
    }
  };

  const loadCategories = async () => {
    try {
      const categoriesFile = await FileSystem.readAsStringAsync(`${FileSystem.documentDirectory}categories.json`);
      setCategories(JSON.parse(categoriesFile));
    } catch (e) {
      console.error("Failed to load categories: ", e);
    }
  };

  const saveCategory = async (newCategories) => {
    try {
      await FileSystem.writeAsStringAsync(`${FileSystem.documentDirectory}categories.json`, JSON.stringify(newCategories));
      setCategories(newCategories);
    } catch (e) {
      console.error("Failed to save categories: ", e);
    }
  };

  const saveAlarm = async (alarm) => {
    try {
      const alarmId = alarm.id || Date.now().toString();
      await FileSystem.writeAsStringAsync(`${FileSystem.documentDirectory}alarm_${alarmId}.json`, JSON.stringify({ ...alarm, id: alarmId }));
      loadAlarms(); // Reload alarms after saving
    } catch (e) {
      console.error("Failed to save alarm: ", e);
    }
  };

  const deleteAlarm = async (alarmId) => {
    try {
      await FileSystem.deleteAsync(`${FileSystem.documentDirectory}alarm_${alarmId}.json`);
      loadAlarms(); // Reload alarms after deleting
    } catch (e) {
      console.error("Failed to delete alarm: ", e);
    }
  };

  const deleteCategory = async (category) => {
    try {
      const newCategories = categories.filter(cat => cat !== category);
      saveCategory(newCategories);
      const updatedAlarms = alarms.filter(alarm => alarm.category !== category);
      await Promise.all(
        alarms
          .filter(alarm => alarm.category === category)
          .map(alarm => deleteAlarm(alarm.id))
      );
      setAlarms(updatedAlarms);
    } catch (e) {
      console.error("Failed to delete category: ", e);
    }
  };

  const handleAddAlarm = () => {
    if (alarms.length >= 2 && !isPremium) {
      Alert.alert(
        "Limit Reached",
        "Upgrade to premium to add more alarms.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Get Premium", style: "default" }
        ]
      );
    } else {
      setEditAlarm(null);
      setModalVisible(true);
    }
  };

  const cancelChanges = () => {
    setSelectedAlarms(new Set());
    setSelectedCategories(new Set());
    setMode('normal');
  };

  const handleSelectAlarm = (alarmId) => {
    if (mode === 'normal') {
      const alarm = alarms.find(a => a.id === alarmId);
      if (alarm) {
        setEditAlarm(alarm);
        setModalVisible(true);
      }
    } else if (mode === 'delete') {
      const newSet = new Set(selectedAlarms);
      if (newSet.has(alarmId)) {
        newSet.delete(alarmId);
      } else {
        newSet.add(alarmId);
      }
      setSelectedAlarms(newSet);
    }
  };

  const handleSelectCategory = (category) => {
    if (mode === 'delete') {
      const newSet = new Set(selectedCategories);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      setSelectedCategories(newSet);
    }
  };

  const performDelete = () => {
    const alarmIdsToDelete = Array.from(selectedAlarms);
    const categoriesToDelete = Array.from(selectedCategories);
    const itemCount = alarmIdsToDelete.length + categoriesToDelete.length;

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
            await Promise.all(alarmIdsToDelete.map(id => deleteAlarm(id)));
            await Promise.all(categoriesToDelete.map(category => deleteCategory(category)));
            setSelectedAlarms(new Set());
            setSelectedCategories(new Set());
            setMode('normal');
          },
        },
      ],
      { cancelable: false }
    );
  };

  const toggleMenu = () => {
    setMenuVisible(prev => !prev);
  };

  const MenuItem = ({ title, onPress }) => {
    const textStyle = title === "Delete" ? styles.menuItemTextDelete : styles.menuItemText;
    return (
      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => {
          onPress();
          setMenuVisible(false);
        }}
      >
        <Text style={textStyle}>{title}</Text>
      </TouchableOpacity>
    );
  };

  const handleMenuAction = (mode) => {
    if (alarms.length === 0 && categories.length === 1) {
      Alert.alert("No Items Available", `There are no items to ${mode}.`);
      return;
    }
    setMode(mode);
    setMenuVisible(false);
  };

  const renderMenu = () => {
    if (!menuVisible) return null;

    return (
      <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
        <View style={styles.fullScreenOverlay}>
          <Animated.View style={[styles.menu, {
            transform: [{ translateY: menuAnimation.interpolate({ inputRange: [0, 1], outputRange: [-50, 0] }) }],
          }]}>
            <MenuItem title="Add Category" onPress={() => setMiniModalVisible(true)} />
            <MenuItem title="Delete" onPress={() => handleMenuAction('delete')} />
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
    );
  };

  const handleSaveAlarm = (alarm) => {
    saveAlarm(alarm);
    setModalVisible(false);
  };

  const addCategory = () => {
    const newCategories = [...categories, newCategory];
    saveCategory(newCategories);
    setNewCategory('');
    setMiniModalVisible(false);
  };

  const toggleCategory = (category) => {
    const newSet = new Set(expandedCategory);
    if (newSet.has(category)) {
      newSet.delete(category);
    } else {
      newSet.add(category);
    }
    setExpandedCategory(newSet);
  };

  const renderAlarmItem = (alarm) => (
    <TouchableOpacity
      key={alarm.id}
      style={[
        styles.alarmItem,
        selectedAlarms.has(alarm.id) && { backgroundColor: '#e0e0e0' }
      ]}
      onPress={() => handleSelectAlarm(alarm.id)}
    >
      <Text style={styles.alarmText}>{alarm.title}</Text>
      <Text style={styles.alarmTime}>{new Date(alarm.time).toLocaleTimeString()}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        {mode === 'normal' && (
          <>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Image source={require('../../../Media/Images/back.png')} style={styles.backIcon} />
            </TouchableOpacity>
            <Text style={styles.header}>Alarms!</Text>
            <TouchableOpacity onPress={toggleMenu} style={styles.moreButton}>
              <Image source={require('../../../Media/Images/more.png')} style={styles.moreIcon} />
            </TouchableOpacity>
          </>
        )}
        {mode !== 'normal' && (
          <Text style={styles.header}>{mode === 'delete' ? 'Delete!' : 'Pin!'}</Text>
        )}
      </View>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadAlarms} />
        }
      >
        <View style={styles.alarmsContainer}>
          {categories.map(category => (
            <View key={category}>
              <TouchableOpacity onPress={() => toggleCategory(category)}>
                <View style={styles.sectionHeaderContainer}>
                  <Text style={styles.sectionHeader}>{category}</Text>
                  <Image
                    source={expandedCategory.has(category) ? require('../../../Media/Images/expand-arrow-down.png') : require('../../../Media/Images/expand-arrow-up.png')}
                    style={styles.expandIcon}
                  />
                </View>
              </TouchableOpacity>
              {expandedCategory.has(category) && (
                alarms.filter(alarm => alarm.category === category).length === 0 ? (
                  <View style={styles.noAlarmsContainer}>
                    <Text style={styles.noAlarmsText}>No alarms in this category.</Text>
                  </View>
                ) : (
                  alarms.filter(alarm => alarm.category === category).map(alarm => renderAlarmItem(alarm))
                )
              )}
            </View>
          ))}
        </View>
      </ScrollView>
      {mode === 'normal' && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.button}
            onPress={handleAddAlarm}
          >
            <Text style={styles.buttonText}>Create Alarm!</Text>
          </TouchableOpacity>
        </View>
      )}
      {mode === 'delete' && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={cancelChanges}
          >
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={performDelete}
          >
            <Text style={styles.buttonText}>Delete!</Text>
          </TouchableOpacity>
        </View>
      )}
      {menuVisible && renderMenu()}

      <AlarmModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveAlarm}
        alarm={editAlarm}
        categories={categories}
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={miniModalVisible}
        onRequestClose={() => setMiniModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setMiniModalVisible(false)}>
          <View style={styles.centeredView}>
            <View style={styles.miniModalView}>
              <Text style={styles.modalTitle}>Add Category</Text>
              <TextInput
                style={styles.modalText}
                placeholder="Category name"
                value={newCategory}
                onChangeText={setNewCategory}
                maxLength={27}
              />
              <TouchableOpacity
                style={[styles.button, styles.buttonClose]}
                onPress={addCategory}
              >
                <Text style={styles.textStyle}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
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
  noAlarmsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noAlarmsText: {
    fontSize: 18,
    fontWeight: '500',
    color: 'grey',
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
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  alarmsContainer: {
    flexDirection: 'column',
    paddingHorizontal: 30,
  },
  alarmItem: {
    padding: 20,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    shadowOpacity: 0.1,
    elevation: 2,
    marginBottom: 10,
    borderRadius: 25,
    alignItems: 'center',
    height: 120,
    width: '100%',
    justifyContent: 'center',
  },
  alarmText: {
    fontSize: 18,
    fontWeight: '500',
    shadowColor: 'rgba(0, 0, 0, 0.9)',
    textAlign: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 1,
    elevation: 4,
  },
  alarmTime: {
    fontSize: 16,
    color: 'gray',
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
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)"
  },
  miniModalView: {
    width: '80%',
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  modalText: {
    marginBottom: 15,
    textAlign: "center",
    width: '100%',
    borderBottomWidth: 1,
    borderColor: 'gray',
    padding: 10,
    fontSize: 18
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center"
  },
});

export default AlarmsScreen;
