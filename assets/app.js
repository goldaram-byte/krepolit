/* ================= КРЕПОЛИТ — общий скрипт сайта ================= */

/* ---- Данные каталога ---- */
const K = window.KATALOG || {groups:[],subs:[],products:[]};
const GROUPS = K.groups;                 // [{id,name,icon}]
const SUBS   = K.subs;                    // [{id,g,name}]
const GNAME  = Object.fromEntries(GROUPS.map(g=>[g.id,g.name]));
const GICON  = Object.fromEntries(GROUPS.map(g=>[g.id,g.icon]));
const SNAME  = Object.fromEntries(SUBS.map(s=>[s.id,s.name]));
const SBYID  = Object.fromEntries(SUBS.map(s=>[s.id,s]));
const SUBSBYG = {}; SUBS.forEach(s=>{ (SUBSBYG[s.g]=SUBSBYG[s.g]||[]).push(s); });
const P = K.products.map(a=>({id:a[0],g:a[1],s:a[2],cat:a[1],name:a[3],art:a[4],unit:a[5],price:a[6],w:a[7],img:a[8]||'',desc:'',tag:'',old:null}));
// маленький хелпер: фото товара с запасным SVG-значком, если файла нет
function pimgHtml(p, iconSize){ return p.img ? `<img class="pimg-photo" src="images/${p.img}" alt="${(p.name||'').replace(/"/g,'')}" loading="lazy" onerror="this.remove()">` : ''; }
const GCOUNT={}, SCOUNT={};
P.forEach(p=>{ GCOUNT[p.g]=(GCOUNT[p.g]||0)+1; if(p.s) SCOUNT[p.s]=(SCOUNT[p.s]||0)+1; });
P.forEach(p=>{ p.desc = SNAME[p.s] || GNAME[p.g] || ''; });
// алиасы для совместимости со страницами
const CATS  = GROUPS.map(g=>({id:g.id,name:g.name,icon:g.icon,sub:(GCOUNT[g.id]||0)+' позиций'}));
const CICON = GICON;
const CNAME = GNAME;
const CSUB  = Object.fromEntries(CATS.map(c=>[c.id,c.sub]));
const PBYID = Object.fromEntries(P.map(p=>[p.id,p]));

/* ---- Утилиты ---- */
const fmt = n => n.toLocaleString('ru-RU',{minimumFractionDigits:n%1?2:0,maximumFractionDigits:2});
const qs = k => new URLSearchParams(location.search).get(k);
function tagHtml(p){
  if(p.tag==='hit') return '<span class="badge tag-hit ptag">Хит</span>';
  if(p.tag==='new') return '<span class="badge tag-new ptag">Новинка</span>';
  if(p.old) return '<span class="badge tag-sale ptag">−'+Math.round((1-p.price/p.old)*100)+'%</span>';
  return '';
}
function productCard(p){
  const inCart = CART[p.id];
  return `<div class="pcard">
    <a class="pimg" href="product.html?id=${p.id}">${tagHtml(p)}<svg viewBox="0 0 48 48"><use href="#${CICON[p.cat]}"/></svg>${pimgHtml(p)}</a>
    <div class="pbody">
      <div class="art">Арт. ${p.art}</div>
      <h4><a href="product.html?id=${p.id}">${p.name}</a></h4>
      <div class="unit">${p.desc}</div>
      <div class="prow">
        <div class="price">${p.old?'<s>'+fmt(p.old)+'</s>':''}${fmt(p.price)} ₽ <small>/ ${p.unit}</small></div>
        <button class="addbtn ${inCart?'in':''}" data-add="${p.id}" aria-label="В корзину">
          ${inCart?ICO.check:ICO.plus}
        </button>
      </div>
    </div>
  </div>`;
}
const ICO = {
  plus:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
  check:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="m5 13 4 4 10-10" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  cart:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M6 6h15l-1.5 9h-12L6 6zM6 6l-.7-3H2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9" cy="20" r="1.6" fill="currentColor"/><circle cx="18" cy="20" r="1.6" fill="currentColor"/></svg>',
};

