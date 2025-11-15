import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { useState, useEffect } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback } from "react";

export default function LocaisCadastrados() {
    const [locais, setLocais] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Carregar locais ao focar na tela
    useFocusEffect(
        useCallback(() => {
            carregarLocais();
        }, [])
    );

    const carregarLocais = async () => {
        try {
            setLoading(true);
            const locaisSalvos = await AsyncStorage.getItem("locaisCadastrados");
            const lista = locaisSalvos ? JSON.parse(locaisSalvos) : [];
            setLocais(lista);
        } catch (error) {
            console.error("Erro ao carregar locais:", error);
            Alert.alert("Erro", "Não foi possível carregar os locais");
        } finally {
            setLoading(false);
        }
    };

    const excluirLocal = (id) => {
        Alert.alert("Excluir Local", "Tem certeza que deseja excluir este local?", [
            { text: "Cancelar", style: "cancel" },
            {
                text: "Excluir",
                style: "destructive",
                onPress: async () => {
                    try {
                        const locaisFiltrados = locais.filter(l => l.id !== id);
                        await AsyncStorage.setItem("locaisCadastrados", JSON.stringify(locaisFiltrados));
                        setLocais(locaisFiltrados);
                    } catch (error) {
                        console.error("Erro ao excluir local:", error);
                        Alert.alert("Erro", "Não foi possível excluir o local");
                    }
                },
            },
        ]);
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#08007B" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Locais Cadastrados</Text>
                <TouchableOpacity 
                    style={styles.createButton}
                    onPress={() => router.push("/newEvento/cadastrarMapa")}
                >
                    <Text style={styles.createText}>Novo Local +</Text>
                </TouchableOpacity>
                <Text style={styles.subtitle}>
                    Mostrando {locais.length} local{locais.length !== 1 ? "is" : ""}
                </Text>
            </View>

            {locais.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>Nenhum local cadastrado</Text>
                    <TouchableOpacity 
                        style={styles.emptyButton}
                        onPress={() => router.push("/newEvento/cadastrarMapa")}
                    >
                        <Text style={styles.emptyButtonText}>Cadastrar Primeiro Local</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={locais}
                    keyExtractor={(item) => item.id.toString()}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => (
                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <View style={styles.cardInfo}>
                                    <Text style={styles.cardTitle}>{item.titulo}</Text>
                                    <Text style={styles.cardSubtitle}>
                                        {item.rua} {item.numero}
                                    </Text>
                                    <Text style={styles.cardSubtitle}>
                                        {item.cidade}, {item.estado} - {item.cep}
                                    </Text>
                                    <Text style={styles.cardCoords}>
                                        📍 {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                                    </Text>
                                </View>
                                <TouchableOpacity 
                                    style={styles.deleteButton}
                                    onPress={() => excluirLocal(item.id)}
                                >
                                    <Text style={styles.deleteText}>✖</Text>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity 
                                style={styles.editButton}
                                onPress={() => router.push({
                                    pathname: "/newEvento/cadastrarMapa",
                                    params: { id: item.id }
                                })}
                            >
                                <Text style={styles.editButtonText}>Editar</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    contentContainerStyle={{ paddingBottom: 20 }}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f5f5f5" },
    header: { backgroundColor: "#fff", padding: 20, borderBottomWidth: 1, borderColor: "#ddd" },
    title: { fontSize: 22, fontWeight: "bold", marginBottom: 10, color: "#08007B" },
    createButton: {
        backgroundColor: "#08007B",
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 8,
        marginBottom: 10,
        alignItems: "center",
    },
    createText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
    subtitle: { fontSize: 12, color: "#999" },

    emptyState: { flex: 1, justifyContent: "center", alignItems: "center" },
    emptyText: { fontSize: 16, color: "#999", marginBottom: 20 },
    emptyButton: {
        backgroundColor: "#08007B",
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    emptyButtonText: { color: "#fff", fontWeight: "bold" },

    card: {
        backgroundColor: "#fff",
        marginHorizontal: 20,
        marginVertical: 10,
        borderRadius: 10,
        padding: 15,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
    cardInfo: { flex: 1 },
    cardTitle: { fontSize: 18, fontWeight: "bold", color: "#333", marginBottom: 5 },
    cardSubtitle: { fontSize: 14, color: "#666", marginBottom: 3 },
    cardCoords: { fontSize: 12, color: "#999", marginTop: 5 },

    deleteButton: {
        backgroundColor: "#e53935",
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
    },
    deleteText: { color: "#fff", fontSize: 18, fontWeight: "bold" },

    editButton: {
        backgroundColor: "#08007B",
        marginTop: 12,
        paddingVertical: 10,
        borderRadius: 6,
        alignItems: "center",
    },
    editButtonText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
});