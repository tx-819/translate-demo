import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Easing } from "react-native";

const colors = [
  "#ff6f61",
  "#ffcc5c",
  "#88d8b0",
  "#ff6f61",
  "#88d8b0",
  "#ffcc5c",
  "#ff6f61",
  "#ffcc5c",
  "#88d8b0",
  "#ff6f61",
  "#88d8b0",
  "#ffcc5c",
  "#ff6f61",
  "#ffcc5c",
  "#88d8b0",
  "#ff6f61",
];

type AnimatedBarProps = {
  color: string;
  index: number;
  pause: boolean;
};

const AnimatedBar: React.FC<AnimatedBarProps> = ({ color, index, pause }) => {
  const initStateHeight = useRef(Math.random() * 40 + 10).current;

  const height = useRef(new Animated.Value(initStateHeight)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const heightAnimation = Animated.loop(
    Animated.sequence([
      Animated.timing(height, {
        toValue: initStateHeight > 30 ? 10 : 50,
        duration: 300,
        easing: Easing.linear,
        useNativeDriver: false,
      }),
      Animated.timing(height, {
        toValue: initStateHeight,
        duration: 300,
        easing: Easing.linear,
        useNativeDriver: false,
      }),
      Animated.timing(height, {
        toValue: initStateHeight > 30 ? 50 : 10,
        duration: 300,
        easing: Easing.linear,
        useNativeDriver: false,
      }),
      Animated.timing(height, {
        toValue: initStateHeight,
        duration: 300,
        easing: Easing.linear,
        useNativeDriver: false,
      }),
    ])
  );

  const opacityAnimation = Animated.loop(
    Animated.sequence([
      Animated.timing(opacity, {
        toValue: 0.5,
        duration: 600,
        easing: Easing.linear,
        useNativeDriver: false,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 600,
        easing: Easing.linear,
        useNativeDriver: false,
      }),
    ])
  );

  useEffect(() => {
    if (pause) {
      heightAnimation.stop();
      opacityAnimation.stop();
    } else {
      heightAnimation.start();
      opacityAnimation.start();
    }
    return () => {
      heightAnimation.stop();
      opacityAnimation.stop();
    };
  }, [pause]);

  return (
    <Animated.View
      style={[
        styles.bar,
        {
          backgroundColor: color,
          height,
          opacity,
        },
      ]}
    />
  );
};

type VoiceAnimationProps = {
  pause?: boolean;
};

const VoiceAnimation: React.FC<VoiceAnimationProps> = (props) => {
  const { pause = false } = props;

  return (
    <View style={styles.container}>
      {colors.map((color, index) => (
        <AnimatedBar pause={pause} key={index} color={color} index={index} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },
  bar: {
    width: 10,
    marginHorizontal: 4,
    borderRadius: 5,
  },
});

export default React.memo(VoiceAnimation);
