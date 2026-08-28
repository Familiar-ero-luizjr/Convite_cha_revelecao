(async () => {
  const fallback = window.CONVITE_DEFAULTS || window.CONVITE;
  if (!fallback) throw new Error("Arquivo convite-data.js não foi carregado.");

  let data = fallback;

  try {
    if (window.InviteDataService) {
      data = await window.InviteDataService.load();
    }
  } catch (error) {
    console.warn("Não foi possível carregar o adapter ativo; usando os valores padrão.", error);
  }

  const screens = [...document.querySelectorAll('.screen')];
  const dots = [...document.querySelectorAll('.dot')];
  const back = document.getElementById('backBtn');
  let current = 0;
  let locked = false;

  document.getElementById('girlName').textContent = data.menina;
  document.getElementById('boyName').textContent = data.menino;
  document.getElementById('orText').textContent = data.textoOu || 'ou';
  document.getElementById('openHint').textContent = data.textoAbrir || 'Toque na carta 💌';
  document.getElementById('eventDate').textContent = String(data.data).replace(' ', '\n');
  document.getElementById('eventTime').textContent = String(data.horario).replace(/\s+(HORAS?)$/i, '\n$1');
  back.textContent = data.textoVoltar || '← Voltar';

  // Mantém exatamente as três imagens originais como fundo; apenas permite trocar
  // o src pelo painel quando você quiser.
  document.querySelector('#screen-0 .art img').src = data.imagemCapa || 'assets/convite/page_1.jpeg';
  document.querySelector('#screen-1 .art img').src = data.imagemDetalhes || 'assets/convite/page_2.jpeg';
  document.querySelector('#screen-2 .art img').src = data.imagemPresentes || 'assets/convite/page_3.jpeg';

  const giftContent = document.getElementById('giftEditableContent');
  const giftParts = [];

  if (data.presentesTitulo) {
    const title = document.createElement('p');
    title.className = 'gift-title';
    title.textContent = data.presentesTitulo;
    giftParts.push(title);
  }

  if (data.presentesLista) {
    const list = document.createElement('p');
    list.className = 'gift-list';
    list.textContent = data.presentesLista;
    giftParts.push(list);
  }

  if (data.presentesObservacao) {
    const note = document.createElement('p');
    note.className = 'gift-note';
    note.textContent = data.presentesObservacao;
    giftParts.push(note);
  }

  giftContent.replaceChildren(...giftParts);

  function updateNavigation() {
    dots.forEach((dot, index) => dot.classList.toggle('active', index === current));
    back.classList.toggle('show', current > 0);
  }

  function sparkle(x, y) {
    for (let index = 0; index < 12; index += 1) {
      const particle = document.createElement('i');
      const angle = Math.PI * 2 * index / 12;
      const distance = 30 + Math.random() * 45;
      particle.className = 'sparkle';
      particle.style.left = `${x}px`;
      particle.style.top = `${y}px`;
      particle.style.setProperty('--x', `${Math.cos(angle) * distance}px`);
      particle.style.setProperty('--y', `${Math.sin(angle) * distance}px`);
      document.body.append(particle);
      setTimeout(() => particle.remove(), 750);
    }
  }

  function goTo(index, event) {
    if (locked || index < 0 || index >= screens.length || index === current) return;
    locked = true;
    screens[current].classList.remove('active');
    screens[index].classList.add('active');
    current = index;
    updateNavigation();
    setTimeout(() => { locked = false; }, 520);
    if (event?.clientX) sparkle(event.clientX, event.clientY);
  }

  function openLink(url, label) {
    if (!url) {
      alert(`Adicione a URL de “${label}” no painel administrativo.`);
      return;
    }
    window.open(url, '_blank', 'noopener');
  }

  document.getElementById('openLetter').addEventListener('click', event => goTo(1, event));
  document.getElementById('confirmBtn').addEventListener('click', () => openLink(data.confirmarPresenca, 'Confirmar presença'));
  document.getElementById('locationBtn').addEventListener('click', () => openLink(data.localizacaoFesta, 'Localização da festa'));
  document.getElementById('giftsBtn').addEventListener('click', event => {
    if (data.sugestoesPresentes) openLink(data.sugestoesPresentes, 'Sugestões de presentes');
    else goTo(2, event);
  });
  document.getElementById('listBtn').addEventListener('click', () => openLink(data.sugestoesPresentes, 'Sugestões de presentes'));
  back.addEventListener('click', event => goTo(current - 1, event));

  document.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') goTo(current - 1);
    if (event.key === 'ArrowRight') goTo(current + 1);
  });

  let startX = null;
  let startY = null;
  document.addEventListener('touchstart', event => {
    const touch = event.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
  }, { passive:true });
  document.addEventListener('touchend', event => {
    if (startX === null) return;
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - startX;
    const deltaY = touch.clientY - startY;
    startX = startY = null;
    if (Math.abs(deltaX) > 70 && Math.abs(deltaX) > Math.abs(deltaY) * 1.4) {
      goTo(current + (deltaX < 0 ? 1 : -1));
    }
  }, { passive:true });

  updateNavigation();
})();
