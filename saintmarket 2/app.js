'use strict';
const features = {
  "discover": {
    "number": "DISCOVER",
    "title": "Your next favourite.<br> Just around the corner.",
    "description": "From a fresh set of nails to your next fitness session, find approved businesses nearby. Browse services and prices, explore profiles and choose what fits your day.",
    "points": [
      "Explore businesses on the map",
      "Find the services that fit your day",
      "Explore services, prices and opening times"
    ],
    "primary": "discover",
    "primaryAlt": "Design preview of nearby businesses with category filters",
    "secondary": "salon",
    "secondaryAlt": "Design preview of a local salon profile and its services",
    "word": "nearby.",
    "tag": "A whole neighbourhood to discover"
  },
  "enquire": {
    "number": "ENQUIRE",
    "title": "A question first.<br> A better fit.",
    "description": "Ask about a service before making a plan. Get to know the business, check the details and decide what works for you.",
    "points": [
      "Explore a business’s services",
      "Ask a question before booking",
      "Keep the conversation close"
    ],
    "primary": "messages",
    "primaryAlt": "Design preview of conversations in SaintMarket",
    "secondary": "salon",
    "secondaryAlt": "Design preview of a local service provider profile",
    "word": "let’s talk.",
    "tag": "From a question to your next plan"
  },
  "book": {
    "number": "BOOK",
    "title": "Make a little<br> time for yourself.",
    "description": "Choose a professional, check availability and review the price and cancellation terms. Keep your appointment details together once you confirm.",
    "points": [
      "Choose a service and professional",
      "Find an available date and time",
      "Keep your booking confirmation"
    ],
    "primary": "booking",
    "primaryAlt": "Design preview of a booking calendar and appointment times",
    "secondary": "confirmed",
    "secondaryAlt": "Design preview of an appointment confirmation",
    "word": "you time.",
    "tag": "From an available slot to a confirmed plan"
  },
  "pay": {
    "number": "PAY",
    "title": "The next step.<br> Taken care of.",
    "description": "Complete payment for your booking and keep the transaction details alongside it. See what you have arranged and find the information you need when following up.",
    "points": [
      "Review the price before confirming",
      "Pay for your booking in the app",
      "Keep payment and booking records together"
    ],
    "primary": "confirmed",
    "primaryAlt": "Design preview of a booking confirmation",
    "secondary": "booking",
    "secondaryAlt": "Design preview of an appointment calendar",
    "word": "sorted.",
    "tag": "Your booking details, all together"
  },
  "connect": {
    "number": "CONNECT",
    "title": "Your place.<br> Your kind of people.",
    "description": "There’s more to your neighbourhood than an address. Find groups, share local recommendations and connect over the things you have in common.",
    "points": [
      "Explore community groups",
      "Join neighbourhood conversations",
      "Keep in touch through messages"
    ],
    "primary": "community",
    "primaryAlt": "Design preview of community groups and conversations",
    "secondary": "messages",
    "secondaryAlt": "Design preview of messages in SaintMarket",
    "word": "together.",
    "tag": "More connected to where you live"
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
  ['primary','secondary'].forEach(position=>{const img=document.getElementById('feature-'+position);img.src='assets/'+feature[position]+'-v5.webp';img.alt=feature[position+'Alt'];});
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
