# Backstage ao vivo

Página que a plateia abre pelo QR (grande no primeiro e no último slide, pequeno no canto dos
outros): vê o slide atual, os links já citados, reage (as reações vêm do `deck.config.json`) e vota quando o
apresentador abre uma votação, em qualquer slide: 👍/👎 com a pergunta falada, ou a pergunta e as
opções que o slide define em `poll`.
As reações aparecem flutuando no projetor.

Quantas pessoas estão conectadas e se o robô está ligado aparecem **só no passador** do
apresentador. A plateia e o telão não veem a contagem, e as reações do robô são iguais às da
plateia (mesmo lote, sem marca).

O deck **não depende** disto. Se o servidor cair ou não houver rede, o deck segue igual, só sem
reações.

## Endereços

| Caminho | O que é | No ar |
|---|---|---|
| `/` (e `/live`) | página da plateia | público, é o destino do QR |
| `/ws` | socket da plateia: reage e vota | público |
| `/apresentador/` | o deck (export estático de `../deck`) | só com o token |
| `/apresentador/remoto/` | o passador no celular: roteiro, avançar/voltar, ponteiro, tela cheia, enviar a tela | só com o token |
| `/apresentador/ws` | socket do palco: deck e passador | só com o token |
| `/apresentador/metricas` | relatório da palestra (e `metricas.json`) | só com o token |
| `/tela.jpg` | a foto do slide que está no telão, enquanto o envio da tela estiver ligado (404 fora disso) | público |
| `/state`, `/healthz` | estado público em JSON (slide, links, votação; sem contagem nem robô), health check | público |

Quem é deck é decidido pelo **caminho** da conexão, não por mensagem: um celular conectado em `/ws`
não consegue trocar o slide, injetar links nem abrir a votação.

## Token do apresentador

Tudo sob `/apresentador` (páginas, assets, socket e métricas) exige o token. Ao subir, o servidor
imprime os links já com `?token=...`; abrir um deles grava um cookie `HttpOnly` restrito ao prefixo
e redireciona para o endereço limpo. Sem o cookie, a resposta é 401.

| Variável | Para quê |
|---|---|
| `PRESENTER_TOKEN` | fixa o token. Sem ela, é sorteado; com `DATA_DIR`, fica guardado em `presenter-token` e sobrevive a reinícios |
| `PRESENTER_AUTH=off` | desliga a checagem, quando outra camada protege o prefixo (um proxy com autenticação, uma VPN) ou em desenvolvimento |
| `PUBLIC_URL` | endereço fixo da plateia (o do QR) |
| `TUNNEL_METRICS` | porta de métricas do `cloudflared` (`http://tunnel:2000`): o servidor pergunta em `/quicktunnel` qual endereço o túnel rápido sorteou |
| `LOCAL_URL` | como o notebook chega ao servidor (só muda o que é impresso; o compose define) |
| `DECK_CONFIG` | caminho do `deck.config.json` (título, evento, reações e tema da página da plateia). Sem ela, vale o de `../deck/talks/<TALK>/` (`TALK` padrão: `starter`) |
| `DATA_DIR`, `BOT_SILENCE_MS`, `PORT`, `DECK_DIR` | volume das métricas, silêncio antes do robô, porta, pasta do deck buildado |

O endereço da plateia vai para o deck dentro do estado do palco (`publicUrl`), e o deck desenha o
QR na hora. Se o `cloudflared` reiniciar e o endereço mudar, o QR dos slides muda junto em até 30 s.

## Rodar local

```bash
../dev.sh          # deck com hot reload (:3000/apresentador/) + backstage (:8080)
../dev.sh build    # deck buildado servido pelo backstage, igual ao que vai ao ar
```

O `dev.sh` roda com `PRESENTER_AUTH=off`. Abra o deck, aperte `L` (liga o robô) e abra
`http://IP-DA-MAQUINA:8080/` no celular. Testes: `npm test`.

## No ar

```bash
docker compose up --build   # da raiz: backstage + túnel do Cloudflare
```

Uma imagem (`backstage/Dockerfile`), uma réplica: o estado vive em memória. O palco abre em
`localhost`, então o deck não depende da rede; se a internet cair, só a plateia fica de fora.
Hotspot do celular serve de plano B.

## Passador no celular

`/apresentador/remoto/`, feito para uma mão (direita): em cima o cronômetro e o texto completo do
slide no `ROTEIRO.md` da apresentação (convertido no build por `deck/scripts/roteiro.mjs`; sem a seção,
cai para as notas da tecla N), embaixo o que se toca. A prévia do slide é a área do ponteiro: arrastar o dedo
mostra um laser no telão, tocar solta um anel no ponto; 🔴/🔦 alterna laser e holofote (escurece
tudo menos um círculo). Avançar e voltar respeitam os passos do slide. Ferramentas: tela preta,
votação 👍/👎 (em qualquer slide; aberta, mostra o placar ao vivo), vídeo (só nos slides de demo)
e robô. No cabeçalho, quantas pessoas estão na sala e as reações dos últimos 10 s. A tela do
celular não apaga enquanto a página está aberta (Wake Lock).