/* ---- Корзина ---- */
let CART = JSON.parse(localStorage.getItem('krepolit_cart')||'{}');
function saveCart(){ localStorage.setItem('krepolit_cart',JSON.stringify(CART)); }
function cartCount(){ return Object.values(CART).reduce((a,b)=>a+b,0); }
function cartTotal(){ return Object.entries(CART).reduce((s,[id,q])=>{const p=PBYID[id];return s+(p?p.price*q:0);},0); }
function updateBadge(){ const c=cartCount(); document.querySelectorAll('[data-cart-count]').forEach(el=>{el.textContent=c;el.style.display=c?'grid':'none';}); }
function addToCart(id,n){ CART[id]=(CART[id]||0)+(n||1); saveCart(); updateBadge(); refreshUI(); toast('Товар добавлен в корзину'); }
function setQty(id,d){ CART[id]=(CART[id]||0)+d; if(CART[id]<=0) delete CART[id]; saveCart(); updateBadge(); refreshUI(); }
function delItem(id){ delete CART[id]; saveCart(); updateBadge(); refreshUI(); }
function refreshUI(){ renderDrawer(); document.querySelectorAll('[data-add]').forEach(b=>{const id=b.dataset.add;b.classList.toggle('in',!!CART[id]);b.innerHTML=CART[id]?ICO.check:ICO.plus;}); if(window.PAGE_REFRESH) window.PAGE_REFRESH(); }

