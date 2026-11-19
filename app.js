document.documentElement.classList.add('js-ready');

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const audio = $('#bgMusic');
const splash = $('#splash');
const soundToggle = $('#soundToggle');
const musicDock = $('#musicDock');
const musicDockButton = $('#musicDockButton');
const musicStatus = $('#musicStatus');
const siteNav = $('#siteNav');
const menuToggle = $('#menuToggle');

let audioFadeTimer = null;
let splashDismissed = false;

function setAudioUI(isPlaying) {
  document.body.classList.toggle('is-playing', isPlaying);
  musicDock.classList.toggle('is-playing', isPlaying);
  soundToggle.classList.toggle('is-playing', isPlaying);
  soundToggle.setAttribute('aria-label', isPlaying ? '暂停背景音乐' : '播放背景音乐');
  soundToggle.title = isPlaying ? '暂停背景音乐' : '播放背景音乐';
  musicDockButton.setAttribute('aria-label', isPlaying ? '暂停背景音乐' : '播放背景音乐');
  musicStatus.textContent = isPlaying ? '声场正在流动' : '声场已静默';
}

function fadeAudio(target, duration = 900) {
  window.clearInterval(audioFadeTimer);
  const start = audio.volume;
  const startedAt = performance.now();
  audioFadeTimer = window.setInterval(() => {
    const progress = Math.min((performance.now() - startedAt) / duration, 1);
    audio.volume = start + (target - start) * progress;
    if (progress >= 1) {
      window.clearInterval(audioFadeTimer);
      if (target === 0) audio.pause();
    }
  }, 30);
}

async function playMusic() {
  try {
    if (audio.readyState === 0) audio.load();
    audio.volume = 0;
    await audio.play();
    setAudioUI(true);
    fadeAudio(0.34, 1400);
  } catch (error) {
    setAudioUI(false);
    musicStatus.textContent = '浏览器阻止了自动播放';
  }
}

function pauseMusic() {
  fadeAudio(0, 500);
  setAudioUI(false);
}

function toggleMusic() {
  if (audio.paused) {
    playMusic();
  } else {
    pauseMusic();
  }
}

function dismissSplash(withMusic) {
  if (splashDismissed) return;
  splashDismissed = true;
  splash.classList.add('is-leaving');
  document.body.classList.remove('is-locked');
  window.setTimeout(() => {
    splash.setAttribute('aria-hidden', 'true');
  }, 1200);
  if (withMusic) playMusic();
  refreshReveals();
}

document.body.classList.add('is-locked');
$('#enterSite').addEventListener('click', () => dismissSplash(true));
$('#enterSilent').addEventListener('click', () => dismissSplash(false));
soundToggle.addEventListener('click', toggleMusic);
musicDockButton.addEventListener('click', toggleMusic);

audio.addEventListener('play', () => setAudioUI(true));
audio.addEventListener('pause', () => setAudioUI(false));
audio.addEventListener('ended', () => setAudioUI(false));

/* Hash-based multi-page presentation */
const pageTitles = {
  home: '回声',
  life: '生平',
  works: '著作',
  ideas: '思想',
  legacy: '余震'
};

const pages = $$('.page');
const navLinks = $$('[data-route]');

function routeName() {
  const requested = window.location.hash.replace('#', '');
  return pageTitles[requested] ? requested : 'home';
}

function routeTo(route, pushState = false) {
  const target = pageTitles[route] ? route : 'home';
  pages.forEach((page) => {
    const isActive = page.dataset.page === target;
    page.hidden = !isActive;
    page.classList.toggle('is-active', isActive);
  });
  $$('.site-nav a').forEach((link) => {
    const active = link.dataset.route === target;
    link.classList.toggle('is-active', active);
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  document.title = `${pageTitles[target]} · 尼采纪念空间`;
  window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
  closeMenu();
  refreshReveals();

  if (pushState && window.location.hash !== `#${target}`) {
    history.pushState(null, '', `#${target}`);
  }
}

navLinks.forEach((link) => {
  if (!link.dataset.route) return;
  link.addEventListener('click', (event) => {
    event.preventDefault();
    routeTo(link.dataset.route, true);
  });
});

window.addEventListener('hashchange', () => routeTo(routeName()));

function openMenu() {
  siteNav.classList.add('is-open');
  menuToggle.classList.add('is-open');
  menuToggle.setAttribute('aria-expanded', 'true');
  menuToggle.setAttribute('aria-label', '关闭导航');
  document.body.classList.add('is-locked');
}

function closeMenu() {
  siteNav.classList.remove('is-open');
  menuToggle.classList.remove('is-open');
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', '打开导航');
  if (splashDismissed) document.body.classList.remove('is-locked');
}

menuToggle.addEventListener('click', () => {
  if (siteNav.classList.contains('is-open')) closeMenu();
  else openMenu();
});

/* Scroll reveals */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });

