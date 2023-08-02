// CameraScreen.js
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Button,
  SafeAreaView,
  StatusBar,
  Image,
} from "react-native";
import { Camera } from "expo-camera";
import { shareAsync } from "expo-sharing";
import * as MediaLibrary from "expo-media-library";
import * as FileSystem from "expo-file-system";
import * as Location from "expo-location";
//import axios from "axios";
import * as SQLite from "expo-sqlite";
import CustomButton from "./CustomButton";

const db = SQLite.openDatabase("gallerylist.db");

export default function CameraScreen({ navigation, route }) {
  const [images, setImages] = useState(route.params.images);
  //const setImages = route.params.setImages;

  const cameraRef = useRef();
  const [hasCameraPermission, setHasCameraPermission] = useState();
  const [photo, setPhoto] = useState();

  const [db, setDb] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [address, setAddress] = useState("");

  console.log(images);
  useEffect(() => {
    // Check camera permission and set up the database when the component mounts
    (async () => {
      const cameraPermission = await Camera.requestCameraPermissionsAsync();
      setHasCameraPermission(cameraPermission.status === "granted");
      setupDatabase(); // Call the function to set up the database
      getLocationPermissions(); // Get location permissions and current location
    })();
  }, []);

  // Function to set up the SQLite database
  const setupDatabase = () => {
    const db = SQLite.openDatabase("gallerylist.db");
    db.transaction((tx) => {
      // Create the table if it doesn't exist
      tx.executeSql(
        "CREATE TABLE IF NOT EXISTS images (id INTEGER PRIMARY KEY AUTOINCREMENT, imageURL TEXT, location TEXT)"
      );

      // Check if the table has the "imageURL" column, and add it if it's missing
      tx.executeSql(
        `PRAGMA table_info(images)`,
        [],
        (txObj, resultSet) => {
          let hasImageURLColumn = false;
          for (let i = 0; i < resultSet.rows.length; i++) {
            if (resultSet.rows.item(i).name === "imageURL") {
              hasImageURLColumn = true;
              break;
            }
          }

          if (!hasImageURLColumn) {
            tx.executeSql(
              "ALTER TABLE images ADD COLUMN imageURL TEXT, location TEXT",
              [],
              null,
              (_, error) => console.log("Error adding imageURL column: ", error)
            );
          }
        },
        (_, error) => console.log("Error checking table columns: ", error)
      );
    });
    setDb(db); // Save the database reference in the state
  };

  // Function to get location permissions and current location
  const getLocationPermissions = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      console.log("Please grant location permissions");
      return;
    }

    const currentLocation = await Location.getCurrentPositionAsync({});
    setCurrentLocation(currentLocation);
    console.log("Location:");
    console.log(currentLocation);
  };

  //exporting the database
  const exportDatabase = async () => {
    try {
      const dbFileUri = FileSystem.documentDirectory + "SQLite/gallery.db";
      const exportUri = FileSystem.documentDirectory + "gallery.db";
      await FileSystem.copyAsync({ from: dbFileUri, to: exportUri });
      console.log("Database file exported successfully.");
    } catch (error) {
      console.log("Error exporting database file: ", error);
    }
  };

  let takePic = async () => {
    let options = {
      quality: 1,
      base64: true,
      exif: false,
    };

    let newPhoto = await cameraRef.current.takePictureAsync(options);
    setPhoto(newPhoto);
  };
  let goToGallery = () => {
    // Export the database before navigating to the gallery
    exportDatabase();

    // Navigate to the GalleryScreen and pass the images and setImages props
    navigation.navigate("Gallery", {
      images,
    });
  };

  let sharePic = () => {
    shareAsync(photo.uri).then(() => {
      setPhoto(undefined);
    });
  };

  let savePhoto = async () => {
    // Save the photo to the device's media library
    await MediaLibrary.saveToLibraryAsync(photo.uri);

    // Geocode the address using the current location data
    let location = null;
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const currentLocation = await Location.getCurrentPositionAsync({});
        location = currentLocation;
        console.log("location : ");
        console.log(location);
      }
    } catch (error) {
      console.log("Error getting location:", error);
    }

    // Insert the image data and location into the database
    if (location) {
      try {
        const base64Data = await FileSystem.readAsStringAsync(photo.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const reverseGeocode = async () => {
          const reverseGeocodedAddress = await Location.reverseGeocodeAsync({
            longitude: location.coords.longitude,
            latitude: location.coords.latitude,
          });

          console.log("Reverse Geocoded:");
          console.log(reverseGeocodedAddress);
          return reverseGeocodedAddress;
        };

        // Call the reverseGeocode function to get the location data
        const newLocation = await reverseGeocode();

        // Open the database
        const db = SQLite.openDatabase("gallery.db");

        // Insert the image data and location into the database using a transaction
        db.transaction((tx) => {
          tx.executeSql(
            "INSERT INTO images (imageURL, location) VALUES (?, ?)",
            [base64Data, JSON.stringify(newLocation)], // Convert the location object to a string before saving it in the database
            (txObj, resultSet) => {
              // Successfully inserted the data, update the state to reflect the changes
              let existingImages = [...images];
              existingImages.push({
                id: resultSet.insertId,
                imageURL: base64Data,
                location: newLocation,
              });
              setImages(existingImages);
              console.log("Image and location saved to database.");
              setPhoto(undefined); // Clear the photo after saving
            },
            (txObj, error) =>
              console.log("Error saving image to database: ", error)
          );
        });
      } catch (error) {
        console.log("Error reading image data: ", error);
      }
    }
  };

  if (hasCameraPermission === undefined) {
    return <View />;
  } else if (!hasCameraPermission) {
    return <View />;
  }

  if (photo) {
    return (
      <SafeAreaView style={styles.container}>
        {/* ... */}
        {photo ? (
          <>
            <Image
              style={styles.preview}
              source={{ uri: "data:image/jpg;base64," + photo.base64 }}
            />
            <View style={styles.buttonContainer}>
              <CustomButton
                title="Save"
                iconName="save" // Replace with the appropriate icon name from the icon library
                onPress={savePhoto}
              />
              <CustomButton
                iconName="fire" // Replace with the appropriate icon name from the icon library
                title="View Gallery"
                onPress={goToGallery}
              />
              <CustomButton
                title="Discard"
                iconName="trash" // Replace with the appropriate icon name from the icon library
                onPress={() => setPhoto(undefined)}
              />
            </View>
          </>
        ) : (
          <Camera style={styles.container} ref={cameraRef}>
            <View style={styles.buttonContainer}>
              <CustomButton
                title="Take Pic"
                iconName="camera" // Replace with the appropriate icon name from the icon library
                onPress={takePic}
              />
            </View>
            <StatusBar style="auto" />
          </Camera>
        )}
        {/* ... */}
      </SafeAreaView>
    );
  }

  return (
    <Camera style={styles.container} ref={cameraRef}>
      <View style={styles.buttonContainer}>
        <Button title="Take Pic" onPress={takePic} />
      </View>
      <StatusBar style="auto" />
    </Camera>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    backgroundColor: "transparent",
    alignItems: "center",
    width: "auto",
    paddingHorizontal: "5%",
    position: "absolute",
    bottom: 20,
  },
  preview: {
    flex: 1,
  },
});
