import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import CameraScreen from "./CameraScreen";
import GalleryScreen from "./GalleryScreen";
import * as SQLite from "expo-sqlite";

const Stack = createStackNavigator();
//const db = SQLite.openDatabase("galleryApp.db");

export default function App() {
  const [images, setImages] = useState([]);
  
  // Create the "images" table when the app starts
  // useEffect(() => {
  //   db.transaction((tx) => {
  //     tx.executeSql(
  //       "CREATE TABLE IF NOT EXISTS images (id INTEGER PRIMARY KEY AUTOINCREMENT, imageURI TEXT, location TEXT)"
  //     );
  //   });
  // }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Camera">
        <Stack.Screen
          name="Camera"
          component={CameraScreen}
          initialParams={{ images }}
        />
        <Stack.Screen name="Gallery">
          {(props) => <GalleryScreen {...props} images={images} />}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
