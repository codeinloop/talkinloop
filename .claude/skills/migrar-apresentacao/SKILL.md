---
name: migrar-apresentacao
description: Traz uma apresentação que já existe (PowerPoint, Google Slides, Keynote, PDF, reveal.js, Marp ou Markdown) para este projeto, como uma pasta em deck/talks/. Use quando a pessoa já tem os slides prontos e quer apresentá-los aqui, com reações, votação e passador. Gatilhos - "migrar minha apresentação", "converter meu pptx", "importar slides", "tenho uma palestra pronta".
---

# Migrar uma apresentação existente

O objetivo é a pessoa subir no palco com a palestra dela rodando aqui, e a plateia entrando pelo
QR. Uma migração boa preserva o que a palestra diz e a ordem em que diz; ela não tenta copiar
posição e tamanho de cada caixa. Os slides daqui têm um sistema visual próprio (palco de 1600x900,
blocos prontos, tema por tokens), e o resultado fica melhor quando o conteúdo é reescrito nesse
sistema do que quando o layout antigo é imitado.

Leia `AGENTS.md` na raiz antes de começar: lá estão o formato de um slide, os blocos disponíveis e
os tokens de tema.

## 1. Entender o que chegou

Pergunte só o que não dá para descobrir: onde está o arquivo, como a pasta deve se chamar (letras
minúsculas, números e hífen) e quanto tempo dura a apresentação. O resto se decide lendo o
material. Sem resposta sobre a duração, calcule um minuto por slide e diga que é estimativa.

| Origem | Como extrair |
|---|---|
| `.pptx` (PowerPoint; Google Slides e Keynote exportam nesse formato) | `python .claude/skills/migrar-apresentacao/scripts/extrair_pptx.py arquivo.pptx <pasta-temporária>` gera `conteudo.json` e `media/`. O JSON traz, por slide: título, caixas de texto (com recuo, tamanho da fonte, negrito e `mono` quando é código), tabelas, mídia (com dimensões), links (hiperlinks e URLs escritas no texto ou nas notas), notas, e as marcas `hidden`, `animated` e `section`. Em macOS e Linux o comando pode ser `python3`. |
| PDF | Não tem estrutura nem notas. Leia as páginas como imagem para entender cada slide e peça as notas à parte, se existirem. |
| reveal.js, Marp, Slidev, Markdown | Leia o arquivo-fonte direto: cada separador de slide (`---`, `<section>`) é um slide; notas costumam estar em `Note:`, `<aside class="notes">` ou comentários. |
| Link do Google Slides | Peça para a pessoa baixar como `.pptx` (Arquivo > Fazer download). |

O extrator não vê o desenho do slide. Olhe também o original renderizado: é ali que aparecem
diagramas, ênfase e o que era decoração. Um slide só com imagem no `conteudo.json` pode ser um
diagrama essencial. Para ter o PDF do original:

- com LibreOffice: `soffice --headless --convert-to pdf arquivo.pptx`;
- com PowerPoint ou Keynote instalados: exportar como PDF pelo próprio programa;
- sem nenhum dos dois: peça o PDF à pessoa. Se ela não tiver, siga só com o extrator, olhe as
  imagens de `media/` uma a uma e diga na entrega que a comparação visual não foi feita.

Pistas que o JSON dá: tamanho de fonte muito maior que o resto é um número ou uma frase de
destaque; `mono` é código (preserve o recuo); imagem com poucas centenas de bytes ou menos de 400
px de largura é ícone ou marcador, não o conteúdo do slide.

## 2. Criar a pasta

```bash
cd deck
npm ci                   # uma vez; sem isso os comandos de conferência falham
npm run new -- <nome>
```

Isso copia `talks/starter`. A partir daqui, trabalhe só dentro de `deck/talks/<nome>/`.

## 3. Configurar (`deck.config.json`)

- `title`, `description`, `event`, `author`: do slide de título e do que a pessoa disser.
  `author.tagline` aparece em todo slide: um site ou uma empresa, curto. `publicUrl`, `sourceUrl`
  e `reactions` ficam como estão, a menos que ela peça (o `AGENTS.md` explica cada um).
- `lang`: `pt-BR` ou `en`, conforme o idioma dos slides (é o idioma do passador e da página da
  plateia). `timeZone`: o fuso de onde a apresentação acontece.
- `theme`: traduza a identidade do original para os tokens. Do tema extraído, `dk1`/`lt1` indicam
  texto e fundo, e `accent1` costuma ser a cor de destaque. Não copie às cegas: o palco é escuro
  por padrão e precisa de contraste de projetor. Escolha `accent` legível sobre `bg`, derive
  `accentSoft` (o mesmo matiz, bem mais escuro no tema `dark` e bem mais claro no `light`) e
  preencha `dark` e `light`. Sem instrução, o palco fica escuro, com as cores
  do original em `light`; avise que o original era claro e que dá para inverter. Se a pessoa quer
  o palco claro, ponha as cores claras em `dark` também: é esse o tema que abre.
- Fontes: se a fonte do original está no Google Fonts, monte o `fontsUrl` e ponha o nome em
  `fonts`. Se é proprietária (Calibri, Helvetica Neue), escolha uma parecida que seja aberta e
  avise a pessoa da troca.

## 4. Reescrever os slides (`slides/index.tsx`)

Um slide do original vira um item de `slides`, na mesma ordem. Para cada um, decida qual bloco
conta melhor aquilo:

