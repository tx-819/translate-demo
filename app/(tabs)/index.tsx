import { StyleSheet, SafeAreaView } from "react-native";
import VoiceRecording from "@/components/VoiceRecording";

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <VoiceRecording />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
  },
});
