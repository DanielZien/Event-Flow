import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, Image, ActivityIndicator } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useRouter, Link } from "expo-router";
import { styles } from "../../styles/estilosHome";
import { api } from "../../services/api2"; // seu Axios configurado

const coordinate = {
  latitude: -9.976227513833033,
  longitude: -67.84134974624467,
};

export default function Home() {
  const [expanded, setExpanded] = useState(false);
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <View style={styles.container}>
      {/* Header */}
      {!expanded && (
        <View style={styles.header}>
          <Text style={styles.welcome}>Bem vindo ao Aplicativo</Text>
          <TextInput style={styles.search} placeholder="Pesquise Eventos, Show e etc..." />
          <Text style={styles.sectionTitle}>
            <Text style={styles.textDestaq}>Explore</Text> os Eventos
          </Text>
          <View style={styles.divider} />
        </View>
      )}

      {/* Mapa */}
      {!expanded ? (
        <TouchableOpacity activeOpacity={0.9} style={styles.mapaCard} onPress={() => setExpanded(true)}>
          <MapView
            style={{ flex: 1 }}
            initialRegion={{
              latitude: coordinate.latitude,
              longitude: coordinate.longitude,
              latitudeDelta: 0.210,
              longitudeDelta: 0.210,
            }}
          >
            <Marker coordinate={coordinate} title="Loja do Daniel S" description="Casa do Samuel, AC" />
          </MapView>
        </TouchableOpacity>
      ) : (
        <View style={styles.mapaFull}>
          <MapView
            style={{ flex: 1 }}
            initialRegion={{
              latitude: coordinate.latitude,
              longitude: coordinate.longitude,
              latitudeDelta: 0.210,
              longitudeDelta: 0.210,
            }}
          >
            <Marker coordinate={coordinate} title="Loja do Daniel S" description="Casa do Samuel, AC" />
          </MapView>

          {/* Botão flutuante para fechar */}
          <TouchableOpacity style={styles.closeButton} onPress={() => setExpanded(false)}>
            <Text style={styles.closeText}>✖</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Lista de eventos */}
      {!expanded && (
        <View style={{ flex: 1, paddingHorizontal: 16, marginTop: 30 }}>
          {loading ? (
            <ActivityIndicator size="large" color="#000" style={{ marginTop: 20 }} />
          ) : (
            <FlatList
              data={eventos}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <View style={styles.card}>
                  {/* Imagem no topo */}
                  <Image
                    source={{
                      uri: "https://agenciafivemira.com.br/wp-content/uploads/2025/02/evento-corporativo-foto-de-capa.jpg",
                    }}
                    style={styles.image}
                  />

                  {/* Conteúdo abaixo da imagem */}
                  <View style={styles.info}>
                    {/* Linha título + data */}
                    <View style={styles.row}>
                      <Text style={styles.title}>{item.titulo}</Text>
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

                    {/* Tipo do evento (por enquanto não tem categoria) */}
                    <Text style={styles.type}>Tipo: {item.tipo || "Não informado"}</Text>

                    {/* Linha preço + botão */}
                    <View style={styles.row}>
                      <Text style={styles.price}>Ingresso: {item.preco || "Gratuito"}</Text>
                      <Link
                        href={{
                          pathname: "/evento/details",
                          params: { evento: JSON.stringify(item) },
                        }}
                        style={styles.detailsButton}
                      >
                        <Text style={styles.detailsText}>Mais Detalhes</Text>
                      </Link>
                    </View>
                  </View>
                </View>
              )}
            />
          )}
        </View>
      )}
    </View>
  );
}