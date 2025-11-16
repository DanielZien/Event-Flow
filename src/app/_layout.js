import React, { useEffect, useState } from "react";
import { Drawer } from "expo-router/drawer";
import { AuthProvider } from "./temporario/authContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View, Text, Image, TouchableOpacity, ActivityIndicator } from "react-native";
import { router, useRouter } from "expo-router";
import { sessionService } from "../services/sessionService";
import { api } from "../services/api2";

function CustomDrawerContent(props) {
  const { navigation } = props;
  const [user, setUser] = useState(null);
  const [user2, setUser2] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  // Função para buscar a URI da imagem salva localmente
  const getLocalPhotoUri = async () => {
    // Busca a URI na chave que definimos na tela de Cadastro
    const localUri = await AsyncStorage.getItem("fotoDePerfilLocal");
    return localUri;
  };

  useEffect(() => {
    let mounted = true;
    
    // Assinatura para receber atualizações do estado de autenticação
    const unsubscribe = sessionService.subscribeToAuthChanges(async (currentUser) => {
      try {
        if (!currentUser) {
          if (mounted) {
            setUser(null);
            setRole(null);
            setLoading(false);
          }
          return;
        } else{
          console.log('Dados não encontrado!r')
        }

        // Tenta carregar a URI local
        const localPhotoUri = await getLocalPhotoUri();
        let mergedUser = { ...currentUser };
        
        // Se a API não retornou imagem, mas temos uma URI local, a usamos
        if (!currentUser.imagem && localPhotoUri) {
          mergedUser.imagem = localPhotoUri;
          
          // Opcional: Atualiza a chave 'user' no AsyncStorage com a imagem local para consistência
          const rawUser = await AsyncStorage.getItem("user");
          const storedUser = rawUser ? JSON.parse(rawUser) : {};
          
          await AsyncStorage.setItem(
            "user", 
            JSON.stringify({ ...storedUser, ...currentUser, imagem: localPhotoUri })
          );
        }

        if (mounted) {
          let response = await api.get('/users/profile')
          let usuarioData = response
          setUser2(usuarioData.data)
          setUser(mergedUser);
          setRole(mergedUser.role);
          setLoading(false);
        }

      } catch (err) {
        console.warn("Erro ao processar user no drawer:", err);
        if (mounted) {
          setUser(currentUser);
          setRole(currentUser?.role);
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  // Handle logout
  const handleLogout = async () => {
    if (user) {
      await sessionService.registrarSaida(user.id);
    }
    // Remove os tokens e as chaves de usuário
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");
    await AsyncStorage.removeItem("fotoDePerfilLocal"); // <--- Limpa a foto local também!
    setUser(null);
    setRole(null);
    navigation.navigate("login/index");
  };

  if (loading) {
    return (
      <View style={{ flex: 1, padding: 20, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#08007B" />
        <Text style={{ color: "gray", marginTop: 10 }}>Carregando menu...</Text>
      </View>
    );
  }

  // Define a foto de perfil: se user.imagem for uma string (URI local ou URL), usa ela; senão, usa a logo padrão.
  const fotoPerfil = user && typeof user.imagem === "string" && user.imagem.length > 0
    ? { uri: user.imagem }
    : require("../imgs/logo.webp");
      
  return (
    <View style={{ flex: 1, padding: 20 }}>
      {/* Cabeçalho */}
      <View style={{ alignItems: "center", marginBottom: 20 }}>
        <Image
          source={fotoPerfil}
          style={{ width: 80, height: 80, borderRadius: 40 }}
          defaultSource={require("../imgs/logo.webp")}
        />
        

        <Text style={{ fontSize: 16, fontWeight: "bold", marginTop: 10 }}>Olá, {user2 ? user2.nome : "Usuário"}</Text>
        <Text style={{ fontSize: 14, color: "gray", marginTop: 4 }}>
          {user ? user.email : "Usuário"}
        </Text>
        {user2 && user2.nome && (
          <Text style={{ fontSize: 12, color: "#08007B", fontWeight: "bold", marginTop: 2 }}>
            {user2 ? user2.nome : 'Usuário'}
          </Text>
        )}
      </View>

      {/* Opções comuns */}
      {/*<TouchableOpacity style={{ marginVertical: 10 }} onPress={() => navigation.navigate("evento/conta")}>
        <Text style={{ fontSize: 16 }}>Minha Conta</Text>
      </TouchableOpacity>*/}

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

// ----------------------------------------------------------------------------------

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
        <Drawer.Screen name="evento/details" options={{ title: "Sobre o Evento" }} />
        <Drawer.Screen name="newEvento/eventosCadastrado" options={{ title: "Eventos Cadastrados" }} />
        <Drawer.Screen name="newEvento/criadorEvento" options={{ title: "Criar Evento" }} />
        <Drawer.Screen name="newEvento/editarEvento" options={{ title: "Editar Evento" }} />
        <Drawer.Screen name="newEvento/locaisCadastrados" options={{ title: "Locais Cadastrados" }} />
        <Drawer.Screen name="evento/categorias" options={{ title: "Categorias" }} />
        <Drawer.Screen name="newEvento/cadastrarMapa" options={{ title: "Cadastrar Mapa" }} />
      </Drawer>
    </AuthProvider>
  );
}