import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from './supabaseClient';
import QrCodeModal from './components/QrCodeModal';
import MessageBoard from './components/MessageBoard';
import IntakeModal from './components/IntakeModal';
import Starfield from './components/Starfield';
import { AdvisorRecord, CategoryItem, normalizeAdvisor, normalizeCategory, normalizeStringArray } from './dataModel';

const BACKGROUND_THEMES = [
  {
    id: 'deep',
    label: '星河树洞',
    bg: '#050b1c',
    bg2: '#12335b',
    bg3: '#130825',
    glowA: 'rgba(56, 189, 248, 0.28)',
    glowB: 'rgba(168, 85, 247, 0.26)',
    glowC: 'rgba(250, 204, 21, 0.17)',
    grid: 'rgba(147, 197, 253, 0.07)',
    starColors: ['rgba(255,255,255,', 'rgba(125,211,252,', 'rgba(196,181,253,', 'rgba(253,224,71,'],
  },
  {
    id: 'aurora',
    label: '极光湖洞',
    bg: '#031617',
    bg2: '#0f3b43',
    bg3: '#100b2b',
    glowA: 'rgba(45, 212, 191, 0.31)',
    glowB: 'rgba(34, 197, 94, 0.2)',
    glowC: 'rgba(186, 230, 253, 0.18)',
    grid: 'rgba(153, 246, 228, 0.065)',
    starColors: ['rgba(240,253,250,', 'rgba(94,234,212,', 'rgba(187,247,208,', 'rgba(216,180,254,'],
  },
  {
    id: 'rose',
    label: '玫瑰星轨',
    bg: '#180615',
    bg2: '#45163b',
    bg3: '#120d2b',
    glowA: 'rgba(244, 114, 182, 0.31)',
    glowB: 'rgba(251, 191, 36, 0.17)',
    glowC: 'rgba(129, 140, 248, 0.22)',
    grid: 'rgba(251, 207, 232, 0.065)',
    starColors: ['rgba(255,241,242,', 'rgba(251,207,232,', 'rgba(253,186,116,', 'rgba(199,210,254,'],
  },
  {
    id: 'moon',
    label: '月相神殿',
    bg: '#11141d',
    bg2: '#273246',
    bg3: '#21170d',
    glowA: 'rgba(250, 250, 249, 0.19)',
    glowB: 'rgba(251, 191, 36, 0.21)',
    glowC: 'rgba(96, 165, 250, 0.16)',
    grid: 'rgba(254, 243, 199, 0.058)',
    starColors: ['rgba(255,251,235,', 'rgba(254,240,138,', 'rgba(251,191,36,', 'rgba(186,230,253,'],
  },
  {
    id: 'ink',
    label: '雾林萤火',
    bg: '#020b0f',
    bg2: '#0e2f2b',
    bg3: '#211007',
    glowA: 'rgba(20, 184, 166, 0.22)',
    glowB: 'rgba(234, 179, 8, 0.2)',
    glowC: 'rgba(134, 239, 172, 0.13)',
    grid: 'rgba(134, 239, 172, 0.05)',
    starColors: ['rgba(240,253,244,', 'rgba(250,204,21,', 'rgba(94,234,212,', 'rgba(187,247,208,'],
  },
] as const;

const TEXT = {
  brand: '留子树洞',
  tagline: '',
  intro: '海外留学生专属的情感避风港。无论是异地恋的煎熬、无法言说的 Crush、还是亲朋关系&学业工作，连线懂经过平台验证的玄学导师，从另一个维度解答内心的疑惑。',
  all: '全部',
  loading: '正在加载顾问数据...',
  yearsPrefix: '从业 ',
  yearsSuffix: ' 年',
  scorePrefix: '评分 ',
  reviewSuffix: ' 条评价',
  categoryPrefix: '擅长技法：',
  categoryUnset: '未设置',
  priceSuffix: '/分钟',
  close: '关闭',
  name: '姓名',
  title: '头衔',
  experience: '从业年限',
  score: '评分',
  price: '价格',
  book: '预约咨询',
  bio: '个人简介',
  bioEmpty: '暂无简介',
  topics: '擅长话题',
  certificates: '资质证书',
  gallery: '老师日常与修学记录',
  galleryIntro: '像浏览详情页一样看看老师平时占卜、修学、备课与真实工作状态。',
  galleryEmpty: '当前老师还没有上传日常照片，后台上传后会展示在这里。',
  certAltPrefix: '证书 ',
  reviews: '用户评价',
  reviewScorePrefix: '评分：',
  certDetail: '图片详情',
};