| No original | Aqui |
|---|---|
| Capa | `kind: "title"` com `eyebrow`, `h1`, `lead` |
| Título + tópicos | `h2` + `ul.list`; subtópicos viram um `<ul>` dentro do `<li>` (segundo nível) ou saem para as notas |
| Tópicos que eram animados um a um (`animated` no JSON, ou a nota diz "um por vez") | `data-frag="1"`, `"2"`... |
| Uma frase grande, citação | `kind: "statement"` com `big`, ou `quote` com `cite` |
| Duas ou três colunas comparando coisas | `cols` / `cols3` com `card` |
| Fluxo, linha do tempo, etapas de um processo | `journey` com `step` |
| Pilha, arquitetura em camadas | `layers` com `layer` |
| Nuvem de palavras, lista de itens curtos | `chips` |
| Números em destaque, tabela de antes/depois | `stats` com `stat` (o valor novo em `<b>`, o antigo em `<small>`) |
| Código ou terminal (`mono` no JSON) | `pre.code`, com o recuo do original |
| Imagem, foto, captura de tela | `<div className="diagram"><img .../></div>`, com o arquivo em `public/`, `src={`${BASE}/arquivo.png`}` e `alt` |
| Diagrama | a imagem exportada, no mesmo bloco `diagram`; refazer em `journey` ou `layers` só com o ok da pessoa |
| Vídeo | `<Demo src="/demo/arquivo.mp4" fallback={...} />` |
| Tabela | antes/depois: `stats`. Até seis células de texto: `cols` ou `cols3` com `card`. Maior que isso: uma captura da tabela como imagem, ou divida em mais de um slide |
| Slide de encerramento, contato | `kind: "final"` |

Cuidados que fazem diferença:

- **Texto demais.** Slide de PowerPoint costuma ter parágrafos. O limite prático está em "Quanto
  cabe", no `AGENTS.md`: uma lista vai até cinco itens de uma linha. Passou disso, deixe no slide
  a frase que a plateia precisa ler e mova o resto para o `ROTEIRO.md`. Não invente conteúdo e
  não corte informação: o que sai do slide vai para o roteiro.
- **A moldura já assina todo slide** com o nome e o `tagline` do autor. Se a capa ou o
  encerramento do original repetem o nome, troque por cargo ou contato.
- **Links.** Toda URL citada (no texto, no rodapé, nas notas) vai no campo `links` do slide em
  que aparece; o JSON já lista todas em `links`. É assim que a plateia recebe no celular. URL
  sem esquema (`site.com/pagina`) ganha `https://`; avise na entrega. Arroba sem rede
  (`@fulano`) não vira link: fica como texto.
- **`title`, `block`, `minute`.** `title` é o nome curto do slide; `block` agrupa: use as
  seções do original (`section` no JSON) ou, sem elas, crie de três a cinco blocos pelo arco da
  palestra; `minute` é o minuto previsto de início. Sem tempos no original,
  distribua a duração da palestra pelos slides e diga à pessoa que é uma estimativa a ajustar.
- **Slides ocultos** (`hidden` no JSON) ficam de fora do deck e do roteiro, a menos que a pessoa
  peça. Diga na entrega quais eram.
- **Mídia.** Copie para `public/` só o que os slides usam, com nomes que digam o que é.

## 5. Notas do apresentador (`ROTEIRO.md`)

Apague o `ROTEIRO.md` de exemplo e escreva o da pessoa: as notas de cada slide viram uma seção
`### NN · Título`, com NN igual à posição do slide no deck novo (01, 02...; se um slide oculto
saiu, os seguintes sobem um número). Preserve o texto da pessoa; é a fala dela. Slides sem nota não precisam de seção. Preencha também
`notes` de cada slide com um lembrete de uma linha.

## 6. Conferir

```bash
cd deck
TALK=<nome> npm run typecheck
NEXT_PUBLIC_QR_URL=https://example.com TALK=<nome> npm run png                    # deck/slides-png/NN.png, tema escuro
NEXT_PUBLIC_QR_URL=https://example.com TALK=<nome> npm run png -- --tema=claro    # as mesmas, no tema claro
```

`npm run png` grava uma imagem por slide. O `NEXT_PUBLIC_QR_URL` existe só para o QR aparecer nelas; sem ele não dá para ver
se algum conteúdo passa por baixo do QR. Leia os avisos que os comandos imprimem (seção do
roteiro sem slide, sobra da apresentação inicial) e confira que `roteiro: N slides` bate com o
número de slides que tinham nota.

Abra as imagens de `deck/slides-png/` e compare com o original, slide a slide: nada cortado na borda, nada sob o
QR ou sob a assinatura, nenhum texto sobrando do exemplo inicial, mesma quantidade de slides
(descontados os ocultos), contraste legível nos dois temas. Corrija e gere de novo até bater. As
imagens mostram tudo já revelado; passos e animações só aparecem com o deck rodando. Depois suba de
verdade, da raiz:

```bash
TALK=<nome> docker compose up --build
```

## 7. Entregar

Diga à pessoa, em poucas linhas: quantos slides foram migrados, o que mudou de forma (texto que
foi para o roteiro, fonte trocada, diagrama que virou imagem), o que você não conseguiu trazer
(animações, transições, vídeos incorporados de fora, slides ocultos) e como subir: o comando
acima, e que o terminal imprime o link do palco, o endereço da plateia e o QR do passador. Se os tempos dos slides são
estimativa, diga.
