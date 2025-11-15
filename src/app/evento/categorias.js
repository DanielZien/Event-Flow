import { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";

const CATEGORIAS_PADRAO = [
  { id: "1", nome: "Show" },
  { id: "2", nome: "Workshop" },
  { id: "3", nome: "Palestra" },
];

export default function Categorias() {
  const [categorias, setCategorias] = useState([]);
  const [novaCategoria, setNovaCategoria] = useState("");
  const [loading, setLoading] = useState(true);

  // Carregar categorias ao focar na tela
  useFocusEffect(
    useCallback(() => {
      carregarCategorias();
    }, [])
  );

  // Carregar categorias do AsyncStorage
  const carregarCategorias = async () => {
    try {
      setLoading(true);
      const categoriasSalvas = await AsyncStorage.getItem("categorias");
      
      if (categoriasSalvas) {
        setCategorias(JSON.parse(categoriasSalvas));
      } else {
        // Se não houver categorias salvas, usar as padrão
        await AsyncStorage.setItem("categorias", JSON.stringify(CATEGORIAS_PADRAO));
        setCategorias(CATEGORIAS_PADRAO);
      }
    } catch (error) {
      console.error("Erro ao carregar categorias:", error);
      Alert.alert("Erro", "Não foi possível carregar as categorias");
    } finally {
      setLoading(false);
    }
  };

  // Adicionar nova categoria
  const adicionarCategoria = async () => {
    if (novaCategoria.trim() === "") {
      return Alert.alert("Campo vazio", "Digite um nome para a categoria");
    }

    // Verificar se categoria já existe
    if (categorias.some(cat => cat.nome.toLowerCase() === novaCategoria.toLowerCase())) {
      return Alert.alert("Categoria duplicada", "Esta categoria já existe");
    }

    try {
      const nova = { id: Date.now().toString(), nome: novaCategoria };
      const novasList = [...categorias, nova];
      
      await AsyncStorage.setItem("categorias", JSON.stringify(novasList));
      setCategorias(novasList);
      setNovaCategoria("");
      
      Alert.alert("Sucesso", "Categoria adicionada com sucesso!");
    } catch (error) {
      console.error("Erro ao adicionar categoria:", error);
      Alert.alert("Erro", "Não foi possível adicionar a categoria");
    }
  };

  // Remover categoria
  const removerCategoria = (id, nome) => {
    Alert.alert("Remover Categoria", `Tem certeza que deseja remover "${nome}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Remover",
        style: "destructive",
        onPress: async () => {
          try {
            const novasList = categorias.filter((cat) => cat.id !== id);
            await AsyncStorage.setItem("categorias", JSON.stringify(novasList));
            setCategorias(novasList);
            Alert.alert("Sucesso", "Categoria removida com sucesso!");
          } catch (error) {
            console.error("Erro ao remover categoria:", error);
            Alert.alert("Erro", "Não foi possível remover a categoria");
          }
        },
      },
    ]);
  };

  // Restaurar categorias padrão
  const restaurarPadrao = async () => {
    Alert.alert("Restaurar Padrão", "Deseja restaurar as categorias padrão?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Restaurar",
        style: "destructive",
        onPress: async () => {
          try {
            await AsyncStorage.setItem("categorias", JSON.stringify(CATEGORIAS_PADRAO));
            setCategorias(CATEGORIAS_PADRAO);
            Alert.alert("Sucesso", "Categorias restauradas ao padrão!");
          } catch (error) {
            console.error("Erro ao restaurar:", error);
            Alert.alert("Erro", "Não foi possível restaurar as categorias");
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: "center", marginTop: 20 }}>Carregando categorias...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Gerenciar Categorias</Text>

      {/* Campo para adicionar nova categoria */}
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          placeholder="Nova categoria"
          value={novaCategoria}
          onChangeText={setNovaCategoria}
        />
        <TouchableOpacity style={styles.addButton} onPress={adicionarCategoria}>
          <Text style={styles.addText}>Adicionar</Text>
        </TouchableOpacity>
      </View>

      {/* Botão restaurar padrão */}
      <TouchableOpacity style={styles.restoreButton} onPress={restaurarPadrao}>
        <Text style={styles.restoreText}>🔄 Restaurar Padrão</Text>
      </TouchableOpacity>

      {/* Lista de categorias */}
      <FlatList
        data={categorias}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.itemRow}>
            <Text style={styles.itemText}>{item.nome}</Text>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => removerCategoria(item.id, item.nome)}
            >
              <Text style={styles.deleteText}>✖</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={{ padding: 20, alignItems: "center" }}>
            <Text style={{ color: "#999" }}>Nenhuma categoria cadastrada</Text>
          </View>
        }
      />

      {/* Total de categorias */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Total: {categorias.length} categoria{categorias.length !== 1 ? "s" : ""}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  header: { fontSize: 22, fontWeight: "bold", marginBottom: 20, color: "#08007B" },
  row: { flexDirection: "row", marginBottom: 10 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
  },
  addButton: {
    backgroundColor: "#08007B",
    paddingHorizontal: 16,
    justifyContent: "center",
    borderRadius: 8,
    marginLeft: 10,
  },
  addText: { color: "#fff", fontWeight: "bold" },
  restoreButton: {
    backgroundColor: "#f0f0f0",
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  restoreText: { color: "#666", fontWeight: "bold" },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  itemText: { fontSize: 16, color: "#333" },
  deleteButton: { 
    backgroundColor: "#e53935", 
    paddingHorizontal: 12, 
    paddingVertical: 6,
    borderRadius: 6 
  },
  deleteText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  footer: {
    padding: 15,
    borderTopWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
  },
  footerText: { color: "#666", fontSize: 14 },
});