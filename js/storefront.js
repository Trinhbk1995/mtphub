// ============================================================================
// MTP HUB (mtphub.com) - STOREFRONT INTERACTIVE LOGIC
// ============================================================================

const state = {
  settings: {},
  bankConfig: {},
  tools: [],
  activeCategory: 'all',
  searchQuery: '',
  checkoutTool: null,
  checkoutPlanId: null
};

function formatVnd(amount) {
  const n = Number(amount) || 0;
  return n.toLocaleString('vi-VN') + 'đ';
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function showToast(msg) {
  const wrap = document.getElementById('toastWrap');
  if (!wrap) return;
  const el = document.createElement('div');
  el.className = 'toast-msg';
  el.textContent = msg;
  wrap.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transition = 'opacity 0.25s';
    setTimeout(() => el.remove(), 260);
  }, 2800);
}

function copyRawText(text, label = 'Đã sao chép') {
  navigator.clipboard.writeText(String(text || '')).then(() => {
    showToast(`✅ ${label}: ${text}`);
  });
}

function copyTextById(id) {
  const el = document.getElementById(id);
  if (el) copyRawText(el.textContent.trim());
}

function formatPhoneDots(phone) {
  const digits = String(phone || '').replace(/[^0-9]/g, '');
  if (digits.length === 10) {
    return `${digits.slice(0, 4)}.${digits.slice(4, 7)}.${digits.slice(7)}`;
  }
  return phone;
}

// Trích xuất YouTube Video ID nếu người dùng gắn link YouTube Demo
function extractYouTubeId(url) {
  if (!url) return '';
  const m = String(url).match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/);
  return m ? m[1] : '';
}

