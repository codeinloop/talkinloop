---
name: nova-apresentacao
description: Cria uma apresentação nova neste projeto a partir de um tema, um resumo, um artigo ou um roteiro, como uma pasta em deck/talks/. Use quando a pessoa ainda não tem slides e quer montar a palestra aqui. Gatilhos - "criar uma apresentação sobre", "montar os slides da minha palestra", "nova palestra", "começar um deck".
---

# Criar uma apresentação nova

Leia `AGENTS.md` na raiz: lá estão o formato de um slide, os blocos disponíveis e os tokens de
tema. Este arquivo cobre o que vem antes: decidir o que a palestra diz.

## 1. O que perguntar

Só o que muda o resultado e não dá para inferir do material recebido:

- Para quem é e quanto tempo dura (uma palestra de 5 minutos e uma de 40 são objetos diferentes).
- Qual é a frase que a plateia deve levar para casa.
- Nome da pasta (letras minúsculas, números e hífen), título, evento e como a pessoa quer assinar.

Se a pessoa já entregou um texto, um artigo ou um roteiro, extraia as respostas dele e confirme em
uma linha, em vez de perguntar tudo de novo.

## 2. Estrutura antes dos slides

Escreva primeiro a espinha, como uma lista de títulos com o minuto de cada um, e mostre à pessoa.
Se ela está na conversa, espere o ok antes de montar; se o pedido veio fechado e não há a quem
perguntar, siga e inclua a espinha na entrega. Regras que seguram a qualidade:

- Uma ideia por slide. A conta de slides sai da duração, com título, encerramento e momentos de
  participação já incluídos:

  | Duração | Slides |
  |---|---|
  | 5 min | 5 a 7 |
  | 10 min | 9 a 12 |
  | 20 min | 15 a 20 |
  | 40 min | 25 a 35 |

- Abertura que pede o QR: a plateia precisa de um motivo para pegar o celular no primeiro minuto.
- Dois ou três momentos de participação ao longo da palestra, não todos no fim: uma pergunta de
  👍/👎 (tecla `P`), um link que a plateia abre na hora. A pergunta pode estar escrita no slide
  (um `big` funciona) ou só ser falada.
- O encerramento repete a frase que a plateia deve levar e usa `kind: "final"`.

## 3. Montar

```bash
cd deck
npm ci                   # uma vez; sem isso os comandos de conferência falham
npm run new -- <nome>
```

Em `deck/talks/<nome>/` (os campos do config estão descritos no `AGENTS.md`):

- **`deck.config.json`**: título, descrição, evento, autor, idioma (`lang`: `pt-BR` ou `en`), fuso, reações e tema. Se a pessoa
  indicou uma identidade visual (uma cor, um site, a marca do evento), use a cor de destaque dela
  em `accent` e derive `accentSoft` do mesmo matiz; os outros tokens podem ficar. Se não indicou,
  mantenha o tema inicial e não vá atrás do site dela por conta própria. `publicUrl` e
  `sourceUrl` ficam vazios, a menos que ela peça.
- **`slides/index.tsx`**: substitua os slides de exemplo pelos da espinha. Escolha o bloco pelo que
  o slide precisa dizer (comparação: `cols` com `card`; número: `stats`; uma frase: `big`;
  sequência: `steps` ou `list` com `data-frag`; processo: `journey`; arquitetura: `layers`). Varie: três slides de tópicos seguidos cansam.
- **`ROTEIRO.md`**: apague o de exemplo e escreva a fala de cada slide, em `### NN · Título`. É
  onde mora o conteúdo; o slide mostra só o que a plateia precisa ler.
- **A moldura já assina todo slide** com o nome e o `tagline` do autor. No título e no
  encerramento, a linha de assinatura leva outra coisa: cargo, contato, onde achar os slides.
- **`links`**: toda fonte citada entra no campo `links` do slide em que é citada. É esse campo
  que manda o link para o celular da plateia; escrever a URL no slide não faz isso.

Não invente dados, citações nem fontes. Sem um número medido, não use `stats`: diga a ideia com
um `big`. Onde faltar um número ou uma referência, escreva `[COMPLETAR: o que falta]` no roteiro
e liste essas marcas na entrega.

## 4. Conferir

```bash
cd deck
TALK=<nome> npm run typecheck
NEXT_PUBLIC_QR_URL=https://example.com TALK=<nome> npm run png                    # deck/slides-png/NN.png, tema escuro
NEXT_PUBLIC_QR_URL=https://example.com TALK=<nome> npm run png -- --tema=claro    # as mesmas, no tema claro
```

`npm run png` grava uma imagem por slide. O `NEXT_PUBLIC_QR_URL` existe só para o QR aparecer nelas; sem ele não dá para ver
se algum conteúdo passa por baixo do QR. Leia os avisos que os comandos imprimem (seção do
roteiro sem slide, sobra da apresentação inicial) e confira que `roteiro: N slides` bate com o
número de seções que você escreveu.

Abra as imagens de `deck/slides-png/`, uma por uma: nada cortado, nada sob o QR ou sob a assinatura,
nenhum texto do exemplo inicial, nenhum bloco de texto corrido com mais de duas linhas, contraste
legível nos dois temas. As imagens mostram tudo já revelado; passos, animações e a votação só
aparecem com o deck rodando. Depois, da raiz: `TALK=<nome> docker compose up --build`.

## 5. Entregar

Em poucas linhas: quantos slides, onde estão os momentos de participação, cada `[COMPLETAR]` que
ficou, as escolhas que você fez por ela (o que entendeu de um ponto ambíguo, o tema) e como subir:
o comando acima, e que o terminal imprime o link do palco, o endereço da plateia e o QR do
passador.
