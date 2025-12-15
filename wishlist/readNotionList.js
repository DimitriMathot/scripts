export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders()
      });
    }

    // API Notion
    if (url.pathname === "/api/notion") {
      return fetchNotion(env);
    }

    // Page HTML
    return new Response(renderHTML(), {
      headers: { "Content-Type": "text/html; charset=UTF-8" }
    });
  }
};

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders()
    }
  });
}

async function fetchNotion(env) {
  if (!env.NOTION_TOKEN || !env.NOTION_DATABASE_ID) {
    return jsonResponse({ error: "Variables d'environnement manquantes" }, 500);
  }

  const res = await fetch(
    "https://api.notion.com/v1/databases/" + env.NOTION_DATABASE_ID + "/query",
    {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + env.NOTION_TOKEN,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json"
      }
    }
  );

  const json = await res.json();

  if (!res.ok) {
    return jsonResponse({ error: "Erreur Notion", details: json }, 500);
  }

  const products = json.results.map(function(page) {
    console.log(page);
    return ({
    title: page.properties.Name?.rich_text?.[0]?.plain_text || "Sans titre",
    url: page.properties.Lien?.url || "",
    bought: page.properties.Acheté?.checkbox || false,
    note: page.properties.Note?.rich_text?.[0]?.plain_text || "",
    image:
      page.properties.image?.files?.[0]?.external?.url ||
      page.properties.image?.files?.[0]?.file?.url ||
      ""
  })});


  return jsonResponse(products);
}

function renderHTML() {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>🎄 Ma liste d’envies</title>
<style>
:root {
  --red: #8b1e1e;
  --green: #2f6f4e;
  --gold: #d6b15c;
  --bg: #faf7f2;
  --card: #ffffff;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: "Georgia", serif;
  background: radial-gradient(circle at top, #fff, var(--bg));
  color: #2a2a2a;
}

header {
  text-align: center;
  padding: 3rem 1rem 2rem;
}

header h1 {
  font-size: 2.5rem;
  color: var(--red);
  margin-bottom: 0.5rem;
}
/* Guirlande décorative en haut */
.header-guirlande {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 60px;
  background: repeating-linear-gradient(
    45deg,
    red,
    red 10px,
    green 10px,
    green 20px
  );
  box-shadow: 0 0 10px rgba(255,255,255,0.5);
  animation: wiggle 3s infinite alternate;
}

@keyframes wiggle {
  0% { transform: rotate(-3deg); }
  50% { transform: rotate(3deg); }
  100% { transform: rotate(-3deg); }
}

header p {
  font-size: 1rem;
  color: #555;
}

.grid {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1.5rem;
}

.card {
  background: var(--card);
  border-radius: 14px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.08);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.card {
  position: relative; /* nécessaire pour positionner le badge */
}

.card-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: #2f6f4e; /* vert sapin */
  color: white;
  font-size: 0.8rem;
  font-weight: bold;
  padding: 0.3rem 0.6rem;
  border-radius: 8px;
  z-index: 10;
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
}
.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 14px 30px rgba(0,0,0,0.12);
}

.card img {
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  border-bottom: 4px solid var(--green);
}

.card-content {
  padding: 1rem;
  flex-grow: 1;
}

.card h2 {
  font-size: 1.1rem;
  margin: 0 0 0.5rem;
  color: var(--green);
}

.card p {
  font-size: 0.9rem;
  color: #555;
}

.card a {
  display: block;
  text-align: center;
  margin: 1rem;
  padding: 0.6rem;
  border-radius: 8px;
  background: linear-gradient(135deg, var(--red), var(--green));
  color: white;
  text-decoration: none;
  font-weight: bold;
}

.card a:hover {
  opacity: 0.9;
}

footer {
  text-align: center;
  padding: 2rem;
  font-size: 0.85rem;
  color: #777;
}
</style>
</head>

<body>

<header>
  <h1>🎁 Ma liste d’envies</h1>
  <p>Pour un Noël tout doux ✨</p>
</header>
<div class="header-guirlande"></div>
<div class="grid" id="products"></div>

<script>
fetch("/api/notion")
  .then(function(res) {
    return res.json();
  })
  .then(function(data) {
    var container = document.getElementById("products");

    data.forEach(function(item) {
      container.innerHTML +=
        '<div class="card">' +
        (item.bought 
        ? '<div class="card-badge">Acheté</div>'
        : ''
      ) +
          (item.image
            ? '<img src="' + item.image + '" alt="' + item.title + '">'
            : ''
          ) +

          '<div class="card-content">' +
            '<h2>' + item.title + '</h2>' +
            '<p>' + (item.note || '') + '</p>' +
          '</div>' +

          (item.url
            ? '<a href="' + item.url + '" target="_blank">Voir le cadeau</a>'
            : ''
          ) +

        '</div>';
    });
  })
  .catch(function(e) {
    alert("Erreur de chargement 🎅");
    console.error(e);
  });
</script>

</body>
</html>
`;
}

