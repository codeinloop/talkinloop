# Contributing

Thanks for wanting to help. Issues and pull requests are welcome in **English or Portuguese**
(pode escrever em português).

## Before you start

- For a bug, open an issue with the steps to reproduce it.
- For anything larger than a small fix (a new block, a new command, a protocol change), open an
  issue first so we can agree on the approach before you write the code.
- Security problems do not go in public issues: see [`SECURITY.md`](SECURITY.md).

## Setup

You need Node 22.18 or newer and, to run everything together, Docker.

```bash
cd deck && npm ci        # the slide engine
cd ../backstage && npm ci   # the live server
```

To run with hot reload: `./dev.sh` on macOS or Linux. On Windows, use two terminals:
`npm run dev` in `deck/` and `PRESENTER_AUTH=off node server.ts` in `backstage/`
(PowerShell: `$env:PRESENTER_AUTH = 'off'; node server.ts`).

To run it the way a user does: `docker compose up --build` from the repository root.

## Where things are

| Folder | What it is |
|---|---|
| `deck/components`, `deck/app`, `deck/scripts` | the slide engine |
| `deck/talks/starter` | the starter talk every new talk is copied from |
| `backstage/` | the live server; `protocol.ts` has every WebSocket message |
| `.claude/skills/` | the skills that create and migrate talks |

[`AGENTS.md`](AGENTS.md) (in Portuguese) documents the slide format, the blocks and the theme
tokens.

## Checks

Run these before opening a pull request; CI runs the same ones.

```bash
cd deck && npm run typecheck && npm run build
cd ../backstage && npm run typecheck && npm test
```

If you changed anything visual, run `npm run png` in `deck/` and look at the images in
`deck/slides-png/`. Attach the relevant ones to the pull request.

## Conventions

- **Engine and content stay apart.** The engine never imports from a talk; a talk imports from
  the engine. Nothing specific to one talk goes into `deck/components` or `deck/app`.
- **Live messages** are declared in `backstage/protocol.ts`. A new message needs the type, the
  server-side validation of every field (the types describe a correct client, not a hostile one)
  and a test in `backstage/test/`.
- **The audience socket only reacts, votes and counts clicks.** Anything that controls the talk
  goes through the stage socket, which requires the presenter token.
- **Interface text** goes in `deck/components/i18n.ts` or `backstage/i18n.ts`, in both Portuguese
  and English.
- **Theme tokens** are listed in two places (`deck/components/theme.ts` and
  `backstage/config.ts`); change both.
- **The backstage runs `.ts` files directly**, with no build step: no `enum`, `namespace` or
  constructor parameter properties, and relative imports carry the `.ts` extension.
- **New slide block?** Add the CSS to `deck/app/globals.css`, an example slide to the starter
  talk and a row to the blocks table in `AGENTS.md`.
- **Comments** explain why, when the code cannot: a security reason, a platform workaround, a
  timing that another part depends on. Do not describe what the code already says.
- **Dependencies:** the backstage has two runtime dependencies on purpose. Adding one needs a
  good reason in the pull request.

## Pull requests

- One subject per pull request, with a description of what changed and how you tested it.
- Keep the diff focused: no drive-by reformatting.
- Commit messages in the imperative, in English or Portuguese.

## License of contributions

By contributing, you agree that your contribution is licensed under the
[AGPL-3.0](LICENSE), with the [presentation content exception](LICENSE-EXCEPTION.md), the same
terms as the rest of the project. There is no contributor license agreement to sign.
