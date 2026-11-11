const guidePlaces = window.AngraData.curated;
const guideSearch = document.querySelector("#guide-search");
const guideCategory = document.querySelector("#guide-category");
const guideGrid = document.querySelector("#guide-grid");
const guideCount = document.querySelector("#guide-count");
const guideMore = document.querySelector("#guide-more");
const destinationContent = document.querySelector("#destination-content");
const guideParams = new URLSearchParams(window.location.search);
const guideBatch = 12;
let guideLimit = guideBatch;

const localPhotos = new Map([
  ["ARIE das Ilhas Cataguases", "cataguases-hero-web.jpg"],
  ["Praia de Lopes Mendes", "lopes-mendes.jpg"],
  ["Ilha Botinas", "ilhas-botinas.jpg"],
  ["Lagoa Azul", "lagoa-azul.jpg"],
  ["Praia do Aventureiro", "praia-do-aventureiro.jpg"],
  ["Vila do Abraão", "vila-do-abraao.jpg"],
  ["Ilha de Itanhangá", "itanhaga-lado-frade.jpg"],
  ["Praia do Laboratório", "praia-do-laboratorio.jpg"],
  ["Pico do Frade", "pico-do-frade.jpg"],
  ["Praia da Piedade", "ponta-da-piedade.jpg"],
  ["Praia das Gordas", "praia-das-gordas.jpg"],
]);

const guideHighlights = [
  ["ARIE das Ilhas Cataguases", "Cataguases"],
  ["Praia de Lopes Mendes", "Lopes Mendes"],
  ["Ilha Botinas", "Ilhas Botinas"],
  ["Lagoa Azul", "Lagoa Azul"],
  ["Praia do Laboratório", "Praia do Laboratório"],
  ["Pico do Frade", "Pico do Frade"],
  ["Praia da Piedade", "Praia da Piedade"],
  ["Praia das Gordas", "Praia das Gordas"],
];

function normalizeGuideText(text) {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("pt-BR");
}

function placeCategory(name) {
  if (/^(vila histórica|ruínas|igreja|convento|praça|farol|colégio|sobrados|monumento|câmara|observatório|aqueduto|casa|paço|centro histórico|bica da carioca|canhões|chafariz|ermida|marco|museu)/i.test(name)) {
    return "História e cultura";
  }
  if (/^(praia|ilha|lagoa|arie|ponta)\b|^praias /i.test(name)) return "Praias e ilhas";
  if (/^(vila do abraão|palmas|saco do céu|freguesia de santana|sítio forte|enseada|parnaioca|bananal$|feiticeira$|provetá$)/i.test(name)) {
    return "Vilas e enseadas";
  }
  return "Trilhas e natureza";
}

function guideElement(tag, content, className) {
  const element = document.createElement(tag);
  if (content) element.textContent = content;
  if (className) element.className = className;
  return element;
}

function guideLink(label, url) {
  const link = guideElement("a", label);
  link.href = url;
  return link;
}

function placeImage(url) {
  const image = guideElement("img");
  image.src = url;
  image.alt = "";
  image.loading = "lazy";
  image.decoding = "async";
  return image;
}

