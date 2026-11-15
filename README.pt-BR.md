# Talk in Loop

[English](README.md) · **Português** · [talkinloop.codeinloop.com.br](https://talkinloop.codeinloop.com.br)

Um deck de slides em que a plateia participa pelo celular: escaneia o QR, reage (as reações sobem
no telão), vota 👍/👎 e recebe os links conforme a apresentação avança. O apresentador passa os
slides pelo celular, com roteiro, cronômetro e ponteiro.

Criado por [Danilo Dorgam](https://www.linkedin.com/in/danilodorgam/), do [Code in Loop](https://codeinloop.com.br/links), para uma palestra no DevOpsDays Brasília 2026.

Roda no seu notebook com Docker. Um túnel do Cloudflare, gratuito e sem conta, leva a plateia até
ele.

## Subir

```bash
docker compose up --build
```

Isso sobe a apresentação inicial, que mostra um slide para cada recurso. O terminal diz o que
abrir:

```
  palco     http://localhost:8080/apresentador/?token=...
  plateia   https://quatro-palavras-ao-acaso.trycloudflare.com
  passador  https://quatro-palavras-ao-acaso.trycloudflare.com/apresentador/remoto/?token=...
  métricas  http://localhost:8080/apresentador/metricas
```

- **Palco:** abra no notebook ligado ao projetor. O deck roda em `localhost`, então slides e
  vídeos não dependem da internet do evento. O QR da plateia aparece nos slides sozinho.
- **Passador:** aponte a câmera do celular para o QR impresso no terminal.
- **Plateia:** entra pelo QR dos slides.

Quem tem o link com `?token=` comanda os slides; não mostre o terminal no telão.

### O túnel

Sem configurar nada, o `cloudflared` abre um túnel rápido ([neste vídeo eu explico como ele funciona](https://youtu.be/mKwYfgOIAYg)):

- o endereço muda a cada subida (o QR dos slides acompanha);
- o Cloudflare limita cada túnel rápido a 200 requisições em andamento e não dá garantia de
  disponibilidade. Para sala grande ou endereço fixo, use um túnel nomeado: o passo a passo está
  no [`.env.example`](.env.example).

Sem internet, o deck continua funcionando; só a plateia fica de fora.

## Fazer a sua apresentação

Cada apresentação é uma pasta em [`deck/talks/`](deck/talks/):

```bash
cd deck && npm install
npm run new -- minha-palestra                            # copia a apresentação inicial
cd .. && TALK=minha-palestra docker compose up --build   # sobe a sua
```

No PowerShell: `$env:TALK = 'minha-palestra'; docker compose up --build`. Ou ponha
`TALK=minha-palestra` no `.env`.

| Em `deck/talks/minha-palestra/` | O que é |
|---|---|
| `deck.config.json` | título, evento, autor, idioma (`pt-BR` ou `en`), reações da plateia e o tema (cores e fontes) |
| `slides/index.tsx` | os slides, em React, com blocos prontos (listas, cartões, etapas, camadas, números, código, vídeo) |
| `ROTEIRO.md` | o que se fala em cada slide; aparece nas notas e no passador |
| `public/` | imagens e vídeos |

O formato dos slides, os blocos e os tokens de tema estão em [`AGENTS.md`](AGENTS.md).

### Com um agente de código

O repositório traz duas skills para o Claude Code (`.claude/skills/`):

- **`/nova-apresentacao`**: monta uma apresentação a partir de um tema, um artigo ou um roteiro.
- **`/migrar-apresentacao`**: traz uma apresentação que já existe (PowerPoint, Google Slides,
  Keynote, PDF, reveal.js, Markdown) para cá. Inclui um extrator de `.pptx` que lê textos, notas
  do apresentador, links, imagens e as cores do tema.

Outros agentes podem seguir o `AGENTS.md` e ler as skills como texto.

## O que tem aqui

- [`deck/`](deck/): o motor dos slides (Next.js, export estático) e as apresentações. Teclas, PDF e modo apresentador no README da pasta.
- [`backstage/`](backstage/): o servidor ao vivo, um processo Node em TypeScript que serve a plateia em `/`, o deck em `/apresentador` e os WebSockets. Protocolo, token, métricas e variáveis no README da pasta. Testes: `npm test`.
- [`backstage/protocol.ts`](backstage/protocol.ts): todas as mensagens ao vivo, tipadas, compartilhadas entre o servidor e o deck.
- [`docker-compose.yml`](docker-compose.yml): backstage + túnel.

A interface (passador, página da plateia, métricas, terminal) existe em português e inglês. Os
caminhos das URLs (`/apresentador`, `/remoto`, `/metricas`), os comentários do código e a maior
parte da documentação estão em português.

Para mexer no motor com recarga automática (Node 22.18+): `./dev.sh` no macOS/Linux, ou, em dois
terminais, `npm run dev` em `deck/` e `PRESENTER_AUTH=off node server.ts` em `backstage/`.

## Contribuir

Issues e pull requests são bem-vindos, em português ou inglês. Comece pelo
[`CONTRIBUTING.md`](CONTRIBUTING.md) (em inglês); o projeto segue um
[código de conduta](CODE_OF_CONDUCT.md), e problemas de segurança são relatados em privado, como
descrito no [`SECURITY.md`](SECURITY.md).

## Autor

Criado por **Danilo Dorgam**, que escreve e grava sobre desenvolvimento, DevOps e homelab no
**Code in Loop**:

- Todos os links: [codeinloop.com.br/links](https://codeinloop.com.br/links)
- YouTube: [@codeinloopbr](https://www.youtube.com/@codeinloopbr)
- Instagram: [@danilodorgam](https://www.instagram.com/danilodorgam)
- LinkedIn: [Danilo Dorgam](https://www.linkedin.com/in/danilodorgam/)

Se você apresentar com ele, uma menção é bem-vinda.

## Licença

Copyright © 2026 Danilo Dorgam.

O código é [AGPL-3.0](LICENSE). Se você modificar o projeto e servir a versão modificada para
outras pessoas pela rede, precisa oferecer o código-fonte a elas: preencha `sourceUrl` no
`deck.config.json` e a página da plateia mostra o link.

A sua apresentação é sua: slides, roteiro, configuração e mídia da sua pasta em `deck/talks/`
estão cobertos por uma [exceção explícita](LICENSE-EXCEPTION.md) e podem ter qualquer licença, ou
nenhuma.
