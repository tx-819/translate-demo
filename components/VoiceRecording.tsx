import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Button,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { AntDesign, Feather } from "@expo/vector-icons";
import { Audio } from "expo-av";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import * as Speech from "expo-speech";
import Space from "./Space";

const SERVER_URL = "";

type TranslateEntity = {
  id: string;
  text: string;
  translatedText?: string;
};

const exampleData: TranslateEntity[] = [];

const VoiceRecording = () => {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [transcript, setTranscript] = useState<TranslateEntity[]>(exampleData);
  const [isRecording, setIsRecording] = useState(false);
  const [permissionResponse, requestPermission] = Audio.usePermissions();

  useEffect(() => {
    if (permissionResponse === null) {
      requestPermission();
    }
  }, [permissionResponse]);

  const startRecording = async () => {
    if (permissionResponse?.status !== "granted") {
      alert("Permission to access microphone is required!");
      return;
    }
    try {
      if (recording) {
        await recording.startAsync();
        setIsRecording(true);
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      console.log("Starting recording..");
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(newRecording);
      setIsRecording(true);
      newRecording.setProgressUpdateInterval(2000);
      newRecording.setOnRecordingStatusUpdate(async (status) => {
        if (status.isRecording) {
          console.log("Update=========");
          // const uri = recording.getURI();
          // if (uri) {
          //   const formData = new FormData();
          //   formData.append("file", {
          //     uri,
          //     type: "audio/x-wav",
          //     name: "audio.wav",
          //   } as any);
          //   try {
          //     const response = await axios.post(
          //       `${SERVER_URL}/speech-to-text`,
          //       formData,
          //       {
          //         headers: {
          //           "Content-Type": "multipart/form-data",
          //         },
          //       }
          //     );
          //     setTranscript(response.data.transcript);
          //   } catch (error) {
          //     console.error("Error transcribing audio:", error);
          //   }
          // }
          setTranscript((oldValues) => {
            return [
              ...oldValues,
              {
                id: uuidv4(),
                text: "我是中国人",
                translatedText: "I am Chinese",
              },
            ];
          });
        }
      });
    } catch (error) {
      console.error("Failed to start recording:", error);
    }
  };

  const pauseRecording = async () => {
    try {
      if (recording) {
        await recording.pauseAsync();
        setIsRecording(false);
      }
    } catch (error) {
      console.error("Failed to pause recording:", error);
    }
  };

  const stopRecording = async () => {
    console.log("Stopping recording..");
    await recording?.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
    });
    setRecording(null);
    setIsRecording(false);
  };

  const playSound = async (text: string) => {
    Speech.speak(text);
  };

  return (
    <View style={{ padding: 20 }}>
      <ScrollView style={{ height: "85%", overflow: "scroll" }}>
        {transcript.map((item) => {
          return (
            <View style={styles.voiceBox} key={item.id}>
              <View style={styles.textWrapper}>
                <Text style={styles.textStyle}>{item.text}</Text>
              </View>
              <View style={styles.translatedTextWrapper}>
                {item.translatedText && (
                  <>
                    <Text style={styles.textStyle}>{item.translatedText}</Text>
                    <TouchableOpacity
                      onPress={() => {
                        if (item.translatedText) playSound(item.translatedText);
                      }}
                    >
                      <Feather name="volume-2" size={24} color="black" />
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
      <View style={styles.operation}>
        <Space size={16}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={recording && isRecording ? pauseRecording : startRecording}
          >
            <AntDesign
              name={recording && isRecording ? "pause" : "caretright"}
              size={42}
              color="#4caf50"
            />
          </TouchableOpacity>
          {recording && (
            <TouchableOpacity style={styles.iconButton} onPress={stopRecording}>
              <View style={styles.endIcon}></View>
            </TouchableOpacity>
          )}
        </Space>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  iconButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    width: 75,
    height: 75,
    borderRadius: 50,
  },
  endIcon: {
    width: 28,
    height: 28,
    backgroundColor: "red",
  },
  operation: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
    marginTop: 20,
  },
  voiceBox: {
    borderRadius: 10,
    backgroundColor: "white",
    width: "80%",
    marginBottom: 15,
  },
  textWrapper: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
    borderBottomWidth: 1,
  },
  translatedTextWrapper: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
  },
  textStyle: {
    fontSize: 18,
  },
});

export default VoiceRecording;