const createDemoGalleryImage = (title: string, subtitle: string, accent: string, accent2: string) => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="820" viewBox="0 0 1200 820">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#11071f"/>
          <stop offset="52%" stop-color="#20143a"/>
          <stop offset="100%" stop-color="#060913"/>
        </linearGradient>
        <radialGradient id="glow" cx="28%" cy="18%" r="62%">
          <stop offset="0%" stop-color="${accent}" stop-opacity="0.68"/>
          <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
        </radialGradient>
        <filter id="soft">
          <feGaussianBlur stdDeviation="18"/>
        </filter>
      </defs>
      <rect width="1200" height="820" fill="url(#bg)"/>
      <rect width="1200" height="820" fill="url(#glow)"/>
      <circle cx="930" cy="170" r="210" fill="${accent2}" opacity="0.18" filter="url(#soft)"/>
      <circle cx="245" cy="610" r="180" fill="${accent}" opacity="0.15" filter="url(#soft)"/>
      <g opacity="0.34">
        <path d="M110 160h980M110 310h980M110 460h980M110 610h980" stroke="#fff" stroke-opacity="0.13"/>
        <path d="M200 90v640M390 90v640M580 90v640M770 90v640M960 90v640" stroke="#fff" stroke-opacity="0.08"/>
      </g>
      <g transform="translate(150 130)">
        <rect x="0" y="0" width="900" height="560" rx="44" fill="#070b16" opacity="0.52" stroke="#fff" stroke-opacity="0.18"/>
        <circle cx="210" cy="245" r="132" fill="none" stroke="${accent}" stroke-width="4" opacity="0.8"/>
        <circle cx="210" cy="245" r="88" fill="none" stroke="#fff" stroke-width="2" opacity="0.28"/>
        <path d="M210 90l22 100 98 36-98 34-22 102-22-102-98-34 98-36z" fill="${accent2}" opacity="0.82"/>
        <rect x="430" y="104" width="315" height="82" rx="24" fill="#fff" opacity="0.1"/>
        <rect x="430" y="222" width="360" height="34" rx="17" fill="#fff" opacity="0.16"/>
        <rect x="430" y="282" width="280" height="34" rx="17" fill="#fff" opacity="0.11"/>
        <rect x="430" y="342" width="330" height="34" rx="17" fill="#fff" opacity="0.09"/>
      </g>
      <text x="92" y="96" fill="#fff" font-size="38" font-family="KaiTi, STKaiti, serif" font-weight="700">${title}</text>
      <text x="94" y="148" fill="#d8c7ff" font-size="24" font-family="KaiTi, STKaiti, serif">${subtitle}</text>
      <text x="94" y="754" fill="#bda7ff" font-size="22" font-family="KaiTi, STKaiti, serif">OnlyScry 本地示例图 · 后台上传真实照片后会替换</text>
    </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const DEMO_GALLERY_ITEMS = [
  {
    title: '今日占卜桌面',
    caption: '晚间咨询前的牌阵准备，卡牌、星盘和记录本都在手边。',
    time: '今天 21:36',
    image: createDemoGalleryImage('占卜桌面', '卡牌、星盘与记录本形成真实咨询现场', '#a855f7', '#facc15'),
  },
  {
    title: '修学笔记整理',
    caption: '复盘近期课程，把关系议题和雷诺曼牌意重新归类。',
    time: '昨天 18:12',
    image: createDemoGalleryImage('修学笔记', '老师日常学习、课程记录与方法复盘', '#38bdf8', '#c084fc'),
  },
  {
    title: '线上研修记录',
    caption: '参加占星案例研讨，补充职业、学业方向的判断框架。',
    time: '3 天前',
    image: createDemoGalleryImage('课程研修', '线下/线上研修、证书课程、协会学习记录', '#34d399', '#fde68a'),
  },
  {
    title: '咨询前备课',
    caption: '根据来访问题整理问题树，避免咨询时只给模糊答案。',
    time: '5 天前',
    image: createDemoGalleryImage('备课记录', '咨询前准备、案例整理和工具校准过程', '#fb7185', '#93c5fd'),
  },
];