function refreshReveals() {
  requestAnimationFrame(() => {
    $$('.page.is-active .reveal:not(.is-visible)').forEach((element, index) => {
      if (element.closest('[hidden]')) return;
      element.style.transitionDelay = `${Math.min(index * 45, 360)}ms`;
      revealObserver.observe(element);
    });
  });
}

refreshReveals();

/* Scroll progress */
const progressBar = $('.scroll-progress span');
let progressQueued = false;

function updateScrollProgress() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const value = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
  progressBar.style.width = `${value * 100}%`;
  progressQueued = false;
}

window.addEventListener('scroll', () => {
  if (!progressQueued) {
    requestAnimationFrame(updateScrollProgress);
    progressQueued = true;
  }
}, { passive: true });
updateScrollProgress();

/* Pointer interactions */
if (!reducedMotion && window.matchMedia('(pointer: fine)').matches) {
  const dot = $('.cursor-dot');
  const ring = $('.cursor-ring');
  let pointerX = -100;
  let pointerY = -100;
  let ringX = -100;
  let ringY = -100;

  window.addEventListener('pointermove', (event) => {
    pointerX = event.clientX;
    pointerY = event.clientY;
    dot.style.transform = `translate(${pointerX}px, ${pointerY}px) translate(-50%, -50%)`;
  });

  const animateCursor = () => {
    ringX += (pointerX - ringX) * 0.16;
    ringY += (pointerY - ringY) * 0.16;
    ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
    requestAnimationFrame(animateCursor);
  };
  animateCursor();

  $$('a, button').forEach((element) => {
    element.addEventListener('pointerenter', () => ring.classList.add('is-active'));
    element.addEventListener('pointerleave', () => ring.classList.remove('is-active'));
  });
}

const heroArt = $('#heroArt');
if (heroArt && !reducedMotion) {
  heroArt.addEventListener('pointermove', (event) => {
    const rect = heroArt.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    const stage = $('.portrait-stage', heroArt);
    stage.style.setProperty('--rx', `${x * 9}deg`);
    stage.style.setProperty('--ry', `${-y * 9}deg`);
  });
  heroArt.addEventListener('pointerleave', () => {
    const stage = $('.portrait-stage', heroArt);
    stage.style.setProperty('--rx', '0deg');
    stage.style.setProperty('--ry', '0deg');
  });
}

/* Particle field */
const canvas = $('#particleField');
const ctx = canvas.getContext('2d');
let particles = [];
let frameId = null;

function sizeCanvas() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(window.innerWidth * ratio);
  canvas.height = Math.floor(window.innerHeight * ratio);
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  const targetCount = Math.min(78, Math.max(28, Math.floor(window.innerWidth / 18)));
  particles = Array.from({ length: targetCount }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    r: Math.random() * 1.15 + 0.25,
    speed: Math.random() * 0.15 + 0.03,
    drift: (Math.random() - 0.5) * 0.1,
    alpha: Math.random() * 0.65 + 0.12,
    phase: Math.random() * Math.PI * 2
  }));
}

function drawParticles(time = 0) {
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  particles.forEach((particle) => {
    particle.y -= particle.speed;
    particle.x += particle.drift + Math.sin(time * 0.0003 + particle.phase) * 0.05;
    if (particle.y < -8) {
      particle.y = window.innerHeight + 8;
      particle.x = Math.random() * window.innerWidth;
    }
    if (particle.x < -8) particle.x = window.innerWidth + 8;
    if (particle.x > window.innerWidth + 8) particle.x = -8;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
    ctx.fillStyle = particle.r > 0.9
      ? `rgba(216, 255, 62, ${particle.alpha})`
      : `rgba(242, 234, 220, ${particle.alpha * 0.65})`;
    ctx.fill();
  });
  if (!reducedMotion) frameId = requestAnimationFrame(drawParticles);
}

sizeCanvas();
drawParticles();

