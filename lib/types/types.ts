export type SignUpParams = {
  nome: string;
  email: string;
  password: string;
};

export type SignUpResult = {
  sucesso: boolean;
  idUsuario?: number;
  erro?: string;
};
