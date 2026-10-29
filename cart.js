const cartApi = window.NeluveCart;
const cartProducts = window.NELUVE_PRODUCTS;
const cartTemplate = document.getElementById('cart-item-template');
const cartList = document.getElementById('cart-items');
const filledCart = document.getElementById('cart-filled');
const emptyCart = document.getElementById('cart-empty');
const summaryCount = document.getElementById('summary-count');
const summarySubtotal = document.getElementById('summary-subtotal');
const summaryTotal = document.getElementById('summary-total');
const cartStatus = document.getElementById('cart-status');
const formatRubles = (amount) => `${amount.toLocaleString('ru-RU')} ₽`;
let cartTotals = { quantity: 0, subtotal: 0 };

function renderCart() {
  const { lines, quantity, subtotal } = cartApi.summary();
  const rows = document.createDocumentFragment();

  lines.forEach(({ product, quantity: itemQuantity, lineTotal }) => {
    const row = cartTemplate.content.firstElementChild.cloneNode(true);
    row.dataset.productId = product.id;
    const productUrl = window.NeluveProductUrl(product.id);
    row.querySelector('.cart-item__media').href = productUrl;
    const image = row.querySelector('.cart-item__image');
    window.NeluveApplyProductImage(image, product);
    const name = row.querySelector('.cart-item__name');
    name.href = productUrl;
    name.textContent = product.name;
    row.querySelector('.cart-item__description').textContent = product.description;
    row.querySelector('.cart-item__volume').textContent = product.volume;
    row.querySelector('.cart-item__unit-price').textContent = `${formatRubles(product.price)} / шт.`;
    row.querySelector('.cart-item__quantity').setAttribute('aria-label', `Количество товара ${product.name}`);
    row.querySelector('[data-cart-action="decrease"]').setAttribute('aria-label', `Уменьшить количество ${product.name}`);
    row.querySelector('[data-cart-action="increase"]').setAttribute('aria-label', `Увеличить количество ${product.name}`);
    row.querySelector('.cart-item__quantity-value').textContent = itemQuantity;
    row.querySelector('[data-cart-action="remove"]').setAttribute('aria-label', `Удалить ${product.name} из корзины`);
    row.querySelector('.cart-item__total').textContent = formatRubles(lineTotal);
    rows.append(row);
  });

  cartList.replaceChildren(rows);
  filledCart.hidden = lines.length === 0;
  emptyCart.hidden = lines.length !== 0;
  summaryCount.textContent = `Товары (${quantity} шт.)`;
  summarySubtotal.textContent = formatRubles(subtotal);
  summaryTotal.textContent = formatRubles(subtotal);
  cartTotals = { quantity, subtotal };
}

function findCartRow(productId) {
  return Array.from(cartList.children).find((row) => row.dataset.productId === productId);
}

cartList.addEventListener('click', (event) => {
  const button = event.target.closest('[data-cart-action]');
  if (!button) return;
  const row = button.closest('[data-product-id]');
  const productId = row.dataset.productId;
  const product = cartProducts.find((entry) => entry.id === productId);
  if (!product) return;

  const action = button.dataset.cartAction;
  const oldQuantity = cartApi.items()[productId] || 0;
  const nextQuantity = action === 'remove' ? 0 : oldQuantity + (action === 'increase' ? 1 : -1);
  const currentIds = Array.from(cartList.children).map((item) => item.dataset.productId);
  const oldIndex = currentIds.indexOf(productId);
  const nearbyId = currentIds[oldIndex + 1] || currentIds[oldIndex - 1];
  if (!cartApi.setQuantity(productId, nextQuantity)) return;

  if (nextQuantity === 0) {
    cartStatus.textContent = `${product.name} удалён из корзины. В корзине ${cartTotals.quantity} шт. Сумма товаров ${formatRubles(cartTotals.subtotal)}.`;
    const nextFocus = nearbyId ? findCartRow(nearbyId)?.querySelector('[data-cart-action="remove"]') : document.getElementById('empty-cart-link');
    nextFocus?.focus();
  } else {
    cartStatus.textContent = `${product.name}: ${nextQuantity} шт. Сумма товаров ${formatRubles(cartTotals.subtotal)}.`;
    findCartRow(productId)?.querySelector(`[data-cart-action="${action}"]`)?.focus();
  }
});

window.addEventListener('neluve:cartchange', renderCart);
renderCart();
