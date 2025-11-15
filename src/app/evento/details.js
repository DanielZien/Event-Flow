import React, { useEffect, useRef, useState } from "react";
import { View, Text, Image, ScrollView, TouchableOpacity, FlatList, Dimensions } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useLocalSearchParams, useRouter } from "expo-router";
import { styles } from "../../styles/detailsStyle";
import BotaoVoltar from "../../components/botaoVoltar"

export default function Details() {
    const { evento } = useLocalSearchParams();
    const data = JSON.parse(evento);
    const router = useRouter();

    const FALLBACK_IMAGE = "https://agenciafivemira.com.br/wp-content/uploads/2025/02/evento-corporativo-foto-de-capa.jpg";
    // Parse imagens (suporta string concatenada com '|' ou ',' ou array)
    const imagensArray = (() => {
        if (!data.imagem) return [FALLBACK_IMAGE];
        if (Array.isArray(data.imagem)) return data.imagem;
        if (typeof data.imagem === "string") {
            const sep = data.imagem.includes("|") ? "|" : (data.imagem.includes(",") ? "," : null);
            const parts = sep ? data.imagem.split(sep) : [data.imagem];
            const cleaned = parts.map(p => p.trim()).filter(Boolean);
            return cleaned.length ? cleaned : [FALLBACK_IMAGE];
        }
        return [String(data.imagem)];
    })();

    const flatListRef = useRef(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const windowWidth = Dimensions.get("window").width;

    // Auto-play carousel
    useEffect(() => {
        if (!imagensArray.length) return;
        const interval = setInterval(() => {
            const next = (activeIndex + 1) % imagensArray.length;
            flatListRef.current?.scrollToIndex({ index: next, animated: true });
            setActiveIndex(next);
        }, 3500);
        return () => clearInterval(interval);
    }, [activeIndex, imagensArray.length]);

    const onViewableItemsChanged = useRef(({ viewableItems }) => {
        if (viewableItems && viewableItems[0]) {
            setActiveIndex(viewableItems[0].index);
        }
    }).current;

    const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 50 });

    // Coordenadas: por enquanto fixas, depois pode usar geocoding do endereço
    const coordinate = {
        latitude: -9.9762275,
        longitude: -67.8413497,
    };

    return (
        <ScrollView style={styles.container}>
            {/* Botão Voltar */} 
            <View style={{flex:1}}><BotaoVoltar /></View>
            

            {/* Card único */}
            <View style={styles.card}>
                {/* Carousel de imagens */}
                <View style={{ width: "100%", height: 200, overflow: "hidden" }}>
                    <FlatList
                        ref={flatListRef}
                        data={imagensArray}
                        keyExtractor={(item, idx) => `${idx}-${item}`}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        renderItem={({ item }) => (
                            <Image
                                source={{ uri: item || FALLBACK_IMAGE }}
                                style={[styles.image, { width: windowWidth }]}
                                resizeMode="cover"
                            />
                        )}
                        onViewableItemsChanged={onViewableItemsChanged}
                        viewabilityConfig={viewConfigRef.current}
                        getItemLayout={(_, index) => ({ length: windowWidth, offset: windowWidth * index, index })}
                    />
                    {/* indicadores simples */}
                    <View style={{ position: "absolute", bottom: 8, left: 0, right: 0, flexDirection: "row", justifyContent: "center" }}>
                        {imagensArray.map((_, i) => (
                            <View key={i} style={{
                                width: 8, height: 8, borderRadius: 4, margin: 4,
                                backgroundColor: i === activeIndex ? "#fff" : "rgba(255,255,255,0.5)"
                            }} />
                        ))}
                    </View>
                </View>
 
                 {/* Título */}
                 <Text style={styles.title}>{data.titulo}</Text>
 
                 {/* Data formatada */}
                 <Text style={styles.date}>
                     📅{" "}
                     {new Date(data.data).toLocaleDateString("pt-BR", {
                         day: "2-digit",
                         month: "long",
                         year: "numeric",
                         hour: "2-digit",
                         minute: "2-digit",
                     })}
                 </Text>
 
                 {/* Descrição */}
                 <Text style={styles.description}>{data.descricao}</Text>
                 <View style={styles.divider} />
 
                 {/* Informações do Evento */}
                 <Text style={styles.sectionTitle}>Informações do Evento</Text>
                 <View style={styles.row}>
                     <Text style={styles.info}>📍 Localização: {data.localizacao}</Text>
                 </View>
 
                 {/* Valor do ingresso */}
                 <TouchableOpacity style={styles.priceButton}>
                     <View style={styles.rowBetween}>
                         <Text style={styles.priceLabel}>Valor Ingresso</Text>
                         <Text style={styles.priceText}>{data.preco || "Gratuito"}</Text>
                     </View>
                 </TouchableOpacity>
 
                 {/* Localização no mapa */}
                 <View style={styles.sectionHeader}>
                     <Text style={styles.sectionTitle}>📍 Mapa</Text>
                     <View style={styles.sectionLine} />
                 </View>
 
                 <View style={styles.mapContainer}>
                     <MapView
                         style={{ flex: 1 }}
                         initialRegion={{
                             latitude: coordinate.latitude,
                             longitude: coordinate.longitude,
                             latitudeDelta: 0.01,
                             longitudeDelta: 0.01,
                         }}
                     >
                         <Marker coordinate={coordinate} title={data.titulo} description={data.localizacao} />
                     </MapView>
                 </View>
 
                 {/* Organizador */}
                 {data.creator && (
                     <>
                         <Text style={styles.sectionTitle}>Organizador</Text>
                         <Text style={styles.info}>👤 {data.creator.nome}</Text>
                         <Text style={styles.info}>📧 {data.creator.email}</Text>
                         <Text style={styles.info}>📱 {data.creator.telefone}</Text>
                     </>
                 )}
             </View>
         </ScrollView>
     );
}