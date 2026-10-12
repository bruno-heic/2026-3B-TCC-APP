import { Buffer } from "buffer";
import { PermissionsAndroid, Platform } from "react-native";
import { BleManager, Device } from "react-native-ble-plx";
import { supabase } from "../supabase";
const SERVICE_UUID = "4fafc201-1fb5-459e-8fcc-c5c9c331914b";
const CONFIG_UUID = "beb5483e-36e1-4688-b7f5-ea07361b26a8";
const STATUS_UUID = "beb5483e-36e1-4688-b7f5-ea07361b26a9";

// Característica somente de leitura criada no firmware do ESP32-C3.
const ID_UUID = "beb5483e-36e1-4688-b7f5-ea07361b26aa";

const manager = new BleManager();

const toB64 = (s: string) => Buffer.from(s, "utf8").toString("base64");

const fromB64 = (b: string) => Buffer.from(b, "base64").toString("utf8");

export type StatusColeira =
  | "PRONTA"
  | "CONECTANDO"
  | "OK"
  | "RECONHECIDA"
  | "RECUSADA"
  | "SEM_RESPOSTA"
  | "ERRO_SERIAL"
  | "ERRO_WIFI";

export type ResultadoConfigWifi = {
  status: string;
  idProduto: number | null;
};

export async function pedirPermissoes(): Promise<boolean> {
  if (Platform.OS !== "android") {
    return true;
  }

  const permissoes =
    Number(Platform.Version) >= 31
      ? [
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        ]
      : [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];

  const resultado = await PermissionsAndroid.requestMultiple(permissoes);

  return Object.values(resultado).every(
    (valor) => valor === PermissionsAndroid.RESULTS.GRANTED,
  );
}

function procurarColeira(timeoutMs = 15000): Promise<Device> {
  return new Promise((resolve, reject) => {
    let finalizado = false;

    const encerrarBusca = () => {
      if (finalizado) return false;

      finalizado = true;
      clearTimeout(timer);
      manager.stopDeviceScan();

      return true;
    };

    const timer = setTimeout(() => {
      if (!encerrarBusca()) return;

      reject(
        new Error(
          "Coleira não encontrada. Confira se está ligada e em modo de pareamento.",
        ),
      );
    }, timeoutMs);

    manager.startDeviceScan([SERVICE_UUID], null, (erro, device) => {
      if (finalizado) return;

      if (erro) {
        if (!encerrarBusca()) return;
        reject(erro);
        return;
      }

      if (device) {
        if (!encerrarBusca()) return;
        resolve(device);
      }
    });
  });
}

/**
 * Lê o ID do produto disponibilizado pela característica BLE do ESP32.
 * O firmware deve publicar o valor numérico em texto, por exemplo "123".
 */
async function lerIdProduto(device: Device): Promise<number> {
  const caracteristica = await device.readCharacteristicForService(
    SERVICE_UUID,
    ID_UUID,
  );

  if (!caracteristica.value) {
    throw new Error("A coleira não retornou o ID do produto pelo Bluetooth.");
  }

  const texto = fromB64(caracteristica.value).trim();
  const id = Number(texto);

  if (!texto || !Number.isSafeInteger(id) || id <= 0) {
    throw new Error(`O ID recebido da coleira é inválido: "${texto}".`);
  }

  return id;
}

