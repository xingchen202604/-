/* =============================================
   充电桩AI选址分析驾驶舱 — 共享数据与逻辑
   ============================================= */

// ===== 静态演示数据（飞书联动说明见底部）=====
const SITES = [
  {
    id: 1, name: '惠州南站商业综合体', addr: '惠城区演达大道99号',
    lat: 23.0715, lng: 114.4126,
    scene: '交通枢纽', status: '建议投资', score: 91, integrity: 92,
    piles: 20, payback: '18个月', risk: '低', decidable: true,
    missing: [], recommend: true,
    dims: { traffic: 95, commerce: 88, competition: 72, policy: 90, power: 85 }
  },
  {
    id: 2, name: '仲恺高新区产业园', addr: '仲恺区陈江街道科技三路',
    lat: 23.0382, lng: 114.5254,
    scene: '产业园区', status: '待人工补充', score: 87, integrity: 68,
    piles: 15, payback: '22个月', risk: '低', decidable: false,
    missing: ['用电负荷数据', '物业合作意向书'],
    recommend: true,
    dims: { traffic: 80, commerce: 75, competition: 65, policy: 88, power: 0 }
  },
  {
    id: 3, name: '大亚湾石化区配套园', addr: '大亚湾区响水河西路',
    lat: 22.7412, lng: 114.5965,
    scene: '工业区配套', status: '建议投资', score: 84, integrity: 88,
    piles: 12, payback: '24个月', risk: '低', decidable: true,
    missing: [], recommend: true,
    dims: { traffic: 78, commerce: 70, competition: 80, policy: 85, power: 90 }
  },
  {
    id: 4, name: '博罗长宁汽车服务区', addr: '博罗县长宁镇广惠高速旁',
    lat: 23.3142, lng: 114.7835,
    scene: '高速服务区', status: '待分析', score: 0, integrity: 35,
    piles: 0, payback: '--', risk: '--', decidable: false,
    missing: ['周边用户规模', '日均流量数据', '竞品站点数据'],
    recommend: false,
    dims: { traffic: 0, commerce: 0, competition: 0, policy: 0, power: 0 }
  },
  {
    id: 5, name: '惠东县城购物中心', addr: '惠东县平山街道商业中心',
    lat: 22.9857, lng: 114.7223,
    scene: '商业综合体', status: '分析中', score: 79, integrity: 75,
    piles: 10, payback: '26个月', risk: '中', decidable: false,
    missing: ['停车场产权确认'],
    recommend: false,
    dims: { traffic: 82, commerce: 85, competition: 60, policy: 75, power: 78 }
  },
  {
    id: 6, name: '龙门县偏远山区驿站', addr: '龙门县龙华镇山区公路旁',
    lat: 23.7265, lng: 114.2548,
    scene: '公路驿站', status: '不建议', score: 28, integrity: 80,
    piles: 0, payback: '--', risk: '高', decidable: true,
    missing: [], recommend: false,
    dims: { traffic: 20, commerce: 15, competition: 90, policy: 60, power: 55 }
  },
  {
    id: 7, name: '惠阳区工业厂区旁', addr: '惠阳区秋长街道工业园内',
    lat: 22.7892, lng: 114.4621,
    scene: '工业区配套', status: '不建议', score: 32, integrity: 82,
    piles: 0, payback: '--', risk: '高', decidable: true,
    missing: [], recommend: false,
    dims: { traffic: 35, commerce: 28, competition: 75, policy: 50, power: 60 }
  },
  {
    id: 8, name: '博罗罗阳旧城区', addr: '博罗县罗阳镇旧城中心',
    lat: 23.1658, lng: 114.3027,
    scene: '城区商业', status: '待人工补充', score: 55, integrity: 55,
    piles: 8, payback: '30个月', risk: '中', decidable: false,
    missing: ['产权信息', '用电容量'],
    recommend: false,
    dims: { traffic: 60, commerce: 65, competition: 45, policy: 55, power: 0 }
  },
  {
    id: 9, name: '大亚湾淡澳河岸边', addr: '大亚湾区淡澳街道河岸',
    lat: 22.7185, lng: 114.5412,
    scene: '公共停车场', status: '已确认', score: 61, integrity: 90,
    piles: 6, payback: '28个月', risk: '中', decidable: true,
    missing: [], recommend: false,
    dims: { traffic: 65, commerce: 55, competition: 50, policy: 70, power: 75 }
  },
  {
    id: 10, name: '惠城区万达广场', addr: '惠城区江北万达商业广场',
    lat: 23.1024, lng: 114.3958,
    scene: '商业综合体', status: '建议投资', score: 88, integrity: 95,
    piles: 18, payback: '20个月', risk: '低', decidable: true,
    missing: [], recommend: true,
    dims: { traffic: 92, commerce: 95, competition: 70, policy: 85, power: 88 }
  }
];

