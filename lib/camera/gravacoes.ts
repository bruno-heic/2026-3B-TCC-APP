import { Directory, Paths } from "expo-file-system";

// Pasta onde ficam as gravações (dentro do app, não precisa de permissão).
export function pastaGravacoes(): Directory {
  const pasta = new Directory(Paths.document, "gravacoes");
  if (!pasta.exists) {
    pasta.create({ intermediates: true, idempotent: true });
  }
  return pasta;
}

// Caminho "puro" (sem file://) que o player de vídeo espera para gravar.
export function caminhoParaGravar(): string {
  return pastaGravacoes().uri.replace(/^file:\/\//, "");
}

// Opções do player para vídeo ao vivo de câmera (RTSP).
export const OPCOES_RTSP = ["--rtsp-tcp", "--network-caching=300"];
