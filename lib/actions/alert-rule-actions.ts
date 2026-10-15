import { supabase } from "@/lib/supabase";

export type AlertRule = {
  id_regra: number;
  id_pet: number;
  freq_cardiaca_min: number | null;
  freq_cardiaca_max: number | null;
  temperatura_min: number | null;
  temperatura_max: number | null;
  freq_respiratoria_min: number | null;
  freq_respiratoria_max: number | null;
  bateria_minima: number | null;
  alertar_latido: boolean;
  ativo: boolean;
  data_atualizacao: string;
};

export type AlertRuleFormData = {
  freq_cardiaca_min: number | null;
  freq_cardiaca_max: number | null;
  temperatura_min: number | null;
  temperatura_max: number | null;
  freq_respiratoria_min: number | null;
  freq_respiratoria_max: number | null;
  bateria_minima: number | null;
  alertar_latido: boolean;
  ativo: boolean;
};

type ActionResult<T> = {
  sucess: boolean;
  error?: string;
  regra?: T;
};

function validarRegra(dados: AlertRuleFormData): string | null {
  const pares: [string, number | null, number | null][] = [
    ["Frequência cardíaca", dados.freq_cardiaca_min, dados.freq_cardiaca_max],
    ["Temperatura", dados.temperatura_min, dados.temperatura_max],
    [
      "Frequência respiratória",
      dados.freq_respiratoria_min,
      dados.freq_respiratoria_max,
    ],
  ];

  for (const [nome, minimo, maximo] of pares) {
    if (minimo !== null && maximo !== null && minimo > maximo) {
      return `O valor mínimo de ${nome.toLowerCase()} não pode ser maior que o máximo.`;
    }
  }

  if (
    dados.bateria_minima !== null &&
    (dados.bateria_minima < 0 || dados.bateria_minima > 100)
  ) {
    return "A bateria mínima deve estar entre 0 e 100%.";
  }

  return null;
}

export async function getAlertRule(
  idPet: number,
): Promise<ActionResult<AlertRule | null>> {
  try {
    const { data, error } = await supabase
      .from("regra_alerta")
      .select("*")
      .eq("id_pet", idPet)
      .maybeSingle();

    if (error) throw error;

    return {
      sucess: true,
      regra: data as AlertRule | null,
    };
  } catch (error) {
    return {
      sucess: false,
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível consultar a regra de alerta.",
    };
  }
}

export async function createAlertRule(
  idPet: number,
  dados: AlertRuleFormData,
): Promise<ActionResult<AlertRule>> {
  const erroValidacao = validarRegra(dados);

  if (erroValidacao) {
    return { sucess: false, error: erroValidacao };
  }

  try {
    const { data, error } = await supabase
      .from("regra_alerta")
      .insert({
        id_pet: idPet,
        ...dados,
      })
      .select("*")
      .single();

    if (error) throw error;

    return {
      sucess: true,
      regra: data as AlertRule,
    };
  } catch (error) {
    return {
      sucess: false,
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível cadastrar a regra.",
    };
  }
}

export async function updateAlertRule(
  idPet: number,
  dados: AlertRuleFormData,
): Promise<ActionResult<AlertRule>> {
  const erroValidacao = validarRegra(dados);

  if (erroValidacao) {
    return { sucess: false, error: erroValidacao };
  }

  try {
    const { data, error } = await supabase
      .from("regra_alerta")
      .update({
        ...dados,
        data_atualizacao: new Date().toISOString(),
      })
      .eq("id_pet", idPet)
      .select("*")
      .single();

    if (error) throw error;

    return {
      sucess: true,
      regra: data as AlertRule,
    };
  } catch (error) {
    return {
      sucess: false,
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar a regra.",
    };
  }
}

export async function toggleAlertRule(
  idPet: number,
  ativo: boolean,
): Promise<ActionResult<AlertRule>> {
  try {
    const { data, error } = await supabase
      .from("regra_alerta")
      .update({
        ativo,
        data_atualizacao: new Date().toISOString(),
      })
      .eq("id_pet", idPet)
      .select("*")
      .single();

    if (error) throw error;

    return {
      sucess: true,
      regra: data as AlertRule,
    };
  } catch (error) {
    return {
      sucess: false,
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível alterar o estado da regra.",
    };
  }
}