// Tạo đồ họa Studio sắc nét cho từng dòng Tool (nếu chưa gắn ảnh riêng)
function getToolVisualSvg(theme) {
  switch (theme) {
    case 'barchart':
      return `
      <svg viewBox="0 0 480 250" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#080d1f"/>
            <stop offset="100%" stop-color="#121d42"/>
          </linearGradient>
          <linearGradient id="barCyan" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#3b82f6"/>
            <stop offset="100%" stop-color="#06b6d4"/>
          </linearGradient>
          <linearGradient id="barPurp" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#6366f1"/>
            <stop offset="100%" stop-color="#a855f7"/>
          </linearGradient>
          <linearGradient id="barGreen" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#059669"/>
            <stop offset="100%" stop-color="#34d399"/>
          </linearGradient>
        </defs>
        <rect width="480" height="250" fill="url(#bg1)"/>
        <g stroke="rgba(148,163,184,0.12)" stroke-width="1">
          <line x1="65" y1="35" x2="65" y2="215"/><line x1="155" y1="35" x2="155" y2="215"/>
          <line x1="245" y1="35" x2="245" y2="215"/><line x1="335" y1="35" x2="335" y2="215"/>
          <line x1="425" y1="35" x2="425" y2="215"/>
        </g>
        <text x="24" y="28" fill="#38bdf8" font-size="11" font-family="monospace" font-weight="700">1950 → 2026 • CHẠY DỮ LIỆU CÁC NĂM 60FPS</text>
        <rect x="65" y="48" width="335" height="24" rx="5" fill="url(#barCyan)"/>
        <rect x="65" y="84" width="280" height="24" rx="5" fill="url(#barPurp)"/>
        <rect x="65" y="120" width="230" height="24" rx="5" fill="url(#barGreen)"/>
        <rect x="65" y="156" width="175" height="24" rx="5" fill="#f59e0b"/>
        <rect x="65" y="192" width="125" height="20" rx="5" fill="#ec4899"/>
        <text x="408" y="65" fill="#38bdf8" font-size="12" font-weight="800" font-family="monospace">98,420</text>
        <text x="353" y="101" fill="#c084fc" font-size="12" font-weight="800" font-family="monospace">82,150</text>
        <text x="303" y="137" fill="#34d399" font-size="12" font-weight="800" font-family="monospace">67,890</text>
        <text x="360" y="212" fill="rgba(255,255,255,0.28)" font-size="38" font-weight="900" font-family="sans-serif">2026</text>
      </svg>`;

    case 'voiceclone':
      return `
      <svg viewBox="0 0 480 250" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="vcBg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#090b1f"/>
            <stop offset="100%" stop-color="#1d1138"/>
          </linearGradient>
          <linearGradient id="waveGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#c084fc"/>
            <stop offset="50%" stop-color="#6366f1"/>
            <stop offset="100%" stop-color="#06b6d4"/>
          </linearGradient>
        </defs>
        <rect width="480" height="250" fill="url(#vcBg)"/>
        <text x="24" y="28" fill="#c084fc" font-size="11" font-weight="700" font-family="monospace">100% CPU OFFLINE • 48KHZ VOICE CLONE STUDIO</text>
        <!-- Glowing Waveform Bars -->
        <g fill="url(#waveGrad)">
          <rect x="34" y="112" width="8" height="32" rx="4"/>
          <rect x="50" y="96" width="8" height="64" rx="4"/>
          <rect x="66" y="76" width="8" height="104" rx="4"/>
          <rect x="82" y="102" width="8" height="52" rx="4"/>
          <rect x="98" y="62" width="8" height="132" rx="4"/>
          <rect x="114" y="84" width="8" height="88" rx="4"/>
          <rect x="130" y="52" width="8" height="152" rx="4"/>
          <rect x="146" y="74" width="8" height="108" rx="4"/>
          <rect x="162" y="98" width="8" height="60" rx="4"/>
          <rect x="178" y="68" width="8" height="120" rx="4"/>
          <rect x="194" y="56" width="8" height="144" rx="4"/>
          <rect x="210" y="86" width="8" height="84" rx="4"/>
          <rect x="226" y="106" width="8" height="44" rx="4"/>
        </g>
        <!-- Voice Clone Card Right -->
        <rect x="256" y="54" width="198" height="146" rx="12" fill="#131836" stroke="rgba(192,132,252,0.45)"/>
        <text x="274" y="82" fill="#fff" font-size="13" font-weight="800" font-family="sans-serif">🎙️ 36 Giọng Việt + Clone</text>
        <text x="274" y="104" fill="#34d399" font-size="11.5" font-weight="700" font-family="monospace">✓ Không tốn phí API</text>
        <text x="274" y="126" fill="#38bdf8" font-size="11.5" font-weight="700" font-family="monospace">✓ Bắc • Trung • Nam</text>
        <text x="274" y="148" fill="#cbd5e1" font-size="11.5" font-family="monospace">✓ Đa ngôn ngữ Quốc tế</text>
        <rect x="274" y="164" width="162" height="22" rx="6" fill="rgba(124,58,237,0.28)"/>
        <text x="355" y="179" text-anchor="middle" fill="#e9d5ff" font-size="10.5" font-weight="700" font-family="monospace">WAV / MP3 • 48kHz</text>
      </svg>`;

    case 'gravity3d':
      return `
      <svg viewBox="0 0 480 250" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="g3d" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#090d16"/>
            <stop offset="100%" stop-color="#1e1b4b"/>
          </linearGradient>
        </defs>
        <rect width="480" height="250" fill="url(#g3d)"/>
        <!-- 3D Perspective Floor Grid -->
        <g stroke="rgba(56,189,248,0.22)" stroke-width="1">
          <line x1="0" y1="185" x2="480" y2="185"/>
          <line x1="0" y1="210" x2="480" y2="210"/>
          <line x1="0" y1="238" x2="480" y2="238"/>
          <line x1="240" y1="150" x2="40" y2="250"/>
          <line x1="240" y1="150" x2="160" y2="250"/>
          <line x1="240" y1="150" x2="320" y2="250"/>
          <line x1="240" y1="150" x2="440" y2="250"/>
        </g>
        <!-- 3D Pillars Comparison -->
        <rect x="85" y="128" width="58" height="62" rx="4" fill="#334155" stroke="#64748b"/>
        <rect x="195" y="88" width="72" height="102" rx="4" fill="#4f46e5" stroke="#818cf8"/>
        <rect x="320" y="42" width="88" height="148" rx="5" fill="#7c3aed" stroke="#c4b5fd"/>
        <rect x="315" y="18" width="98" height="20" rx="4" fill="#0f172a" stroke="#facc15"/>
        <text x="364" y="32" text-anchor="middle" fill="#facc15" font-size="10" font-weight="800" font-family="monospace">81,365 MAX</text>
        <text x="229" y="78" text-anchor="middle" fill="#38bdf8" font-size="10" font-weight="800" font-family="monospace">45,200</text>
        <text x="114" y="118" text-anchor="middle" fill="#cbd5e1" font-size="10" font-weight="800" font-family="monospace">15,000</text>
      </svg>`;

    case 'veo3rain':
      return `
      <svg viewBox="0 0 480 250" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="rainBg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#061224"/>
            <stop offset="65%" stop-color="#0f2942"/>
            <stop offset="100%" stop-color="#090d1a"/>
          </linearGradient>
        </defs>
        <rect width="480" height="250" fill="url(#rainBg)"/>
        <!-- City Neon Silhouettes -->
        <rect x="35" y="55" width="55" height="145" fill="#081120"/>
        <rect x="102" y="80" width="46" height="120" fill="#0b172a"/>
        <rect x="335" y="45" width="62" height="155" fill="#081120"/>
        <rect x="408" y="72" width="48" height="128" fill="#0b172a"/>
        <circle cx="240" cy="112" r="54" fill="rgba(56,189,248,0.14)"/>
        <!-- Umbrella & Walker Silhouette -->
        <path d="M202 108 Q240 72 278 108 Z" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5"/>
        <rect x="234" y="108" width="12" height="58" rx="5" fill="#0f172a"/>
        <ellipse cx="240" cy="208" rx="68" ry="8" fill="rgba(56,189,248,0.28)"/>
        <!-- Rain Streaks -->
        <g stroke="rgba(125,211,252,0.38)" stroke-width="1.2">
          <line x1="70" y1="20" x2="55" y2="75"/><line x1="145" y1="35" x2="130" y2="95"/>
          <line x1="210" y1="15" x2="195" y2="68"/><line x1="295" y1="25" x2="280" y2="82"/>
          <line x1="380" y1="18" x2="365" y2="78"/><line x1="435" y1="45" x2="420" y2="105"/>
          <line x1="115" y1="125" x2="100" y2="185"/><line x1="345" y1="120" x2="330" y2="180"/>
        </g>
        <text x="24" y="28" fill="#7dd3fc" font-size="11" font-weight="700" font-family="monospace">GOOGLE VEO 3 • CINEMATIC RAIN ENGINE</text>
      </svg>`;

    case 'ytmanager':
      return `
      <svg viewBox="0 0 480 250" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <rect width="480" height="250" fill="#0a0f20"/>
        <text x="24" y="28" fill="#34d399" font-size="11" font-weight="700" font-family="monospace">● 24/7 MULTI-CHANNEL FARMING ACTIVE</text>
        <g transform="translate(24,46)">
          <rect width="208" height="82" rx="10" fill="#131c38" stroke="rgba(16,185,129,0.45)"/>
          <text x="14" y="26" fill="#fff" font-size="12" font-weight="700" font-family="sans-serif">Channel US #01 (Firefox)</text>
          <text x="14" y="46" fill="#34d399" font-size="11" font-family="monospace">Đang ngâm: 18/25 phút</text>
          <rect x="14" y="58" width="180" height="8" rx="4" fill="#1e293b"/>
          <rect x="14" y="58" width="136" height="8" rx="4" fill="#10b981"/>
        </g>
        <g transform="translate(248,46)">
          <rect width="208" height="82" rx="10" fill="#131c38" stroke="rgba(56,189,248,0.4)"/>
          <text x="14" y="26" fill="#fff" font-size="12" font-weight="700" font-family="sans-serif">Channel UK #02 (Firefox)</text>
          <text x="14" y="46" fill="#38bdf8" font-size="11" font-family="monospace">Nghỉ giãn cách: 02h 15m</text>
          <rect x="14" y="58" width="180" height="8" rx="4" fill="#1e293b"/>
          <rect x="14" y="58" width="180" height="8" rx="4" fill="#06b6d4"/>
        </g>
        <g transform="translate(24,142)">
          <rect width="432" height="78" rx="10" fill="#111830" stroke="rgba(124,58,237,0.4)"/>
          <text x="16" y="28" fill="#c4b5fd" font-size="12" font-weight="700" font-family="sans-serif">Chống Bot Theo Múi Giờ Quốc Tế (US / UK / JP / VN)</text>
          <text x="16" y="52" fill="#94a3b8" font-size="11" font-family="monospace">Profile Độc Lập • Lịch Sử Minh Bạch • Tự Động Ngủ Đêm</text>
        </g>
      </svg>`;

    case 'ytscout':
      return `
      <svg viewBox="0 0 480 250" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <rect width="480" height="250" fill="#090d1d"/>
        <text x="24" y="28" fill="#f59e0b" font-size="11" font-weight="700" font-family="monospace">ACTIVE GROWTH SCORE • NICHE RADAR V4.0</text>
        <polyline points="35,195 105,180 175,162 245,128 315,78 395,46 445,32" fill="none" stroke="#10b981" stroke-width="3.5"/>
        <circle cx="315" cy="78" r="5" fill="#10b981"/>
        <circle cx="395" cy="46" r="6" fill="#34d399"/>
        <rect x="255" y="108" width="195" height="96" rx="10" fill="#131c36" stroke="rgba(16,185,129,0.5)"/>
        <text x="271" y="134" fill="#fff" font-size="12" font-weight="700" font-family="sans-serif">Phát Hiện Kênh Ngách Viral!</text>
        <text x="271" y="156" fill="#34d399" font-size="18" font-weight="800" font-family="monospace">Score: 94 / 100</text>
        <text x="271" y="180" fill="#94a3b8" font-size="11" font-family="monospace">Sub: 12.4K • View 7d: +840K</text>
      </svg>`;

    default:
      return `
      <svg viewBox="0 0 480 250" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="tkBg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#0f0a24"/>
            <stop offset="100%" stop-color="#1e1238"/>
          </linearGradient>
        </defs>
        <rect width="480" height="250" fill="url(#tkBg)"/>
        <text x="24" y="28" fill="#f472b6" font-size="11" font-weight="700" font-family="monospace">GOOGLE FLOW AI • BATCH TIKTOK GENERATOR</text>
        <rect x="38" y="48" width="118" height="168" rx="12" fill="#191636" stroke="#ec4899"/>
        <rect x="181" y="48" width="118" height="168" rx="12" fill="#191636" stroke="#8b5cf6"/>
        <rect x="324" y="48" width="118" height="168" rx="12" fill="#191636" stroke="#06b6d4"/>
        <circle cx="97" cy="112" r="24" fill="rgba(236,72,153,0.28)"/>
        <circle cx="240" cy="112" r="24" fill="rgba(139,92,246,0.28)"/>
        <circle cx="383" cy="112" r="24" fill="rgba(6,182,212,0.28)"/>
        <text x="97" y="188" text-anchor="middle" fill="#fbcfe8" font-size="11" font-weight="700" font-family="sans-serif">Ảnh AI #01 ✓</text>
        <text x="240" y="188" text-anchor="middle" fill="#ddd6fe" font-size="11" font-weight="700" font-family="sans-serif">Ảnh AI #02 ✓</text>
        <text x="383" y="188" text-anchor="middle" fill="#a5f3fc" font-size="11" font-weight="700" font-family="sans-serif">Ảnh AI #03 ✓</text>
      </svg>`;
  }
}

