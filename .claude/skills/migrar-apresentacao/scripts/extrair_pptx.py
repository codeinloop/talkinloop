#!/usr/bin/env python3
"""Extrai o conteúdo de um .pptx para migrar a apresentação para este projeto.

    python extrair_pptx.py palestra.pptx saida/

Grava em saida/:
    conteudo.json   o que dá para saber sem olhar o slide (ver abaixo)
    media/          as imagens e os vídeos usados, com o nome original

conteudo.json:
    size       largura e altura do slide (EMU)
    theme      cores (dk1, lt1, accent1...) e fontes do primeiro tema
    sections   nomes das seções, quando o arquivo tem
    slides[]   na ordem da apresentação:
        n, title, hidden (slide oculto), section, animated (tem animação de entrada)
        blocks[]   caixas de texto: kind (body, subTitle, text...), mono (fonte de código),
                   paragraphs[] com text (recuo à esquerda preservado), level, size (pt, a
                   maior do parágrafo) e bold
        tables[]   cada tabela como linhas de células
        media[]    name, bytes, width/height (PNG, GIF e JPEG) e alt (descrição da imagem)
        links[]    url, text (o trecho que era o link) e where: "link" (hiperlink), "texto"
                   ou "nota" (URL escrita por extenso)
        notes[]    as notas do apresentador, um parágrafo por item

Só usa a biblioteca padrão do Python: um .pptx é um zip de XML. Também serve para arquivos
exportados do Google Slides e do Keynote ("exportar como PowerPoint").
Não tenta reproduzir posição nem o desenho do slide: isso se decide olhando o original.
"""
import json
import posixpath
import re
import struct
import sys
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

NS = {
    "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
    "p": "http://schemas.openxmlformats.org/presentationml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "p14": "http://schemas.microsoft.com/office/powerpoint/2010/main",
}
A, P = "{%s}" % NS["a"], "{%s}" % NS["p"]
REL = "{http://schemas.openxmlformats.org/package/2006/relationships}Relationship"
R_ID = "{%s}id" % NS["r"]
R_EMBED = "{%s}embed" % NS["r"]
R_LINK = "{%s}link" % NS["r"]
MONO = re.compile(r"consolas|courier|mono|menlo|monaco|fira code|source code|cascadia|inconsolata", re.I)
URL = re.compile(r"https?://[^\s)\]>\"']+")


def rels(z, part):
    path = posixpath.join(posixpath.dirname(part), "_rels", posixpath.basename(part) + ".rels")
    if path not in z.namelist():
        return {}
    out = {}
    for rel in ET.fromstring(z.read(path)).iter(REL):
        target = rel.get("Target", "")
        if rel.get("TargetMode") != "External":
            target = posixpath.normpath(posixpath.join(posixpath.dirname(part), target))
        out[rel.get("Id")] = (rel.get("Type", "").rsplit("/", 1)[-1], target)
    return out


