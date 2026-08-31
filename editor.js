(() => {
  const body = document.body;
  const button = document.getElementById("editToggle");
  if (!button) return;

  const requested = new URLSearchParams(location.search).get("editar") === "1";
  const authorized = window.InviteAdminAuth?.isAuthorized() === true;
  let editing = false;
  let saving = false;
  let activeMedia = null;

  body.classList.toggle("admin-session", authorized);
  if (requested && !authorized) {
    const back = encodeURIComponent(location.pathname.split("/").pop() + "?editar=1");
    location.replace(`admin.html?return=${back}`);
    return;
  }

  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/png,image/jpeg,image/webp,image/gif,image/svg+xml";
  fileInput.hidden = true;
  body.append(fileInput);

  const editableNodes = () => [
    ...document.querySelectorAll("[data-edit-key]"),
    ...document.querySelectorAll("[data-gift-text]")
  ];

  function setEditable(on) {
    editing = on;
    body.classList.toggle("edit-mode", on);
    editableNodes().forEach(node => {
      node.contentEditable = on ? "true" : "false";
      node.spellcheck = on;
      if (on) node.title = "Clique para editar o texto";
      else node.removeAttribute("title");
    });
    button.setAttribute("aria-pressed", String(on));
    button.textContent = on ? "💾 Salvar" : "✏️ Editar";
    document.dispatchEvent(new CustomEvent("cha-editor-mode", { detail: { enabled: on } }));
  }

  async function enter() {
    if (!window.InviteAdminAuth.isAuthorized()) {
      location.href = "admin.html";
      return;
    }
    setEditable(true);
  }

  async function saveAndExit() {
    if (saving) return;
    saving = true;
    button.disabled = true;
    button.textContent = "Salvando…";
    try {
      await window.InviteApp.savePageEdits();
      setEditable(false);
      window.alert("Alterações salvas com segurança.");
    } catch (error) {
      console.error(error);
      window.alert("Não foi possível salvar: " + (error.message || error));
      button.textContent = "💾 Salvar";
    } finally {
      saving = false;
      button.disabled = false;
    }
  }

  function chooseMedia(node) {
    activeMedia = node;
    fileInput.value = "";
    fileInput.click();
  }

  fileInput.addEventListener("change", async () => {
    const file = fileInput.files?.[0];
    const target = activeMedia;
    activeMedia = null;
    if (!file || !target) return;
    body.classList.add("media-uploading");
    button.disabled = true;
    button.textContent = "Enviando imagem…";
    try {
      const result = await window.PresentImagesService.uploadImage(file);
      const value = result.image?.url || result.image?.path;
      if (!value) throw new Error("A API não devolveu o endereço da imagem.");
      if (target.matches("[data-bg-key]")) {
        target.style.backgroundImage = `url("${String(value).replace(/"/g, "%22")}")`;
        target.dataset.mediaValue = value;
      } else {
        const image = target.matches("img") ? target : target.querySelector("img");
        if (image) image.src = value;
        else {
          const created = document.createElement("img");
          created.src = value;
          created.alt = "";
          target.replaceChildren(created);
        }
      }
    } catch (error) {
      window.alert("Não foi possível enviar a imagem: " + (error.message || error));
    } finally {
      body.classList.remove("media-uploading");
      button.disabled = false;
      button.textContent = "💾 Salvar";
    }
  });

  button.addEventListener("click", () => editing ? saveAndExit() : enter());

  document.addEventListener("click", event => {
    if (!editing) return;

    const media = event.target.closest("[data-image-key],[data-bg-key],.gift-label-icon");
    if (media) {
      event.preventDefault();
      event.stopPropagation();
      chooseMedia(media);
      return;
    }

    if (event.target.closest("[data-edit-key],[data-gift-text]")) {
      if (event.target.closest("a")) event.preventDefault();
      event.stopPropagation();
      return;
    }

    const link = event.target.closest("[data-link-key]");
    if (link) {
      event.preventDefault();
      event.stopPropagation();
      const next = window.prompt("Informe o endereço desse botão:", link.getAttribute("href") || "");
      if (next !== null) link.setAttribute("href", next.trim() || "#");
    }
  }, true);

  document.addEventListener("invite-gifts-changed", () => {
    if (editing) setEditable(true);
  });

  window.ChaEditor = { isEditing: () => editing, refresh: () => setEditable(editing) };
  if (requested && authorized) setEditable(true);
})();
