# Talk in Loop

**English** · [Português](README.pt-BR.md) · [talkinloop.codeinloop.com.br](https://talkinloop.codeinloop.com.br)

A slide deck the audience joins from their phones: they scan the QR code, react (reactions float
up on the big screen), vote 👍/👎 and get the links as the talk moves on. The presenter drives the
slides from a phone, with the script, a timer and a pointer.

Created by [Danilo Dorgam](https://www.linkedin.com/in/danilodorgam/), from [Code in Loop](https://codeinloop.com.br/links), for a talk at DevOpsDays Brasília 2026.

It runs on your laptop with Docker. A free Cloudflare tunnel, with no account needed, brings the
audience to it.

## Run it

```bash
docker compose up --build
```

This starts the starter talk, which has one slide for each feature. The terminal tells you what to
open (in English when the talk's `lang` is `en`):

```
  stage     http://localhost:8080/apresentador/?token=...
  audience  https://four-random-words.trycloudflare.com
  remote    https://four-random-words.trycloudflare.com/apresentador/remoto/?token=...
  metrics   http://localhost:8080/apresentador/metricas
```

- **Stage:** open it on the laptop connected to the projector. The deck runs on `localhost`, so
  slides and videos do not depend on the venue's internet. The audience QR code shows up on the
  slides by itself.
- **Remote:** point your phone camera at the QR code printed in the terminal.
- **Audience:** joins through the QR code on the slides.

Whoever has the `?token=` link controls the slides, so keep the terminal off the big screen.

### The tunnel

With no configuration, `cloudflared` opens a Quick Tunnel ([this video explains how it works](https://youtu.be/mKwYfgOIAYg), in Portuguese):

- the address changes every time you start it (the QR code on the slides follows);
- Cloudflare caps each Quick Tunnel at 200 in-flight requests and gives no uptime guarantee. For
  a large room or a fixed address, use a named tunnel: the steps are in
  [`.env.example`](.env.example).

Without internet the deck keeps working; only the audience is left out.

## Make your own talk

Each talk is a folder in [`deck/talks/`](deck/talks/):

```bash
cd deck && npm install
npm run new -- my-talk                            # copies the starter talk
cd .. && TALK=my-talk docker compose up --build   # runs yours
```

In PowerShell: `$env:TALK = 'my-talk'; docker compose up --build`. Or put `TALK=my-talk` in `.env`.

| In `deck/talks/my-talk/` | What it is |
|---|---|
| `deck.config.json` | title, event, author, language (`pt-BR` or `en`), audience reactions and the theme (colors and fonts) |
| `slides/index.tsx` | the slides, in React, with ready-made blocks (lists, cards, steps, layers, numbers, code, video) |
| `ROTEIRO.md` | the script: what you say on each slide; shown in the presenter notes and on the remote |
| `public/` | images and videos |

The slide format, the blocks and the theme tokens are documented in [`AGENTS.md`](AGENTS.md)
(in Portuguese).

### With a coding agent

The repository ships two Claude Code skills (`.claude/skills/`):

- **`/nova-apresentacao`** builds a talk from a topic, an article or an outline.
- **`/migrar-apresentacao`** brings an existing presentation (PowerPoint, Google Slides, Keynote,
  PDF, reveal.js, Markdown) into this project. It includes a `.pptx` extractor that reads text,
  speaker notes, links, images and theme colors.

Other agents can follow `AGENTS.md` and read the skills as plain text.

## What is in here

- [`deck/`](deck/): the slide engine (Next.js, static export) and the talks. Keys, PDF export and presenter mode are in the folder's README.
- [`backstage/`](backstage/): the live server, one Node process in TypeScript that serves the audience page at `/`, the deck at `/apresentador` and the WebSockets. Protocol, token, metrics and variables are in the folder's README. Tests: `npm test`.
- [`backstage/protocol.ts`](backstage/protocol.ts): every live message, typed, shared by the server and the deck.
- [`docker-compose.yml`](docker-compose.yml): backstage + tunnel.

The interface (remote, audience page, metrics, terminal) is available in Portuguese and English.
The URL paths (`/apresentador`, `/remoto`, `/metricas`), the code comments and most of the
documentation are in Portuguese.

To work on the engine with hot reload (Node 22.18+): `./dev.sh` on macOS/Linux or, in two
terminals, `npm run dev` in `deck/` and `PRESENTER_AUTH=off node server.ts` in `backstage/`.

## Contributing

Issues and pull requests are welcome, in English or Portuguese. Start with
[`CONTRIBUTING.md`](CONTRIBUTING.md); the project follows a [code of conduct](CODE_OF_CONDUCT.md),
and security problems are reported privately, as described in [`SECURITY.md`](SECURITY.md).

## Author

Created by **Danilo Dorgam**, who writes and records about development, DevOps and homelab at
**Code in Loop**:

- All links: [codeinloop.com.br/links](https://codeinloop.com.br/links)
- YouTube: [@codeinloopbr](https://www.youtube.com/@codeinloopbr)
- Instagram: [@danilodorgam](https://www.instagram.com/danilodorgam)
- LinkedIn: [Danilo Dorgam](https://www.linkedin.com/in/danilodorgam/)

If you present with it, a mention is welcome.

## License

Copyright © 2026 Danilo Dorgam.

The code is [AGPL-3.0](LICENSE). If you modify the project and serve the modified version to
other people over a network, you must offer them the source code: set `sourceUrl` in
`deck.config.json` and the audience page shows the link.

Your talk is yours: slides, script, configuration and media in your `deck/talks/` folder are
covered by an [explicit exception](LICENSE-EXCEPTION.md) and can carry any license, or none.
