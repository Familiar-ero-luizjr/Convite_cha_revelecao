(() => {
  const DEVICE_KEY = "cha-revelacao:device-id-v2";
  const LOCAL_VOTE_KEY = "cha-revelacao:vote-v2";
  const baseUrl = String(window.APP_CONFIG?.worker?.baseUrl || "").replace(/\/+$/, "");

  function deviceId() {
    try {
      let id = localStorage.getItem(DEVICE_KEY);
      if (!id) {
        id = crypto.randomUUID ? crypto.randomUUID() : `dev-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        localStorage.setItem(DEVICE_KEY, id);
      }
      return id;
    } catch { return `session-${Date.now()}-${Math.random().toString(36).slice(2)}`; }
  }

  async function api(path, options = {}) {
    if (!baseUrl) throw new Error("API de votação não configurada.");
    const response = await fetch(`${baseUrl}${path}`, options);
    let payload = {};
    try { payload = await response.json(); } catch {}
    if (!response.ok) throw new Error(payload.error || `API respondeu ${response.status}.`);
    return payload;
  }

  async function getExistingVote() {
    try {
      const cached = localStorage.getItem(LOCAL_VOTE_KEY);
      if (cached) return cached;
    } catch {}
    try {
      const result = await api(`/votes/${encodeURIComponent(deviceId())}`);
      if (result.option) {
        try { localStorage.setItem(LOCAL_VOTE_KEY, result.option); } catch {}
      }
      return result.option || "";
    } catch (error) {
      console.warn("Não foi possível consultar o voto.", error);
      return "";
    }
  }

  async function submitVote(option) {
    const normalized = String(option || "").toLowerCase();
    if (!["menina", "menino"].includes(normalized)) throw new Error("Opção de voto inválida.");
    const result = await api("/votes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId: deviceId(), option: normalized })
    });
    if (result.option) {
      try { localStorage.setItem(LOCAL_VOTE_KEY, result.option); } catch {}
    }
    return result;
  }

  async function getResults() {
    try {
      const result = await api("/vote-results");
      return { menina: Number(result.menina || 0), menino: Number(result.menino || 0), total: Number(result.total || 0) };
    } catch (error) {
      console.warn("Não foi possível carregar os resultados.", error);
      return null;
    }
  }

  window.InviteVoteService = { getExistingVote, submitVote, getResults, deviceId };
})();