const STATUS_COLOR = {
  '待分析':    '#00d4ff',
  '分析中':    '#1e6fff',
  '待人工补充': '#ff9a3c',
  '已确认':    '#c8d8f0',
  '建议投资':  '#00e5a0',
  '不建议':    '#ff4d6d',
  '自动完成':  '#00e5a0'
};

// ===== 时钟 =====
function startClock() {
  const el = document.getElementById('dbTime');
  if (!el) return;
  const tick = () => {
    const now = new Date();
    el.textContent = now.toLocaleString('zh-CN', {
      month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };
  tick();
  setInterval(tick, 1000);
}

// ===== KPI 数字滚动 =====
function animateCounters() {
  document.querySelectorAll('.kpi-value[data-target]').forEach(el => {
    const target = parseInt(el.dataset.target);
    let current = 0;
    const step = Math.ceil(target / 40);
    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = current;
      if (current >= target) clearInterval(timer);
    }, 30);
  });
}

// ===== 首页地图 =====
function initOverviewMap() {
  const mapEl = document.getElementById('overviewMap');
  if (!mapEl) return;

  const map = L.map('overviewMap', {
    center: [23.09, 114.42],
    zoom: 10,
    zoomControl: true,
    attributionControl: true
  });

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© CartoDB',
    maxZoom: 19
  }).addTo(map);

  const markers = [];

  SITES.forEach(site => {
    const color = STATUS_COLOR[site.status] || '#c8d8f0';
    const icon = L.divIcon({
      html: `<div style="
        width:14px;height:14px;border-radius:50%;
        background:${color};
        border:2px solid rgba(255,255,255,0.3);
        box-shadow:0 0 8px ${color},0 0 16px ${color}40;
        animation: markerPulse 2s infinite alternate;
      "></div>
      <style>
        @keyframes markerPulse {
          from { transform: scale(1); }
          to   { transform: scale(1.25); }
        }
      </style>`,
      className: '',
      iconSize: [14, 14],
      iconAnchor: [7, 7]
    });

    const marker = L.marker([site.lat, site.lng], { icon }).addTo(map);
    marker.on('click', () => openSitePopup(site));
    markers.push({ marker, site });
  });

  // 层级筛选按钮
  document.querySelectorAll('[data-layer]').forEach(btn => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('[data-layer]').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      const layer = this.dataset.layer;
      markers.forEach(({ marker, site }) => {
        if (layer === 'all') {
          map.addLayer(marker);
        } else if (layer === 'recommend') {
          site.recommend ? map.addLayer(marker) : map.removeLayer(marker);
        } else if (layer === 'risk') {
          site.risk === '高' ? map.addLayer(marker) : map.removeLayer(marker);
        }
      });
    });
  });

  // 点击首页排名跳转地图高亮
  document.querySelectorAll('.rank-item').forEach(item => {
    item.addEventListener('click', () => {
      const id = parseInt(item.dataset.id);
      const site = SITES.find(s => s.id === id);
      if (site) {
        map.setView([site.lat, site.lng], 13, { animate: true });
        openSitePopup(site);
      }
    });
  });
}

