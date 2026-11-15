# Deck

O motor dos slides: um site Next.js exportado como arquivos estáticos, que o backstage serve em
`/apresentador`. As apresentações ficam em `talks/`; a variável `TALK` escolhe qual usar (padrão:
`starter`). O guia de autoria está em [`../AGENTS.md`](../AGENTS.md).

```bash
npm install
npm run new -- minha-palestra        # cria talks/minha-palestra a partir de talks/starter
TALK=minha-palestra npm run dev      # http://localhost:3000/apresentador/ (recarga automática)
TALK=minha-palestra npm run build    # gera ./out (estático, funciona offline)
TALK=minha-palestra npm run typecheck
```

No PowerShell: `$env:TALK = 'minha-palestra'; npm run dev`.

`scripts/prepare.mjs` roda antes de `dev`, `build` e `typecheck`: copia `talks/<TALK>/public` para
`./public`, converte o `ROTEIRO.md` em `components/roteiro.json` e gera
`components/talk.generated.ts`, por onde o motor importa os slides e a configuração. Os três são
gerados e ficam fora do git. Imagem nova em `public/` da apresentação pede reiniciar o `dev`.

## Estrutura

| Pasta | O que é |
|---|---|
| `components/` | o motor: `Deck` (navegação, passos, notas), `Live` (reações, votação, ponteiro), `Remote` (passador), `Print` (PDF), `Chrome` (autor e QR), `theme.ts` (tokens), `i18n.ts` (textos em pt-BR e inglês) |
| `app/` | as rotas (`/N/`, `/remoto/`, `/pdf/`) e `globals.css` (palco, blocos, animações) |
| `scripts/` | `prepare.mjs`, `roteiro.mjs`, `new-talk.mjs`, `pdf.mjs` |
| `talks/` | as apresentações; `starter` é a inicial |

O contrato entre motor e apresentação está em `components/types.ts`; a única porta é
`components/content.ts`. As mensagens trocadas com o backstage são tipadas em
`../backstage/protocol.ts`, que `Live.tsx` e `Remote.tsx` importam.

## Exportar em PDF

```bash
TALK=minha-palestra npm run pdf                    # builda e gera ./slides.pdf (16:9, tema escuro)
TALK=minha-palestra npm run pdf -- --tema=claro    # tema claro, melhor para imprimir
npm run pdf -- --saida=caminho.pdf                 # outro arquivo
TALK=minha-palestra npm run png                    # uma imagem por slide em ./slides-png/
```

Usa o Chrome ou o Edge instalado, sem abrir janela (`CHROME_PATH` aponta para outro executável).
Cada slide vira uma página no estado final: todos os passos revelados, sem notas e, no lugar do
vídeo, o resumo em texto. O QR só sai no PDF se houver um endereço fixo (`publicUrl` no
`deck.config.json` ou `NEXT_PUBLIC_QR_URL` no build): o do túnel muda a cada subida.

Pelo navegador: abra `/apresentador/pdf/`, clique em "Salvar em PDF" e, na janela de impressão,
escolha "Salvar como PDF", margens "Nenhuma" e "Gráficos de plano de fundo".

## Teclas

`←` `→` `espaço` `PgUp`/`PgDn` navegar (funciona com passador de slides) · `N` notas do
apresentador · `O` visão geral · `F` tela cheia · `T` tema claro/escuro · `B` ou `.` tela preta ·
`R` zera o cronômetro · `V` toca/pausa o vídeo · `L` robô das reações · `P` votação 👍/👎 ·
`Home`/`End`.

## Apresentando

- **Duas janelas sincronizadas:** abra o mesmo endereço em duas janelas do mesmo navegador. Uma vai em tela cheia no projetor (`F`); na outra, ligue as notas (`N`). Navegar em qualquer uma move as duas.
- **Notas:** cronômetro (começa no primeiro avanço; `R` zera), minuto previsto com adiantado/atrasado, passo atual e título do próximo slide.
- **Passos:** elementos com `data-frag="1"`, `"2"`... aparecem um por clique. Voltar entra no slide anterior já completo.
- **Transições:** só `transform`/`opacity`. Com "reduzir movimento" ligado no sistema, tudo vira troca seca.
- **Passador no celular:** `/apresentador/remoto/`: roteiro do slide, cronômetro, avançar/voltar e ponteiro (laser ou holofote) tocando a prévia. Manda as mesmas teclas do teclado pelo backstage.
- **Backstage ao vivo:** o deck conecta sozinho em `/apresentador/ws` do mesmo domínio (ver [`../backstage/README.md`](../backstage/README.md)). Em `next dev`, numa porta separada, `NEXT_PUBLIC_LIVE_URL` aponta para o backstage. Sem backstage, a camada de reações não aparece e nada mais muda.
- **QR:** o endereço da plateia chega do backstage quando o deck conecta e o QR é desenhado no navegador, sem rede. Nos slides `title` e `final` ele cresce para ser lido do fundo da sala.
- **Projetor:** cursor e dica de teclas somem após 2,5 s parado. Se o projetor lavar o fundo escuro, `T` troca para o tema claro.

O deck mora em `/apresentador` (`basePath` em `next.config.ts`), então `npx serve out` não serve os
assets; para ver o build com o backstage, use `docker compose up --build` na raiz. Caminhos
escritos à mão (`img`, `video`) usam `BASE` de `components/base.ts`.