function destinationSlug(name) {
  return normalizeGuideText(name).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function renderDestination(place) {
  document.querySelector("#destination-title").textContent = place.name;
  document.title = place.name + " | Viva Angra Tour";
  const localPhoto = place.gallery?.[0] ?? localPhotos.get(place.name);
  const photoUrl = localPhoto ? "assets/" + localPhoto : place.photoUrl;
  if (photoUrl) {
    const image = placeImage(photoUrl);
    image.addEventListener("error", () => {
      image.remove();
      credit?.remove();
    }, { once: true });
    const photoCredit = localPhoto
      ? (place.name === "Pico do Frade" ? "Foto: @caminhosdemambucaba" : "")
      : place.photoCredit;
    const credit = photoCredit ? guideElement("small", photoCredit) : null;
    destinationContent.append(image);
    if (credit) destinationContent.append(credit);
  }
  if (place.location) destinationContent.append(guideElement("p", place.location, "destination-location"));
  if (place.description) destinationContent.append(guideElement("p", place.description));
  if (place.access) {
    destinationContent.append(guideElement("h3", "Como chegar"), guideElement("p", place.access));
  }
  if (place.visitNotes) {
    destinationContent.append(guideElement("h3", "Relatos de visitantes"), guideElement("p", place.visitNotes));
  }
  if (place.gallery?.length) {
    const gallery = guideElement("section", "", "guide-place-gallery");
    const photos = guideElement("div");
    for (const filename of place.gallery) {
      const image = placeImage("assets/" + filename);
      image.alt = "Vista da " + place.name;
      photos.append(image);
    }
    gallery.append(
      guideElement("h2", "Galeria de fotos (" + place.gallery.length + ")"),
      photos,
      guideElement("small", "Fotos do acervo Experiências Viva Angra.")
    );
    destinationContent.append(gallery);
  }
  const links = guideElement("nav");
  links.setAttribute("aria-label", "Links do destino");
  if (Number.isFinite(place.lat) && Number.isFinite(place.lng)) {
    const coordinates = encodeURIComponent(place.lat + "," + place.lng);
    links.append(guideLink("Ver localização no Google Maps", "https://www.google.com/maps/search/?api=1&query=" + coordinates));
  }
  links.append(guideLink("Abrir mapa e roteiro da Viva Angra Tour", "app/index.html"));
  destinationContent.append(links);
}

function placeLink(place, title, featured) {
  const link = guideElement("a", "", featured ? "guide-feature" : "guide-place");
  link.href = "destino.html?lugar=" + destinationSlug(place.name);
  if (featured) link.append(placeImage("assets/" + (place.gallery?.[0] ?? localPhotos.get(place.name))));
  link.append(guideElement("span", placeCategory(place.name)), guideElement("strong", title));
  return link;
}

if (destinationContent) {
  const place = guidePlaces.find((entry) => destinationSlug(entry.name) === guideParams.get("lugar"));
  if (place) renderDestination(place);
  else {
    document.querySelector("#destination-title").textContent = "Destino não encontrado";
    destinationContent.append(guideLink("Voltar ao guia de destinos", "onde-ir.html"));
  }
}

if (guideGrid) {
  const guideFeatured = document.querySelector("#guide-featured");
  for (const [name, title] of guideHighlights) {
    const place = guidePlaces.find((entry) => entry.name === name);
    if (place) guideFeatured.append(placeLink(place, title, true));
  }

  const guideEntries = [...guidePlaces].sort((first, second) => Number(Boolean(second.gallery)) - Number(Boolean(first.gallery))).map((place) => ({
    place,
    category: placeCategory(place.name),
    search: normalizeGuideText([place.name, place.location, place.description, place.access].join(" ")),
  }));

  function renderGuide({ append = false } = {}) {
    const query = normalizeGuideText(guideSearch.value.trim());
    const selectedCategory = guideCategory.value;
    const matches = guideEntries.filter(({ search, category }) =>
      search.includes(query) && (!selectedCategory || category === selectedCategory)
    );
    const start = append ? guideGrid.childElementCount : 0;
    if (!append) guideGrid.replaceChildren();
    guideGrid.append(...matches.slice(start, guideLimit).map(({ place }) => placeLink(place, place.name, false)));
    const shown = Math.min(guideLimit, matches.length);
    guideCount.textContent = matches.length
      ? shown + " de " + matches.length + (matches.length === 1 ? " destino" : " destinos")
      : "Nenhum destino encontrado. Tente outro nome ou categoria.";
    guideMore.hidden = shown === matches.length;
    if (append) guideGrid.children[start]?.focus();
  }

  function resetGuide() {
    guideLimit = guideBatch;
    renderGuide();
  }

  guideSearch.addEventListener("input", resetGuide);
  guideCategory.addEventListener("change", resetGuide);
  guideMore.addEventListener("click", () => {
    guideLimit += guideBatch;
    renderGuide({ append: true });
  });
  const initialCategory = guideParams.get("categoria");
  if ([...guideCategory.options].some((option) => option.value === initialCategory)) {
    guideCategory.value = initialCategory;
  }
  renderGuide();
}
