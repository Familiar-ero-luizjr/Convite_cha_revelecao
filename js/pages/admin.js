(() => {
  const config = window.APP_CONFIG || {};
  const service = window.InviteDataService;
  if (!service) throw new Error("data-service.js não foi carregado.");

  const loginGate = document.getElementById("loginGate");
  const dashboard = document.getElementById("dashboard");
  const loginForm = document.getElementById("loginForm");
  const loginError = document.getElementById("loginError");
  const inviteForm = document.getElementById("inviteForm");
  const saveMessage = document.getElementById("saveMessage");
  const resetBtn = document.getElementById("resetBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const dataModeSelect = document.getElementById("dataModeSelect");
  const modeNotice = document.getElementById("modeNotice");
  const unlockKey = "convite-admin-unlocked";

  const imageFields = [
    ["imagemCapa", "previewImagemCapa"],
    ["imagemDetalhes", "previewImagemDetalhes"],
    ["imagemPresentes", "previewImagemPresentes"]
  ];

  function setMessage(element, text, type = "") {
    element.textContent = text;
    element.className = `message ${type}`.trim();
  }

  function setModeNotice(text, type = "") {
    modeNotice.textContent = text;
    modeNotice.className = `notice ${type}`.trim();
  }

  function isUnlocked() {
    return sessionStorage.getItem(unlockKey) === "1";
  }

  function fillForm(data) {
    [...inviteForm.elements].forEach(field => {
      if (!field.name || field.type === "submit" || field.type === "button") return;
      field.value = data[field.name] ?? "";
    });
    updatePreviews();
  }

  function updatePreviews() {
    imageFields.forEach(([fieldName, previewId]) => {
      const field = inviteForm.elements[fieldName];
      const preview = document.getElementById(previewId);
      const value = field?.value?.trim();
      if (!value) {
        preview.removeAttribute("src");
        preview.classList.add("empty");
        return;
      }
      preview.src = value;
      preview.classList.remove("empty");
    });
  }

  function collectFormData() {
    const data = {};
    [...inviteForm.elements].forEach(field => {
      if (!field.name || field.type === "submit" || field.type === "button") return;
      data[field.name] = field.value.trim();
    });
    return data;
  }

  function refreshModeStatus() {
    const mode = service.getMode();
    dataModeSelect.value = mode;

    if (mode === "mock") {
      setModeNotice(
        "Modo mock ativo: as alterações são salvas no localStorage deste navegador. Ideal para editar e testar no computador sem banco.",
        "success"
      );
      return;
    }

    if (service.isModeAvailable("banco")) {
      setModeNotice(
        "Modo banco ativo: o painel está lendo e gravando no Firestore configurado.",
        "success"
      );
    } else {
      setModeNotice(
        "Modo banco selecionado, mas o Firestore ainda não foi configurado/carregado. Preencha app-config.js e carregue o SDK Firebase; depois este mesmo painel passa a funcionar sem mudar os campos.",
        "error"
      );
    }
  }

  async function loadCurrentMode() {
    refreshModeStatus();
    setMessage(saveMessage, "");

    try {
      const data = await service.load();
      fillForm(data);
    } catch (error) {
      console.error(error);
      fillForm(window.CONVITE_DEFAULTS || {});
      setMessage(saveMessage, error.message || "Não foi possível carregar os dados.", "error");
    }
  }

  async function openDashboard() {
    loginGate.classList.add("hidden");
    dashboard.classList.remove("hidden");
    await loadCurrentMode();
  }

  loginForm.addEventListener("submit", event => {
    event.preventDefault();
    const typedPassword = document.getElementById("adminPassword").value;
    if (typedPassword !== (config.adminPassword || "")) {
      setMessage(loginError, "Senha incorreta.", "error");
      return;
    }
    sessionStorage.setItem(unlockKey, "1");
    setMessage(loginError, "");
    openDashboard();
  });

  dataModeSelect.addEventListener("change", async () => {
    service.setMode(dataModeSelect.value);
    await loadCurrentMode();
  });

  inviteForm.addEventListener("input", event => {
    if (event.target.name?.startsWith("imagem")) updatePreviews();
  });

  inviteForm.addEventListener("submit", async event => {
    event.preventDefault();
    setMessage(saveMessage, "Salvando...");
    try {
      const saved = await service.save(collectFormData());
      fillForm(saved);
      setMessage(saveMessage, `Alterações salvas no modo ${service.getMode()}.`, "success");
    } catch (error) {
      console.error(error);
      setMessage(saveMessage, error.message || "Erro ao salvar as alterações.", "error");
    }
  });

  resetBtn.addEventListener("click", async () => {
    if (!window.confirm(`Restaurar os valores padrão somente do modo ${service.getMode()}?`)) return;
    try {
      const data = await service.reset();
      fillForm(data);
      setMessage(saveMessage, "Valores padrão restaurados no modo atual.", "success");
    } catch (error) {
      console.error(error);
      setMessage(saveMessage, error.message || "Não foi possível restaurar os padrões.", "error");
    }
  });

  logoutBtn.addEventListener("click", () => {
    sessionStorage.removeItem(unlockKey);
    window.location.reload();
  });

  if (isUnlocked()) openDashboard();
})();
