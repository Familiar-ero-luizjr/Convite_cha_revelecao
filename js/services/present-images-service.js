(() => {
  const workerConfig = window.APP_CONFIG?.worker || {};
  const baseUrl = String(workerConfig.baseUrl || "").replace(/\/+$/, "");
  const keyStorage = workerConfig.adminKeyStorageKey || "convite-worker-admin-key";

  function ensureConfigured() {
    if (!baseUrl) throw new Error("URL do Cloudflare Worker não configurada em app-config.js.");
  }

  async function parseResponse(response) {
    let data = null;
    try { data = await response.json(); } catch (_) { /* resposta sem JSON */ }
    if (!response.ok) {
      throw new Error(data?.error || `API respondeu ${response.status}.`);
    }
    return data || {};
  }

  function getAdminKey() {
    return sessionStorage.getItem(keyStorage) || "";
  }

  function setAdminKey(value) {
    const key = String(value || "").trim();
    if (key) sessionStorage.setItem(keyStorage, key);
    else sessionStorage.removeItem(keyStorage);
  }

  function clearAdminKey() {
    sessionStorage.removeItem(keyStorage);
  }

  async function verifyAdminKey(key) {
    ensureConfigured();
    const normalizedKey = String(key || "").trim();
    if (!normalizedKey) return false;

    const response = await fetch(`${baseUrl}/admin/verify`, {
      method: "POST",
      headers: { "X-Admin-Key": normalizedKey }
    });

    // Compatibilidade com a primeira versão do Worker, que ainda não tinha
    // /admin/verify. Um POST vazio em /present-images retorna 400 quando a
    // chave está correta e 401 quando está incorreta.
    if (response.status === 404) {
      const formData = new FormData();
      const legacyResponse = await fetch(`${baseUrl}/present-images`, {
        method: "POST",
        headers: { "X-Admin-Key": normalizedKey },
        body: formData
      });
      return legacyResponse.status === 400;
    }

    if (response.status === 401) return false;
    const data = await parseResponse(response);
    return data.ok === true;
  }

  async function listImages() {
    ensureConfigured();
    const response = await fetch(`${baseUrl}/present-images`, { method: "GET" });
    const data = await parseResponse(response);
    return Array.isArray(data.images) ? data.images : [];
  }

  async function uploadImage(file) {
    ensureConfigured();
    const key = getAdminKey();
    if (!key) throw new Error("Informe a senha administrativa novamente para enviar imagens.");
    if (!(file instanceof File)) throw new Error("Selecione uma imagem.");

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${baseUrl}/present-images`, {
      method: "POST",
      headers: { "X-Admin-Key": key },
      body: formData
    });

    return parseResponse(response);
  }

  window.PresentImagesService = {
    baseUrl,
    getAdminKey,
    setAdminKey,
    clearAdminKey,
    verifyAdminKey,
    listImages,
    uploadImage
  };
})();
