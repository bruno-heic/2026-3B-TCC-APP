import { supabase } from "../supabase";

export type SafeArea = {
  id_area: number;
  id_pet: number;
  nome: string;
  latitude_central: number;
  longitude_central: number;
  raio_metros: number;
};

export type SafeAreaResult =
  | { sucess: true; areas: SafeArea[] }
  | { sucess: false; error: string };

export async function getSafeAreas(idPet: number): Promise<SafeAreaResult> {
  try {
    if (!Number.isSafeInteger(idPet) || idPet <= 0) {
      return {
        sucess: false,
        error: "O ID do pet é inválido.",
      };
    }

    const { data, error } = await supabase
      .from("area_segura")
      .select(
        "id_area, id_pet, nome, latitude_central, longitude_central, raio_metros",
      )
      .eq("id_pet", idPet)
      .order("id_area", { ascending: true });

    if (error) {
      throw error;
    }

    return {
      sucess: true,
      areas: (data ?? []) as SafeArea[],
    };
  } catch (error) {
    return {
      sucess: false,
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível carregar as áreas seguras.",
    };
  }
}

export type CreateSafeAreaInput = {
  idPet: number;
  nome: string;
  latitude: number;
  longitude: number;
  raioMetros: number;
};

export async function createSafeArea(input: CreateSafeAreaInput) {
  try {
    const nome = input.nome.trim();

    if (!Number.isSafeInteger(input.idPet) || input.idPet <= 0) {
      throw new Error("O pet selecionado é inválido.");
    }

    if (!nome || nome.length > 60) {
      throw new Error("Informe um nome de até 60 caracteres.");
    }

    if (
      !Number.isFinite(input.latitude) ||
      input.latitude < -90 ||
      input.latitude > 90
    ) {
      throw new Error("A latitude informada é inválida.");
    }

    if (
      !Number.isFinite(input.longitude) ||
      input.longitude < -180 ||
      input.longitude > 180
    ) {
      throw new Error("A longitude informada é inválida.");
    }

    if (
      !Number.isSafeInteger(input.raioMetros) ||
      input.raioMetros < 10 ||
      input.raioMetros > 10000
    ) {
      throw new Error("O raio deve estar entre 10 e 10.000 metros.");
    }

    const {
      data: { user },
      error: erroAuth,
    } = await supabase.auth.getUser();

    if (erroAuth) throw erroAuth;

    if (!user) {
      throw new Error("Você precisa estar autenticado.");
    }

    const { data, error } = await supabase
      .from("area_segura")
      .insert({
        id_pet: input.idPet,
        nome,
        latitude_central: input.latitude,
        longitude_central: input.longitude,
        raio_metros: input.raioMetros,
      })
      .select(
        "id_area, id_pet, nome, latitude_central, longitude_central, raio_metros",
      )
      .single();

    if (error) throw error;

    return {
      sucess: true as const,
      area: data as SafeArea,
    };
  } catch (error) {
    return {
      sucess: false as const,
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível cadastrar a área segura.",
    };
  }
}

export async function deleteSafeArea(idArea: number) {
  try {
    if (!Number.isSafeInteger(idArea) || idArea <= 0) {
      throw new Error("O ID da área é inválido.");
    }

    const {
      data: { user },
      error: erroAuth,
    } = await supabase.auth.getUser();

    if (erroAuth) throw erroAuth;

    if (!user) {
      throw new Error("Você precisa estar autenticado.");
    }

    const { data, error } = await supabase
      .from("area_segura")
      .delete()
      .eq("id_area", idArea)
      .select("id_area")
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      throw new Error(
        "Não foi possível excluir a área. Verifique suas permissões.",
      );
    }

    return { sucess: true as const };
  } catch (error) {
    return {
      sucess: false as const,
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível excluir a área segura.",
    };
  }
}
