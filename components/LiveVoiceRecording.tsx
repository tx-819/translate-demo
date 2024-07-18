import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { AntDesign, Feather } from "@expo/vector-icons";
import { Audio } from "expo-av";
import "react-native-get-random-values";
import * as Speech from "expo-speech";
import Space from "./Space";
import * as FileSystem from "expo-file-system";
import VoiceAnimation from "./VoiceAnimation";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { v4 as uuidV4 } from "uuid";
import * as Sharing from "expo-sharing";
import RNFetchBlob from "rn-fetch-blob";
import { Buffer } from "buffer"; // 引入 buffer 库
import {
  AndroidAudioEncoder,
  AndroidOutputFormat,
  IOSAudioQuality,
  IOSOutputFormat,
} from "expo-av/build/Audio";
type TranslateEntity = {
  id: string;
  transcript: string;
  translation?: string;
};

const getAccessToken = () => {
  return new Promise((reslove) => {
    /**
     * 百度智能云：免费体验资源包
     * https://console.bce.baidu.com/ai/#/ai/speech/app/detail~appId=5532370
     * 百度AccessToken获取，后续由后端使用定时器实现，AccessToken有效期为1个月
     */
    const APIKey = "uMhksxecMvXlwUFTtYLDsnak";
    const SecretKey = "sjikCptVcPhLSlueqnse6pvLzHHMV2Tj";
    AsyncStorage.getItem("Baidu_AccessToken").then((baiduAccessToken) => {
      if (baiduAccessToken) {
        reslove(baiduAccessToken);
      } else {
        axios
          .request({
            method: "post",
            url: `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${APIKey}&client_secret=${SecretKey}`,
          })
          .then((response) => {
            const newBaiduAccessToken = response.data.access_token;
            AsyncStorage.setItem("Baidu_AccessToken", newBaiduAccessToken);
            reslove(newBaiduAccessToken);
          });
      }
    });
  });
};

