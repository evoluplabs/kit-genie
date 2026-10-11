#!/usr/bin/env bash
# Junta as gravações brutas (saida/bruto/NN-*.mp4) nos arquivos finais em saida/.
#   saida/secoes/NN-nome.mp4          um clipe por seção (1080×1920) — para cortes e Reels
#   saida/completo-1080x1920.mp4      vídeo completo, qualidade alta (Reels, Instagram, YouTube Shorts)
#   saida/whatsapp-720x1280.mp4       vídeo completo leve (abaixo do limite de 16 MB do WhatsApp)
# Todos: H.264 (perfil High) + AAC (faixa de áudio silenciosa, por compatibilidade), 30 fps, início rápido.
set -euo pipefail
cd "$(dirname "$0")"
BRUTO=saida/bruto; SEC=saida/secoes; mkdir -p "$SEC"
SILENCIO=(-f lavfi -i "anullsrc=r=44100:cl=stereo")
AUDIO=(-c:a aac -b:a 96k -shortest)
VIDEO=(-c:v libx264 -profile:v high -pix_fmt yuv420p -r 30 -movflags +faststart)

for f in "$BRUTO"/0*.mp4; do
  nome=$(basename "$f")
  ffmpeg -y -loglevel error -i "$f" "${SILENCIO[@]}" "${VIDEO[@]}" -preset slow -crf 20 "${AUDIO[@]}" "$SEC/$nome"
  echo "clipe  $nome"
done

lista=$(mktemp); trap 'rm -f "$lista"' EXIT
for f in "$BRUTO"/0*.mp4; do echo "file '$PWD/$f'" >> "$lista"; done

ffmpeg -y -loglevel error -f concat -safe 0 -i "$lista" "${SILENCIO[@]}" "${VIDEO[@]}" -preset slow -crf 20 "${AUDIO[@]}" saida/completo-1080x1920.mp4
echo "completo ok"
ffmpeg -y -loglevel error -f concat -safe 0 -i "$lista" "${SILENCIO[@]}" -vf "scale=720:1280:flags=lanczos" "${VIDEO[@]}" -preset slow -crf 26 -maxrate 1500k -bufsize 3000k -c:a aac -b:a 64k -shortest saida/whatsapp-720x1280.mp4
echo "whatsapp ok"
