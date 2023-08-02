import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Image,
  FlatList,
  Text,
  //  Dimensions,
  TouchableOpacity,
} from "react-native";
import * as SQLite from "expo-sqlite";
import ImageViewer from "react-native-image-zoom-viewer";

const db = SQLite.openDatabase("gallery.db");

export default function GalleryScreen({ route }) {
  const images = route.params.images;
  const [viewerVisible, setViewerVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    db.transaction((tx) => {
      tx.executeSql(
        "SELECT * FROM images",
        null,
        (txObj, resultSet) => setImages(resultSet.rows._array),
        (txObj, error) => console.log("this new error is from here", error)
      );
    });
  }, []);

  const openImageViewer = (index) => {
    setCurrentImageIndex(index);
    setViewerVisible(true);
  };

  const closeImageViewer = () => {
    setViewerVisible(false);
  };

  const extractAddress = (location) => {
    if (location && location.length > 0) {
      const { street, city } = location[0];
      return `${street}, ${city}`;
    }
    return "Unknown Address";
  };

  const renderGalleryItem = ({ item, index }) => {
    const imageURL = item.imageURL;
    const address = extractAddress(JSON.parse(item.location));

    return (
      <TouchableOpacity key={index} onPress={() => openImageViewer(index)}>
        <View style={styles.galleryItem}>
          <Image style={styles.galleryImage} source={{ uri: imageURL }} />
          <Text style={styles.addressText}>{address}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={images}
        renderItem={renderGalleryItem}
        keyExtractor={(item, index) => index.toString()}
        numColumns={4}
        contentContainerStyle={styles.galleryContainer}
      />

      {viewerVisible && (
        <ImageViewer
          imageUrls={images.map((image) => ({ url: image.imageURL }))}
          index={currentImageIndex}
          onCancel={closeImageViewer}
          enableSwipeDown={true}
          enablePreload={true}
          loadingRender={() => <Text>Loading...</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  galleryContainer: {
    padding: 8,
  },
  galleryItem: {
    width: 20,
    height: 20, // To make it a square box
    margin: 4,
    alignItems: "center",
  },
  galleryImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  addressText: {
    marginTop: 4,
    textAlign: "center",
  },
});
