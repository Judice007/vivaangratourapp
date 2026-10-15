const SITE_CONFIG = {
  whatsappNumber: "5524999999999",
  instagramHandle: "@vivaangratour",
  instagramUrl: "https://www.instagram.com/vivaangratour/",
};

const WHATSAPP_NUMBER = SITE_CONFIG.whatsappNumber;

const defaultMessage =
  "Oi! Quero saber mais sobre os passeios da Viva Angra Tour. Pode me passar valores e disponibilidade?";

const form = document.querySelector("#quote-form");
const preview = document.querySelector("#message-preview");
const whatsappLinks = document.querySelectorAll("[data-whatsapp-link]");
const instagramLinks = document.querySelectorAll("[data-instagram-link]");
const tourLinks = document.querySelectorAll("[data-tour-link]");
const siteHeader = document.querySelector(".site-header");
const menuToggle = document.querySelector(".menu-toggle");
const mainNav = document.querySelector("#main-nav");
const revealItems = document.querySelectorAll(
  ".section-heading, .route-strip div, .route-gallery, .tour-card, .mood-copy, .mood-card, .confidence-grid div, .process-list article, .essentials > div, .essentials-grid article, .planner-copy, .quote-form, .closing-cta, .faq-list details, .contact-panel"
);

function formatDate(value) {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function buildUrl(message) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

function getFormMessage() {
  const data = new FormData(form);
  const name = data.get("name")?.trim();
  const date = formatDate(data.get("date"));
  const people = data.get("people");
  const tour = data.get("tour");
  const departure = data.get("departure");
  const notes = data.get("notes")?.trim();

  const lines = [
    `Oi! Meu nome é ${name || "[nome]"}.`,
    `Quero cotar um passeio em Angra dos Reis.`,
    `Roteiro: ${tour}.`,
    `Ponto de saída: ${departure}.`,
    `Data desejada: ${date || "[data]"}.`,
    `Quantidade de pessoas: ${people || "[pessoas]"}.`,
    `Duração esperada: média de 6 horas.`,
  ];

  if (notes) {
    lines.push(`Observações: ${notes}.`);
  }

  return lines.join("\n");
}

function updateDefaultLinks() {
  whatsappLinks.forEach((link) => {
    link.href = buildUrl(defaultMessage);
  });

  instagramLinks.forEach((link) => {
    link.href = SITE_CONFIG.instagramUrl;
  });
}

function updatePreview() {
  if (!form || !preview) return;
  preview.textContent = getFormMessage();
}

function setupReveal() {
  if (!revealItems.length) return;

  revealItems.forEach((item, index) => {
    item.classList.add("reveal-item");
    item.style.setProperty("--reveal-delay", `${Math.min(index % 6, 5) * 60}ms`);
  });

  if (!("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
  );

  revealItems.forEach((item) => observer.observe(item));
}

function setMenuOpen(isOpen) {
  siteHeader?.classList.toggle("menu-open", isOpen);
  menuToggle?.setAttribute("aria-expanded", String(isOpen));
  menuToggle?.setAttribute("aria-label", isOpen ? "Fechar menu" : "Abrir menu");
}

updateDefaultLinks();
updatePreview();
setupReveal();

menuToggle?.addEventListener("click", () => {
  setMenuOpen(!siteHeader?.classList.contains("menu-open"));
});

mainNav?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => setMenuOpen(false));
});

document.addEventListener("click", (event) => {
  if (!siteHeader?.classList.contains("menu-open")) return;
  if (siteHeader.contains(event.target)) return;
  setMenuOpen(false);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") setMenuOpen(false);
});

form?.addEventListener("input", updatePreview);

form?.addEventListener("submit", (event) => {
  event.preventDefault();
  window.open(buildUrl(getFormMessage()), "_blank", "noopener,noreferrer");
});

tourLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    const tourName = link.dataset.tourLink;
    const message = `Oi! Quero cotar o passeio "${tourName}" em Angra dos Reis. Pode me passar valores, disponibilidade e ponto de saída?`;
    window.open(buildUrl(message), "_blank", "noopener,noreferrer");
  });
});
