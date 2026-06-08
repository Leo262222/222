import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from './supabaseClient';
import QrCodeModal from './components/QrCodeModal';
import MessageBoard from './components/MessageBoard';
import IntakeModal from './components/IntakeModal';
import Starfield from './components/Starfield';
import { AdvisorRecord, CategoryItem, normalizeAdvisor, normalizeCategory, normalizeStringArray } from './dataModel';

const TEXT = {
  brand: '留子树洞',
  tagline: '树洞藏秘密，神谕断情关。',
  intro: '留子专属的情感避风港。无论是异地恋的煎熬、无法言说的 Crush、还是亲朋关系&学业工作，连线懂经过平台验证的玄学导师，从另一个维度解答内心的疑惑。',
  all: '全部',
  loading: '正在加载顾问数据...',
  yearsPrefix: '从业 ',
  yearsSuffix: ' 年',
  scorePrefix: '评分 ',
  reviewSuffix: ' 条评价',
  categoryPrefix: '所属分类：',
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
  certAltPrefix: '证书 ',
  reviews: '用户评价',
  reviewScorePrefix: '评分：',
  certDetail: '证书详情',
};

function App() {
  const [advisors, setAdvisors] = useState<AdvisorRecord[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedAdvisor, setSelectedAdvisor] = useState<AdvisorRecord | null>(null);
  const [selectedCertificate, setSelectedCertificate] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showMessageBoard, setShowMessageBoard] = useState(false);
  const [showIntake, setShowIntake] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

      // ✅ 有缓存 → 立刻渲染（<50ms），不等 Supabase
      if (cachedA?.length && cachedC?.length) {
        setAdvisors(cachedA.map(normalizeAdvisor));
        setCategories(cachedC.map(normalizeCategory));
        setLoading(false);

        // 后台静默刷新（用户无感）
        fetchRemote().then(({ advisorsRaw, categoriesRaw }) => {
          writeCache(CACHE_ADVISORS, advisorsRaw);
          writeCache(CACHE_CATEGORIES, categoriesRaw);
          setAdvisors(advisorsRaw.map(normalizeAdvisor));
          setCategories(categoriesRaw.map(normalizeCategory));
        }).catch((err) => console.warn('后台刷新失败:', err));
        return;
      }

      // 无缓存 → 正常加载（首次访问）
      try {
        setLoading(true);
        setError(null);
        const { advisorsRaw, categoriesRaw } = await fetchRemote();
        writeCache(CACHE_ADVISORS, advisorsRaw);
        writeCache(CACHE_CATEGORIES, categoriesRaw);
        setAdvisors(advisorsRaw.map(normalizeAdvisor));
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
    if (selectedAdvisor || selectedCertificate) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }

    document.body.style.overflow = 'unset';
    return undefined;
  }, [selectedAdvisor, selectedCertificate]);

  // ✅ 前端保活：用户在线时每 4 分钟轻量 ping Supabase，防止休眠
  useEffect(() => {
    const INTERVAL = 4 * 60 * 1000;
    const ping = () => supabase.from('advisors').select('id', { count: 'exact', head: true }).limit(1);
    const timer = setInterval(ping, INTERVAL);
    return () => clearInterval(timer);
  }, []);

  // ✅ useMemo 缓存过滤结果，避免每次渲染重新计算
  const filteredAdvisors = useMemo(() =>
    selectedCategory === 'All'
      ? advisors
      : advisors.filter((advisor) => (advisor.category || '').includes(selectedCategory)),
    [advisors, selectedCategory]
  );

  // ✅ 分类英文标识 → 中文名称映射
  const stripEn = (s: string) => s.replace(/\s*[\(\uff08].*?[\)\uff09]\s*$/g, '').trim();
  const categoryMap = useMemo(() => {
    const map: Record<string, string> = {};
    categories.forEach(c => { map[c.value] = stripEn(c.label); });
    return map;
  }, [categories]);

  // ✅ useCallback 缓存关闭函数，避免子组件不必要重渲染
  const closeAdvisorDetail = useCallback(() => {
    setSelectedAdvisor(null);
    setShowQrModal(false);
    setShowMessageBoard(false);
  }, []);

  // ── 滚动淡入 Observer ───────────────────────────────────────────────
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [filteredAdvisors, loading]);

  // ── 视差滚动效果（仅桌面端）───────────────────────────────────────
  const heroRef = useRef<HTMLElement>(null);
  const [scrollY, setScrollY] = useState(0);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  useEffect(() => {
    if (isMobile) return; // 移动端禁用视差，保证性能
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

  // ── 卡片鼠标追踪光效（仅桌面端）──────────────────────────────────
  const handleCardMouse = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width * 100).toFixed(0);
    const y = ((e.clientY - rect.top) / rect.height * 100).toFixed(0);
    e.currentTarget.style.setProperty('--mouse-x', `${x}%`);
    e.currentTarget.style.setProperty('--mouse-y', `${y}%`);
  }, []);

  return (
    <div className="relative min-h-screen text-slate-100" style={{ background: '#0a0118' }}>
      {/* ★ Canvas 动态星空粒子 */}
      <Starfield />

      {/* ★ Hero 极光区域（视差滚动） */}
      <header
        ref={heroRef}
        className="aurora-bg relative z-10 border-b border-purple-500/10"
        style={!isMobile ? { transform: `translateY(${scrollY * 0.3}px)`, willChange: 'transform' } : undefined}
      >
        <div className="mx-auto max-w-6xl px-4 pb-8 pt-10 md:pb-14 md:pt-16">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <span className="text-2xl drop-shadow-[0_0_12px_rgba(147,51,234,0.6)] md:text-3xl">🔮</span>
              <h1 className="text-glow text-2xl font-bold tracking-wide md:text-4xl">{TEXT.brand}</h1>
            </div>
            <button
              onClick={() => setShowIntake(true)}
              className="pulse-glow w-fit rounded-full border border-purple-400/40 bg-purple-600/20 px-5 py-2.5 text-sm font-medium text-purple-200 backdrop-blur-sm transition hover:bg-purple-600/35 hover:text-white sm:ml-auto"
            >
              ✨ 说出你的困惑
            </button>
          </div>
          <p className="mt-2 text-sm text-purple-200/80 md:text-base">{TEXT.tagline}</p>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300/90 md:mt-5">{TEXT.intro}</p>

          {/* 柔光分割线 */}
          <div className="glow-divider mt-6 md:mt-8" />
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-6xl px-4 py-6">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.value)}
              className={`category-pill rounded-full border px-4 py-2 text-sm font-medium backdrop-blur-sm ${
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

      <main className="relative z-10 mx-auto max-w-6xl px-4 pb-16">
        {/* ✅ 错误状态：友好提示 + 重试按钮 */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-800/50 bg-red-900/20 px-6 py-8 text-center">
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
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 px-6 py-16 text-center text-slate-400">
            {TEXT.loading}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredAdvisors.map((advisor) => {
              const tags = normalizeStringArray(advisor.specialties_zh.length ? advisor.specialties_zh : advisor.specialties);

              return (
                <button
                  key={advisor.id}
                  type="button"
                  onClick={() => setSelectedAdvisor(advisor)}
                  onMouseMove={handleCardMouse}
                  className="glow-card fade-up rounded-3xl border border-slate-700/40 bg-slate-900/60 p-5 text-left backdrop-blur-sm"
                >
                  <div className="relative z-10 flex items-start gap-4">
                    <img
                      src={advisor.imageUrl}
                      alt={advisor.name_zh || advisor.name}
                      loading="lazy"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      className="h-20 w-20 rounded-2xl object-cover ring-1 ring-purple-500/20"
                    />
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-xl font-bold text-white">{advisor.name_zh || advisor.name}</h2>
                      <p className="mt-1 text-sm text-purple-200/90">{advisor.title_zh || advisor.title}</p>
                      <p className="mt-3 text-xs text-slate-400">
                        {TEXT.yearsPrefix}{advisor.yearsExperience}{TEXT.yearsSuffix} · {TEXT.scorePrefix}{advisor.rating.toFixed(1)} · {advisor.reviewCount}{TEXT.reviewSuffix}
                      </p>
                    </div>
                  </div>

                  <div className="relative z-10 mt-4 flex flex-wrap gap-2">
                    {tags.slice(0, 4).map((tag) => (
                      <span key={tag} className="rounded-full border border-purple-400/20 bg-purple-500/10 px-3 py-1 text-xs text-purple-200">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="relative z-10 mt-5 flex items-center justify-between border-t border-slate-700/30 pt-4">
                    <span className="text-sm text-slate-400">{TEXT.categoryPrefix}{advisor.category ? advisor.category.split(',').map(c => categoryMap[c.trim()] || c.trim()).join('、') : TEXT.categoryUnset}</span>
                    <span className="text-base font-semibold text-purple-300">${advisor.pricePerMinute.toFixed(2)}{TEXT.priceSuffix}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
        {/* ✅ 空数据状态：过滤无结果时提示 */}
        {!loading && !error && filteredAdvisors.length === 0 && (
          <div className="py-20 text-center text-slate-400">
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
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="relative max-h-[95vh] w-full max-w-4xl overflow-y-auto rounded-t-3xl border border-slate-800 bg-slate-950 shadow-2xl sm:max-h-[90vh] sm:rounded-3xl">
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
                          onClick={() => setSelectedCertificate(certificate)}
                          className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900"
                        >
                          <img src={certificate} alt={`${TEXT.certAltPrefix}${index + 1}`} className="h-32 w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                {selectedAdvisor.reviews.length > 0 && (
                  <section className="mt-8">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">{TEXT.reviews}</h3>
                    <div className="mt-3 space-y-3">
                      {selectedAdvisor.reviews.map((review) => (
                        <div key={review.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                          <div className="flex items-center justify-between gap-4">
                            <strong className="text-white">{review.user}</strong>
                            <span className="text-sm text-slate-500">{review.date}</span>
                          </div>
                          <p className="mt-2 text-sm text-yellow-400">{TEXT.reviewScorePrefix}{review.rating}/5</p>
                          <p className="mt-2 text-sm leading-6 text-slate-300">{review.comment}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </div>
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] max-w-4xl">
            <button
              type="button"
              onClick={() => setSelectedCertificate(null)}
              className="absolute right-3 top-3 rounded-full bg-black/60 px-3 py-1 text-sm text-white"
            >
              {TEXT.close}
            </button>
            <img src={selectedCertificate} alt={TEXT.certDetail} className="max-h-[90vh] rounded-2xl object-contain" />
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