/* ---- Каркас страницы (шапка/подвал/оверлеи) ---- */
const SVG_DEFS = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
<symbol id="i-bolt" viewBox="0 0 48 48"><polygon points="24,4 37,11.5 37,26.5 24,34 11,26.5 11,11.5" fill="none" stroke="currentColor" stroke-width="2.4"/><polygon points="24,11 30.5,14.7 30.5,22.3 24,26 17.5,22.3 17.5,14.7" fill="currentColor" opacity=".25"/><rect x="20" y="33" width="8" height="12" rx="1" fill="currentColor" opacity=".55"/><g stroke="currentColor" stroke-width="1.6"><line x1="20" y1="37" x2="28" y2="37"/><line x1="20" y1="41" x2="28" y2="41"/></g></symbol>
<symbol id="i-nut" viewBox="0 0 48 48"><polygon points="24,6 39,15 39,33 24,42 9,33 9,15" fill="none" stroke="currentColor" stroke-width="2.4"/><circle cx="24" cy="24" r="8.5" fill="none" stroke="currentColor" stroke-width="2.4"/><circle cx="24" cy="24" r="8.5" fill="currentColor" opacity=".12"/></symbol>
<symbol id="i-screw" viewBox="0 0 48 48"><path d="M24 5 L30 11 L27 11 L27 15 L21 15 L21 11 L18 11 Z" fill="currentColor" opacity=".55"/><path d="M21 15 L27 15 L26 40 L24 44 L22 40 Z" fill="none" stroke="currentColor" stroke-width="2.2"/><g stroke="currentColor" stroke-width="1.5"><line x1="21" y1="20" x2="27" y2="22"/><line x1="21.3" y1="25" x2="26.7" y2="27"/><line x1="21.6" y1="30" x2="26.4" y2="32"/><line x1="22.2" y1="35" x2="25.8" y2="37"/></g></symbol>
<symbol id="i-washer" viewBox="0 0 48 48"><circle cx="24" cy="24" r="17" fill="none" stroke="currentColor" stroke-width="2.4"/><circle cx="24" cy="24" r="8" fill="none" stroke="currentColor" stroke-width="2.4"/><circle cx="24" cy="24" r="17" fill="currentColor" opacity=".08"/></symbol>
<symbol id="i-selftap" viewBox="0 0 48 48"><path d="M18 6 L30 6 L30 10 L18 10 Z" fill="currentColor" opacity=".55"/><line x1="24" y1="10" x2="24" y2="14" stroke="currentColor" stroke-width="2.2"/><path d="M20 14 L28 14 L24 44 Z" fill="none" stroke="currentColor" stroke-width="2.2"/><g stroke="currentColor" stroke-width="1.5"><line x1="20.5" y1="18" x2="27.5" y2="20"/><line x1="21.3" y1="24" x2="26.7" y2="26"/><line x1="22.2" y1="31" x2="25.8" y2="33"/></g></symbol>
<symbol id="i-anchor" viewBox="0 0 48 48"><rect x="19" y="5" width="10" height="6" rx="1" fill="currentColor" opacity=".55"/><path d="M20 11 L20 40 Q20 44 24 44 Q28 44 28 40 L28 11" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M28 16 L34 20 M28 24 L34 28 M28 32 L34 36" stroke="currentColor" stroke-width="2"/><path d="M20 16 L14 20 M20 24 L14 28" stroke="currentColor" stroke-width="2"/></symbol>
<symbol id="i-dowel" viewBox="0 0 48 48"><rect x="16" y="8" width="16" height="9" rx="2" fill="currentColor" opacity=".5"/><path d="M18 17 L18 40 L24 45 L30 40 L30 17" fill="none" stroke="currentColor" stroke-width="2.2"/><line x1="24" y1="18" x2="24" y2="42" stroke="currentColor" stroke-width="2"/><path d="M18 24 L24 22 M30 24 L24 22 M18 32 L24 30 M30 32 L24 30" stroke="currentColor" stroke-width="1.6"/></symbol>
<symbol id="i-rod" viewBox="0 0 48 48"><rect x="21" y="4" width="6" height="40" rx="1" fill="none" stroke="currentColor" stroke-width="2.2"/><g stroke="currentColor" stroke-width="1.5"><line x1="21" y1="9" x2="27" y2="11"/><line x1="21" y1="14" x2="27" y2="16"/><line x1="21" y1="19" x2="27" y2="21"/><line x1="21" y1="24" x2="27" y2="26"/><line x1="21" y1="29" x2="27" y2="31"/><line x1="21" y1="34" x2="27" y2="36"/></g></symbol>
<symbol id="i-nail" viewBox="0 0 48 48"><ellipse cx="24" cy="8" rx="10" ry="3.5" fill="currentColor" opacity=".5"/><path d="M20 9 L28 9 L25 42 L24 45 L23 42 Z" fill="none" stroke="currentColor" stroke-width="2.2"/></symbol>
<symbol id="i-rivet" viewBox="0 0 48 48"><ellipse cx="24" cy="12" rx="9" ry="4" fill="currentColor" opacity=".5"/><path d="M15 12 L15 14 Q24 20 33 14 L33 12" fill="none" stroke="currentColor" stroke-width="2.2"/><rect x="21" y="16" width="6" height="26" rx="1" fill="none" stroke="currentColor" stroke-width="2.2"/></symbol>
<symbol id="i-clamp" viewBox="0 0 48 48"><path d="M24 10 a14 14 0 1 1 -6 2" fill="none" stroke="currentColor" stroke-width="2.6"/><rect x="16" y="6" width="18" height="7" rx="2" fill="currentColor" opacity=".45"/><circle cx="24" cy="24" r="4" fill="none" stroke="currentColor" stroke-width="2"/></symbol>
<symbol id="i-rigging" viewBox="0 0 48 48"><circle cx="17" cy="17" r="8" fill="none" stroke="currentColor" stroke-width="2.4"/><circle cx="31" cy="31" r="8" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M22 22 L26 26" stroke="currentColor" stroke-width="2.4"/></symbol>
<symbol id="i-tool" viewBox="0 0 48 48"><path d="M30 6 a8 8 0 0 0 -3 13 L11 35 a4 4 0 0 0 6 6 L33 25 a8 8 0 0 0 6 -14 L33 17 L29 13 Z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/></symbol>
<symbol id="i-insul" viewBox="0 0 48 48"><rect x="8" y="12" width="32" height="24" rx="2" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M8 18 Q14 14 20 18 T32 18 T44 18" fill="none" stroke="currentColor" stroke-width="1.6" opacity=".7"/><path d="M8 24 Q14 20 20 24 T32 24 T44 24" fill="none" stroke="currentColor" stroke-width="1.6" opacity=".7"/><path d="M8 30 Q14 26 20 30 T32 30" fill="none" stroke="currentColor" stroke-width="1.6" opacity=".7"/></symbol>
<symbol id="i-chem" viewBox="0 0 48 48"><path d="M20 6 L28 6 L28 20 L36 38 Q37 42 33 42 L15 42 Q11 42 12 38 L20 20 Z" fill="none" stroke="currentColor" stroke-width="2.2"/><line x1="20" y1="6" x2="28" y2="6" stroke="currentColor" stroke-width="3"/><path d="M17 30 L31 30 L34 38 Q35 40 32 40 L16 40 Q13 40 14 38 Z" fill="currentColor" opacity=".2"/></symbol>
<symbol id="i-perf" viewBox="0 0 48 48"><rect x="8" y="14" width="32" height="20" rx="2" fill="none" stroke="currentColor" stroke-width="2.2"/><g fill="currentColor" opacity=".55"><circle cx="15" cy="20" r="2"/><circle cx="24" cy="20" r="2"/><circle cx="33" cy="20" r="2"/><circle cx="15" cy="28" r="2"/><circle cx="24" cy="28" r="2"/><circle cx="33" cy="28" r="2"/></g></symbol>
</defs></svg>`;

const LOGO_SVG = `<svg class="mark" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#0f1b2d"/><g transform="translate(32 25)"><polygon points="0,-13 11.3,-6.5 11.3,6.5 0,13 -11.3,6.5 -11.3,-6.5" fill="#ff6a00"/><polygon points="0,-7 6.1,-3.5 6.1,3.5 0,7 -6.1,3.5 -6.1,-3.5" fill="#0f1b2d"/></g><rect x="27" y="29" width="10" height="26" rx="1.5" fill="#c7d0dc"/><g fill="#8a97a8"><rect x="27" y="33" width="10" height="2.4"/><rect x="27" y="38" width="10" height="2.4"/><rect x="27" y="43" width="10" height="2.4"/><rect x="27" y="48" width="10" height="2.4"/></g></svg>`;