function getToolThumbnailHtml(tool) {
  if (tool.customImageUrl) {
    return `<img src="${escapeHtml(tool.customImageUrl)}" alt="${escapeHtml(tool.name)}" loading="lazy" />`;
  }
  const ytId = extractYouTubeId(tool.demoVideoUrl);
  if (ytId) {
    return `<img src="https://img.youtube.com/vi/${ytId}/hqdefault.jpg" alt="${escapeHtml(tool.name)}" loading="lazy" />`;
  }
  return getToolVisualSvg(tool.visualTheme);
}

async function loadStoreData() {
  try {
    const res = await fetch('/api/store', { cache: 'no-store' });
    if (!res.ok) throw new Error('Static fallback');
    const data = await res.json();
    if (data && data.ok) {
      state.settings = data.settings || {};
      state.bankConfig = data.bankConfig || {};
      state.tools = data.tools || [];
      applySettingsToDom();
      renderToolsGrid();
      return;
    }
  } catch {
    // Fallback cho chế độ Hosting tĩnh (Cloudflare Pages / GitHub Pages)
    if (window.MTPHUB_DEFAULT_DATA) {
      state.settings = window.MTPHUB_DEFAULT_DATA.settings || {};
      state.bankConfig = window.MTPHUB_DEFAULT_DATA.bankConfig || {};
      state.tools = window.MTPHUB_DEFAULT_DATA.tools || [];
      applySettingsToDom();
      renderToolsGrid();
    }
  }
}

function applySettingsToDom() {
  const s = state.settings || {};
  const phoneRaw = String(s.zalo || s.phone || '0397022195').replace(/[^0-9]/g, '');
  const phoneDisplay = formatPhoneDots(phoneRaw);
  const zaloHref = `https://zalo.me/${phoneRaw}`;
  const teleHref = s.telegramLink || `https://t.me/+84${phoneRaw.replace(/^0/, '')}`;

  if (s.announcement) document.getElementById('topBanner').textContent = s.announcement;
  if (s.brandName) document.getElementById('navBrandName').textContent = s.brandName;
  if (s.domain) document.getElementById('navDomain').textContent = s.domain;
  if (s.heroBadge) document.getElementById('heroBadge').textContent = '⚡ ' + s.heroBadge;
  if (s.heroTitle) document.getElementById('heroTitle').textContent = s.heroTitle;
  if (s.heroSubtitle) document.getElementById('heroSubtitle').textContent = s.heroSubtitle;

  const navZalo = document.getElementById('navZaloBtn');
  if (navZalo) {
    navZalo.href = zaloHref;
    navZalo.textContent = `💬 Zalo: ${phoneDisplay}`;
  }
  const navTele = document.getElementById('navTeleBtn');
  if (navTele) navTele.href = teleHref;

  const floatZalo = document.getElementById('floatZalo');
  if (floatZalo) {
    floatZalo.href = zaloHref;
    floatZalo.textContent = `💬 Zalo Trịnh AI: ${phoneDisplay}`;
  }
  const floatTele = document.getElementById('floatTele');
  if (floatTele) floatTele.href = teleHref;

  document.getElementById('footerBrand').textContent = `${s.brandName || 'MTP HUB • TRỊNH AI'} — mtphub.com`;
  document.getElementById('footerSupport').innerHTML = `Liên hệ Trịnh AI (Zalo / Tele): <strong style="color:#fff;">${escapeHtml(phoneDisplay)}</strong>`;
}