let resizeTimer;
window.addEventListener('resize', () => {
  window.clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(() => {
    sizeCanvas();
    if (reducedMotion) drawParticles();
    updateScrollProgress();
  }, 160);
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden && frameId) {
    cancelAnimationFrame(frameId);
    frameId = null;
  } else if (!document.hidden && !reducedMotion && !frameId) {
    drawParticles();
  }
});

/* Book archive */
const books = {
  tragedy: {
    year: '1872',
    title: '悲剧的诞生',
    original: 'DIE GEBURT DER TRAGÖDIE',
    category: 'EARLY PERIOD',
    glyph: 'Δ',
    accent: '#d8ff3e',
    summary: '尼采以日神阿波罗的造型冲动与酒神狄奥尼索斯的消融体验，解释希腊悲剧为何能在残酷世界中生成崇高与狂喜。它既是艺术哲学，也是尼采日后全部思想的第一块基石。',
    quote: '“只有作为审美现象，世界的存在才有正当理由。”',
    question: '艺术是在逃避现实，还是在教我们承受现实的全部强度？'
  },
  untimely: {
    year: '1873—76',
    title: '不合时宜的沉思',
    original: 'UNZEITGEMÄSSE BETRACHTUNGEN',
    category: 'EARLY PERIOD',
    glyph: '⌛',
    accent: '#e8dfd0',
    summary: '四篇长文分别讨论施特劳斯、历史对生命的利弊、叔本华与瓦格纳。尼采开始把文化与“生命的健康”联系起来，并公开质疑自己所处时代的学院习气。',
    quote: '“历史若无生命的尺度，就会变成压在当下的纪念碑。”',
    question: '记忆何时滋养行动，何时反而麻痹行动？'
  },
  human: {
    year: '1878',
    title: '人性的，太人性的',
    original: 'MENSCHLICHES, ALLZUMENSCHLICHES',
    category: 'MIDDLE PERIOD',
    glyph: '∴',
    accent: '#9bb8ff',
    summary: '尼采与瓦格纳、叔本华拉开距离，转向格言写作。他用心理学、历史与自然科学式怀疑，考察道德感、宗教和形而上学如何从人的需要中生长出来。',
    quote: '“在一条道路上走得太远的人，会惊讶于世界仍如此宽广。”',
    question: '当我们解释一种信念的起源，是否已经削弱了它？'
  },
  dawn: {
    year: '1881',
    title: '曙光',
    original: 'MORGENRÖTE',
    category: 'MIDDLE PERIOD',
    glyph: '☼',
    accent: '#ffb6c7',
    summary: '全书以“道德偏见”为主线，分析道德判断背后的权力、恐惧与社会塑造。尼采在这里更清楚地提出：我们不仅应批判价值，也应追问价值创造者自身的生命状态。',
    quote: '“我们对自己的判断，并不比对他人的判断更可靠。”',
    question: '一种道德是在保护生命，还是在惩罚生命？'
  },
  gay: {
    year: '1882',
    title: '快乐的科学',
    original: 'DIE FRÖHLICHE WISSENSCHAFT',
    category: 'MIDDLE PERIOD',
    glyph: '∞',
    accent: '#f5dc64',
    summary: '尼采最明亮也最危险的作品之一。“疯子”宣告上帝之死，永恒轮回的恶魔则提出最沉重的生活检验。知识不再只是冷静观察，而成了一种带着身体与笑声的实验。',
    quote: '“假如恶魔让你将这一生无限次重来，你会诅咒，还是会欢呼？”',
    question: '你现在的生活方式，经得起无限重复吗？'
  },
  zarathustra: {
    year: '1883—85',
    title: '查拉图斯特拉如是说',
    original: 'ALSO SPRACH ZARATHUSTRA',
    category: 'MIDDLE PERIOD',
    glyph: '↑',
    accent: '#ff704e',
    summary: '以诗性寓言讲述查拉图斯特拉下山、教导、失败与再度离去。“超人”、永恒轮回与自我克服在这里以形象而非体系出现，语言兼具《圣经》式节奏与讽刺锋芒。',
    quote: '“人是一根绳索，系在动物与超人之间——一根悬在深渊上的绳索。”',
    question: '一个意义不再由彼岸保证的人，如何为自己创造意义？'
  },
  beyond: {
    year: '1886',
    title: '善恶的彼岸',
    original: 'JENSEITS VON GUT UND BÖSE',
    category: 'LATE PERIOD',
    glyph: '∴',
    accent: '#b7a6ff',
    summary: '尼采对哲学家、真理意志和现代民主进行尖锐审视，提出不同价值等级并非自然事实，而有其生命条件。“视角主义”与“哲学家的偏见”在本书中尤为集中。',
    quote: '“假设真理是一个女人——那么所有哲学家是否都缺少理解她的必要手段？”',
    question: '我们追求真理时，追求的究竟是真理，还是确定性？'
  },
  genealogy: {
    year: '1887',
    title: '论道德的谱系',
    original: 'ZUR GENEALOGIE DER MORAL',
    category: 'LATE PERIOD',
    glyph: '⚖',
    accent: '#62d5be',
    summary: '三篇论文追溯善与恶、罪责与良心、禁欲理想的历史生成。尼采不是简单赞美强者，而是分析弱者如何在无力中通过“怨恨”重新定义价值，并让人自愿服从禁欲理想。',
    quote: '“人宁可意愿虚无，也不愿无意愿。”',
    question: '当反抗外部压迫的代价过高，人为何转身惩罚自己？'
  },
  wagner: {
    year: '1888',
    title: '瓦格纳事件',
    original: 'DER FALL WAGNER',
    category: 'LATE PERIOD',
    glyph: '♬',
    accent: '#e9d36f',
    summary: '晚期尼采以近乎残酷的方式清算与瓦格纳的复杂关系。问题不只在瓦格纳本人，而在艺术如何屈从民族主义、麻醉、戏剧崇拜与虚假的伟大。',
    quote: '“一个人最终必须与自己的过去决裂，如果他仍要成为自己。”',
    question: '一部作品让人沉醉，是否等同于让人更有力量？'
  },
  twilight: {
    year: '1889',
    title: '偶像的黄昏',
    original: 'GÖTZEN-DÄMMERUNG',
    category: 'LATE PERIOD',
    glyph: '⛏',
    accent: '#dfdef0',
    summary: '一部简短而锋利的“用锤子做哲学”的著作。尼采集中攻击苏格拉底、理性、道德、德国文化与他自己之前的偶像，同时以格言总结生命哲学。',
    quote: '“凡杀不死我的，使我更强大。”',
    question: '力量是否总能从创伤中生长？何时这句话会变成对伤害的美化？'
  },
  antichrist: {
    year: '1895',
    title: '敌基督',
    original: 'DER ANTICHRIST',
    category: 'POSTHUMOUSLY PUBLISHED',
    glyph: '✕',
    accent: '#f05a58',
    summary: '1888 年完成，1895 年才公开出版。尼采在此对基督教价值进行极端激烈的批判，矛头也包括由基督教道德延续出的世俗现代价值。文本修辞高度挑衅，需要连同其创作语境阅读。',
    quote: '“批判并不是一劳永逸地宣布某物错误，而是追问它如何获得权威。”',
    question: '一场批判如何避免自己成为新的教义？'
  },
  ecce: {
    year: '1908',
    title: '瞧，这个人',
    original: 'ECCE HOMO',
    category: 'POSTHUMOUSLY PUBLISHED',
    glyph: 'N',
    accent: '#c7a5ff',
    summary: '尼采在精神崩溃前不久写成的自传性文本。它以戏仿、夸张与自我神话重新叙述自己的生命和作品，是理解“尼采如何发明尼采”的关键材料，也让人重新警惕作者自述。',
    quote: '“我为什么如此智慧？我为什么如此聪明？我为什么能写出如此好的书？”',
    question: '一个人的自我叙事，究竟是解释自己，还是创造自己？'
  }
};