function headerHtml(active){
  const na = k => active===k?' class="active"':'';
  return `
<div class="topbar"><div class="wrap">
  <span class="tb-city"><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12z" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="9" r="2.5" stroke="currentColor" stroke-width="2"/></svg>Москва</span>
  <div class="tb-links"><a href="delivery.html">Доставка и оплата</a><a href="about.html">О компании</a><a href="#" data-modal="cert">Сертификаты</a><a href="news.html">Новости</a><a href="contacts.html">Контакты</a></div>
  <span class="sp"></span><a href="mailto:opt@krepolit.ru">opt@krepolit.ru</a><span>Пн–Пт 8:00–19:00, Сб 9:00–16:00</span>
</div></div>
<header class="header"><div class="wrap">
  <button class="icon-btn burger" data-menu-open aria-label="Меню"><svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>
  <a href="index.html" class="logo" aria-label="КРЕПОЛИТ">${LOGO_SVG}<span class="lt"><b>КРЕПО<i>ЛИТ</i></b><span>крепёж и метизы</span></span></a>
  <form class="search" data-search autocomplete="off"><input type="search" name="q" placeholder="Поиск по каталогу: болт, саморез, анкер, артикул…" autocomplete="off"><button type="submit" aria-label="Найти"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="#fff" stroke-width="2"/><path d="m20 20-3.5-3.5" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg></button><div class="search-sug" id="search-sug" role="listbox"></div></form>
  <div class="hd-contact"><div class="ph">8 800 555-24-70</div><span class="cb" data-modal="call">Заказать звонок</span></div>
  <div class="hd-actions"><a class="icon-btn" href="cart.html" aria-label="Корзина">${ICO.cart}<span class="cnt" data-cart-count style="display:none">0</span></a></div>
</div></header>
<nav class="nav"><div class="wrap">
  <div class="mega-wrap"><button class="catbtn" data-mega><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 12h16M4 18h16" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/></svg>Каталог<svg class="caret" width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="m6 9 6 6 6-6" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div>
  <div class="navlinks">
    <a href="catalog.html"${na('catalog')}>Изделия из металла</a>
    <a href="opt.html"${na('opt')}>Оптом</a>
    <a href="about.html"${na('about')}>О компании</a>
    <a href="contacts.html"${na('contacts')}>Контакты</a>
  </div>
  <div class="nav-ph"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 5c0 9 6 15 15 15l0-3.5-4-1.5-2 2c-2-1-4-3-5-5l2-2-1.5-4L4 5z" stroke="#fff" stroke-width="1.8" stroke-linejoin="round"/></svg>8 800 555-24-70</div>
</div><div class="mega" id="mega"><div class="wrap"><a class="mega-all" href="catalog.html"><b>Весь каталог</b><span>${GROUPS.length} групп · ${P.length.toLocaleString('ru-RU')} позиций</span><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></a><div class="mega-grid">${GROUPS.map(c=>`<a href="catalog.html?group=${c.id}"><svg viewBox="0 0 48 48"><use href="#${c.icon}"/></svg>${c.name}</a>`).join('')}</div></div></div></nav>`;
}

