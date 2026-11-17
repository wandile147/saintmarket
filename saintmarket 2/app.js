'use strict';
const features = {
  "discover": {
    "number": "DISCOVER",
    "title": "Help residents<br> find your business.",
    "description": "Give residents a place to discover your approved business. Your profile brings your services, prices and opening times into the estate marketplace.",
    "points": [
      "Be found by nearby residents",
      "Show what your business offers",
      "Keep your business details together"
    ],
    "primary": "discover",
    "primaryAlt": "Design preview of nearby businesses with category filters",
    "secondary": "salon",
    "secondaryAlt": "Design preview of a local salon profile and its services",
    "word": "nearby.",
    "tag": "Your business, easier to find"
  },
  "enquire": {
    "number": "ENQUIRE",
    "title": "Answer questions.<br> Help customers choose.",
    "description": "Respond to questions about your services before a resident books. Keep the details and conversation close to your business profile.",
    "points": [
      "Explain your services",
      "Answer questions before booking",
      "Keep customer conversations together"
    ],
    "primary": "messages",
    "primaryAlt": "Design preview of conversations in SaintMarket",
    "secondary": "salon",
    "secondaryAlt": "Design preview of a local service provider profile",
    "word": "let’s talk.",
    "tag": "From an enquiry to a booking"
  },
  "book": {
    "number": "BOOK",
    "title": "Turn availability<br> into appointments.",
    "description": "Show residents your services, professionals and available times. Make prices and cancellation terms clear before customers confirm.",
    "points": [
      "List your bookable services",
      "Show available dates and times",
      "Give customers a booking confirmation"
    ],
    "primary": "booking",
    "primaryAlt": "Design preview of a booking calendar and appointment times",
    "secondary": "confirmed",
    "secondaryAlt": "Design preview of an appointment confirmation",
    "word": "booked.",
    "tag": "From an available slot to a booking"
  },
  "pay": {
    "number": "PAY",
    "title": "Booking payments.<br> Clear from checkout.",
    "description": "Let customers pay for their booking in the app and keep transaction details alongside it. The 5% commission is deducted automatically from eligible checkout sales.",
    "points": [
      "Show the price before confirmation",
      "Accept booking payments in the app",
      "Keep booking and payment records together"
    ],
    "primary": "confirmed",
    "primaryAlt": "Design preview of a booking confirmation",
    "secondary": "booking",
    "secondaryAlt": "Design preview of an appointment calendar",
    "word": "sorted.",
    "tag": "Clear records for you and your customers"
  },
  "connect": {
    "number": "CONNECT",
    "title": "A connected estate.<br> A later launch.",
    "description": "Community conversations are planned for an estate-approved wider launch. The initial pilot focuses on the marketplace.",
    "points": [
      "Planned after the initial pilot",
      "Subject to estate approval",
      "Introduced when moderation is ready"
    ],
    "primary": "community",
    "primaryAlt": "Design preview of community groups and conversations",
    "secondary": "messages",
    "secondaryAlt": "Design preview of messages in SaintMarket",
    "word": "together.",
    "tag": "Planned for the wider launch"
  }
};
const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let motionPaused = false;
const canAnimate = () => !reducedMotion.matches && !motionPaused;
const panelAnimations = new Map();
function selectFeature(tab, moveFocus = false) {
  if (tab.getAttribute('aria-selected') === 'true') {
    if (moveFocus) tab.focus();
    return;
  }
  const feature = features[tab.dataset.feature];
  tabs.forEach(item => {const active=item===tab;item.setAttribute('aria-selected',String(active));item.tabIndex=active?0:-1;});
  document.getElementById('feature-panel').setAttribute('aria-labelledby',tab.id);
  document.getElementById('feature-number').textContent=feature.number;
  document.getElementById('feature-title').innerHTML=feature.title;
  document.getElementById('feature-description').textContent=feature.description;
  document.getElementById('feature-word').textContent=feature.word;
  document.getElementById('feature-tag').textContent=feature.tag;
  document.getElementById('feature-points').replaceChildren(...feature.points.map(text=>{const li=document.createElement('li');li.textContent=text;return li;}));
  ['primary','secondary'].forEach(position=>{const img=document.getElementById('feature-'+position);img.src='assets/'+feature[position]+'-v5.webp';img.width=804;img.height=({discover:1748,salon:1750,booking:1752,confirmed:1752,community:1750,messages:1855})[feature[position]];img.alt=feature[position+'Alt'];});
  if (canAnimate()) {
    document.querySelectorAll('.panel-copy, .panel-stage').forEach(element => {
      panelAnimations.get(element)?.cancel();
      panelAnimations.set(element, element.animate(
        [{ opacity: .35, translate: '0 12px' }, { opacity: 1, translate: '0 0' }],
        { duration: 380, easing: 'cubic-bezier(.2,.7,.2,1)' }
      ));
    });
  }
  if(moveFocus) tab.focus();
}
tabs.forEach((tab,index)=>{
  tab.addEventListener('click',()=>selectFeature(tab));
  tab.addEventListener('keydown',event=>{
    let next;
    if(event.key==='ArrowRight')next=(index+1)%tabs.length;
    if(event.key==='ArrowLeft')next=(index-1+tabs.length)%tabs.length;
    if(event.key==='Home')next=0;
    if(event.key==='End')next=tabs.length-1;
    if(next!==undefined){event.preventDefault();selectFeature(tabs[next],true);}
  });
});

