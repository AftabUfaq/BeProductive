import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, Alert, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Image, Animated, TouchableWithoutFeedback, Modal, TextInput, Switch
} from 'react-native';
import { getAuth } from 'firebase/auth';
import { db } from '../../../firebaseConfig';
import { collection, query, where, onSnapshot, updateDoc, doc, getDoc, deleteDoc, getDocs, writeBatch, addDoc } from 'firebase/firestore';
import * as FileSystem from 'expo-file-system';

const NotesScreen = ({ navigation, route }) => {
  const [cloudNotes, setCloudNotes] = useState([]);
  const [localNotes, setLocalNotes] = useState([]);
  const [selectedNotes, setSelectedNotes] = useState(new Set());
  const [menuVisible, setMenuVisible] = useState(false);
  const [mode, setMode] = useState('normal');
  const [isPremium, setIsPremium] = useState(false);
  const [cloudExpanded, setCloudExpanded] = useState(false);
  const [localExpanded, setLocalExpanded] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editNote, setEditNote] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [isCloud, setIsCloud] = useState(false);
  const menuAnimation = useRef(new Animated.Value(-100)).current;
  const auth = getAuth();
  const user = auth.currentUser;
  const [tempPinnedNotes, setTempPinnedNotes] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (route.params?.refresh) {
      onRefresh();
    }
  }, [route.params?.refresh]);

  useEffect(() => {
    if (user) {
      const userRef = doc(db, "users", user.uid);
      getDoc(userRef).then(async (docSnap) => {
        if (docSnap.exists()) {
          const userIsPremium = docSnap.data().isPremium;
          setIsPremium(userIsPremium);

          if (!userIsPremium) {
            await unpinAllNotes();
          }

          const notesRef = collection(db, "notes");
          const q = query(notesRef, where("userId", "==", user.uid));
          const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const fetchedCloudNotes = [];
            querySnapshot.forEach((doc) => {
              const note = { ...doc.data(), id: doc.id };
              fetchedCloudNotes.push(note);
            });
            fetchedCloudNotes.sort((a, b) => {
              if (a.pinned && !b.pinned) return -1;
              if (!a.pinned && b.pinned) return 1;
              return b.timestamp.toDate() - a.timestamp.toDate();
            });
            setCloudNotes(fetchedCloudNotes);
          }, (error) => {
            console.error("Error fetching cloud notes: ", error);
            Alert.alert("Error", "Failed to fetch cloud notes.");
          });
          return () => unsubscribe();
        } else {
          console.error("No such user document!");
        }
      }).catch((error) => {
        console.error("Error getting user document: ", error);
        Alert.alert("Error", "Failed to get user information.");
      });
    }

    fetchLocalNotes();
  }, [user]);

  const fetchLocalNotes = async () => {
    try {
      const noteFiles = await FileSystem.readDirectoryAsync(FileSystem.documentDirectory);
      const noteFilesJson = noteFiles.filter((file) => file.endsWith('.json'));
      const notes = await Promise.all(
        noteFilesJson.map(async (file) => {
          const noteData = await FileSystem.readAsStringAsync(`${FileSystem.documentDirectory}${file}`);
          const note = JSON.parse(noteData);
          return { ...note, id: file.replace('.json', '') };
        })
      );
      notes.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.timestamp) - new Date(a.timestamp);
      });
      setLocalNotes(notes);
    } catch (e) {
      console.error("Failed to fetch local notes: ", e);
    }
  };

  useEffect(() => {
    if (menuVisible) {
      Animated.timing(menuAnimation, {
        toValue: 1,
        duration: 0,
        useNativeDriver: true,
      }).start();
    }
  }, [menuVisible]);

  const unpinAllNotes = async () => {
    const notesRef = collection(db, "notes");
    const q = query(notesRef, where("userId", "==", user.uid), where("pinned", "==", true));
    const querySnapshot = await getDocs(q);

    const batch = writeBatch(db);
    querySnapshot.forEach((doc) => {
      batch.update(doc.ref, { pinned: false });
    });
    await batch.commit();
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);

    if (user) {
      try {
        // Atualiza notas na nuvem
        const notesRef = collection(db, "notes");
        const q = query(notesRef, where("userId", "==", user.uid));
        const cloudSnapshot = await getDocs(q);
        const fetchedCloudNotes = [];
        cloudSnapshot.forEach((doc) => {
          const note = { ...doc.data(), id: doc.id };
          fetchedCloudNotes.push(note);
        });
        fetchedCloudNotes.sort((a, b) => {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          return b.timestamp.toDate() - a.timestamp.toDate();
        });
        setCloudNotes(fetchedCloudNotes);

        // Atualiza notas locais
        const noteFiles = await FileSystem.readDirectoryAsync(FileSystem.documentDirectory);
        const noteFilesJson = noteFiles.filter((file) => file.endsWith('.json'));
        const fetchedLocalNotes = await Promise.all(
          noteFilesJson.map(async (file) => {
            const noteData = await FileSystem.readAsStringAsync(`${FileSystem.documentDirectory}${file}`);
            const note = JSON.parse(noteData);
            return { ...note, id: file.replace('.json', '') };
          })
        );
        fetchedLocalNotes.sort((a, b) => {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          return new Date(b.timestamp) - new Date(a.timestamp);
        });
        setLocalNotes(fetchedLocalNotes);

      } catch (error) {
        console.error("Error refreshing notes: ", error);
        Alert.alert("Error", "Failed to refresh notes.");
      } finally {
        setRefreshing(false);
      }
    } else {
      fetchLocalNotes();
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (mode === 'pin' || mode === 'delete' || mode === 'edit') {
      setTempPinnedNotes(new Map([...cloudNotes, ...localNotes].map(note => [note.id, note.pinned])));
    } else {
      setTempPinnedNotes(null);
    }
  }, [mode, cloudNotes, localNotes]);

  const handleAddNote = () => {
    if (cloudNotes.length + localNotes.length >= 2 && !isPremium) {
      Alert.alert(
        "Limit Reached",
        "Upgrade to premium to add more notes.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Get Premium", style: "default" }
        ]
      );
    } else {
      navigation.navigate('NotesChange');
    }
  };

  const cancelChanges = () => {
    if (tempPinnedNotes) {
      setCloudNotes(prevNotes => prevNotes.map(note => ({
        ...note,
        pinned: tempPinnedNotes.get(note.id)
      })));
      setLocalNotes(prevNotes => prevNotes.map(note => ({
        ...note,
        pinned: tempPinnedNotes.get(note.id)
      })));
    }
    setSelectedNotes(new Set());
    setMode('normal');
  };

  const togglePinNote = async (noteId, currentlyPinned, isCloud) => {
    if (!isPremium) {
      Alert.alert(
        "Premium Feature",
        "Upgrade to premium to use the pin feature.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Get Premium", style: "default" }
        ]
      );
      return;
    }

    const pinnedNotesCount = [...cloudNotes, ...localNotes].filter(note => note.pinned && note.id !== noteId).length;

    if (currentlyPinned || pinnedNotesCount < 2) {
      if (isCloud) {
        const noteRef = doc(db, "notes", noteId);
        try {
          await updateDoc(noteRef, {
            pinned: !currentlyPinned
          });

          setCloudNotes(prevNotes => {
            const updatedNotes = prevNotes.map(note => {
              if (note.id === noteId) {
                return { ...note, pinned: !currentlyPinned };
              }
              return note;
            });

            updatedNotes.sort((a, b) => {
              if (a.pinned && !b.pinned) return -1;
              if (!a.pinned && b.pinned) return 1;
              return b.timestamp.toDate() - a.timestamp.toDate();
            });
            return updatedNotes;
          });
        } catch (error) {
          console.error("Error updating note: ", error);
          Alert.alert("Error", "An error occurred while updating the pin status.");
        }
      } else {
        try {
          const updatedNotes = localNotes.map(note => {
            if (note.id === noteId) {
              return { ...note, pinned: !currentlyPinned };
            }
            return note;
          });

          updatedNotes.sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return new Date(b.timestamp) - new Date(a.timestamp);
          });

          const notePath = `${FileSystem.documentDirectory}${noteId}.json`;
          await FileSystem.writeAsStringAsync(notePath, JSON.stringify(updatedNotes.find(note => note.id === noteId)));

          setLocalNotes(updatedNotes);
        } catch (error) {
          console.error("Error updating note: ", error);
          Alert.alert("Error", "An error occurred while updating the pin status.");
        }
      }
    } else {
      Alert.alert("Pin Limit", "You already reached the maximum number of pinned notes.");
    }
  };

  const deleteNoteById = async (noteId) => {
    try {
      const noteRef = doc(db, "notes", noteId);
      await deleteDoc(noteRef);
    } catch (error) {
      console.error("Error deleting document: ", error);
    }
  };

  const deleteNotes = async (noteIds) => {
    const localNotesToKeep = localNotes.filter(note => !noteIds.includes(note.id));
    setLocalNotes(localNotesToKeep);

    const cloudNoteIds = noteIds.filter(noteId => cloudNotes.some(note => note.id === noteId));
    await Promise.all(cloudNoteIds.map(noteId => deleteNoteById(noteId)));

    await Promise.all(noteIds.map(async (noteId) => {
      const notePath = `${FileSystem.documentDirectory}${noteId}.json`;
      try {
        await FileSystem.deleteAsync(notePath, { idempotent: true }); // Set idempotent option to true
      } catch (error) {
        console.error("Error deleting local note file: ", error);
      }
    }));
  };

  const handleSelectNote = (noteId) => {
    if (mode === 'normal') {
      navigation.navigate('NotesChange', { noteId });
    } else if (mode === 'delete') {
      const newSet = new Set(selectedNotes);
      if (newSet.has(noteId)) {
        newSet.delete(noteId);
      } else {
        newSet.add(noteId);
      }
      setSelectedNotes(newSet);
    } else if (mode === 'pin') {
      const note = [...cloudNotes, ...localNotes].find(n => n.id === noteId);
      if (note) {
        togglePinNote(noteId, note.pinned, cloudNotes.some(n => n.id === noteId));
      }
    } else if (mode === 'edit') {
      const note = [...cloudNotes, ...localNotes].find(n => n.id === noteId);
      if (note) {
        handleLongPress(note);
      }
    }
  };

  const performDelete = async () => {
    const noteIdsToDelete = Array.from(selectedNotes);
    const itemCount = noteIdsToDelete.length;

    if (itemCount === 0) {
      Alert.alert("No Notes Selected", "You have not selected any notes to delete.");
      return;
    }

    const allSelectedAreCloud = noteIdsToDelete.every(noteId => cloudNotes.some(note => note.id === noteId));
    const allSelectedAreLocal = noteIdsToDelete.every(noteId => localNotes.some(note => note.id === noteId));

    if (!allSelectedAreCloud && !allSelectedAreLocal) {
      Alert.alert("Selection Error", "You can only delete notes from one specific section at a time.");
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
              await deleteNotes(noteIdsToDelete);
              setCloudNotes(prevNotes => prevNotes.filter(note => !selectedNotes.has(note.id)));
              setLocalNotes(prevNotes => prevNotes.filter(note => !selectedNotes.has(note.id)));
              setSelectedNotes(new Set());
              setMode('normal');
            } catch (error) {
              console.error("Error deleting notes: ", error);
              Alert.alert("Error", "An error occurred while deleting the notes.");
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  const performPin = () => {
    selectedNotes.forEach(noteId => {
      const note = [...cloudNotes, ...localNotes].find(n => n.id === noteId);
      if (note) {
        togglePinNote(noteId, !note.pinned, cloudNotes.some(n => n.id === noteId));
      }
    });
    setMode('normal');
    setSelectedNotes(new Set());
  };

  const handleSelectNoteForDelete = (noteId) => {
    const newSet = new Set(selectedNotes);
    if (newSet.has(noteId)) {
      newSet.delete(noteId);
    } else {
      newSet.add(noteId);
    }
    setSelectedNotes(newSet);
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
    if (cloudNotes.length === 0 && localNotes.length === 0) {
      Alert.alert("No Notes Available", `There are no notes to ${mode}.`);
      return;
    }
    setMode(mode);
    setMenuVisible(false);
  };

  const handleCreateFolder = () => {
    if (isPremium) {
      Alert.alert("Coming Soon", "This feature is coming soon!");
    } else {
      Alert.alert("Coming Soon", "This feature is coming soon for premium users!");
    }
  };

  const renderMenu = () => {
    if (!menuVisible) return null;

    return (
      <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
        <View style={styles.fullScreenOverlay}>
          <Animated.View style={[styles.menu, {
            transform: [{ translateY: menuAnimation.interpolate({ inputRange: [0, 1], outputRange: [-50, 0] }) }],
          }]}>
            <MenuItem title="Pin" onPress={() => handleMenuAction('pin')} />
            <MenuItem title="Edit" onPress={() => handleMenuAction('edit')} />
            <MenuItem title="Create Folder" onPress={handleCreateFolder} />
            <MenuItem title="Delete" onPress={() => handleMenuAction('delete')} />
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
    );
  };

  const handleLongPress = (note) => {
    setEditNote(note);
    setEditTitle(note.title);
    setIsCloud(note.cloud);
    setModalVisible(true);
  };

  const handleSaveNote = async () => {
    if (editTitle.length < 3 || editTitle.length > 27) {
      Alert.alert("Invalid Title", "Title must be between 3 and 27 characters.");
      return;
    }

    try {
      if (isCloud) {
        if (!isPremium) {
          Alert.alert("Premium Feature", "Upgrade to premium to use the cloud feature.");
          setIsCloud(false);
          return;
        }

        if (!editNote.cloud) {
          await FileSystem.deleteAsync(`${FileSystem.documentDirectory}${editNote.id}.json`);
          const newNote = { ...editNote, title: editTitle, cloud: true };
          const addedDocRef = await addDoc(collection(db, "notes"), {
            ...newNote,
            userId: user.uid,
            timestamp: new Date()
          });
          newNote.id = addedDocRef.id;
          setCloudNotes([...cloudNotes, newNote]);
          Alert.alert("Note updated", "Note has been moved from Local Device to BeProductive Cloud.");
        } else {
          await updateDoc(doc(db, "notes", editNote.id), { title: editTitle });
          setCloudNotes(cloudNotes.map(note => note.id === editNote.id ? { ...note, title: editTitle } : note));
          Alert.alert("Note updated", "Note has been updated in BeProductive Cloud.");
        }
      } else {
        if (editNote.cloud) {
          await deleteDoc(doc(db, "notes", editNote.id));
          const newNote = {
            title: editTitle,
            content: editNote.content,
            timestamp: new Date().toISOString(),
            id: `local-${new Date().getTime()}`,
            pinned: editNote.pinned
          };
          const notePath = `${FileSystem.documentDirectory}${newNote.id}.json`;
          await FileSystem.writeAsStringAsync(notePath, JSON.stringify(newNote));
          setLocalNotes([...localNotes, newNote]);
          setCloudNotes(cloudNotes.filter(note => note.id !== editNote.id));
          Alert.alert("Note updated", "Note has been moved from BeProductive Cloud to Local Device.");
        } else {
          const updatedNote = { ...editNote, title: editTitle };
          const notePath = `${FileSystem.documentDirectory}${updatedNote.id}.json`;
          await FileSystem.writeAsStringAsync(notePath, JSON.stringify(updatedNote));
          setLocalNotes(localNotes.map(note => note.id === updatedNote.id ? updatedNote : note));
          Alert.alert("Note updated", "Note has been updated in Local Device.");
        }
      }
      setModalVisible(false);
      onRefresh(); // Refresh the NotesScreen after saving
    } catch (error) {
      console.error("Error saving note: ", error);
      Alert.alert("Error", "An error occurred while saving the note.");
    }
  };

  const renderNoteItem = (note, isCloud) => (
    <TouchableOpacity
      key={note.id}
      style={[
        styles.noteItem,
        selectedNotes.has(note.id) && { backgroundColor: '#e0e0e0' }
      ]}
      onPress={() => handleSelectNote(note.id)}
      onLongPress={() => handleLongPress({ ...note, cloud: isCloud })}
    >
      {note.pinned && (
        <Image
          source={require('../../../Media/Images/pinned.png')}
          style={styles.pinIcon}
        />
      )}
      {isCloud && (
        <Image
          source={require('../../../Media/Images/cloud.png')}
          style={styles.cloudIcon}
        />
      )}
      <Text style={styles.noteText}>{note.title}</Text>
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
            <Text style={styles.header}>Notes!</Text>
            <TouchableOpacity onPress={toggleMenu} style={styles.moreButton}>
              <Image source={require('../../../Media/Images/more.png')} style={styles.moreIcon} />
            </TouchableOpacity>
          </>
        )}
        {mode !== 'normal' && (
          <Text style={styles.header}>{mode === 'delete' ? 'Delete!' : mode === 'pin' ? 'Pin!' : 'Edit!'}</Text>
        )}
      </View>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.notesContainer}>
          <TouchableOpacity onPress={() => {
            if (isPremium) {
              setCloudExpanded(!cloudExpanded);
            } else {
              Alert.alert(
                "Premium Feature",
                "Upgrade to premium to use this feature.",
                [
                  { text: "Cancel", style: "cancel" },
                  { text: "Get Premium", style: "default" }
                ]
              );
            }
          }}>
            <View style={styles.sectionHeaderContainer}>
              <Text style={styles.sectionHeader}>BeProductive Cloud</Text>
              <Image
                source={cloudExpanded ? require('../../../Media/Images/expand-arrow-down.png') : require('../../../Media/Images/expand-arrow-up.png')}
                style={styles.expandIcon}
              />
            </View>
          </TouchableOpacity>
          {cloudExpanded && (
            cloudNotes.length === 0 ? (
              <View style={styles.noNotesContainer}>
                <Text style={styles.noNotesText}>No cloud notes created yet.</Text>
              </View>
            ) : (
              cloudNotes.map(note => renderNoteItem(note, true))
            )
          )}

          <TouchableOpacity onPress={() => setLocalExpanded(!localExpanded)}>
            <View style={styles.sectionHeaderContainer}>
              <Text style={styles.sectionHeader}>All in my device</Text>
              <Image
                source={localExpanded ? require('../../../Media/Images/expand-arrow-down.png') : require('../../../Media/Images/expand-arrow-up.png')}
                style={styles.expandIcon}
              />
            </View>
          </TouchableOpacity>
          {localExpanded && (
            localNotes.length === 0 ? (
              <View style={styles.noNotesContainer}>
                <Text style={styles.noNotesText}>No local notes created yet.</Text>
              </View>
            ) : (
              localNotes.map(note => renderNoteItem(note, false))
            )
          )}
        </View>
      </ScrollView>
      {mode === 'normal' && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.button}
            onPress={handleAddNote}
          >
            <Text style={styles.buttonText}>Create Note!</Text>
          </TouchableOpacity>
        </View>
      )}
      {mode === 'pin' && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.pinButton]}
            onPress={performPin}
          >
            <Text style={styles.buttonText}>Confirm!</Text>
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
      {mode === 'edit' && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={cancelChanges}
          >
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
      {menuVisible && renderMenu()}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <TextInput
                style={styles.modalText}
                placeholder="Edit title"
                value={editTitle}
                onChangeText={setEditTitle}
                maxLength={27}
              />
              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>Cloud</Text>
                <Switch
                  value={isCloud}
                  onValueChange={setIsCloud}
                />
              </View>
              <TouchableOpacity
                style={[styles.button, styles.buttonClose]}
                onPress={handleSaveNote}
              >
                <Text style={styles.textStyle}>Save</Text>
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
    // Remover a sombra para evitar a linha de separação
    backgroundColor: 'white', // Add solid background color
    // Remover propriedades de sombra ou borda que possam estar causando a linha
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    borderBottomWidth: 0, // Adicione esta linha se houver uma borda inferior
  },
  noNotesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noNotesText: {
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
  pinIcon: {
    width: 20,
    height: 20,
    position: 'absolute',
    top: 5,
    right: 5,
    resizeMode: 'contain',
  },
  cloudIcon: {
    width: 20,
    height: 20,
    position: 'absolute',
    top: 5,
    left: 5,
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
  notesContainer: {
    flexDirection: 'column',
    paddingHorizontal: 30,
  },
  noteItem: {
    padding: 20,
    backgroundColor: 'white', // Ensure a solid background color is set
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
  noteText: {
    fontSize: 18,
    fontWeight: '500',
    shadowColor: 'rgba(0, 0, 0, 0.9)',
    textAlign: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 1,
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
    backgroundColor: "transparent"
  },
  modalView: {
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
  buttonClose: {
    backgroundColor: "#2196F3",
    marginTop: 20,
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center"
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
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: 10
  },
  switchLabel: {
    fontSize: 18,
    fontWeight: 'bold'
  }
});

export default NotesScreen;