const FOOTER_HTML = `
<footer class="footer"><div class="wrap">
  <div class="cols">
    <div>
      <a href="index.html" class="logo" style="margin-bottom:16px">${LOGO_SVG}<span class="lt"><b style="color:#fff">КРЕПО<i style="color:#ff6a00">ЛИТ</i></b><span style="color:#7d8899">крепёж и метизы</span></span></a>
      <p style="color:#8b96a6;max-width:280px;margin:0 0 8px">Оптовая и розничная поставка крепежа и метизов со склада в Москве по всей России.</p>
      <div class="pay"><span>Наличные</span><span>Карта</span><span>Безнал с НДС</span><span>Отсрочка</span></div>
    </div>
    <div><h5>Каталог</h5>
      <a href="catalog.html?group=A0">Болты</a><a href="catalog.html?group=AB">Саморезы и шурупы</a><a href="catalog.html?group=AE">Анкерная техника</a><a href="catalog.html?group=AG">Дюбельная техника</a><a href="catalog.html?group=AF">Такелаж</a><a href="catalog.html?group=A2">Гайки</a>
    </div>
    <div><h5>Компания</h5>
      <a href="about.html">О компании</a><a href="delivery.html">Доставка и оплата</a><a href="#" data-modal="cert">Сертификаты</a><a href="news.html">Новости</a><a href="contacts.html">Контакты</a>
    </div>
    <div class="fcontact"><h5>Контакты</h5>
      <b>8 800 555-24-70</b><a href="mailto:opt@krepolit.ru">opt@krepolit.ru</a><a href="contacts.html">Москва, ул. Складочная, 12, стр. 4</a><a href="contacts.html">Пн–Пт 8:00–19:00, Сб 9:00–16:00</a>
      <button class="btn btn-accent" style="margin-top:12px" data-modal="call">Заказать звонок</button>
    </div>
  </div>
  <div class="foot-bottom"><span>© 2010–2026 КРЕПОЛИТ. ООО «Креполит», ИНН 7712345678. Все права защищены.</span><span>Информация на сайте не является публичной офертой.</span></div>
</div></footer>`;

const CHROME_HTML = `
<div class="overlay" data-overlay></div>
<aside class="drawer" id="drawer"><div class="dh"><b>Корзина</b><button class="dclose" data-cart-close aria-label="Закрыть">✕</button></div><div class="ditems" id="ditems"></div><div class="dfoot" id="dfoot"></div></aside>
<aside class="mmenu" id="mmenu"><div class="mh"><b>Меню</b><button class="dclose" data-menu-close>✕</button></div>
  <a href="catalog.html"><b>Каталог</b></a><a href="catalog.html">Изделия из металла</a><a href="opt.html">Оптом</a>
  <a href="delivery.html">Доставка и оплата</a><a href="about.html">О компании</a><a href="news.html">Новости</a><a href="contacts.html">Контакты</a><a href="#" data-modal="call" style="color:var(--accent)">Заказать звонок</a>
</aside>
<div class="modal" id="modal"><div class="modal-card" id="modal-card"></div></div>
<div class="toast" id="toast"><svg viewBox="0 0 24 24" fill="none"><path d="m5 13 4 4 10-10" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg><span id="toast-msg"></span></div>`;

