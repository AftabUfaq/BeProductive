import React, { useState, useEffect } from 'react';
import { View, Text, Modal, StyleSheet, TextInput, Switch, TouchableOpacity, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';

const AlarmModal = ({ visible, onClose, onSave, alarm, categories }) => {
  const [editTitle, setEditTitle] = useState('');
  const [editTime, setEditTime] = useState(new Date());
  const [repeatDays, setRepeatDays] = useState([]);
  const [snooze, setSnooze] = useState(false);
  const [selectedSound, setSelectedSound] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('default');
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    if (alarm) {
      setEditTitle(alarm.title);
      setEditTime(new Date(alarm.time));
      setRepeatDays(alarm.repeatDays);
      setSnooze(alarm.snooze);
      setSelectedSound(alarm.sound);
      setSelectedCategory(alarm.category);
    }
  }, [alarm]);

  const handleSave = () => {
    if (editTitle.length < 3 || editTitle.length > 27) {
      Alert.alert("Invalid Title", "Title must be between 3 and 27 characters.");
      return;
    }

    onSave({
      title: editTitle,
      time: editTime.toISOString(),
      repeatDays,
      snooze,
      sound: selectedSound,
      category: selectedCategory,
    });
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>{alarm ? "Edit Alarm" : "Add Alarm"}</Text>
          <TextInput
            style={styles.modalText}
            placeholder="Edit title"
            value={editTitle}
            onChangeText={setEditTitle}
            maxLength={27}
          />
          <TouchableOpacity onPress={() => setShowTimePicker(true)}>
            <Text style={styles.modalText}>{editTime.toLocaleTimeString()}</Text>
          </TouchableOpacity>
          {showTimePicker && (
            <DateTimePicker
              value={editTime}
              mode="time"
              is24Hour={true}
              display="default"
              onChange={(event, selectedDate) => {
                setShowTimePicker(false);
                if (selectedDate) {
                  setEditTime(selectedDate);
                }
              }}
            />
          )}
          <View style={styles.repeatContainer}>
            <Text style={styles.repeatLabel}>Repeat Days:</Text>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
              <TouchableOpacity
                key={day}
                style={[
                  styles.repeatDay,
                  repeatDays.includes(day) && styles.repeatDaySelected
                ]}
                onPress={() => {
                  if (repeatDays.includes(day)) {
                    setRepeatDays(repeatDays.filter(d => d !== day));
                  } else {
                    setRepeatDays([...repeatDays, day]);
                  }
                }}
              >
                <Text style={styles.repeatDayText}>{day}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Snooze</Text>
            <Switch
              value={snooze}
              onValueChange={setSnooze}
            />
          </View>
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Sound</Text>
            <Picker
              selectedValue={selectedSound}
              style={styles.picker}
              onValueChange={(itemValue) => setSelectedSound(itemValue)}
            >
              {["alarm1.mp3", "alarm2.mp3", "alarm3.mp3", "alarm4.mp3"].map(sound => (
                <Picker.Item key={sound} label={sound} value={sound} />
              ))}
            </Picker>
          </View>
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Category</Text>
            <Picker
              selectedValue={selectedCategory}
              style={styles.picker}
              onValueChange={(itemValue) => setSelectedCategory(itemValue)}
            >
              {categories.map(category => (
                <Picker.Item key={category} label={category} value={category} />
              ))}
            </Picker>
          </View>
          <TouchableOpacity
            style={[styles.button, styles.buttonClose]}
            onPress={handleSave}
          >
            <Text style={styles.textStyle}>{alarm ? "Save" : "Create"}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.buttonClose]}
            onPress={onClose}
          >
            <Text style={styles.textStyle}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)"
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
  repeatContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    flexWrap: 'wrap',
  },
  repeatLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 10,
  },
  repeatDay: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: 'white',
    margin: 5,
    borderWidth: 1,
    borderColor: 'gray',
  },
  repeatDaySelected: {
    backgroundColor: 'lightblue',
  },
  repeatDayText: {
    fontSize: 16,
    fontWeight: 'bold',
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
  picker: {
    height: 50,
    width: '100%',
  },
});

export default AlarmModal;
