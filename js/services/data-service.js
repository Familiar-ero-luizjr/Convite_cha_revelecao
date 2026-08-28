(() => {
  const adapters = {};
  const VALID_MODES = ["mock", "banco"];

  function config() {
    return window.APP_CONFIG || {};
  }

  function defaults() {
    return window.CONVITE_DEFAULTS || window.CONVITE || {};
  }

  function normalizeMode(mode) {
    return VALID_MODES.includes(mode) ? mode : "mock";
  }

  function getMode() {
    const savedMode = localStorage.getItem(config().dataModeStorageKey || "convite-data-mode");
    return normalizeMode(savedMode || config().dataModeDefault || "mock");
  }

  function setMode(mode) {
    const normalized = normalizeMode(mode);
    localStorage.setItem(config().dataModeStorageKey || "convite-data-mode", normalized);
    return normalized;
  }

  function normalizeGiftItem(item, index = 0) {
    const source = item?.imagem?.tipo || item?.media?.source || "none";
    const value = item?.imagem?.valor || item?.media?.value || "";
    const validSource = ["none", "repository", "url"].includes(source) ? source : "none";

    return {
      id: String(item?.id || `gift-${Date.now()}-${index}`),
      texto: String(item?.texto || item?.text || ""),
      imagem: {
        tipo: validSource,
        valor: validSource === "none" ? "" : String(value || "")
      }
    };
  }

  function normalizeData(value) {
    const source = value && typeof value === "object" ? value : {};
    const merged = { ...defaults(), ...source };

    // Migração automática do formato antigo (textarea com uma sugestão por linha).
    if (!Array.isArray(source.presentes) && source.presentesLista) {
      merged.presentes = String(source.presentesLista)
        .split(/\r?\n/)
        .map(text => text.trim())
        .filter(Boolean)
        .map((texto, index) => normalizeGiftItem({ texto }, index));
    } else {
      merged.presentes = Array.isArray(source.presentes)
        ? source.presentes.map(normalizeGiftItem)
        : [];
    }

    // Mantém compatibilidade com versões antigas do convite.
    merged.presentesLista = merged.presentes.map(item => item.texto).filter(Boolean).join("\n");
    return merged;
  }

  adapters.mock = {
    async load() {
      const raw = localStorage.getItem(config().mockStorageKey || "convite-mock-data");
      if (!raw) return {};
      try {
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === "object" ? parsed : {};
      } catch (error) {
        console.warn("Não foi possível ler os dados mock.", error);
        return {};
      }
    },

    async save(value) {
      localStorage.setItem(
        config().mockStorageKey || "convite-mock-data",
        JSON.stringify(value)
      );
    },

    async reset() {
      localStorage.removeItem(config().mockStorageKey || "convite-mock-data");
    }
  };

  function getAdapter(mode = getMode()) {
    const adapter = adapters[mode];
    if (!adapter) {
      if (mode === "banco") {
        throw new Error("Modo banco selecionado, mas o adapter do Firestore não está disponível.");
      }
      throw new Error(`Adapter "${mode}" não registrado.`);
    }
    return adapter;
  }

  window.InviteDataService = {
    registerAdapter(mode, adapter) {
      const normalized = normalizeMode(mode);
      if (!adapter || typeof adapter.load !== "function" || typeof adapter.save !== "function") {
        throw new Error("Adapter inválido: load() e save() são obrigatórios.");
      }
      adapters[normalized] = adapter;
    },

    getMode,
    setMode,
    normalizeGiftItem,

    getAvailableModes() {
      return VALID_MODES.map(mode => ({ mode, available: Boolean(adapters[mode]) }));
    },

    isModeAvailable(mode) {
      return Boolean(adapters[normalizeMode(mode)]);
    },

    async load() {
      const saved = await getAdapter().load();
      return normalizeData(saved);
    },

    async save(value) {
      const normalized = normalizeData(value);
      await getAdapter().save(normalized);
      return normalized;
    },

    async reset() {
      const adapter = getAdapter();
      if (typeof adapter.reset === "function") await adapter.reset();
      else await adapter.save({});
      return normalizeData({});
    }
  };
})();
