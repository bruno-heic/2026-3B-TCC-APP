// Guarda a câmera conectada (inclui a senha dentro do endereço RTSP) no cofre
// seguro do celular, para o tutor não precisar conectar de novo toda vez.
//
// Se o app instalado for uma versão antiga (sem o cofre), nada quebra:
// a câmera só não fica salva.

export type CameraSalva = {
  marca: string; // id da marca (ex.: "intelbras")
  nome: string; // nome da marca para mostrar na tela
  ip: string;
  url: string; // endereço RTSP completo
};

function cofre(): any {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("expo-secure-store");
  } catch {
    return null;
  }
}

const CHAVE = "petify_camera";

export async function salvarCamera(dados: CameraSalva): Promise<void> {
  try {
    await cofre()?.setItemAsync(CHAVE, JSON.stringify(dados));
  } catch {}
}

export async function carregarCamera(): Promise<CameraSalva | null> {
  try {
    const texto = await cofre()?.getItemAsync(CHAVE);
    return texto ? (JSON.parse(texto) as CameraSalva) : null;
  } catch {
    return null;
  }
}

export async function esquecerCamera(): Promise<void> {
  try {
    await cofre()?.deleteItemAsync(CHAVE);
  } catch {}
}
