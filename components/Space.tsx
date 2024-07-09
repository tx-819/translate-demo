import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";

type SpaceProps = {
  size?: number;
  direction?: "horizontal" | "vertical";
  wrap?: boolean;
  children: React.ReactNode;
  style?: ViewStyle;
};

const Space: React.FC<SpaceProps> = ({
  size = 8,
  direction = "horizontal",
  wrap = false,
  children,
  style,
}) => {
  const isHorizontal = direction === "horizontal";

  const containerStyle = {
    flexDirection: isHorizontal ? "row" : "column",
    flexWrap: wrap ? "wrap" : "nowrap",
  };

  const childrenWithSpacing = React.Children.map(children, (child, index) => (
    <View
      style={[
        isHorizontal ? { marginRight: size } : { marginBottom: size },
        index === React.Children.count(children) - 1 && {
          marginRight: 0,
          marginBottom: 0,
        },
      ]}
    >
      {child}
    </View>
  ));

  return (
    <View style={[containerStyle as any, style]}>{childrenWithSpacing}</View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
  },
});

export default Space;
