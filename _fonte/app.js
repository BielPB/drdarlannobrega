/* Dr. Darlan Gomes Nóbrega — comportamento da página */
(function () {
  'use strict';

  /* ── Configuração (único lugar para editar) ── */
  var SITE = {
    whatsapp: '5583981353360',      // número com DDI + DDD
    ga4: '',                        // ex.: 'G-XXXXXXXXXX'
    metaPixel: '',                  // ex.: '1234567890'
    gtm: ''                         // ex.: 'GTM-XXXXXXX' (use GTM ou GA4/Pixel direto)
  };

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp01 = function (v) { return Math.max(0, Math.min(1, v)); };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canHover = window.matchMedia('(hover: hover)').matches;
  var store = {
    get: function (k, s) { try { return (s ? sessionStorage : localStorage).getItem(k); } catch (e) { return null; } },
    set: function (k, v, s) { try { (s ? sessionStorage : localStorage).setItem(k, v); } catch (e) {} }
  };

  /* ── Medição: dataLayer sempre; gtag/fbq só existem depois do consentimento ── */
  window.dataLayer = window.dataLayer || [];
  function track(name, params) {
    params = params || {};
    window.dataLayer.push(Object.assign({ event: name }, params));
    if (typeof window.gtag === 'function') window.gtag('event', name, params);
    if (typeof window.fbq === 'function') window.fbq(name === 'whatsapp_click' ? 'track' : 'trackCustom', name === 'whatsapp_click' ? 'Contact' : name, params);
  }

  var year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  /* ── Origem do visitante (vai junto na mensagem do WhatsApp) ── */
  function origin() {
    var k = 'site_origin', v = store.get(k, true);
    if (v) return v;
    var q = new URLSearchParams(location.search), ref = '';
    try { ref = document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, '') : ''; } catch (e) {}
    var parts = [q.get('utm_source') || ref || 'acesso direto'];
    if (q.get('utm_medium')) parts.push(q.get('utm_medium'));
    v = parts.join(' / ');
    store.set(k, v, true);
    return v;
  }
  function withOrigin(text) { return text.replace(/\s*\(origem:[^)]*\)\s*$/, '') + ' (origem: ' + origin() + ')'; }
  function waLink(text) { return 'https://wa.me/' + SITE.whatsapp + '?text=' + encodeURIComponent(withOrigin(text)); }

  /* Todos os links de WhatsApp usam o número do SITE e levam a origem */
  $$('a[href*="wa.me/"]').forEach(function (a) {
    var u;
    try { u = new URL(a.href); } catch (e) { return; }
    var text = u.searchParams.get('text') || 'Olá, gostaria de agendar uma consulta com o Dr. Darlan.';
    a.href = waLink(text);
  });

  /* ── Título do hero: revela palavra por palavra ── */
  (function () {
    var h1 = $('.hero__title');
    if (!h1 || reduceMotion) return;
    var i = 0;
    (function wrap(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            var w = document.createElement('span');
            w.className = 'w'; w.style.setProperty('--i', i++); w.textContent = part;
            frag.appendChild(w);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1) { wrap(n); }
      });
    })(h1);
  })();

  /* ── Rótulo que acompanha o cursor (Arraste / Assistir) ── */
  (function () {
    if (!canHover) return;
    var tag = document.createElement('div');
    tag.className = 'cursor-tag'; tag.setAttribute('aria-hidden', 'true');
    document.body.appendChild(tag);
    $$('[data-cursor]').forEach(function (el) {
      el.addEventListener('pointerenter', function () {
        if (el.classList.contains('is-playing')) return;
        tag.textContent = el.getAttribute('data-cursor'); tag.classList.add('is-on');
      });
      el.addEventListener('pointermove', function (e) {
        tag.style.left = e.clientX + 'px'; tag.style.top = (e.clientY + 34) + 'px';
        if (el.classList.contains('is-playing')) tag.classList.remove('is-on');
      });
      el.addEventListener('pointerleave', function () { tag.classList.remove('is-on'); });
      el.addEventListener('pointerdown', function () { tag.classList.remove('is-on'); });
    });
  })();

  /* ── Frase que alterna no hero (leitor de tela lê a versão estática) ── */
  (function () {
    var box = $('#rotate');
    if (!box || reduceMotion) return;
    var items = $$('span', box);
    if (items.length < 2) return;
    var i = 0;
    box.classList.add('is-live'); items[0].classList.add('is-on');
    setInterval(function () {
      items[i].classList.remove('is-on');
      i = (i + 1) % items.length;
      items[i].classList.add('is-on');
    }, 2800);
  })();

  /* ── Termos com explicação (hover, foco e toque) ── */
  (function () {
    var terms = $$('.term');
    if (!terms.length) return;
    var tip = document.createElement('div');
    tip.className = 'tip'; tip.id = 'tip'; tip.setAttribute('role', 'tooltip');
    document.body.appendChild(tip);
    var cur = null;
    function show(t) {
      if (cur && cur !== t) cur.setAttribute('aria-expanded', 'false');
      cur = t; tip.textContent = t.getAttribute('data-tip'); tip.classList.add('is-on');
      t.setAttribute('aria-describedby', 'tip'); t.setAttribute('aria-expanded', 'true');
      var r = t.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight;
      tip.style.left = Math.max(12, Math.min(window.innerWidth - w - 12, r.left + r.width / 2 - w / 2)) + 'px';
      var y = r.top - h - 10; if (y < 8) y = r.bottom + 10;
      tip.style.top = y + 'px';
      track('termo_explicado', { termo: t.textContent });
    }
    function hide() { if (cur) { cur.removeAttribute('aria-describedby'); cur.setAttribute('aria-expanded', 'false'); cur = null; } tip.classList.remove('is-on'); }
    terms.forEach(function (t) {
      t.setAttribute('aria-expanded', 'false');
      t.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') show(t); });
      t.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') hide(); });
      t.addEventListener('focus', function () { show(t); });
      t.addEventListener('blur', hide);
      t.addEventListener('click', function () { show(t); });
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') hide(); });
    document.addEventListener('click', function (e) { if (!e.target.closest('.term')) hide(); });
    window.addEventListener('scroll', hide, { passive: true });
  })();

  /* ── Imagens: entrada suave quando terminam de carregar ── */
  $$('img[loading="lazy"]').forEach(function (img) {
    var done = function () { img.classList.add('is-loaded'); };
    if (img.complete && img.naturalWidth) done(); else { img.addEventListener('load', done); img.addEventListener('error', done); }
  });

  /* ── Checklist: mensagem do WhatsApp com o que a pessoa marcou (lembra na sessão) ── */
  (function () {
    var grid = $('#checkGrid'), cta = $('#checkCta'), label = $('#checkCtaLabel'), count = $('#checkCount');
    if (!grid || !cta) return;
    var base = 'Olá, gostaria de agendar uma consulta com o Dr. Darlan.';
    function update(fromUser) {
      var picked = $$('input:checked', grid).map(function (i) { return i.value; });
      var msg = base;
      if (picked.length) {
        var list = picked.length > 1 ? picked.slice(0, -1).join(', ') + ' e ' + picked.slice(-1) : picked[0];
        msg += ' Estou buscando ajuda com: ' + list + '.';
      }
      cta.href = waLink(msg);
      label.textContent = picked.length ? 'Falar com o Dr. Darlan sobre isso' : 'Agendar minha consulta';
      count.textContent = picked.length
        ? picked.length + (picked.length === 1 ? ' item selecionado.' : ' itens selecionados.') + ' A mensagem já vai pronta no WhatsApp.'
        : 'Nenhum item selecionado. Você também pode falar direto com o Dr. Darlan.';
      store.set('checklist', JSON.stringify(picked), true);
      if (fromUser) track('checklist_selecao', { itens: picked.length });
    }
    try {
      var saved = JSON.parse(store.get('checklist', true) || '[]');
      $$('input', grid).forEach(function (i) { if (saved.indexOf(i.value) > -1) i.checked = true; });
      if (saved.length) update(false);
    } catch (e) {}
    grid.addEventListener('change', function () { update(true); });
  })();

  /* ── Comparador antes/depois ── */
  $$('.compare').forEach(function (box) {
    var range = $('.compare__range', box), used = false;
    var set = function () {
      var v = Number(range.value);
      box.style.setProperty('--pos', v + '%');
      range.setAttribute('aria-valuetext', v + '% antes, ' + (100 - v) + '% depois');
    };
    range.addEventListener('input', function () { set(); if (!used) { used = true; track('antes_depois_interacao', { caso: box.getAttribute('data-name') }); } });
    set();
  });

  /* ── FAQ (um item aberto por vez) ── */
  $$('.faq-q').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      $$('.faq-q').forEach(function (b) {
        b.setAttribute('aria-expanded', 'false');
        b.closest('.faq-item').classList.remove('is-open');
      });
      if (!open) {
        btn.setAttribute('aria-expanded', 'true'); btn.closest('.faq-item').classList.add('is-open');
        track('faq_aberto', { pergunta: btn.textContent.trim().slice(0, 80) });
      }
    });
  });

  /* ── Revelar ao rolar ── */
  var reveals = $$('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  } else { reveals.forEach(function (el) { el.classList.add('visible'); }); }

  /* ── Efeitos ligados à rolagem: só calculam quando a seção está na tela ── */
  var expandSec = $('#apresentacao'), timeline = $('#timeline'), stage = $('.hero__stage'), heroEl = $('#inicio');
  var vis = { expand: true, timeline: true, hero: true };
  if (expandSec && !reduceMotion) { expandSec.classList.add('expand--live'); expandSec.style.setProperty('--p', 0); }
  function scrollFx() {
    var vh = window.innerHeight, r;
    if (vis.expand && expandSec && expandSec.classList.contains('expand--live')) {
      r = expandSec.getBoundingClientRect();
      expandSec.style.setProperty('--p', clamp01(-r.top / ((r.height - vh) * 0.65)).toFixed(3));
    }
    if (vis.timeline && timeline) {
      r = timeline.getBoundingClientRect();
      var line = vh * 0.62;
      timeline.style.setProperty('--tp', clamp01((line - r.top - 26) / (r.height - 52)).toFixed(3));
      $$('.tl-item', timeline).forEach(function (li) {
        var n = $('.tl-node', li).getBoundingClientRect();
        li.classList.toggle('is-on', n.top + n.height / 2 < line);
      });
    }
    if (vis.hero && stage && !reduceMotion) stage.style.setProperty('--par', clamp01(window.scrollY / 600).toFixed(3));
  }
  if ('IntersectionObserver' in window) {
    [['expand', expandSec], ['timeline', timeline], ['hero', heroEl]].forEach(function (p) {
      if (!p[1]) return;
      new IntersectionObserver(function (e) { vis[p[0]] = e[0].isIntersecting; scrollFx(); }, { rootMargin: '120px 0px' }).observe(p[1]);
    });
  }
  window.addEventListener('resize', scrollFx);

  /* ── Vídeo de apresentação (versão leve em celular/economia de dados) ── */
  (function () {
    var card = $('#expandCard'), video = $('#expandVideo'), btn = $('#expandPlay');
    if (!card || !video || !btn) return;
    var quartiles = {};
    btn.addEventListener('click', function () {
      if (!video.getAttribute('src')) {
        var conn = navigator.connection || {};
        var small = window.matchMedia('(max-width: 680px)').matches || conn.saveData;
        video.setAttribute('src', (small && video.dataset.srcSm) || video.dataset.src);
      }
      card.classList.add('is-playing');
      video.play().catch(function () {});
      track('video_play');
    });
    video.addEventListener('timeupdate', function () {
      if (!video.duration) return;
      var p = Math.floor(video.currentTime / video.duration * 4) * 25;
      if (p >= 25 && !quartiles[p]) { quartiles[p] = 1; track('video_progresso', { percentual: p }); }
    });
    video.addEventListener('ended', function () { track('video_progresso', { percentual: 100 }); });
  })();

  /* ── Mapa: o Google Maps só carrega quando a pessoa pede ── */
  (function () {
    var box = $('#mapBox'), btn = $('#mapLoad');
    if (!box || !btn) return;
    btn.addEventListener('click', function () {
      var f = document.createElement('iframe');
      f.title = box.getAttribute('data-title'); f.src = box.getAttribute('data-src');
      f.referrerPolicy = 'no-referrer-when-downgrade'; f.loading = 'lazy';
      box.replaceChildren(f);
      track('mapa_carregado');
    });
  })();

  /* ── Header, progresso, link ativo, profundidade de rolagem, barra/FAB ── */
  (function () {
    var header = $('#header'), announce = $('#announce'), bar = $('#progressBar');
    var sticky = $('#stickyCta'), fab = $('#fab'), final = $('#agendar');
    var ticking = false, depth = {};
    function onScroll() {
      var y = window.scrollY;
      header.classList.toggle('is-scrolled', y > 24);
      announce.classList.toggle('is-hidden', y > 24);
      scrollFx();
      var max = document.documentElement.scrollHeight - window.innerHeight, pct = max > 0 ? Math.min(1, y / max) : 0;
      bar.style.transform = 'scaleX(' + pct + ')';
      [25, 50, 75, 100].forEach(function (m) { if (pct * 100 >= m - 1 && !depth[m]) { depth[m] = 1; track('rolagem', { percentual: m }); } });
      ticking = false;
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
    onScroll();
    if (!('IntersectionObserver' in window)) return;
    var pastHero = false, atFinal = false;
    var sync = function () { var show = pastHero && !atFinal; sticky.classList.toggle('is-visible', show); fab.classList.toggle('is-visible', show); };
    new IntersectionObserver(function (e) { pastHero = !e[0].isIntersecting; sync(); }).observe(heroEl);
    new IntersectionObserver(function (e) { atFinal = e[0].isIntersecting; sync(); }).observe(final);
    var links = $$('.header__nav a'), map = {};
    links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var a = map[e.target.id];
        if (a && e.isIntersecting) {
          links.forEach(function (l) { l.classList.remove('is-active'); l.removeAttribute('aria-current'); });
          a.classList.add('is-active'); a.setAttribute('aria-current', 'true');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(function (id) { var s = document.getElementById(id); if (s) spy.observe(s); });
  })();

  /* ── Ligações ── */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[data-cta-call]');
    if (a) track('ligacao_click', { cta_location: a.dataset.ctaCall });
  });

  /* ── Cliques em WhatsApp: estado "abrindo" + evento de conversão ── */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[data-cta]');
    if (!a) return;
    track('whatsapp_click', { cta_location: a.dataset.cta });
    if (a.classList.contains('btn') && /wa\.me/.test(a.href)) {
      a.classList.add('is-loading');
      setTimeout(function () { a.classList.remove('is-loading'); }, 1400);
    }
  });

  /* ── Consentimento (LGPD) e carregamento do GA4 / Pixel / GTM ──
        Nada é carregado sem aceite. Se nenhum ID estiver preenchido em SITE, o aviso nem aparece. */
  (function () {
    var hasIds = SITE.ga4 || SITE.metaPixel || SITE.gtm;
    if (!hasIds) return;
    function load() {
      if (window.__analytics) return;
      window.__analytics = true;
      function script(src) { var s = document.createElement('script'); s.async = true; s.src = src; document.head.appendChild(s); }
      if (SITE.gtm) {
        window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
        script('https://www.googletagmanager.com/gtm.js?id=' + SITE.gtm);
      }
      if (SITE.ga4) {
        script('https://www.googletagmanager.com/gtag/js?id=' + SITE.ga4);
        window.gtag = function () { window.dataLayer.push(arguments); };
        window.gtag('js', new Date()); window.gtag('config', SITE.ga4);
      }
      if (SITE.metaPixel) {
        var n = window.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
        n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
        script('https://connect.facebook.net/en_US/fbevents.js');
        window.fbq('init', SITE.metaPixel); window.fbq('track', 'PageView');
      }
    }
    var choice = store.get('consent');
    if (choice === 'granted') { load(); return; }
    if (choice === 'denied') return;
    var box = document.createElement('div');
    box.className = 'consent'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Aviso de cookies');
    box.innerHTML = '<p>Usamos cookies de medição para entender como o site é usado e melhorar o atendimento. Você escolhe. Saiba mais na <a href="privacidade.html">política de privacidade</a>.</p>' +
      '<div class="consent__actions"><button type="button" class="btn btn--primary" data-c="granted">Aceitar</button><button type="button" class="btn btn--ghost" data-c="denied">Recusar</button></div>';
    box.addEventListener('click', function (e) {
      var b = e.target.closest('[data-c]');
      if (!b) return;
      store.set('consent', b.getAttribute('data-c'));
      box.remove();
      if (b.getAttribute('data-c') === 'granted') load();
    });
    document.body.appendChild(box);
  })();
})();
