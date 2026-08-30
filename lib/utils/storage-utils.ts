export function extrairCaminhoDoStorage(
  publicUrl: string,
  bucket: string,
): string | null {
  const marcador = `/storage/v1/object/public/${bucket}/`;
  const index = publicUrl.indexOf(marcador);

  if (index === -1) {
    return null;
  }

  return publicUrl.substring(index + marcador.length);
}
