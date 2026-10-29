const menuButton = document.getElementById('menu-button');
const drawer = document.getElementById('menu-drawer');
const drawerClose = document.getElementById('drawer-close');
const backdrop = document.getElementById('drawer-backdrop');
const searchButton = document.getElementById('search-button');
const searchPanel = document.getElementById('search-panel');
const searchClose = document.getElementById('search-close');
const searchInput = document.getElementById('search-input');
const searchForm = document.getElementById('search-form');
const searchFeedback = document.getElementById('search-feedback');
const cartButton = document.getElementById('cart-button');
const note = document.getElementById('prototype-note');
const cartCountElement = cartButton.querySelector('.cart-count');
const CART_KEY = 'neluve-cart-v1';
const knownProductIds = new Set(window.NELUVE_PRODUCTS.map((product) => product.id));

function readCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(CART_KEY) || '{}');
    const items = Object.create(null);
    if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
      Object.entries(saved).forEach(([id, quantity]) => {
        if (knownProductIds.has(id) && Number.isSafeInteger(quantity) && quantity > 0) items[id] = quantity;
      });
    }
    return items;
  } catch (_) {
    return Object.create(null);
  }
}

let cartItems = readCart();
function cartQuantity() {
  return Object.values(cartItems).reduce((total, quantity) => total + quantity, 0);
}

function cartSummary() {
  const lines = [];
  let quantity = 0;
  let subtotal = 0;
  window.NELUVE_PRODUCTS.forEach((product) => {
    const itemQuantity = cartItems[product.id] || 0;
    if (!itemQuantity) return;
    const lineTotal = product.price * itemQuantity;
    lines.push({ product, quantity: itemQuantity, lineTotal });
    quantity += itemQuantity;
    subtotal += lineTotal;
  });
  return { lines, quantity, subtotal };
}

function refreshCartCount() {
  const count = cartQuantity();
  cartCountElement.textContent = count;
  cartButton.setAttribute('aria-label', `Корзина, товаров: ${count}`);
}

function setCartQuantity(productId, quantity) {
  if (!knownProductIds.has(productId) || !Number.isSafeInteger(quantity) || quantity < 0) return false;
  if (quantity === 0) delete cartItems[productId];
  else cartItems[productId] = quantity;
  try { localStorage.setItem(CART_KEY, JSON.stringify(cartItems)); } catch (_) {}
  refreshCartCount();
  window.dispatchEvent(new Event('neluve:cartchange'));
  return true;
}

function clearCart() {
  cartItems = Object.create(null);
  try { localStorage.removeItem(CART_KEY); } catch (_) {}
  refreshCartCount();
  window.dispatchEvent(new Event('neluve:cartchange'));
}

function addToCart(productId, quantity = 1, addButton = null) {
  const product = window.NELUVE_PRODUCTS.find((item) => item.id === productId);
  if (!product || !Number.isSafeInteger(quantity) || quantity < 1) return false;
  const nextQuantity = (cartItems[productId] || 0) + quantity;
  if (!Number.isSafeInteger(nextQuantity)) return false;
  setCartQuantity(productId, nextQuantity);
  const feedback = document.getElementById('cart-feedback');
  if (feedback) feedback.textContent = `${product.name}: добавлено ${quantity} шт. В корзине ${cartQuantity()} шт.`;
  if (addButton) {
    addButton.textContent = 'Добавлено';
    addButton.classList.add('is-added');
    clearTimeout(addButton.feedbackTimer);
    addButton.feedbackTimer = setTimeout(() => {
      addButton.textContent = 'В корзину';
      addButton.classList.remove('is-added');
    }, 1600);
  }
  return true;
}

window.NeluveCart = {
  add: addToCart,
  clear: clearCart,
  count: cartQuantity,
  items: () => ({ ...cartItems }),
  setQuantity: setCartQuantity,
  summary: cartSummary
};
window.addEventListener('storage', (event) => {
  if (event.key === CART_KEY) {
    cartItems = readCart();
    refreshCartCount();
    window.dispatchEvent(new Event('neluve:cartchange'));
  }
});
window.addEventListener('pageshow', () => {
  cartItems = readCart();
  refreshCartCount();
  window.dispatchEvent(new Event('neluve:cartchange'));
});
refreshCartCount();

