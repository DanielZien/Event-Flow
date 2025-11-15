import { StatusBar } from 'expo-status-bar';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View, Image, ActivityIndicator, Alert } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { styles } from '../../styles/estilosLogin';
import { useAuth } from '../temporario/authContext';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from "../../services/api2";

export default function TelaCadastro() {
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confSenha, setConfSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [imagemUri, setImagemUri] = useState(null);
  const [imagemSelecionando, setImagemSelecionando] = useState(false);
  const router = useRouter();
  const { addUser } = useAuth();

  // Limpar campos quando a tela ganhar foco
  useFocusEffect(
    useCallback(() => {
      setNome('');
      setTelefone('');
      setEmail('');
      setSenha('');
      setConfSenha('');
      setImagemUri(null);
      setLoading(false);
    }, [])
  );

  function formatarTelefone(text) {
    const numeros = text.replace(/\D/g, '');
    if (numeros.length <= 10) {
      return numeros.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    } else {
      return numeros.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
    }
  }

  const selecionarImagem = async () => {
    setImagemSelecionando(true);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'Você precisa permitir acesso à galeria para selecionar uma imagem.');
        setImagemSelecionando(false);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setImagemUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem');
    } finally {
      setImagemSelecionando(false);
    }
  };

  async function Cadastro() {
    if (!nome.trim() || !email.trim() || !telefone.trim() || !senha || !confSenha) {
      return Alert.alert('Campos obrigatórios', 'Por favor preencha todos os campos');
    }

    if (senha !== confSenha) {
      return Alert.alert('Senhas não coincidem', 'Digite a mesma senha nos dois campos');
    }

    setLoading(true);

    try {
      // --- PASSO 1: CHAME A API COM OS DADOS DE TEXTO ---
      // IMPORTANTE: Removemos o campo 'imagem' do payload, pois ele ficará local.
      const response = await api.post("/auth/register", {
        email: email.trim(),
        password: senha,
        nome: nome.trim(),
        telefone: telefone,
      });

      // --- PASSO 2: SALVE A URI DA IMAGEM LOCALMENTE NO ASYNCSTORAGE ---
      if (imagemUri) {
         // Salvamos a URI do arquivo local (ex: "file:///...")
         await AsyncStorage.setItem('fotoDePerfilLocal', imagemUri);
         console.log('URI da Imagem salva localmente:', imagemUri);
      }
      
      Alert.alert('Sucesso', 'Cadastro realizado e foto salva localmente!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
      console.log("Resposta da API:", response.data);

    } catch (error) {
      console.error("Erro ao cadastrar:", error.response?.data || error.message);
      // Se a API retornar sucesso mas o AsyncStorage falhar, o erro será exibido aqui.
      const errorMsg = error.response?.data?.message || "Erro ao cadastrar usuário (API OK, mas falha local)";
      Alert.alert('Erro', errorMsg);
    } finally {
      setLoading(false);
    }
  }
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.container}>
        <View style={styles.logo}>
          <Image
            source={require("../../imgs/logo.webp")}
            style={{ width: 120, height: 120, resizeMode: "contain" }}
          />
        </View>

        <View style={styles.login}>
          {/* Seletor de Imagem de Perfil */}
          <TouchableOpacity 
            style={{ 
              alignItems: 'center', 
              marginBottom: 20,
              padding: 16,
              backgroundColor: '#f5f5f5',
              borderRadius: 12,
            }}
            onPress={selecionarImagem}
            disabled={imagemSelecionando}
          >
            {imagemUri ? (
              <Image
                source={{ uri: imagemUri }}
                style={{ width: 100, height: 100, borderRadius: 50 }}
              />
            ) : (
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 40, marginBottom: 8 }}>📷</Text>
                <Text style={{ color: '#08007B', fontWeight: 'bold', fontSize: 14 }}>
                  Selecionar foto de perfil
                </Text>
              </View>
            )}
            {imagemUri && (
              <Text style={{ color: '#08007B', fontWeight: 'bold', fontSize: 12, marginTop: 8 }}>
                Trocar imagem
              </Text>
            )}
            {imagemSelecionando && <ActivityIndicator color="#08007B" />}
          </TouchableOpacity>

          <TextInput
            placeholder='Digite seu nome'
            style={styles.email}
            value={nome}
            onChangeText={setNome}
            editable={!loading}
          />

          <TextInput
            placeholder="Digite seu telefone"
            style={styles.email}
            value={telefone}
            keyboardType="numeric"
            onChangeText={(text) => setTelefone(formatarTelefone(text))}
            editable={!loading}
          />

          <TextInput
            placeholder='Digite seu e-mail'
            style={styles.email}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />

          <TextInput
            placeholder='Digite uma senha'
            style={styles.senha}
            value={senha}
            onChangeText={setSenha}
            secureTextEntry
            editable={!loading}
          />

          <TextInput
            placeholder='Confirme a sua senha'
            style={styles.senha}
            value={confSenha}
            onChangeText={setConfSenha}
            secureTextEntry
            editable={!loading}
          />

          <TouchableOpacity
            style={[styles.botaoEntrar, (loading || imagemSelecionando) && { opacity: 0.6 }]}
            onPress={Cadastro}
            disabled={loading || imagemSelecionando}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.botaoTexto}>Cadastrar-se</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              marginTop: 12,
              padding: 10,
              alignItems: "center",
            }}
            onPress={() => router.back()}
            disabled={loading}
          >
            <Text style={{ color: "#08007B", fontWeight: "bold" }}>
              ← Voltar para Login
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
