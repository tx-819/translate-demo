import React, { useState } from "react";
import { Button, View, Text } from "react-native";
import AudioRecorderPlayer from "react-native-audio-recorder-player";
import { PermissionsAndroid, Platform } from "react-native";
import * as FileSystem from "expo-file-system";
import { Buffer } from "buffer";

const App = () => {
  const audioRecorderPlayer = new AudioRecorderPlayer();
  const [recording, setRecording] = useState(false);
  const [recordedFilePath, setRecordedFilePath] = useState("");
  const [fileBuffer, setFileBuffer] = useState(null);

  const requestPermissions = async () => {
    if (Platform.OS === "android") {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        ]);
        return (
          granted["android.permission.RECORD_AUDIO"] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          granted["android.permission.WRITE_EXTERNAL_STORAGE"] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          granted["android.permission.READ_EXTERNAL_STORAGE"] ===
            PermissionsAndroid.RESULTS.GRANTED
        );
      } catch (err) {
        console.warn(err);
        return false;
      }
    } else {
      return true; // iOS permissions handled in Info.plist
    }
  };

  const startRecording = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      alert("Permission to access microphone is required!");
      return;
    }

    const path = Platform.select({
      ios: "audio.m4a",
      android: `${FileSystem.documentDirectory}audio.m4a`,
    });

    try {
      const uri = await audioRecorderPlayer.startRecorder(path);
      audioRecorderPlayer.addRecordBackListener((e) => {
        console.log("Recording:", e);
      });
      setRecording(true);
      setRecordedFilePath(uri);
    } catch (err) {
      console.error("Failed to start recording", err);
    }
  };

  const stopRecording = async () => {
    try {
      await audioRecorderPlayer.stopRecorder();
      audioRecorderPlayer.removeRecordBackListener();
      setRecording(false);
    } catch (err) {
      console.error("Failed to stop recording", err);
    }
  };

  const downloadFile = async () => {
    if (!recordedFilePath) return;

    try {
      const fileUri = recordedFilePath;
      const fileInfo = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const buffer = Buffer.from(fileInfo, "base64");
      setFileBuffer(buffer);
    } catch (error) {
      console.error("Failed to download and convert file:", error);
    }
  };

  return (
    <View>
      <Button
        title="Start Recording"
        onPress={startRecording}
        disabled={recording}
      />
      <Button
        title="Stop Recording"
        onPress={stopRecording}
        disabled={!recording}
      />
      <Button title="Download File" onPress={downloadFile} />
      {recordedFilePath ? (
        <Text>Recorded File Path: {recordedFilePath}</Text>
      ) : null}
      {fileBuffer ? (
        <Text>Downloaded File Buffer: {fileBuffer.toString("base64")}</Text>
      ) : null}
    </View>
  );
};

export default App;