const LOCAL_GALLERY_STORAGE_PREFIX = 'onlyscry.localGallery.';

const readLocalGalleryImages = (advisorId?: number | string): string[] => {
  if (!advisorId || typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(`${LOCAL_GALLERY_STORAGE_PREFIX}${advisorId}`);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
  } catch {
    return [];
  }
};

const mergeLocalGallery = (advisor: AdvisorRecord): AdvisorRecord => {
  const localGalleryImages = readLocalGalleryImages(advisor.id);
  return localGalleryImages.length ? { ...advisor, galleryImages: localGalleryImages } : advisor;
};

const GALLERY_CAPTION_SEPARATOR = '|||';
const MAX_GALLERY_CAPTION_LENGTH = 200;

const limitGalleryCaption = (caption: string) => caption.trim().slice(0, MAX_GALLERY_CAPTION_LENGTH);

const parseGalleryEntry = (entry: string, index: number) => {
  const [image = '', ...captionParts] = entry.split(GALLERY_CAPTION_SEPARATOR);
  const caption = limitGalleryCaption(captionParts.join(GALLERY_CAPTION_SEPARATOR));

  return {
    image: image.trim(),
    title: `修行日常 ${index + 1}`,
    caption: caption || '老师上传的真实日常、修学或占卜场景照片。',
    time: '来自后台上传',
  };
};

