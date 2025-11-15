import React, { useEffect, useState, useRef } from "react";
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, Image, ActivityIndicator } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useRouter, Link, useFocusEffect } from "expo-router";
import { styles } from "../../styles/estilosHome";
import { api } from "../../services/api2";
import { useCallback } from "react";

const FALLBACK_COORDINATE = {
  // Rio Branco, Acre (aprox.)
  latitude: -9.97499,
  longitude: -67.82430,
};

export default function Home() {
  const [expanded, setExpanded] = useState(false);
  const [eventos, setEventos] = useState([]);
  const [eventosFiltrados, setEventosFiltrados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [markerSelecionado, setMarkerSelecionado] = useState(null);
  const [mapCenter, setMapCenter] = useState(FALLBACK_COORDINATE);
  const [mapRegion, setMapRegion] = useState({
    latitude: FALLBACK_COORDINATE.latitude,
    longitude: FALLBACK_COORDINATE.longitude,
    latitudeDelta: 0.21,
    longitudeDelta: 0.21,
  });
  const mapRef = useRef(null);
  const router = useRouter();

  // Carregar eventos ao focar na tela
  useFocusEffect(
    useCallback(() => {
      carregarEventos();
    }, [])
  );

  // Tenta extrair coords de uma string (ex: "lat, lng" ou "lat lng")
  const parseCoordsFromLocalizacao = (loc) => {
    if (!loc || typeof loc !== "string") return null;
    // procura dois números (com sinal opcional e decimais), separados por qualquer não-numérico
    const re = /(-?\d+(?:\.\d+)?)[^\d-.-]+(-?\d+(?:\.\d+)?)/;
    const m = loc.match(re);
    if (m && m[1] && m[2]) {
      const lat = parseFloat(m[1]);
      const lng = parseFloat(m[2]);
      if (!isNaN(lat) && !isNaN(lng)) return { latitude: lat, longitude: lng };
    }
    return null;
  };

  async function carregarEventos() {
    try {
      setLoading(true);
      const response = await api.get("/events");
      const eventosData = response.data.events || [];

      // normalizar latitude/longitude (podem vir como string em localizacao)
      const normalizados = eventosData.map((ev) => {
        const evCopy = { ...ev };
        // se já vier campos numéricos, usar
        let lat = evCopy.latitude !== undefined && evCopy.latitude !== null ? Number(evCopy.latitude) : NaN;
        let lng = evCopy.longitude !== undefined && evCopy.longitude !== null ? Number(evCopy.longitude) : NaN;

        if (isNaN(lat) || isNaN(lng)) {
          // tentar extrair de localizacao
          const parsed = parseCoordsFromLocalizacao(evCopy.localizacao);
          if (parsed) {
            lat = parsed.latitude;
            lng = parsed.longitude;
          } else {
            lat = NaN;
            lng = NaN;
          }
        }

        // atribuir apenas se válido
        evCopy.latitude = !isNaN(lat) ? lat : null;
        evCopy.longitude = !isNaN(lng) ? lng : null;
        return evCopy;
      });

      setEventos(normalizados);
      setEventosFiltrados(normalizados);

      // definir centro do mapa: primeiro evento com coords válidas ou fallback
      const coordsList = normalizados.filter((e) => e.latitude !== null && e.longitude !== null);
      if (coordsList.length > 0) {
        const lats = coordsList.map(c => Number(c.latitude));
        const lngs = coordsList.map(c => Number(c.longitude));
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);
        const centerLat = (minLat + maxLat) / 2;
        const centerLng = (minLng + maxLng) / 2;
        const latDelta = Math.max(0.02, (maxLat - minLat) * 1.4);
        const lngDelta = Math.max(0.02, (maxLng - minLng) * 1.4);

        setMapCenter({ latitude: centerLat, longitude: centerLng });
        setMapRegion({ latitude: centerLat, longitude: centerLng, latitudeDelta: latDelta, longitudeDelta: lngDelta });
        // tentar animar (se já tiver ref do mapa)
        if (mapRef.current && mapRef.current.animateToRegion) {
          mapRef.current.animateToRegion({ latitude: centerLat, longitude: centerLng, latitudeDelta: latDelta, longitudeDelta: lngDelta }, 500);
        }
      } else {
        setMapCenter(FALLBACK_COORDINATE);
        setMapRegion({ latitude: FALLBACK_COORDINATE.latitude, longitude: FALLBACK_COORDINATE.longitude, latitudeDelta: 0.21, longitudeDelta: 0.21 });
      }
    } catch (error) {
      console.error("Erro ao carregar eventos:", error.response?.data || error.message);
      setEventos([]);
      setEventosFiltrados([]);
      setMapCenter(FALLBACK_COORDINATE);
    } finally {
      setLoading(false);
    }
  }

  // Extrair imagem do evento (primeira imagem da lista separada por |)
  const getEventoImage = (imagem) => {
    if (!imagem) {
      return "https://agenciafivemira.com.br/wp-content/uploads/2025/02/evento-corporativo-foto-de-capa.jpg";
    }
    const imagensArray = imagem.split("|");
    return imagensArray[0] || "https://agenciafivemira.com.br/wp-content/uploads/2025/02/evento-corporativo-foto-de-capa.jpg";
  };

  // Filtrar eventos por pesquisa
  const handleSearch = (text) => {
    setSearchText(text);
    setMarkerSelecionado(null); // Limpar seleção de marker ao pesquisar

    if (text.trim() === "") {
      setEventosFiltrados(eventos);
    } else {
      const filtered = eventos.filter((evento) =>
        (evento.titulo || "").toLowerCase().includes(text.toLowerCase()) ||
        (evento.categoria || "").toLowerCase().includes(text.toLowerCase()) ||
        (evento.descricao || "").toLowerCase().includes(text.toLowerCase())
      );
      setEventosFiltrados(filtered);
    }
  };

  // Comparador de coordenadas com tolerância
  const coordsEqual = (aLat, aLng, bLat, bLng, eps = 0.00005) => {
    if (aLat == null || aLng == null || bLat == null || bLng == null) return false;
    return Math.abs(aLat - bLat) <= eps && Math.abs(aLng - bLng) <= eps;
  };

  // Filtrar eventos ao clicar em um marker
  const handleMarkerPress = (evento) => {
    const lat = evento.latitude;
    const lng = evento.longitude;
    setMarkerSelecionado(`${lat}_${lng}`); // id visual do marker
    setSearchText(""); // Limpar busca ao selecionar marker

    // Encontrar todos os eventos na mesma localização (com tolerância)
    const eventosMesmaLocalizacao = eventos.filter((e) => coordsEqual(e.latitude, e.longitude, lat, lng));
    setEventosFiltrados(eventosMesmaLocalizacao);
  };

  // Limpar filtros
  const handleLimparFiltros = () => {
    setSearchText("");
    setMarkerSelecionado(null);
    setEventosFiltrados(eventos);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      {!expanded && (
        <View style={styles.header}>
          <Text style={styles.welcome}>Bem vindo ao Aplicativo</Text>

          {/* Barra de pesquisa */}
          <TextInput
            style={styles.search}
            placeholder="Pesquise Eventos, Show e etc..."
            value={searchText}
            onChangeText={handleSearch}
            placeholderTextColor="#999"
          />

          <Text style={styles.sectionTitle}>
            <Text style={styles.textDestaq}>Explore</Text> os Eventos
          </Text>

          {/* Mostrar filtro ativo */}
          {(searchText.trim() !== "" || markerSelecionado) && (
            <View style={styles.filterInfo}>
              <Text style={styles.filterText}>
                {searchText.trim() !== "" ? `Resultados para: "${searchText}"` : "Eventos no local selecionado"}
              </Text>
              <TouchableOpacity onPress={handleLimparFiltros}>
                <Text style={styles.clearFilterText}>Limpar Filtros</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.divider} />
        </View>
      )}

      {/* Mapa */}
      {!expanded ? (
        <View style={styles.mapaCard}>
          <MapView
            ref={mapRef}
            style={{ flex: 1 }}
            region={mapRegion}
            onPress={() => setExpanded(true)} // usar onPress do MapView (sem TouchableOpacity)
            onRegionChangeComplete={(r) => setMapRegion(r)}
          >
            {/* Um marker por evento (cada evento gera seu próprio marker) */}
            {eventos
              .filter((ev) => ev.latitude !== null && ev.longitude !== null)
              .map((evento) => {
                const lat = Number(evento.latitude);
                const lng = Number(evento.longitude);
                if (isNaN(lat) || isNaN(lng)) return null;
                return (
                  <Marker
                    key={evento.id?.toString() || `${lat}_${lng}`}
                    coordinate={{ latitude: lat, longitude: lng }}
                    title={evento.titulo}
                    description={evento.localizacao}
                    onPress={() => handleMarkerPress(evento)}
                    pinColor={markerSelecionado === `${lat}_${lng}` ? "#FF0000" : "#08007B"}
                  />
                );
              })}
          </MapView>

          {/* Badge mostrando quantidade de eventos */}
          <View style={styles.eventCountBadge}>
            <Text style={styles.eventCountText}>📍 {eventos.length} eventos</Text>
          </View>
        </View>
      ) : (
        <View style={styles.mapaFull}>
          <MapView
            ref={mapRef}
            style={{ flex: 1 }}
            region={mapRegion}
            onPress={() => { /* opcional: capturar toques no mapa expanded */ }}
            onRegionChangeComplete={(r) => setMapRegion(r)}
          >
            {eventos
              .filter((ev) => ev.latitude !== null && ev.longitude !== null)
              .map((evento) => {
                const lat = Number(evento.latitude);
                const lng = Number(evento.longitude);
                if (isNaN(lat) || isNaN(lng)) return null;
                return (
                  <Marker
                    key={evento.id?.toString() || `${lat}_${lng}`}
                    coordinate={{ latitude: lat, longitude: lng }}
                    title={evento.titulo}
                    description={evento.localizacao}
                    onPress={() => handleMarkerPress(evento)}
                    pinColor={markerSelecionado === `${lat}_${lng}` ? "#FF0000" : "#08007B"}
                  />
                );
              })}
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
            <ActivityIndicator size="large" color="#08007B" style={{ marginTop: 20 }} />
          ) : eventosFiltrados.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Nenhum evento encontrado</Text>
              <TouchableOpacity style={styles.resetButton} onPress={handleLimparFiltros}>
                <Text style={styles.resetText}>Ver Todos os Eventos</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.resultCount}>
                {eventosFiltrados.length} evento{eventosFiltrados.length !== 1 ? "s" : ""} encontrado{eventosFiltrados.length !== 1 ? "s" : ""}
              </Text>
              <FlatList
                data={eventosFiltrados}
                keyExtractor={(item) => item.id.toString()}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <View style={styles.card}>
                    {/* Imagem no topo */}
                    <Image
                      source={{
                        uri: getEventoImage(item.imagem),
                      }}
                      style={styles.image}
                      onError={() => console.log("Erro ao carregar imagem do evento:", item.id)}
                    />

                    {/* Badge de categoria */}
                    {item.categoria && (
                      <View style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>{item.categoria}</Text>
                      </View>
                    )}

                    {/* Conteúdo abaixo da imagem */}
                    <View style={styles.info}>
                      {/* Linha título + data */}
                      <View style={styles.row}>
                        <Text style={[styles.title, { flex: 1 }]} numberOfLines={2}>
                          {item.titulo}
                        </Text>
                      </View>

                      {/* Data e Hora */}
                      <Text style={styles.date}>
                        📅 {new Date(item.data).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                        {" • "}
                        ⏰ {new Date(item.hora_inicio).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>

                      {/* Localização */}
                      {item.localizacao && (
                        <Text style={styles.location} numberOfLines={1}>
                          📍 {item.localizacao}
                        </Text>
                      )}

                      {/* Linha preço + botão */}
                      <View style={styles.row}>
                        <Text style={styles.price}>
                          {item.preco && item.preco > 0 ? `R$ ${item.preco.toFixed(2)}` : "Gratuito"}
                        </Text>
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
            </>
          )}
        </View>
      )}
    </View>
  );
}