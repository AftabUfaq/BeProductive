import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  Alert,
  StyleSheet,
  TouchableOpacity,
  Text,
  Image,
  ScrollView,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { getAuth } from 'firebase/auth';
import { db } from '../../../firebaseConfig';
import { doc, updateDoc, deleteDoc, getDoc, setDoc } from 'firebase/firestore';
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler';
import * as FileSystem from 'expo-file-system';

const NotesChangeScreen = ({ navigation, route }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [originalTitle, setOriginalTitle] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const noteId = route.params?.noteId;
  const isCreatingNewNote = !noteId;
  const auth = getAuth();
  const user = auth.currentUser;
  const [timestamp, setTimestamp] = useState('');
  const contentInputRef = useRef(null);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    const formatDate = (date) => {
      return `${date.getDate()} ${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()} at ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
    };

    const fetchNote = async () => {
      if (noteId.startsWith('local-')) {
        const notePath = `${FileSystem.documentDirectory}${noteId}.json`;
        const noteData = await FileSystem.readAsStringAsync(notePath);
        const note = JSON.parse(noteData);
        setTitle(note.title);
        setOriginalTitle(note.title);
        setContent(note.content);
        setOriginalContent(note.content);
        setTimestamp(formatDate(new Date(note.timestamp)));
      } else {
        const noteRef = doc(db, 'notes', noteId);
        const noteSnap = await getDoc(noteRef);
        if (noteSnap.exists()) {
          setTitle(noteSnap.data().title);
          setOriginalTitle(noteSnap.data().title);
          setContent(noteSnap.data().content);
          setOriginalContent(noteSnap.data().content);
          const date = noteSnap.data().timestamp.toDate();
          setTimestamp(formatDate(date));
        } else {
          Alert.alert('Note not found');
        }
      }
    };

    if (noteId) {
      fetchNote();
    } else {
      const creationDate = new Date();
      setTimestamp(formatDate(creationDate));
    }

    const fetchUser = async () => {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setIsPremium(userSnap.data().isPremium);
      }
    };

    if (user) {
      fetchUser();
    }
  }, [noteId]);

  const saveNoteLocally = async () => {
    const note = {
      title: title,
      content: content,
      timestamp: new Date().toISOString(),
    };
    const newNoteId = isCreatingNewNote ? `local-${new Date().getTime()}` : noteId;
    const notePath = `${FileSystem.documentDirectory}${newNoteId}.json`;
    await FileSystem.writeAsStringAsync(notePath, JSON.stringify(note));
    navigation.navigate('Notes', { refresh: true });
    Alert.alert("Note saved locally successfully!");
  };

  const handleSaveNote = async () => {
    if (title.trim() === '' || content.trim() === '') {
      Alert.alert("Please fill in both fields");
      return;
    }

    if (title.trim().length < 3) {
      Alert.alert("Invalid Title", "Title must be at least 3 characters long.");
      return;
    }

    if (title.length > 27) {
      Alert.alert("Invalid Title", "Title length must be under 27 characters.");
      return;
    }

    if (isCreatingNewNote) {
      Alert.alert(
        "Save Note",
        "Where would you like to save this note?",
        [
          {
            text: "BeProductive Cloud",
            onPress: async () => {
              if (!isPremium) {
                Alert.alert("Premium Feature", "Upgrade to premium to use this feature.");
                return;
              }
              try {
                const noteRef = doc(db, 'notes', `note-${new Date().getTime()}`);
                await setDoc(noteRef, {
                  title: title,
                  content: content,
                  userId: user.uid,
                  timestamp: new Date(),
                });
                navigation.navigate('Notes', { refresh: true });
                Alert.alert("Note saved to cloud successfully!");
              } catch (error) {
                console.error("Error updating document: ", error);
                Alert.alert("An error occurred while updating the note.");
              }
            },
          },
          {
            text: "In my Device",
            onPress: async () => {
              await saveNoteLocally();
              navigation.navigate('Notes', { refresh: true });
            },
          },
          {
            text: "Cancel",
            style: "cancel",
          },
        ]
      );
    } else {
      Alert.alert(
        "Save Note",
        "Are you sure you want to save the changes?",
        [
          {
            text: "Save",
            onPress: async () => {
              try {
                if (noteId.startsWith('local-')) {
                  await saveNoteLocally();
                } else {
                  const noteRef = doc(db, 'notes', noteId);
                  await updateDoc(noteRef, {
                    title: title,
                    content: content,
                    userId: user.uid,
                    timestamp: new Date(),
                  });
                  navigation.navigate('Notes', { refresh: true });
                  Alert.alert("Note saved successfully!");
                }
              } catch (error) {
                console.error("Error updating document: ", error);
                Alert.alert("An error occurred while updating the note.");
              }
            },
          },
          {
            text: "Cancel",
            style: "cancel",
          },
        ]
      );
    }
  };

  const handleDeleteNote = async () => {
    if (isCreatingNewNote) {
      Alert.alert("Note Deletion", "Cannot delete a note that is not yet created.");
      return;
    }

    Alert.alert(
      "Delete Note",
      "Are you sure you want to delete this note?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          onPress: async () => {
            try {
              if (noteId.startsWith('local-')) {
                const notePath = `${FileSystem.documentDirectory}${noteId}.json`;
                await FileSystem.deleteAsync(notePath);
              } else {
                const noteRef = doc(db, 'notes', noteId);
                await deleteDoc(noteRef);
                const notePath = `${FileSystem.documentDirectory}${noteId}.json`;
                await FileSystem.deleteAsync(notePath);
              }
              navigation.navigate('Notes', { refresh: true });
            } catch (error) {
              console.error("Error deleting document: ", error);
              Alert.alert("An error occurred while deleting the note.");
            }
          },
          style: 'destructive'
        },
      ],
      { cancelable: false }
    );
  };

  const confirmBack = () => {
    if (title !== originalTitle || content !== originalContent) {
      Alert.alert('Discard changes?', 'Are you sure you want to leave without saving changes?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Leave', style: 'destructive', onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const revertChanges = () => {
    setTitle(originalTitle);
    setContent(originalContent);
  };

  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };

  const handleTitleChange = (text) => {
    setTitle(text);
  };

  const handlePanGesture = (event) => {
    if (event.nativeEvent.translationY > 50) {
      Keyboard.dismiss();
    }
  };

  const handleEditorPress = () => {
    if (isPremium) {
      Alert.alert("Coming Soon", "This feature is coming soon!");
    } else {
      Alert.alert(
        "Premium Feature",
        "Upgrade to premium to use this feature.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Get Premium!",
            onPress: () => navigation.navigate('Premium'),
            style: "default",
            color: "#2C8DFF",
          },
        ]
      );
    }
  };

  const handleViewModeToggle = () => {
    if (!isPremium) {
      Alert.alert(
        "Premium Feature",
        "Upgrade to premium to use this feature.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Get Premium!",
            onPress: () => navigation.navigate('Premium'),
            style: "default",
            color: "#2C8DFF",
          },
        ]
      );
      return;
    }

    setViewMode(!viewMode);
  };

  const MenuItem = ({ title, onPress }) => {
    const textStyle = title === "Delete" ? styles.menuItemTextDelete : styles.menuItemText;
    return (
      <TouchableOpacity style={styles.menuItem} onPress={() => { onPress(); toggleMenu(); }}>
        <Text style={textStyle}>{title}</Text>
      </TouchableOpacity>
    );
  };

  const renderMenu = () => {
    if (!menuVisible) return null;

    return (
      <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
        <View style={styles.fullScreenOverlay}>
          <View style={styles.menu}>
            <MenuItem title={viewMode ? "Exit View Mode" : "View Mode"} onPress={handleViewModeToggle} />
            {!viewMode && <MenuItem title="Editor" onPress={handleEditorPress} />}
            {!viewMode && <MenuItem title="Delete" onPress={handleDeleteNote} />}
          </View>
        </View>
      </TouchableWithoutFeedback>
    );
  };

  const renderTitle = () => {
    if (isEditingTitle) {
      return (
        <TextInput
          value={title}
          placeholder='Title!'
          placeholderTextColor={'gray'}
          onChangeText={handleTitleChange}
          style={styles.inputTitle}
          maxLength={27}
          onBlur={() => setIsEditingTitle(false)}
          autoFocus={isEditingTitle}
        />
      );
    }
    
    const displayedTitle = title.length > 7 ? `${title.substring(0, 10)}...` : title;

    return (
      <TouchableOpacity onPress={() => setIsEditingTitle(true)}>
        <Text style={[styles.inputTitle, title === '' && { color: 'gray' }]}>
          {displayedTitle || 'Title!'}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PanGestureHandler onGestureEvent={handlePanGesture}>
        <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); }}>
          <View style={styles.container}>
            <View style={styles.headerContainer}>
              {!viewMode && !isEditingTitle && (
                <TouchableOpacity onPress={confirmBack} style={styles.backButton}>
                  <Image
                    source={require('../../../Media/Images/back.png')}
                    style={styles.backIcon}
                  />
                </TouchableOpacity>
              )}
              {renderTitle()}
              {!viewMode && !isEditingTitle && (
                <TouchableOpacity onPress={handleSaveNote} style={styles.saveButton}>
                  <Image
                    source={require('../../../Media/Images/save.png')}
                    style={styles.saveIcon}
                  />
                </TouchableOpacity>
              )}
              {!isEditingTitle && (
                <TouchableOpacity onPress={toggleMenu} style={styles.moreButton}>
                  <Image
                    source={require('../../../Media/Images/more.png')}
                    style={styles.moreIcon}
                  />
                </TouchableOpacity>
              )}
              {!viewMode && !isEditingTitle && (
                <TouchableOpacity onPress={revertChanges} style={styles.goBackButton}>
                  <Image
                    source={require('../../../Media/Images/goback.png')}
                    style={styles.goBackIcon}
                  />
                </TouchableOpacity>
              )}
            </View>

            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={{ flex: 1, width: '100%' }}
            >
              <ScrollView
                keyboardShouldPersistTaps='handled'
                style={styles.scrollView}
                onScrollBeginDrag={() => { Keyboard.dismiss(); }}
              >
                <TouchableOpacity
                  activeOpacity={1}
                  style={styles.contentArea}
                >
                  {!viewMode && <Text style={styles.timestampText}>{timestamp}</Text>}
                  <TextInput
                    ref={contentInputRef}
                    placeholder="Start Writing!"
                    placeholderTextColor={'gray'}
                    value={content}
                    onChangeText={setContent}
                    style={styles.contentInput}
                    multiline={true}
                    scrollEnabled={false}
                    editable={!viewMode}
                  />
                </TouchableOpacity>
              </ScrollView>
            </KeyboardAvoidingView>
            {renderMenu()}
          </View>
        </TouchableWithoutFeedback>
      </PanGestureHandler>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
  },
  headerContainer: {
    width: '100%',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: 67,
    paddingBottom: 10,
    backgroundColor: 'white',
  },
  timestampText: {
    color: 'gray',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 5,
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 60,
    zIndex: 10,
  },
  backIcon: {
    width: 38,
    height: 38,
    resizeMode: 'contain',
  },
  saveButton: {
    position: 'absolute',
    left: 74,
    top: 60,
    zIndex: 10,
  },
  saveIcon: {
    width: 26,
    height: 36,
    resizeMode: 'contain',
  },
  moreButton: {
    position: 'absolute',
    right: 30,
    top: 60,
    zIndex: 10,
  },
  moreIcon: {
    width: 27,
    height: 40,
    resizeMode: 'contain',
  },
  goBackButton: {
    position: 'absolute',
    right: 70,
    top: 60,
    zIndex: 10,
  },
  goBackIcon: {
    width: 27,
    height: 40,
    resizeMode: 'contain',
  },
  inputTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'black',
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  contentArea: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 20,
    borderColor: 'gray',
    backgroundColor: 'white',
  },
  contentInput: {
    flex: 1,
    width: '100%',
    fontSize: 17,
  },
  menu: {
    position: 'absolute',
    right: 5,
    top: 105,
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

export default NotesChangeScreen;
