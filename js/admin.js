// ============================================================================
// MTP HUB (mtphub.com) - ADMIN DASHBOARD LOGIC
// ============================================================================

const ADMIN_TOKEN_KEY = 'mtphub_admin_token';

const adminState = {
  token: localStorage.getItem(ADMIN_TOKEN_KEY) || '',
  metrics: {},
  settings: {},
  bankConfig: {},
  tools: [],
  orders: []
};

function fmtVnd(n) {
  return (Number(n) || 0).toLocaleString('vi-VN') + 'đ';
}

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function toast(msg) {
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

function copyTextValue(inputId) {
  const val = document.getElementById(inputId)?.value || '';
  navigator.clipboard.writeText(val).then(() => toast(`📋 Đã copy: ${val}`));
}

async function apiAdmin(path, method = 'GET', bodyObj = null) {
  const headers = { Authorization: `Bearer ${adminState.token}` };
  if (bodyObj) headers['Content-Type'] = 'application/json';
  const res = await fetch(path, {
    method,
    headers,
    body: bodyObj ? JSON.stringify(bodyObj) : undefined
  });
  const data = await res.json();
  if (res.status === 401) {
    logoutAdmin(false);
    throw new Error(data.error || 'Vui lòng đăng nhập lại');
  }
  if (!res.ok || !data.ok) {
    throw new Error(data.error || 'Lỗi thao tác');
  }
  return data;
}

async function handleAdminLogin(e) {
  e.preventDefault();
  const password = document.getElementById('adminPassInput').value;
  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      toast('❌ ' + (data.error || 'Sai mật khẩu Admin!'));
      return;
    }
    adminState.token = data.token;
    localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
    document.getElementById('adminPassInput').value = '';
    toast('✅ Đăng nhập quản trị thành công!');
    await refreshDashboard();
  } catch (err) {
    toast('❌ Không thể kết nối máy chủ: ' + err.message);
  }
}

function logoutAdmin(showNotice = true) {
  adminState.token = '';
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  document.getElementById('adminAppShell').style.display = 'none';
  document.getElementById('adminLoginScreen').style.display = 'flex';
  if (showNotice) toast('Đã đăng xuất khỏi trang quản trị.');
}

async function refreshDashboard() {
  if (!adminState.token) {
    logoutAdmin(false);
    return;
  }
  try {
    const data = await apiAdmin('/api/admin/dashboard');
    adminState.metrics = data.metrics || {};
    adminState.settings = data.settings || {};
    adminState.bankConfig = data.bankConfig || {};
    adminState.tools = data.tools || [];
    adminState.orders = data.orders || [];

    document.getElementById('adminLoginScreen').style.display = 'none';
    document.getElementById('adminAppShell').style.display = 'grid';

    renderKpis();
    renderAdminOrders();
    renderAdminTools();
    populateBankForm();
    populateSettingsForm();
  } catch (err) {
    toast('⚠️ ' + err.message);
  }
}

function renderKpis() {
  const m = adminState.metrics;
  document.getElementById('kpiRevenue').textContent = fmtVnd(m.totalRevenue || 0);
  document.getElementById('kpiActiveKeys').textContent = `${m.activeKeys || 0} Keys`;
  document.getElementById('kpiPending').textContent = `${m.pendingOrders || 0} Đơn`;
  document.getElementById('kpiTotalTools').textContent = `${m.totalTools || 0} Tools`;
}