let drawerTimer;
let noteTimer;

function motionDuration() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 300;
}

function closeSearch(restoreFocus = true) {
  if (searchPanel.hidden) return;
  searchPanel.hidden = true;
  searchButton.setAttribute('aria-expanded', 'false');
  searchButton.setAttribute('aria-label', 'Открыть поиск');
  if (restoreFocus) searchButton.focus();
}

function openDrawer() {
  closeSearch(false);
  clearTimeout(drawerTimer);
  drawer.hidden = false;
  backdrop.hidden = false;
  document.body.classList.add('menu-open');
  menuButton.setAttribute('aria-expanded', 'true');
  requestAnimationFrame(() => {
    drawer.classList.add('is-open');
    backdrop.classList.add('is-open');
  });
  drawerClose.focus();
}

function closeDrawer() {
  if (drawer.hidden) return;
  drawer.classList.remove('is-open');
  backdrop.classList.remove('is-open');
  menuButton.setAttribute('aria-expanded', 'false');
  clearTimeout(drawerTimer);
  drawerTimer = setTimeout(() => {
    drawer.hidden = true;
    backdrop.hidden = true;
    document.body.classList.remove('menu-open');
    menuButton.focus();
  }, motionDuration());
}

function showNote(message) {
  clearTimeout(noteTimer);
  note.textContent = message;
  note.hidden = false;
  noteTimer = setTimeout(() => { note.hidden = true; }, 4500);
}

menuButton.addEventListener('click', () => {
  if (drawer.hidden) openDrawer();
  else closeDrawer();
});
drawerClose.addEventListener('click', closeDrawer);
backdrop.addEventListener('click', closeDrawer);

searchButton.addEventListener('click', () => {
  if (!searchPanel.hidden) {
    closeSearch();
    return;
  }
  searchPanel.hidden = false;
  searchButton.setAttribute('aria-expanded', 'true');
  searchButton.setAttribute('aria-label', 'Закрыть поиск');
  searchFeedback.textContent = '';
  searchInput.focus();
});
searchClose.addEventListener('click', () => closeSearch());
searchForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const query = searchInput.value.trim();
  if (!query) {
    searchFeedback.textContent = 'Введите запрос, чтобы начать поиск.';
    searchInput.focus();
    return;
  }
  searchFeedback.textContent = `Поиск по запросу «${query}» станет доступен в следующей версии магазина.`;
});

cartButton.addEventListener('click', () => {
  if (window.location.pathname.endsWith('/cart.html')) {
    document.getElementById('cart-title')?.focus();
  } else {
    window.location.href = 'cart.html';
  }
});
document.querySelectorAll('[data-future-link]').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    const message = link.dataset.note || 'Этот раздел появится в следующей версии сайта.';
    if (!drawer.hidden) closeDrawer();
    showNote(message);
  });
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    if (!drawer.hidden) closeDrawer();
    else if (!searchPanel.hidden) closeSearch();
    return;
  }
  if (event.key !== 'Tab' || drawer.hidden) return;
  const focusable = Array.from(drawer.querySelectorAll('button, a, summary, input, [tabindex]:not([tabindex="-1"])'))
    .filter((element) => element.getClientRects().length > 0);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

document.addEventListener('click', (event) => {
  if (!searchPanel.hidden && !event.target.closest('.site-header')) closeSearch(false);
});

// The approved carousel still displays the same six featured products in the same order.
const bestsellerProducts = window.NELUVE_PRODUCTS.filter((product) => product.featured);

