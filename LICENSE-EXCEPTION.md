# Presentation content exception

This project is licensed under the GNU Affero General Public License, version 3 (see `LICENSE`).
As an additional permission under section 7 of that license, the copyright holders grant the
following exception.

## The exception

**Presentation content** is not considered part of the Program and is not subject to the AGPL,
even when it imports, is built together with, or is served by the Program. You may keep it
private, distribute it, and license it under any terms you choose.

"Presentation content" means the material that makes up a specific talk, namely the contents of
a folder under `deck/talks/` other than `deck/talks/starter/`:

- the slides (`slides/` and everything in it, including components written only for that talk),
- the speaker script (`ROTEIRO.md`),
- the configuration values (`deck.config.json`),
- the images, videos and other media (`public/`).

## What the exception does not cover

Everything else in this repository is the Program and remains under the AGPL without exception,
including `deck/components/`, `deck/app/`, `deck/scripts/`, `backstage/` and
`deck/talks/starter/`. If you modify the Program and let other people interact with your modified
version over a network, you must offer them its source code, as section 13 of the AGPL requires.
Setting `sourceUrl` in `deck.config.json` shows that link on the audience page.

If you copy `deck/talks/starter/` to start your own talk, your copy is your presentation content
and this exception applies to it.

## Removing the exception

As section 7 of the AGPL allows, you may remove this exception from your own copy of the Program
when you convey it. If you do, the AGPL applies to that copy in full.

---

## Em português (resumo, sem valor jurídico próprio)

O motor é AGPL-3.0. O conteúdo de uma apresentação (slides, roteiro, configuração, imagens e
vídeos de uma pasta em `deck/talks/`, exceto a `starter`) é de quem escreveu e pode ter qualquer
licença, mesmo usando o motor. Quem modificar o motor e servir a versão modificada pela rede
continua obrigado a oferecer o código-fonte dessa versão.