// ===== 弹窗 =====
function openSitePopup(site) {
  document.getElementById('popupTitle').textContent = site.name;
  document.getElementById('popupAddr').textContent = site.addr;
  document.getElementById('popupScore').textContent = site.score || '--';
  document.getElementById('popupIntegrity').textContent = site.integrity + '%';
  document.getElementById('popupPiles').textContent = site.piles || '--';

  const badges = document.getElementById('popupBadges');
  const color = STATUS_COLOR[site.status] || '#c8d8f0';
  badges.innerHTML = `
    <span style="padding:3px 10px;border-radius:3px;font-size:0.72rem;
      background:${color}20;color:${color};border:1px solid ${color}50">
      ${site.status}
    </span>
    <span style="padding:3px 10px;border-radius:3px;font-size:0.72rem;
      background:rgba(255,255,255,0.06);color:#6b8ab0">
      ${site.scene}
    </span>
    ${site.risk !== '--' ? `<span style="padding:3px 10px;border-radius:3px;font-size:0.72rem;
      background:${site.risk==='高'?'rgba(255,77,109,0.1)':site.risk==='中'?'rgba(255,154,60,0.1)':'rgba(0,229,160,0.1)'};
      color:${site.risk==='高'?'#ff4d6d':site.risk==='中'?'#ff9a3c':'#00e5a0'}">
      ${site.risk}风险</span>` : ''}
  `;

  document.getElementById('sitePopup').style.display = 'block';
  document.getElementById('dbOverlay').style.display = 'block';
}

// ===== 关闭弹窗 =====
function closePopup() {
  document.getElementById('sitePopup').style.display = 'none';
  document.getElementById('dbOverlay').style.display = 'none';
}

// ===== 状态环形图 =====
function initStatusChart() {
  const el = document.getElementById('statusChart');
  if (!el) return;
  const chart = echarts.init(el, null, { renderer: 'svg' });
  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(5,13,26,0.95)',
      borderColor: 'rgba(0,212,255,0.3)',
      textStyle: { color: '#c8d8f0', fontSize: 12 }
    },
    legend: {
      orient: 'vertical',
      right: 8,
      top: 'middle',
      itemWidth: 8,
      itemHeight: 8,
      itemGap: 10,
      textStyle: { color: '#6b8ab0', fontSize: 11 }
    },
    series: [{
      type: 'pie',
      radius: ['50%', '75%'],
      center: ['35%', '50%'],
      avoidLabelOverlap: false,
      label: { show: false },
      emphasis: {
        label: { show: true, fontSize: 13, fontWeight: 'bold', color: '#e8f4ff' }
      },
      data: [
        { value: 54, name: '建议投资', itemStyle: { color: '#00e5a0' } },
        { value: 21, name: '不建议',   itemStyle: { color: '#ff4d6d' } },
        { value: 14, name: '待补充',   itemStyle: { color: '#ff9a3c' } },
        { value: 38, name: '待分析',   itemStyle: { color: '#00d4ff' } },
        { value: 9,  name: '分析中',   itemStyle: { color: '#1e6fff' } },
        { value: 6,  name: '已确认',   itemStyle: { color: '#c8d8f0' } }
      ]
    }]
  };
  chart.setOption(option);
  window.addEventListener('resize', () => chart.resize());
}

// ===== 月度趋势图 =====
function initTrendChart() {
  const el = document.getElementById('trendChart');
  if (!el) return;
  const chart = echarts.init(el, null, { renderer: 'svg' });
  const months = ['11月', '12月', '1月', '2月', '3月', '4月'];
  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(5,13,26,0.95)',
      borderColor: 'rgba(0,212,255,0.3)',
      textStyle: { color: '#c8d8f0', fontSize: 12 }
    },
    grid: { top: 10, right: 16, bottom: 30, left: 36 },
    xAxis: {
      type: 'category',
      data: months,
      axisLine: { lineStyle: { color: 'rgba(0,212,255,0.2)' } },
      axisLabel: { color: '#6b8ab0', fontSize: 11 },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
      axisLabel: { color: '#6b8ab0', fontSize: 11 }
    },
    legend: {
      bottom: 0,
      itemWidth: 10, itemHeight: 3,
      textStyle: { color: '#6b8ab0', fontSize: 10 }
    },
    series: [
      {
        name: '新增点位',
        type: 'bar',
        data: [8, 12, 15, 18, 22, 24],
        itemStyle: { color: 'rgba(0,212,255,0.6)', borderRadius: [3,3,0,0] }
      },
      {
        name: '完成分析',
        type: 'line',
        data: [5, 9, 11, 14, 17, 20],
        smooth: true,
        symbol: 'circle',
        symbolSize: 5,
        lineStyle: { color: '#00e5a0', width: 2 },
        itemStyle: { color: '#00e5a0' },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(0,229,160,0.25)' },
              { offset: 1, color: 'rgba(0,229,160,0)' }
            ]
          }
        }
      }
    ]
  };
  chart.setOption(option);
  window.addEventListener('resize', () => chart.resize());
}

