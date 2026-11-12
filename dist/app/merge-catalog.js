(() => {
  const places = window.AngraData.curated;
  const slug = (name) => name.normalize("NFD").replace(/\p{Diacritic}/gu, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const beachAliases = new Map([
    [254, "Lagoa Azul"], [483, "Praia da Cachoeira"], [260, "Praia de Sororoca"],
    [253, "Praia do Laboratório"], [232, "Praia da Piedade"], [256, "Praia das Gordas"],
    [259, "Praia da Bica"], [264, "Praia da Júlia"], [255, "Praia Grande"],
    [261, "Praia do Bonfim"], [267, "Praia do Anil"], [257, "Praia do Anil"],
  ]);
  const bySlug = new Map(places.map((place) => [slug(place.name), [place]]));
  const photoCredit = "Fotos do acervo Experiências Viva Angra.";

  // Hospedagens com divulgação suspensa durante o convite para o piloto.
  const pausedLodgingIds = new Set([349, 387, 370, 1048, 372, 1044, 383, 381, 391, 1061, 396, 367, 1050, 1057, 317]);

  for (const source of window.VivaAngraPortalCatalog) {
    const key = slug(beachAliases.get(source.portalId) ?? source.name);
    const candidates = bySlug.get(key) ?? [];
    const match = candidates.find((place) =>
      beachAliases.has(source.portalId) ||
      (Number.isFinite(place.lat) && Number.isFinite(source.lat) &&
        Math.hypot(place.lat - source.lat, place.lng - source.lng) < 0.002) ||
      (place.location && source.location && slug(place.location) === slug(source.location) &&
        !["angra-dos-reis", "ilha-grande"].includes(slug(source.location)))
    );
    if (match) {
      if (pausedLodgingIds.has(source.portalId)) match.hidden = true;
      match.location ??= source.location;
      match.access ??= source.access;
      match.portalIds = [...(match.portalIds ?? []), source.portalId];
      match.portalCategories = [...new Set([...(match.portalCategories ?? []), source.portalCategory])];
      if (source.gallery?.length && !beachAliases.has(source.portalId)) {
        match.gallery = [...new Set([...(match.gallery ?? []), ...source.gallery])];
        match.photoUrl ??= source.gallery[0];
        match.photoCredit ??= photoCredit;
      }
      continue;
    }

    const place = {
      ...source,
      id: candidates.length ? key + "-" + source.portalId : key,
      portalCategories: [source.portalCategory],
      portalIds: [source.portalId],
      hidden: pausedLodgingIds.has(source.portalId),
      photoUrl: source.gallery?.[0],
      photoCredit: source.gallery?.length ? photoCredit : undefined,
    };
    candidates.push(place);
    bySlug.set(key, candidates);
    places.push(place);
  }
})();
