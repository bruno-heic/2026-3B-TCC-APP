export type SignUpParams = {
  nome: string;
  email: string;
  password: string;
};

export type SignUpResult = {
  sucess: boolean;
  idUsuario?: number;
  error?: string;
};

export type SignInParams = {
  email: string;
  password: string;
};

export type SignInResult =
  | { sucess: true; idUsuario: number }
  | { sucess: false; error: string };