// ===== 地图分析页 =====
function initAnalysisMap() {
  const mapEl = document.getElementById('analysisMap');
  if (!mapEl) return;

  const map = L.map('analysisMap', {
    center: [23.0715, 114.4126],
    zoom: 13,
    zoomControl: false
  });

  L.control.zoom({ position: 'bottomright' }).addTo(map);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© CartoDB',
    maxZoom: 19
  }).addTo(map);

  let currentSite = SITES[0];
  let circles = [];
  let competitorMarkers = [];

  const COMPETITORS = [
    { lat: 23.0682, lng: 114.4058, name: '特斯拉超充站', brand: '特斯拉' },
    { lat: 23.0761, lng: 114.4201, name: '国家电网充电站', brand: '国网' },
    { lat: 23.0640, lng: 114.4215, name: '星星充电A站', brand: '星星' },
    { lat: 23.0720, lng: 114.4080, name: '小桔充电', brand: '小桔' },
    { lat: 23.0800, lng: 114.4150, name: '云快充', brand: '云快充' }
  ];

  function loadSite(site) {
    currentSite = site;
    circles.forEach(c => map.removeLayer(c));
    competitorMarkers.forEach(m => map.removeLayer(m));
    circles = [];
    competitorMarkers = [];

    map.setView([site.lat, site.lng], 13, { animate: true });

    // 主点位
    const mainIcon = L.divIcon({
      html: `<div style="
        width:18px;height:18px;border-radius:50%;
        background:#00d4ff;
        border:3px solid rgba(255,255,255,0.5);
        box-shadow:0 0 16px #00d4ff,0 0 32px #00d4ff60;
        position:relative;
      ">
        <div style="
          position:absolute;top:50%;left:50%;
          transform:translate(-50%,-50%);
          width:6px;height:6px;border-radius:50%;background:#fff;
        "></div>
      </div>`,
      className: '',
      iconSize: [18, 18],
      iconAnchor: [9, 9]
    });
    L.marker([site.lat, site.lng], { icon: mainIcon }).addTo(map)
      .bindTooltip(`<b>${site.name}</b>`, { className: 'db-tooltip', permanent: false });

    // 半径圈
    const radii = [
      { r: 1000, color: '#00d4ff', label: '1km' },
      { r: 3000, color: '#1e6fff', label: '3km' },
      { r: 5000, color: '#ff9a3c', label: '5km' }
    ];
    radii.forEach(({ r, color, label }) => {
      const c = L.circle([site.lat, site.lng], {
        radius: r,
        color,
        weight: 1,
        opacity: 0.5,
        fillOpacity: 0.04,
        dashArray: '4 4'
      }).addTo(map);
      circles.push(c);

      // 标签
      const labelIcon = L.divIcon({
        html: `<span style="font-size:0.65rem;color:${color};opacity:0.7;white-space:nowrap;">${label}</span>`,
        className: '',
        iconSize: [30, 14]
      });
      const lblMarker = L.marker([site.lat + r / 111320 * 0.8, site.lng], { icon: labelIcon }).addTo(map);
      circles.push(lblMarker);
    });

    // 竞品标记
    COMPETITORS.forEach(comp => {
      const icon = L.divIcon({
        html: `<div style="
          width:10px;height:10px;border-radius:50%;
          background:#ff4d6d;
          border:1.5px solid rgba(255,255,255,0.3);
          box-shadow:0 0 6px #ff4d6d;
        "></div>`,
        className: '',
        iconSize: [10, 10],
        iconAnchor: [5, 5]
      });
      const m = L.marker([comp.lat, comp.lng], { icon }).addTo(map)
        .bindTooltip(`竞品：${comp.name}`, { className: 'db-tooltip' });
      competitorMarkers.push(m);
    });

    // 热力感圈（POI密度模拟）
    const heatPoints = [
      [site.lat + 0.004, site.lng + 0.003],
      [site.lat - 0.003, site.lng + 0.005],
      [site.lat + 0.006, site.lng - 0.002]
    ];
    heatPoints.forEach(([lat, lng]) => {
      const hc = L.circle([lat, lng], {
        radius: 400,
        color: '#ffd166',
        weight: 0,
        fillOpacity: 0.12,
        fillColor: '#ffd166'
      }).addTo(map);
      circles.push(hc);
    });

    updateResultCard(site);
    updateSiteListActive(site.id);
  }

  function updateResultCard(site) {
    const card = document.getElementById('resultCard');
    if (!card) return;
    const color = STATUS_COLOR[site.status] || '#c8d8f0';
    const verdictClass = site.status === '建议投资' ? 'verdict-invest'
      : site.status === '不建议' ? 'verdict-no' : 'verdict-pending';

    card.innerHTML = `
      <div style="margin-bottom:12px;">
        <div style="font-size:1rem;font-weight:700;color:#e8f4ff;margin-bottom:4px;">${site.name}</div>
        <div style="font-size:0.72rem;color:#6b8ab0;">${site.addr}</div>
      </div>

      <div class="result-verdict">
        <span class="verdict-badge ${verdictClass}">${site.status}</span>
        <span style="font-size:0.72rem;color:#6b8ab0;">${site.scene}</span>
      </div>

      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
        <span style="padding:2px 8px;border-radius:3px;font-size:0.7rem;
          background:rgba(0,212,255,0.1);color:#00d4ff;border:1px solid rgba(0,212,255,0.3);">
          AI评分 ${site.score || '--'}
        </span>
        <span style="padding:2px 8px;border-radius:3px;font-size:0.7rem;
          background:${site.decidable?'rgba(0,229,160,0.1)':'rgba(255,154,60,0.1)'};
          color:${site.decidable?'#00e5a0':'#ff9a3c'};
          border:1px solid ${site.decidable?'rgba(0,229,160,0.3)':'rgba(255,154,60,0.3)'};">
          ${site.decidable?'✓ 可决策':'⚠ 不可决策'}
        </span>
        <span style="padding:2px 8px;border-radius:3px;font-size:0.7rem;
          background:${site.risk==='高'?'rgba(255,77,109,0.1)':site.risk==='中'?'rgba(255,154,60,0.1)':site.risk==='低'?'rgba(0,229,160,0.1)':'rgba(255,255,255,0.05)'};
          color:${site.risk==='高'?'#ff4d6d':site.risk==='中'?'#ff9a3c':site.risk==='低'?'#00e5a0':'#6b8ab0'};">
          ${site.risk !== '--' ? site.risk + '风险' : '待评估'}
        </span>
      </div>

      <div class="integrity-bar">
        <div class="integrity-label">
          <span>数据完整度</span>
          <span style="color:${site.integrity >= 80 ? '#00e5a0' : site.integrity >= 60 ? '#ffd166' : '#ff9a3c'}">${site.integrity}%</span>
        </div>
        <div class="integrity-track">
          <div class="integrity-fill" style="width:${site.integrity}%"></div>
        </div>
      </div>

      <div class="data-items">
        <div class="data-row">
          <span class="data-row-key">建议桩数</span>
          <span class="data-row-val">${site.piles ? site.piles + '桩' : '--'}</span>
        </div>
        <div class="data-row">
          <span class="data-row-key">预估回本周期</span>
          <span class="data-row-val">${site.payback}</span>
        </div>
        <div class="data-row">
          <span class="data-row-key">风险等级</span>
          <span class="data-row-val" style="color:${site.risk==='高'?'#ff4d6d':site.risk==='中'?'#ff9a3c':'#00e5a0'}">${site.risk}</span>
        </div>
        <div class="data-row">
          <span class="data-row-key">是否建议投资</span>
          <span class="data-row-val" style="color:${site.recommend?'#00e5a0':'#ff4d6d'}">${site.recommend?'✓ 建议':'✗ 不建议'}</span>
        </div>
      </div>

      ${site.missing.length > 0 ? `
      <div style="margin-top:12px;padding:10px;background:rgba(255,154,60,0.06);border:1px solid rgba(255,154,60,0.2);border-radius:6px;">
        <div style="font-size:0.72rem;color:#ff9a3c;margin-bottom:6px;font-weight:600;">⚠ 缺失数据项</div>
        ${site.missing.map(m => `
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
            <span style="width:5px;height:5px;border-radius:50%;background:#ff9a3c;flex-shrink:0;"></span>
            <span style="font-size:0.72rem;color:#c8d8f0;">${m}</span>
            <span class="missing-tag">待补充</span>
          </div>
        `).join('')}
      </div>` : ''}

      <div style="margin-top:14px;display:flex;gap:8px;">
        <a href="dashboard-detail.html?id=${site.id}" class="db-btn-primary" style="flex:1;text-align:center;">查看详情</a>
        <button class="db-btn-outline" style="flex:1;" onclick="alert('飞书表格联动功能')">飞书记录</button>
      </div>
    `;
  }

  function updateSiteListActive(id) {
    document.querySelectorAll('.site-item-compact').forEach(el => {
      el.classList.toggle('active', parseInt(el.dataset.id) === id);
    });
  }

  // 渲染左侧点位列表
  function renderSiteList(filter = 'all') {
    const list = document.getElementById('siteListCompact');
    if (!list) return;
    const filtered = filter === 'all' ? SITES : SITES.filter(s => s.status === filter || s.scene === filter);
    list.innerHTML = filtered.map(site => {
      const color = STATUS_COLOR[site.status] || '#c8d8f0';
      return `
        <div class="site-item-compact" data-id="${site.id}" onclick="window._loadSite(${site.id})">
          <div class="site-item-name">${site.name}</div>
          <div class="site-item-status">
            <span style="width:6px;height:6px;border-radius:50%;background:${color};display:inline-block;"></span>
            ${site.status} · ${site.scene}
          </div>
        </div>
      `;
    }).join('');
  }

  window._loadSite = (id) => {
    const site = SITES.find(s => s.id === id);
    if (site) loadSite(site);
  };

  // 分析按钮
  const analyzeBtn = document.getElementById('analyzeBtn');
  if (analyzeBtn) {
    analyzeBtn.addEventListener('click', () => {
      analyzeBtn.textContent = '分析中...';
      analyzeBtn.disabled = true;
      setTimeout(() => {
        analyzeBtn.textContent = '开始分析';
        analyzeBtn.disabled = false;
        alert('AI分析完成！（演示模式）');
      }, 2000);
    });
  }

  // 状态筛选
  const statusFilter = document.getElementById('statusFilter');
  if (statusFilter) {
    statusFilter.addEventListener('change', () => renderSiteList(statusFilter.value));
  }

  renderSiteList();
  loadSite(SITES[0]);
}

