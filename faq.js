const faqTriggers = [...document.querySelectorAll('.faq-trigger')];

faqTriggers.forEach((trigger) => {
  trigger.addEventListener('click', () => {
    const panel = document.getElementById(trigger.getAttribute('aria-controls'));
    const opening = trigger.getAttribute('aria-expanded') !== 'true';

    faqTriggers.forEach((otherTrigger) => {
      otherTrigger.setAttribute('aria-expanded', 'false');
      document.getElementById(otherTrigger.getAttribute('aria-controls')).hidden = true;
    });

    if (opening) {
      trigger.setAttribute('aria-expanded', 'true');
      panel.hidden = false;
    }
  });
});
