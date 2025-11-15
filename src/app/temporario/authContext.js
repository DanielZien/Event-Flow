import { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [users, setUsers] = useState([{ email: "a", senha: "a", role: "admin" }]);
  const [currentUser, setCurrentUser] = useState(null);

  // Carregar usuário salvo no AsyncStorage ao iniciar
  useEffect(() => {
    async function loadUser() {
      const savedUser = await AsyncStorage.getItem("currentUser");
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      }
    }
    loadUser();
  }, []);

  function addUser(novoUsuario) {
    setUsers((users) => [...users, novoUsuario]);
  }

  async function login(email, senha) {
    const user = users.find((u) => u.email === email && u.senha === senha);
    if (user) {
      setCurrentUser(user);
      await AsyncStorage.setItem("currentUser", JSON.stringify(user));
      return true;
    }
    return false;
  }

  async function logout() {
    setCurrentUser(null);
    await AsyncStorage.removeItem("currentUser");
  }

  return (
    <AuthContext.Provider value={{ users, addUser, currentUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}