// ===== 详情页雷达图 =====
function initRadarChart() {
  const el = document.getElementById('radarChart');
  if (!el) return;
  const site = SITES[0];
  const chart = echarts.init(el, null, { renderer: 'svg' });
  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      backgroundColor: 'rgba(5,13,26,0.95)',
      borderColor: 'rgba(0,212,255,0.3)',
      textStyle: { color: '#c8d8f0' }
    },
    radar: {
      indicator: [
        { name: '交通流量', max: 100 },
        { name: '商业活跃度', max: 100 },
        { name: '竞争强度', max: 100 },
        { name: '政策支持', max: 100 },
        { name: '电力配套', max: 100 }
      ],
      axisName: { color: '#6b8ab0', fontSize: 11 },
      splitLine: { lineStyle: { color: 'rgba(0,212,255,0.1)' } },
      splitArea: { areaStyle: { color: ['rgba(0,212,255,0.02)', 'transparent'] } },
      axisLine: { lineStyle: { color: 'rgba(0,212,255,0.15)' } }
    },
    series: [{
      type: 'radar',
      data: [{
        value: [site.dims.traffic, site.dims.commerce, site.dims.competition, site.dims.policy, site.dims.power],
        name: site.name,
        areaStyle: { color: 'rgba(0,212,255,0.12)' },
        lineStyle: { color: '#00d4ff', width: 2 },
        itemStyle: { color: '#00d4ff' }
      }]
    }]
  };
  chart.setOption(option);
  window.addEventListener('resize', () => chart.resize());
}

