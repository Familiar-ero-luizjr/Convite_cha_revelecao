const IMAGES_DIR = "assets/presentes";
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    }

    try {
      if (url.pathname === "/" && request.method === "GET") {
        return json({ ok: true, service: "convite-cha-revelacao-api" }, 200, request, env);
      }

      if (url.pathname === "/admin/verify" && request.method === "POST") {
        if (!isAuthorized(request, env)) {
          return json({ ok: false, error: "Senha administrativa inválida." }, 401, request, env);
        }
        return json({ ok: true }, 200, request, env);
      }

      if (url.pathname === "/present-images" && request.method === "GET") {
        return await listPresentImages(request, env);
      }

      if (url.pathname === "/present-images" && request.method === "POST") {
        if (!isAuthorized(request, env)) {
          return json({ ok: false, error: "Não autorizado." }, 401, request, env);
        }
        return await uploadPresentImage(request, env);
      }

      return json({ ok: false, error: "Rota não encontrada." }, 404, request, env);
    } catch (error) {
      console.error(error);
      return json({ ok: false, error: error.message || "Erro interno da API." }, 500, request, env);
    }
  }
};

function isAuthorized(request, env) {
  const key = request.headers.get("X-Admin-Key") || "";
  return Boolean(env.ADMIN_KEY) && key === env.ADMIN_KEY;
}

async function listPresentImages(request, env) {
  validateGithubConfig(env);

  const apiUrl = `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${IMAGES_DIR}?ref=${encodeURIComponent(env.GITHUB_BRANCH || "main")}`;
  const response = await githubFetch(apiUrl, env);

  if (response.status === 404) {
    return json({ ok: true, images: [] }, 200, request, env);
  }

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || `GitHub respondeu ${response.status}`);

  const allowedExtensions = /\.(png|jpg|jpeg|webp|gif|svg)$/i;
  const images = data
    .filter(item => item.type === "file" && Number(item.size || 0) > 0 && allowedExtensions.test(item.name))
    .map(item => ({
      name: item.name,
      path: item.path,
      url: item.download_url,
      sha: item.sha,
      size: item.size
    }));

  return json({ ok: true, images }, 200, request, env);
}

async function uploadPresentImage(request, env) {
  validateGithubConfig(env);

  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return json({ ok: false, error: "Envie o arquivo usando multipart/form-data." }, 400, request, env);
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return json({ ok: false, error: 'Campo "file" não encontrado.' }, 400, request, env);
  }
  if (file.size <= 0) return json({ ok: false, error: "Arquivo vazio." }, 400, request, env);
  if (file.size > MAX_FILE_SIZE) return json({ ok: false, error: "A imagem deve ter no máximo 5 MB." }, 400, request, env);

  const allowedTypes = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"];
  if (!allowedTypes.includes(file.type)) {
    return json({ ok: false, error: "Formato de imagem não permitido." }, 400, request, env);
  }

  const originalName = sanitizeFilename(file.name);
  const uniqueName = createUniqueFilename(originalName);
  const githubPath = `${IMAGES_DIR}/${uniqueName}`;
  const base64 = arrayBufferToBase64(await file.arrayBuffer());
  const apiUrl = `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${githubPath}`;

  const response = await githubFetch(apiUrl, env, {
    method: "PUT",
    body: JSON.stringify({
      message: `Adiciona imagem de presente: ${uniqueName}`,
      content: base64,
      branch: env.GITHUB_BRANCH || "main"
    })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || `Erro ao enviar imagem ao GitHub (${response.status}).`);

  return json({
    ok: true,
    image: {
      name: uniqueName,
      path: githubPath,
      url: data.content?.download_url || null,
      sha: data.content?.sha || null
    },
    commit: {
      sha: data.commit?.sha || null,
      url: data.commit?.html_url || null
    }
  }, 201, request, env);
}

async function githubFetch(url, env, options = {}) {
  return fetch(url, {
    ...options,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "convite-cha-revelacao-worker",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {})
    }
  });
}

function validateGithubConfig(env) {
  for (const variable of ["GITHUB_TOKEN", "GITHUB_OWNER", "GITHUB_REPO"]) {
    if (!env[variable]) throw new Error(`Variável ${variable} não configurada no Worker.`);
  }
}

function sanitizeFilename(filename) {
  const parts = String(filename || "imagem").split(".");
  const extension = parts.length > 1 ? "." + parts.pop().toLowerCase() : "";
  let name = parts.join(".")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!name) name = "imagem";
  return `${name}${extension}`;
}

function createUniqueFilename(filename) {
  const index = filename.lastIndexOf(".");
  const extension = index >= 0 ? filename.substring(index) : "";
  const name = index >= 0 ? filename.substring(0, index) : filename;
  const random = Math.random().toString(36).substring(2, 7);
  return `${name}-${Date.now()}-${random}${extension}`;
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin");
  const configured = String(env.ALLOWED_ORIGIN || "").trim();
  const allowedOrigin = configured ? (origin === configured ? origin : configured) : "*";
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Key",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}

function json(data, status, request, env) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      ...corsHeaders(request, env)
    }
  });
}