function enviarConfigWifi(
  device: Device,
  serial: string,
  ssid: string,
  senha: string,
  onStatus: (status: string) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const STATUS_FINAIS = [
      "RECONHECIDA",
      "RECUSADA",
      "SEM_RESPOSTA",
      "ERRO_SERIAL",
      "ERRO_WIFI",
    ];

    let terminou = false;
    let timer: ReturnType<typeof setTimeout>;

    const encerrar = (acao: () => void) => {
      if (terminou) return;

      terminou = true;
      clearTimeout(timer);
      clearTimeout(timerEnvio);
      subscription.remove();

      acao();
    };

    timer = setTimeout(() => {
      encerrar(() => reject(new Error("A coleira não respondeu a tempo.")));
    }, 60000);

    const subscription = device.monitorCharacteristicForService(
      SERVICE_UUID,
      STATUS_UUID,
      (erro, caracteristica) => {
        if (terminou) return;

        if (erro) {
          encerrar(() => reject(erro));
          return;
        }

        if (!caracteristica?.value) return;

        const status = fromB64(caracteristica.value).trim();

        onStatus(status);

        if (STATUS_FINAIS.includes(status)) {
          encerrar(() => resolve(status));
        }
      },
    );

    const timerEnvio = setTimeout(() => {
      if (terminou) return;

      device
        .writeCharacteristicWithResponseForService(
          SERVICE_UUID,
          CONFIG_UUID,
          toB64(`${serial}\n${ssid}\n${senha}`),
        )
        .catch((erro: unknown) => {
          encerrar(() =>
            reject(
              erro instanceof Error
                ? erro
                : new Error("Não foi possível enviar os dados do Wi-Fi."),
            ),
          );
        });
    }, 400);
  });
}

export async function configurarWifiDaColeira(
  serial: string,
  ssid: string,
  senha: string,
  onStatus: (status: string) => void,
): Promise<ResultadoConfigWifi> {
  let device: Device | null = null;

  try {
    onStatus("PRONTA");

    const encontrada = await procurarColeira();

    device = await encontrada.connect();

    await device.discoverAllServicesAndCharacteristics();

    // Lemos o ID depois de descobrir os serviços e antes de enviar a configuração.
    const idProduto = await lerIdProduto(device);

    const status = await enviarConfigWifi(
      device,
      serial.trim().toUpperCase(),
      ssid.trim(),
      senha,
      onStatus,
    );

    return {
      status,
      idProduto,
    };
  } finally {
    if (device) {
      await device.cancelConnection().catch(() => {});
    }
  }
}

export async function ativarProduto(idProduto: number) {
  try {
    if (!Number.isSafeInteger(idProduto) || idProduto <= 0) {
      return {
        sucess: false as const,
        error: "O ID do produto é inválido.",
      };
    }

    // 1. Consultar o estado atual do produto.
    const { data: produto, error: erroConsulta } = await supabase
      .from("produto")
      .select("id_produto, status, data_ativacao")
      .eq("id_produto", idProduto)
      .maybeSingle();

    if (erroConsulta) {
      console.error("Erro ao consultar produto:", erroConsulta);

      return {
        sucess: false as const,
        error: erroConsulta.message,
      };
    }

    if (!produto) {
      return {
        sucess: false as const,
        error: `O produto ${idProduto} não existe ou não pode ser consultado.`,
      };
    }

    // 2. Se já foi ativado, não alterar a data original.
    if (produto.status === "ativado") {
      return {
        sucess: true as const,
        produto,
      };
    }

    // 3. Só permitir a primeira ativação de um produto fabricado.
    if (produto.status !== "fabricado") {
      return {
        sucess: false as const,
        error: `Não é possível ativar o produto. Status atual: ${produto.status}.`,
      };
    }

    // 4. Ativar o produto.
    const { data, error } = await supabase
      .from("produto")
      .update({
        status: "ativado",
        data_ativacao: new Date().toISOString(),
      })
      .eq("id_produto", idProduto)
      .eq("status", "fabricado")
      .select("id_produto, status, data_ativacao")
      .maybeSingle();

    if (error) {
      console.error("Erro na atualização do produto:", error);

      return {
        sucess: false as const,
        error: error.message,
      };
    }

    if (!data) {
      return {
        sucess: false as const,
        error:
          "O produto não foi ativado. Ele pode ter sido alterado por outra operação ou as políticas RLS podem impedir a atualização.",
      };
    }

    return {
      sucess: true as const,
      produto: data,
    };
  } catch (error) {
    return {
      sucess: false as const,
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível ativar o produto.",
    };
  }
}

export type CollarDevice = {
  id_dispositivo: number;
  id_pet: number | null;
  id_produto: number;
  nome_personalizado: string | null;
  pet: Record<string, any> | null;
  produto: Record<string, any> | null;
  [key: string]: any;
};

export type CollarResult =
  | { sucess: true; collars: CollarDevice[] }
  | { sucess: false; error: string };

