import { StyleSheet, SafeAreaView } from "react-native";
import LiveVoiceRecording from "@/components/LiveVoiceRecording";
import VoiceRecording from "@/components/VoiceRecording";
import LiveRecordDemo from "@/components/LiveRecordDemo";
import { hello } from "../../modules/test-module";

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      {hello()}
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
