(() => {
  const SESSION_KEY = "cha-revelacao:admin-authorized";

  function remember(key) {
    try { sessionStorage.setItem(SESSION_KEY, "1"); } catch {}
    window.InviteAdminApi?.setAdminKey(key);
  }

  window.InviteAdminAuth = {
    isAuthorized() {
      try {
        return sessionStorage.getItem(SESSION_KEY) === "1" && Boolean(window.InviteAdminApi?.getAdminKey());
      } catch { return false; }
    },
    getKey() { return window.InviteAdminApi?.getAdminKey() || ""; },
    async login(key) {
      const normalized = String(key || "").trim();
      if (!normalized) throw new Error("Digite a senha administrativa.");
      const valid = await window.InviteAdminApi.verify(normalized);
      if (!valid) throw new Error("Senha administrativa incorreta.");
      remember(normalized);
      return true;
    },
    async authorize() {
      if (this.isAuthorized()) return true;
      const key = window.prompt("Digite a senha administrativa:");
      if (!key) return false;
      try { return await this.login(key); }
      catch (error) {
        window.alert(error.message || "Não foi possível validar a senha.");
        return false;
      }
    },
    clear() {
      try { sessionStorage.removeItem(SESSION_KEY); } catch {}
      window.InviteAdminApi?.setAdminKey("");
    }
  };
})();
