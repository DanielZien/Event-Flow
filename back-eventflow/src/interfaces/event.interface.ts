export interface Event {
   id: number;
   createdAt : Date;
   titulo: string;
   descricao: string;
   data: Date;
   localizacao: string;
   imagem?: string;
   categoria: string;
   ativo: boolean;
}

export interface EventFilter {
    id?: number,
    titulo?: string,
    data?: Date,
    localizacao?: string,
    categoria?: string,
    status?: string;
    page?: number;
    limit?: number
}

/*
  id               Int          @id @default(autoincrement())
  createdAt        DateTime
  titulo           String
  descricao        String
  data             DateTime
  localizacao      String
  status           StatusRegistros @default(PENDENTE)
  role             UserRole
*/