// ===== 详情页评分维度图 =====
function initScoreChart() {
  const el = document.getElementById('scoreChart');
  if (!el) return;
  const site = SITES[0];
  const chart = echarts.init(el, null, { renderer: 'svg' });
  const dims = ['交通流量', '商业活跃', '竞争情况', '政策支持', '电力配套'];
  const vals = [site.dims.traffic, site.dims.commerce, site.dims.competition, site.dims.policy, site.dims.power];
  const colors = vals.map(v => v >= 80 ? '#00e5a0' : v >= 60 ? '#00d4ff' : v >= 40 ? '#ffd166' : '#ff4d6d');
  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(5,13,26,0.95)',
      borderColor: 'rgba(0,212,255,0.3)',
      textStyle: { color: '#c8d8f0', fontSize: 12 }
    },
    grid: { top: 8, right: 16, bottom: 30, left: 70 },
    xAxis: {
      type: 'value',
      max: 100,
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
      axisLabel: { color: '#6b8ab0', fontSize: 10 }
    },
    yAxis: {
      type: 'category',
      data: dims,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#6b8ab0', fontSize: 11 }
    },
    series: [{
      type: 'bar',
      data: vals.map((v, i) => ({ value: v, itemStyle: { color: colors[i], borderRadius: [0, 3, 3, 0] } })),
      barWidth: 12,
      label: {
        show: true,
        position: 'right',
        color: '#c8d8f0',
        fontSize: 11
      }
    }]
  };
  chart.setOption(option);
  window.addEventListener('resize', () => chart.resize());
}