const modal = $('#bookModal');
const workCards = $$('.book-card');
const filterButtons = $$('.filter');
const workCount = $('#workCount');

function openBook(bookId) {
  const book = books[bookId];
  if (!book) return;
  $('#modalYear').textContent = book.year;
  $('#modalCategory').textContent = book.category;
  $('#modalGlyph').textContent = book.glyph;
  $('#modalTitle').textContent = book.title;
  $('#modalOriginal').textContent = book.original;
  $('#modalSummary').textContent = book.summary;
  $('#modalQuote').textContent = book.quote;
  $('#modalQuestion').textContent = book.question;
  $('.book-modal__aside').style.setProperty('--modal-accent', book.accent);
  if (typeof modal.showModal === 'function') modal.showModal();
  else modal.setAttribute('open', '');
  document.body.classList.add('is-locked');
}

function closeBook() {
  if (typeof modal.close === 'function') modal.close();
  else modal.removeAttribute('open');
  if (splashDismissed) document.body.classList.remove('is-locked');
}

workCards.forEach((card) => {
  card.addEventListener('click', () => openBook(card.dataset.book));
});

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const filter = button.dataset.filter;
    filterButtons.forEach((item) => item.classList.toggle('is-active', item === button));
    let visible = 0;
    workCards.forEach((card) => {
      const categories = card.dataset.category.split(' ');
      const show = filter === 'all' || categories.includes(filter);
      card.classList.toggle('is-filtered', !show);
      if (show) visible += 1;
    });
    workCount.textContent = String(visible).padStart(2, '0');
  });
});

