import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from "react-native";
import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import MapView, { Marker } from "react-native-maps";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../../services/api2";
import * as Location from "expo-location";

export default function CadastrarEvento() {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("");
  const [categoriasList, setCategoriasList] = useState([]);
  const [local, setLocal] = useState("");
  const [locaisCadastrados, setLocaisCadastrados] = useState([]);
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [cep, setCep] = useState("");
  const [latitude, setLatitude] = useState(-9.97);
  const [longitude, setLongitude] = useState(-67.84);
  const [imagens, setImagens] = useState([]);

  const [data, setData] = useState(new Date());
  const [horaInicio, setHoraInicio] = useState(new Date());
  const [horaFim, setHoraFim] = useState(new Date());

  const [showData, setShowData] = useState(false);
  const [showHoraInicio, setShowHoraInicio] = useState(false);
  const [showHoraFim, setShowHoraFim] = useState(false);

  const [saving, setSaving] = useState(false);
  const [locationPermission, setLocationPermission] = useState(null);
  const mapRef = useRef(null);

  // Solicitar permissão de localização ao montar o componente
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === "granted");
      if (status !== "granted") {
        Alert.alert("Permissão negada", "Você precisa permitir acesso à localização para usar o geocoding.");
      }
    })();
  }, []);

  // Carregar categorias do AsyncStorage
  const carregarCategorias = async () => {
    try {
      const categoriasSalvas = await AsyncStorage.getItem("categorias");
      const lista = categoriasSalvas ? JSON.parse(categoriasSalvas) : [];
      setCategoriasList(lista);
    } catch (error) {
      console.error("Erro ao carregar categorias:", error);
    }
  };

  // Carregar locais do AsyncStorage
  const carregarLocais = async () => {
    try {
      const locaisSalvos = await AsyncStorage.getItem("locaisCadastrados");
      const lista = locaisSalvos ? JSON.parse(locaisSalvos) : [];
      setLocaisCadastrados(lista);
    } catch (error) {
      console.error("Erro ao carregar locais:", error);
    }
  };
  
  // Limpa o formulário sempre que a tela for focada
  useFocusEffect(
    useCallback(() => {
      setNome("");
      setDescricao("");
      setCategoria("");
      setLocal("");
      setRua("");
      setNumero("");
      setCidade("");
      setEstado("");
      setCep("");
      setLatitude(-9.97);
      setLongitude(-67.84);
      setImagens([]);
      setData(new Date());
      setHoraInicio(new Date());
      setHoraFim(new Date());
      setShowData(false);
      setShowHoraInicio(false);
      setShowHoraFim(false);
      setSaving(false);
      carregarCategorias(); // Recarregar categorias ao focar
      carregarLocais(); // Recarregar locais ao focar
      return () => {};
    }, [])
  );

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

  const router = useRouter();

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
    obterEndereçoDoMapa(lat, lng);
  };

  // Ao selecionar um local cadastrado
  const handleSelectLocal = (localId) => {
    setLocal(localId);
    
    if (localId) {
      const localSelecionado = locaisCadastrados.find(l => l.id.toString() === localId);
      
      if (localSelecionado) {
        // Preencher campos automaticamente
        setRua(localSelecionado.rua);
        setNumero(localSelecionado.numero);
        setCidade(localSelecionado.cidade);
        setEstado(localSelecionado.estado);
        setCep(localSelecionado.cep);
        setLatitude(localSelecionado.latitude);
        setLongitude(localSelecionado.longitude);
      }
    } else {
      // Limpar campos se desselecionar
      setRua("");
      setNumero("");
      setCidade("");
      setEstado("");
      setCep("");
    }
  };

  const salvarEvento = async () => {
    setSaving(true);
    const imagensString = imagens.filter(img => img).join("|");
    const enderecoCompleto = `${rua} ${numero}, ${cidade}, ${estado}`.trim();

    // garantir coords em formato numérico e com precisão controlada
    const latNum = Number(latitude) || 0;
    const lngNum = Number(longitude) || 0;
    const latStr = latNum.toFixed(6);
    const lngStr = lngNum.toFixed(6);

    // Salvar a localizacao como "endereco | lat,lng" para permitir split/parse na home
    const localizacaoComCoords = enderecoCompleto
      ? `${enderecoCompleto} | ${latStr}, ${lngStr}`
      : `${latStr}, ${lngStr}`;

    const novoEvento = {
      titulo: nome,
      descricao,
      data: data.toISOString(),
      localizacao: localizacaoComCoords,
      hora_inicio: horaInicio.toISOString(),
      categoria,
      imagem: imagensString || "",
      hora_fim: horaFim.toISOString(),
      preco: 0
    }; 

    try {
      const response = await api.post("/events", novoEvento);
      alert("Evento cadastrado com sucesso!");
      router.replace("/newEvento/eventosCadastrado");
    } catch (error) {
      console.error("Erro ao salvar evento:", error.response?.data || error.message);
      alert("Erro ao salvar evento");
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.header}>Cadastrar Evento</Text>

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
              <Picker.Item label="Selecione uma categoria" value="" />
              {categoriasList.map((cat) => (
                <Picker.Item 
                  key={cat.id} 
                  label={cat.nome} 
                  value={cat.nome} 
                />
              ))}
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
            <Picker selectedValue={local} onValueChange={handleSelectLocal}>
              <Picker.Item label="Selecione um local" value="" />
              {locaisCadastrados.map((loc) => (
                <Picker.Item 
                  key={loc.id} 
                  label={loc.titulo} 
                  value={loc.id.toString()} 
                />
              ))}
            </Picker>
          </View>
        </View>

        {/* Mapa Interativo */}
        <View style={styles.field}>
          <Text style={styles.label}>Ou Marque no Mapa o Local Desejado</Text>
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
            <Marker
              coordinate={{ latitude, longitude }}
              title="Localização do Evento"
              description={`${rua} ${numero}, ${cidade}, ${estado}`}
            />
          </MapView>
        </View>

        {/* Endereço - Dividido em 5 campos */}
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
            placeholder="Ex: -9.9762"
            value={latitude.toString()}
            onChangeText={(text) => setLatitude(parseFloat(text) || -9.97)}
            keyboardType="decimal-pad"
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Longitude</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: -67.8413"
            value={longitude.toString()}
            onChangeText={(text) => setLongitude(parseFloat(text) || -67.84)}
            keyboardType="decimal-pad"
          />
        </View>
      </ScrollView>

      {/* Footer fixo */}
      <View style={styles.footer}>
        <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={salvarEvento} disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Salvar</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  header: { fontSize: 22, fontWeight: "bold", marginBottom: 20, color: "#08007B" },

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

  field: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "bold", marginBottom: 6, color: "#333" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
  },

  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    overflow: "hidden",
  },

  row: { flexDirection: "row", justifyContent: "space-between" },

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

  map: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
  },
});