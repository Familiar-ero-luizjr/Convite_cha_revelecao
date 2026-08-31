(() => {
  const FIELD_MAP = {
    pagina1: {
      "titulo-cha": "paginas.pagina1.tituloCha",
      "p1-boy": "paginas.pagina1.boy",
      "p1-ou": "paginas.pagina1.ou",
      "p1-girl": "paginas.pagina1.girl",
      "texto-convite": "paginas.pagina1.textoConvite"
    },
    pagina2: {
      "nome-feminino": "menina",
      "texto-ou": "textoOu",
      "nome-masculino": "menino",
      "chamada": "paginas.pagina2.chamada",
      "dia": "_derived.dia",
      "mes": "_derived.mes",
      "hora": "_derived.hora",
      "unidade-hora": "_derived.unidadeHorario",
      "acao-1": "paginas.pagina2.acaoConfirmar",
      "acao-2": "paginas.pagina2.acaoLocalizacao",
      "acao-3": "paginas.pagina2.acaoPresentes",
      "acao-4": "paginas.pagina2.acaoVotacao"
    },
    presentes: {
      "eyebrow": "paginas.presentes.eyebrow",
      "titulo": "paginas.presentes.titulo",
      "subtitulo": "paginas.presentes.subtitulo"
    },
    votacao: {
      "votacao-eyebrow": "paginas.votacao.eyebrow",
      "votacao-titulo": "paginas.votacao.titulo",
      "votacao-subtitulo": "paginas.votacao.subtitulo",
      "votacao-label-menina": "paginas.votacao.labelMenina",
      "votacao-ajuda-menina": "paginas.votacao.ajudaMenina",
      "votacao-label-menino": "paginas.votacao.labelMenino",
      "votacao-ajuda-menino": "paginas.votacao.ajudaMenino",
      "votacao-confirmacao-titulo": "paginas.votacao.confirmacaoTitulo",
      "votacao-confirmacao-texto": "paginas.votacao.confirmacaoTexto"
    }
  };

  const getPageId = () => document.body.dataset.editorPage || (location.pathname.split('/').pop() || 'index').replace(/\.html$/i, '') || 'pagina1';
  function getPath(obj, path) { return String(path).split('.').reduce((v, k) => v == null ? undefined : v[k], obj); }
  function setPath(obj, path, value) {
    const parts = String(path).split('.');
    let ref = obj;
    parts.slice(0,-1).forEach(k => { if (!ref[k] || typeof ref[k] !== 'object') ref[k] = {}; ref = ref[k]; });
    ref[parts.at(-1)] = value;
  }
  function clone(v) { return JSON.parse(JSON.stringify(v)); }
  function editableNodes() { return [...document.querySelectorAll('[data-edit-key]')]; }
  function mediaNodes() { return [...document.querySelectorAll('[data-image-key],[data-bg-key]')]; }

  let currentData = null;
  let loadError = null;

  function applyFields(data) {
    const page = getPageId();
    const map = FIELD_MAP[page] || {};
    editableNodes().forEach(node => {
      const path = map[node.dataset.editKey];
      if (!path) return;
      const value = getPath(data, path);
      if (value !== undefined && value !== null) node.textContent = String(value);
    });
  }

  function wirePage2(data) {
    if (getPageId() !== 'pagina2') return;
    document.querySelectorAll('[data-link-key]').forEach(link => {
      const value = getPath(data, link.dataset.linkKey);
      if (value !== undefined) link.href = value || '#';
      if (/^https?:/i.test(link.href)) { link.target = '_blank'; link.rel = 'noopener'; }
    });
  }

  function applyMedia(data) {
    mediaNodes().forEach(node => {
      const path = node.dataset.imageKey || node.dataset.bgKey;
      const value = getPath(data, path);
      if (!value) return;
      if (node.dataset.imageKey) node.setAttribute('src', value);
      else {
        node.style.backgroundImage = `url("${String(value).replace(/"/g, '%22')}")`;
        node.dataset.mediaValue = value;
      }
    });
  }

  function renderGifts(data) {
    if (getPageId() !== 'presentes') return;
    const list = document.getElementById('giftList');
    if (!list) return;
    const gifts = Array.isArray(data.presentes) ? data.presentes : [];
    list.replaceChildren();
    for (const gift of gifts) {
      const item = document.createElement('div');
      item.className = 'gift-label';
      item.dataset.giftId = gift.id || `gift-${Date.now()}`;

      const icon = document.createElement('span');
      icon.className = 'gift-label-icon';
      const src = String(gift?.imagem?.valor || '').trim();
      if (src) {
        const img = document.createElement('img'); img.src = src; img.alt = '';
        img.addEventListener('error', () => { icon.textContent = '🎁'; }, { once:true });
        icon.append(img);
      } else icon.textContent = '🎁';

      const name = document.createElement('span');
      name.className = 'gift-label-name';
      name.dataset.giftText = 'true';
      name.textContent = gift.texto || 'Nova sugestão';

      const remove = document.createElement('button');
      remove.type = 'button'; remove.className = 'gift-remove edit-only'; remove.setAttribute('aria-label','Remover sugestão'); remove.textContent = '×';

      item.append(icon, name, remove);
      list.append(item);
    }
  }

  async function load() {
    try {
      currentData = await window.InviteDataService.load();
      loadError = null;
    } catch (error) {
      console.warn('Firestore indisponível; usando padrões locais.', error);
      currentData = window.InviteDataService.normalizeData(window.CONVITE_DEFAULTS || {});
      loadError = error;
    }
    applyFields(currentData);
    applyMedia(currentData);
    wirePage2(currentData);
    renderGifts(currentData);
    document.dispatchEvent(new CustomEvent('invite-data-loaded', { detail: { data: currentData, error: loadError } }));
    return currentData;
  }

  function collectPageEdits(baseData) {
    const data = clone(baseData || currentData || window.CONVITE_DEFAULTS || {});
    const page = getPageId();
    const map = FIELD_MAP[page] || {};
    editableNodes().forEach(node => {
      const path = map[node.dataset.editKey];
      if (!path || path.startsWith('_derived.')) return;
      setPath(data, path, node.innerText.trim());
    });

    mediaNodes().forEach(node => {
      const path = node.dataset.imageKey || node.dataset.bgKey;
      const value = node.dataset.imageKey ? node.getAttribute('src') : node.dataset.mediaValue;
      if (path && value) setPath(data, path, value);
    });

    document.querySelectorAll('[data-link-key]').forEach(link => {
      setPath(data, link.dataset.linkKey, link.getAttribute('href') || '');
    });

    if (page === 'pagina2') {
      const dia = document.querySelector('[data-edit-key="dia"]')?.innerText.trim() || '01';
      const mes = document.querySelector('[data-edit-key="mes"]')?.innerText.trim() || 'NOVEMBRO';
      const hora = document.querySelector('[data-edit-key="hora"]')?.innerText.trim() || '12:30';
      const unidade = document.querySelector('[data-edit-key="unidade-hora"]')?.innerText.trim() || 'HORAS';
      data.data = `${dia} ${mes}`.trim();
      data.horario = hora;
      data.unidadeHorario = unidade;
    }

    if (page === 'presentes') {
      const list = document.getElementById('giftList');
      data.presentes = [...(list?.querySelectorAll('.gift-label') || [])].map((item, index) => {
        const img = item.querySelector('.gift-label-icon img');
        return window.InviteDataService.normalizeGiftItem({
          id: item.dataset.giftId || `gift-${Date.now()}-${index}`,
          texto: item.querySelector('.gift-label-name')?.innerText.trim() || 'Nova sugestão',
          imagem: img ? { tipo: /^https?:/i.test(img.src) ? 'url' : 'repository', valor: img.getAttribute('src') || '' } : { tipo:'none', valor:'' }
        }, index);
      });
    }
    return data;
  }

  async function savePageEdits() {
    const next = collectPageEdits(currentData);
    currentData = await window.InviteDataService.save(next);
    applyFields(currentData);
    applyMedia(currentData);
    wirePage2(currentData);
    renderGifts(currentData);
    return currentData;
  }

  window.InviteApp = {
    load, applyFields, applyMedia, renderGifts, collectPageEdits, savePageEdits,
    getData: () => currentData,
    getLoadError: () => loadError,
    getPageId,
    setData: value => { currentData = value; }
  };
})();
