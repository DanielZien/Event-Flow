import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, Image, ActivityIndicator, Alert } from 'react-native';
import { useState, useEffect } from "react";
import { useRouter } from 'expo-router';
import { api } from "../../services/api2";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";



export default function NewEvento() {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const FALLBACK_IMAGE = "https://agenciafivemira.com.br/wp-content/uploads/2025/02/evento-corporativo-foto-de-capa.jpg";

  // helper para retornar a primeira imagem da string concatenada
  const getFirstImage = (imagem) => {
    if (!imagem) return FALLBACK_IMAGE;
    if (typeof imagem !== "string") return FALLBACK_IMAGE;
    // suporta separador '|' ou ',' ou apenas uma URL
    const sep = imagem.includes("|") ? "|" : (imagem.includes(",") ? "," : null);
    const parts = sep ? imagem.split(sep) : [imagem];
    const first = parts.map(p => p.trim()).filter(Boolean)[0];
    return first || FALLBACK_IMAGE;
  };

  useFocusEffect(
    useCallback(() => {
      async function carregarEventos() {
        try {
          const response = await api.get("/events");
          setEventos(response.data.events);
        } catch (error) {
          console.error("Erro ao carregar eventos:", error.response?.data || error.message);
        }
      }
      carregarEventos();
    }, [])
  );

  // Buscar eventos da API
  useEffect(() => {
    async function carregarEventos() {
      try {
        const response = await api.get("/events");
        setEventos(response.data.events); // pega o array da API
      } catch (error) {
        console.error("Erro ao carregar eventos:", error.response?.data || error.message);
      } finally {
        setLoading(false);
      }
    }
    carregarEventos();
  }, []);

  // Funções de exemplo
  const excluirEvento = (id) => {
    Alert.alert("Excluir evento", "Tem certeza que deseja excluir este evento?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/events/${id}`);
            setEventos((prev) => prev.filter((e) => e.id !== id));
          } catch (error) {
            console.error("Erro ao excluir evento:", error.response?.data || error.message);
            Alert.alert("Erro", "Não foi possível excluir o evento.");
          }
        },
      },
    ]);
  };

  const editarEvento = (id) => {
    router.push({ pathname: "/newEvento/editarEvento", params: { id: item.id } })
  };

  const criarEvento = () => {
    router.push("/newEvento/criadorEvento");
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Gerenciar Eventos</Text>
        <TextInput style={styles.search} placeholder="Pesquise Eventos..." />
        <TouchableOpacity style={styles.createButton} onPress={criarEvento}>
          <Text style={styles.createText}>Criar Evento +</Text>
        </TouchableOpacity>
        <Text style={styles.subtitle}>
          Mostrando {eventos.length} de {eventos.length} Eventos
        </Text>
      </View>

      {/* Lista de eventos */}
      {loading ? (
        <ActivityIndicator size="large" color="#000" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={eventos}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.card}>
              {/* Imagem com botão Excluir flutuante */}
              <View>
                <Image
                  source={{
                    uri: getFirstImage(item.imagem),
                  }}
                  style={styles.image}
                />
                <TouchableOpacity style={styles.deleteButton} onPress={() => excluirEvento(item.id)}>
                  <Text style={styles.deleteText}>Excluir Evento ✖</Text>
                </TouchableOpacity>
              </View>

              {/* Informações */}
              <View style={styles.info}>
                {/* Linha título + data */}
                <View style={styles.row}>
                  <Text style={styles.eventTitle}>{item.titulo}</Text>
                  <Text style={styles.date}>
                    {new Date(item.data).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>

                {/* Tipo (por enquanto não tem categoria) */}
                <Text style={styles.type}>Tipo: {item.tipo || "Não informado"}</Text>

                {/* Linha ingresso + botões */}
                <View style={styles.rowBottom}>
                  <View>
                    <Text style={styles.ingressoLabel}>Ingresso</Text>
                    <Text style={styles.price}>{item.preco || "Gratuito"}</Text>
                  </View>

                  <View style={styles.actions}>
                    <TouchableOpacity style={[styles.actionButton, styles.edit]} onPress={() => router.push({ pathname: "/newEvento/editarEvento", params: { id: item.id } })}>
                      <Text style={styles.buttonText}>Editar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionButton, styles.view]}
                      onPress={() => router.push({ pathname: "/evento/details", params: { evento: JSON.stringify(item) } })}
                    >
                      <Text style={styles.buttonText}>Ver</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
  header: { marginBottom: 20 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  search: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  createButton: {
    backgroundColor: "#08007B",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  createText: { color: "#fff", fontWeight: "bold" },
  subtitle: { fontSize: 14, color: "gray", marginBottom: 10 },
  card: {
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    marginBottom: 15,
    overflow: "hidden",
    elevation: 2,
  },
  image: { width: "100%", height: 150 },
  info: { padding: 10 },
  eventTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 5, color: "#08007B" },
  type: { fontSize: 14, color: "#555" },
  date: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#08007B",
    marginTop: 4,
  },
  price: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#e53935",
    marginTop: 6,
  },
  deleteButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#e53935",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  deleteText: {
    color: "#fff",
    fontWeight: "bold",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginLeft: 8,
  },
  edit: { backgroundColor: "#fbc02d" },
  view: { backgroundColor: "#08007B" },
  buttonText: { color: "#fff", fontWeight: "bold" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  rowBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 10,
  },

  ingressoLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },

  price: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginTop: 2,
  },
});