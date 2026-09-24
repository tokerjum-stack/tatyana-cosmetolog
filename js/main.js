/* ==========================================================================
   Татьяна Викторовна — косметолог, Внуково
   Меню, маска телефона, форма заявки, просмотр документов.
   Без зависимостей. Сайт работает и при отключённом JavaScript.
   ========================================================================== */
(function () {
  'use strict';

  var PHONE = '+7 (933) 710-53-07';
  var PHONE_RAW = '79337105307';

  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }

  /* ------------------------------------------------------------------------
     1. МОБИЛЬНОЕ МЕНЮ
     ------------------------------------------------------------------------ */
  function initNav() {
    var burger = $('.burger');
    var nav = $('#site-nav');
    if (!burger || !nav) return;

    function setOpen(open) {
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
      nav.classList.toggle('is-open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    }

    burger.addEventListener('click', function () {
      setOpen(burger.getAttribute('aria-expanded') !== 'true');
    });

    $$('a', nav).forEach(function (a) {
      a.addEventListener('click', function () { setOpen(false); });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        setOpen(false);
        burger.focus();
      }
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 768 && nav.classList.contains('is-open')) setOpen(false);
    });
  }

  /* ------------------------------------------------------------------------
     2. ХЕДЕР ПРИ СКРОЛЛЕ
     ------------------------------------------------------------------------ */
  function initHeader() {
    var header = $('.header');
    if (!header) return;
    function onScroll() { header.classList.toggle('is-scrolled', window.scrollY > 8); }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ------------------------------------------------------------------------
     3. ПОЯВЛЕНИЕ БЛОКОВ
     ------------------------------------------------------------------------ */
  function initReveal() {
    var items = $$('.reveal');
    if (!items.length) return;
    if (!('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -60px 0px', threshold: .08 });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ------------------------------------------------------------------------
     4. МАСКА ТЕЛЕФОНА
     ------------------------------------------------------------------------ */
  function initPhoneMask() {
    $$('input[type="tel"]').forEach(function (input) {
      input.addEventListener('input', function () {
        var d = input.value.replace(/\D/g, '');
        if (d[0] === '8') d = '7' + d.slice(1);
        if (d[0] !== '7') d = '7' + d;
        d = d.slice(0, 11);

        var out = '+7';
        if (d.length > 1) out += ' (' + d.slice(1, 4);
        if (d.length >= 5) out += ') ' + d.slice(4, 7);
        if (d.length >= 8) out += '-' + d.slice(7, 9);
        if (d.length >= 10) out += '-' + d.slice(9, 11);
        input.value = out;
      });
      input.addEventListener('blur', function () {
        if (input.value.replace(/\D/g, '').length <= 1) input.value = '';
      });
    });
  }

  /* ------------------------------------------------------------------------
     5. ФОРМА ЗАЯВКИ
     Данные никуда не отправляются: текст собирается в браузере,
     копируется в буфер и открывается WhatsApp с готовым сообщением.
     ------------------------------------------------------------------------ */
  function initForm() {
    var form = $('#booking-form');
    if (!form) return;

    var resultBox = $('#form-result');
    var resultText = $('#result-text');
    var copyAgain = $('#copy-again');

    function fieldEl(input) {
      return input.closest('.field');
    }

    function markBad(input, bad) {
      var f = fieldEl(input);
      if (f) f.classList.toggle('bad', bad);
    }

    $$('input, select, textarea', form).forEach(function (el) {
      var ev = el.tagName === 'SELECT' ? 'change' : 'input';
      el.addEventListener(ev, function () { markBad(el, false); });
    });

    function validate() {
      var ok = true;
      var name = $('#field-name');
      var phone = $('#field-phone');
      var consent = $('#field-consent');

      if (name.value.trim().length < 2) { markBad(name, true); ok = false; }
      if (phone.value.replace(/\D/g, '').length !== 11) { markBad(phone, true); ok = false; }
      if (!consent.checked) {
        var cf = fieldEl(consent) || consent.closest('.field');
        if (cf) cf.classList.add('bad');
        ok = false;
      }

      if (!ok) {
        var firstBad = $('.field.bad input, .field.bad select');
        if (firstBad) {
          firstBad.focus();
          firstBad.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
      }
      return ok;
    }

    function buildMessage() {
      var name = $('#field-name').value.trim();
      var phone = $('#field-phone').value.trim();
      var time = $('#field-time').value;
      var comment = $('#field-comment').value.trim();

      var lines = ['Здравствуйте, Татьяна Викторовна!', ''];
      lines.push('Меня зовут ' + name + '.');
      lines.push('Хочу записаться на массаж лица «Архитектура лица».');
      lines.push('Мой телефон: ' + phone + '.');
      if (time) lines.push('Удобное время: ' + time + '.');
      if (comment) lines.push('', comment);
      lines.push('', 'Сообщение отправлено с сайта.');
      return lines.join('\n');
    }

    function copyText(text) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(function () { fallbackCopy(text); });
      } else {
        fallbackCopy(text);
      }
      function fallbackCopy(t) {
        resultText.removeAttribute('readonly');
        resultText.select();
        try { document.execCommand('copy'); } catch (e) { /* пользователь скопирует вручную */ }
        resultText.setAttribute('readonly', 'readonly');
      }
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate()) return;

      var text = buildMessage();
      resultText.value = text;
      resultBox.hidden = false;
      copyText(text);

      resultBox.scrollIntoView({ block: 'center', behavior: 'smooth' });

      // Цель Яндекс.Метрики, если счётчик подключён
      if (typeof window.ym === 'function' && window.__YM_ID) {
        try { window.ym(window.__YM_ID, 'reachGoal', 'form_send'); } catch (err) { /* noop */ }
      }
    });

    // Кнопка «Скопировать ещё раз»
    if (copyAgain) {
      copyAgain.addEventListener('click', function () {
        copyText(resultText.value, copyAgain);
      });
    }
  }

  /* ------------------------------------------------------------------------
     6. ПРОСМОТР ДОКУМЕНТОВ
     ------------------------------------------------------------------------ */
  function initLightbox() {
    var box = $('#lightbox');
    if (!box) return;
    var img = $('img', box);
    var items = $$('.gallery__item[data-img]');
    if (!items.length) return;

    var lastFocused = null;

    function open(src, alt) {
      lastFocused = document.activeElement;
      img.src = src;
      img.alt = alt || 'Документ';
      box.classList.add('is-open');
      $('.lightbox__close', box).focus();
      document.body.style.overflow = 'hidden';
    }

    function close() {
      box.classList.remove('is-open');
      img.src = '';
      document.body.style.overflow = '';
      if (lastFocused) lastFocused.focus();
    }

    items.forEach(function (item) {
      var src = item.getAttribute('data-img');
      var caption = $('figcaption', item);
      var title = caption ? caption.textContent.trim() : '';

      item.addEventListener('click', function () { open(src, title); });
      item.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open(src, title);
        }
      });
    });

    $('.lightbox__close', box).addEventListener('click', close);
    box.addEventListener('click', function (e) { if (e.target === box) close(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && box.classList.contains('is-open')) close();
    });
  }

  /* ------------------------------------------------------------------------
     7. ГОД В ПОДВАЛЕ
     ------------------------------------------------------------------------ */
  function initYear() {
    $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
  }

  /* ------------------------------------------------------------------------
     ИНИЦИАЛИЗАЦИЯ
     ------------------------------------------------------------------------ */
  function init() {
    initNav();
    initHeader();
    initReveal();
    initPhoneMask();
    initForm();
    initLightbox();
    initYear();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