Abra o link do passador no celular antes de começar (o cookie vale 30 dias). Com duas janelas do deck abertas
(projetor + notas), o comando vai só para a janela sem notas e o BroadcastChannel move a outra.
Se o celular sumir no meio de um gesto, o ponteiro apaga sozinho em 5 s.

## Métricas

`/apresentador/metricas` mostra, para consultar depois da palestra: pico de pessoas (com horário),
celulares únicos, visitas à página, reações da plateia por tipo (as do robô contadas à parte),
cada votação (slide, pergunta, votos por opção, horário, duração), cliques em cada link, tempo/reações/pico por slide
e uma linha do tempo a cada 10 s. `metricas.json` baixa tudo em JSON.

Fica em `metrics.json` dentro de `DATA_DIR` (no compose, o volume `data` em `/data`), gravado a
cada 10 s e ao desligar: reinício no meio da
palestra não perde nada. Sem `DATA_DIR` fica só em memória. O `../dev.sh` usa `backstage/data/`.

**Antes da palestra, aperte "zerar"** na página: arquiva as métricas atuais (ensaios, testes de
carga) num `metrics-<data>.json`, que continua disponível para baixar, e começa do zero.

Sem dado pessoal: "celular" é um id aleatório que a página da plateia gera e guarda no navegador
(o mesmo que evita voto duplicado); IP não é guardado.

## Botões do passador

- **Tela cheia:** manda a tecla `F` para o deck. O navegador só entra em tela cheia depois de um gesto de quem está na frente dele, então, pedido pelo passador, o deck mostra um aviso e entra no próximo clique dado no notebook. Sair funciona direto do celular.
- **Enviar tela:** enquanto ligado, o deck manda uma foto do slide (JPEG 1600x900, sem a estrada do fundo, as reações e o ponteiro) a cada mudança de slide ou de passo. A plateia vê a imagem no topo da página e toca para ampliar. O servidor guarda só a última foto, em memória, e aceita apenas da janela do projetor.

## Teclas no deck

- `L` liga/desliga o robô: se a plateia fica em silêncio por 20 s (`BOT_SILENCE_MS`), ele solta uma rajada curta de reações, indistinguíveis das da plateia.
- `P` abre/fecha a votação (👍/👎, ou a `poll` do slide), em qualquer slide (também pelo passador). Reabrir zera o placar.

## Código

TypeScript que o Node roda direto, sem build (remove os tipos ao carregar; Node 22.18+):
`server.ts` (HTTP, WebSocket, token, túnel), `protocol.ts` (as mensagens), `config.ts`
(`deck.config.json` validado e o tema), `i18n.ts` (textos em pt-BR e inglês), `metrics.ts` e
`report.ts`. `npm run typecheck` confere os tipos e `npm test` sobe o servidor de verdade e fala
com ele por HTTP e WebSocket.

Os horários do relatório usam `timeZone` do `deck.config.json`; sem ele, o fuso do servidor (UTC
no Docker). O idioma das páginas e do terminal é o `lang` do mesmo arquivo.

## Protocolo

Os tipos estão em [`protocol.ts`](protocol.ts), que o deck também importa; o resumo:

Plateia → servidor (`/ws`): `{type:"react", kind}` · `{type:"vote", choice, cid}` (`choice` é o índice da opção; `"up"`/`"down"` ainda valem como 0/1) (dá para trocar de voto; `cid` é o id do celular, guardado no navegador, e um voto por `cid` sobrevive a reconexões)
Deck → servidor (`/apresentador/ws`): `{type:"slide", index, title, links, poll?}` (`poll` = `{question, options}` do slide, 2 a 6 opções) · `{type:"view", index, step, steps, black, notes, full, elapsed}` · `{type:"shot", data}` (data URL JPEG, até 2 MB, só com o envio ligado) · `{type:"bot", on}` · `{type:"poll", open}`
Passador → servidor (`/apresentador/ws`): `{type:"hello", as:"remote"}` · `{type:"key", key}` (`ArrowRight`, `ArrowLeft`, `b`, `v`, `f`) · `{type:"share", on}` · `{type:"pointer", x, y, mode, tap}` / `{type:"pointer", off:true}` · `{type:"bot"}` · `{type:"poll"}`
Servidor → deck: `{type:"key", key}` (só para a janela sem notas) · `{type:"pointer", ...}`
Servidor → passador: `{type:"view", ..., decks}`
Servidor → plateia: `{type:"state", state:{slide, links, poll:{id, open, question, options, counts}, share:{on, v}}}` (`v` muda a cada foto; a plateia busca `/tela.jpg?v=`) (quando muda slide, link ou votação; votos no máximo a cada 250 ms)
Servidor → palco (deck e passador): o mesmo `state` com `connected`, `bot` e `publicUrl` (o endereço do QR), e de novo a cada entrada e saída de alguém
Servidor → todos: `{type:"burst", h:{clap:n,...}}` a cada 250 ms (plateia e robô no mesmo lote)

As reações vão em lote: cada emoji ia para todo mundo na hora, e com 200 pessoas tocando ao mesmo
tempo isso virava ~89 mil mensagens/s e ~450 emojis/s em cada celular (teste de carga de 2026-11-09).
Com o lote, cada pessoa recebe no máximo 4 mensagens/s, e quem desenha limita quantos emojis voam.
