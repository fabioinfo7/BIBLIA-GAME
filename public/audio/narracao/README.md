# Narração local

Esta pasta é o ponto de entrada da narração offline do jogo.

Estrutura:

- `narrador/*.mp3` — voz principal da história
- `noe/*.mp3` — voz do Noé

O jogo procura os arquivos localmente antes de usar qualquer fallback. **Nenhuma
API de TTS é chamada durante a partida.**

## Gerar as vozes gratuitamente

Instale/baixe o Piper e um modelo `pt_BR` compatível no seu computador/servidor.
Depois execute, na raiz do projeto:

```bash
python scripts/generate-narration-piper.py --piper piper --model ./models/pt_BR-model.onnx
```

O script lê `src/lib/story.ts`, gera as falas e converte para MP3.

Se quiser substituir a voz posteriormente, basta regenerar os mesmos arquivos;
o jogo não precisa ser alterado.
