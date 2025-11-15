import AsyncStorage from '@react-native-async-storage/async-storage';

export const sessionService = {
  // Registrar entrada
  async registrarEntrada(user) {
    try {
      const sessions = await this.getSessions();
      
      const novaSessao = {
        id: Date.now(),
        userId: user.id,
        email: user.email,
        role: user.role,
        loginAt: new Date().toISOString(),
        logoutAt: null,
      };

      sessions.push(novaSessao);
      await AsyncStorage.setItem('sessions', JSON.stringify(sessions));
      
      console.log('✅ Entrada registrada:', novaSessao);
      return novaSessao;
    } catch (error) {
      console.error('Erro ao registrar entrada:', error);
    }
  },

  // Registrar saída
  async registrarSaida(userId) {
    try {
      const sessions = await this.getSessions();
      
      // Encontrar a sessão ativa do usuário
      const sessaoAtiva = sessions.find(s => s.userId === userId && !s.logoutAt);
      
      if (sessaoAtiva) {
        sessaoAtiva.logoutAt = new Date().toISOString();
        await AsyncStorage.setItem('sessions', JSON.stringify(sessions));
        
        console.log('✅ Saída registrada:', sessaoAtiva);
        return sessaoAtiva;
      }
    } catch (error) {
      console.error('Erro ao registrar saída:', error);
    }
  },

  // Obter todas as sessões
  async getSessions() {
    try {
      const sessions = await AsyncStorage.getItem('sessions');
      return sessions ? JSON.parse(sessions) : [];
    } catch (error) {
      console.error('Erro ao obter sessões:', error);
      return [];
    }
  },

  // Obter sessões de um usuário
  async getSessionsByUser(userId) {
    try {
      const sessions = await this.getSessions();
      return sessions.filter(s => s.userId === userId);
    } catch (error) {
      console.error('Erro ao obter sessões do usuário:', error);
      return [];
    }
  },

  // Obter tempo total online (em segundos)
  async getTotalTimeOnline(userId) {
    try {
      const sessions = await this.getSessionsByUser(userId);
      let totalSegundos = 0;

      sessions.forEach(sessao => {
        const login = new Date(sessao.loginAt);
        const logout = sessao.logoutAt ? new Date(sessao.logoutAt) : new Date();
        const diferenca = (logout - login) / 1000; // converter para segundos
        totalSegundos += diferenca;
      });

      return totalSegundos;
    } catch (error) {
      console.error('Erro ao calcular tempo online:', error);
      return 0;
    }
  },

  // Obter sessão ativa
  async getActiveSessions() {
    try {
      const sessions = await this.getSessions();
      return sessions.filter(s => !s.logoutAt);
    } catch (error) {
      console.error('Erro ao obter sessões ativas:', error);
      return [];
    }
  },

  // Limpar histórico de sessões
  async clearSessions() {
    try {
      await AsyncStorage.removeItem('sessions');
      console.log('✅ Histórico de sessões limpo');
    } catch (error) {
      console.error('Erro ao limpar sessões:', error);
    }
  },

  // Obter usuário atual
  async getCurrentUser() {
    try {
      const userData = await AsyncStorage.getItem("user");
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Erro ao obter usuário atual:', error);
      return null;
    }
  },

  // Escutar mudanças de autenticação
  subscribeToAuthChanges(callback) {
    const interval = setInterval(async () => {
      const user = await this.getCurrentUser();
      callback(user);
    }, 500); // Verifica a cada 500ms

    return () => clearInterval(interval); // Função para desinscrever
  },
};