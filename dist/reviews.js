(() => {
  const section = document.querySelector("#destination-reviews");
  const heading = document.querySelector("#destination-title");
  const place = new URLSearchParams(location.search).get("lugar");
  if (!place || heading.textContent === "Destino não encontrado") return;

  const url = "/api/reviews?lugar=" + encodeURIComponent(place);
  const status = section.querySelector("[role=status]");
  const form = section.querySelector("form");
  const list = section.querySelector(".review-list");
  const submit = form.querySelector("button");

  async function loadReviews() {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Unavailable");
      const { reviews } = await response.json();
      for (const review of reviews) {
        const item = document.createElement("li");
        const title = document.createElement("strong");
        title.textContent = (review.name || "Visitante") + " · " + review.rating + " de 5 estrelas";
        const comment = document.createElement("p");
        comment.textContent = review.comment;
        item.append(title, comment);
        list.append(item);
      }
      status.textContent = reviews.length ? "" : "Seja a primeira pessoa a avaliar este lugar.";
      form.hidden = false;
    } catch {
      section.hidden = true;
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const values = new FormData(form);
    submit.disabled = true;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: heading.textContent,
          name: values.get("name"),
          rating: Number(values.get("rating")),
          comment: values.get("comment"),
          visited: values.has("visited"),
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        status.textContent = result.error || "Não foi possível enviar. Tente novamente.";
        return;
      }
      form.reset();
      form.hidden = true;
      status.textContent = "Avaliação enviada. Ela ficará visível na ficha depois da aprovação.";
    } catch {
      status.textContent = "Não foi possível enviar. Tente novamente.";
    } finally {
      submit.disabled = false;
    }
  });

  section.hidden = false;
  loadReviews();
})();
