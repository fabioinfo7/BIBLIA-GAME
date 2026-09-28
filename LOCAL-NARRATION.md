# Arquitetura de narração local

## Produção

`story.ts` -> Piper (fora do jogo, uma vez) -> MP3 -> `public/audio/narracao` -> navegador.

Depois do deploy, o servidor só entrega arquivos estáticos. Não existe cobrança
por geração de voz e nenhuma chave de API de TTS precisa ficar no frontend.

## Fallback

Se uma fala ainda não tiver seu MP3, o jogo usa a voz pt-BR disponível no sistema
operacional apenas como contingência. Isso não é o caminho principal.

## Hospedagem

O projeto pode ser servido em uma hospedagem própria compatível com o build
Vite/TanStack Start. Os MP3s devem permanecer no diretório público para serem
acessíveis por `/audio/narracao/...`.
