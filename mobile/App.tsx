import React from "react";
import { Platform } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createStackNavigator } from "@react-navigation/stack";

import LoginScreen from "./src/views/jueces/LoginScreen";
import InicioJueces from "./src/views/jueces/InicioScreen";
import BuscadorScreen from "./src/views/jueces/BuscadorScreen";
import CalificarScreen from "./src/views/jueces/CalificarScreen";
import ResultadosScreen from "./src/views/jueces/ResultadosScreen";
import PerfilScreen from "./src/views/jueces/PerfilScreen";

const Stack =
  Platform.OS === "web"
    ? createStackNavigator()
    : createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Perfil"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="InicioJueces" component={InicioJueces} />
        <Stack.Screen name="Buscador" component={BuscadorScreen} />
        <Stack.Screen name="Calificar" component={CalificarScreen} />
        <Stack.Screen name="Resultados" component={ResultadosScreen} />
        <Stack.Screen name="Perfil" component={PerfilScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
