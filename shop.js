const shopProducts = window.NELUVE_PRODUCTS;
const shopGrid = document.getElementById('shop-grid');
const shopTemplate = document.getElementById('shop-product-template');
const categoryButtons = Array.from(document.querySelectorAll('[data-category]'));
const categoryNav = document.querySelector('.shop-categories-nav');
const compactCategories = window.matchMedia('(max-width: 600px)');
const reducedCategoryMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const resultCount = document.getElementById('shop-result-count');
const shownCount = document.getElementById('shop-shown-count');
const loadMoreButton = document.getElementById('load-more');
const emptyState = document.getElementById('shop-empty');
const emptyReset = document.getElementById('empty-reset');
const sortSelect = document.getElementById('sort-select');
const filterButton = document.getElementById('filter-toggle');
const filterPanel = document.getElementById('price-filter-panel');
const filterBackdrop = document.getElementById('filter-backdrop');
const filterClose = document.getElementById('filter-close');
const filterForm = document.getElementById('filter-form');
const minInput = document.getElementById('price-min');
const maxInput = document.getElementById('price-max');
const filterError = document.getElementById('filter-price-error');
const filterReset = document.getElementById('filter-reset');
const filterSummary = document.getElementById('filter-summary');
const filterBadge = document.getElementById('filter-badge');
const mobileFilter = window.matchMedia('(max-width: 700px)');
const categoryIds = ['all', 'cleansing', 'serums', 'creams', 'body'];
const initialCategory = new URLSearchParams(location.search).get('category');

let activeCategory = categoryIds.includes(initialCategory) ? initialCategory : 'all';
let minPrice = null;
let maxPrice = null;
let visibleCount = 12;
let filterTimer;

function productWord(count) {
  const lastTwo = count % 100;
  if (lastTwo >= 11 && lastTwo <= 14) return 'товаров';
  const last = count % 10;
  if (last === 1) return 'товар';
  if (last >= 2 && last <= 4) return 'товара';
  return 'товаров';
}

function selectedProducts() {
  const filtered = shopProducts.filter((product) =>
    (activeCategory === 'all' || product.category === activeCategory) &&
    (minPrice === null || product.price >= minPrice) &&
    (maxPrice === null || product.price <= maxPrice)
  );
  const sort = sortSelect.value;
  if (sort === 'price-asc') filtered.sort((a, b) => a.price - b.price);
  if (sort === 'price-desc') filtered.sort((a, b) => b.price - a.price);
  if (sort === 'name') filtered.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  if (sort === 'recommended') filtered.sort((a, b) => Number(b.featured) - Number(a.featured));
  return filtered;
}

