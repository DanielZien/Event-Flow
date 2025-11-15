import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from "react-native";
import { useState, useEffect, useRef } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import MapView, { Marker } from "react-native-maps";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";

export default function CadastrarMapa() {
    const [titulo, setTitulo] = useState("");
    const [rua, setRua] = useState("");
    const [numero, setNumero] = useState("");
    const [cidade, setCidade] = useState("");
    const [estado, setEstado] = useState("");
    const [cep, setCep] = useState("");
    const [latitude, setLatitude] = useState(-9.97);
    const [longitude, setLongitude] = useState(-67.84);
    const [marker, setMarker] = useState({ latitude: -9.97, longitude: -67.84 });
    const [locationPermission, setLocationPermission] = useState(null);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const mapRef = useRef(null);

    const { local: localParam } = useLocalSearchParams(); // agora usa useLocalSearchParams
    const router = useRouter();

    // Solicitar permissão de localização
    useEffect(() => {
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            setLocationPermission(status === "granted");
            if (status !== "granted") {
                Alert.alert("Permissão negada", "Você precisa permitir acesso à localização para usar o geocoding.");
            }
        })();
    }, []);

    // Preencher campos se localParam estiver presente
    useEffect(() => {
        // Se veio param, preencher para edição; se não, resetar para criação de novo local
        if (localParam) {
            try {
                const parsed = typeof localParam === "string" ? JSON.parse(localParam) : localParam;
                setTitulo(parsed.titulo || "");
                setRua(parsed.rua || "");
                setNumero(parsed.numero || "");
                setCidade(parsed.cidade || "");
                setEstado(parsed.estado || "");
                setCep(parsed.cep || "");
                const lat = parsed.latitude ?? parsed.lat ?? -9.97;
                const lng = parsed.longitude ?? parsed.lng ?? -67.84;
                setLatitude(Number(lat));
                setLongitude(Number(lng));
                setMarker({ latitude: Number(lat), longitude: Number(lng) });
                setEditingId(parsed.id); // guardamos id para update

                // centralizar mapa no local editado
                if (mapRef.current && mapRef.current.animateToRegion) {
                    mapRef.current.animateToRegion({ latitude: Number(lat), longitude: Number(lng), latitudeDelta: 0.01, longitudeDelta: 0.01 }, 400);
                }
            } catch (e) {
                console.warn("Erro ao parsear param local:", e);
            }
        } else {
            // Novo local: garantir campos vazios / valores padrão
            setEditingId(null);
            setTitulo("");
            setRua("");
            setNumero("");
            setCidade("");
            setEstado("");
            setCep("");
            const defaultLat = -9.97;
            const defaultLng = -67.84;
            setLatitude(defaultLat);
            setLongitude(defaultLng);
            setMarker({ latitude: defaultLat, longitude: defaultLng });
            if (mapRef.current && mapRef.current.animateToRegion) {
                mapRef.current.animateToRegion({ latitude: defaultLat, longitude: defaultLng, latitudeDelta: 0.05, longitudeDelta: 0.05 }, 300);
            }
        }
    }, [localParam]);

    // Sincroniza marker quando latitude/longitude mudam manualmente
    useEffect(() => {
        const lat = Number(latitude);
        const lng = Number(longitude);
        if (!isNaN(lat) && !isNaN(lng)) {
            setMarker({ latitude: lat, longitude: lng });
            if (mapRef.current && mapRef.current.animateToRegion) {
                mapRef.current.animateToRegion({ latitude: lat, longitude: lng, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 300);
            }
        }
    }, [latitude, longitude]);

    // Função para fazer reverse geocoding
    const obterEndereçoDoMapa = async (lat, lng) => {
        if (!locationPermission) {
            console.warn("Permissão de localização não concedida");
            return;
        }

        try {
            const resultado = await Location.reverseGeocodeAsync({
                latitude: lat,
                longitude: lng,
            });
            
            if (resultado && resultado.length > 0) {
                const endereco = resultado[0];
                setRua(endereco.street || "");
                setNumero(endereco.streetNumber || "");
                setCidade(endereco.city || "");
                setEstado(endereco.region || "");
                setCep(endereco.postalCode || "");
            }
        } catch (error) {
            console.error("Erro ao obter endereço:", error);
        }
    };

    // Handle ao pressionar no mapa
    const handleMapPress = (event) => {
        const { latitude: lat, longitude: lng } = event.nativeEvent.coordinate;
        setLatitude(lat);
        setLongitude(lng);
        setMarker({ latitude: lat, longitude: lng });
        obterEndereçoDoMapa(lat, lng);
    };

    // Salvar local localmente
    const salvarLocal = async () => {
        if (!titulo.trim()) {
            Alert.alert("Campo obrigatório", "Por favor, digite um nome para o local");
            return;
        }

        setSaving(true);

        // montar objeto localNovo com os campos preenchidos
        const localNovo = {
            id: editingId || Date.now().toString(),
            titulo,
            rua,
            numero,
            cidade,
            estado,
            cep,
            latitude: Number(latitude),
            longitude: Number(longitude),
        };

        try {
            const raw = await AsyncStorage.getItem("locaisCadastrados");
            const lista = raw ? JSON.parse(raw) : [];

            if (editingId) {
                // substituir item existente
                const novas = lista.map(l => (l.id === editingId ? localNovo : l));
                await AsyncStorage.setItem("locaisCadastrados", JSON.stringify(novas));
            } else {
                // criar novo
                lista.push(localNovo);
                await AsyncStorage.setItem("locaisCadastrados", JSON.stringify(lista));
            }

            Alert.alert("Sucesso", "Local cadastrado com sucesso!", [
                {
                    text: "OK",
                    onPress: () => router.replace("/newEvento/locaisCadastrados"),
                },
            ]);
        } catch (error) {
            console.error("Erro ao salvar local:", error);
            Alert.alert("Erro", "Não foi possível salvar o local");
        } finally {
            setSaving(false);
        }
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <ScrollView 
                style={styles.container} 
                contentContainerStyle={{ paddingBottom: 120 }}
                keyboardShouldPersistTaps="handled"
            >
                <Text style={styles.header}>Cadastrar Local</Text>

                {/* Título do Local */}
                <View style={styles.field}>
                    <Text style={styles.label}>Nome do Local *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ex: Auditório Central"
                        value={titulo}
                        onChangeText={setTitulo}
                    />
                </View>

                <Text style={styles.label}>Pressione para Marcar no Mapa</Text>
                <MapView
                    ref={mapRef}
                    style={styles.map}
                    initialRegion={{
                        latitude: latitude,
                        longitude: longitude,
                        latitudeDelta: 0.05,
                        longitudeDelta: 0.05,
                    }}
                    onPress={handleMapPress}
                >
                    {marker && (
                        <Marker
                            coordinate={marker}
                            title="Localização do Local"
                            description={`${rua} ${numero}, ${cidade}, ${estado}`}
                        />
                    )}
                </MapView>

                {/* Campos de Endereço */}
                <View style={styles.field}>
                    <Text style={styles.label}>Rua</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Nome da rua"
                        value={rua}
                        onChangeText={setRua}
                    />
                </View>

                <View style={styles.row}>
                    <View style={[styles.field, { flex: 1, marginRight: 8 }]}>
                        <Text style={styles.label}>Número</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Nº"
                            value={numero}
                            onChangeText={setNumero}
                            keyboardType="numeric"
                        />
                    </View>

                    <View style={[styles.field, { flex: 1, marginLeft: 8 }]}>
                        <Text style={styles.label}>CEP</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="00000-000"
                            value={cep}
                            onChangeText={setCep}
                        />
                    </View>
                </View>

                <View style={styles.row}>
                    <View style={[styles.field, { flex: 2, marginRight: 8 }]}>
                        <Text style={styles.label}>Cidade</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Cidade"
                            value={cidade}
                            onChangeText={setCidade}
                        />
                    </View>

                    <View style={[styles.field, { flex: 1, marginLeft: 8 }]}>
                        <Text style={styles.label}>Estado</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="UF"
                            value={estado}
                            onChangeText={setEstado}
                            maxLength={2}
                        />
                    </View>
                </View>

                {/* Latitude e Longitude */}
                <View style={styles.field}>
                    <Text style={styles.label}>Latitude</Text>
                    <TextInput 
                        style={styles.input} 
                        value={String(latitude)} 
                        onChangeText={(text) => {
                            const v = parseFloat(text);
                            if (!isNaN(v)) setLatitude(v);
                        }}
                        keyboardType="decimal-pad"
                    />
                </View>

                <View style={styles.field}>
                    <Text style={styles.label}>Longitude</Text>
                    <TextInput 
                        style={styles.input} 
                        value={String(longitude)} 
                        onChangeText={(text) => {
                            const v = parseFloat(text);
                            if (!isNaN(v)) setLongitude(v);
                        }}
                        keyboardType="decimal-pad"
                    />
                </View>
            </ScrollView>

            {/* Footer fixo */}
            <View style={styles.footer}>
                <TouchableOpacity 
                    style={[styles.button, styles.saveButton]} 
                    onPress={salvarLocal}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Salvar</Text>
                    )}
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={() => router.replace("/newEvento/locaisCadastrados")}
                >
                    <Text style={styles.buttonText}>Cancelar</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff", padding: 20 },
    header: { fontSize: 22, fontWeight: "bold", marginBottom: 20, color: "#08007B" },
    map: { width: "100%", height: 250, borderRadius: 10, marginBottom: 20 },
    field: { marginBottom: 16 },
    label: { fontSize: 14, fontWeight: "bold", marginBottom: 6, color: "#333" },
    input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12 },
    row: { flexDirection: "row", justifyContent: "space-between" },
    footer: {
        flexDirection: "row",
        justifyContent: "space-between",
        padding: 20,
        borderTopWidth: 1,
        borderColor: "#ddd",
        backgroundColor: "#fff",
    },
    button: {
        flex: 1,
        padding: 14,
        borderRadius: 8,
        alignItems: "center",
        marginHorizontal: 5,
    },
    saveButton: { backgroundColor: "#08007B" },
    cancelButton: { backgroundColor: "#e53935" },
    buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});