function switchAdminTab(tabName) {
  document.querySelectorAll('.admin-nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });
  document.querySelectorAll('.admin-tab-section').forEach(sec => {
    sec.style.display = sec.id === `tab-${tabName}` ? 'block' : 'none';
  });

  const titles = {
    orders: 'Bảng Điều Khiển & Quản Lý Đơn Hàng',
    tools: 'Quản Lý Danh Sách Tool & Bảng Giá',
    vietqr: 'Cấu Hình Ngân Hàng VietQR Tự Động',
    settings: 'Cài Đặt Thương Hiệu, Zalo/Telegram & Bảo Mật'
  };
  document.getElementById('adminPageTitle').textContent = titles[tabName] || 'MTP Hub Admin';
}

// ============================================================================
// QUẢN LÝ ĐƠN HÀNG & CẤP KEY
// ============================================================================
function renderAdminOrders() {
  const tbody = document.getElementById('adminOrdersBody');
  const q = (document.getElementById('orderSearchInput')?.value || '').trim().toLowerCase();

  const filtered = adminState.orders.filter(o => {
    if (!q) return true;
    return (
      String(o.id).toLowerCase().includes(q) ||
      String(o.customerPhone).toLowerCase().includes(q) ||
      String(o.hardwareId).toLowerCase().includes(q) ||
      String(o.toolName).toLowerCase().includes(q)
    );
  });

  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:28px; color:var(--text-secondary);">Chưa có đơn hàng nào khớp bộ lọc.</td></tr>`;
    return;
  }

  const badgeHtml = status => {
    const map = {
      pending: '<span class="status-badge status-pending">⏳ Chờ xác nhận</span>',
      paid: '<span class="status-badge status-paid">💎 Đã thanh toán</span>',
      key_sent: '<span class="status-badge status-key_sent">✅ Đã cấp Key</span>',
      cancelled: '<span class="status-badge status-cancelled">Đã hủy</span>'
    };
    return map[status] || map.pending;
  };

  tbody.innerHTML = filtered
    .map(o => {
      const cleanPhone = String(o.customerPhone || '').replace(/[^0-9]/g, '');
      return `
      <tr>
        <td class="mono" style="font-weight:700; color:#38bdf8;">${esc(o.id)}</td>
        <td>
          <strong>${esc(o.customerPhone)}</strong>
          <div>
            <a href="https://zalo.me/${cleanPhone}" target="_blank" style="font-size:11.5px; color:#60a5fa;">💬 Mở Zalo khách</a>
          </div>
        </td>
        <td>
          <strong>${esc(o.toolName)}</strong>
          <div style="font-size:12px; color:#a5b4fc;">${esc(o.planName)}</div>
        </td>
        <td class="mono" style="font-size:12.5px; color:#facc15;">${esc(o.hardwareId)}</td>
        <td style="font-weight:700;">${fmtVnd(o.amount)}</td>
        <td>${badgeHtml(o.status)}</td>
        <td>
          <div style="display:flex; gap:6px;">
            <button type="button" class="btn btn-primary btn-sm" onclick="openIssueKeyModal('${esc(o.id)}')">
              🔑 ${o.status === 'key_sent' ? 'Xem/Sửa Key' : 'Cấp Key'}
            </button>
            <button type="button" class="btn btn-danger btn-sm" onclick="deleteOrder('${esc(o.id)}')" title="Xóa đơn">🗑️</button>
          </div>
        </td>
      </tr>`;
    })
    .join('');
}

function openIssueKeyModal(orderId) {
  const order = adminState.orders.find(o => o.id === orderId);
  if (!order) return;

  document.getElementById('issueOrderId').value = order.id;
  document.getElementById('issueStatus').value = order.status || 'pending';
  document.getElementById('issueHardwareId').value = order.hardwareId || '';
  document.getElementById('issueLicenseKey').value = order.licenseKey || '';

  document.getElementById('issueOrderSummary').innerHTML = `
    <div>Mã đơn: <strong class="mono" style="color:#38bdf8;">${esc(order.id)}</strong> • SĐT khách: <strong>${esc(order.customerPhone)}</strong></div>
    <div>Sản phẩm: <strong>${esc(order.toolName)}</strong> (${esc(order.planName)} — ${fmtVnd(order.amount)})</div>
  `;

  openAdminModal('issueKeyModal');
}