function updateCategoryState() {
  categoryButtons.forEach((button) => {
    const selected = button.dataset.category === activeCategory;
    button.classList.toggle('is-active', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
}

function revealCategory(button, animate = false) {
  if (!compactCategories.matches || !button) return;
  const navBounds = categoryNav.getBoundingClientRect();
  const buttonBounds = button.getBoundingClientRect();
  const gutter = Number.parseFloat(getComputedStyle(categoryNav).paddingLeft) || 0;
  let destination = categoryNav.scrollLeft;
  if (buttonBounds.left < navBounds.left + gutter) {
    destination += buttonBounds.left - navBounds.left - gutter;
  } else if (buttonBounds.right > navBounds.right - gutter) {
    destination += buttonBounds.right - navBounds.right + gutter;
  }
  if (Math.abs(destination - categoryNav.scrollLeft) > 1) {
    categoryNav.scrollTo({ left: destination, behavior: animate && !reducedCategoryMotion.matches ? 'smooth' : 'auto' });
  }
}

function revealActiveCategory(animate = false) {
  revealCategory(categoryButtons.find((button) => button.dataset.category === activeCategory), animate);
}

function updateFilterState() {
  const count = Number(minPrice !== null) + Number(maxPrice !== null);
  filterBadge.hidden = count === 0;
  filterBadge.textContent = String(count);
  filterButton.classList.toggle('is-active', count > 0);
  const parts = [];
  if (minPrice !== null) parts.push(`от ${minPrice.toLocaleString('ru-RU')} ₽`);
  if (maxPrice !== null) parts.push(`до ${maxPrice.toLocaleString('ru-RU')} ₽`);
  filterSummary.textContent = parts.length ? `Цена ${parts.join(' ')}` : 'Все цены';
}

function makeCard(product) {
  const card = shopTemplate.content.firstElementChild.cloneNode(true);
  card.dataset.productId = product.id;
  const image = card.querySelector('.product-card__image');
  window.NeluveApplyProductImage(image, product);
  card.querySelector('.shop-product__name-button').textContent = product.name;
  card.querySelector('.product-card__description').textContent = product.description;
  card.querySelector('.product-card__volume').textContent = product.volume;
  card.querySelector('.product-card__price').textContent = `${product.price.toLocaleString('ru-RU')} ₽`;
  card.querySelectorAll('[data-product-open]').forEach((link) => {
    link.href = window.NeluveProductUrl(product.id);
    link.setAttribute('aria-label', `Открыть ${product.name}`);
  });
  const addButton = card.querySelector('.product-card__add');
  addButton.setAttribute('aria-label', `Добавить ${product.name} в корзину`);
  addButton.addEventListener('click', () => window.NeluveCart.add(product.id, 1, addButton));
  return card;
}

function renderProducts() {
  const matches = selectedProducts();
  const displayed = matches.slice(0, visibleCount);
  const cards = document.createDocumentFragment();
  displayed.forEach((product) => cards.append(makeCard(product)));
  shopGrid.replaceChildren(cards);
  resultCount.textContent = `Найдено: ${matches.length} ${productWord(matches.length)}`;
  shownCount.textContent = matches.length ? `Показано ${displayed.length} из ${matches.length}` : '';
  loadMoreButton.hidden = displayed.length >= matches.length;
  emptyState.hidden = matches.length !== 0;
  updateCategoryState();
  updateFilterState();
}

function clearFilterError() {
  filterError.textContent = '';
  minInput.removeAttribute('aria-invalid');
  maxInput.removeAttribute('aria-invalid');
}

function readPriceRange() {
  clearFilterError();
  const min = minInput.value.trim() === '' ? null : Number(minInput.value);
  const max = maxInput.value.trim() === '' ? null : Number(maxInput.value);
  if ((min !== null && (!Number.isInteger(min) || min < 0)) || (max !== null && (!Number.isInteger(max) || max < 0))) {
    filterError.textContent = 'Укажите целую цену не ниже нуля.';
    if (min !== null && (!Number.isInteger(min) || min < 0)) minInput.setAttribute('aria-invalid', 'true');
    if (max !== null && (!Number.isInteger(max) || max < 0)) maxInput.setAttribute('aria-invalid', 'true');
    return null;
  }
  if (min !== null && max !== null && min > max) {
    maxInput.setAttribute('aria-invalid', 'true');
    filterError.textContent = 'Максимальная цена должна быть не меньше минимальной.';
    return null;
  }
  return { min, max };
}

function syncFilterMode() {
  const isMobile = mobileFilter.matches;
  filterPanel.setAttribute('aria-modal', String(isMobile));
  filterBackdrop.hidden = !isMobile || filterPanel.hidden;
  document.body.classList.toggle('filter-open', isMobile && !filterPanel.hidden);
}

function openFilter() {
  if (!filterPanel.hidden) return;
  closeSearch(false);
  if (!drawer.hidden) closeDrawer();
  clearTimeout(filterTimer);
  filterPanel.hidden = false;
  filterButton.setAttribute('aria-expanded', 'true');
  syncFilterMode();
  requestAnimationFrame(() => {
    filterPanel.classList.add('is-open');
    filterBackdrop.classList.add('is-open');
  });
  filterClose.focus();
}

function closeFilter(restoreFocus = true) {
  if (filterPanel.hidden) return;
  filterPanel.classList.remove('is-open');
  filterBackdrop.classList.remove('is-open');
  filterButton.setAttribute('aria-expanded', 'false');
  clearTimeout(filterTimer);
  const delay = mobileFilter.matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 200 : 0;
  filterTimer = setTimeout(() => {
    filterPanel.hidden = true;
    filterBackdrop.hidden = true;
    document.body.classList.remove('filter-open');
  }, delay);
  if (restoreFocus) filterButton.focus();
}

function resetFilters() {
  minInput.value = '';
  maxInput.value = '';
  minPrice = null;
  maxPrice = null;
  activeCategory = 'all';
  visibleCount = 12;
  clearFilterError();
  try { history.replaceState(null, '', location.pathname); } catch (_) {}
  renderProducts();
  revealActiveCategory(true);
  closeFilter();
}

categoryButtons.forEach((button) => button.addEventListener('click', () => {
  activeCategory = button.dataset.category;
  visibleCount = 12;
  try {
    const nextUrl = new URL(location.href);
    if (activeCategory === 'all') nextUrl.searchParams.delete('category');
    else nextUrl.searchParams.set('category', activeCategory);
    history.replaceState(null, '', nextUrl);
  } catch (_) {}
  renderProducts();
  revealCategory(button, true);
}));

categoryNav.addEventListener('focusin', (event) => {
  const button = event.target.closest('[data-category]');
  if (button) revealCategory(button);
});

sortSelect.addEventListener('change', renderProducts);
loadMoreButton.addEventListener('click', () => {
  const previousCount = visibleCount;
  visibleCount += 12;
  renderProducts();
  const firstNewCard = shopGrid.children[previousCount];
  if (firstNewCard) firstNewCard.querySelector('[data-product-open]').focus();
});
filterButton.addEventListener('click', () => filterPanel.hidden ? openFilter() : closeFilter());
filterClose.addEventListener('click', () => closeFilter());
filterBackdrop.addEventListener('click', () => closeFilter());
filterForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const range = readPriceRange();
  if (!range) {
    (maxInput.hasAttribute('aria-invalid') ? maxInput : minInput).focus();
    return;
  }
  minPrice = range.min;
  maxPrice = range.max;
  visibleCount = 12;
  renderProducts();
  closeFilter();
});
filterReset.addEventListener('click', resetFilters);
emptyReset.addEventListener('click', resetFilters);
[minInput, maxInput].forEach((input) => input.addEventListener('blur', () => {
  if (minInput.value.trim() || maxInput.value.trim()) readPriceRange();
  else clearFilterError();
}));

document.addEventListener('keydown', (event) => {
  if (filterPanel.hidden) return;
  if (event.key === 'Escape') {
    event.preventDefault();
    closeFilter();
    return;
  }
  if (event.key !== 'Tab' || !mobileFilter.matches) return;
  const focusable = Array.from(filterPanel.querySelectorAll('button, input')).filter((element) => !element.disabled);
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
  if (!mobileFilter.matches && !filterPanel.hidden && !filterPanel.contains(event.target) && !filterButton.contains(event.target)) closeFilter(false);
});
mobileFilter.addEventListener('change', syncFilterMode);
renderProducts();
requestAnimationFrame(() => revealActiveCategory());
if (document.fonts) document.fonts.ready.then(() => revealActiveCategory());
window.addEventListener('resize', () => revealActiveCategory());
