import React, { useState, useEffect } from "react";
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
import VoiceAnimation from "./VoiceAnimation";
import * as FileSystem from "expo-file-system";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import axios from "axios";
import { v4 as uuidV4 } from "uuid";
import AsyncStorage from "@react-native-async-storage/async-storage";

type TranslateEntity = {
  id: string;
  transcript: string;
  translation?: string;
};

const getAccessToken = (): Promise<string> => {
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
            reslove(newBaiduAccessToken as string);
          });
      }
    });
  });
};

const getSpeechText = ({
  token,
  speech,
  len,
}: {
  token: string;
  speech: string;
  len: number;
}) => {
  return axios.request({
    method: "post",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    url: "https://vop.baidu.com/server_api",
    data: {
      format: "m4a",
      rate: 16000,
      channel: 1,
      cuid: "M2BMHtnlgiGeujpNmqQINdxV9COUjzld",
      token,
      speech,
      len,
    },
  });
};

const getTransResult = (token: string, text: string) => {
  return axios.request({
    url: `https://aip.baidubce.com/rpc/2.0/mt/texttrans/v1?access_token=${token}`,
    params: {
      from: "auto",
      to: "en",
      q: text,
    },
  });
};

const VoiceRecording = () => {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [transcript, setTranscript] = useState<TranslateEntity[]>([]);
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
    await recording?.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
    });
    const uri = recording?.getURI();
    if (uri) {
      const speech = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const fileInfo = await FileSystem.getInfoAsync(uri);
      const len = (fileInfo as any).size;
      setRecording(null);
      setIsRecording(false);
      getAccessToken().then((token) => {
        getSpeechText({ token, speech, len }).then((response) => {
          if (response.data.err_no === 0) {
            const text = response.data.result[0];
            if (text) {
              getTransResult(token, text).then((response) => {
                console.log("text", text);
                console.log("翻译结果", response.data.result.trans_result);
                const result = response.data.result.trans_result;
                if (result[0]) {
                  setTranscript((oldValues) => {
                    return [
                      ...oldValues,
                      {
                        id: uuidV4(),
                        transcript: text,
                        translation: result[0].dst,
                      },
                    ];
                  });
                }
              });
            }
          }
        });
      });
    }
  };

  return (
    <View style={{ padding: 20 }}>
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
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => {
              setTranscript([]);
            }}
          >
            <FontAwesome name="undo" size={32} color="black" />
          </TouchableOpacity>
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
