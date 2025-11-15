import { View, Text, Image, ScrollView, TouchableOpacity } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useLocalSearchParams, useRouter } from "expo-router";
import { styles } from "../../styles/detailsStyle";
import BotaoVoltar from "../../components/botaoVoltar"

export default function Details() {
    const { evento } = useLocalSearchParams();
    const data = JSON.parse(evento);
    const router = useRouter();

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
                {/* Imagem */}
                <Image
                    source={{
                        uri:
                            data.imagem ||
                            "https://agenciafivemira.com.br/wp-content/uploads/2025/02/evento-corporativo-foto-de-capa.jpg",
                    }}
                    style={styles.image}
                />

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