async function saveIssuedKey() {
  const orderId = document.getElementById('issueOrderId').value;
  const status = document.getElementById('issueStatus').value;
  const hardwareId = document.getElementById('issueHardwareId').value;
  const licenseKey = document.getElementById('issueLicenseKey').value.trim();

  const finalStatus = licenseKey && status === 'pending' ? 'key_sent' : status;

  try {
    await apiAdmin(`/api/admin/orders/${encodeURIComponent(orderId)}`, 'POST', {
      status: finalStatus,
      hardwareId,
      licenseKey
    });
    closeAdminModal('issueKeyModal');
    toast('✅ Đã lưu trạng thái & Key bản quyền cho khách!');
    await refreshDashboard();
  } catch (err) {
    toast('❌ ' + err.message);
  }
}

async function deleteOrder(orderId) {
  if (!confirm(`Bạn chắc chắn muốn xóa đơn ${orderId}?`)) return;
  try {
    await apiAdmin(`/api/admin/orders/${encodeURIComponent(orderId)}`, 'DELETE');
    toast('🗑️ Đã xóa đơn hàng.');
    await refreshDashboard();
  } catch (err) {
    toast('❌ ' + err.message);
  }
}

// ============================================================================
// QUẢN LÝ TOOL & BẢNG GIÁ
// ============================================================================
function renderAdminTools() {
  const tbody = document.getElementById('adminToolsBody');
  if (!adminState.tools.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:28px;">Chưa có phần mềm nào. Bấm "+ Thêm Tool Mới" để bắt đầu!</td></tr>`;
    return;
  }

  tbody.innerHTML = adminState.tools
    .map(t => {
      const priceText = (t.plans || []).map(p => `${esc(p.name)}: <strong>${fmtVnd(p.price)}</strong>`).join('<br/>');
      const hasGpu = Boolean(t.downloadUrlGpu) || (Array.isArray(t.downloadGpuParts) && t.downloadGpuParts.length > 0);
      const dlStatus =
        t.downloadUrl && t.downloadUrl !== '#'
          ? hasGpu
            ? '✅ 2 Bản (CPU + GPU)'
            : '✅ Đã gắn Link tải'
          : '⚪ Chưa gắn Link';
      const vidStatus = t.demoVideoUrl ? '🎬 Có Video Demo' : '🎨 Ảnh bìa tự động';

      return `
      <tr>
        <td>
          <strong style="font-size:15px;">${esc(t.name)}</strong>
          <div style="font-size:12px; color:var(--text-secondary);">${esc(t.subtitle)}</div>
        </td>
        <td class="mono" style="color:#38bdf8; font-weight:700;">${esc(t.code || 'TOOL')}</td>
        <td style="font-size:12.5px; line-height:1.5;">${priceText}</td>
        <td style="font-size:12px; color:var(--text-secondary);">${dlStatus}<br/>${vidStatus}</td>
        <td>
          ${
            t.active !== false
              ? '<span class="status-badge status-key_sent">Đang bán</span>'
              : '<span class="status-badge status-cancelled">Đang ẩn</span>'
          }
        </td>
        <td>
          <div style="display:flex; gap:6px;">
            <button type="button" class="btn btn-outline btn-sm" onclick="openToolEditor('${esc(t.id)}')">✏️ Sửa</button>
            <button type="button" class="btn btn-danger btn-sm" onclick="deleteTool('${esc(t.id)}')">🗑️</button>
          </div>
        </td>
      </tr>`;
    })
    .join('');
}

