import { View,Text, TextInput } from "react-native";

export function Login() {
    return(
        <View>
            <View>
                <Text>Olá universo</Text>
            </View>

            <View>
                <TextInput placeholder="E-mail"></TextInput>
                
                
                <TextInput placeholder="Senha"></TextInput>
            </View>
        </View>
    )
}