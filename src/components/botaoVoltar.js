import React, { useEffect, useState } from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function BotaoVoltar() {
  const router = useRouter();
  const [role, setRole] = useState(null);

  useEffect(() => {
    async function loadUser() {
      const userData = await AsyncStorage.getItem("user");
      if (userData) {
        const user = JSON.parse(userData);
        setRole(user.role);
      }
    }
    loadUser();
  }, []);

  const voltar = () => {
    if (role === "ADMIN") {
      router.replace("/newEvento/eventosCadastrado");
    } else {
      router.replace("/evento/home");
    }
  };

  return (
    <TouchableOpacity style={styles.backButton} onPress={voltar}>
      <Text style={styles.backText}>←</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backButton: {
    position: "absolute",
    top: 20,
    left: 20,
    backgroundColor: "#eee",
    padding: 6,
    borderRadius: 20,
    elevation: 2, // sombra leve no Android
  },
  backText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "bold",
  },
});