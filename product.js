(function () {
  const products = window.NELUVE_PRODUCTS;
  const requestedId = new URLSearchParams(location.search).get('id');
  const product = products.find((item) => item.id === requestedId);
  const breadcrumbCategory = document.getElementById('breadcrumb-category');
  const breadcrumbCurrent = document.getElementById('breadcrumb-current');

  if (!product) {
    document.title = 'Товар не найден — NÉLUVÉ';
    breadcrumbCategory.hidden = true;
    document.getElementById('breadcrumb-category-separator').hidden = true;
    breadcrumbCurrent.textContent = 'Товар не найден';
    ['.product-layout', '.product-details', '.product-related'].forEach((selector) => {
      document.querySelector(selector).style.display = 'none';
    });
    document.getElementById('product-not-found').hidden = false;
    return;
  }

  const categoryNames = {
    cleansing: 'Очищение',
    serums: 'Сыворотки',
    creams: 'Кремы',
    body: 'Уход за телом'
  };
  const categoryName = categoryNames[product.category];
  const price = `${product.price.toLocaleString('ru-RU')} ₽`;
  document.title = `${product.name} — NÉLUVÉ`;
  breadcrumbCategory.href = `shop.html?category=${encodeURIComponent(product.category)}`;
  breadcrumbCategory.textContent = categoryName;
  breadcrumbCurrent.textContent = product.name;
  document.querySelector('.product-layout').dataset.productId = product.id;
  document.querySelector('.product-gallery').setAttribute('aria-label', `Галерея ${product.name}`);
  const galleryImages = [product, ...(product.galleryImages || [])];
  const galleryStage = document.querySelector('.product-gallery__stage');
  const galleryThumbs = document.querySelector('.product-gallery__thumbs');
  const firstSlide = galleryStage.querySelector('.product-gallery__slide');
  const firstThumb = galleryThumbs.querySelector('.product-gallery__thumb');
  galleryImages.forEach((item, index) => {
    const slide = index === 0 ? firstSlide : firstSlide.cloneNode(true);
    const image = slide.querySelector('.product-gallery__image');
    window.NeluveApplyProductImage(image, item);
    if (index > 0) {
      image.loading = 'lazy';
      image.removeAttribute('fetchpriority');
      slide.hidden = true;
      galleryStage.append(slide);
    }

    const thumb = index === 0 ? firstThumb : firstThumb.cloneNode(true);
    const thumbImage = thumb.querySelector('img');
    window.NeluveApplyProductImage(thumbImage, item);
    thumbImage.alt = '';
    thumb.dataset.galleryIndex = String(index);
    thumb.setAttribute('aria-label', index === 0 ? `Показать основное фото ${product.name}` : `Показать ${item.label} ${product.name}`);
    thumb.setAttribute('aria-pressed', String(index === 0));
    if (index > 0) galleryThumbs.append(thumb);
  });
  document.querySelector('.product-info__category').textContent = categoryName.toLocaleUpperCase('ru-RU');
  document.getElementById('product-title').textContent = product.name;
  document.querySelector('.product-info__subtitle').textContent = product.description;
  const priceElement = document.querySelector('.product-info__price');
  priceElement.textContent = price;
  priceElement.dataset.productPrice = String(product.price);
  document.querySelector('.product-info__volume').textContent = `Объём: ${product.volume}`;
  document.querySelector('.product-info__summary').textContent = `${product.name} — ${product.description.toLowerCase()}. Объём: ${product.volume}.`;
  document.querySelector('.product-details__eyebrow').textContent = product.name.toLocaleUpperCase('ru-RU');
  document.querySelector('.product-details__item .product-details__body p').textContent = `${product.name} — ${product.description.toLowerCase()} NÉLUVÉ. Объём: ${product.volume}.`;

  const slides = Array.from(document.querySelectorAll('.product-gallery__slide'));
  const thumbnails = Array.from(document.querySelectorAll('[data-gallery-index]'));
  const counter = document.getElementById('gallery-counter');
  const galleryStatus = document.getElementById('gallery-status');
  const galleryPrev = document.getElementById('gallery-prev');
  const galleryNext = document.getElementById('gallery-next');
  let selectedImage = 0;

  function selectImage(index) {
    selectedImage = (index + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => { slide.hidden = slideIndex !== selectedImage; });
    thumbnails.forEach((button, buttonIndex) => {
      button.setAttribute('aria-pressed', String(buttonIndex === selectedImage));
    });
    counter.textContent = `${String(selectedImage + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
    galleryStatus.textContent = selectedImage === 0
      ? `Показано основное фото ${product.name}.`
      : `Показано ${galleryImages[selectedImage].label} ${product.name}.`;
    galleryPrev.disabled = slides.length < 2;
    galleryNext.disabled = slides.length < 2;
  }

  thumbnails.forEach((button) => {
    button.addEventListener('click', () => selectImage(Number(button.dataset.galleryIndex)));
  });
  galleryPrev.addEventListener('click', () => selectImage(selectedImage - 1));
  galleryNext.addEventListener('click', () => selectImage(selectedImage + 1));
  selectImage(0);

  const quantityValue = document.getElementById('product-quantity');
  const quantityMinus = document.getElementById('quantity-minus');
  const quantityPlus = document.getElementById('quantity-plus');
  const purchaseFeedback = document.getElementById('product-purchase-feedback');
  let quantity = 1;

  function updateQuantity(next) {
    quantity = Math.max(1, Math.min(99, next));
    quantityValue.value = String(quantity);
    quantityValue.textContent = String(quantity);
    quantityMinus.disabled = quantity === 1;
    quantityPlus.disabled = quantity === 99;
    purchaseFeedback.textContent = '';
  }

  quantityMinus.addEventListener('click', () => updateQuantity(quantity - 1));
  quantityPlus.addEventListener('click', () => updateQuantity(quantity + 1));
  document.getElementById('product-purchase-form').addEventListener('submit', (event) => {
    event.preventDefault();
    if (window.NeluveCart.add(product.id, quantity)) {
      purchaseFeedback.textContent = `${product.name}: добавлено ${quantity} шт. В корзине ${window.NeluveCart.count()} шт.`;
    }
  });

  const relatedFeedback = document.getElementById('related-feedback');
  const relatedProducts = products.filter((item) => item.featured && item.id !== product.id).slice(0, 3);
  document.querySelectorAll('.product-related__grid .product-card').forEach((card, index) => {
    const related = relatedProducts[index];
    card.dataset.productId = related.id;
    card.dataset.productName = related.name;
    const image = card.querySelector('.product-card__image');
    window.NeluveApplyProductImage(image, related);
    card.querySelector('.shop-product__name-button').textContent = related.name;
    card.querySelector('.product-card__description').textContent = related.description;
    card.querySelector('.product-card__volume').textContent = related.volume;
    card.querySelector('.product-card__price').textContent = `${related.price.toLocaleString('ru-RU')} ₽`;
    card.querySelectorAll('[data-related-open]').forEach((link) => {
      link.href = window.NeluveProductUrl(related.id);
      link.setAttribute('aria-label', `Открыть ${related.name}`);
    });
    const addButton = card.querySelector('[data-related-add]');
    addButton.setAttribute('aria-label', `Добавить ${related.name} в корзину`);
    addButton.addEventListener('click', () => {
      if (window.NeluveCart.add(related.id, 1, addButton)) {
        relatedFeedback.textContent = `${related.name} добавлен в корзину. В корзине ${window.NeluveCart.count()} шт.`;
      }
    });
  });
})();