export type AvailableProductResult =
  | { sucess: true; products: Record<string, any>[] }
  | { sucess: false; error: string };

export async function getCollars(
  idUsuario: number,
  idPet?: number,
): Promise<CollarResult> {
  try {
    if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
      return {
        sucess: false,
        error: "O ID do usuário é inválido.",
      };
    }

    let query = supabase
      .from("dispositivo")
      .select("*, pet!inner(*), produto(*)")
      .eq("pet.id_usuario", idUsuario)
      .order("id_dispositivo", { ascending: false });

    if (idPet !== undefined) {
      query = query.eq("id_pet", idPet);
    }

    const { data, error } = await query;

    if (error) {
      return { sucess: false, error: error.message };
    }

    return {
      sucess: true,
      collars: (data ?? []) as CollarDevice[],
    };
  } catch (error) {
    return {
      sucess: false,
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível carregar os dispositivos.",
    };
  }
}

export async function getAvailableProducts(
  idUsuario: number,
): Promise<AvailableProductResult> {
  try {
    if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
      return {
        sucess: false,
        error: "O ID do usuário é inválido.",
      };
    }

    const { data: produtos, error: erroProdutos } = await supabase
      .from("produto")
      .select("*")
      .order("id_produto", { ascending: true });

    if (erroProdutos) {
      return { sucess: false, error: erroProdutos.message };
    }

    const { data: dispositivos, error: erroDispositivos } = await supabase
      .from("dispositivo")
      .select("id_produto, pet!inner(id_usuario)")
      .eq("pet.id_usuario", idUsuario);

    if (erroDispositivos) {
      return { sucess: false, error: erroDispositivos.message };
    }

    const produtosVinculados = new Set(
      (dispositivos ?? []).map((item) => item.id_produto),
    );

    const disponiveis = (produtos ?? []).filter(
      (produto) => !produtosVinculados.has(produto.id_produto),
    );

    return {
      sucess: true,
      products: disponiveis as Record<string, any>[],
    };
  } catch (error) {
    return {
      sucess: false,
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível carregar os produtos disponíveis.",
    };
  }
}

export type UpdateCollarDeviceInput = {
  idDispositivo: number;
  idPet: number;
  nomePersonalizado: string;
};

export async function updateCollarDevice(input: UpdateCollarDeviceInput) {
  try {
    if (
      !Number.isSafeInteger(input.idDispositivo) ||
      input.idDispositivo <= 0
    ) {
      return {
        sucess: false as const,
        error: "O ID do dispositivo é inválido.",
      };
    }

    if (!Number.isSafeInteger(input.idPet) || input.idPet <= 0) {
      return {
        sucess: false as const,
        error: "Selecione um pet válido.",
      };
    }

    const nome = input.nomePersonalizado.trim();

    if (!nome || nome.length > 50) {
      return {
        sucess: false as const,
        error: "Informe um nome entre 1 e 50 caracteres.",
      };
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
      .from("dispositivo")
      .update({
        id_pet: input.idPet,
        nome_personalizado: nome,
      })
      .eq("id_dispositivo", input.idDispositivo)
      .select("id_dispositivo, id_pet, id_produto, nome_personalizado")
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      throw new Error(
        "Não foi possível atualizar o dispositivo. Ele pode não existir ou você não ter permissão para alterá-lo.",
      );
    }

    return {
      sucess: true as const,
      dispositivo: data,
    };
  } catch (error) {
    return {
      sucess: false as const,
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o dispositivo.",
    };
  }
}

export async function deleteCollarDevice(idDispositivo: number) {
  try {
    if (!Number.isSafeInteger(idDispositivo) || idDispositivo <= 0) {
      return {
        sucess: false as const,
        error: "O ID do dispositivo é inválido.",
      };
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
      .from("dispositivo")
      .delete()
      .eq("id_dispositivo", idDispositivo)
      .select("id_dispositivo")
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      throw new Error(
        "Não foi possível remover o dispositivo. Ele pode já ter sido removido ou você não ter permissão.",
      );
    }

    return {
      sucess: true as const,
    };
  } catch (error) {
    return {
      sucess: false as const,
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível remover o dispositivo.",
    };
  }
}