function getDisplayPlan(tool) {
  const plans = tool.plans || [];
  return plans.find(p => p.popular) || plans[plans.length - 1] || { name: 'Bản quyền', price: 299000, originalPrice: 499000 };
}

function getLowestPlan(tool) {
  const plans = tool.plans || [];
  if (!plans.length) return null;
  return plans.reduce((min, p) => (Number(p.price) < Number(min.price) ? p : min), plans[0]);
}

function renderToolsGrid() {
  const grid = document.getElementById('toolGrid');
  if (!grid) return;

  const q = state.searchQuery.trim().toLowerCase();
  const filtered = state.tools.filter(tool => {
    const matchCat = state.activeCategory === 'all' || tool.category === state.activeCategory;
    const matchSearch =
      !q ||
      String(tool.name).toLowerCase().includes(q) ||
      String(tool.subtitle).toLowerCase().includes(q) ||
      String(tool.shortDesc).toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  if (!filtered.length) {
    grid.innerHTML = `
      <div style="grid-column:1/-1; text-align:center; padding:48px 20px; background:var(--bg-card); border-radius:18px; border:1px solid var(--border-subtle);">
        <h3 style="margin-bottom:8px;">Chưa tìm thấy phần mềm phù hợp</h3>
        <p style="color:var(--text-secondary); font-size:14px;">Bạn thử chọn danh mục "Tất cả Tool" hoặc nhắn Zalo để được tư vấn tool riêng theo yêu cầu nhé!</p>
      </div>`;
    return;
  }

  grid.innerHTML = filtered
    .map(tool => {
      const mainPlan = getDisplayPlan(tool);
      const minPlan = getLowestPlan(tool);
      const hasMultiPlans = (tool.plans || []).length > 1 && minPlan && minPlan.price < mainPlan.price;

      const hasAnyDownload =
        (tool.downloadUrl && tool.downloadUrl !== '#') ||
        Boolean(tool.downloadUrlGpu) ||
        (Array.isArray(tool.downloadGpuParts) && tool.downloadGpuParts.length > 0);

      const downloadAction = hasAnyDownload
        ? `handleToolDownload('${escapeHtml(tool.id)}')`
        : `openDetailModal('${escapeHtml(tool.id)}')`;

      const downloadLabel = hasAnyDownload ? '📥 Tải Bản Cài' : '🎬 Xem Chi Tiết';

      return `
      <article class="tool-card">
        <div class="tool-card-header">
          <span class="tool-badge">${escapeHtml(tool.badge || 'PRO STUDIO')}</span>
          <span class="tool-version mono">${escapeHtml(tool.version || 'v1.0')}</span>
        </div>

        <div class="tool-thumb" onclick="openDetailModal('${escapeHtml(tool.id)}')" title="Bấm xem chi tiết & Video Demo">
          ${getToolThumbnailHtml(tool)}
          <div class="thumb-play-overlay">
            <div class="play-circle">▶</div>
          </div>
          <span class="thumb-corner-tag">${tool.demoVideoUrl ? '🎬 Video Demo' : '✨ Xem Tính Năng'}</span>
        </div>

        <h3 class="tool-title">${escapeHtml(tool.name)}</h3>
        <div class="tool-subtitle">${escapeHtml(tool.subtitle)}</div>
        <p class="tool-desc">${escapeHtml(tool.shortDesc)}</p>

        <div class="tool-tags">
          <span class="mini-tag">👑 Chính chủ Trịnh AI</span>
          <span class="mini-tag">⚡ Portable chạy ngay</span>
          <span class="mini-tag">🔒 Khóa máy Ed25519</span>
          ${hasMultiPlans ? `<span class="mini-tag">🔥 Chỉ từ ${formatVnd(minPlan.price)}</span>` : ''}
        </div>

        <div class="tool-footer">
          <div class="price-row">
            <div>
              <span class="price-main">${formatVnd(mainPlan.price)}</span>
              ${mainPlan.originalPrice ? `<span class="price-old">${formatVnd(mainPlan.originalPrice)}</span>` : ''}
            </div>
            <span class="price-plan-hint">${escapeHtml(mainPlan.name)}</span>
          </div>

          <div class="card-actions">
            <button type="button" class="btn btn-outline" onclick="${downloadAction}">
              ${downloadLabel}
            </button>
            <button type="button" class="btn btn-primary" onclick="openCheckoutModal('${escapeHtml(tool.id)}')">
              ⚡ Mua Key Ngay
            </button>
          </div>
        </div>
      </article>`;
    })
    .join('');
}

// ============================================================================
// XỬ LÝ TẢI BỘ CÀI (1 BẢN TRỰC TIẾP HOẶC BẢNG CHỌN BẢN CPU / NVIDIA GPU)
// ============================================================================
function handleToolDownload(toolId) {
  const tool = state.tools.find(t => t.id === toolId);
  if (!tool) return;

  const gpuParts = Array.isArray(tool.downloadGpuParts) ? tool.downloadGpuParts.filter(Boolean) : [];
  const hasGpuChoice = Boolean(tool.downloadUrlGpu) || gpuParts.length > 0;

  if (!hasGpuChoice) {
    if (tool.downloadUrl && tool.downloadUrl !== '#') {
      window.open(tool.downloadUrl, '_blank');
    } else {
      openDetailModal(toolId);
    }
    return;
  }

  let gpuActionHtml = '';
  if (gpuParts.length > 1) {
    const partButtons = gpuParts
      .map(
        (u, idx) =>
          `<a href="${escapeHtml(u)}" target="_blank" rel="noopener" class="btn btn-primary" style="flex:1; justify-content:center;">
            🚀 Tải Phần ${idx + 1}/${gpuParts.length} (.RAR)
          </a>`
      )
      .join('');
    gpuActionHtml = `
      <div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:10px;">${partButtons}</div>
      <div style="margin-top:8px; font-size:12px; color:#fbbf24; line-height:1.45;">
        📌 Do bộ thư viện GPU NVIDIA rất lớn, file được chia làm ${gpuParts.length} phần: Bạn bấm tải đủ cả ${gpuParts.length} file bỏ chung vào 1 thư mục, rồi bấm chuột phải <strong>Giải nén (Extract) Phần 1</strong> là WinRAR tự động nối đầy đủ 100%!
      </div>`;
  } else {
    const singleGpuUrl = tool.downloadUrlGpu || gpuParts[0];
    gpuActionHtml = `
      <a href="${escapeHtml(singleGpuUrl)}" target="_blank" rel="noopener" class="btn btn-primary" style="width:100%; justify-content:center; margin-top:10px;">
        🚀 Tải Bản NVIDIA GPU (.RAR)
      </a>`;
  }

  const box = document.getElementById('downloadChoiceContent');
  if (!box) return;

  box.innerHTML = `
    <p style="font-size:14px; color:var(--text-secondary); margin-bottom:16px;">
      Phần mềm <strong style="color:#fff;">${escapeHtml(tool.name)}</strong> hỗ trợ 2 phiên bản tối ưu riêng theo cấu hình máy tính. Hãy chọn đúng bản phù hợp với máy của bạn:
    </p>

    <div style="display:grid; gap:14px; margin-bottom:16px;">
      <!-- Lựa chọn 1: Bản CPU -->
      <div style="padding:16px 18px; border-radius:14px; background:rgba(56,189,248,0.07); border:1px solid rgba(56,189,248,0.35);">
        <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:6px;">
          <strong style="font-size:16px; color:#fff;">💻 Tải Bản CPU (Máy yếu / Không có card rời)</strong>
          <span class="mini-tag" style="color:#38bdf8; border-color:rgba(56,189,248,0.4);">~755 MB • Phổ thông</span>
        </div>
        <div style="font-size:13.5px; color:var(--text-secondary); line-height:1.5;">
          Dành cho Laptop, máy văn phòng hoặc máy tính không có card đồ họa rời. Chạy ổn định 100% trên mọi máy Windows 10/11.
        </div>
        <a href="${escapeHtml(tool.downloadUrl)}" target="_blank" rel="noopener" class="btn btn-outline" style="width:100%; justify-content:center; margin-top:10px; border-color:rgba(56,189,248,0.5); color:#e0f2fe;">
          💻 Tải Bản CPU (.RAR)
        </a>
      </div>

      <!-- Lựa chọn 2: Bản NVIDIA GPU -->
      <div style="padding:16px 18px; border-radius:14px; background:rgba(124,58,237,0.11); border:1px solid rgba(168,85,247,0.5);">
        <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:6px;">
          <strong style="font-size:16px; color:#fff;">🚀 Tải Bản NVIDIA GPU (Tăng tốc x5 cho máy mạnh)</strong>
          <span class="mini-tag" style="color:#d8b4fe; border-color:rgba(192,132,252,0.5);">NVIDIA GTX / RTX</span>
        </div>
        <div style="font-size:13.5px; color:var(--text-secondary); line-height:1.5;">
          Dành riêng cho máy cấu hình mạnh có Card đồ họa rời <strong>NVIDIA</strong>. Tốc độ tạo giọng đọc &amp; nhân bản giọng nói nhanh gấp 5 lần!
        </div>
        ${gpuActionHtml}
      </div>
    </div>

    <div style="padding:12px 14px; border-radius:10px; background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle); display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:10px;">
      <span style="font-size:12.5px; color:var(--text-secondary);">
        🔑 Cả 2 bản dùng chung <strong>1 giá &amp; 1 Key bản quyền</strong> theo Mã máy (<code>DEVICE-...</code>).
      </span>
      <button type="button" class="btn btn-emerald btn-sm" onclick="closeModal('downloadChoiceModal'); openCheckoutModal('${escapeHtml(tool.id)}')">
        ⚡ Mua Key Ngay
      </button>
    </div>
  `;

  openModal('downloadChoiceModal');
}

// ============================================================================
// MODAL 1: CHI TIẾT TOOL & VIDEO DEMO
// ============================================================================
function openDetailModal(toolId) {
  const tool = state.tools.find(t => t.id === toolId);
  if (!tool) return;

  const ytId = extractYouTubeId(tool.demoVideoUrl);
  const mediaHtml = ytId
    ? `<div style="position:relative; padding-top:56.25%; border-radius:14px; overflow:hidden; margin-bottom:20px; border:1px solid var(--border-subtle);">
         <iframe src="https://www.youtube.com/embed/${ytId}?rel=0" style="position:absolute; inset:0; width:100%; height:100%; border:0;" allowfullscreen></iframe>
       </div>`
    : `<div style="height:230px; border-radius:14px; overflow:hidden; margin-bottom:20px; border:1px solid var(--border-subtle);">
         ${getToolThumbnailHtml(tool)}
       </div>`;

  const featuresHtml = (tool.features || [])
    .map(
      f =>
        `<li style="margin-bottom:8px; display:flex; gap:9px; align-items:flex-start; font-size:14px; color:#e2e8f0;">
          <span style="color:var(--accent-emerald); font-weight:800;">✓</span>
          <span>${escapeHtml(f)}</span>
        </li>`
    )
    .join('');

  const plansHtml = (tool.plans || [])
    .map(
      p => `
      <div style="background:rgba(255,255,255,0.03); border:1px solid ${p.popular ? 'var(--accent-purple)' : 'var(--border-subtle)'}; border-radius:12px; padding:12px 14px; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <strong style="font-size:14px;">${escapeHtml(p.name)}</strong>
          <div style="font-size:12px; color:var(--text-secondary);">${escapeHtml(p.duration || '')}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-weight:800; font-size:16px; color:#fff;">${formatVnd(p.price)}</div>
          ${p.originalPrice ? `<div style="font-size:11.5px; color:var(--text-muted); text-decoration:line-through;">${formatVnd(p.originalPrice)}</div>` : ''}
        </div>
      </div>`
    )
    .join('');

  const hasAnyDownload =
    (tool.downloadUrl && tool.downloadUrl !== '#') ||
    Boolean(tool.downloadUrlGpu) ||
    (Array.isArray(tool.downloadGpuParts) && tool.downloadGpuParts.length > 0);

  const downloadBtnHtml = hasAnyDownload
    ? `<button type="button" class="btn btn-outline btn-lg" onclick="closeModal('detailModal'); handleToolDownload('${escapeHtml(tool.id)}')">📥 Tải Bản Cài Đặt (.RAR)</button>`
    : `<a href="https://zalo.me/${String(state.settings.zalo || '0397022195').replace(/[^0-9]/g, '')}" target="_blank" rel="noopener" class="btn btn-zalo btn-lg">💬 Nhắn Zalo Nhận Link Tải</a>`;

  document.getElementById('detailModalContent').innerHTML = `
    <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
      <span class="tool-badge">${escapeHtml(tool.badge || 'PRO')}</span>
      <span class="mono" style="font-size:12.5px; color:var(--text-muted);">${escapeHtml(tool.version || '')}</span>
    </div>
    <h2 style="font-size:24px; font-weight:800; margin-bottom:4px;">${escapeHtml(tool.name)}</h2>
    <p style="color:#a5b4fc; font-weight:600; font-size:14px; margin-bottom:16px;">${escapeHtml(tool.subtitle)}</p>
    ${mediaHtml}
    <h4 style="font-size:15px; font-weight:700; margin-bottom:10px; color:#fff;">🔥 Tính năng nổi bật:</h4>
    <ul style="list-style:none; margin-bottom:20px;">${featuresHtml}</ul>

    <h4 style="font-size:15px; font-weight:700; margin-bottom:10px; color:#fff;">💎 Các gói bản quyền:</h4>
    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:10px; margin-bottom:22px;">
      ${plansHtml}
    </div>

    <div style="display:flex; flex-wrap:wrap; gap:12px; justify-content:flex-end;">
      ${downloadBtnHtml}
      <button type="button" class="btn btn-primary btn-lg" onclick="closeModal('detailModal'); openCheckoutModal('${escapeHtml(tool.id)}')">
        ⚡ Mua Key Bản Quyền Ngay
      </button>
    </div>
  `;

  openModal('detailModal');
}

// ============================================================================
// MODAL 2: ĐẶT MUA & VIETQR ĐỘNG
// ============================================================================
function openCheckoutModal(toolId) {
  const tool = state.tools.find(t => t.id === toolId);
  if (!tool) return;

  state.checkoutTool = tool;
  const defaultPlan = getDisplayPlan(tool);
  state.checkoutPlanId = defaultPlan ? defaultPlan.id : (tool.plans[0] && tool.plans[0].id);

  document.getElementById('checkoutFormView').style.display = 'grid';
  document.getElementById('checkoutSuccessView').style.display = 'none';

  document.getElementById('ckToolCode').textContent = (tool.code || 'MTP').slice(0, 5);
  document.getElementById('ckToolName').textContent = tool.name;
  document.getElementById('ckToolSub').textContent = tool.subtitle;

  renderCheckoutPlans();
  refreshVietQrPreview();
  openModal('checkoutModal');
}

function renderCheckoutPlans() {
  const tool = state.checkoutTool;
  if (!tool) return;
  const plans = tool.plans || [];
  const listEl = document.getElementById('ckPlanList');

  listEl.innerHTML = plans
    .map((p, idx) => {
      const isActive = p.id === state.checkoutPlanId;
      const isLastOdd = plans.length % 2 === 1 && idx === plans.length - 1;
      return `
        <div class="plan-option ${isActive ? 'active' : ''} ${isLastOdd ? 'full-span' : ''}" onclick="selectCheckoutPlan('${escapeHtml(p.id)}')">
          <div class="plan-dot"></div>
          <div style="flex:1;">
            <div style="font-weight:700; font-size:13.5px; color:#fff;">${escapeHtml(p.name)}</div>
            <div style="font-size:12.5px; color:${isActive ? '#34d399' : 'var(--text-secondary)'}; font-weight:700;">
              ${formatVnd(p.price)} ${p.duration ? `<span style="font-weight:400; opacity:0.8;">• ${escapeHtml(p.duration)}</span>` : ''}
            </div>
          </div>
        </div>`;
    })
    .join('');
}

function selectCheckoutPlan(planId) {
  state.checkoutPlanId = planId;
  renderCheckoutPlans();
  refreshVietQrPreview();
}

function refreshVietQrPreview() {
  const tool = state.checkoutTool;
  if (!tool) return;
  const plan = (tool.plans || []).find(p => p.id === state.checkoutPlanId) || tool.plans[0];
  const amount = plan ? Number(plan.price) || 0 : 0;

  const bank = state.bankConfig || {};
  const bankId = (bank.bankId || 'MB').trim();
  const bankName = bank.bankName || bankId;
  const accNo = (bank.accountNo || '').trim();
  const accName = (bank.accountName || 'MTP HUB').trim();
  const prefix = (bank.memoPrefix || 'MTP').trim();

  const rawPhone = (document.getElementById('ckPhone')?.value || '').replace(/[^0-9]/g, '');
  const memo = `${prefix} ${tool.code || 'TOOL'} ${rawPhone || 'SDT'}`.trim();

  document.getElementById('qrBankName').textContent = bankName;
  document.getElementById('qrAccName').textContent = accName;
  document.getElementById('qrAccNo').textContent = accNo || 'Cài đặt trong Admin';
  document.getElementById('qrAmountText').textContent = amount.toLocaleString('vi-VN') + ' VNĐ';
  document.getElementById('qrMemoText').textContent = memo;

  const qrBox = document.getElementById('qrImageContainer');
  const captionEl = document.getElementById('qrCaptionText');

  if (accNo) {
    const qrUrl = `https://img.vietqr.io/image/${encodeURIComponent(bankId)}-${encodeURIComponent(accNo)}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(memo)}&accountName=${encodeURIComponent(accName)}`;
    qrBox.innerHTML = `<img src="${qrUrl}" alt="Mã chuyển khoản VietQR MB Bank - ${escapeHtml(accName)}" onerror="this.onerror=null;this.src='images/mb-qr-fallback.jpg';" />`;
    captionEl.textContent = 'Quét bằng App Ngân Hàng hoặc MoMo bất kỳ';
  } else {
    // Khung QR mẫu sắc nét khi chủ shop chưa điền STK vào trang Admin
    qrBox.innerHTML = `
      <div style="text-align:center; padding:12px;">
        <svg viewBox="0 0 120 120" width="132" height="132" style="margin:0 auto 6px; display:block;">
          <rect width="120" height="120" fill="#fff"/>
          <rect x="8" y="8" width="34" height="34" fill="none" stroke="#0f172a" stroke-width="6"/>
          <rect x="18" y="18" width="14" height="14" fill="#0f172a"/>
          <rect x="78" y="8" width="34" height="34" fill="none" stroke="#0f172a" stroke-width="6"/>
          <rect x="88" y="18" width="14" height="14" fill="#0f172a"/>
          <rect x="8" y="78" width="34" height="34" fill="none" stroke="#0f172a" stroke-width="6"/>
          <rect x="18" y="88" width="14" height="14" fill="#0f172a"/>
          <rect x="52" y="14" width="10" height="10" fill="#0f172a"/>
          <rect x="52" y="34" width="16" height="10" fill="#0f172a"/>
          <rect x="14" y="54" width="18" height="10" fill="#0f172a"/>
          <rect x="46" y="54" width="26" height="22" fill="#dc2626"/>
          <text x="59" y="68" text-anchor="middle" fill="#fff" font-size="8" font-weight="800" font-family="sans-serif">QR</text>
          <rect x="84" y="54" width="24" height="12" fill="#0f172a"/>
          <rect x="54" y="86" width="14" height="24" fill="#0f172a"/>
          <rect x="78" y="82" width="30" height="12" fill="#0f172a"/>
          <rect x="92" y="100" width="16" height="12" fill="#0f172a"/>
        </svg>
        <span style="font-size:11px; color:#dc2626; font-weight:700;">Nhập STK trong /admin để hiện QR thật</span>
      </div>`;
    captionEl.textContent = 'Chủ shop có thể nhập Số tài khoản trong trang Admin';
  }
}

async function submitCheckoutOrder() {
  const tool = state.checkoutTool;
  if (!tool) return;
  const plan = (tool.plans || []).find(p => p.id === state.checkoutPlanId) || tool.plans[0];
  const hardwareId = (document.getElementById('ckHardwareId').value || '').trim().toUpperCase();
  const customerPhone = (document.getElementById('ckPhone').value || '').trim();
  const note = (document.getElementById('ckNote').value || '').trim();

  if (!customerPhone || customerPhone.length < 8) {
    showToast('⚠️ Vui lòng nhập Số điện thoại Zalo / Telegram nhận Key!');
    document.getElementById('ckPhone').focus();
    return;
  }
  if (tool.requireHardwareId && !hardwareId) {
    showToast('⚠️ Vui lòng nhập Mã máy (DEVICE-...) hoặc gõ CHUA_CAI nếu bạn tải sau!');
    document.getElementById('ckHardwareId').focus();
    return;
  }

  const btn = document.getElementById('submitOrderBtn');
  btn.disabled = true;
  btn.textContent = '⏳ Đang tạo đơn bản quyền...';

  let createdOrder = null;
  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        toolId: tool.id,
        planId: plan.id,
        hardwareId: hardwareId || 'CHUA_CAI',
        customerPhone,
        note
      })
    });
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || 'Không thể lưu đơn');
    createdOrder = data.order;
  } catch {
    // Fallback lưu localStorage nếu chạy web tĩnh hoàn toàn
    createdOrder = {
      id: 'MTP-' + Math.floor(100000 + Math.random() * 900000),
      toolName: tool.name,
      planName: plan.name,
      amount: plan.price,
      hardwareId: hardwareId || 'CHUA_CAI',
      customerPhone,
      status: 'pending'
    };
    const localOrders = JSON.parse(localStorage.getItem('mtphub_local_orders') || '[]');
    localOrders.unshift(createdOrder);
    localStorage.setItem('mtphub_local_orders', JSON.stringify(localOrders));
  } finally {
    btn.disabled = false;
    btn.textContent = '✅ Xác Nhận Đã Chuyển & Kích Hoạt Key';
  }

  const phoneShop = String(state.settings.zalo || state.settings.phone || '0397022195').replace(/[^0-9]/g, '');
  const teleHref = state.settings.telegramLink || `https://t.me/+84${phoneShop.replace(/^0/, '')}`;
  const orderSummaryMsg =
    `Chào MTP Hub, mình vừa đặt mua Key!\n` +
    `- Mã đơn: ${createdOrder.id}\n` +
    `- Phần mềm: ${createdOrder.toolName}\n` +
    `- Gói: ${createdOrder.planName} (${formatVnd(createdOrder.amount)})\n` +
    `- Mã máy: ${createdOrder.hardwareId}\n` +
    `- SĐT nhận Key: ${createdOrder.customerPhone}`;

  try {
    await navigator.clipboard.writeText(orderSummaryMsg);
  } catch {}

  document.getElementById('checkoutFormView').style.display = 'none';
  const successEl = document.getElementById('checkoutSuccessView');
  successEl.style.display = 'block';
  successEl.innerHTML = `
    <div style="width:60px; height:60px; border-radius:50%; background:rgba(16,185,129,0.18); border:2px solid var(--accent-emerald); color:#34d399; font-size:28px; display:flex; align-items:center; justify-content:center; margin:0 auto 14px;">✓</div>
    <h3 style="font-size:22px; font-weight:800; margin-bottom:6px;">Đã Ghi Nhận Đơn Hàng <span class="mono" style="color:#34d399;">${escapeHtml(createdOrder.id)}</span></h3>
    <p style="color:var(--text-secondary); font-size:14px; max-width:540px; margin:0 auto 18px;">
      Thông tin đơn & Mã máy của bạn đã được lưu và <strong>tự động copy sẵn vào bộ nhớ tạm</strong>. Bạn bấm nút Zalo hoặc Telegram bên dưới rồi <strong>Dán (Ctrl+V)</strong> gửi cho shop để nhận Key kích hoạt ngay lập tức nhé!
    </p>
    <div style="background:rgba(7,9,19,0.75); border:1px solid var(--border-subtle); border-radius:12px; padding:14px; max-width:500px; margin:0 auto 20px; text-align:left; font-size:13px;" class="mono">
      <div>Mã đơn: <strong style="color:#38bdf8;">${escapeHtml(createdOrder.id)}</strong></div>
      <div>Tool: <strong>${escapeHtml(createdOrder.toolName)}</strong> (${escapeHtml(createdOrder.planName)})</div>
      <div>Mã máy: <strong style="color:#facc15;">${escapeHtml(createdOrder.hardwareId)}</strong></div>
      <div>SĐT khách: <strong>${escapeHtml(createdOrder.customerPhone)}</strong></div>
    </div>
    <div style="display:flex; flex-wrap:wrap; justify-content:center; gap:12px;">
      <a href="https://zalo.me/${phoneShop}" target="_blank" rel="noopener" class="btn btn-zalo btn-lg">
        💬 Gửi Đơn Qua Zalo (${formatPhoneDots(phoneShop)})
      </a>
      <a href="${escapeHtml(teleHref)}" target="_blank" rel="noopener" class="btn btn-tele btn-lg">
        ✈️ Gửi Đơn Qua Telegram
      </a>
      <button type="button" class="btn btn-outline btn-lg" onclick="copyRawText(${JSON.stringify(orderSummaryMsg).replace(/"/g, '&quot;')}, 'Đã copy thông tin đơn')">
        📋 Copy Lại Nội Dung Đơn
      </button>
    </div>
  `;
}