function openToolEditor(toolId) {
  const t = toolId ? adminState.tools.find(item => item.id === toolId) : null;
  document.getElementById('toolEditorTitle').textContent = t
    ? `✏️ Chỉnh Sửa: ${t.name}`
    : '➕ Thêm Phần Mềm Mới Lên Cửa Hàng';

  document.getElementById('editToolId').value = t ? t.id : '';
  document.getElementById('editToolName').value = t ? t.name : '';
  document.getElementById('editToolCode').value = t ? t.code || '' : '';
  document.getElementById('editToolBadge').value = t ? t.badge || 'PRO' : 'MỚI RA MẮT';
  document.getElementById('editToolSubtitle').value = t ? t.subtitle || '' : '';
  document.getElementById('editToolCategory').value = t ? t.category || 'youtube-video' : 'youtube-video';
  document.getElementById('editToolVersion').value = t ? t.version || 'v1.0' : 'v1.0 Portable';
  document.getElementById('editToolShortDesc').value = t ? t.shortDesc || '' : '';
  document.getElementById('editToolDownloadUrl').value = t && t.downloadUrl !== '#' ? t.downloadUrl : '';
  document.getElementById('editToolDownloadUrlGpu').value = t ? t.downloadUrlGpu || '' : '';
  document.getElementById('editToolDemoUrl').value = t ? t.demoVideoUrl || '' : '';
  document.getElementById('editToolTheme').value = t ? t.visualTheme || 'barchart' : 'barchart';
  document.getElementById('editToolCustomImg').value = t ? t.customImageUrl || '' : '';
  document.getElementById('editToolFeatures').value = t && Array.isArray(t.features) ? t.features.join('\n') : '';
  document.getElementById('editToolActive').checked = t ? t.active !== false : true;
  document.getElementById('editToolReqHw').checked = t ? t.requireHardwareId !== false : true;

  const plans = (t && t.plans) || [
    { id: '1m', name: 'Gói 1 Tháng', price: 199000, originalPrice: 299000 },
    { id: '6m', name: 'Gói 6 Tháng', price: 349000, originalPrice: 599000 },
    { id: 'lifetime', name: 'Vĩnh Viễn VIP', price: 499000, originalPrice: 899000, popular: true }
  ];

  const p1 = plans[0] || { name: 'Gói 1 Tháng', price: 199000, originalPrice: 299000 };
  const p2 = plans[1] || { name: 'Gói 6 Tháng', price: 349000, originalPrice: 599000 };
  const p3 = plans[2] || { name: 'Vĩnh Viễn VIP', price: 499000, originalPrice: 899000 };

  document.getElementById('p1Name').value = p1.name || 'Gói 1 Tháng';
  document.getElementById('p1Price').value = p1.price || '';
  document.getElementById('p1Old').value = p1.originalPrice || '';

  document.getElementById('p2Name').value = p2.name || 'Gói 6 Tháng';
  document.getElementById('p2Price').value = p2.price || '';
  document.getElementById('p2Old').value = p2.originalPrice || '';

  document.getElementById('p3Name').value = p3.name || 'Vĩnh Viễn VIP';
  document.getElementById('p3Price').value = p3.price || '';
  document.getElementById('p3Old').value = p3.originalPrice || '';

  openAdminModal('toolEditorModal');
}

async function saveToolFromModal(e) {
  e.preventDefault();
  const plans = [];
  const p1Price = Number(document.getElementById('p1Price').value) || 0;
  const p2Price = Number(document.getElementById('p2Price').value) || 0;
  const p3Price = Number(document.getElementById('p3Price').value) || 0;

  if (p1Price > 0) {
    plans.push({
      id: '1m',
      name: document.getElementById('p1Name').value.trim() || 'Gói 1 Tháng',
      duration: '30 ngày',
      price: p1Price,
      originalPrice: Number(document.getElementById('p1Old').value) || 0
    });
  }
  if (p2Price > 0) {
    plans.push({
      id: '6m',
      name: document.getElementById('p2Name').value.trim() || 'Gói 6 Tháng',
      duration: '180 ngày',
      price: p2Price,
      originalPrice: Number(document.getElementById('p2Old').value) || 0
    });
  }
  if (p3Price > 0) {
    plans.push({
      id: 'lifetime',
      name: document.getElementById('p3Name').value.trim() || 'Vĩnh Viễn VIP',
      duration: 'Trọn đời + Update Free',
      price: p3Price,
      originalPrice: Number(document.getElementById('p3Old').value) || 0,
      popular: true
    });
  }

  const toolPayload = {
    id: document.getElementById('editToolId').value.trim() || undefined,
    name: document.getElementById('editToolName').value.trim(),
    code: document.getElementById('editToolCode').value.trim() || 'TOOL',
    badge: document.getElementById('editToolBadge').value.trim(),
    subtitle: document.getElementById('editToolSubtitle').value.trim(),
    category: document.getElementById('editToolCategory').value,
    version: document.getElementById('editToolVersion').value.trim(),
    shortDesc: document.getElementById('editToolShortDesc').value.trim(),
    downloadUrl: document.getElementById('editToolDownloadUrl').value.trim() || '#',
    downloadUrlGpu: document.getElementById('editToolDownloadUrlGpu').value.trim(),
    downloadGpuParts: (adminState.tools.find(item => item.id === document.getElementById('editToolId').value.trim()) || {}).downloadGpuParts || [],
    demoVideoUrl: document.getElementById('editToolDemoUrl').value.trim(),
    visualTheme: document.getElementById('editToolTheme').value,
    customImageUrl: document.getElementById('editToolCustomImg').value.trim(),
    features: document
      .getElementById('editToolFeatures')
      .value.split('\n')
      .map(s => s.trim())
      .filter(Boolean),
    active: document.getElementById('editToolActive').checked,
    requireHardwareId: document.getElementById('editToolReqHw').checked,
    plans
  };

  try {
    await apiAdmin('/api/admin/tools', 'POST', { tool: toolPayload });
    closeAdminModal('toolEditorModal');
    toast('✅ Đã lưu thông tin phần mềm lên cửa hàng!');
    await refreshDashboard();
  } catch (err) {
    toast('❌ ' + err.message);
  }
}