const VoiceRecording = () => {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [transcript, setTranscript] = useState<TranslateEntity[]>([]);
  const [recordingTranscript, setRecordingTranscript] = useState<
    TranslateEntity[]
  >([]);
  const [isRecording, setIsRecording] = useState(false);
  const [permissionResponse, requestPermission] = Audio.usePermissions();
  const socket = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (permissionResponse === null) {
      requestPermission();
    }
  }, [permissionResponse]);

  useEffect(() => {
    const initWebSocket = async () => {
      const _socket = new WebSocket(
        `wss://vop.baidu.com/realtime_asr?sn=${uuidV4()}`
      );
      socket.current = _socket;
      _socket.onopen = () => {
        console.log("Connected to WebSocket server");
      };

      _socket.onmessage = function (e) {
        console.log("event", e.data);
      };

      _socket.onerror = (e) => {
        console.log("error", e);
      };
    };

    initWebSocket();
  }, []);

  useEffect(() => {
    // getAccessToken().then((baiduAccessToken) => {
    //   axios
    //     .request({
    //       url: `https://aip.baidubce.com/rpc/2.0/mt/texttrans/v1?access_token=${baiduAccessToken}`,
    //       params: {
    //         from: "auto",
    //         to: "en",
    //         q: "你好",
    //       },
    //     })
    //     .then((response) => {
    //       console.log("翻译结果1", response.data.result.trans_result);
    //     });
    // });
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (
        recording &&
        isRecording &&
        socket.current &&
        socket.current.readyState === WebSocket.OPEN
      ) {
        const uri = recording?.getURI();
        if (uri) {
          const response = await FileSystem.uploadAsync(
            "http://192.168.1.33:3000/audio/convert",
            uri,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
              httpMethod: "POST",
              uploadType: FileSystem.FileSystemUploadType.MULTIPART,
              fieldName: "file",
            }
          );
          console.log("response", response);
          if (response.status === 201) {
            const filename: string = JSON.parse(response.body).pcmFileName;
            console.log("filename", filename);
            const url = `http://192.168.1.33:3000/uploads/${filename}`;
            console.log(url);
            try {
              const downloadResumable = FileSystem.createDownloadResumable(
                url,
                FileSystem.documentDirectory + filename
              );
              const downloadResponse = await downloadResumable.downloadAsync();
              console.log("downloadResponse", downloadResponse);
              if (downloadResponse) {
                const fileInfo = await FileSystem.readAsStringAsync(
                  downloadResponse.uri,
                  {
                    encoding: FileSystem.EncodingType.Base64,
                  }
                );
                const binary = Buffer.from(fileInfo, "base64");
                socket.current?.send(binary);
              }
            } catch (error) {
              console.log("error", error);
            }
            // console.log("arrayBuffer", arrayBuffer);
            // const buffer = Buffer.from(arrayBuffer);
            // console.log("buffer", buffer);
            // const fileInfo = await FileSystem.readAsStringAsync(url, {
            //   encoding: FileSystem.EncodingType.Base64,
            // });
            // const binary = Buffer.from(fileInfo, "base64");
            // console.log("fileInfo", fileInfo);
            // console.log("binary", binary);
          }
        }
      }
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [isRecording, recording]);

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
      const { recording: newRecording } = await Audio.Recording.createAsync({
        android: {
          extension: ".m4a",
          outputFormat: AndroidOutputFormat.MPEG_4,
          audioEncoder: AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: ".pcm",
          outputFormat: IOSOutputFormat.LINEARPCM,
          audioQuality: IOSAudioQuality.HIGH,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        web: {},
      });
      const startFrame = {
        type: "START",
        data: {
          appid: 94854380,
          appkey: "uMhksxecMvXlwUFTtYLDsnak",
          dev_pid: 15372, // 识别模型
          cuid: "cuid-1", // 唯一ID
          format: "pcm", // 固定参数
          sample: 16000, // 固定参数
        },
      };
      // 发送开始帧
      socket.current?.send(JSON.stringify(startFrame));
      console.log("Start frame sent");
      newRecording.setProgressUpdateInterval(5000);
      newRecording.setOnRecordingStatusUpdate(async (status) => {
        if (
          status.isRecording &&
          socket.current &&
          socket.current.readyState === WebSocket.OPEN
        ) {
          const uri = newRecording.getURI();
          if (uri) {
            try {
              const fileInfo = await FileSystem.readAsStringAsync(uri, {
                encoding: FileSystem.EncodingType.Base64,
              });
              const binary = Buffer.from(fileInfo, "base64");
              // socket.current?.send(binary);
            } catch (error) {
              console.log("error", error);
            }
          }
        }
      });
      setRecording(newRecording);
      setIsRecording(true);
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
    const finishFrame = {
      type: "FINISH",
    };
    socket.current?.send(JSON.stringify(finishFrame));
    setRecording(null);
    setIsRecording(false);
  };

  const downloadRecording = async () => {
    if (recording) {
      const uri = recording.getURI();
      if (uri) {
        const info = await FileSystem.getInfoAsync(uri);
        if (info.exists) {
          const newUri = FileSystem.documentDirectory + "recording.pcm";
          await FileSystem.copyAsync({
            from: uri,
            to: newUri,
          });
          Sharing.shareAsync(newUri);
        }
      }
    }
  };

  return (
    <View style={{ padding: 20 }}>
      {recording ? (
        <ScrollView style={{ height: "80%", overflow: "scroll" }}>
          {recordingTranscript.map((item) => (
            <View key={item.id} style={styles.recordingVoiceItem}>
              <Text style={styles.recordingText}>{item.transcript}</Text>
              <Text style={styles.recordingTranslatedText}>
                {item.translation}
              </Text>
            </View>
          ))}
        </ScrollView>
      ) : (
        <ScrollView style={{ height: "80%", overflow: "scroll" }}>
          {transcript.map((item) => {
            return (
              <View style={styles.voiceBox} key={item.id}>
                <View style={styles.textWrapper}>
                  <Text style={styles.textStyle}>{item.transcript}</Text>
                </View>
                <View style={styles.translatedTextWrapper}>
                  {item.translation && (
                    <>
                      <View style={{ width: "90%" }}>
                        <Text style={styles.textStyle}>{item.translation}</Text>
                      </View>

                      <TouchableOpacity
                        onPress={() => {
                          if (item.translation) Speech.speak(item.translation);
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
      )}
      <View style={styles.animationWrapper}>
        {recording && <VoiceAnimation pause={!isRecording} />}
      </View>
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
          {recording && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={downloadRecording}
            >
              <AntDesign name="download" size={42} color="#4caf50" />
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
  recordingVoiceItem: {
    borderBottomWidth: 1,
    paddingBottom: 10,
    marginTop: 10,
  },
  recordingText: {
    color: "grey",
    fontSize: 18,
  },
  recordingTranslatedText: {
    fontSize: 24,
  },
  animationWrapper: {
    height: 50,
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
    width: "85%",
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
