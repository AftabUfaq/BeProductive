// ListDetailsScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, Alert, Image } from 'react-native';
import * as FileSystem from 'expo-file-system';

const LISTS_FILE_PATH = `${FileSystem.documentDirectory}shoppingLists.json`;

const ListDetailsScreen = ({ route, navigation }) => {
  const { listId } = route.params;
  const [list, setList] = useState(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');

  useEffect(() => {
    loadList();
  }, []);

  const loadList = async () => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(LISTS_FILE_PATH);
      if (fileInfo.exists) {
        const listsData = await FileSystem.readAsStringAsync(LISTS_FILE_PATH);
        const lists = JSON.parse(listsData);
        const currentList = lists.find(list => list.id === listId);
        setList(currentList);
      }
    } catch (error) {
      console.error("Error loading list:", error);
      Alert.alert("Error", "Failed to load shopping list.");
    }
  };

  const saveList = async (updatedList) => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(LISTS_FILE_PATH);
      if (fileInfo.exists) {
        const listsData = await FileSystem.readAsStringAsync(LISTS_FILE_PATH);
        let lists = JSON.parse(listsData);
        lists = lists.map(list => list.id === listId ? updatedList : list);
        await FileSystem.writeAsStringAsync(LISTS_FILE_PATH, JSON.stringify(lists));
        setList(updatedList);
      }
    } catch (error) {
      console.error("Error saving list:", error);
      Alert.alert("Error", "Failed to save shopping list.");
    }
  };

  const addItem = () => {
    if (newItemName.trim().length === 0 || newItemQuantity.trim().length === 0 || newItemPrice.trim().length === 0) {
      Alert.alert("Invalid Item", "All fields are required.");
      return;
    }
    const newItem = {
      id: Date.now().toString(),
      name: newItemName,
      quantity: parseInt(newItemQuantity),
      price: parseFloat(newItemPrice)
    };
    const updatedList = { ...list, items: [...list.items, newItem] };
    saveList(updatedList);
    setNewItemName('');
    setNewItemQuantity('');
    setNewItemPrice('');
  };

  const deleteItem = (itemId) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this item?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            const updatedList = { ...list, items: list.items.filter(item => item.id !== itemId) };
            saveList(updatedList);
          }
        }
      ],
      { cancelable: false }
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <Text style={styles.itemText}>{item.name}</Text>
      <Text style={styles.itemText}>Qty: {item.quantity}</Text>
      <Text style={styles.itemText}>Price: ${item.price.toFixed(2)}</Text>
      <TouchableOpacity 
        style={styles.deleteButton} 
        onPress={() => deleteItem(item.id)}
      >
        <Text style={styles.deleteButtonText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  const calculateTotal = () => {
    return list.items.reduce((total, item) => total + (item.quantity * item.price), 0).toFixed(2);
  };

  if (!list) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Image
            source={require('../../../Media/Images/back.png')}
            style={styles.backIcon}
          />
        </TouchableOpacity>
        <Text style={styles.header}>{list.name}</Text>
      </View>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Item name"
          value={newItemName}
          onChangeText={setNewItemName}
        />
        <TextInput
          style={styles.input}
          placeholder="Quantity"
          value={newItemQuantity}
          onChangeText={setNewItemQuantity}
          keyboardType="numeric"
        />
        <TextInput
          style={styles.input}
          placeholder="Price"
          value={newItemPrice}
          onChangeText={setNewItemPrice}
          keyboardType="numeric"
        />
        <TouchableOpacity 
          style={styles.addButton}
          onPress={addItem}
        >
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={list.items}
        renderItem={renderItem}
        keyExtractor={item => item.id}
      />
      <View style={styles.totalContainer}>
        <Text style={styles.totalText}>Total: ${calculateTotal()}</Text>
      </View>
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
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  itemText: {
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
  totalContainer: {
    padding: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
  totalText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ListDetailsScreen;
