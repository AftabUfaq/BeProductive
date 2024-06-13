// ShoppingScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, Alert, Image } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { useNavigation } from '@react-navigation/native';

const LISTS_FILE_PATH = `${FileSystem.documentDirectory}shoppingLists.json`;

const ShoppingScreen = () => {
  const [shoppingLists, setShoppingLists] = useState([]);
  const [newListName, setNewListName] = useState('');
  const navigation = useNavigation();

  useEffect(() => {
    loadLists();
  }, []);

  const loadLists = async () => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(LISTS_FILE_PATH);
      if (fileInfo.exists) {
        const listsData = await FileSystem.readAsStringAsync(LISTS_FILE_PATH);
        const lists = JSON.parse(listsData);
        setShoppingLists(lists);
      }
    } catch (error) {
      console.error("Error loading lists:", error);
      Alert.alert("Error", "Failed to load shopping lists.");
    }
  };

  const saveLists = async (lists) => {
    try {
      await FileSystem.writeAsStringAsync(LISTS_FILE_PATH, JSON.stringify(lists));
      setShoppingLists(lists);
    } catch (error) {
      console.error("Error saving lists:", error);
      Alert.alert("Error", "Failed to save shopping lists.");
    }
  };

  const addList = () => {
    if (newListName.trim().length === 0) {
      Alert.alert("Invalid Name", "List name cannot be empty.");
      return;
    }
    const newList = {
      id: Date.now().toString(),
      name: newListName,
      items: []
    };
    saveLists([...shoppingLists, newList]);
    setNewListName('');
  };

  const deleteList = (listId) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this list?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            const updatedLists = shoppingLists.filter(list => list.id !== listId);
            saveLists(updatedLists);
          }
        }
      ],
      { cancelable: false }
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.listItem}>
      <TouchableOpacity 
        onPress={() => navigation.navigate('ListDetails', { listId: item.id })}
      >
        <Text style={styles.listItemText}>{item.name}</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.deleteButton} 
        onPress={() => deleteList(item.id)}
      >
        <Text style={styles.deleteButtonText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Image
            source={require('../../../Media/Images/back.png')}
            style={styles.backIcon}
          />
        </TouchableOpacity>
        <Text style={styles.header}>Shopping Lists</Text>
      </View>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="New list name"
          value={newListName}
          onChangeText={setNewListName}
        />
        <TouchableOpacity 
          style={styles.addButton}
          onPress={addList}
        >
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={shoppingLists}
        renderItem={renderItem}
        keyExtractor={item => item.id}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
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
  header: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginRight: 10,
  },
  addButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  listItemText: {
    fontSize: 18,
  },
  deleteButton: {
    backgroundColor: '#FF5252',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 14,
  },
});

export default ShoppingScreen;
