import React, { useEffect, useState } from "react";
import { Drawer } from "expo-router/drawer";
import { AuthProvider } from "./temporario/authContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { router, useRouter } from "expo-router";
import { sessionService } from "../services/sessionService";

function CustomDrawerContent(props) {
  const { navigation } = props;
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    // Escutar mudanças no usuário
    const unsubscribe = sessionService.subscribeToAuthChanges((currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setRole(currentUser.role);
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe(); // Limpar listener ao desmontar
  }, []);

  // Handle logout
  const handleLogout = async () => {
    if (user) {
      await sessionService.registrarSaida(user.id);
    }
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");
    setUser(null);
    setRole(null);
    navigation.navigate("login/index");
  };

  if (loading) {
    return (
      <View style={{ flex: 1, padding: 20, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: "gray" }}>Carregando menu...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 20 }}>
      {/* Cabeçalho */}
      <View style={{ alignItems: "center", marginBottom: 20 }}>
        <Image
          source={{ uri: "https://www.otempo.com.br/content/dam/otempo/editorias/entretenimento/2022/1/entretenimento-gravida-de-taubate-meme-edu-guedes-quadrigemeas-recordtv-hoje-em-dia-chris-flores-1709144777.jpeg" }}
          style={{ width: 80, height: 80, borderRadius: 40 }}
        />
        <Text style={{ fontSize: 16, fontWeight: "bold", marginTop: 10 }}>Olá,</Text>
        <Text style={{ fontSize: 14, color: "gray", marginTop: 4 }}>
          {user ? user.email : "Usuário"}
        </Text>
      </View>

      {/* Opções comuns */}
      <TouchableOpacity style={{ marginVertical: 10 }} onPress={() => navigation.navigate("evento/conta")}>
        <Text style={{ fontSize: 16 }}>Minha Conta</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{ marginVertical: 10 }}
        onPress={() => router.replace("/evento/home")}
      >
        <Text style={{ fontSize: 16 }}>Home</Text>
      </TouchableOpacity>



      {/* Opções APENAS para ADMIN */}
      {role === "ADMIN" && (
        <>
          <TouchableOpacity
            style={{ marginVertical: 10 }}
            onPress={() => router.replace("/newEvento/eventosCadastrado")}
          >
            <Text style={{ fontSize: 16, fontWeight: "bold", color: "#08007B" }}>
              Eventos Cadastrados
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ marginVertical: 10 }}
            onPress={() => router.replace("/newEvento/locaisCadastrados")}
          >
            <Text style={{ fontSize: 16, fontWeight: "bold", color: "#08007B" }}>
              Locais Cadastrados
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ marginVertical: 10 }}
            onPress={() => navigation.navigate("evento/categorias")}
          >
            <Text style={{ fontSize: 16, fontWeight: "bold", color: "#08007B" }}>
              Categorias
            </Text>
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity
        style={{ marginVertical: 10 }}
        onPress={handleLogout}
      >
        <Text style={{ fontSize: 16, color: "red" }}>Sair</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function RootLayout() {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const userData = await AsyncStorage.getItem("user");
        if (userData) {
          const parsed = JSON.parse(userData);
          setRole(parsed.role);
        }
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  if (loading) return null;

  return (
    <AuthProvider>
      <Drawer
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          drawerPosition: "right",
          headerLeft: () => (
            <Image
              source={require("../imgs/logo.webp")}
              style={{ width: 40, height: 40, marginLeft: 10 }}
              resizeMode="contain"
            />
          ),
        }}
      >
        {/* Rotas comuns */}
        <Drawer.Screen name="login/index" options={{ title: "Login", headerShown: false }} />
        <Drawer.Screen name="login/cadastro" options={{ title: "Cadastro", headerShown: false }} />
        <Drawer.Screen name="evento/home" options={{ title: "Home" }} />
        <Drawer.Screen name="evento/conta" options={{ title: "Minha Conta" }} />
        <Drawer.Screen name="evento/notificacao" options={{ title: "Notificação" }} />
        <Drawer.Screen name="evento/termo" options={{ title: "Termos" }} />
        <Drawer.Screen
              name="evento/details"
              options={{ title: "Sobre o Evento" }}
            />
<Drawer.Screen
              name="newEvento/eventosCadastrado"
              options={{ title: "Eventos Cadastrados" }}
            />

            <Drawer.Screen
              name="newEvento/criadorEvento"
              options={{ title: "Criar Evento" }}
            />
            <Drawer.Screen
              name="newEvento/editarEvento"
              options={{ title: "Editar Evento" }}
            />
            
            <Drawer.Screen
              name="newEvento/locaisCadastrados"
              options={{ title: "Locais Cadastrados" }}
            />
            <Drawer.Screen
              name="evento/categorias"
              options={{ title: "Categorias" }}
            />
            <Drawer.Screen name="newEvento/cadastrarMapa" 
            options={{ title: "Cadastrar Mapa" }} />
           

        {/* Rotas APENAS para ADMIN */}
        {role === "ADMIN" && (
          <>
            
          </>
        )}
      </Drawer>
    </AuthProvider>
  );
}
