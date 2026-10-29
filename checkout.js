const checkoutCart = window.NeluveCart;
const checkoutLayout = document.getElementById('checkout-layout');
const checkoutEmpty = document.getElementById('checkout-empty');
const checkoutSuccess = document.getElementById('checkout-success');
const checkoutForm = document.getElementById('checkout-form');
const checkoutItems = document.getElementById('checkout-items');
const checkoutItemTemplate = document.getElementById('checkout-item-template');
const checkoutSubtotal = document.getElementById('checkout-subtotal');
const checkoutTotal = document.getElementById('checkout-total');
const checkoutConfirm = document.getElementById('checkout-confirm');
const checkoutErrors = document.getElementById('checkout-error-summary');
const checkoutErrorLinks = document.getElementById('checkout-error-links');
const checkoutStatus = document.getElementById('checkout-status');
const successItems = document.getElementById('checkout-success-items');
const successTotal = document.getElementById('checkout-success-total');
const formatCheckoutRubles = (amount) => `${amount.toLocaleString('ru-RU')} ₽`;

const requiredFields = [
  { id: 'checkout-name', label: 'Имя' },
  { id: 'checkout-email', label: 'Электронная почта' },
  { id: 'checkout-phone', label: 'Телефон' },
  { id: 'checkout-city', label: 'Город' },
  { id: 'checkout-street', label: 'Улица и дом' }
];
let checkoutFinished = false;

function renderCheckout() {
  if (checkoutFinished) return;
  const summary = checkoutCart.summary();
  const hasItems = summary.lines.length > 0;
  checkoutLayout.hidden = !hasItems;
  checkoutEmpty.hidden = hasItems;
  if (!hasItems) return;

  const rows = document.createDocumentFragment();
  summary.lines.forEach(({ product, quantity, lineTotal }) => {
    const row = checkoutItemTemplate.content.firstElementChild.cloneNode(true);
    const image = row.querySelector('.checkout-item__image');
    window.NeluveApplyProductImage(image, product);
    const productUrl = window.NeluveProductUrl(product.id);
    row.querySelector('.checkout-item__media').href = productUrl;
    const name = row.querySelector('.checkout-item__name');
    name.href = productUrl;
    name.textContent = product.name;
    row.querySelector('.checkout-item__quantity').textContent = `Количество: ${quantity} шт.`;
    row.querySelector('.checkout-item__total').textContent = formatCheckoutRubles(lineTotal);
    rows.append(row);
  });
  checkoutItems.replaceChildren(rows);
  checkoutSubtotal.textContent = formatCheckoutRubles(summary.subtotal);
  checkoutTotal.textContent = formatCheckoutRubles(summary.subtotal);
}

function fieldError(input) {
  const value = input.value.trim();
  if (!value) return 'Заполните это поле.';
  if (input.id === 'checkout-email' && !input.checkValidity()) {
    return 'Введите адрес электронной почты в формате name@example.com.';
  }
  if (input.id === 'checkout-phone') {
    const digits = value.replace(/\D/g, '');
    if (!/^\+?[\d\s().-]+$/.test(value) || digits.length < 7 || digits.length > 15) {
      return 'Введите телефон с 7–15 цифрами; можно использовать +, пробелы и скобки.';
    }
  }
  return '';
}

function validateField(input) {
  const error = fieldError(input);
  document.getElementById(`${input.id}-error`).textContent = error;
  if (error) input.setAttribute('aria-invalid', 'true');
  else input.removeAttribute('aria-invalid');
  return !error;
}

function updateErrorSummary(invalid) {
  const links = document.createDocumentFragment();
  invalid.forEach(({ id, label }) => {
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = `#${id}`;
    link.textContent = label;
    item.append(link);
    links.append(item);
  });
  checkoutErrorLinks.replaceChildren(links);
  checkoutErrors.hidden = invalid.length === 0;
  checkoutStatus.textContent = invalid.length
    ? `Проверьте обязательные поля: ${invalid.map(({ label }) => label).join(', ')}.`
    : '';
}

requiredFields.forEach(({ id }) => {
  document.getElementById(id).addEventListener('blur', (event) => {
    validateField(event.currentTarget);
    if (!checkoutErrors.hidden) {
      const invalid = requiredFields.filter(({ id: fieldId }) =>
        document.getElementById(fieldId).getAttribute('aria-invalid') === 'true');
      updateErrorSummary(invalid);
    }
  });
});

checkoutForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (checkoutFinished) return;
  const summary = checkoutCart.summary();
  if (!summary.lines.length) {
    renderCheckout();
    document.getElementById('checkout-empty-title').focus();
    return;
  }

  const invalid = requiredFields.filter(({ id }) => !validateField(document.getElementById(id)));
  if (invalid.length) {
    updateErrorSummary(invalid);
    document.getElementById(invalid[0].id).focus();
    return;
  }

  checkoutFinished = true;
  checkoutConfirm.disabled = true;
  checkoutErrors.hidden = true;
  checkoutStatus.textContent = '';
  const lines = document.createDocumentFragment();
  summary.lines.forEach(({ product, quantity, lineTotal }) => {
    const item = document.createElement('li');
    item.className = 'checkout-success__item';
    const name = document.createElement('span');
    name.textContent = `${product.name} × ${quantity}`;
    const total = document.createElement('span');
    total.textContent = formatCheckoutRubles(lineTotal);
    item.append(name, total);
    lines.append(item);
  });
  successItems.replaceChildren(lines);
  successTotal.textContent = formatCheckoutRubles(summary.subtotal);

  checkoutForm.reset();
  checkoutCart.clear();
  checkoutLayout.hidden = true;
  checkoutEmpty.hidden = true;
  checkoutSuccess.hidden = false;
  document.getElementById('checkout-success-title').focus();
});

window.addEventListener('neluve:cartchange', renderCheckout);
window.addEventListener('pageshow', renderCheckout);
renderCheckout();
