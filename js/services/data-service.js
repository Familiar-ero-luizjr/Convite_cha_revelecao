(() => {
  const adapters = {};
  const VALID_MODES = ["mock", "banco"];

  const cfg = () => window.APP_CONFIG || {};
  const defaults = () => window.CONVITE_DEFAULTS || {};

  function deepMerge(base, override) {
    if (!override || typeof override !== "object" || Array.isArray(override)) return override === undefined ? base : override;
    const out = { ...(base && typeof base === "object" && !Array.isArray(base) ? base : {}) };
    for (const [key, value] of Object.entries(override)) {
      if (value && typeof value === "object" && !Array.isArray(value)) out[key] = deepMerge(out[key], value);
      else out[key] = value;
    }
    return out;
  }

  function normalizeMode(mode) {
    return VALID_MODES.includes(mode) ? mode : "mock";
  }

  function getMode() {
    try {
      const saved = localStorage.getItem(cfg().dataModeStorageKey || "convite-data-mode");
      return normalizeMode(saved || cfg().dataModeDefault || "mock");
    } catch {
      return normalizeMode(cfg().dataModeDefault || "mock");
    }
  }

  function setMode(mode) {
    const normalized = normalizeMode(mode);
    try { localStorage.setItem(cfg().dataModeStorageKey || "convite-data-mode", normalized); } catch {}
    return normalized;
  }

  function normalizeGiftItem(item, index = 0) {
    const source = item?.imagem?.tipo || item?.media?.source || "none";
    const value = item?.imagem?.valor || item?.media?.value || item?.img || "";
    const validSource = ["none", "repository", "url"].includes(source) ? source : (value ? "repository" : "none");
    return {
      id: String(item?.id || `gift-${Date.now()}-${index}`),
      texto: String(item?.texto || item?.text || item?.name || ""),
      imagem: { tipo: validSource, valor: validSource === "none" ? "" : String(value || "") }
    };
  }

  function parseLegacyDate(value) {
    const raw = String(value || "").trim();
    const parts = raw.split(/\s+/);
    return { dia: parts.shift() || "01", mes: parts.join(" ") || "NOVEMBRO" };
  }

  function normalizeData(value) {
    const source = value && typeof value === "object" ? value : {};
    const merged = deepMerge(defaults(), source);

    if (!Array.isArray(source.presentes) && source.presentesLista) {
      merged.presentes = String(source.presentesLista).split(/\r?\n/).map(x => x.trim()).filter(Boolean)
        .map((texto, i) => normalizeGiftItem({ texto }, i));
    } else {
      merged.presentes = Array.isArray(merged.presentes) ? merged.presentes.map(normalizeGiftItem) : [];
    }
    merged.presentesLista = merged.presentes.map(x => x.texto).filter(Boolean).join("\n");

    // Compatibilidade com os campos da V1.
    const date = parseLegacyDate(merged.data);
    merged._derived = {
      dia: String(merged.dia || date.dia || "01"),
      mes: String(merged.mes || date.mes || "NOVEMBRO").toUpperCase(),
      hora: String(merged.horario || "12:30").replace(/^ÀS\s+/i, "").replace(/\s+HORAS?$/i, "").trim(),
      unidadeHorario: String(merged.unidadeHorario || "HORAS")
    };
    return merged;
  }

  adapters.mock = {
    async load() {
      try {
        const raw = localStorage.getItem(cfg().mockStorageKey || "convite-mock-data");
        return raw ? JSON.parse(raw) : {};
      } catch { return {}; }
    },
    async save(value) {
      localStorage.setItem(cfg().mockStorageKey || "convite-mock-data", JSON.stringify(value));
    },
    async reset() {
      localStorage.removeItem(cfg().mockStorageKey || "convite-mock-data");
    }
  };

  function getAdapter(mode = getMode()) {
    const adapter = adapters[mode];
    if (!adapter) throw new Error(`Adapter "${mode}" não disponível.`);
    return adapter;
  }

  window.InviteDataService = {
    registerAdapter(mode, adapter) {
      if (!adapter || typeof adapter.load !== "function" || typeof adapter.save !== "function") {
        throw new Error("Adapter inválido.");
      }
      adapters[normalizeMode(mode)] = adapter;
    },
    getMode, setMode, normalizeGiftItem, normalizeData,
    getAvailableModes() { return VALID_MODES.map(mode => ({ mode, available: Boolean(adapters[mode]) })); },
    isModeAvailable(mode) { return Boolean(adapters[normalizeMode(mode)]); },
    async load() { return normalizeData(await getAdapter().load()); },
    async save(value) {
      const normalized = normalizeData(value);
      const clean = { ...normalized };
      delete clean._derived;
      await getAdapter().save(clean);
      return normalized;
    },
    async reset() {
      const adapter = getAdapter();
      if (adapter.reset) await adapter.reset(); else await adapter.save({});
      return normalizeData({});
    }
  };
})();