$('#modalClose').addEventListener('click', closeBook);
modal.addEventListener('click', (event) => {
  if (event.target === modal) closeBook();
});
modal.addEventListener('cancel', (event) => {
  event.preventDefault();
  closeBook();
});

/* Thought constellation */
const ideas = {
  recurrence: {
    index: '01 / 06',
    original: 'EWIGE WIEDERKUNFT',
    symbol: '∞',
    title: '永恒轮回',
    lead: '不是宇宙学定律，而是一场足以改变生活姿态的思想实验。',
    body: '设想一个恶魔告诉你：这一生中的每一个痛苦、欢愉、荒诞与秘密都将无限次重演。尼采让这个问题检验一个人对生命的肯定程度。它不是要求你热爱一切伤害，而是追问：你是否愿意为此刻的选择承担无限重复的重量？',
    quote: '“你是否愿意再一次，并且无数次，活成现在的样子？”',
    caution: '《快乐的科学》第 341 节的表述首先是一个假设性场景；它是否也包含尼采的宇宙论主张，学界仍有争论。'
  },
  power: {
    index: '02 / 06',
    original: 'WILLE ZUR MACHT',
    symbol: '⚡',
    title: '权力意志',
    lead: '一种解释生命趋向的假说：生命不断组织、扩展并超越自身。',
    body: '尼采并不把它简单等同于统治他人的欲望。更关键的是形态创造、克服阻力与增强行动能力的倾向。这个概念的困难在于：许多最常被引用的文本来自身后编辑的笔记，早期版本更强烈地把它包装成一个形而上体系。',
    quote: '“生命的秘密，是它必须不断克服自己。”',
    caution: '“权力意志”不是尼采生前出版的一部完整同名著作。阅读时应区分笔记、编辑版本与后期重建。'
  },
  overman: {
    index: '03 / 06',
    original: 'ÜBERMENSCH',
    symbol: '↑',
    title: '超人',
    lead: '不是更强大的统治者，而是能够创造新价值的人之可能性。',
    body: '“人是一根绳索，系在动物与超人之间。”这里的“超人”不是种族或优生学理想，也不是漫画式的无敌英雄。它更像一个尚未到来的意义方向：人不再只由既有价值规定，而能承担自己的有限性，并创造新的生活形式。',
    quote: '“人是一根绳索，系在动物与超人之间。”',
    caution: 'Übermensch 常被译作“超人”，容易误导为生理或政治上的超级强者。请保留它作为文学隐喻的开放性。'
  },
  revaluation: {
    index: '04 / 06',
    original: 'UMWERTUNG ALLER WERTE',
    symbol: '⚒',
    title: '重估一切价值',
    lead: '不是抛弃所有尺度，而是追问尺度背后的生命条件。',
    body: '重估意味着让最高价值接受来源与后果的检验：它们是增强生命，还是否定感官、身体与生成？尼采要求的不只是换一套道德，更是理解价值如何被创造、维护，并在社会中被神圣化。',
    quote: '“价值不是从天而降的律令，而是生命作出的评价。”',
    caution: '重估不是价值虚无。它要求比盲从更严格的自我审查，也要求为自己的创造承担后果。'
  },
  perspectivism: {
    index: '05 / 06',
    original: 'PERSPEKTIVISMUS',
    symbol: '◉',
    title: '视角主义',
    lead: '没有脱离身体与立场的“上帝视角”，不等于所有解释同样正确。',
    body: '视角主义强调认识总从某个位置、需要与价值出发。看见更多视角，能够让判断更丰富，却不自动取消证据与责任。尼采真正质疑的是一种伪装成绝对中立、实际上却隐藏自身条件的看法。',
    quote: '“人们越是允许更多的眼睛观察同一事物，对它的概念就越完整。”',
    caution: '“没有事实，只有解释”常被归于尼采，但具体措辞与语境存在争议，不宜当作简单的相对主义口号。'
  },
  morality: {
    index: '06 / 06',
    original: 'GENEALOGIE DER MORAL',
    symbol: '⚖',
    title: '道德谱系',
    lead: '道德不是一块固定石碑，而是一部充满冲突的历史。',
    body: '尼采区分所谓“主人道德”与“奴隶道德”，不是要把人分为天生高低，而是分析不同价值评价模式：前者从自身丰盈出发肯定，后者可能从对强者的怨恨出发反向定义善。他尤其关注内疚、禁欲与自我惩罚如何把外部冲突转成内部秩序。',
    quote: '“人宁可意愿虚无，也不愿无意愿。”',
    caution: '“主人 / 奴隶道德”是分析工具，不是对现实群体的身份判定。把它政治化、种族化会背离文本的复杂修辞。'
  }
};