async function deleteTool(toolId) {
  const t = adminState.tools.find(item => item.id === toolId);
  if (!confirm(`Bạn có chắc muốn xóa phần mềm "${t ? t.name : toolId}" khỏi web?`)) return;
  try {
    await apiAdmin(`/api/admin/tools/${encodeURIComponent(toolId)}`, 'DELETE');
    toast('🗑️ Đã xóa phần mềm.');
    await refreshDashboard();
  } catch (err) {
    toast('❌ ' + err.message);
  }
}

// ============================================================================
// CẤU HÌNH VIETQR & THÔNG TIN SHOP
// ============================================================================
function populateBankForm() {
  const b = adminState.bankConfig || {};
  const select = document.getElementById('cfgBankId');
  const matchOpt = Array.from(select.options).find(opt => opt.value.startsWith((b.bankId || 'MB') + '|'));
  if (matchOpt) select.value = matchOpt.value;

  document.getElementById('cfgAccNo').value = b.accountNo || '';
  document.getElementById('cfgAccName').value = b.accountName || '';
  document.getElementById('cfgMemoPrefix').value = b.memoPrefix || 'MTP';
  updateAdminQrPreview();
}

function updateAdminQrPreview() {
  const [bankId] = (document.getElementById('cfgBankId').value || 'MB|MB Bank').split('|');
  const accNo = (document.getElementById('cfgAccNo').value || '').trim();
  const accName = (document.getElementById('cfgAccName').value || 'MTP HUB').trim();
  const prefix = (document.getElementById('cfgMemoPrefix').value || 'MTP').trim();
  const box = document.getElementById('adminQrPreviewBox');

  if (!accNo) {
    box.innerHTML = `<div style="padding:18px; text-align:center; font-size:12.5px; color:#64748b;">Nhập <strong>Số tài khoản</strong> bên trái để xem trực tiếp mã VietQR thật tại đây</div>`;
    return;
  }
  const url = `https://img.vietqr.io/image/${encodeURIComponent(bankId)}-${encodeURIComponent(accNo)}-compact2.png?amount=499000&addInfo=${encodeURIComponent(prefix + ' IZPRO 0397022195')}&accountName=${encodeURIComponent(accName)}`;
  box.innerHTML = `<img src="${url}" alt="Xem trước mã VietQR" />`;
}