/* ---- Drawer / mega / menu / modal / toast ---- */
function el(id){ return document.getElementById(id); }
function openCart(){ renderDrawer(); el('drawer').classList.add('open'); el('overlay0').classList.add('open'); document.body.style.overflow='hidden'; }
function closeCart(){ el('drawer').classList.remove('open'); syncOverlay(); document.body.style.overflow=''; }
function syncOverlay(){ const any=el('drawer').classList.contains('open')||el('mmenu').classList.contains('open')||el('modal').classList.contains('open'); document.querySelector('[data-overlay]').classList.toggle('open',any); if(!any) document.body.style.overflow=''; }
let overlayEl;
function renderDrawer(){
  const items=Object.entries(CART), box=el('ditems'), foot=el('dfoot');
  if(!box) return;
  if(!items.length){ box.innerHTML=`<div class="cart-empty">${ICO.cart.replace('width="22" height="22"','viewBox="0 0 24 24"')}<p>Корзина пуста.<br>Добавьте товары из каталога.</p><a class="btn btn-dark" href="catalog.html">В каталог</a></div>`; foot.innerHTML=''; return; }
  box.innerHTML=items.map(([id,q])=>{const p=PBYID[id];if(!p)return'';return `<div class="ditem"><div class="di-img"><svg viewBox="0 0 48 48"><use href="#${CICON[p.cat]}"/></svg>${pimgHtml(p)}</div><div class="di-main"><b>${p.name}</b><div class="di-art">Арт. ${p.art} · ${fmt(p.price)} ₽/${p.unit}</div><div class="qty"><button data-q="${id}:-1">−</button><span>${q}</span><button data-q="${id}:1">+</button></div></div><div><div class="di-price">${fmt(p.price*q)} ₽</div><button class="di-del" data-del="${id}">Удалить</button></div></div>`;}).join('');
  const total=cartTotal(), delivery=total>=30000?0:490;
  foot.innerHTML=`<div class="drow"><span>Товары (${cartCount()} шт.)</span><span>${fmt(total)} ₽</span></div><div class="drow"><span>Доставка по Москве</span><span>${delivery?fmt(delivery)+' ₽':'бесплатно'}</span></div><div class="dtotal"><span>Итого</span><span>${fmt(total+delivery)} ₽</span></div><a class="btn btn-accent" href="cart.html">Оформить заказ</a><button class="btn btn-light" data-cart-close>Продолжить покупки</button>`;
}
function toggleMega(force){ const m=el('mega'); m.classList.toggle('open',force); const b=document.querySelector('.catbtn'); if(b) b.classList.toggle('mega-open', m.classList.contains('open')); }
function openMenu(){ el('mmenu').classList.add('open'); syncOverlay(); document.querySelector('[data-overlay]').classList.add('open'); document.body.style.overflow='hidden'; }
function closeMenu(){ el('mmenu').classList.remove('open'); syncOverlay(); }
let toastT;
function toast(msg){ const t=el('toast'); el('toast-msg').textContent=msg; t.classList.add('show'); clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove('show'),2200); }

const MODALS = {
  call:{t:'Заказать звонок',s:'Оставьте номер — перезвоним в течение 15 минут.',f:[['text','Ваше имя'],['tel','+7 (___) ___-__-__']],b:'Жду звонка',ctx:'Обратный звонок'},
  price:{t:'Получить прайс-лист',s:'Пришлём актуальный прайс с оптовыми ценами на e-mail.',f:[['text','Ваше имя'],['tel','Телефон'],['email','E-mail для прайса']],b:'Получить прайс',ctx:'Запрос прайс-листа'},
  cert:{t:'Сертификаты соответствия',s:'Вся продукция сопровождается сертификатами ГОСТ, DIN и ISO. Оставьте контакт — вышлем сертификаты на нужные позиции.',f:[['text','Ваше имя'],['email','E-mail']],b:'Запросить сертификаты',ctx:'Запрос сертификатов'},
};
function openModal(key,opt){
  const m=MODALS[key]; if(!m) return; toggleMega(false);
  const fields=m.f.map(f=>`<input type="${f[0]}" placeholder="${f[1]}" required>`).join('');
  el('modal-card').innerHTML=`<button class="modal-close" data-modal-close>✕</button><h3>${m.t}</h3><p>${m.s}</p><form data-form="${m.ctx}">${(opt&&opt.extra)||''}${fields}<button class="btn btn-accent">${m.b}</button></form>`;
  el('modal').classList.add('open'); document.querySelector('[data-overlay]').classList.add('open'); document.body.style.overflow='hidden';
}
function closeModal(){ el('modal').classList.remove('open'); syncOverlay(); }
function formOk(ctx){
  el('modal-card').innerHTML=`<button class="modal-close" data-modal-close>✕</button><div class="mok"><div class="ic"><svg width="32" height="32" viewBox="0 0 24 24" fill="none"><path d="m5 13 4 4 10-10" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div><h3>Заявка отправлена!</h3><p>Спасибо! «${ctx}» принята — менеджер КРЕПОЛИТ свяжется с вами в ближайшее время.</p><button class="btn btn-dark" style="width:100%;justify-content:center" data-modal-close>Хорошо</button></div>`;
  el('modal').classList.add('open'); document.querySelector('[data-overlay]').classList.add('open'); document.body.style.overflow='hidden';
}

