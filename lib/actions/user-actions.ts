import { supabase } from "@/lib/supabase";
import {
  SignInParams,
  SignInResult,
  SignUpParams,
  SignUpResult,
} from "../types/types";

export async function handleSignUser({
  nome,
  email,
  password,
}: SignUpParams): Promise<SignUpResult> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nome },
      },
    });

    if (error) {
      return { sucess: false, error: error.message };
    }

    if (!data.user) {
      return { sucess: false, error: "Usuário não foi criado corretamente." };
    }

    const { data: perfil, error: erroPerfil } = await supabase
      .from("usuario")
      .select("id_usuario")
      .eq("user_id", data.user.id)
      .single();

    if (erroPerfil || !perfil) {
      return {
        sucess: false,
        error: "Conta criada, mas houve um problema ao buscar o perfil.",
      };
    }

    return { sucess: true, idUsuario: perfil.id_usuario };
  } catch (err) {
    console.error("Erro inesperado no cadastro:", err);
    return {
      sucess: false,
      error: "Ocorreu um erro inesperado. Tente novamente.",
    };
  }
}

export async function handleLoginUser({
  email,
  password,
}: SignInParams): Promise<SignInResult> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { sucess: false, error: error.message };
    }

    if (!data.user) {
      return { sucess: false, error: "Não foi possível autenticar o usuário." };
    }

    const { data: perfil, error: erroPerfil } = await supabase
      .from("usuario")
      .select("id_usuario")
      .eq("user_id", data.user.id)
      .single();

    if (erroPerfil || !perfil) {
      return {
        sucess: false,
        error: "Login realizado, mas houve um problema ao buscar o perfil.",
      };
    }

    return { sucess: true, idUsuario: perfil.id_usuario };
  } catch (err) {
    console.error("Erro inesperado no login:", err);
    return {
      sucess: false,
      error: "Ocorreu um erro inesperado. Tente novamente.",
    };
  }
}

export async function handleLogout() {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Erro ao sair:", error.message);
    }
  } catch (err) {
    console.error("Erro inesperado ao sair:", err);
  }
}