function App() {
  const [advisors, setAdvisors] = useState<AdvisorRecord[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedAdvisor, setSelectedAdvisor] = useState<AdvisorRecord | null>(null);
  const [selectedCertificate, setSelectedCertificate] = useState<string | null>(null);
  const [selectedCertificateIndex, setSelectedCertificateIndex] = useState<number | null>(null);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showMessageBoard, setShowMessageBoard] = useState(false);
  const [showIntake, setShowIntake] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [backgroundThemeId, setBackgroundThemeId] = useState<(typeof BACKGROUND_THEMES)[number]['id']>('deep');

  const activeBackground = BACKGROUND_THEMES.find((theme) => theme.id === backgroundThemeId) ?? BACKGROUND_THEMES[0];

  useEffect(() => {
    const CACHE_ADVISORS = 'liuzi_cache_advisors';
    const CACHE_CATEGORIES = 'liuzi_cache_categories';

    const readCache = (key: string) => {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        return JSON.parse(raw);
      } catch { return null; }
    };

    const writeCache = (key: string, data: unknown) => {
      try { localStorage.setItem(key, JSON.stringify(data)); } catch { /* full */ }
    };

    const fetchRemote = async () => {
      const [aRes, cRes] = await Promise.all([
        supabase.from('advisors').select('*').order('sort_order', { ascending: true }).order('id', { ascending: true }),
        supabase.from('categories').select('*').order('id', { ascending: true }),
      ]);
      if (aRes.error) throw aRes.error;
      if (cRes.error) throw cRes.error;
      return { advisorsRaw: aRes.data || [], categoriesRaw: cRes.data || [] };
    };

    const init = async () => {
      const cachedA = readCache(CACHE_ADVISORS);
      const cachedC = readCache(CACHE_CATEGORIES);

      // 有缓存时先渲染本地数据，再静默刷新远程数据，减少首屏等待。
      if (cachedA?.length && cachedC?.length) {
        setAdvisors(cachedA.map(normalizeAdvisor).map(mergeLocalGallery));
        setCategories(cachedC.map(normalizeCategory));
        setLoading(false);

        fetchRemote().then(({ advisorsRaw, categoriesRaw }) => {
          writeCache(CACHE_ADVISORS, advisorsRaw);
          writeCache(CACHE_CATEGORIES, categoriesRaw);
          setAdvisors(advisorsRaw.map(normalizeAdvisor).map(mergeLocalGallery));
          setCategories(categoriesRaw.map(normalizeCategory));
        }).catch((err) => console.warn('后台刷新失败:', err));
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const { advisorsRaw, categoriesRaw } = await fetchRemote();
        writeCache(CACHE_ADVISORS, advisorsRaw);
        writeCache(CACHE_CATEGORIES, categoriesRaw);
        setAdvisors(advisorsRaw.map(normalizeAdvisor).map(mergeLocalGallery));
        setCategories(categoriesRaw.map(normalizeCategory));
      } catch (err) {
        console.error('Error loading page data:', err);
        setError('加载顾问数据失败，请检查网络连接后重试');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    if (selectedAdvisor || selectedCertificate) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = previousOverflow;
      };
    }

    document.body.style.overflow = previousOverflow;
    return undefined;
  }, [selectedAdvisor, selectedCertificate]);

  useEffect(() => {
    const INTERVAL = 4 * 60 * 1000;
    const ping = () => supabase.from('advisors').select('id', { count: 'exact', head: true }).limit(1);
    const timer = setInterval(ping, INTERVAL);
    return () => clearInterval(timer);
  }, []);

  const filteredAdvisors = useMemo(() =>
    selectedCategory === 'All'
      ? advisors
      : advisors.filter((advisor) => (advisor.category || '').includes(selectedCategory)),
    [advisors, selectedCategory]
  );

  const stripEn = (s: string) => s.replace(/\s*[\(\uff08].*?[\)\uff09]\s*$/g, '').trim();
  const categoryMap = useMemo(() => {
    const map: Record<string, string> = {};
    categories.forEach(c => { map[c.value] = stripEn(c.label); });
    return map;
  }, [categories]);

  const closeAdvisorDetail = useCallback(() => {
    setSelectedAdvisor(null);
    setSelectedCertificate(null);
    setSelectedCertificateIndex(null);
    setShowQrModal(false);
    setShowMessageBoard(false);
  }, []);

  const closeImageViewer = useCallback(() => {
    setSelectedCertificate(null);
    setSelectedCertificateIndex(null);
  }, []);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;

      if (selectedCertificate) {
        closeImageViewer();
        return;
      }

      if (selectedAdvisor) {
        closeAdvisorDetail();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [closeAdvisorDetail, closeImageViewer, selectedAdvisor, selectedCertificate]);

  const hasUploadedGallery = Boolean(selectedAdvisor?.galleryImages.length);
  const usingDemoGallery = Boolean(selectedAdvisor && !selectedAdvisor.galleryImages.length);
  const galleryItems = selectedAdvisor
    ? (
      hasUploadedGallery
        ? selectedAdvisor.galleryImages.map((image, index) => ({
            image,
            title: `修学记录 ${index + 1}`,
            caption: '老师上传的真实日常、修学或占卜场景照片。',
            time: '来自后台上传',
          }))
        : DEMO_GALLERY_ITEMS
    )
    : [];
  const galleryImages = galleryItems.map((item) => item.image.split(GALLERY_CAPTION_SEPARATOR)[0]);
  const activeGalleryItem = galleryItems[Math.min(activeGalleryIndex, Math.max(galleryItems.length - 1, 0))];
  const activeGalleryImage = activeGalleryItem?.image;
  const feedItems = selectedAdvisor
    ? (
      hasUploadedGallery
        ? selectedAdvisor.galleryImages.map(parseGalleryEntry).filter((item) => item.image)
        : DEMO_GALLERY_ITEMS
    )
    : [];
  const certificateViewerImages = selectedAdvisor?.certificates ?? [];
  const isCertificateViewer = selectedCertificateIndex !== null && certificateViewerImages.length > 0;
  const activeCertificateIndex = isCertificateViewer ? Math.min(selectedCertificateIndex, certificateViewerImages.length - 1) : 0;

  const showCertificateImage = useCallback((index: number) => {
    const nextImage = certificateViewerImages[index];
    if (!nextImage) return;

    setSelectedCertificate(nextImage);
    setSelectedCertificateIndex(index);
  }, [certificateViewerImages]);

  useEffect(() => {
    if (!isCertificateViewer || !certificateViewerRef.current) return;

    const track = certificateViewerRef.current;
    track.scrollTo({
      left: track.clientWidth * activeCertificateIndex,
      behavior: 'smooth',
    });
  }, [activeCertificateIndex, isCertificateViewer]);

  const handleCertificateViewerScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    if (!isCertificateViewer || !selectedAdvisor?.certificates.length) return;

    const track = event.currentTarget;
    const nextIndex = Math.round(track.scrollLeft / Math.max(track.clientWidth, 1));
    const nextImage = selectedAdvisor.certificates[nextIndex];
    if (!nextImage || nextIndex === selectedCertificateIndex) return;

    setSelectedCertificate(nextImage);
    setSelectedCertificateIndex(nextIndex);
  }, [isCertificateViewer, selectedAdvisor?.certificates, selectedCertificateIndex]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [filteredAdvisors, loading]);

  const heroRef = useRef<HTMLElement>(null);
  const certificateViewerRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  useEffect(() => {
    if (isMobile) return;
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isMobile]);

  const handleCardMouse = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width * 100).toFixed(0);
    const y = ((e.clientY - rect.top) / rect.height * 100).toFixed(0);
    e.currentTarget.style.setProperty('--mouse-x', `${x}%`);
    e.currentTarget.style.setProperty('--mouse-y', `${y}%`);
  }, []);

  return (
    <div
      className="site-shell relative min-h-screen text-slate-100"
      style={{
        '--site-bg': activeBackground.bg,
        '--site-bg-2': activeBackground.bg2,
        '--site-bg-3': activeBackground.bg3,
        '--site-glow-a': activeBackground.glowA,
        '--site-glow-b': activeBackground.glowB,
        '--site-glow-c': activeBackground.glowC,
        '--site-grid': activeBackground.grid,
      } as React.CSSProperties}
    >
      <div className="site-background" aria-hidden="true" />

      <Starfield colors={activeBackground.starColors} />

      <div className="background-switcher" aria-label="背景方案切换">
        <span>背景</span>
        <div>
          {BACKGROUND_THEMES.map((theme) => (
            <button
              key={theme.id}
              type="button"
              onClick={() => setBackgroundThemeId(theme.id)}
              className={backgroundThemeId === theme.id ? 'active' : ''}
              aria-pressed={backgroundThemeId === theme.id}
            >
              {theme.label}
            </button>
          ))}
        </div>
      </div>

      <header
        ref={heroRef}
        className="aurora-bg relative z-10 border-b border-purple-500/10"
        style={!isMobile ? { transform: `translateY(${scrollY * 0.3}px)`, willChange: 'transform' } : undefined}
      >
        <div className="mx-auto max-w-6xl px-4 pb-3 pt-4 md:pb-4 md:pt-6">
          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <span className="text-2xl drop-shadow-[0_0_12px_rgba(147,51,234,0.6)] md:text-3xl">🔮</span>
              <h1 className="text-glow text-2xl font-bold tracking-wide md:text-4xl">{TEXT.brand}</h1>
            </div>
            <button
              onClick={() => setShowIntake(true)}
              className="pulse-glow w-fit rounded-full border border-purple-400/40 bg-purple-600/20 px-4 py-2 text-sm font-medium text-purple-200 backdrop-blur-sm transition hover:bg-purple-600/35 hover:text-white sm:ml-auto"
            >
              ✨ 抽个塔罗牌
            </button>
          </div>
          {TEXT.tagline && <p className="mt-0.5 text-sm text-purple-200/80 md:text-base">{TEXT.tagline}</p>}
          <p className="mt-2 max-w-3xl text-sm leading-5 text-slate-300/90">{TEXT.intro}</p>

          <div className="glow-divider mt-3" />
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-6xl px-4 py-2">
        <div className="flex flex-wrap gap-1.5">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.value)}
              className={`category-pill rounded-full border px-3 py-1.5 text-sm font-medium backdrop-blur-sm ${
                selectedCategory === category.value
                  ? 'active border-purple-500 bg-purple-600 text-white'
                  : 'border-slate-700/60 bg-slate-900/50 text-slate-300 hover:border-purple-400/50 hover:text-white'
              }`}
            >
              {stripEn(category.label)}
            </button>
          ))}
        </div>
      </section>

      <main className="relative z-10 mx-auto max-w-6xl px-4 pb-8 md:pb-10">
        {error && (
          <div className="mb-4 rounded-2xl border border-red-800/50 bg-red-900/20 px-5 py-5 text-center">
            <p className="text-red-300">{error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 rounded-full border border-red-600 px-5 py-2 text-sm text-red-300 transition hover:bg-red-600 hover:text-white"
            >
              重新加载
            </button>
          </div>
        )}
        {loading ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 px-6 py-10 text-center text-slate-400">
            {TEXT.loading}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredAdvisors.map((advisor) => {
              const tags = normalizeStringArray(advisor.specialties_zh.length ? advisor.specialties_zh : advisor.specialties);

              return (
                <button
                  key={advisor.id}
                  type="button"
                  onClick={() => setSelectedAdvisor(advisor)}
                  onMouseMove={handleCardMouse}
                  className="glow-card fade-up rounded-2xl border border-slate-700/40 bg-slate-900/60 p-4 text-left backdrop-blur-sm"
                >
                  <div className="relative z-10 flex items-start gap-3">
                    <img
                      src={advisor.imageUrl}
                      alt={advisor.name_zh || advisor.name}
                      loading="lazy"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      className="h-[72px] w-[72px] rounded-xl object-cover ring-1 ring-purple-500/20"
                    />
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-lg font-bold text-white">{advisor.name_zh || advisor.name}</h2>
                      <p className="mt-1 text-sm text-purple-200/90">{advisor.title_zh || advisor.title}</p>
                      <p className="mt-2 text-xs text-slate-400">
                        {TEXT.yearsPrefix}{advisor.yearsExperience}{TEXT.yearsSuffix} · {TEXT.scorePrefix}{advisor.rating.toFixed(1)} · {advisor.reviewCount}{TEXT.reviewSuffix}
                      </p>
                    </div>
                  </div>

                  <div className="relative z-10 mt-3 flex flex-wrap gap-1.5">
                    {tags.slice(0, 4).map((tag) => (
                      <span key={tag} className="rounded-full border border-purple-400/20 bg-purple-500/10 px-2.5 py-0.5 text-xs text-purple-200">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="relative z-10 mt-3 flex items-start gap-2 border-t border-slate-700/30 pt-3">
                    <span className="min-w-0 flex-1 break-words text-sm leading-5 text-slate-400">{TEXT.categoryPrefix}{advisor.category ? advisor.category.split(',').map(c => categoryMap[c.trim()] || c.trim()).join('、') : TEXT.categoryUnset}</span>
                    <span className="shrink-0 whitespace-nowrap text-base font-semibold text-purple-300">${advisor.pricePerMinute.toFixed(2)}{TEXT.priceSuffix}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
        {!loading && !error && filteredAdvisors.length === 0 && (
          <div className="py-12 text-center text-slate-400">
            <p className="text-lg">该分类暂无顾问</p>
            <button
              type="button"
              onClick={() => setSelectedCategory('All')}
              className="mt-4 rounded-full border border-slate-600 px-5 py-2 text-sm transition hover:border-slate-400 hover:text-white"
            >
              查看全部顾问
            </button>
          </div>
        )}
      </main>

      {selectedAdvisor && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-black/70 backdrop-blur-sm sm:p-4"
          style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
        >
          <div className="relative mx-auto min-h-screen w-full max-w-5xl rounded-t-3xl border border-slate-800 bg-slate-950 shadow-2xl sm:my-4 sm:min-h-0 sm:rounded-3xl">
            <button
              type="button"
              onClick={closeAdvisorDetail}
              className="absolute right-4 top-4 z-20 rounded-full bg-black/60 backdrop-blur-sm border border-slate-600 px-3 py-1.5 text-sm font-medium text-white shadow-lg hover:bg-black/80"
            >
              ✕ {TEXT.close}
            </button>

            <div className="grid gap-8 p-6 md:grid-cols-[280px_1fr] md:p-8">
              <div>
                <img
                  src={selectedAdvisor.imageUrl}
                  alt={selectedAdvisor.name_zh || selectedAdvisor.name}
                  className="h-64 w-full rounded-3xl object-cover"
                />
                <div className="mt-5 space-y-3 rounded-2xl border border-slate-800 bg-slate-900 p-4 text-sm text-slate-300">
                  <div className="flex justify-between">
                    <span>{TEXT.name}</span>
                    <span className="font-medium text-white">{selectedAdvisor.name_zh || selectedAdvisor.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{TEXT.title}</span>
                    <span className="font-medium text-white">{selectedAdvisor.title_zh || selectedAdvisor.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{TEXT.experience}</span>
                    <span className="font-medium text-white">{selectedAdvisor.yearsExperience}{TEXT.yearsSuffix}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{TEXT.score}</span>
                    <span className="font-medium text-white">{selectedAdvisor.rating.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{TEXT.price}</span>
                    <span className="font-medium text-purple-300">${selectedAdvisor.pricePerMinute.toFixed(2)}{TEXT.priceSuffix}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMessageBoard(true)}
                  className="mt-5 w-full rounded-2xl bg-purple-600 px-4 py-3 font-semibold text-white transition hover:bg-purple-500"
                >
                  💬 给TA留言
                </button>
                {selectedAdvisor.bookingQrUrl && (
                  <button
                    type="button"
                    onClick={() => setShowQrModal(true)}
                    className="mt-3 w-full rounded-2xl border border-purple-500/30 bg-purple-500/10 px-4 py-3 font-semibold text-purple-300 transition hover:bg-purple-500/20"
                  >
                    {TEXT.book}
                  </button>
                )}
              </div>

              <div>
                <h2 className="text-3xl font-bold text-white">{selectedAdvisor.name_zh || selectedAdvisor.name}</h2>
                <p className="mt-2 text-lg text-purple-200">{selectedAdvisor.title_zh || selectedAdvisor.title}</p>

                <section className="mt-6">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">{TEXT.bio}</h3>
                  <p className="mt-3 leading-7 text-slate-300">
                    {selectedAdvisor.bio_zh || selectedAdvisor.bio || TEXT.bioEmpty}
                  </p>
                </section>

                <section className="mt-8">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">{TEXT.topics}</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {normalizeStringArray(selectedAdvisor.specialties_zh.length ? selectedAdvisor.specialties_zh : selectedAdvisor.specialties).map((tag) => (
                      <span key={tag} className="rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-sm text-purple-200">
                        {tag}
                      </span>
                    ))}
                  </div>
                </section>

                {selectedAdvisor.certificates.length > 0 && (
                  <section className="mt-8">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">{TEXT.certificates}</h3>
                    <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3">
                      {selectedAdvisor.certificates.map((certificate, index) => (
                        <button
                          key={`${certificate}-${index}`}
                          type="button"
                          onClick={() => showCertificateImage(index)}
                          className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900"
                        >
                          <img src={certificate} alt={`${TEXT.certAltPrefix}${index + 1}`} className="h-32 w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </div>

            {feedItems.length > 0 && (
              <section className="border-t border-slate-800/80 px-4 py-7 sm:px-6 md:px-8">
                <div className="mx-auto mb-5 flex max-w-2xl items-end justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                      {usingDemoGallery ? '示例朋友圈' : '老师朋友圈'}
                    </h3>
                    <p className="mt-2 text-sm text-slate-500">
                      {usingDemoGallery ? '本地示例动态，后台上传真实照片后会自动替换。' : '像朋友圈一样浏览老师的日常、修学和占卜记录。'}
                    </p>
                  </div>
                  <span className="rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs text-purple-200">
                    共 {galleryItems.length} 条
                  </span>
                </div>
                <div className="mx-auto max-w-2xl divide-y divide-slate-800/80 rounded-3xl border border-slate-800/90 bg-slate-950/60 px-4 py-2 sm:px-5">
                  {feedItems.map((item, index) => (
                    <article key={`${item.image}-detail-${index}`} className="py-5">
                      <div className="min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <h4 className="min-w-0 line-clamp-1 text-base font-semibold text-white">{item.title}</h4>
                          <span className="shrink-0 pt-1 text-xs text-slate-500">{item.time}</span>
                        </div>
                        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-slate-300">{limitGalleryCaption(item.caption)}</p>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCertificate(item.image);
                            setSelectedCertificateIndex(null);
                          }}
                          className="group mt-3 block w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 text-left sm:w-[72%]"
                        >
                          <img
                            src={item.image}
                            alt={`${usingDemoGallery ? '示例照片' : '详情照片'}${index + 1}`}
                            className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                          />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      )}

      <QrCodeModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        imageUrl={selectedAdvisor?.bookingQrUrl || ''}
        advisorName={selectedAdvisor?.name_zh || selectedAdvisor?.name || ''}
      />

      {showMessageBoard && selectedAdvisor && (
        <MessageBoard
          advisorId={selectedAdvisor.id!}
          advisorName={selectedAdvisor.name_zh || selectedAdvisor.name}
          bookingQrUrl={selectedAdvisor.bookingQrUrl}
          onClose={() => setShowMessageBoard(false)}
        />
      )}

      {selectedCertificate && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
          <div className="relative flex max-h-[92vh] w-full max-w-5xl flex-col items-center justify-center">
            <button
              type="button"
              onClick={closeImageViewer}
              className="absolute right-2 top-2 z-20 rounded-full border border-white/20 bg-black/70 px-3 py-1 text-sm text-white shadow-lg backdrop-blur hover:bg-black"
            >
              {TEXT.close}
            </button>

            {isCertificateViewer ? (
              <>
                <div className="mb-3 rounded-full border border-white/15 bg-black/50 px-3 py-1 text-xs text-slate-200">
                  证书 {activeCertificateIndex + 1}/{certificateViewerImages.length}
                </div>
                <div
                  ref={certificateViewerRef}
                  onScroll={handleCertificateViewerScroll}
                  className="flex w-full snap-x snap-mandatory overflow-x-auto scroll-smooth rounded-3xl md:overflow-hidden"
                >
                  {certificateViewerImages.map((certificate, index) => (
                    <div key={`${certificate}-viewer-${index}`} className="flex min-w-full snap-center items-center justify-center px-1">
                      <img
                        src={certificate}
                        alt={`${TEXT.certAltPrefix}${index + 1}`}
                        className="max-h-[82vh] rounded-2xl object-contain shadow-2xl ring-1 ring-white/10"
                      />
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <img src={selectedCertificate} alt={TEXT.certDetail} className="max-h-[90vh] rounded-2xl object-contain" />
            )}
          </div>
        </div>
      )}

      {showIntake && !loading && advisors.length > 0 && (
        <IntakeModal
          advisors={advisors}
          onClose={() => setShowIntake(false)}
          onSelectAdvisor={(advisor) => {
            setSelectedAdvisor(advisor);
            setShowIntake(false);
          }}
        />
      )}
    </div>
  );
}

export default App;
