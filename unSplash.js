import React, { useState, useEffect, useCallback } from "react";
//import { withExpoRoot } from "expo/build/withExpoRoot";
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  FlatList,
  Dimensions,
  Image,
  Animated,
  TouchableWithoutFeedback,
  TouchableOpacity,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import * as Sharing from "expo-sharing";
import * as MediaLibrary from "expo-media-library";

const { height, width } = Dimensions.get("window");

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [images, setImages] = useState([]);
  const [scale, setScale] = useState(new Animated.Value(1));
  const [isImageFocused, setIsImageFocused] = useState(false);

  const scaleStyle = {
    transform: [{ scale }],
  };

  const actionBarY = scale.interpolate({
    inputRange: [0.9, 1],
    outputRange: [0, -80],
  });

  const borderRadius = scale.interpolate({
    inputRange: [0.9, 1],
    outputRange: [30, 0],
  });

  const loadWallpapers = useCallback(() => {
    axios
      .get(
        "https://api.unsplash.com/photos/random?count=30&client_id=vDQiYxuPxwsQVEVihw5B_svveWe6eikPEK_a0oE0RTQ"
      )
      .then((response) => {
        console.log(response.data);
        setImages(response.data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.log(error);
      })
      .finally(() => {
        console.log("request completed");
      });
  }, []);

  useEffect(() => {
    loadWallpapers();
  }, [loadWallpapers]);

  const saveToCameraRoll = async (image) => {
    let cameraPermissions = await ImagePicker.getMediaLibraryPermissionsAsync();
    if (!cameraPermissions.granted) {
      cameraPermissions =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
    }

    if (cameraPermissions.granted) {
      MediaLibrary.saveToLibraryAsync(image.urls.regular)
        .then(() => {
          alert("Saved to photos");
        })
        .catch((error) => {
          console.log(error);
        });
    } else {
      alert("Requires camera roll permission");
    }
  };
  // ...
  const showControls = (item) => {
    setIsImageFocused((prevState) => !prevState);

    if (!isImageFocused) {
      Animated.spring(scale, {
        toValue: 0.9,
        useNativeDriver: true, // Add this line
      }).start();
    } else {
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true, // Add this line
      }).start();
    }
  };
  // ...

  const shareWallpaper = async (image) => {
    try {
      await Sharing.shareAsync(image.urls.full);
    } catch (error) {
      console.log(error);
    }
  };

  const renderItem = ({ item }) => {
    return (
      <View style={{ flex: 1 }}>
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "black",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ActivityIndicator size="large" color="grey" />
        </View>
        <TouchableWithoutFeedback onPress={() => showControls(item)}>
          <Animated.View style={[{ height, width }, scaleStyle]}>
            <Animated.Image
              style={{
                flex: 1,
                height: null,
                width: null,
                borderRadius,
              }}
              source={{ uri: item.urls.regular }}
            />
          </Animated.View>
        </TouchableWithoutFeedback>
        <Animated.View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 20,
            height: 80,
            backgroundColor: "black",
            flexDirection: "row",
            justifyContent: "space-around",
          }}
        >
          <View
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
          >
            <TouchableOpacity activeOpacity={0.5} onPress={loadWallpapers}>
              <Ionicons name="ios-refresh" color="white" size={40} />
            </TouchableOpacity>
          </View>
          <View
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
          >
            <TouchableOpacity
              activeOpacity={0.5}
              onPress={() => shareWallpaper(item)}
            >
              <Ionicons name="ios-share" color="white" size={40} />
            </TouchableOpacity>
          </View>
          <View
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
          >
            <TouchableOpacity
              activeOpacity={0.5}
              onPress={() => saveToCameraRoll(item)}
            >
              <Ionicons name="ios-save" color="white" size={40} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    );
  };

  return isLoading ? (
    <View
      style={{
        flex: 1,
        backgroundColor: "black",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <ActivityIndicator size="large" color="grey" />
    </View>
  ) : (
    <View style={{ flex: 1, backgroundColor: "black" }}>
      <FlatList
        scrollEnabled={!isImageFocused}
        horizontal
        pagingEnabled
        data={images}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default App;
