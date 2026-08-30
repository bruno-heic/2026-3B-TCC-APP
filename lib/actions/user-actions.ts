import { supabase } from "@/lib/supabase";
import {
  ChangeEmailResult,
  DeleteAccountResult,
  ResetPasswordResult,
  SignInParams,
  SignInResult,
  SignUpParams,
  SignUpResult,
  UpdatePasswordResult,
  VerifyCodeResult,
} from "@/lib/types/types";

import { GetUserResult } from "@/lib/types/types";

export async function getUser(): Promise<GetUserResult> {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      return {
        sucess: false,
        error: authError.message,
      };
    }

    if (!user) {
      return {
        sucess: false,
        error: "Usuário não autenticado.",
      };
    }

    const { data: perfil, error: perfilError } = await supabase
      .from("usuario")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (perfilError) {
      return {
        sucess: false,
        error: perfilError.message,
      };
    }

    if (!perfil) {
      return {
        sucess: false,
        error: "Perfil do usuário não encontrado.",
      };
    }

    return {
      sucess: true,
      user: perfil,
    };
  } catch (err) {
    console.error("Erro inesperado ao buscar usuário:", err);

    return {
      sucess: false,
      error: "Ocorreu um erro inesperado. Tente novamente.",
    };
  }
}
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

export async function handleResetPassword(
  email: string,
): Promise<ResetPasswordResult> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      return { sucess: false, error: error.message };
    }

    return { sucess: true };
  } catch (err) {
    console.error("Erro inesperado ao solicitar recuperação:", err);
    return {
      sucess: false,
      error: "Ocorreu um erro inesperado. Tente novamente.",
    };
  }
}

export async function handleVerifyResetCode(
  email: string,
  codigo: string,
): Promise<VerifyCodeResult> {
  try {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: codigo,
      type: "recovery",
    });

    if (error) {
      return { sucess: false, error: error.message };
    }

    return { sucess: true };
  } catch (err) {
    console.error("Erro inesperado ao verificar código:", err);
    return {
      sucess: false,
      error: "Ocorreu um erro inesperado. Tente novamente.",
    };
  }
}

export async function handleUpdatePassword(
  novaSenha: string,
): Promise<UpdatePasswordResult> {
  try {
    const { error } = await supabase.auth.updateUser({
      password: novaSenha,
    });

    if (error) {
      return { sucess: false, error: error.message };
    }

    return { sucess: true };
  } catch (err) {
    console.error("Erro inesperado ao atualizar senha:", err);
    return {
      sucess: false,
      error: "Ocorreu um erro inesperado. Tente novamente.",
    };
  }
}

export async function handleDeleteAccount(): Promise<DeleteAccountResult> {
  try {
    const { data, error } = await supabase.functions.invoke("delete-account");

    if (error) {
      return { sucess: false, error: error.message };
    }

    if (data?.error) {
      return { sucess: false, error: data.error };
    }

    await supabase.auth.signOut();

    return { sucess: true };
  } catch (err) {
    console.error("Erro inesperado ao excluir conta:", err);
    return {
      sucess: false,
      error: "Ocorreu um erro inesperado. Tente novamente.",
    };
  }
}

export type UpdateNomeResult =
  | { sucess: true }
  | { sucess: false; error: string };

export async function handleUpdateNome(
  novoNome: string,
): Promise<UpdateNomeResult> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { sucess: false, error: "Usuário não autenticado." };
    }

    const { error } = await supabase
      .from("usuario")
      .update({ nome: novoNome })
      .eq("user_id", user.id);

    if (error) {
      return { sucess: false, error: error.message };
    }

    return { sucess: true };
  } catch (err) {
    console.error("Erro inesperado ao atualizar nome:", err);
    return {
      sucess: false,
      error: "Ocorreu um erro inesperado. Tente novamente.",
    };
  }
}

export async function handleChangeEmail(
  novoEmail: string,
): Promise<ChangeEmailResult> {
  try {
    const { error } = await supabase.auth.updateUser({ email: novoEmail });

    if (error) {
      return { sucess: false, error: error.message };
    }

    return { sucess: true };
  } catch (err) {
    console.error("Erro inesperado ao trocar e-mail:", err);
    return {
      sucess: false,
      error: "Ocorreu um erro inesperado. Tente novamente.",
    };
  }
}

export async function handleChangePasswordWithConfirm(
  email: string,
  senhaAtual: string,
  novaSenha: string,
): Promise<UpdatePasswordResult> {
  try {
    const { error: erroLogin } = await supabase.auth.signInWithPassword({
      email,
      password: senhaAtual,
    });

    if (erroLogin) {
      return { sucess: false, error: "Senha atual incorreta." };
    }

    const { error } = await supabase.auth.updateUser({ password: novaSenha });

    if (error) {
      return { sucess: false, error: error.message };
    }

    return { sucess: true };
  } catch (err) {
    console.error("Erro inesperado ao trocar senha:", err);
    return {
      sucess: false,
      error: "Ocorreu um erro inesperado. Tente novamente.",
    };
  }
}

export type UpdateUserFieldResult =
  | { sucess: true }
  | { sucess: false; error: string };

export async function updateUserField(
  field: "nome_usuario" | "email" | "senha",
  novoValor: string,
): Promise<UpdateUserFieldResult> {
  try {
    if (!novoValor.trim()) {
      return { sucess: false, error: "O valor não pode ficar vazio." };
    }
    if (field === "nome_usuario") {
      return await handleUpdateNome(novoValor);
    }
    if (field === "email") {
      return await handleChangeEmail(novoValor);
    }
    if (field === "senha") {
      return await handleUpdatePassword(novoValor);
    }
    return { sucess: false, error: "Campo inválido." };
  } catch (err) {
    console.error("Erro inesperado ao atualizar usuário:", err);
    return {
      sucess: false,
      error: "Ocorreu um erro inesperado. Tente novamente.",
    };
  }
}