// ===== 页面入口 =====
document.addEventListener('DOMContentLoaded', () => {
  startClock();

  if (document.getElementById('overviewMap')) {
    animateCounters();
    initOverviewMap();
    initStatusChart();
    initTrendChart();

    const closeBtn = document.getElementById('popupClose');
    const overlay = document.getElementById('dbOverlay');
    if (closeBtn) closeBtn.addEventListener('click', closePopup);
    if (overlay) overlay.addEventListener('click', closePopup);
  }

  if (document.getElementById('analysisMap')) {
    initAnalysisMap();
  }

  if (document.getElementById('radarChart')) {
    initRadarChart();
  }

  if (document.getElementById('scoreChart')) {
    initScoreChart();
  }
});

/*
 * ===== 飞书数据联动说明 =====
 *
 * 当前状态：所有数据为静态演示数据（SITES 数组）
 *
 * 飞书联动方式：
 * 1. 配置飞书多维表格 Personal Access Token
 * 2. 替换 FEISHU_CONFIG 中的 app_token 和 table_id
 * 3. 调用 loadFromFeishu() 函数拉取真实数据
 *
 * const FEISHU_CONFIG = {
 *   base_url: 'https://open.feishu.cn/open-apis/bitable/v1',
 *   app_token: 'YOUR_APP_TOKEN',
 *   tables: {
 *     sites:    'TABLE_ID_选址池',
 *     analysis: 'TABLE_ID_AI分析表',
 *     raw_data: 'TABLE_ID_原始数据明细',
 *   }
 * };
 *
 * async function loadFromFeishu() {
 *   const res = await fetch(`${FEISHU_CONFIG.base_url}/apps/${FEISHU_CONFIG.app_token}/tables/${FEISHU_CONFIG.tables.sites}/records`, {
 *     headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
 *   });
 *   const data = await res.json();
 *   return data.data.items.map(mapFeishuToSite);
 * }
 */
