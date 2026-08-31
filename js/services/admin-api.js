(() => {
  const config = () => window.APP_CONFIG?.worker || {};
  const baseUrl = () => String(config().baseUrl || "").replace(/\/+$/, "");
  const keyStorage = () => config().adminKeyStorageKey || "convite-worker-admin-key";

  function getAdminKey() {
    try { return sessionStorage.getItem(keyStorage()) || ""; } catch { return ""; }
  }

  function setAdminKey(value) {
    try {
      const key = String(value || "").trim();
      if (key) sessionStorage.setItem(keyStorage(), key);
      else sessionStorage.removeItem(keyStorage());
    } catch {}
  }

  async function request(path, options = {}) {
    const root = baseUrl();
    if (!root) throw new Error("Worker administrativo não configurado.");
    const response = await fetch(`${root}${path}`, options);
    let payload = {};
    try { payload = await response.json(); } catch {}
    if (!response.ok) throw new Error(payload.error || `API respondeu ${response.status}.`);
    return payload;
  }

  async function verify(key) {
    const normalized = String(key || "").trim();
    if (!normalized) return false;
    try {
      const payload = await request("/admin/verify", {
        method: "POST",
        headers: { "X-Admin-Key": normalized }
      });
      return payload.ok === true;
    } catch (error) {
      if (/incorreta|inválida|401/i.test(error.message)) return false;
      throw error;
    }
  }

  async function saveInvite(data) {
    const key = getAdminKey();
    if (!key) throw new Error("Sessão administrativa expirada. Entre novamente.");
    return request("/invite", {
      method: "PUT",
      headers: { "Content-Type": "application/json", "X-Admin-Key": key },
      body: JSON.stringify(data)
    });
  }

  async function resetVotes() {
    const key = getAdminKey();
    if (!key) throw new Error("Sessão administrativa expirada. Entre novamente.");
    return request("/votes/reset", {
      method: "POST",
      headers: { "X-Admin-Key": key }
    });
  }

  window.InviteAdminApi = { getAdminKey, setAdminKey, verify, saveInvite, resetVotes };
})();
