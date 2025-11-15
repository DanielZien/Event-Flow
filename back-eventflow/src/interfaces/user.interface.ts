
export interface User {
    id: number;
    createdAt: Date;
    nome: string;
    password: string;
    email: string;
    telefone: string;
    imagem?: string
}