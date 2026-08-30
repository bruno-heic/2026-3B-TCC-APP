import { supabase } from "@/lib/supabase";
import {
  CreatePetParams,
  CreatePetResult,
  GetPetsResult,
} from "@/lib/types/types";
import { decode } from "base64-arraybuffer";
import { File } from "expo-file-system";
import { VerifyPetsResult } from "../types/types";

export async function checkUserPets(
  idUsuario: number,
): Promise<VerifyPetsResult> {
  try {
    const { data, error } = await supabase
      .from("pet")
      .select("id_pet")
      .eq("id_usuario", idUsuario);

    if (error) {
      return { sucess: false, error: error.message };
    }

    return { sucess: true, hasPets: (data?.length ?? 0) > 0 };
  } catch (err) {
    console.error("Erro inesperado ao verificar pets:", err);
    return {
      sucess: false,
      error: "Ocorreu um erro inesperado. Tente novamente.",
    };
  }
}

type UploadImageResult =
  | { sucess: true; url: string }
  | { sucess: false; error: string };

export async function uploadPetImage(
  localUri: string,
): Promise<UploadImageResult> {
  try {
    const file = new File(localUri);
    const base64 = await file.base64();

    const filePath = `pets/${Date.now()}.jpg`;

    const { error } = await supabase.storage
      .from("pets")
      .upload(filePath, decode(base64), {
        contentType: "image/jpeg",
      });

    if (error) {
      return { sucess: false, error: error.message };
    }

    const { data } = supabase.storage.from("pets").getPublicUrl(filePath);

    return { sucess: true, url: data.publicUrl };
  } catch (err) {
    console.error("Erro inesperado no upload:", err);
    return {
      sucess: false,
      error: "Ocorreu um erro inesperado ao enviar a imagem.",
    };
  }
}

export function formatarDataParaSupabase(data: string): string | null {
  const partes = data.split("/");

  if (partes.length !== 3) {
    return null;
  }

  const [dia, mes, ano] = partes;
  return `${ano}-${mes}-${dia}`;
}

export async function createPet({
  idUsuario,
  nome,
  especie,
  raca,
  dataNascimento,
  peso,
  imagemUri,
}: CreatePetParams): Promise<CreatePetResult> {
  try {
    if (!nome || !especie) {
      return { sucess: false, error: "Nome e espécie são obrigatórios." };
    }

    const dataFormatada = formatarDataParaSupabase(dataNascimento);

    if (dataNascimento && !dataFormatada) {
      return { sucess: false, error: "Data de nascimento inválida." };
    }

    const pesoNumero = peso ? parseFloat(peso.replace(",", ".")) : null;

    let fotoUrl: string | null = null;

    if (imagemUri) {
      const resultadoUpload = await uploadPetImage(imagemUri);

      if (!resultadoUpload.sucess) {
        return { sucess: false, error: resultadoUpload.error };
      }

      fotoUrl = resultadoUpload.url;
    }

    const { data, error } = await supabase
      .from("pet")
      .insert({
        id_usuario: idUsuario,
        nome,
        especie,
        raca,
        data_nascimento: dataFormatada,
        peso: pesoNumero,
        foto_url: fotoUrl,
      })
      .select("id_pet")
      .single();

    if (error) {
      return { sucess: false, error: error.message };
    }

    if (!data) {
      return { sucess: false, error: "Pet não foi criado corretamente." };
    }

    return { sucess: true, idPet: data.id_pet };
  } catch (err) {
    console.error("Erro inesperado ao cadastrar pet:", err);
    return {
      sucess: false,
      error: "Ocorreu um erro inesperado. Tente novamente.",
    };
  }
}

export async function getUserPets(idUsuario: number): Promise<GetPetsResult> {
  try {
    const { data, error } = await supabase
      .from("pet")
      .select("id_pet, nome, especie, raca, data_nascimento, peso, foto_url")
      .eq("id_usuario", idUsuario)
      .order("id_pet", { ascending: true });

    if (error) {
      return { sucess: false, error: error.message };
    }

    return { sucess: true, pets: data ?? [] };
  } catch (err) {
    console.error("Erro inesperado ao buscar pets:", err);
    return {
      sucess: false,
      error: "Ocorreu um erro inesperado ao buscar os pets.",
    };
  }
}

export type UpdatePetResult =
  | { sucess: true }
  | { sucess: false; error: string };

export async function updatePetField(
  idPet: number,
  campo: string,
  valor: string | number,
): Promise<UpdatePetResult> {
  try {
    const { error } = await supabase
      .from("pet")
      .update({ [campo]: valor })
      .eq("id_pet", idPet);

    if (error) {
      return { sucess: false, error: error.message };
    }

    return { sucess: true };
  } catch (err) {
    console.error("Erro inesperado ao atualizar pet:", err);
    return {
      sucess: false,
      error: "Ocorreu um erro inesperado. Tente novamente.",
    };
  }
}
