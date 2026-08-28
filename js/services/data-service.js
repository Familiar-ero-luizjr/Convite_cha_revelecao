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

  function mergeWithDefaults(value) {
    return {
      ...defaults(),
      ...(value && typeof value === "object" ? value : {})
    };
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
        throw new Error(
          "Modo banco selecionado, mas o adapter ainda não está disponível. Configure o Firebase e carregue firebase-adapter.js."
        );
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
    getAvailableModes() {
      return VALID_MODES.map(mode => ({
        mode,
        available: Boolean(adapters[mode])
      }));
    },
    isModeAvailable(mode) {
      return Boolean(adapters[normalizeMode(mode)]);
    },

    async load() {
      const saved = await getAdapter().load();
      return mergeWithDefaults(saved);
    },

    async save(value) {
      const normalized = mergeWithDefaults(value);
      await getAdapter().save(normalized);
      return normalized;
    },

    async reset() {
      const adapter = getAdapter();
      if (typeof adapter.reset === "function") {
        await adapter.reset();
      } else {
        await adapter.save({});
      }
      return mergeWithDefaults({});
    }
  };
})();
