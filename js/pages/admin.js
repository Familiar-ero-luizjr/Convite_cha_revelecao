(() => {
  const service = window.InviteDataService;
  const imagesService = window.PresentImagesService;
  if (!service) throw new Error("data-service.js não foi carregado.");
  if (!imagesService) throw new Error("present-images-service.js não foi carregado.");

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
  const giftEditor = document.getElementById("giftEditor");
  const emptyGifts = document.getElementById("emptyGifts");
  const addGiftBtn = document.getElementById("addGiftBtn");
  const refreshImagesBtn = document.getElementById("refreshImagesBtn");
  const imagesMessage = document.getElementById("imagesMessage");

  let giftItems = [];
  let repositoryImages = [];

  const imageFields = [
    ["imagemCapa", "previewImagemCapa"],
    ["imagemDetalhes", "previewImagemDetalhes"],
    ["imagemPresentes", "previewImagemPresentes"]
  ];

  function createId() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return `gift-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function setMessage(element, text, type = "") {
    element.textContent = text;
    element.className = `message ${type}`.trim();
  }

  function setModeNotice(text, type = "") {
    modeNotice.textContent = text;
    modeNotice.className = `notice ${type}`.trim();
  }

  function previewSrc(item) {
    if (item?.imagem?.tipo === "url") return item.imagem.valor || "";
    if (item?.imagem?.tipo === "repository") {
      const match = repositoryImages.find(image => image.path === item.imagem.valor);
      return match?.url || item.imagem.valor || "";
    }
    return "";
  }

  function fillForm(data) {
    [...inviteForm.elements].forEach(field => {
      if (!field.name || field.type === "submit" || field.type === "button" || field.type === "file") return;
      if (field.name === "presentesLista") return;
      field.value = data[field.name] ?? "";
    });

    giftItems = Array.isArray(data.presentes)
      ? data.presentes.map((item, index) => service.normalizeGiftItem(item, index))
      : [];

    renderGiftEditor();
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
      if (!field.name || field.type === "submit" || field.type === "button" || field.type === "file") return;
      data[field.name] = typeof field.value === "string" ? field.value.trim() : field.value;
    });

    data.presentes = giftItems.map((item, index) => service.normalizeGiftItem(item, index));
    data.presentesLista = data.presentes.map(item => item.texto).filter(Boolean).join("\n");
    return data;
  }

  function refreshModeStatus() {
    const mode = service.getMode();
    dataModeSelect.value = mode;

    if (mode === "mock") {
      setModeNotice("Modo mock ativo: alterações ficam somente no localStorage deste navegador.", "success");
      return;
    }

    if (service.isModeAvailable("banco")) {
      setModeNotice("Modo banco ativo: o painel está lendo e gravando no Firestore.", "success");
    } else {
      setModeNotice("Modo banco selecionado, mas o adapter do Firestore não está disponível.", "error");
    }
  }

  function repositoryOptions(selected) {
    const options = [
      `<option value="">${repositoryImages.length ? "Selecione uma imagem" : "Nenhuma imagem disponível"}</option>`
    ];
    for (const image of repositoryImages) {
      const isSelected = image.path === selected ? " selected" : "";
      options.push(`<option value="${escapeHtml(image.path)}"${isSelected}>${escapeHtml(image.name)}</option>`);
    }
    return options.join("");
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function renderGiftEditor() {
    emptyGifts.classList.toggle("hidden", giftItems.length > 0);

    giftEditor.innerHTML = giftItems.map((item, index) => {
      const source = item.imagem?.tipo || "none";
      const imageValue = item.imagem?.valor || "";
      const preview = previewSrc(item);

      return `
        <article class="gift-card" data-gift-index="${index}">
          <div class="gift-card-head">
            <strong>Presente ${index + 1}</strong>
            <div class="gift-order-actions">
              <button type="button" class="mini-button" data-action="up" ${index === 0 ? "disabled" : ""} aria-label="Mover presente para cima">↑</button>
              <button type="button" class="mini-button" data-action="down" ${index === giftItems.length - 1 ? "disabled" : ""} aria-label="Mover presente para baixo">↓</button>
              <button type="button" class="mini-button danger-text" data-action="remove">Remover</button>
            </div>
          </div>

          <label>Texto do presente
            <input type="text" data-field="texto" value="${escapeHtml(item.texto)}" placeholder="Ex.: Fralda tamanho M" />
          </label>

          <div class="grid two gift-media-grid">
            <label>Imagem / ícone
              <select data-field="source">
                <option value="none" ${source === "none" ? "selected" : ""}>Sem imagem</option>
                <option value="repository" ${source === "repository" ? "selected" : ""}>Imagem do repositório</option>
                <option value="url" ${source === "url" ? "selected" : ""}>URL externa</option>
                <option value="upload">Enviar nova imagem ao GitHub</option>
              </select>
            </label>

            <div class="gift-preview-wrap">
              ${preview ? `<img class="gift-preview" src="${escapeHtml(preview)}" alt="Prévia do presente ${index + 1}" />` : `<div class="gift-preview-placeholder">Sem imagem</div>`}
            </div>
          </div>

          <div class="gift-source-panel ${source === "repository" ? "" : "hidden"}" data-panel="repository">
            <label>Imagem disponível em assets/presentes/
              <select data-field="repository">${repositoryOptions(imageValue)}</select>
            </label>
          </div>

          <div class="gift-source-panel ${source === "url" ? "" : "hidden"}" data-panel="url">
            <label>URL da imagem
              <input type="url" data-field="url" value="${source === "url" ? escapeHtml(imageValue) : ""}" placeholder="https://..." />
            </label>
          </div>

          <div class="gift-source-panel hidden" data-panel="upload">
            <label>Arquivo local
              <input type="file" data-field="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" />
            </label>
            <div class="upload-row">
              <button type="button" class="button secondary" data-action="upload">Enviar e fazer commit</button>
              <span class="message" data-upload-message></span>
            </div>
          </div>
        </article>`;
    }).join("");
  }

  async function refreshRepositoryImages(showFeedback = true) {
    if (showFeedback) setMessage(imagesMessage, "Atualizando...");
    try {
      repositoryImages = await imagesService.listImages();
      renderGiftEditor();
      if (showFeedback) {
        setMessage(imagesMessage, `${repositoryImages.length} imagem(ns) disponível(is) no repositório.`, "success");
      }
    } catch (error) {
      console.error(error);
      if (showFeedback) setMessage(imagesMessage, error.message || "Não foi possível listar as imagens.", "error");
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
    await Promise.all([loadCurrentMode(), refreshRepositoryImages(false)]);
  }

  loginForm.addEventListener("submit", async event => {
    event.preventDefault();
    const passwordInput = document.getElementById("adminPassword");
    const typedPassword = passwordInput.value.trim();
    setMessage(loginError, "Verificando...");

    try {
      const valid = await imagesService.verifyAdminKey(typedPassword);
      if (!valid) {
        setMessage(loginError, "Senha administrativa incorreta.", "error");
        return;
      }
      imagesService.setAdminKey(typedPassword);
      passwordInput.value = "";
      setMessage(loginError, "");
      await openDashboard();
    } catch (error) {
      console.error(error);
      setMessage(loginError, error.message || "Não foi possível validar a senha no Worker.", "error");
    }
  });

  dataModeSelect.addEventListener("change", async () => {
    service.setMode(dataModeSelect.value);
    await loadCurrentMode();
  });

  inviteForm.addEventListener("input", event => {
    if (event.target.name?.startsWith("imagem")) updatePreviews();
  });

  addGiftBtn.addEventListener("click", () => {
    giftItems.push({ id: createId(), texto: "", imagem: { tipo: "none", valor: "" } });
    renderGiftEditor();
    giftEditor.querySelector(`[data-gift-index="${giftItems.length - 1}"] input[data-field="texto"]`)?.focus();
  });

  refreshImagesBtn.addEventListener("click", () => refreshRepositoryImages(true));

  giftEditor.addEventListener("input", event => {
    const card = event.target.closest("[data-gift-index]");
    if (!card) return;
    const index = Number(card.dataset.giftIndex);
    const item = giftItems[index];
    if (!item) return;

    if (event.target.dataset.field === "texto") item.texto = event.target.value;
    if (event.target.dataset.field === "url") {
      item.imagem = { tipo: "url", valor: event.target.value.trim() };
      const preview = card.querySelector(".gift-preview");
      if (preview) preview.src = event.target.value.trim();
    }
  });

  giftEditor.addEventListener("change", event => {
    const card = event.target.closest("[data-gift-index]");
    if (!card) return;
    const index = Number(card.dataset.giftIndex);
    const item = giftItems[index];
    if (!item) return;

    if (event.target.dataset.field === "source") {
      const source = event.target.value;
      card.querySelectorAll("[data-panel]").forEach(panel => panel.classList.add("hidden"));
      if (source !== "none") card.querySelector(`[data-panel="${source}"]`)?.classList.remove("hidden");

      if (source === "none") {
        item.imagem = { tipo: "none", valor: "" };
        renderGiftEditor();
      }
      if (source === "repository") {
        item.imagem = { tipo: "repository", valor: "" };
        renderGiftEditor();
      }
      if (source === "url") {
        item.imagem = { tipo: "url", valor: "" };
        renderGiftEditor();
      }
      return;
    }

    if (event.target.dataset.field === "repository") {
      item.imagem = { tipo: "repository", valor: event.target.value };
      renderGiftEditor();
    }
  });

  giftEditor.addEventListener("click", async event => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const card = button.closest("[data-gift-index]");
    if (!card) return;
    const index = Number(card.dataset.giftIndex);
    const action = button.dataset.action;

    if (action === "remove") {
      giftItems.splice(index, 1);
      renderGiftEditor();
      return;
    }

    if (action === "up" && index > 0) {
      [giftItems[index - 1], giftItems[index]] = [giftItems[index], giftItems[index - 1]];
      renderGiftEditor();
      return;
    }

    if (action === "down" && index < giftItems.length - 1) {
      [giftItems[index + 1], giftItems[index]] = [giftItems[index], giftItems[index + 1]];
      renderGiftEditor();
      return;
    }

    if (action === "upload") {
      const fileInput = card.querySelector('input[data-field="file"]');
      const message = card.querySelector("[data-upload-message]");
      const file = fileInput?.files?.[0];
      if (!file) {
        setMessage(message, "Selecione uma imagem.", "error");
        return;
      }

      button.disabled = true;
      setMessage(message, "Enviando e criando commit...");
      try {
        const result = await imagesService.uploadImage(file);
        const uploaded = result.image;
        if (!uploaded?.path) throw new Error("A API não devolveu o caminho da imagem.");

        giftItems[index].imagem = { tipo: "repository", valor: uploaded.path };
        await refreshRepositoryImages(false);
        if (!repositoryImages.some(image => image.path === uploaded.path)) {
          repositoryImages.push({ name: uploaded.name, path: uploaded.path, url: uploaded.url || uploaded.path });
        }
        renderGiftEditor();
        setMessage(imagesMessage, `Imagem enviada: ${uploaded.name}`, "success");
      } catch (error) {
        console.error(error);
        setMessage(message, error.message || "Erro ao enviar a imagem.", "error");
        button.disabled = false;
      }
    }
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
    imagesService.clearAdminKey();
    window.location.reload();
  });

  // Se a chave ainda está nesta sessão, abre direto.
  if (imagesService.getAdminKey()) {
    openDashboard();
  }
})();
