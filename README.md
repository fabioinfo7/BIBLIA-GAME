# Welcome to your Lovable project

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Open your project in the [Lovable editor](https://lovable.dev) and keep building.

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: connect the project to GitHub and every change made in Lovable is committed straight to your repository.
- **Full ownership**: this code is yours. Push to your repository and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS

## Narração local / hospedagem própria

A narração do jogo agora é **local-first**: os arquivos de voz ficam em
`public/audio/narracao/` e são reproduzidos diretamente pelo navegador. O jogo
não depende do Lovable, de Groq ou de qualquer API de TTS durante a partida.

Para gerar os arquivos gratuitamente, use Piper localmente e o script
`scripts/generate-narration-piper.py`. O `SpeechSynthesis` do navegador permanece
apenas como fallback de acessibilidade caso algum clipe local ainda não tenha
sido gerado.
