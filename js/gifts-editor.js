(() => {
  const list = document.getElementById('giftList');
  const addButton = document.getElementById('addGift');
  if (!list || !addButton) return;

  function addGift() {
    if (!document.body.classList.contains('edit-mode')) return;
    const item = document.createElement('div');
    item.className = 'gift-label';
    item.dataset.giftId = 'custom-' + Date.now();
    item.innerHTML = `<span class="gift-label-icon">🎁</span><span class="gift-label-name" data-gift-text="true">Nova sugestão</span><button class="gift-remove edit-only" type="button" aria-label="Remover sugestão">×</button>`;
    list.append(item);
    document.dispatchEvent(new CustomEvent('invite-gifts-changed'));
    const name = item.querySelector('[data-gift-text]');
    name.contentEditable = 'true'; name.focus();
  }

  addButton.addEventListener('click', addGift);
  list.addEventListener('click', event => {
    const remove = event.target.closest('.gift-remove');
    if (!remove || !document.body.classList.contains('edit-mode')) return;
    const item = remove.closest('.gift-label');
    if (item && list.children.length > 1) {
      item.remove();
      document.dispatchEvent(new CustomEvent('invite-gifts-changed'));
    }
  });
})();
