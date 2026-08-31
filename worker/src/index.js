const IMAGES_DIR = "assets/presentes";
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_INVITE_SIZE = 700 * 1024;
let tokenCache = { value: "", expiresAt: 0, projectId: "" };

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    }

    try {
      if (url.pathname === "/" && request.method === "GET") {
        return json({ ok: true, service: "convite-cha-revelacao-api", version: 2 }, 200, request, env);
      }

      if (url.pathname === "/admin/verify" && request.method === "POST") {
        return isAuthorized(request, env)
          ? json({ ok: true }, 200, request, env)
          : json({ ok: false, error: "Senha administrativa inválida." }, 401, request, env);
      }

      if (url.pathname === "/invite" && request.method === "PUT") {
        if (!isAuthorized(request, env)) return json({ ok: false, error: "Não autorizado." }, 401, request, env);
        return await saveInvite(request, env);
      }

      if ((url.pathname === "/present-images" || url.pathname === "/images") && request.method === "GET") {
        return await listImages(request, env);
      }

      if ((url.pathname === "/present-images" || url.pathname === "/images") && request.method === "POST") {
        if (!isAuthorized(request, env)) return json({ ok: false, error: "Não autorizado." }, 401, request, env);
        return await uploadImage(request, env);
      }

      if (url.pathname === "/votes" && request.method === "POST") {
        return await submitVote(request, env);
      }

      if (url.pathname.startsWith("/votes/") && request.method === "GET") {
        return await getVote(request, env, decodeURIComponent(url.pathname.slice(7)));
      }

      if (url.pathname === "/vote-results" && request.method === "GET") {
        return await getVoteResults(request, env);
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

async function saveInvite(request, env) {
  const raw = await request.text();
  if (!raw || raw.length > MAX_INVITE_SIZE) {
    return json({ ok: false, error: "Dados vazios ou maiores que 700 KB." }, 400, request, env);
  }
  let data;
  try { data = JSON.parse(raw); }
  catch { return json({ ok: false, error: "JSON inválido." }, 400, request, env); }
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return json({ ok: false, error: "Estrutura do convite inválida." }, 400, request, env);
  }

  const auth = await firebaseAuth(env);
  const name = documentName(auth.projectId, "convites/principal");
  const response = await firestoreFetch(`https://firestore.googleapis.com/v1/${name}`, auth, {
    method: "PATCH",
    body: JSON.stringify({ fields: toFields(data) })
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(firestoreError(payload, response.status));
  return json({ ok: true, updatedAt: new Date().toISOString() }, 200, request, env);
}

async function submitVote(request, env) {
  let body;
  try { body = await request.json(); }
  catch { return json({ ok: false, error: "JSON inválido." }, 400, request, env); }
  const deviceId = validateDeviceId(body?.deviceId);
  const option = String(body?.option || "").toLowerCase();
  if (!deviceId || !["menina", "menino"].includes(option)) {
    return json({ ok: false, error: "Voto inválido." }, 400, request, env);
  }

  const auth = await firebaseAuth(env);
  const voteName = documentName(auth.projectId, `convites/principal/votos/${deviceId}`);
  const resultName = documentName(auth.projectId, "convites/principal/estatisticas/votacao");
  const now = new Date().toISOString();
  const response = await firestoreFetch(
    `https://firestore.googleapis.com/v1/projects/${auth.projectId}/databases/(default)/documents:commit`,
    auth,
    {
      method: "POST",
      body: JSON.stringify({
        writes: [
          {
            update: {
              name: voteName,
              fields: {
                opcao: { stringValue: option },
                criadoEm: { timestampValue: now }
              }
            },
            currentDocument: { exists: false }
          },
          {
            transform: {
              document: resultName,
              fieldTransforms: [
                { fieldPath: option, increment: { integerValue: "1" } },
                { fieldPath: "total", increment: { integerValue: "1" } }
              ]
            }
          }
        ]
      })
    }
  );
  const payload = await response.json();
  if (response.ok) return json({ ok: true, created: true, option }, 201, request, env);

  if (JSON.stringify(payload).includes("ALREADY_EXISTS")) {
    const existing = await readDocument(auth, `convites/principal/votos/${deviceId}`);
    return json({ ok: true, created: false, option: existing?.fields?.opcao?.stringValue || option }, 200, request, env);
  }
  throw new Error(firestoreError(payload, response.status));
}

async function getVote(request, env, rawId) {
  const deviceId = validateDeviceId(rawId);
  if (!deviceId) return json({ ok: false, error: "Identificador inválido." }, 400, request, env);
  const auth = await firebaseAuth(env);
  const document = await readDocument(auth, `convites/principal/votos/${deviceId}`);
  return json({ ok: true, option: document?.fields?.opcao?.stringValue || "" }, 200, request, env);
}

async function getVoteResults(request, env) {
  const auth = await firebaseAuth(env);
  const document = await readDocument(auth, "convites/principal/estatisticas/votacao");
  const menina = firestoreInteger(document?.fields?.menina);
  const menino = firestoreInteger(document?.fields?.menino);
  const total = firestoreInteger(document?.fields?.total) || menina + menino;
  return json({ ok: true, menina, menino, total }, 200, request, env);
}

function validateDeviceId(value) {
  const id = String(value || "");
  return /^[a-zA-Z0-9-]{8,128}$/.test(id) ? id : "";
}

function firestoreInteger(value) {
  return Number(value?.integerValue || value?.doubleValue || 0);
}

async function readDocument(auth, relativePath) {
  const response = await firestoreFetch(
    `https://firestore.googleapis.com/v1/${documentName(auth.projectId, relativePath)}`,
    auth
  );
  if (response.status === 404) return null;
  const payload = await response.json();
  if (!response.ok) throw new Error(firestoreError(payload, response.status));
  return payload;
}

function documentName(projectId, relativePath) {
  return `projects/${projectId}/databases/(default)/documents/${relativePath}`;
}

async function firestoreFetch(url, auth, options = {}) {
  return fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${auth.token}`,
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {})
    }
  });
}

async function firebaseAuth(env) {
  if (tokenCache.value && tokenCache.expiresAt > Date.now() + 60_000) {
    return { token: tokenCache.value, projectId: tokenCache.projectId };
  }
  if (!env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    throw new Error("Secret FIREBASE_SERVICE_ACCOUNT_JSON não configurado no Worker.");
  }
  let account;
  try { account = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON); }
  catch { throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON inválido."); }
  if (!account.client_email || !account.private_key || !account.project_id) {
    throw new Error("A conta de serviço do Firebase está incompleta.");
  }

  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64Url(JSON.stringify({
    iss: account.client_email,
    scope: "https://www.googleapis.com/auth/datastore",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600
  }));
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemBuffer(account.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(`${header}.${claim}`)
  );
  const assertion = `${header}.${claim}.${base64Url(signature)}`;
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion
    })
  });
  const payload = await response.json();
  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error_description || "Não foi possível autenticar no Firebase.");
  }
  tokenCache = {
    value: payload.access_token,
    expiresAt: Date.now() + Number(payload.expires_in || 3600) * 1000,
    projectId: account.project_id
  };
  return { token: tokenCache.value, projectId: tokenCache.projectId };
}

function pemBuffer(pem) {
  const base64 = String(pem).replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  return Uint8Array.from(atob(base64), char => char.charCodeAt(0)).buffer;
}

function base64Url(input) {
  let base64;
  if (typeof input === "string") {
    const bytes = new TextEncoder().encode(input);
    base64 = arrayBufferToBase64(bytes.buffer);
  } else {
    base64 = arrayBufferToBase64(input);
  }
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function toFields(object) {
  return Object.fromEntries(Object.entries(object).map(([key, value]) => [key, toFirestoreValue(value)]));
}

function toFirestoreValue(value) {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  }
  if (typeof value === "string") return { stringValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(toFirestoreValue) } };
  if (typeof value === "object") return { mapValue: { fields: toFields(value) } };
  return { stringValue: String(value) };
}

function firestoreError(payload, status) {
  return payload?.error?.message || `Firestore respondeu ${status}.`;
}

async function listImages(request, env) {
  validateGithubConfig(env);
  const apiUrl = `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${IMAGES_DIR}?ref=${encodeURIComponent(env.GITHUB_BRANCH || "main")}`;
  const response = await githubFetch(apiUrl, env);
  if (response.status === 404) return json({ ok: true, images: [] }, 200, request, env);
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || `GitHub respondeu ${response.status}`);
  const allowed = /\.(png|jpg|jpeg|webp|gif|svg)$/i;
  const images = data
    .filter(item => item.type === "file" && Number(item.size || 0) > 0 && allowed.test(item.name))
    .map(item => ({ name: item.name, path: item.path, url: item.download_url, sha: item.sha, size: item.size }));
  return json({ ok: true, images }, 200, request, env);
}

async function uploadImage(request, env) {
  validateGithubConfig(env);
  if (!(request.headers.get("content-type") || "").includes("multipart/form-data")) {
    return json({ ok: false, error: "Envie o arquivo usando multipart/form-data." }, 400, request, env);
  }
  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return json({ ok: false, error: 'Campo "file" não encontrado.' }, 400, request, env);
  if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
    return json({ ok: false, error: "A imagem deve ter entre 1 byte e 5 MB." }, 400, request, env);
  }
  const allowedTypes = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"];
  if (!allowedTypes.includes(file.type)) return json({ ok: false, error: "Formato de imagem não permitido." }, 400, request, env);

  const uniqueName = createUniqueFilename(sanitizeFilename(file.name));
  const githubPath = `${IMAGES_DIR}/${uniqueName}`;
  const apiUrl = `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${githubPath}`;
  const response = await githubFetch(apiUrl, env, {
    method: "PUT",
    body: JSON.stringify({
      message: `Atualiza imagem do convite: ${uniqueName}`,
      content: arrayBufferToBase64(await file.arrayBuffer()),
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
    commit: { sha: data.commit?.sha || null, url: data.commit?.html_url || null }
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
  let name = parts.join(".").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
  return `${name || "imagem"}${extension}`;
}

function createUniqueFilename(filename) {
  const index = filename.lastIndexOf(".");
  const extension = index >= 0 ? filename.substring(index) : "";
  const name = index >= 0 ? filename.substring(0, index) : filename;
  return `${name}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}${extension}`;
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin");
  const configured = String(env.ALLOWED_ORIGIN || "").trim();
  const allowedOrigin = configured ? (origin === configured ? origin : configured) : "*";
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Key",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}

function json(data, status, request, env) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=UTF-8", ...corsHeaders(request, env) }
  });
}