const bestsellerTrack = document.getElementById('bestsellers-track');
if (bestsellerTrack) {
const bestsellerTemplate = document.getElementById('product-card-template');
const bestsellerPrev = document.getElementById('bestsellers-prev');
const bestsellerNext = document.getElementById('bestsellers-next');
const bestsellerCounter = document.getElementById('bestsellers-counter');
const bestsellerCurrent = document.getElementById('bestsellers-current');
const bestsellerTotal = document.getElementById('bestsellers-total');
const productCards = document.createDocumentFragment();
bestsellerProducts.forEach((product) => {
  const card = bestsellerTemplate.content.firstElementChild.cloneNode(true);
  card.dataset.productId = product.id;
  const image = card.querySelector('.product-card__image');
  window.NeluveApplyProductImage(image, product);
  const productUrl = window.NeluveProductUrl(product.id);
  card.querySelector('.product-card__image-link').href = productUrl;
  const nameLink = card.querySelector('.product-card__name-link');
  nameLink.href = productUrl;
  nameLink.textContent = product.name;
  card.querySelector('.product-card__description').textContent = product.description;
  card.querySelector('.product-card__volume').textContent = product.volume;
  card.querySelector('.product-card__price').textContent = `${product.price.toLocaleString('ru-RU')} ₽`;

  const addButton = card.querySelector('.product-card__add');
  addButton.setAttribute('aria-label', `Добавить ${product.name} в корзину`);
  addButton.addEventListener('click', () => addToCart(product.id, 1, addButton));
  productCards.append(card);
});
bestsellerTrack.append(productCards);

function updateBestsellerControls() {
  const maxScroll = bestsellerTrack.scrollWidth - bestsellerTrack.clientWidth;
  bestsellerPrev.disabled = bestsellerTrack.scrollLeft <= 1;
  bestsellerNext.disabled = bestsellerTrack.scrollLeft >= maxScroll - 1;
  const card = bestsellerTrack.querySelector('.product-card');
  if (!card) return;
  const gap = Number.parseFloat(getComputedStyle(bestsellerTrack).gap) || 0;
  const step = card.getBoundingClientRect().width + gap;
  const position = Math.min(bestsellerProducts.length - 1, Math.max(0, Math.round(bestsellerTrack.scrollLeft / step)));
  bestsellerCurrent.textContent = String(position + 1).padStart(2, '0');
  bestsellerTotal.textContent = String(bestsellerProducts.length).padStart(2, '0');
  bestsellerCounter.setAttribute('aria-label', `Товар ${position + 1} из ${bestsellerProducts.length}`);
}

function moveBestsellers(direction) {
  const card = bestsellerTrack.querySelector('.product-card');
  if (!card) return;
  const gap = Number.parseFloat(getComputedStyle(bestsellerTrack).gap) || 0;
  const distance = card.getBoundingClientRect().width + gap;
  const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
  bestsellerTrack.scrollBy({ left: direction * distance, behavior });
}

bestsellerPrev.addEventListener('click', () => moveBestsellers(-1));
bestsellerNext.addEventListener('click', () => moveBestsellers(1));
bestsellerTrack.addEventListener('keydown', (event) => {
  if (event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    moveBestsellers(event.key === 'ArrowLeft' ? -1 : 1);
  }
});
bestsellerTrack.addEventListener('scroll', updateBestsellerControls, { passive: true });
window.addEventListener('resize', updateBestsellerControls);
updateBestsellerControls();
}

// The newsletter is a portfolio demonstration: addresses never leave the page.
const newsletterForm = document.getElementById('newsletter-form');
const newsletterInput = document.getElementById('newsletter-email');
const newsletterStatus = document.getElementById('newsletter-status');

function showNewsletterError(message) {
  newsletterInput.setAttribute('aria-invalid', 'true');
  newsletterStatus.classList.add('is-error');
  newsletterStatus.textContent = message;
}

newsletterInput.addEventListener('input', () => {
  newsletterInput.removeAttribute('aria-invalid');
  newsletterStatus.classList.remove('is-error');
  newsletterStatus.textContent = '';
});

newsletterInput.addEventListener('blur', () => {
  if (newsletterInput.value.trim() && !newsletterInput.checkValidity()) {
    showNewsletterError('Проверьте адрес электронной почты и попробуйте снова.');
  }
});

newsletterForm.addEventListener('submit', (event) => {
  event.preventDefault();
  newsletterInput.value = newsletterInput.value.trim();
  if (!newsletterInput.value) {
    showNewsletterError('Введите адрес электронной почты.');
    newsletterInput.focus();
    return;
  }
  if (!newsletterInput.checkValidity()) {
    showNewsletterError('Проверьте адрес электронной почты и попробуйте снова.');
    newsletterInput.focus();
    return;
  }
  newsletterInput.value = '';
  newsletterInput.removeAttribute('aria-invalid');
  newsletterStatus.classList.remove('is-error');
  newsletterStatus.textContent = 'Это демонстрация: подписка не оформлена, адрес не сохранён.';
});