// ============================================================================
// MODAL 3: TRA CỨU KEY & TẢI FILE LICENSE.LIC
// ============================================================================
function openLookupModal() {
  openModal('lookupModal');
  setTimeout(() => document.getElementById('lookupInput')?.focus(), 80);
}

function downloadLicFile(licenseKey, orderId) {
  const blob = new Blob([String(licenseKey).trim()], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'license.lic';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  showToast(`📥 Đã tải file license.lic cho đơn ${orderId}! Đặt cạnh file .exe là nhận ngay.`);
}

async function runOrderLookup() {
  const q = (document.getElementById('lookupInput').value || '').trim();
  const out = document.getElementById('lookupResults');
  if (q.length < 6) {
    out.innerHTML = `<p style="color:#fbbf24; font-size:13.5px;">⚠️ Vui lòng nhập đầy đủ SĐT Zalo, Mã máy (DEVICE-...) hoặc Mã đơn (MTP-...).</p>`;
    return;
  }

  out.innerHTML = `<p style="color:var(--text-secondary); font-size:13.5px;">⏳ Đang tra cứu dữ liệu bản quyền...</p>`;

  let orders = [];
  try {
    const res = await fetch('/api/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: q })
    });
    const data = await res.json();
    if (data && data.ok) orders = data.orders || [];
  } catch {
    const localOrders = JSON.parse(localStorage.getItem('mtphub_local_orders') || '[]');
    orders = localOrders.filter(
      o =>
        String(o.id).toLowerCase() === q.toLowerCase() ||
        String(o.hardwareId).toLowerCase() === q.toLowerCase() ||
        String(o.customerPhone).replace(/[^0-9]/g, '') === q.replace(/[^0-9]/g, '')
    );
  }

  if (!orders.length) {
    out.innerHTML = `
      <div style="padding:18px; border-radius:12px; background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle); font-size:13.5px;">
        Không tìm thấy đơn hàng khớp với <strong>${escapeHtml(q)}</strong>. Nếu bạn vừa chuyển khoản, hãy nhắn Zalo <strong>0397.022.195</strong> để được kích hoạt ngay nhé!
      </div>`;
    return;
  }

  out.innerHTML = orders
    .map(o => {
      const statusMap = {
        pending: '<span class="status-badge status-pending">⏳ Đang chờ xác nhận & cấp Key</span>',
        paid: '<span class="status-badge status-paid">💎 Đã thanh toán — Đang tạo Key</span>',
        key_sent: '<span class="status-badge status-key_sent">✅ Đã cấp Key bản quyền</span>',
        cancelled: '<span class="status-badge status-cancelled">Đã hủy</span>'
      };

      const keyBlock =
        o.status === 'key_sent' && o.licenseKey
          ? `<div style="margin-top:12px; padding:12px; border-radius:10px; background:#070913; border:1px solid rgba(16,185,129,0.4);">
               <div style="font-size:12px; color:#34d399; font-weight:700; margin-bottom:6px;">🔑 MÃ KEY BẢN QUYỀN CỦA BẠN:</div>
               <div class="mono" style="word-break:break-all; font-size:13px; color:#fff; margin-bottom:10px;">${escapeHtml(o.licenseKey)}</div>
               <div style="display:flex; flex-wrap:wrap; gap:8px;">
                 <button type="button" class="btn btn-emerald btn-sm" onclick="copyRawText('${escapeHtml(o.licenseKey)}', 'Đã copy Key')">📋 Sao Chép Key</button>
                 <button type="button" class="btn btn-outline btn-sm" onclick="downloadLicFile('${escapeHtml(o.licenseKey)}', '${escapeHtml(o.id)}')">📥 Tải file license.lic</button>
               </div>
             </div>`
          : '';

      return `
        <div style="padding:16px; border-radius:14px; background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle); margin-bottom:12px;">
          <div style="display:flex; flex-wrap:wrap; justify-content:space-between; gap:8px; margin-bottom:8px;">
            <strong class="mono" style="color:#38bdf8;">${escapeHtml(o.id)}</strong>
            ${statusMap[o.status] || statusMap.pending}
          </div>
          <div style="font-size:14px; font-weight:700;">${escapeHtml(o.toolName)} — <span style="color:#a5b4fc;">${escapeHtml(o.planName)}</span></div>
          <div style="font-size:12.5px; color:var(--text-secondary); margin-top:4px;">
            Mã máy: <span class="mono" style="color:#e2e8f0;">${escapeHtml(o.hardwareId)}</span> • Giá: <strong>${formatVnd(o.amount)}</strong>
          </div>
          ${keyBlock}
        </div>`;
    })
    .join('');
}

// ============================================================================
// TIỆN ÍCH ĐÓNG / MỞ MODAL & SỰ KIỆN LỌC
// ============================================================================
function openModal(id) {
  document.getElementById(id)?.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  document.getElementById(id)?.classList.remove('open');
  if (!document.querySelector('.modal-backdrop.open')) {
    document.body.style.overflow = '';
  }
}

function closeBackdrop(e, id) {
  if (e.target.id === id) closeModal(id);
}

document.addEventListener('DOMContentLoaded', () => {
  // Sự kiện chọn danh mục
  const catTabs = document.getElementById('categoryTabs');
  if (catTabs) {
    catTabs.addEventListener('click', e => {
      const btn = e.target.closest('.cat-btn');
      if (!btn) return;
      document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.activeCategory = btn.dataset.cat || 'all';
      renderToolsGrid();
    });
  }

  // Sự kiện tìm kiếm nhanh
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', e => {
      state.searchQuery = e.target.value || '';
      renderToolsGrid();
    });
  }

  // Đóng modal bằng phím ESC
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      ['detailModal', 'checkoutModal', 'lookupModal'].forEach(closeModal);
    }
  });

  loadStoreData();
});
