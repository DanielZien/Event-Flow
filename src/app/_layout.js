import React, { useEffect, useState } from "react";

import { Drawer } from "expo-router/drawer";
import { AuthProvider } from "./temporario/authContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { View, Text, Image, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

function CustomDrawerContent(props) {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function loadUser() {
      const userData = await AsyncStorage.getItem("user");
      if (userData) {
        setUser(JSON.parse(userData));
      }
    }
    loadUser();
  }, []);

  return (
    <View style={{ flex: 1, padding: 20 }}>
      {/* Cabeçalho */}
      <View style={{ alignItems: "center", marginBottom: 20 }}>
        <Image
          source={{
            uri: "https://via.placeholder.com/80", // imagem fixa por enquanto
          }}
          style={{ width: 80, height: 80, borderRadius: 40 }}
        />
        <Text style={{ fontSize: 16, fontWeight: "bold", marginTop: 10 }}>
          Olá,
        </Text>
        <Text style={{ fontSize: 14, color: "gray", marginTop: 4 }}>
          {user ? user.email : "Usuário"}
        </Text>

      </View>

      {/* Opções do menu */}
      <TouchableOpacity style={{ marginVertical: 10 }} onPress={() => router.push("evento/conta")}>
        <Text style={{ fontSize: 16 }}>Minha Conta</Text>
      </TouchableOpacity>

      <TouchableOpacity style={{ marginVertical: 10 }} onPress={() => router.back()}>
        <Text style={{ fontSize: 16 }}>Home</Text>
      </TouchableOpacity>

      <TouchableOpacity style={{ marginVertical: 10 }} onPress={() => router.push("evento/notificacao")}>
        <Text style={{ fontSize: 16 }}>Notificação</Text>
      </TouchableOpacity>

      <TouchableOpacity style={{ marginVertical: 10 }} onPress={() => router.push("evento/categorias")}>
        <Text style={{ fontSize: 16 }}>Categorias</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{ marginVertical: 10 }}
        onPress={async () => {
          await AsyncStorage.removeItem("token");
          await AsyncStorage.removeItem("user");
          router.replace("/login");
        }}
      >
        <Text style={{ fontSize: 16, color: "red" }}>Sair</Text>
      </TouchableOpacity>
    </View>
  );
}


export default function RootLayout() {
  return (
    <AuthProvider>
      <Drawer drawerContent={(props) => <CustomDrawerContent {...props} />}>
        <Drawer.Screen name="login/index" options={{title: "Login", headerShown:false}}/>
        <Drawer.Screen name="login/cadastro" options={{title: "Cadastro",headerShown:false}}/>
        <Drawer.Screen name="evento/notificacao" options={{title: "Notificacao"}}/>
        <Drawer.Screen name="evento/conta" options={{ title: "Minha Conta" }} />
        <Drawer.Screen name="evento/home" options={{title: "Home"}}/>
        <Drawer.Screen name="evento/termo" options={{ title: "Termos" }} />
        <Drawer.Screen name="newEvento/locaisCadastrados" options={{title: "Home"}}/>
        <Drawer.Screen name="newEvento/eventosCadastrado" options={{title: "Home"}}/>
        <Drawer.Screen name="evento/categorias" options={{title: "Categorias"}}/>
      </Drawer>
    </AuthProvider>
  );
}