def paragraphs(shape, r=None, links=None):
    # só rstrip: o recuo à esquerda é o que mantém código válido
    out = []
    for p in shape.iterfind(".//a:p", NS):
        text, size, bold, fonts = "", 0, False, set()
        for node in p:
            if node.tag == A + "br":
                text += "\n"
            if node.tag not in (A + "r", A + "fld"):
                continue
            piece = "".join(t.text or "" for t in node.iter(A + "t"))
            text += piece
            rpr = node.find("a:rPr", NS)
            if rpr is None:
                continue
            if rpr.get("sz"):
                size = max(size, int(rpr.get("sz")) // 100)
            bold = bold or rpr.get("b") == "1"
            latin = rpr.find("a:latin", NS)
            if latin is not None and latin.get("typeface"):
                fonts.add(latin.get("typeface"))
            click = rpr.find("a:hlinkClick", NS)
            if click is not None and r is not None and links is not None:
                target = r.get(click.get(R_ID), ("", ""))[1]
                if target.startswith("http"):
                    links.append({"url": target, "text": piece.strip(), "where": "link"})
        text = text.rstrip()
        if not text.strip():
            continue
        ppr = p.find("a:pPr", NS)
        para = {"text": text, "level": int(ppr.get("lvl", "0")) if ppr is not None else 0}
        if size:
            para["size"] = size
        if bold:
            para["bold"] = True
        if any(MONO.search(f) for f in fonts):
            para["mono"] = True
        out.append(para)
    return out


def image_size(data):
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return struct.unpack(">II", data[16:24])
    if data[:6] in (b"GIF87a", b"GIF89a"):
        return struct.unpack("<HH", data[6:10])
    if data[:2] == b"\xff\xd8":
        i = 2
        while i + 9 < len(data):
            if data[i] != 0xFF:
                i += 1
                continue
            marker = data[i + 1]
            if 0xC0 <= marker <= 0xCF and marker not in (0xC4, 0xC8, 0xCC):
                h, w = struct.unpack(">HH", data[i + 5:i + 9])
                return w, h
            i += 2 + struct.unpack(">H", data[i + 2:i + 4])[0]
    return None


def text_urls(texts, where, links):
    seen = {l["url"] for l in links}
    for text in texts:
        for url in URL.findall(text):
            url = url.rstrip(".,;:")
            if url not in seen:
                seen.add(url)
                links.append({"url": url, "text": "", "where": where})


def slide_content(z, part, media_used):
    root = ET.fromstring(z.read(part))
    r = rels(z, part)
    title, blocks, media, links = None, [], {}, []
    for shape in root.iter(P + "sp"):
        ph = shape.find("p:nvSpPr/p:nvPr/p:ph", NS)
        kind = ph.get("type", "body") if ph is not None else "text"
        if kind in ("sldNum", "dt", "ftr"):
            continue
        paras = paragraphs(shape, r, links)
        if not paras:
            continue
        if kind in ("title", "ctrTitle") and title is None:
            title = " ".join(p["text"].strip() for p in paras)
            continue
        block = {"kind": kind, "paragraphs": paras}
        if all(p.get("mono") for p in paras):
            block["mono"] = True
        for p in paras:
            p.pop("mono", None)
        blocks.append(block)

    tables = []
    for tbl in root.iter(A + "tbl"):
        tables.append([[" ".join(p["text"].strip() for p in paragraphs(tc, r, links)) for tc in tr.iterfind("a:tc", NS)] for tr in tbl.iterfind("a:tr", NS)])

    def add_media(target, alt=""):
        if target.startswith("http") or target not in z.namelist():
            return
        media_used.add(target)
        data = z.read(target)
        item = media.setdefault(posixpath.basename(target), {"name": posixpath.basename(target), "bytes": len(data)})
        size = image_size(data)
        if size:
            item["width"], item["height"] = size
        if alt and not re.fullmatch(r"[\w .-]+\.(png|jpe?g|gif|svg|bmp|tiff?)", alt, re.I):
            item["alt"] = alt

    for pic in root.iter(P + "pic"):
        blip = pic.find(".//a:blip", NS)
        props = pic.find("p:nvPicPr/p:cNvPr", NS)
        rid = blip.get(R_EMBED) or blip.get(R_LINK) if blip is not None else None
        if rid in r:
            add_media(r[rid][1], (props.get("descr") or "") if props is not None else "")
    for blip in root.iter(A + "blip"):
        rid = blip.get(R_EMBED) or blip.get(R_LINK)
        if rid in r:
            add_media(r[rid][1])
    for kind, target in r.values():
        if kind in ("video", "media", "audio"):
            add_media(target)

    notes = []
    for kind, target in r.values():
        if kind == "notesSlide" and target in z.namelist():
            for shape in ET.fromstring(z.read(target)).iter(P + "sp"):
                ph = shape.find("p:nvSpPr/p:nvPr/p:ph", NS)
                if ph is not None and ph.get("type") == "body":
                    for p in paragraphs(shape):
                        notes += [line.strip() for line in p["text"].split("\n") if line.strip()]

    text_urls([p["text"] for b in blocks for p in b["paragraphs"]] + [title or ""], "texto", links)
    text_urls(notes, "nota", links)

    slide = {"title": title, "blocks": blocks, "notes": notes}
    if root.find(".//p:timing//p:par", NS) is not None:
        slide["animated"] = True
    if tables:
        slide["tables"] = tables
    if media:
        slide["media"] = sorted(media.values(), key=lambda m: m["name"])
    if links:
        slide["links"] = links
    if root.get("show") == "0":
        slide["hidden"] = True
    return slide


def theme(z):
    names = sorted(n for n in z.namelist() if n.startswith("ppt/theme/theme") and n.endswith(".xml"))
    if not names:
        return {}
    root = ET.fromstring(z.read(names[0]))
    colors = {}
    scheme = root.find(".//a:clrScheme", NS)
    if scheme is not None:
        for item in scheme:
            name = item.tag.rsplit("}", 1)[-1]
            srgb, sys_clr = item.find("a:srgbClr", NS), item.find("a:sysClr", NS)
            value = srgb.get("val") if srgb is not None else sys_clr.get("lastClr") if sys_clr is not None else None
            if value:
                colors[name] = "#" + value.lower()
    fonts = {}
    for key, tag in (("titulos", "a:majorFont"), ("texto", "a:minorFont")):
        latin = root.find(".//%s/a:latin" % tag, NS)
        if latin is not None and latin.get("typeface"):
            fonts[key] = latin.get("typeface")
    return {"colors": colors, "fonts": fonts}


def sections(root):
    by_slide, names = {}, []
    for section in root.iter("{%s}section" % NS["p14"]):
        name = section.get("name", "")
        names.append(name)
        for sld in section.iter("{%s}sldId" % NS["p14"]):
            by_slide[sld.get("id")] = name
    return by_slide, names


def main():
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    for stream in (sys.stdout, sys.stderr):  # no Windows o terminal nem sempre é UTF-8
        try:
            stream.reconfigure(encoding="utf-8")
        except (AttributeError, ValueError):
            pass
    src, out = Path(sys.argv[1]), Path(sys.argv[2])
    with zipfile.ZipFile(src) as z:
        pres = "ppt/presentation.xml"
        root = ET.fromstring(z.read(pres))
        r = rels(z, pres)
        size = root.find("p:sldSz", NS)
        section_of, section_names = sections(root)
        media_used = set()
        slides = []
        for i, sld in enumerate(root.iterfind("p:sldIdLst/p:sldId", NS), 1):
            if sld.get(R_ID) not in r:
                continue
            slide = {"n": i, **slide_content(z, r[sld.get(R_ID)][1], media_used)}
            if sld.get("id") in section_of:
                slide["section"] = section_of[sld.get("id")]
            slides.append(slide)
        media_dir = out / "media"
        media_dir.mkdir(parents=True, exist_ok=True)
        for part in sorted(media_used):
            (media_dir / posixpath.basename(part)).write_bytes(z.read(part))
        data = {
            "source": src.name,
            "size": {"width": int(size.get("cx")), "height": int(size.get("cy"))} if size is not None else None,
            "theme": theme(z),
            "sections": section_names,
            "slides": slides,
        }
    (out / "conteudo.json").write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
    count = lambda key: sum(1 for s in slides if s.get(key))
    print(f"{len(slides)} slides ({count('hidden')} ocultos, {count('animated')} com animação), {count('notes')} com notas, "
          f"{len(media_used)} arquivos de mídia, {sum(len(s.get('links', [])) for s in slides)} links -> {out / 'conteudo.json'}")


if __name__ == "__main__":
    main()