const ideaButtons = $$('.idea-node');
const ideaPanel = $('#ideaPanel');

function renderIdea(key) {
  const idea = ideas[key];
  if (!idea) return;
  ideaButtons.forEach((button) => button.classList.toggle('is-active', button.dataset.idea === key));
  ideaPanel.classList.remove('is-changing');
  requestAnimationFrame(() => {
    $('#ideaIndex').textContent = idea.index;
    $('#ideaOriginal').textContent = idea.original;
    $('#ideaSymbol').textContent = idea.symbol;
    $('#ideaTitle').textContent = idea.title;
    $('#ideaLead').textContent = idea.lead;
    $('#ideaBody').textContent = idea.body;
    $('#ideaQuote').textContent = idea.quote;
    $('#ideaCaution').textContent = idea.caution;
    ideaPanel.classList.add('is-changing');
  });
}

ideaButtons.forEach((button) => {
  button.addEventListener('click', () => renderIdea(button.dataset.idea));
});
renderIdea('recurrence');

/* Aphorism oracle */
const aphorisms = [
  { text: '“人是一根绳索，系在动物与超人之间——一根悬在深渊上的绳索。”', source: '《查拉图斯特拉如是说》' },
  { text: '“一个人知道自己为什么而活，就可以忍受任何一种生活。”', source: '《偶像的黄昏》' },
  { text: '“你必须准备在自己身上燃烧：如果你不先化为灰烬，怎能成为光？”', source: '《快乐的科学》' },
  { text: '“凡杀不死我的，使我更强大。”', source: '《偶像的黄昏》' },
  { text: '“没有音乐的生活是一种错误。”', source: '《偶像的黄昏》' },
  { text: '“谁与怪物战斗，应当小心自己不要变成怪物。”', source: '《善恶的彼岸》' },
  { text: '“一个人的成熟，是重新找回儿时游戏时的认真。”', source: '《善恶的彼岸》' },
  { text: '“我们飞得越高，在那些不会飞的人眼中就越渺小。”', source: '《查拉图斯特拉如是说》' }
];

const aphorismText = $('#aphorismText');
const aphorismSource = $('#aphorismSource');
const aphorismCount = $('#aphorismCount');
let aphorismIndex = 0;

$('#shuffleAphorism').addEventListener('click', () => {
  let next = aphorismIndex;
  while (next === aphorismIndex) next = Math.floor(Math.random() * aphorisms.length);
  aphorismIndex = next;
  aphorismText.classList.remove('is-changing');
  requestAnimationFrame(() => {
    aphorismText.textContent = aphorisms[next].text;
    aphorismSource.textContent = aphorisms[next].source;
    aphorismCount.textContent = `${String(next + 1).padStart(2, '0')} — ${String(aphorisms.length).padStart(2, '0')}`;
    aphorismText.classList.add('is-changing');
  });
});

/* Credits shortcut */
$('#openCredits').addEventListener('click', () => {
  routeTo('legacy', true);
  window.setTimeout(() => {
    $('.sources').scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
  }, 180);
});

/* Initialize current route without forcing a scroll on first paint */
pages.forEach((page) => {
  const isActive = page.dataset.page === routeName();
  page.hidden = !isActive;
  page.classList.toggle('is-active', isActive);
});
$$('.site-nav a').forEach((link) => {
  const active = link.dataset.route === routeName();
  link.classList.toggle('is-active', active);
  if (active) link.setAttribute('aria-current', 'page');
});
