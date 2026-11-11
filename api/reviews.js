const { createHash, randomUUID, timingSafeEqual } = require("node:crypto");

const pendingKey = "vat:reviews:pending";
const approvedKey = (place) => "vat:reviews:approved:" + place;

async function redis(...command) {
  const response = await fetch(process.env.UPSTASH_REDIS_REST_URL, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + process.env.UPSTASH_REDIS_REST_TOKEN,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    signal: AbortSignal.timeout(6000),
  });
  const data = await response.json();
  if (!response.ok || data.error) throw new Error("Storage request failed");
  return data.result;
}

function isAdmin(req) {
  const hash = (value) => createHash("sha256").update(value).digest();
  const token = process.env.REVIEWS_ADMIN_TOKEN;
  return Boolean(token && timingSafeEqual(hash(req.headers.authorization ?? ""), hash("Bearer " + token)));
}

const submitReview = `
  if redis.call("HLEN", KEYS[1]) >= 500 then return -1 end
  if not redis.call("SET", KEYS[2], "1", "NX", "EX", 60) then return 0 end
  redis.call("HSET", KEYS[1], ARGV[1], ARGV[2])
  return 1
`;
const moderateReview = `
  local review = redis.call("HGET", KEYS[1], ARGV[1])
  if not review then return 0 end
  if ARGV[2] == "approve" then
    local place = cjson.decode(review).place
    redis.call("LPUSH", "vat:reviews:approved:" .. place, review)
  end
  redis.call("HDEL", KEYS[1], ARGV[1])
  return 1
`;

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN || !process.env.REVIEWS_ADMIN_TOKEN) {
    return res.status(503).json({ error: "Avaliações ainda indisponíveis." });
  }

  const moderation = req.query.admin === "1";
  if (moderation && !isAdmin(req)) return res.status(401).json({ error: "Acesso reservado à equipe." });
  const place = req.query.lugar;
  const validPlace = typeof place === "string" && /^[a-z0-9-]{1,240}$/.test(place);
  if (!moderation && !validPlace) return res.status(400).json({ error: "Destino inválido." });

  try {
    if (req.method === "GET") {
      const rows = moderation
        ? await redis("HVALS", pendingKey)
        : await redis("LRANGE", approvedKey(place), 0, 49);
      const reviews = rows.map((row) => JSON.parse(row));
      if (moderation) reviews.sort((a, b) => a.date.localeCompare(b.date));
      return res.status(200).json({ reviews });
    }

    if (req.method !== "POST") {
      res.setHeader("Allow", "GET, POST");
      return res.status(405).json({ error: "Método inválido." });
    }

    const body = req.body ?? {};
    if (moderation) {
      if (typeof body.id !== "string" || !/^[0-9a-f-]{36}$/.test(body.id) ||
          !["approve", "reject"].includes(body.action)) {
        return res.status(400).json({ error: "Decisão inválida." });
      }
      const changed = await redis("EVAL", moderateReview, 1, pendingKey, body.id, body.action);
      return changed ? res.status(200).json({ ok: true }) : res.status(404).json({ error: "Avaliação já processada." });
    }

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const comment = typeof body.comment === "string" ? body.comment.trim() : "";
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const rating = body.rating;
    if (name.length > 40 || title.length > 240 || comment.length < 10 || comment.length > 600 ||
        !Number.isInteger(rating) || rating < 1 || rating > 5 || body.visited !== true) {
      return res.status(400).json({ error: "Confirme a visita e informe uma nota e um relato de 10 a 600 caracteres." });
    }
    const id = randomUUID();
    const ip = String(req.headers["x-real-ip"] ?? req.socket?.remoteAddress ?? "unknown");
    const rateKey = "vat:reviews:rate:" + createHash("sha256").update(ip).digest("hex");
    const review = { id, place, title, name, comment, rating, date: new Date().toISOString() };
    const saved = await redis("EVAL", submitReview, 2, pendingKey, rateKey, id, JSON.stringify(review));
    if (saved === 0) return res.status(429).json({ error: "Aguarde um minuto antes de enviar outra avaliação." });
    if (saved !== 1) return res.status(503).json({ error: "O envio está temporariamente indisponível." });
    return res.status(201).json({ ok: true });
  } catch {
    return res.status(503).json({ error: "Não foi possível acessar as avaliações. Tente novamente mais tarde." });
  }
};
