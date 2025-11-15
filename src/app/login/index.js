import { StatusBar } from 'expo-status-bar';
import { Keyboard, KeyboardAvoidingView, Platform, TouchableOpacity, TouchableWithoutFeedback, View, Text, TextInput, ActivityIndicator, Image } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { styles } from '../../styles/estilosLogin';
import { api } from "../../services/api2";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sessionService } from '../../services/sessionService';

export default function Index() {
    const [login, setLogin] = useState('');
    const [senha, setSenha] = useState('');
    const [linkCadastro, setLinkCadastro] = useState(true);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // Função para traduzir mensagens do backend
    function traduzirMensagem(msg) {
        if (msg.includes("email must be an email")) {
            return "Digite um e-mail válido.";
        }
        if (msg.includes("password must be longer")) {
            return "A senha deve ter pelo menos 6 caracteres.";
        }
        return msg; // fallback
    }

    async function validarLogin() {
        if (login === '' || senha === '') {
            return alert('Por favor preencha os campos');
        }

        setLoading(true);

        try {
            const response = await api.post("/auth/login", {
                email: login,
                password: senha
            });

            console.log("Resposta da API:", response.data);

            if (response.data.user) {
                console.log("Login realizado com sucesso!");
                await AsyncStorage.setItem("token", response.data.access_toekn);
                await AsyncStorage.setItem("user", JSON.stringify(response.data.user));

                // Registrar entrada da sessão
                await sessionService.registrarEntrada(response.data.user);

                if (response.data.user.role === "ADMIN") {
                    router.replace('/newEvento/eventosCadastrado');
                } else {
                    router.replace('/evento/home');
                }
            } else {
                alert("Login inválido!");
                setLinkCadastro(true);
            }

        } catch (error) {
            console.error("Erro ao fazer login:", error.response?.data || error.message);

            const data = error.response?.data;
            if (data?.message) {
                const mensagens = Array.isArray(data.message)
                    ? data.message.map(traduzirMensagem).join("\n")
                    : traduzirMensagem(data.message);

                alert(mensagens);
            } else {
                alert("Erro ao fazer login. Verifique seus dados.");
            }

            setLinkCadastro(true);
        } finally {
            setLoading(false);
        }
    }

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.container}>
                    <View style={styles.logo}>
                        <Image
                            source={require("../../imgs/logo.webp")} // ajuste o caminho conforme sua estrutura
                            style={{ width: 120, height: 120, resizeMode: "contain" }}
                        />
                    </View>


                    <View style={styles.login}>
                        <TextInput
                            placeholder='Email'
                            style={styles.email}
                            value={login}
                            onChangeText={setLogin}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />

                        <TextInput
                            placeholder='Senha'
                            style={styles.senha}
                            value={senha}
                            onChangeText={setSenha}
                            secureTextEntry
                        />

                        <TouchableOpacity
                            style={[styles.botaoEntrar, loading && { opacity: 0.6 }]}
                            onPress={validarLogin}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.botaoTexto}>Entrar</Text>
                            )}
                        </TouchableOpacity>

                        {linkCadastro && (
                            <Link href={'/login/cadastro'} style={styles.linkText}>
                                Ainda não tem uma conta? Cadastre-se clicando aqui
                            </Link>
                        )}
                    </View>
                </View>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
}