/* ---- Инициализация каркаса ---- */
function initChrome(active){
  document.body.insertAdjacentHTML('afterbegin', SVG_DEFS + headerHtml(active));
  document.body.insertAdjacentHTML('beforeend', FOOTER_HTML + CHROME_HTML);
  // алиасы для оверлея по id
  document.querySelector('[data-overlay]').id='overlay0';
  updateBadge();
  // делегирование событий
  document.addEventListener('click',e=>{
    const t=e.target;
    const add=t.closest('[data-add]'); if(add){ addToCart(+add.dataset.add); return; }
    const q=t.closest('[data-q]'); if(q){ const [id,d]=q.dataset.q.split(':'); setQty(id,+d); return; }
    const del=t.closest('[data-del]'); if(del){ delItem(del.dataset.del); return; }
    if(t.closest('[data-mega]')){ e.preventDefault(); toggleMega(); return; }
    if(t.closest('[data-menu-open]')){ openMenu(); return; }
    if(t.closest('[data-menu-close]')){ closeMenu(); return; }
    if(t.closest('[data-cart-close]')){ closeCart(); return; }
    const md=t.closest('[data-modal]'); if(md){ e.preventDefault(); openModal(md.dataset.modal); return; }
    if(t.closest('[data-modal-close]')){ closeModal(); return; }
    if(t.closest('[data-overlay]')){ closeCart(); closeMenu(); closeModal(); return; }
    if(el('mega').classList.contains('open') && !t.closest('.mega-wrap') && !t.closest('#mega')) toggleMega(false);
  });
  document.addEventListener('submit',e=>{
    const sf=e.target.closest('[data-search]'); if(sf){ e.preventDefault(); const v=sf.querySelector('input').value.trim(); location.href='catalog.html?q='+encodeURIComponent(v); return; }
    const ff=e.target.closest('[data-form]'); if(ff){ e.preventDefault(); const ctx=ff.dataset.form;
      const inp=[...ff.querySelectorAll('input,textarea')];
      const val=t=>{ const x=inp.find(i=>i.type===t); return x?x.value.trim():''; };
      const payload={ source:ctx, name:val('text'), phone:val('tel'), email:val('email'), message:ctx };
      if(ctx==='Оформление заказа'){ payload.items=Object.entries(CART).map(([id,q])=>{const p=PBYID[id];return p?{name:p.name,art:p.art,price:p.price,qty:q,unit:p.unit}:null;}).filter(Boolean); CART={}; saveCart(); updateBadge(); }
      // отправляем заявку в CRM (если backend доступен); при статике — тихо игнорируем
      fetch('/api/public/lead',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).catch(()=>{});
      formOk(ctx); if(window.PAGE_REFRESH) window.PAGE_REFRESH(); return; }
  });
  document.addEventListener('keydown',e=>{ if(e.key==='Escape'){ closeCart(); closeMenu(); closeModal(); const s=el('search-sug'); if(s) s.classList.remove('open'); } });

  // живой поиск с автоподсказками
  const si = document.querySelector('[data-search] input');
  const sug = el('search-sug');
  function esc(s){ return s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
  function renderSug(){
    const raw = si.value.trim(), v = raw.toLowerCase();
    if(v.length<2){ sug.classList.remove('open'); sug.innerHTML=''; return; }
    const list = P.filter(p=>p.name.toLowerCase().includes(v)||p.art.toLowerCase().includes(v)||CNAME[p.cat].toLowerCase().includes(v)).slice(0,6);
    if(!list.length){ sug.innerHTML=`<div class="sug-empty">Ничего не найдено по «${esc(raw)}».<br>Позвоните 8 800 555-24-70 — подберём вручную.</div>`; sug.classList.add('open'); return; }
    sug.innerHTML = list.map(p=>`<a class="sug-item" href="product.html?id=${p.id}"><span class="sug-ic"><svg viewBox="0 0 48 48"><use href="#${CICON[p.cat]}"/></svg></span><span class="sug-tx"><b>${p.name}</b><em>Арт. ${p.art} · ${CNAME[p.cat]}</em></span><span class="sug-pr">${fmt(p.price)} ₽</span></a>`).join('')
      + `<a class="sug-all" href="catalog.html?q=${encodeURIComponent(raw)}">Показать все результаты по «${esc(raw)}» →</a>`;
    sug.classList.add('open');
  }
  if(si && sug){
    si.addEventListener('input', renderSug);
    si.addEventListener('focus', renderSug);
    document.addEventListener('click', e=>{ if(!e.target.closest('[data-search]')) sug.classList.remove('open'); });
  }
  // предзаполнить строку поиска, если есть ?q
  const qv = qs('q'); if(qv && si) si.value = qv;
}