// Motion is progressive enhancement: ordinary scrolling and readable content
// remain available without JavaScript, IntersectionObserver, or animation APIs.
(() => {
  if (!('IntersectionObserver' in window) || !Element.prototype.animate) return;
  const root = document.documentElement;
  const toggle = document.querySelector('.motion-toggle');
  const progress = document.querySelector('.reading-progress span');
  const compact = window.matchMedia('(max-width: 800px)');
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const zones = Array.from(document.querySelectorAll('.hero-stage, .panel-stage, .story-art, .local-section, .closing'));
  const activeZones = new Set();
  const layers = new Map(zones.map(zone => [zone, Array.from(zone.querySelectorAll('.device, .floating-note, .art-sticker, .community-sticker, .delivery-label, .closing-spark'))]));
  const words = Array.from(document.querySelectorAll('[data-scroll-word]'));
  const reveals = Array.from(document.querySelectorAll('.section-heading, .story, .stats > div, .business-grid article, .join-card, .closing > .eyebrow, .closing > .button'));
  let revealObserver;
  let zoneObserver;
  let frame = 0;
  let enabled = false;
  let introAnimation;

  function renderScroll() {
    frame = 0;
    if (!enabled) return;
    const height = window.innerHeight;
    const range = document.documentElement.scrollHeight - height;
    const pageProgress = range > 0 ? clamp(window.scrollY / range) : 0;
    // Batch geometry reads before visual writes to avoid repeated layout work.
    const positions = Array.from(activeZones, zone => [zone, zone.getBoundingClientRect()]);
    progress.style.transform = `scaleX(${pageProgress})`;
    positions.forEach(([zone, rect]) => {
      const travel = clamp((height - rect.top) / (height + rect.height)) * 2 - 1;
      const distance = compact.matches ? 9 : 28;
      const tilt = compact.matches ? .65 : 2;
      layers.get(zone).forEach((layer, index) => {
        const direction = index % 2 === 0 ? 1 : -.65;
        layer.style.setProperty('--drift', `${(travel * distance * direction).toFixed(2)}px`);
        layer.style.setProperty('--tilt', `${(travel * tilt * direction).toFixed(2)}deg`);
      });
      if (zone.classList.contains('local-section')) {
        const reading = clamp((height * .90 - rect.top) / (height * .55));
        words.forEach((word, index) => {
          const illumination = clamp(reading * (words.length + 1) - index);
          word.style.setProperty('--word-opacity', (.34 + illumination * .66).toFixed(3));
        });
      }
    });
  }
  function requestRender() {
    if (enabled && !frame) frame = window.requestAnimationFrame(renderScroll);
  }
  function startMotion() {
    if (enabled) return;
    enabled = true;
    root.classList.add('has-motion');
    revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.remove('reveal-pending');
        entry.target.classList.add('reveal-complete');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: .08, rootMargin: '0px 0px -24px 0px' });
    reveals.forEach((element, index) => {
      // Do not hide content that is already on screen or above the visitor.
      if (element.classList.contains('reveal-complete') || element.getBoundingClientRect().top < window.innerHeight) return;
      element.classList.add('scroll-reveal', 'reveal-pending');
      const stagger = element.matches('.story, .business-grid article, .stats > div') ? index % 2 * 85 : 0;
      element.style.setProperty('--reveal-delay', `${stagger}ms`);
      revealObserver.observe(element);
    });
    zoneObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => entry.isIntersecting ? activeZones.add(entry.target) : activeZones.delete(entry.target));
      requestRender();
    }, { rootMargin: '100px 0px' });
    zones.forEach(zone => zoneObserver.observe(zone));
    window.addEventListener('scroll', requestRender, { passive: true });
    window.addEventListener('resize', requestRender, { passive: true });
    requestRender();
  }
  function stopMotion() {
    enabled = false;
    root.classList.remove('has-motion');
    revealObserver?.disconnect();
    zoneObserver?.disconnect();
    activeZones.clear();
    window.removeEventListener('scroll', requestRender);
    window.removeEventListener('resize', requestRender);
    window.cancelAnimationFrame(frame);
    frame = 0;
    introAnimation?.cancel();
    panelAnimations.forEach(animation => animation.cancel());
    reveals.forEach(element => element.classList.remove('reveal-pending'));
    layers.forEach(items => items.forEach(layer => {
      layer.style.removeProperty('--drift');
      layer.style.removeProperty('--tilt');
    }));
    words.forEach(word => word.style.removeProperty('--word-opacity'));
  }
  function syncMotion() {
    canAnimate() ? startMotion() : stopMotion();
    toggle.hidden = false;
    toggle.disabled = reducedMotion.matches;
    toggle.setAttribute('aria-pressed', String(!canAnimate()));
    toggle.textContent = reducedMotion.matches ? 'Reduced motion' : motionPaused ? 'Resume motion' : 'Pause motion';
    toggle.title = reducedMotion.matches ? 'Following your device’s reduced-motion preference' : 'Turn decorative scroll animation on or off';
  }
  toggle.addEventListener('click', () => { motionPaused = !motionPaused; syncMotion(); });
  reducedMotion.addEventListener('change', syncMotion);
  compact.addEventListener('change', requestRender);
  window.addEventListener('pageshow', requestRender);
  syncMotion();
  if (canAnimate() && window.scrollY < 80) {
    introAnimation = document.querySelector('.hero-stage').animate(
      [{ opacity: 0, translate: '0 26px' }, { opacity: 1, translate: '0 0' }],
      { duration: 850, easing: 'cubic-bezier(.16,1,.3,1)' }
    );
  }
})();

// The deadline is inclusive of 1 January 2027 in South Africa (UTC+02:00).
// This controls the offer display; qualifying submissions remain recorded in Tally.
(() => {
  const offerEndsAt = Date.parse('2027-01-02T00:00:00+02:00');
  let expiryTimer;
  function syncOffer() {
    window.clearTimeout(expiryTimer);
    const active = Date.now() < offerEndsAt;
    document.querySelectorAll('[data-offer-active]').forEach(element => { element.hidden = !active; });
    document.querySelectorAll('[data-offer-expired]').forEach(element => { element.hidden = active; });
    const description = document.querySelector('meta[name="description"]');
    if (!active && description) {
      description.content = 'Reach Amsterdam Estate residents with your business. R199/month plus 5% commission and R0 setup. Register business interest, subject to estate approval.';
    }
    if (active) {
      expiryTimer = window.setTimeout(syncOffer, Math.min(offerEndsAt - Date.now(), 86400000));
    }
  }
  window.addEventListener('pageshow', syncOffer);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) syncOffer(); });
  syncOffer();
})();
