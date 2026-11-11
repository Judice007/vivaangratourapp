const form = document.querySelector("form");
const status = document.querySelector("[role=status]");
const list = document.querySelector(".review-list");
let token = "";

async function request(payload) {
  const options = {
    headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
  };
  if (payload) Object.assign(options, { method: "POST", body: JSON.stringify(payload) });
  const response = await fetch("/api/reviews?admin=1", options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Não foi possível acessar a fila.");
  return data;
}

async function renderQueue() {
  list.replaceChildren();
  const { reviews } = await request();
  status.textContent = reviews.length ? reviews.length + " avaliações pendentes." : "Nenhuma avaliação pendente.";
  for (const review of reviews) {
    const item = document.createElement("li");
    const place = document.createElement("a");
    place.href = "destino.html?lugar=" + encodeURIComponent(review.place);
    place.textContent = review.title || review.place;
    const author = document.createElement("p");
    author.textContent = (review.name || "Visitante") + " · " + review.rating + " de 5 estrelas";
    const comment = document.createElement("p");
    comment.textContent = review.comment;
    const actions = document.createElement("div");
    actions.className = "review-actions";
    for (const [action, label] of [["approve", "Aprovar"], ["reject", "Recusar"]]) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = label;
      button.addEventListener("click", async () => {
        for (const control of actions.children) control.disabled = true;
        try {
          await request({ id: review.id, action });
          await renderQueue();
        } catch (error) {
          status.textContent = error.message;
          for (const control of actions.children) control.disabled = false;
        }
      });
      actions.append(button);
    }
    item.append(place, author, comment, actions);
    list.append(item);
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  token = new FormData(form).get("token");
  form.reset();
  try {
    await renderQueue();
  } catch (error) {
    token = "";
    status.textContent = error.message;
  }
});
