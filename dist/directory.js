const directoryTabs = [...document.querySelectorAll(".directory-tabs a")];
const directoryPanels = [...document.querySelectorAll(".directory-panel")];

function selectDirectoryPanel(hash) {
  const active = directoryPanels.find((panel) => "#" + panel.id === hash) ?? directoryPanels[0];
  if (!active) return;
  for (const panel of directoryPanels) panel.hidden = panel !== active;
  for (const tab of directoryTabs) {
    if (tab.hash === "#" + active.id) tab.setAttribute("aria-current", "location");
    else tab.removeAttribute("aria-current");
  }
}

for (const panel of directoryPanels) {
  const hash = "#" + panel.id;
  for (const link of document.querySelectorAll('a[href="' + hash + '"]')) {
    link.addEventListener("click", () => selectDirectoryPanel(hash));
  }
}

selectDirectoryPanel(window.location.hash);
window.addEventListener("hashchange", () => {
  if (directoryPanels.some((panel) => "#" + panel.id === window.location.hash)) {
    selectDirectoryPanel(window.location.hash);
  }
});

function directoryListingDetails(entry) {
  const content = guideElement("div", "", "listing-content");
  if (entry.description) content.append(guideElement("p", entry.description));

  const details = guideElement("dl", "", "listing-details");
  for (const [label, value] of [
    ["Endereço", entry.address],
    ["Telefone", entry.phone],
    ["Horários informados", entry.hours],
  ]) {
    if (value) details.append(guideElement("dt", label), guideElement("dd", value));
  }
  if (details.childElementCount) content.append(details);
  if (entry.instagram) {
    const instagram = guideLink("Instagram · @" + entry.instagram, "https://www.instagram.com/" + entry.instagram + "/");
    instagram.className = "listing-instagram";
    instagram.target = "_blank";
    instagram.rel = "noopener noreferrer";
    content.append(instagram);
  }

  return content;
}

for (const list of document.querySelectorAll("[data-directory]")) {
  const entries = window.VivaAngraDirectory[list.dataset.directory];
  if (!entries.length) {
    list.append(guideElement("p", "As indicações locais aparecerão aqui conforme forem incluídas no guia.", "directory-empty"));
    continue;
  }

  for (const entry of entries) {
    const card = guideElement("article", "", "listing-card");
    const hasDetails = entry.description || entry.address || entry.phone || entry.hours || entry.instagram;
    const preview = guideElement(hasDetails ? "summary" : "div", "", "listing-preview");
    if (entry.image) preview.append(placeImage(entry.image));
    preview.append(guideElement("strong", entry.name));
    if (entry.location) preview.append(guideElement("span", entry.location));
    if (hasDetails) {
      const disclosure = guideElement("details", "", "listing-disclosure");
      const action = guideElement("span", "", "listing-action");
      action.append(
        guideElement("span", "Ver detalhes", "listing-show"),
        guideElement("span", "Recolher detalhes", "listing-hide"),
        guideElement("span", "", "listing-chevron")
      );
      preview.append(action);
      disclosure.append(preview, directoryListingDetails(entry));
      card.append(disclosure);
    } else {
      card.append(preview);
    }
    list.append(card);
  }
}

for (const link of document.querySelectorAll("[data-listing-request]")) {
  link.href = buildUrl(
    "Olá! Quero indicar um estabelecimento para o guia da Viva Angra Tour.\n\n" +
    "Categoria: " + link.dataset.listingRequest + "\n" +
    "Nome do estabelecimento: \n" +
    "Bairro ou vila: \n" +
    "Instagram, site ou contato comercial: "
  );
}
