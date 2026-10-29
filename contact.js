const contactForm = document.getElementById('contact-form');
const contactSummary = document.getElementById('contact-form-summary');
const contactStatus = document.getElementById('contact-form-status');
const contactFields = [
  { input: document.getElementById('contact-name'), error: document.getElementById('contact-name-error'), link: document.getElementById('contact-name-link'), empty: 'Укажите имя.' },
  { input: document.getElementById('contact-email'), error: document.getElementById('contact-email-error'), link: document.getElementById('contact-email-link'), empty: 'Укажите электронную почту.' },
  { input: document.getElementById('contact-message'), error: document.getElementById('contact-message-error'), link: document.getElementById('contact-message-link'), empty: 'Напишите сообщение.' }
];
let contactSubmitted = false;

function updateContactSummary() {
  contactSummary.hidden = !contactFields.some((field) => !field.link.hidden);
}

function clearContactError(field) {
  field.input.removeAttribute('aria-invalid');
  field.error.textContent = '';
  field.link.hidden = true;
}

function validateContactField(field) {
  const value = field.input.value.trim();
  let message = '';
  if (!value) message = field.empty;
  else if (field.input.type === 'email' && !field.input.checkValidity()) {
    message = 'Проверьте формат электронной почты и попробуйте снова.';
  }
  field.error.textContent = message;
  field.link.hidden = !message;
  if (message) field.input.setAttribute('aria-invalid', 'true');
  else field.input.removeAttribute('aria-invalid');
  return !message;
}

contactFields.forEach((field) => {
  field.input.addEventListener('blur', () => {
    validateContactField(field);
    if (contactSubmitted) updateContactSummary();
  });
  field.input.addEventListener('input', () => {
    if (contactSubmitted) {
      validateContactField(field);
      updateContactSummary();
    } else {
      clearContactError(field);
    }
    contactStatus.textContent = '';
  });
});

contactForm.addEventListener('submit', (event) => {
  event.preventDefault();
  contactStatus.textContent = '';
  contactSubmitted = true;
  const invalid = contactFields.filter((field) => !validateContactField(field));
  updateContactSummary();
  if (invalid.length) {
    invalid[0].input.focus();
    return;
  }
  contactSubmitted = false;
  contactForm.reset();
  contactFields.forEach(clearContactError);
  contactStatus.textContent = 'Проверка завершена. Форма работает в демонстрационном режиме. Ваше сообщение не было отправлено или сохранено.';
});
