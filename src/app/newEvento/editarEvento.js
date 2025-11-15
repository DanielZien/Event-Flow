import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { useState, useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import MapView from "react-native-maps";
import { api } from "../../services/api2";

export default function EditarEvento() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("");
  const [local, setLocal] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [imagens, setImagens] = useState([]);

  const [data, setData] = useState(new Date());
  const [horaInicio, setHoraInicio] = useState(new Date());
  const [horaFim, setHoraFim] = useState(new Date());

  const [showData, setShowData] = useState(false);
  const [showHoraInicio, setShowHoraInicio] = useState(false);
  const [showHoraFim, setShowHoraFim] = useState(false);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Carregar evento ao montar
  useEffect(() => {
    if (id) {
      carregarEvento();
    }
  }, [id]);

  const carregarEvento = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/events/${id}`);
      const evento = response.data;

      setNome(evento.titulo || "");
      setDescricao(evento.descricao || "");
      setCategoria(evento.categoria || "");
      setLocal(evento.localizacao || "");
      setData(new Date(evento.data));
      setHoraInicio(new Date(evento.hora_inicio));
      setHoraFim(new Date(evento.hora_fim));
      
      // Separar imagens pelo separador |
      let imagensCadastradas = [];
      if (evento.imagem && typeof evento.imagem === 'string') {
        imagensCadastradas = evento.imagem.split("|").filter(img => img.trim());
      }
      
      setImagens(imagensCadastradas.slice(0, 4));

      if (evento.localizacao && evento.localizacao.includes(",")) {
        const [lat, lng] = evento.localizacao.split(",").map(s => s.trim());
        setLatitude(lat);
        setLongitude(lng);
      }
    } catch (error) {
      console.error("Erro ao carregar evento:", error.response?.data || error.message);
      alert("Erro ao carregar evento");
    } finally {
      setLoading(false);
    }
  };

  const escolherImagem = async (index) => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (!result.canceled) {
      const novaImagem = result.assets[0].uri;
      let novas = [...imagens];
      novas[index] = novaImagem;
      setImagens(novas.slice(0, 4));
    }
  };

  const salvarEvento = async () => {
    // Concatenar imagens com separador
    const imagensString = imagens.filter(img => img).join("|");

    const eventoAtualizado = {
      titulo: nome,
      descricao,
      data: data.toISOString(),
      localizacao: local || `${latitude}, ${longitude}`,
      hora_inicio: horaInicio.toISOString(),
      categoria,
      imagem: imagensString || "", // String com imagens separadas por |
      hora_fim: horaFim.toISOString(),
      preco: 0,
    };

    setSaving(true);
    try {
      await api.patch(`/events/${id}`, eventoAtualizado);
      alert("Evento atualizado com sucesso!");
      router.replace("/newEvento/eventosCadastrado");
    } catch (error) {
      console.error("Erro ao salvar evento:", error.response?.data || error.message);
      alert("Erro ao salvar evento");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#08007B" />
        <Text style={{ marginTop: 10 }}>Carregando evento...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.header}>Editar Evento</Text>

        {/* Upload até 4 imagens */}
        <View style={styles.uploadGrid}>
          {[0, 1, 2, 3].map((i) => (
            <TouchableOpacity key={i} style={styles.uploadBox} onPress={() => escolherImagem(i)}>
              {imagens[i] ? (
                <Image source={{ uri: imagens[i] }} style={styles.image} />
              ) : (
                <Text style={styles.uploadText}>Upload</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Nome */}
        <View style={styles.field}>
          <Text style={styles.label}>Nome do Evento</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Workshop de Tecnologia"
            value={nome}
            onChangeText={setNome}
          />
        </View>

        {/* Descrição */}
        <View style={styles.field}>
          <Text style={styles.label}>Descrição</Text>
          <TextInput
            style={[styles.input, { height: 100 }]}
            placeholder="Ex: Evento voltado para desenvolvedores..."
            value={descricao}
            onChangeText={setDescricao}
            multiline
          />
        </View>

        {/* Categoria - Select */}
        <View style={styles.field}>
          <Text style={styles.label}>Categoria</Text>
          <View style={styles.pickerWrapper}>
            <Picker selectedValue={categoria} onValueChange={(itemValue) => setCategoria(itemValue)}>
              <Picker.Item label="Selecione" value="" />
              <Picker.Item label="Palestra" value="Palestra" />
              <Picker.Item label="Workshop" value="Workshop" />
              <Picker.Item label="Show" value="Show" />
            </Picker>
          </View>
        </View>

        {/* Data do Evento */}
        <View style={styles.field}>
          <Text style={styles.label}>Data do Evento</Text>
          <TouchableOpacity style={styles.input} onPress={() => setShowData(true)}>
            <Text>{data.toLocaleDateString()}</Text>
          </TouchableOpacity>
          {showData && (
            <DateTimePicker
              value={data}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowData(false);
                if (selectedDate) setData(selectedDate);
              }}
            />
          )}
        </View>

        {/* Horário Inicial e Final lado a lado */}
        <View style={styles.row}>
          <View style={[styles.field, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Horário Inicial</Text>
            <TouchableOpacity style={styles.input} onPress={() => setShowHoraInicio(true)}>
              <Text>{horaInicio.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </TouchableOpacity>
            {showHoraInicio && (
              <DateTimePicker
                value={horaInicio}
                mode="time"
                display="default"
                onChange={(event, selectedTime) => {
                  setShowHoraInicio(false);
                  if (selectedTime) setHoraInicio(selectedTime);
                }}
              />
            )}
          </View>

          <View style={[styles.field, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>Horário Final</Text>
            <TouchableOpacity style={styles.input} onPress={() => setShowHoraFim(true)}>
              <Text>{horaFim.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </TouchableOpacity>
            {showHoraFim && (
              <DateTimePicker
                value={horaFim}
                mode="time"
                display="default"
                onChange={(event, selectedTime) => {
                  setShowHoraFim(false);
                  if (selectedTime) setHoraFim(selectedTime);
                }}
              />
            )}
          </View>
        </View>

        {/* Locais cadastrados - Select */}
        <View style={styles.field}>
          <Text style={styles.label}>Locais Cadastrados</Text>
          <View style={styles.pickerWrapper}>
            <Picker selectedValue={local} onValueChange={(itemValue) => setLocal(itemValue)}>
              <Picker.Item label="Selecione" value="" />
              <Picker.Item label="Auditório Central" value="Auditório Central" />
              <Picker.Item label="Sala 101" value="Sala 101" />
              <Picker.Item label="Teatro Municipal" value="Teatro Municipal" />
            </Picker>
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Ou</Text>
          <Text style={styles.label}>Marque no Mapa o Local Desejado</Text>

          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.mapWrapper}
            onPress={() => router.push("/newEvento/locaisCadastrados")}
          >
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: -9.97,
                longitude: -67.84,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
              rotateEnabled={false}
            />

            {/* Elemento flutuante no centro */}
            <View style={styles.markerCenter}>
              <Text style={styles.markerIcon}>📍Marque no Mapa</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Latitude e Longitude */}
        <View style={styles.field}>
          <Text style={styles.label}>Latitude</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: -9.9762"
            value={latitude}
            onChangeText={setLatitude}
            keyboardType="decimal-pad"
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Longitude</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: -67.8413"
            value={longitude}
            onChangeText={setLongitude}
            keyboardType="decimal-pad"
          />
        </View>
      </ScrollView>

      {/* Footer fixo */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.button, styles.saveButton]} 
          onPress={salvarEvento}
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
          onPress={() => router.back()}
        >
          <Text style={styles.buttonText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  // Container e cabeçalho
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  header: { fontSize: 22, fontWeight: "bold", marginBottom: 20, color: "#08007B" },

  // Upload
  uploadGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  uploadBox: {
    width: "48%",
    height: 150,
    backgroundColor: "#eee",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  uploadText: { color: "#999", fontSize: 16 },
  image: { width: "100%", height: "100%", borderRadius: 10 },

  // Campos
  field: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "bold", marginBottom: 6, color: "#333" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
  },

  // Picker wrapper
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    overflow: "hidden",
  },

  // Linha horizontal
  row: { flexDirection: "row", justifyContent: "space-between" },

  // Footer fixo
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    borderTopWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
    marginBottom: 50,
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

  mapWrapper: {
    width: "100%",
    height: 100,
    borderRadius: 10,
    overflow: "hidden",
    marginTop: 10,
  },
  map: {
    width: "100%",
    height: "100%",
  },

  markerCenter: {
    position: "absolute",
    top: "50%",
    left: "27%",
    transform: [{ translateX: -15 }, { translateY: -15 }],
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 20,
    padding: 9,
    elevation: 4,
  },
  markerIcon: {
    fontSize: 20,
  },
});