async function saveBankSettings(e) {
  e.preventDefault();
  const [bankId, bankName] = (document.getElementById('cfgBankId').value || 'MB|MB Bank').split('|');
  const bankConfig = {
    bankId,
    bankName,
    accountNo: document.getElementById('cfgAccNo').value.trim(),
    accountName: document.getElementById('cfgAccName').value.trim().toUpperCase(),
    memoPrefix: document.getElementById('cfgMemoPrefix').value.trim().toUpperCase() || 'MTP'
  };

  try {
    await apiAdmin('/api/admin/settings', 'POST', { bankConfig });
    toast('🏦 Đã lưu cấu hình ngân hàng VietQR thành công!');
    await refreshDashboard();
  } catch (err) {
    toast('❌ ' + err.message);
  }
}

function populateSettingsForm() {
  const s = adminState.settings || {};
  document.getElementById('setBrandName').value = s.brandName || 'MTP HUB';
  document.getElementById('setDomain').value = s.domain || 'mtphub.com';
  document.getElementById('setZalo').value = s.zalo || '0397022195';
  document.getElementById('setTeleLink').value = s.telegramLink || 'https://t.me/+84397022195';
  document.getElementById('setHeroTitle').value = s.heroTitle || '';
  document.getElementById('setHeroSubtitle').value = s.heroSubtitle || '';
  document.getElementById('setAnnouncement').value = s.announcement || '';
}

async function saveGeneralSettings(e) {
  e.preventDefault();
  const zaloDigits = document.getElementById('setZalo').value.trim();
  const settings = {
    ...adminState.settings,
    brandName: document.getElementById('setBrandName').value.trim(),
    domain: document.getElementById('setDomain').value.trim(),
    phone: zaloDigits,
    zalo: zaloDigits,
    telegramLink: document.getElementById('setTeleLink').value.trim(),
    heroTitle: document.getElementById('setHeroTitle').value.trim(),
    heroSubtitle: document.getElementById('setHeroSubtitle').value.trim(),
    announcement: document.getElementById('setAnnouncement').value.trim()
  };

  const newPassword = document.getElementById('setNewPassword').value.trim();

  try {
    const res = await apiAdmin('/api/admin/settings', 'POST', {
      settings,
      newPassword: newPassword || undefined
    });
    if (res.newToken) {
      adminState.token = res.newToken;
      localStorage.setItem(ADMIN_TOKEN_KEY, res.newToken);
      document.getElementById('setNewPassword').value = '';
    }
    toast('✅ ' + (res.message || 'Đã cập nhật cài đặt cửa hàng!'));
    await refreshDashboard();
  } catch (err) {
    toast('❌ ' + err.message);
  }
}

function exportBackupJson() {
  const payload = {
    exportedAt: new Date().toISOString(),
    settings: adminState.settings,
    bankConfig: adminState.bankConfig,
    tools: adminState.tools,
    orders: adminState.orders
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mtphub-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  toast('📥 Đã tải xuống bản sao lưu dữ liệu MTP Hub!');
}

function openAdminModal(id) {
  document.getElementById(id)?.classList.add('open');
}

function closeAdminModal(id) {
  document.getElementById(id)?.classList.remove('open');
}

async function publishToLiveWeb() {
  const btn = document.getElementById('publishLiveBtn');
  const oldLabel = btn ? btn.textContent : '';
  if (btn) {
    btn.disabled = true;
    btn.textContent = '⏳ Đang đẩy lên mtphub.com...';
  }
  try {
    const res = await apiAdmin('/api/admin/publish', 'POST', {});
    toast('🚀 ' + (res.message || 'Đã cập nhật lên https://mtphub.com/ thành công!'));
  } catch (err) {
    toast('❌ Lỗi đẩy web online: ' + err.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = oldLabel || '🚀 Cập Nhật Lên mtphub.com';
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const host = window.location.hostname;
  const isLocal = host === 'localhost' || host === '127.0.0.1';
  if (!isLocal) {
    const notice = document.getElementById('cloudAdminNotice');
    const form = document.getElementById('adminLoginForm');
    if (notice) notice.style.display = 'block';
    if (form) form.style.display = 'none';
    return;
  }
  if (adminState.token) {
    refreshDashboard();
  }
});
