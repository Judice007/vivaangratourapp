const guidePlaces = window.AngraData.curated;
const guideSearch = document.querySelector("#guide-search");
const guideCategory = document.querySelector("#guide-category");
const guideGrid = document.querySelector("#guide-grid");
const guideCount = document.querySelector("#guide-count");
const guideMore = document.querySelector("#guide-more");
const destinationContent = document.querySelector("#destination-content");
const guideParams = new URLSearchParams(window.location.search);
const guideBatch = 12;
const guideSections = new Map([
  ["regiao", {
    label: "Conheça a região", url: "conheca-a-regiao.html",
    types: ["Atrativo Turístico", "Local", "Marina", "Igreja", "Museu", "Mirante", "Centro Cultural", "Teatro", "Parque", "Trilha", "Vilas e enseadas", "História e cultura", "Trilhas e natureza"],
  }],
  ["comer", {label: "Onde comer", url: "onde-comer.html", types: ["Restaurante", "Bar", "Café"]}],
  ["ficar", {label: "Onde ficar", url: "onde-ficar.html", types: ["Hotel", "Pousada"]}],
]);
const currentSection = document.body.dataset.guideSection;
const curatedFoodIds = [326, 300, 299];
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

function galleryImageUrl(filename) {
  return filename.startsWith("https://") ? filename : "assets/" + filename;
}

function guidePlaceId(place) {
  return place.id ?? destinationSlug(place.name);
}

function renderDestination(place) {
  document.querySelector("#destination-title").textContent = place.name;
  document.title = place.name + " | Viva Angra Tour";
  const returnSection = guideSections.get(guideParams.get("guia"));
  const back = document.querySelector("#destination-back");
  if (back && returnSection) {
    back.href = returnSection.url;
    back.textContent = "← " + returnSection.label;
  }
  const foodIndex = curatedFoodIds.findIndex((id) => place.portalIds?.includes(id));
  const listing = window.VivaAngraDirectory?.alimentacao[foodIndex];
  const localPhoto = listing?.image?.replace(/^assets\//, "") ?? place.gallery?.[0] ?? localPhotos.get(place.name);
  const photoUrl = localPhoto ? galleryImageUrl(localPhoto) : place.photoUrl;
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
  if (place.portalCategories?.length) destinationContent.append(guideElement("p", place.portalCategories.join(" · ")));
  if (place.location) destinationContent.append(guideElement("p", place.location, "destination-location"));
  const description = listing?.description ?? place.description;
  if (description) destinationContent.append(guideElement("p", description));
  if (listing) {
    const details = guideElement("dl", "", "listing-details");
    for (const [label, value] of [["Endereço", listing.address], ["Telefone", listing.phone], ["Horários informados", listing.hours]]) {
      if (value) details.append(guideElement("dt", label), guideElement("dd", value));
    }
    destinationContent.append(details);
    if (listing.instagram) {
      destinationContent.append(guideLink("Instagram · @" + listing.instagram, "https://www.instagram.com/" + listing.instagram + "/"));
    }
  }
  if (place.access) {
    destinationContent.append(guideElement("h2", "Como chegar"), guideElement("p", place.access));
  }
  if (place.visitNotes) {
    destinationContent.append(guideElement("h3", "Relatos de visitantes"), guideElement("p", place.visitNotes));
  }
  if (place.gallery?.length) {
    const gallery = guideElement("section", "", "guide-place-gallery");
    const photos = guideElement("div");
    for (const filename of place.gallery) {
      const image = placeImage(galleryImageUrl(filename));
      image.alt = "Foto de " + place.name;
      image.addEventListener("error", () => image.remove(), { once: true });
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
  else if (place.location) {
    links.append(guideLink("Buscar endereço no Google Maps", "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(place.location)));
  }
  links.append(guideLink("Abrir mapa e roteiro da Viva Angra Tour", "app/index.html?lugar=" + encodeURIComponent(guidePlaceId(place))));
  destinationContent.append(links);
}

function placeLink(place, title, featured) {
  const link = guideElement("a", "", featured ? "guide-feature" : "guide-place");
  link.href = "destino.html?lugar=" + guidePlaceId(place);
  if (currentSection) link.href += "&guia=" + currentSection;
  if (featured) link.append(placeImage(galleryImageUrl(place.gallery?.[0] ?? localPhotos.get(place.name))));
  link.append(guideElement("span", (place.portalCategories?.[0] ?? placeCategory(place.name))), guideElement("strong", title));
  if (!featured && place.location) link.append(guideElement("span", place.location));
  return link;
}

if (destinationContent) {
  const place = guidePlaces.find((entry) => guidePlaceId(entry) === guideParams.get("lugar"));
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
    if (place && guideFeatured) guideFeatured.append(placeLink(place, title, true));
  }

  const guideEntries = guidePlaces.map((place) => ({
    place,
    categories: [
      ...(place.portalCategories ?? []),
      ...(place.portalCategories ? (
        place.portalCategories.includes("Praia") ? ["Praias e ilhas"] :
        place.portalCategories.some((type) => ["Trilha", "Mirante", "Parque"].includes(type)) ? ["Trilhas e natureza"] :
        place.portalCategories.some((type) => ["Igreja", "Museu", "Teatro", "Centro Cultural"].includes(type)) ? ["História e cultura"] : []
      ) : [placeCategory(place.name)]),
    ],
    search: normalizeGuideText([place.name, place.location, place.description, place.access, ...(place.portalCategories ?? [])].join(" ")),
  }));
  const section = guideSections.get(currentSection);
  const entries = guideEntries.filter(({ categories }) => {
    if (!section) return true;
    if (currentSection === "regiao" && categories.some((category) =>
      guideSections.get("comer").types.includes(category) || guideSections.get("ficar").types.includes(category)
    )) return false;
    return categories.some((category) => section.types.includes(category));
  });
  const categoryOptions = section
    ? new Set(entries.flatMap(({ categories }) => categories.filter((category) => section.types.includes(category))))
    : new Set(guidePlaces.flatMap((place) => place.portalCategories ?? []));
  for (const category of [...categoryOptions].sort((a, b) => a.localeCompare(b, "pt-BR"))) {
    const option = guideElement("option", category);
    option.value = category;
    guideCategory.append(option);
  }
  entries.sort((first, second) => {
    const priority = ({ place }) => Number(Boolean(place.gallery)) +
      (currentSection === "comer" && curatedFoodIds.some((id) => place.portalIds?.includes(id)) ? 2 : 0);
    return priority(second) - priority(first);
  });

  function renderGuide({ append = false } = {}) {
    const query = normalizeGuideText(guideSearch.value.trim());
    const selectedCategory = guideCategory.value;
    const matches = entries.filter(({ search, categories }) =>
      search.includes(query) && (!selectedCategory || categories.includes(selectedCategory))
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
