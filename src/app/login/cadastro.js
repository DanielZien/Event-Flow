import { StatusBar } from 'expo-status-bar';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View, Image } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { styles } from '../../styles/estilosLogin';
import { useAuth } from '../temporario/authContext';

import { api } from "../../services/api2";

export default function TelaCadastro() {
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [loading, setLoading] = useState(false);


  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confSenha, setConfSenha] = useState('')
  const router = useRouter();
  const { addUser } = useAuth();//temporario

  function formatarTelefone(text) {
    // Remove tudo que não for número
    const numeros = text.replace(/\D/g, '');

    // Aplica máscara (XX) XXXXX-XXXX
    if (numeros.length <= 10) {
      return numeros.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    } else {
      return numeros.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
    }
  }

  async function Cadastro() {
    if (senha !== confSenha) {
      return alert("Digite a mesma senha");
    }

    setLoading(true); // ativa o loading

    try {
      const response = await api.post("/auth/register", {
        email: email,
        password: senha,
        nome: nome,
        telefone: telefone
      });

      alert("Cadastro feito com sucesso!");
      console.log("Resposta da API:", response.data);
      router.back();
    } catch (error) {
      console.error("Erro ao cadastrar:", error.response?.data || error.message);
      alert("Erro ao cadastrar usuário");
    } finally {
      setLoading(false); // desativa o loading
    }
  }



  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.container}>
        <View style={styles.logo}>
          <Image
            source={require("../../imgs/logo.webp")} // ajuste o caminho conforme sua estrutura
            style={{ width: 120, height: 120, resizeMode: "contain" }}
          />
        </View>


        <View style={styles.login}>
          <TextInput
            placeholder='Digite seu nome'
            style={styles.email}
            value={nome}
            onChangeText={setNome}
          />

          <TextInput
            placeholder="Digite seu telefone"
            style={styles.email}
            value={telefone}
            keyboardType="numeric"
            onChangeText={(text) => setTelefone(formatarTelefone(text))}
          />



          <TextInput
            placeholder='Digite seu e-mail'
            style={styles.email}
            value={email}
            onChangeText={setEmail}

          ></TextInput>
          <TextInput
            placeholder='Digite uma senha'
            style={styles.senha}
            value={senha}
            onChangeText={setSenha}

          ></TextInput>
          <TextInput
            placeholder='Confirme a sua senha'
            style={styles.senha}
            value={confSenha}
            onChangeText={setConfSenha}

          ></TextInput>


          <TouchableOpacity
            style={[styles.botaoEntrar, loading && { opacity: 0.6 }]}
            onPress={Cadastro}
            disabled={loading}
          >
            {loading ? (
              <Text style={styles.botaoTexto}>Carregando...</Text>
              // ou usar um ActivityIndicator
              // <ActivityIndicator color="#fff" />
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
  onPress={() => router.replace("/login")}
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
