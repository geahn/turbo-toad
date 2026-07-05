# 🏁 Turbo Toad — Placar do Jogo

App de suporte (mobile-first, funciona em qualquer dispositivo) para o jogo de
tabuleiro estilo Mario Kart. Faz o papel de "juiz digital": dados de número,
potencializadores e neutralizadores, moedas, itens, Lojinha do Toad e a posição
de cada piloto na pista.

## Como rodar

```bash
npm install
npm run dev        # abre em http://localhost:5173 (e no IP da rede p/ celular)
```

Para jogar do celular na mesma rede Wi-Fi, o terminal mostra um endereço
`http://192.168.x.x:5173` — abra esse no navegador do celular.

### Publicar (pra abrir de qualquer lugar / instalar na tela inicial)

```bash
npm run build      # gera a pasta dist/
```

Suba a pasta `dist/` em qualquer hospedagem estática grátis (GitHub Pages,
Netlify, Vercel, Cloudflare Pages). O app é um PWA: dá pra "Adicionar à tela de
início" no celular e usar como um app, inclusive offline.

## Modos

- **1 celular (passa e joga)** — um aparelho só passa de mão em mão.
- **Sala online (cada um no seu celular)** — o host cria uma sala e recebe um
  **código da pista**; os outros entram digitando o código. O celular do host é a
  autoridade da partida (P2P via WebRTC/PeerJS — sem servidor pra manter, sem
  conta). Cada um vê o seu piloto, joga o dado só na sua vez e pode espiar os
  outros. Funciona melhor com todos no mesmo Wi‑Fi.
- **Acompanhar pista** — o app rastreia posição, voltas, itens, moedas e status.
- **Só os dados** — sem rastrear a pista; só os 3 dados + controle de moedas.

> ⚠️ O modo online precisa de internet (só pro "aperto de mão" inicial entre os
> aparelhos). Depois de conectados, os dados trafegam direto entre os celulares.

## Ajustar o tabuleiro

A sequência de casas fica em [`src/data/board.ts`](src/data/board.ts) no array
`LAYOUT`. Conte as casas do seu tabuleiro impresso a partir da largada e ajuste
os tipos (`coin`, `power`, `shop`, `piranha`, `hole`, `start`) para bater 100%
com a pista real.

## Onde mexer

| Arquivo | O quê |
|---|---|
| `src/data/characters.ts` | pilotos, cores, emojis |
| `src/data/items.ts` | dados (potencializador/neutralizador) e Lojinha do Toad |
| `src/data/board.ts` | sequência de casas da pista |
| `src/store/gameStore.ts` | regras/estado da partida |
