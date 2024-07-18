import { StyleSheet, SafeAreaView } from "react-native";
import LiveVoiceRecording from "@/components/LiveVoiceRecording";
import VoiceRecording from "@/components/VoiceRecording";
import LiveRecordDemo from "@/components/LiveRecordDemo";
import { hello } from "test-module";
import { useEffect } from "react";

export default function HomeScreen() {
  useEffect(() => {
    console.log(hello());
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <LiveVoiceRecording />
      {/* <VoiceRecording /> */}
      {/* <LiveRecordDemo></LiveRecordDemo> */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
  },
});
