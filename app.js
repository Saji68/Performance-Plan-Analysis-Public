/* =====================================================================
   داشبورد تجربه همکاری — لایهٔ نمایش
   ===================================================================== */
(function () {
  'use strict';
  const C = window.Core;
  const $ = s => document.querySelector(s);
  const el = (t, a, kids) => {
    const n = document.createElement(t);
    if (a) for (const k in a) {
      if (k === 'class') n.className = a[k];
      else if (k === 'text') n.textContent = a[k];
      else if (k === 'html') n.innerHTML = a[k];
      else if (k.startsWith('on')) n.addEventListener(k.slice(2), a[k]);
      else if (a[k] !== null && a[k] !== undefined) n.setAttribute(k, a[k]);
    }
    (kids || []).forEach(c => c && n.appendChild(c));
    return n;
  };
  const fa = C.faDigits;
  const num = (v, d) => (v === null || v === undefined) ? '—' : fa(d === undefined ? String(v) : Number(v).toFixed(d));
  const pct = v => fa(Math.round(v * 100)) + '٪';

  const STORE = 'mofid-hamkari-v1';
  const TAGCLASS = {
    [C.TAGS.HIGH]: 't-hi', [C.TAGS.LOW]: 't-lo', [C.TAGS.DIFF]: 't-diff',
    [C.TAGS.CONFLICT]: 't-conf', [C.TAGS.OK]: 't-ok', [C.TAGS.THIN]: 't-mute', [C.TAGS.NONE]: 't-mute'
  };
  const TAGVAR = {
    [C.TAGS.HIGH]: 'var(--hi)', [C.TAGS.LOW]: 'var(--lo)', [C.TAGS.DIFF]: 'var(--diff)',
    [C.TAGS.CONFLICT]: 'var(--conf)', [C.TAGS.OK]: 'var(--ok)', [C.TAGS.THIN]: 'var(--mute)', [C.TAGS.NONE]: 'var(--mute)'
  };
  const LEANCLASS = { pos: 'ln-pos', neg: 'ln-neg', mixed: 'ln-mix', neutral: 'ln-neu', none: 'ln-neu' };

  /* ---------- دادهٔ نمونه (تا وقتی فایل واقعی بارگذاری نشده) ---------- */
  const A = {
    over: 'ذی‌نفعان - بیش از انتظارات عمل کرده است',
    full: 'ذی‌نفعان - انتظارات را کامل و مطلوب انجام داده است',
    good: 'ذی‌نفعان - انتظارات تا حد خوبی انجام شده است',
    none: 'ذی‌نفعان - انتظارات برآورده نشده است',
    mOver: 'مدیران - فراتر از برنامه عملکرد',
    mFull: 'مدیران - کار محوله را نه تنها مطلوب انجام داده بلکه به اهداف برنامه عملکرد دست یافته است',
    mOk: 'مدیران - کار محوله را مطلوب انجام داده است',
    mLow: 'مدیران - نیاز به ارتقا در انجام کار محوله',
    self3: 'عملکرد مطلوب در انجام مسئولیت‌ها مطابق برنامه عملکرد',
    self4: 'علاوه بر عملکرد مطلوب، رسیدن به تمامی اهداف برنامه عملکرد'
  };
  function sampleData() {
    const people = [
      { name: 'آرش کریمی',    manager: 'نیلوفر رستمی', stakeholders: ['بابک شریفی', 'مینا دادگر', 'سعید افشار'] },
      { name: 'نیلوفر رستمی', manager: 'کامران مهدوی', stakeholders: ['آرش کریمی', 'بابک شریفی', ''] },
      { name: 'بابک شریفی',   manager: 'کامران مهدوی', stakeholders: ['نیلوفر رستمی', 'مینا دادگر', ''] },
      { name: 'مینا دادگر',   manager: 'نیلوفر رستمی', stakeholders: ['آرش کریمی', 'سعید افشار', ''] },
      { name: 'سعید افشار',   manager: 'کامران مهدوی', stakeholders: ['بابک شریفی', 'مینا دادگر', 'آرش کریمی'] },
      { name: 'کامران مهدوی', manager: '',             stakeholders: ['آرش کریمی', 'نیلوفر رستمی', ''] }
    ];
    const R = [
      ['Rostami, Niloofar', 'Karimi, Arash', A.mOver, '02/Sep/26', 'کارها را با کیفیت بالا و به موقع تحویل می‌دهد و در تیم قابل اتکا است.'],
      ['Sharifi, Babak',    'Karimi, Arash', A.over,  '02/Sep/26', 'در چند مورد تاخیر داشت و پاسخگو نبود؛ هماهنگی با ما ضعیف بود.'],
      ['Dadgar, Mina',      'Karimi, Arash', A.over,  '03/Sep/26', ''],
      ['Mahdavi, Kamran',   'Rostami, Niloofar', A.mFull, '03/Sep/26', 'مسئولیت‌پذیر و منظم است، جای تقدیر دارد.'],
      ['Mahdavi, Kamran',   'Sharifi, Babak', A.mOk,  '04/Sep/26', 'عملکرد قابل قبول، ولی نیاز به بهبود در مستندسازی دارد.'],
      ['Rostami, Niloofar', 'Sharifi, Babak', A.good, '04/Sep/26', 'همکاری خوبی دارد اما سرعتش کافی نیست.'],
      ['Dadgar, Mina',      'Sharifi, Babak', A.good, '05/Sep/26', ''],
      ['Rostami, Niloofar', 'Dadgar, Mina',   A.mLow, '05/Sep/26', 'در پیگیری کارها ضعیف بود و چند تحویل با تاخیر انجام شد.'],
      ['Karimi, Arash',     'Dadgar, Mina',   A.full, '05/Sep/26', 'دقیق و خوش‌برخورد است و همیشه کمک می‌کند.'],
      ['Afshar, Saeed',     'Dadgar, Mina',   A.full, '06/Sep/26', ''],
      ['Mahdavi, Kamran',   'Afshar, Saeed',  A.mFull, '06/Sep/26', 'تسلط خوب روی کار، خروجی‌ها مؤثر و سازنده بوده.'],
      ['Sharifi, Babak',    'Afshar, Saeed',  A.full, '06/Sep/26', ''],
      ['Dadgar, Mina',      'Afshar, Saeed',  A.full, '07/Sep/26', 'منظم و متعهد است.'],
      ['Karimi, Arash',     'Afshar, Saeed',  A.good, '10/Jan/26', ''],
      ['Karimi, Arash',     '',               A.self3, '02/Sep/26', ''],
      ['Dadgar, Mina',      '',               A.self4, '05/Sep/26', '']
    ];
    const records = R.map((r, i) => {
      const raw = r[2];
      return {
        key: 'DEMO-' + (100 + i), created: r[3] + ' 10:00 AM', date: C.parseJiraDate(r[3]),
        reporterLat: r[0], targetLat: r[1], answer: C.cleanAnswer(raw),
        declaredRole: null, score: C.scoreOf(raw), comment: r[4] || '', rawField: 'stake'
      };
    });
    return { people, records, meta: { xlsx: 'دادهٔ نمونه', html: 'دادهٔ نمونه', demo: true, commentLabels: ['توضیحات (نمونه)'] } };
  }

  /* ---------- وضعیت ---------- */
  const DECISIONS = [
    { v: '', label: '— تعیین نشده —' },
    { v: 'mgr', label: 'تایید شده (توسط مدیر)' },
    { v: 'calib', label: 'تایید شده (در جلسه کالیبراسیون)' },
    { v: 'changed', label: 'تغییر کرده (طبق جلسه کالیبراسیون)' }
  ];
  const DEC_LABEL = DECISIONS.reduce((a, d) => (a[d.v] = d.label, a), {});

  let S = { people: [], records: [], meta: {}, years: null, tagFilter: null, q: '', tab: 'analysis', res: null, overrides: {}, decisions: {}, basedOn: null };

  /** نمرهٔ نهایی تأییدشده: محاسبه‌شده برای حالت‌های تایید، و عدد دستی برای حالت تغییر */
  function decisionOf(p) { return S.decisions[p.canon] || { status: '', score: null }; }
  function approvedScore(p) {
    const d = decisionOf(p);
    if (d.status === 'changed') return (d.score === null || d.score === undefined || d.score === '') ? null : Number(d.score);
    if (d.status === 'mgr' || d.status === 'calib') return p.final;
    return null;
  }
  function decidedCount() { return S.res ? S.res.people.filter(p => approvedScore(p) !== null).length : 0; }

  function save() {
    if (S.meta.demo) return;
    try {
      localStorage.setItem(STORE, JSON.stringify({
        people: S.people, records: S.records, meta: S.meta, years: S.years,
        overrides: S.overrides, decisions: S.decisions, basedOn: S.basedOn
      }));
    } catch (e) { /* حافظهٔ مرورگر در دسترس نیست — مشکلی نیست */ }
  }
  function load() {
    try {
      const raw = localStorage.getItem(STORE);
      if (!raw) return false;
      const d = JSON.parse(raw);
      if (!d || !d.people || !d.records) return false;
      S.people = d.people; S.records = d.records; S.meta = d.meta || {};
      S.years = d.years || null; S.overrides = d.overrides || {}; S.decisions = d.decisions || {};
      S.basedOn = d.basedOn || null;
      return true;
    } catch (e) { return false; }
  }

  /* ---------- خواندن فایل‌ها ---------- */
  function readXlsx(file) {
    if (typeof XLSX === 'undefined') return note('کتابخانهٔ خواندن اکسل هنوز بارگذاری نشده؛ چند لحظه صبر کنید و دوباره فایل را بکشید.', true);
    const fr = new FileReader();
    fr.onload = e => {
      try {
        const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
        const r = C.parseStakeholders(rows);
        if (!r.people.length) return note('در این فایل هیچ سطر همکاری پیدا نشد. مطمئن شوید ستون اول نام همکار است.', true);
        if (S.meta.demo) { S.records = []; S.meta = {}; }
        S.people = r.people; S.meta = Object.assign({}, S.meta, { xlsx: file.name, demo: false });
        S.overrides = {};
        refresh(true);
      } catch (err) { note('خواندن فایل اکسل ممکن نشد: ' + err.message, true); }
    };
    fr.readAsArrayBuffer(file);
  }
  function readHtml(file) {
    const fr = new FileReader();
    fr.onload = e => {
      try {
        const r = C.parseJiraHtml(String(e.target.result));
        if (!r.records.length) return note('در این فایل جدول آیتم‌های Jira پیدا نشد. خروجی را با فرمت HTML از Jira بگیرید.', true);
        if (S.meta.demo) { S.people = []; S.meta = {}; }
        S.records = r.records;
        S.meta = Object.assign({}, S.meta, { html: file.name, demo: false, commentLabels: r.commentLabels || [] });
        S.years = null;
        refresh(true);
      } catch (err) { note('خواندن فایل HTML ممکن نشد: ' + err.message, true); }
    };
    fr.readAsText(file, 'utf-8');
  }
  function hookDrop(zoneId, inputId, handler) {
    const zone = $('#' + zoneId), input = $('#' + inputId);
    input.addEventListener('change', () => { if (input.files[0]) handler(input.files[0]); input.value = ''; });
    ['dragenter', 'dragover'].forEach(ev => zone.addEventListener(ev, e => { e.preventDefault(); zone.classList.add('over'); }));
    ['dragleave', 'drop'].forEach(ev => zone.addEventListener(ev, e => { e.preventDefault(); zone.classList.remove('over'); }));
    zone.addEventListener('drop', e => { const f = e.dataTransfer.files[0]; if (f) handler(f); });
  }

  /* ---------- دادهٔ مشترک سایت (data.json) ---------- */
  const DATA_URL = 'data.json';
  let sharedState = null;   // 'loaded' | 'updated' | 'local-newer' | null

  async function fetchShared() {
    try {
      const r = await fetch(DATA_URL, { cache: 'no-store' });
      if (!r.ok) return null;
      const d = await r.json();
      if (!d || !Array.isArray(d.people) || !Array.isArray(d.records) || !d.people.length) return null;
      return d;
    } catch (e) { return null; }   // فایل نیست یا از روی file:// باز شده — حالت بارگذاری دستی
  }

  function buildPayload() {
    return {
      version: 1,
      savedAt: new Date().toISOString(),
      meta: { xlsx: S.meta.xlsx || '', html: S.meta.html || '', commentLabels: S.meta.commentLabels || [] },
      years: S.years, overrides: S.overrides, decisions: S.decisions,
      people: S.people, records: S.records
    };
  }
  function downloadDataJson() {
    if (!S.people.length || !S.records.length) return note('ابتدا هر دو فایل را بارگذاری کنید.', true);
    if (S.meta.demo) return note('این دادهٔ نمونه است؛ اول فایل‌های واقعی را بارگذاری کنید.', true);
    const payload = buildPayload();
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = el('a', { href: url, download: 'data.json' });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    S.basedOn = payload.savedAt;
    S.meta = Object.assign({}, S.meta, { shared: true, savedAt: payload.savedAt });
    save(); renderBanner();
    note('فایل data.json ساخته شد. آن را کنار index.html در سایت بگذارید تا همه همین داده را ببینند.');
  }
  function jalaliOf(iso) {
    try {
      const d = new Date(iso);
      const j = C.toJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
      const two = n => String(n).padStart(2, '0');
      return fa(`${j[0]}/${two(j[1])}/${two(j[2])} ساعت ${two(d.getHours())}:${two(d.getMinutes())}`);
    } catch (e) { return ''; }
  }

  /* ---------- پیام‌ها ---------- */
  let noticeTimer = null;
  function note(msg, isErr) {
    const box = $('#notices');
    const n = el('div', { class: 'notice' + (isErr ? ' err' : ''), text: msg });
    box.appendChild(n);
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => n.remove(), 9000);
  }
  function renderStatus() {
    const dx = $('#dropXlsx'), dh = $('#dropHtml');
    dx.classList.toggle('filled', !!S.people.length);
    dh.classList.toggle('filled', !!S.records.length);
    $('#lblXlsx').textContent = S.people.length
      ? `${S.meta.xlsx || 'فایل'} — ${fa(S.people.length)} همکار`
      : 'ستون‌ها: نام همکار، مدیر مستقیم، ذی‌نفع ۱ تا ۳';
    $('#lblHtml').textContent = S.records.length
      ? `${S.meta.html || 'فایل'} — ${fa(S.records.length)} پاسخ`
      : 'خروجی فیلتر «تجربه همکاری» با فرمت HTML';
  }

  /* ---------- محاسبه و رسم ---------- */
  function refresh(resetNotices) {
    if (resetNotices) $('#notices').innerHTML = '';
    renderStatus();
    if (!S.people.length || !S.records.length) {
      $('#kpis').innerHTML = ''; $('#tabs').innerHTML = ''; $('#panel').innerHTML = '';
      $('#dist').innerHTML = ''; $('#tagbars').innerHTML = ''; $('#distAvg').innerHTML = '';
      $('#filters').style.display = 'none';
      $('#panel').appendChild(el('div', { class: 'panel empty', text: 'برای شروع، هر دو فایل بالا را بارگذاری کنید.' }));
      return;
    }
    $('#filters').style.display = '';
    const yrs = Object.keys(S.records.reduce((a, r) => { if (r.date) a[r.date.jy] = 1; return a; }, {})).map(Number).sort();
    if (!S.years) S.years = yrs.length ? [Math.max.apply(null, yrs)] : null;
    S.res = C.compute(S.people, S.records, { years: S.years, overrides: S.overrides });
    save();
    renderBanner();
    renderYears(yrs);
    renderTagChips();
    renderKpis();
    renderCharts();
    renderTabs();
    renderPanel();
  }

  function renderBanner() {
    const box = $('#notices');
    box.querySelectorAll('[data-perm]').forEach(n => n.remove());
    if (S.meta.demo) {
      box.appendChild(el('div', { class: 'notice', 'data-perm': '1' }, [
        el('span', { text: 'این یک دادهٔ نمونه با نام‌های ساختگی است تا ساختار داشبورد را ببینید. دو فایل خودتان را بارگذاری کنید تا جایگزین شود.' })
      ]));
    } else if (S.meta.shared) {
      box.appendChild(el('div', { class: 'notice info', 'data-perm': '1' }, [
        el('span', { text: `دادهٔ مشترک سایت — آخرین ذخیره: ${jalaliOf(S.meta.savedAt)}${sharedState === 'updated' ? ' (نسخهٔ تازه‌تری از سایت گرفته شد)' : ''}` })
      ]));
    } else if (S.people.length && S.records.length) {
      box.appendChild(el('div', { class: 'notice', 'data-perm': '1' }, [
        el('span', { text: 'این داده فقط در مرورگر شماست. برای اینکه بقیه بدون بارگذاری همین را ببینند، «ذخیره برای همه» را بزنید و فایل data.json را کنار سایت بگذارید.' }),
        el('button', { class: 'btn', type: 'button', text: 'ذخیره برای همه', onclick: downloadDataJson })
      ]));
    }
    const um = S.res.unmatched;
    if (um.length) {
      box.appendChild(el('div', { class: 'notice err', 'data-perm': '1' }, [
        el('span', { text: `${fa(um.length)} نام در گزارش Jira به هیچ نامی در فایل اکسل تطبیق داده نشد؛ نظرهای آن‌ها در تحلیل نیامده است.` }),
        el('button', { class: 'btn', type: 'button', text: 'تطبیق دستی', onclick: () => { S.tab = 'names'; renderTabs(); renderPanel(); } })
      ]));
    }
    const unk = Object.keys(S.res.unknownAnswers);
    if (unk.length) {
      box.appendChild(el('div', { class: 'notice', 'data-perm': '1' }, [
        el('span', { text: `${fa(unk.length)} نوع پاسخ ناشناخته در گزارش هست که به نمره تبدیل نشد (در تب راهنما فهرست شده).` })
      ]));
    }
  }

  function renderYears(yrs) {
    const box = $('#yearChips'); box.innerHTML = '';
    yrs.forEach(y => {
      const on = S.years.indexOf(y) !== -1;
      const n = S.records.filter(r => r.date && r.date.jy === y).length;
      box.appendChild(el('button', {
        class: 'chip', type: 'button', 'aria-pressed': on ? 'true' : 'false',
        text: `${fa(y)} (${fa(n)})`,
        onclick: () => {
          const i = S.years.indexOf(y);
          if (i === -1) S.years.push(y); else if (S.years.length > 1) S.years.splice(i, 1);
          refresh();
        }
      }));
    });
  }
  function renderTagChips() {
    const box = $('#tagChips'); box.innerHTML = '';
    [C.TAGS.HIGH, C.TAGS.LOW, C.TAGS.DIFF, C.TAGS.CONFLICT].forEach(t => {
      box.appendChild(el('button', {
        class: 'chip', type: 'button', 'aria-pressed': S.tagFilter === t ? 'true' : 'false',
        text: `${t} (${fa(S.res.stats.tagCount[t] || 0)})`,
        onclick: () => { S.tagFilter = S.tagFilter === t ? null : t; S.tab = 'analysis'; renderTagChips(); renderTabs(); renderPanel(); }
      }));
    });
  }

  function kpi(k, v, s, alert) {
    return el('div', { class: 'kpi' + (alert ? ' alert' : '') }, [
      el('div', { class: 'k', text: k }), el('div', { class: 'v', text: v }), el('div', { class: 's', text: s })
    ]);
  }
  function renderKpis() {
    const st = S.res.stats, box = $('#kpis'); box.innerHTML = '';
    const flagged = (st.tagCount[C.TAGS.HIGH] || 0) + (st.tagCount[C.TAGS.LOW] || 0) + (st.tagCount[C.TAGS.DIFF] || 0);
    box.appendChild(kpi('همکاران', fa(st.people), `${fa(st.comments)} نظر ثبت‌شده`));
    const prog = kpi('تکمیل ارزیابی‌ها', pct(st.pct), `${fa(st.totalDone)} از ${fa(st.totalAssigned)}`);
    const track = el('div', { class: 'bar-track' }, [el('div', { class: 'bar-fill' })]);
    track.firstChild.style.width = (st.pct * 100).toFixed(1) + '%';
    prog.appendChild(track);
    box.appendChild(prog);
    if (st.withText) {
      const cov = st.comments ? st.withText / st.comments : 0;
      const k = kpi('پوشش توضیحات', pct(cov), `${fa(st.withText)} نظر از ${fa(st.comments)} متن دارد`);
      const tr = el('div', { class: 'bar-track' }, [el('div', { class: 'bar-fill' })]);
      tr.firstChild.style.width = (cov * 100).toFixed(1) + '%';
      k.appendChild(tr);
      box.appendChild(k);
    } else {
      box.appendChild(kpi('میانگین نمرهٔ سازمان', num(st.pop, 2), 'روی مقیاس ۱ تا ۵'));
    }
    box.appendChild(kpi('نظرهای ثبت‌نشده', fa(st.totalAssigned - st.totalDone), `${fa(S.res.pending.length)} مورد در انتظار`, st.totalAssigned - st.totalDone > 0));
    box.appendChild(kpi('موارد مشکوک', fa(flagged), 'نیازمند بررسی انسانی', flagged > 0));
  }

  function renderCharts() {
    const st = S.res.stats;
    const box = $('#dist'); box.innerHTML = '';
    const max = Math.max.apply(null, [1].concat(Object.values(st.dist)));
    [5, 4, 3, 2, 1].forEach(s => {
      const n = st.dist[s] || 0;
      const bar = el('div', { class: 'bar b' + s, title: `${C.SCORE_LABEL[s]} — ${fa(n)} نظر` });
      bar.style.height = Math.max(2, (n / max) * 88) + '%';
      box.appendChild(el('div', { class: 'col' }, [
        el('div', { class: 'n', text: fa(n) }), bar, el('div', { class: 'lbl', text: fa(s) })
      ]));
    });
    const modal = Object.keys(st.dist).reduce((a, k) => st.dist[k] > st.dist[a] ? k : a, '4');
    $('#distHint').textContent = `${fa(st.comments)} نظر روی مقیاس ۱ تا ۵.`;
    $('#distAvg').innerHTML = '';
    $('#distAvg').appendChild(el('span', { text: `میانگین سازمان: ${num(st.pop, 2)}` }));
    $('#distAvg').appendChild(el('span', {
      text: `پرتکرارترین نمره: ${fa(modal)} (${pct((st.dist[modal] || 0) / Math.max(1, st.comments))} از کل)`
    }));

    const tb = $('#tagbars'); tb.innerHTML = '';
    const total = Math.max(1, st.people);
    C.TAG_ORDER.forEach(t => {
      const n = st.tagCount[t] || 0;
      const row = el('div', { class: 'tagbar' }, [
        el('span', { class: 't', text: t }),
        el('span', { class: 'track' }, [el('span', { class: 'fill' })]),
        el('span', { class: 'c', text: fa(n) })
      ]);
      const f = row.children[1].firstChild;
      f.style.width = (n / total * 100).toFixed(1) + '%';
      f.style.background = TAGVAR[t];
      tb.appendChild(row);
    });
  }

  /* ---------- تب‌ها ---------- */
  const TABS = [
    { id: 'analysis', label: 'تحلیل و تگ‌ها' },
    { id: 'dist', label: 'توزیع نمرهٔ نهایی' },
    { id: 'comments', label: 'نظرها' },
    { id: 'texts', label: 'توضیحات' },
    { id: 'pending', label: 'نظر نداده‌ها' },
    { id: 'reviewers', label: 'ارزیاب‌ها' },
    { id: 'names', label: 'تطبیق نام‌ها' },
    { id: 'guide', label: 'راهنما' }
  ];
  function tabCount(id) {
    if (!S.res) return '';
    if (id === 'analysis') return S.res.people.length;
    if (id === 'dist') return S.res.people.filter(p => p.final !== null).length;
    if (id === 'comments') return S.res.people.length;
    if (id === 'texts') return S.res.stats.withText;
    if (id === 'pending') return S.res.pending.length;
    if (id === 'reviewers') return S.res.reviewers.length;
    if (id === 'names') return S.res.unmatched.length || '';
    return '';
  }
  function renderTabs() {
    const box = $('#tabs'); box.innerHTML = '';
    TABS.forEach(t => {
      const c = tabCount(t.id);
      box.appendChild(el('button', {
        class: 'tab', role: 'tab', type: 'button', 'aria-selected': S.tab === t.id ? 'true' : 'false',
        onclick: () => { S.tab = t.id; renderTabs(); renderPanel(); }
      }, [
        el('span', { text: t.label }),
        c !== '' ? el('span', { class: 'cnt', text: ' ' + fa(c) }) : null
      ]));
    });
  }

  const matchQ = name => !S.q || C.normText(name).indexOf(C.normText(S.q)) !== -1;
  function filteredPeople() {
    return S.res.people.filter(p => (!S.tagFilter || p.tags.indexOf(S.tagFilter) !== -1) && matchQ(p.name));
  }
  function tagEl(t) { return el('span', { class: 'tag ' + TAGCLASS[t], text: t }); }
  function leanEl(sent, conflict) {
    if (!sent) return null;
    return el('span', {
      class: 'lean ' + LEANCLASS[sent.lean] + (conflict ? ' conf' : ''),
      title: sent.hits.length ? 'واژه‌های شناسایی‌شده: ' + sent.hits.map(h => h.w).join('، ') : 'واژهٔ شاخصی پیدا نشد',
      text: C.LEAN_LABEL[sent.lean] + (conflict ? ' ⚠' : '')
    });
  }
  function commentEl(c) {
    if (!c.comment) return null;
    return el('span', { class: 'cmt' }, [leanEl(c.sent, c.conflict), el('span', { text: ' ' + c.comment })]);
  }
  function dotEl(cell) {
    if (cell.state === 'none') return el('span', { class: 'dot none', text: '·', title: 'ارزیاب تعیین نشده' });
    if (cell.state === 'missing') return el('span', { class: 'dot miss', text: '', title: cell.name + ' — نظر ثبت نشده' });
    const s = cell.score === null ? 3 : Math.round(cell.score);
    return el('span', { class: 'dot s' + s, text: fa(cell.score === null ? '?' : cell.score), title: `${cell.name} — ${cell.text}` });
  }
  function table(headers, rows) {
    const thead = el('thead', null, [el('tr', null, headers.map(h =>
      el('th', { class: h.num ? 'num' : '', text: h.t, style: h.w ? 'width:' + h.w : null })))]);
    return el('div', { class: 'tablewrap' }, [el('table', null, [thead, el('tbody', null, rows)])]);
  }

  function renderPanel() {
    const p = $('#panel'); p.innerHTML = '';
    if (!S.res) return;
    if (S.tab === 'analysis') p.appendChild(viewAnalysis());
    else if (S.tab === 'dist') p.appendChild(viewDist());
    else if (S.tab === 'comments') p.appendChild(viewComments());
    else if (S.tab === 'texts') p.appendChild(viewTexts());
    else if (S.tab === 'pending') p.appendChild(viewPending());
    else if (S.tab === 'reviewers') p.appendChild(viewReviewers());
    else if (S.tab === 'names') p.appendChild(viewNames());
    else p.appendChild(viewGuide());
  }

  function decisionCells(pp) {
    const stop = e => e.stopPropagation();
    const d = decisionOf(pp);
    const out = el('td', { class: 'num final', onclick: stop });
    const sel = el('select', { class: 'sel-dec', 'aria-label': 'وضعیت نمرهٔ نهایی ' + pp.name, onclick: stop });
    DECISIONS.forEach(o => sel.appendChild(el('option', { value: o.v, text: o.label, selected: o.v === d.status ? 'selected' : null })));
    const inp = el('input', {
      class: 'inp-score', type: 'number', min: '0', max: '5', step: '0.1', onclick: stop,
      'aria-label': 'نمرهٔ نهایی تأییدشده ' + pp.name,
      value: d.score === null || d.score === undefined ? '' : d.score
    });
    function paint() {
      const dd = decisionOf(pp), ap = approvedScore(pp);
      inp.style.display = dd.status === 'changed' ? '' : 'none';
      out.textContent = '';
      out.appendChild(el('span', {
        class: 'finalv' + (ap === null ? ' off' : (dd.status === 'changed' ? ' changed' : ' okv')),
        text: ap === null ? '—' : fa(Number(ap).toFixed(2))
      }));
      const sum = document.getElementById('decSummary');
      if (sum) sum.textContent = `نمرهٔ نهایی برای ${fa(decidedCount())} نفر از ${fa(S.res.people.length)} تعیین‌تکلیف شده.`;
    }
    sel.addEventListener('change', () => {
      const cur = decisionOf(pp);
      if (!sel.value) delete S.decisions[pp.canon];
      else S.decisions[pp.canon] = { status: sel.value, score: sel.value === 'changed' ? cur.score ?? null : null };
      save(); paint();
      if (sel.value === 'changed') inp.focus();
    });
    inp.addEventListener('input', () => {
      const cur = decisionOf(pp);
      if (cur.status !== 'changed') return;
      S.decisions[pp.canon] = { status: 'changed', score: inp.value === '' ? null : Number(inp.value) };
      save(); paint();
    });
    paint();
    return [el('td', { class: 'dec', onclick: stop }, [sel, inp]), out];
  }

  function viewAnalysis() {
    const list = filteredPeople();
    if (!list.length) return el('div', { class: 'panel empty', text: 'موردی با این فیلتر پیدا نشد.' });
    const rows = list.map(pp => el('tr', { class: 'clickable', onclick: () => openDrawer(pp) }, [
      el('td', { class: 'nm', text: pp.name }),
      el('td', { class: 'num' }, [el('span', { class: 'dots' }, pp.cells.map(dotEl))]),
      el('td', { class: 'num', text: num(pp.mgrScore) }),
      el('td', { class: 'num', text: num(pp.stkMean, pp.stkMean === null ? undefined : 2) }),
      el('td', { class: 'num calc', text: num(pp.final, pp.final === null ? undefined : 2) }),
      el('td', { class: 'num', text: num(pp.range) }),
      el('td', null, pp.tags.map(tagEl))
    ].concat(decisionCells(pp), [
      el('td', null, [el('span', { class: 'qt', text: pp.why })])
    ])));
    const wrap = el('div');
    wrap.appendChild(el('p', {
      id: 'decSummary', class: 'sub',
      text: `نمرهٔ نهایی برای ${fa(decidedCount())} نفر از ${fa(S.res.people.length)} تعیین‌تکلیف شده.`
    }));
    wrap.appendChild(table([
      { t: 'نام همکار' }, { t: 'نمره‌ها', num: 1 }, { t: 'مدیر', num: 1 }, { t: 'م. ذی‌نفعان', num: 1 },
      { t: 'نمرهٔ نهایی (وزنی)', num: 1 }, { t: 'دامنه', num: 1 }, { t: 'تگ' },
      { t: 'وضعیت نمرهٔ نهایی' }, { t: 'نمرهٔ تأییدشده', num: 1 }, { t: 'توضیح' }
    ], rows));
    return wrap;
  }

  /* ---------- تب توزیع نمرهٔ نهایی ---------- */
  let distMode = 'calc';

  function statTile(k, v, s) {
    return el('div', { class: 'stat' }, [
      el('div', { class: 'k', text: k }), el('div', { class: 'v', text: v }), el('div', { class: 's', text: s })
    ]);
  }
  const toPct = v => ((v - 1) / 4) * 100;          /* نمره ۱..۵ → درصد عرض نمودار */
  const faNum = (v, d) => fa(Number(v).toFixed(d === undefined ? 2 : d)).replace(/\./g, '٫');

  function histChart(d) {
    const st = d.stats, maxN = Math.max.apply(null, [1].concat(d.bins.map(b => b.n)));
    const plot = el('div', { class: 'hist-plot' });

    /* نوار نیمهٔ میانی (چارک ۱ تا ۳) */
    if (st && st.q3 > st.q1) {
      const band = el('div', { class: 'hist-iqr', title: `نیمهٔ میانی افراد: ${faNum(st.q1)} تا ${faNum(st.q3)}` });
      band.style.left = toPct(st.q1) + '%';
      band.style.width = (toPct(st.q3) - toPct(st.q1)) + '%';
      plot.appendChild(band);
    }

    /* ستون‌ها */
    d.bins.forEach((b, i) => {
      const h = (b.n / maxN) * 82;
      const names = b.names.slice(0, 12).join('، ') + (b.names.length > 12 ? ' و ...' : '');
      const bar = el('div', {
        class: 'hbar' + (b.n === 0 ? ' zero' : '') + (b.hi <= 3 ? ' low' : ''),
        title: `نمرهٔ ${faNum(b.lo, 1)} تا ${faNum(b.hi, 1)} — ${fa(b.n)} نفر` + (b.n ? '\n' + names : '')
      });
      bar.style.left = 'calc(' + (i * 12.5) + '% + 2px)';
      bar.style.width = 'calc(12.5% - 4px)';
      bar.style.height = Math.max(h, b.n ? 2 : 0.6) + '%';
      plot.appendChild(bar);
      if (b.n) {
        const lbl = el('div', { class: 'hn', text: fa(b.n) });
        lbl.style.left = (i * 12.5) + '%';
        lbl.style.width = '12.5%';
        lbl.style.bottom = 'calc(' + h + '% + 5px)';
        plot.appendChild(lbl);
      }
    });

    /* نشانگر میانگین و میانه */
    if (st) {
      [['mean', st.mean, 'میانگین'], ['med', st.median, 'میانه']].forEach(([cls, v, lab], k) => {
        const x = toPct(v);
        const m = el('div', { class: 'hmark' + (cls === 'med' ? ' med' : '') });
        m.style.left = x + '%';
        plot.appendChild(m);
        const chip = el('div', { class: 'hmark-lbl' + (cls === 'med' ? ' med' : ''), text: `${lab} ${faNum(v)}` });
        chip.style.left = x + '%';
        chip.style.top = (k * 22) + 'px';
        chip.style.transform = 'translateX(' + (x < 12 ? '-10%' : x > 88 ? '-90%' : '-50%') + ')';
        plot.appendChild(chip);
      });
    }

    const axis = el('div', { class: 'hist-axis' });
    [1, 2, 3, 4, 5].forEach(v => {
      const s = el('span', { text: fa(v) });
      s.style.left = toPct(v) + '%';
      axis.appendChild(s);
    });
    axis.appendChild(el('span', { class: 'cap', text: 'نمرهٔ نهایی روی مقیاس ۱ تا ۵' }));

    const legend = el('div', { class: 'hlegend' }, [
      el('span', null, [mk('i', 'background:var(--bar)'), el('em', { text: 'نمرهٔ ۳ و بالاتر' })]),
      el('span', null, [mk('i', 'background:var(--bar-low)'), el('em', { text: 'نمرهٔ زیر ۳ — نیازمند بررسی' })]),
      el('span', null, [mk('i', 'background:var(--iqr)'), el('em', { text: 'نیمهٔ میانی افراد (چارک ۱ تا ۳)' })]),
      el('span', null, [mk('i', 'background:var(--ink)', 'line'), el('em', { text: 'میانگین' })]),
      el('span', null, [mk('i', 'background:var(--ink-3)', 'line'), el('em', { text: 'میانه' })])
    ]);
    return el('div', { class: 'hist' }, [plot, axis, legend]);
  }
  function mk(tag, style, cls) {
    const n = el(tag, cls ? { class: cls } : null);
    n.setAttribute('style', style);
    return n;
  }

  function viewDist() {
    const approvedList = S.res.people.map(p => Object.assign({}, p, { final: approvedScore(p) }));
    const anyApproved = approvedList.some(p => p.final !== null);
    if (distMode === 'approved' && !anyApproved) distMode = 'calc';

    const d = distMode === 'approved'
      ? C.distribution(approvedList, { mode: 'approved' })
      : C.distribution(S.res.people, { approvedOf: approvedScore });

    const wrap = el('div');

    /* --- نمودار --- */
    const head = el('div', { style: 'display:flex; justify-content:space-between; align-items:flex-start; gap:12px; flex-wrap:wrap' }, [
      el('div', null, [
        el('h3', { text: 'توزیع نمرهٔ نهایی' }),
        el('p', {
          class: 'hint',
          text: distMode === 'approved'
            ? 'بر پایهٔ نمرهٔ تأییدشده در جلسهٔ کالیبراسیون. هر ستون تعداد افرادی است که نمره‌شان در آن بازهٔ نیم‌نمره‌ای افتاده.'
            : 'بر پایهٔ نمرهٔ وزنی محاسبه‌شده (۶۰٪ مدیر + ۴۰٪ میانگین ذی‌نفعان). هر ستون تعداد افرادی است که نمره‌شان در آن بازهٔ نیم‌نمره‌ای افتاده.'
        })
      ]),
      anyApproved ? el('div', { class: 'seg' }, [
        el('button', { type: 'button', 'aria-pressed': distMode === 'calc' ? 'true' : 'false', text: 'نمرهٔ محاسبه‌شده',
          onclick: () => { distMode = 'calc'; renderPanel(); } }),
        el('button', { type: 'button', 'aria-pressed': distMode === 'approved' ? 'true' : 'false', text: 'نمرهٔ تأییدشده',
          onclick: () => { distMode = 'approved'; renderPanel(); } })
      ]) : null
    ]);

    if (!d.stats) {
      wrap.appendChild(el('div', { class: 'panel' }, [head,
        el('div', { class: 'empty', text: 'هنوز هیچ نمرهٔ نهایی‌ای برای رسم وجود ندارد.' })]));
      return wrap;
    }
    wrap.appendChild(el('div', { class: 'panel' }, [head, histChart(d)]));

    /* --- کارت‌های آماری --- */
    const st = d.stats;
    wrap.appendChild(el('div', { class: 'statgrid' }, [
      statTile('تعداد نمره‌شده', fa(st.n), `از ${fa(S.res.people.length)} همکار`),
      statTile('میانگین', faNum(st.mean), `میانهٔ ${faNum(st.median)}`),
      statTile('انحراف معیار', faNum(st.sd), C.SHAPE[d.shape.spread]),
      statTile('دامنه', `${faNum(st.min)}–${faNum(st.max)}`, `کمینه تا بیشینه`),
      statTile('نیمهٔ میانی', `${faNum(st.q1)}–${faNum(st.q3)}`, `دامنهٔ میان‌چارکی ${faNum(st.iqr)}`),
      statTile('شکل توزیع', C.SHAPE[d.shape.skewDir], `${pct(d.shape.topShare)} بالای ۴`)
    ]));

    /* --- باندهای عملکردی --- */
    const bandBox = el('div', { class: 'panel' }, [
      el('h3', { text: 'باندهای عملکردی' }),
      el('p', { class: 'hint', text: 'هر نفر بر اساس نمرهٔ نهایی در یکی از این پنج باند قرار می‌گیرد. برای دیدن نام‌ها، نشانگر را روی نوار نگه دارید.' })
    ]);
    d.bands.forEach(b => {
      const row = el('div', { class: 'bandrow' + (b.lo < 3 ? ' lowband' : ''), title: b.names.length ? b.names.join('، ') : 'کسی در این باند نیست' }, [
        el('div', { class: 't' }, [el('span', { text: b.label }), el('small', { text: b.hint })]),
        el('div', { class: 'r', text: b.range }),
        el('span', { class: 'track' }, [el('span', { class: 'fill' })]),
        el('div', { class: 'c', text: `${fa(b.n)} نفر · ${pct(b.share)}` })
      ]);
      row.querySelector('.fill').style.width = (b.share * 100).toFixed(1) + '%';
      bandBox.appendChild(row);
    });
    wrap.appendChild(bandBox);

    /* --- بالاترین و پایین‌ترین --- */
    const mkList = (title, hint, arr) => {
      const box = el('div', { class: 'panel' }, [el('h3', { text: title }), el('p', { class: 'hint', text: hint })]);
      const ul = el('ul', { class: 'xlist', style: 'list-style:none; margin:0; padding:0' });
      arr.forEach(i => ul.appendChild(el('li', null, [
        el('span', { text: i.name }), el('b', { text: faNum(i.v) })
      ])));
      box.appendChild(ul);
      return box;
    };
    wrap.appendChild(el('div', { class: 'extremes' }, [
      mkList('بالاترین نمره‌ها', 'سه نمرهٔ بالای فهرست', d.top),
      mkList('پایین‌ترین نمره‌ها', 'سه نمرهٔ پایین فهرست', d.bottom)
    ]));

    /* --- مبنای نمره --- */
    if (d.basis.mgr.length || d.basis.stk.length) {
      const bs = el('div', { class: 'panel' }, [
        el('h3', { text: 'مبنای محاسبهٔ نمره' }),
        el('p', { class: 'hint', text: 'نمرهٔ افرادی که فقط یک طرف ارزیابی‌شان ثبت شده، با وزن ۱ همان طرف ساخته شده و با بقیه هم‌مقیاس نیست.' })
      ]);
      [['هر دو طرف (۰٫۶ مدیر + ۰٫۴ ذی‌نفعان)', d.basis.full],
       ['فقط نمرهٔ مدیر', d.basis.mgr],
       ['فقط نمرهٔ ذی‌نفعان', d.basis.stk]].forEach(([lab, list]) => {
        const row = el('div', { class: 'bandrow' + (lab.startsWith('فقط') ? ' lowband' : ''), title: list.length ? list.join('، ') : '—' }, [
          el('div', { class: 't' }, [el('span', { text: lab })]),
          el('div', { class: 'r', text: '' }),
          el('span', { class: 'track' }, [el('span', { class: 'fill' })]),
          el('div', { class: 'c', text: `${fa(list.length)} نفر · ${pct(st.n ? list.length / st.n : 0)}` })
        ]);
        row.querySelector('.fill').style.width = ((st.n ? list.length / st.n : 0) * 100).toFixed(1) + '%';
        bs.appendChild(row);
      });
      wrap.appendChild(bs);
    }

    /* --- جابه‌جایی‌های کالیبراسیون --- */
    if (distMode === 'calc' && d.calib.pairs.length) {
      const rows = d.calib.pairs.map(p => el('tr', null, [
        el('td', { class: 'nm', text: p.name }),
        el('td', { class: 'num', text: faNum(p.from) }),
        el('td', { class: 'num', text: faNum(p.to) }),
        el('td', { class: 'num' }, [el('span', {
          class: 'finalv ' + (p.delta > 0 ? 'okv' : 'changed'),
          text: (p.delta > 0 ? '+' : '−') + faNum(Math.abs(p.delta))
        })])
      ]));
      const box = el('div', { class: 'panel' }, [
        el('h3', { text: 'تغییرات جلسهٔ کالیبراسیون' }),
        el('p', { class: 'hint', text: `${fa(d.calib.changed)} نفر از ${fa(d.calib.decided)} نفرِ تعیین‌تکلیف‌شده، نمرهٔ متفاوتی از خروجی فرمول گرفته‌اند.` })
      ]);
      box.appendChild(table([{ t: 'نام همکار' }, { t: 'محاسبه‌شده', num: 1 }, { t: 'تأییدشده', num: 1 }, { t: 'تغییر', num: 1 }], rows));
      wrap.appendChild(box);
    }

    /* --- تحلیل خودکار --- */
    const KIND = { bad: 'نیازمند اقدام', warn: 'هشدار', ok: 'سالم', info: 'توضیح' };
    wrap.appendChild(el('h3', { class: 'sec-h', text: 'تحلیل خودکار توزیع', style: 'margin:22px 0 0; font-size:13px; color:var(--ink-2)' }));
    wrap.appendChild(el('div', { class: 'insights' }, d.insights.map(i => el('div', { class: 'ins k-' + i.kind }, [
      el('h4', null, [el('span', { text: i.title }), el('span', { class: 'badge', text: KIND[i.kind] })]),
      el('p', { text: i.text })
    ]))));

    return wrap;
  }

  function viewComments() {
    const list = S.res.peopleByRow.filter(p => matchQ(p.name) && (!S.tagFilter || p.tags.indexOf(S.tagFilter) !== -1));
    if (!list.length) return el('div', { class: 'panel empty', text: 'موردی با این فیلتر پیدا نشد.' });
    const rows = list.map(pp => {
      const tds = [el('td', { class: 'nm', text: pp.name })];
      pp.cells.forEach(c => {
        if (c.state === 'none') tds.push(el('td', null, [el('span', { class: 'cell-none', text: '— تعیین نشده' })]));
        else if (c.state === 'missing') tds.push(el('td', null, [
          el('span', { class: 'rev', text: c.name }), el('span', { class: 'cell-missing', text: 'نظر ثبت نشده' })
        ]));
        else tds.push(el('td', null, [
          el('span', { class: 'rev', text: c.name }),
          el('span', { class: 'qt', text: c.text }),
          commentEl(c)
        ]));
      });
      tds.push(el('td', { class: 'num', text: `${fa(pp.done)}/${fa(pp.assigned)}` }));
      return el('tr', { class: 'clickable', onclick: () => openDrawer(pp) }, tds);
    });
    return table([
      { t: 'نام همکار' }, { t: 'مدیر مستقیم' }, { t: 'ذی‌نفع ۱' }, { t: 'ذی‌نفع ۲' }, { t: 'ذی‌نفع ۳' }, { t: 'ثبت', num: 1 }
    ], rows);
  }

  let textsOnlyConflict = false;
  function viewTexts() {
    const all = [];
    S.res.peopleByRow.forEach(pp => pp.cells.forEach(c => {
      if (c.state === 'done' && c.comment) all.push({ target: pp.name, tag: pp.tag, c });
    }));
    const wrap = el('div');
    if (!all.length) {
      wrap.appendChild(el('div', { class: 'panel empty' }, [
        el('div', { text: 'در این گزارش هیچ توضیح متنی پیدا نشد.' }),
        el('div', { style: 'margin-top:8px;font-size:12px', text: 'اگر ستون توضیحات را به خروجی Jira اضافه کرده‌اید، مطمئن شوید در فایل HTML هم آمده باشد؛ ستون‌های شناسایی‌شده در تب راهنما فهرست شده‌اند.' })
      ]));
      return wrap;
    }
    const conf = all.filter(x => x.c.conflict);
    const bar = el('div', { class: 'filters', style: 'margin-top:0' }, [
      el('span', { class: 'flabel', text: `${fa(all.length)} توضیح ثبت شده — میانگین ${fa(S.res.stats.avgLen)} نویسه` }),
      el('span', { class: 'sep' }),
      el('button', {
        class: 'chip', type: 'button', 'aria-pressed': textsOnlyConflict ? 'true' : 'false',
        text: `فقط تناقض‌ها (${fa(conf.length)})`,
        onclick: () => { textsOnlyConflict = !textsOnlyConflict; renderPanel(); }
      }),
      el('span', { class: 'flabel', text: `مثبت ${fa(S.res.stats.leanCount.pos)} · دوسویه ${fa(S.res.stats.leanCount.mixed)} · منفی ${fa(S.res.stats.leanCount.neg)} · خنثی ${fa(S.res.stats.leanCount.neutral)}` })
    ]);
    wrap.appendChild(bar);
    const list = (textsOnlyConflict ? conf : all).filter(x => matchQ(x.target) || matchQ(x.c.name));
    if (!list.length) { wrap.appendChild(el('div', { class: 'panel empty', text: 'موردی با این فیلتر پیدا نشد.' })); return wrap; }
    const rows = list.map(x => el('tr', { class: 'clickable' + (x.c.conflict ? ' rowconf' : ''),
      onclick: () => openDrawer(S.res.peopleByRow.find(p => p.name === x.target)) }, [
      el('td', { class: 'nm', text: x.target }),
      el('td', { text: x.c.name }),
      el('td', { class: 'num', text: x.c.role }),
      el('td', { class: 'num' }, [el('span', { class: 'dot s' + (x.c.score === null ? 3 : Math.round(x.c.score)), text: fa(x.c.score === null ? '?' : x.c.score) })]),
      el('td', { class: 'num' }, [leanEl(x.c.sent, x.c.conflict)]),
      el('td', null, [el('span', { class: 'qt3', text: x.c.comment })])
    ]));
    wrap.appendChild(table([
      { t: 'دربارهٔ' }, { t: 'ارزیاب' }, { t: 'نقش', num: 1 }, { t: 'نمره', num: 1 }, { t: 'بار متن', num: 1 }, { t: 'متن توضیح' }
    ], rows));
    return wrap;
  }

  function viewPending() {
    const list = S.res.pending.filter(x => matchQ(x.reviewer) || matchQ(x.target));
    if (!list.length) return el('div', { class: 'panel empty', text: 'همهٔ ارزیابی‌ها ثبت شده است.' });
    const byRev = {};
    list.forEach(x => { (byRev[x.reviewer] = byRev[x.reviewer] || []).push(x); });
    const rows = Object.keys(byRev)
      .sort((a, b) => byRev[b].length - byRev[a].length || a.localeCompare(b, 'fa'))
      .map(rev => el('tr', null, [
        el('td', { class: 'nm', text: rev }),
        el('td', { class: 'num', text: fa(byRev[rev].length) }),
        el('td', null, [el('span', { class: 'qt', text: byRev[rev].map(x => `${x.target} (${x.role})`).join('، ') })])
      ]));
    return table([{ t: 'ارزیاب' }, { t: 'تعداد', num: 1 }, { t: 'برای چه کسانی نظر نداده' }], rows);
  }

  function viewReviewers() {
    const list = S.res.reviewers.filter(r => matchQ(r.name));
    if (!list.length) return el('div', { class: 'panel empty', text: 'موردی پیدا نشد.' });
    const rows = list.map(r => {
      const track = el('td', { class: 'num' }, [
        el('div', { class: 'bar-track', style: 'width:70px;margin:0 auto' }, [el('div', { class: 'bar-fill' })])
      ]);
      track.firstChild.firstChild.style.width = (r.pct * 100).toFixed(0) + '%';
      const styleCls = r.style === 'سهل‌گیر' ? 't-hi' : r.style === 'سخت‌گیر' ? 't-diff' : 't-mute';
      return el('tr', null, [
        el('td', { class: 'nm', text: r.name }),
        el('td', { class: 'num', text: fa(r.assigned) }),
        el('td', { class: 'num', text: fa(r.done) }),
        el('td', { class: 'num', text: r.done ? `${fa(r.texts)}` : '—' }),
        el('td', { class: 'num' }, [r.missing ? el('span', { class: 'tag t-lo', text: fa(r.missing) }) : el('span', { text: '—' })]),
        track,
        el('td', { class: 'num', text: num(r.avg, r.avg === null ? undefined : 2) }),
        el('td', { class: 'num', text: r.dev === null ? '—' : (r.dev > 0 ? '+' : '') + num(r.dev, 2) }),
        el('td', null, [el('span', { class: 'tag ' + styleCls, text: r.style })]),
        el('td', { class: 'num', text: r.self })
      ]);
    });
    return table([
      { t: 'ارزیاب' }, { t: 'محول‌شده', num: 1 }, { t: 'ثبت‌شده', num: 1 }, { t: 'با توضیح', num: 1 }, { t: 'مانده', num: 1 },
      { t: 'پیشرفت', num: 1 }, { t: 'میانگین نمرهٔ اعطایی', num: 1 }, { t: 'انحراف', num: 1 },
      { t: 'سبک نمره‌دهی' }, { t: 'خودارزیابی', num: 1 }
    ], rows);
  }

  function viewNames() {
    const faNames = Array.from(new Set(Object.values(S.res.canonMap))).sort((a, b) => a.localeCompare(b, 'fa'));
    const wrap = el('div', { class: 'panel' });
    wrap.appendChild(el('h3', { text: 'تطبیق نام لاتین Jira با نام فارسی اکسل' }));
    wrap.appendChild(el('p', { class: 'hint', text: 'تطبیق به‌صورت خودکار انجام می‌شود. اگر نامی اشتباه یا بی‌جواب مانده، اینجا دستی تصحیح کنید؛ انتخاب شما ذخیره می‌شود.' }));
    const lat = Object.keys(S.res.nameMap).sort((a, b) => {
      const ua = S.res.nameMap[a] ? 1 : 0, ub = S.res.nameMap[b] ? 1 : 0;
      return ua - ub || a.localeCompare(b);
    });
    const rows = lat.map(l => {
      const cur = S.overrides[l] || S.res.nameMap[l] || '';
      const sel = el('select', {
        class: 'search', style: 'max-width:220px;min-width:180px',
        onchange: e => {
          if (e.target.value) S.overrides[l] = e.target.value; else delete S.overrides[l];
          refresh();
        }
      });
      sel.appendChild(el('option', { value: '', text: '— نادیده گرفته شود —' }));
      faNames.forEach(f => sel.appendChild(el('option', { value: f, text: f, selected: f === cur ? 'selected' : null })));
      const auto = S.overrides[l] ? 'دستی' : (S.res.nameMap[l] ? 'خودکار' : 'بی‌جواب');
      return el('tr', null, [
        el('td', { class: 'nm', text: l }),
        el('td', null, [sel]),
        el('td', { class: 'num' }, [el('span', { class: 'tag ' + (auto === 'بی‌جواب' ? 't-lo' : auto === 'دستی' ? 't-diff' : 't-ok'), text: auto })])
      ]);
    });
    wrap.appendChild(table([{ t: 'نام در Jira' }, { t: 'نام در اکسل' }, { t: 'وضعیت', num: 1 }], rows));
    const clusters = {};
    Object.entries(S.res.canonMap).forEach(([k, v]) => { (clusters[v] = clusters[v] || []).push(k); });
    const multi = Object.entries(clusters).filter(([, v]) => v.length > 1);
    if (multi.length) {
      wrap.appendChild(el('h3', { text: 'املاهای یکسان‌شده', style: 'margin-top:20px' }));
      wrap.appendChild(el('p', { class: 'hint', text: 'این املاهای مختلف در فایل اکسل یک نفر در نظر گرفته شدند.' }));
      const ul = el('ul', { style: 'margin:0;padding-inline-start:18px;font-size:12.5px' });
      multi.forEach(([k, v]) => ul.appendChild(el('li', { text: `${k} ← ${v.join(' / ')}` })));
      wrap.appendChild(ul);
    }
    return wrap;
  }

  function viewGuide() {
    const st = S.res.stats, o = S.res.opts;
    const g = el('div', { class: 'guide' });
    const p1 = el('div', { class: 'panel' });
    p1.appendChild(el('h3', { text: 'تگ‌ها چطور تعیین می‌شوند' }));
    p1.appendChild(el('p', { text: `آستانه‌ها نسبت به میانگین واقعی سازمان (${num(st.pop, 2)}) تنظیم می‌شوند، نه وسط مقیاس؛ چون در عمل بیشتر نمره‌ها روی یک گزینه متمرکز است.` }));
    const ul = el('ul');
    [
      [C.TAGS.HIGH, `دست‌کم ${fa(o.minVotes)} نظر، نمرهٔ نهایی ≥ ${fa(o.hiMean)} و کمینهٔ نمره ≥ ${fa(o.hiMin)} — یعنی همهٔ ارزیاب‌ها بالاترین سطوح را داده‌اند و هیچ نمرهٔ میانی وجود ندارد.`],
      [C.TAGS.LOW, `دست‌کم ${fa(o.minVotes)} نظر و بالاترین نمرهٔ دریافتی ≤ ${fa(o.loMaxScore)} — یعنی همهٔ ارزیاب‌ها نمرهٔ پایین (۲ و کمتر) داده‌اند.`],
      [C.TAGS.DIFF, `دامنهٔ نمره‌ها ≥ ${fa(o.totalRange)}، یا فاصلهٔ نمرهٔ مدیر با میانگین ذی‌نفعان ≥ ${fa(o.gapMgrStk)}، یا پراکندگی بین خود ذی‌نفعان ≥ ${fa(o.stkRange)}.`],
      [C.TAGS.OK, 'دست‌کم دو نظر و هیچ‌کدام از شرایط بالا برقرار نیست.'],
      [C.TAGS.THIN, 'کمتر از دو نظر ثبت شده؛ تشخیص الگو ممکن نیست.'],
      [C.TAGS.NONE, 'هیچ نظری ثبت نشده است.']
    ].forEach(([t, d]) => ul.appendChild(el('li', null, [tagEl(t), el('span', { text: ' ' + d })])));
    p1.appendChild(ul);
    p1.appendChild(el('p', { style: 'margin-top:10px', text: 'این تگ‌ها فقط الگوی آماری را نشان می‌دهند، نه قضاوت دربارهٔ افراد. با تعداد کم نظر برای هر نفر، تگ‌ها نقطهٔ شروع گفت‌وگو هستند، نه مبنای تصمیم.' }));
    g.appendChild(p1);

    const pw = el('div', { class: 'panel' });
    pw.appendChild(el('h3', { text: 'نمرهٔ نهایی چطور حساب می‌شود' }));
    pw.appendChild(el('p', { text: `نمرهٔ سه ذی‌نفع اول با هم میانگین گرفته می‌شود، بعد با وزن ${fa(o.wStk)} در کنار نمرهٔ مدیر مستقیم با وزن ${fa(o.wMgr)} ترکیب می‌شود:` }));
    pw.appendChild(el('p', { style: 'font-variant-numeric:tabular-nums;background:var(--surface-2);border-radius:8px;padding:8px 12px', text: `نمرهٔ نهایی = (نمرهٔ مدیر × ${fa(o.wMgr)}) + (میانگین ذی‌نفعان × ${fa(o.wStk)})` }));
    pw.appendChild(el('p', { text: 'اگر برای فردی هیچ ذی‌نفعی نظر نداده باشد، وزن نمرهٔ مدیر ۱ می‌شود؛ و اگر مدیر نظر نداده باشد، وزن میانگین ذی‌نفعان ۱ می‌شود.' }));
    pw.appendChild(el('h3', { text: 'تعیین‌تکلیف نمرهٔ نهایی', style: 'margin-top:14px' }));
    pw.appendChild(el('p', { text: 'در ستون «وضعیت نمرهٔ نهایی» جدول تحلیل، برای هر نفر یکی از سه حالت را انتخاب کنید:' }));
    const ulw = el('ul');
    [['تایید شده (توسط مدیر)', 'همان نمرهٔ وزنی به‌عنوان نمرهٔ نهایی ثبت می‌شود.'],
     ['تایید شده (در جلسه کالیبراسیون)', 'همان نمرهٔ وزنی، ولی با مهر جلسهٔ کالیبراسیون.'],
     ['تغییر کرده (طبق جلسه کالیبراسیون)', 'کادر عددی باز می‌شود تا نمرهٔ تأییدشدهٔ جلسه را دستی وارد کنید؛ همان عدد در خروجی می‌آید.']
    ].forEach(([a, b]) => ulw.appendChild(el('li', null, [el('b', { text: a }), el('span', { text: ' — ' + b })])));
    pw.appendChild(ulw);
    pw.appendChild(el('p', { style: 'margin-top:8px', text: 'این انتخاب‌ها در مرورگر ذخیره می‌شوند و دکمهٔ «خروجی اکسل» فقط همین نمرات نهایی را بیرون می‌دهد.' }));
    g.appendChild(pw);

    const pd = el('div', { class: 'panel' });
    pd.appendChild(el('h3', { text: 'تب «توزیع نمرهٔ نهایی» را چطور بخوانیم' }));
    pd.appendChild(el('p', { text: 'این تب نشان می‌دهد نمرهٔ نهایی افراد چطور روی مقیاس ۱ تا ۵ پخش شده است. هر ستون یک بازهٔ نیم‌نمره‌ای است و ارتفاعش تعداد افرادِ آن بازه؛ با نگه‌داشتن نشانگر روی ستون، نام‌ها را می‌بینید. نوار روشنِ پشت ستون‌ها نیمهٔ میانی افراد (چارک اول تا سوم) است و خط تیره میانگین و خط نازک میانه را نشان می‌دهد.' }));
    const uld = el('ul');
    [['انحراف معیار', 'هرچه کوچک‌تر، نمرات فشرده‌تر. زیر ۰٫۴۵ یعنی نمره عملاً بین افراد تفاوتی نمی‌گذارد و برای تصمیم‌های ارتقا و پاداش قابل اتکا نیست.'],
     ['چولگی', 'اگر توده نمرات بالا باشد و دم توزیع به پایین کشیده شود، یعنی اکثریت نمرهٔ بالا گرفته‌اند و فقط چند نفر متمایز پایین‌اند.'],
     ['تورم نمره', 'وقتی ۶۰٪ یا بیشتر افراد نمرهٔ ۴ و بالاتر گرفته باشند، هشدار داده می‌شود؛ در این حالت بهتر است در جلسه، افراد هم‌نقش را نسبت به هم رتبه‌بندی کنید نه با عدد مطلق.'],
     ['باندهای عملکردی', 'همان توزیع، این بار در پنج سطح: برجسته (۴٫۵+)، بالاتر از انتظار (۴ تا ۴٫۵)، مطابق انتظار (۳ تا ۴)، نیازمند بهبود (۲ تا ۳) و نیازمند اقدام (زیر ۲).'],
     ['مبنای محاسبهٔ نمره', 'کسانی که فقط یک طرفِ ارزیابی‌شان ثبت شده، نمره‌شان با وزن ۱ همان طرف ساخته شده و با بقیه هم‌مقیاس نیست؛ این بخش تعدادشان را جدا نشان می‌دهد.']
    ].forEach(([a, b]) => uld.appendChild(el('li', null, [el('b', { text: a }), el('span', { text: ' — ' + b })])));
    pd.appendChild(uld);
    pd.appendChild(el('p', { style: 'margin-top:8px', text: 'کلید بالای نمودار بین «نمرهٔ محاسبه‌شده» (خروجی فرمول) و «نمرهٔ تأییدشده» (نتیجهٔ جلسهٔ کالیبراسیون) جابه‌جا می‌شود تا ببینید جلسه چقدر توزیع را تغییر داده است. جعبهٔ «تحلیل خودکار توزیع» هم همین اعداد را به زبان ساده تفسیر می‌کند.' }));
    g.appendChild(pd);

    const pt = el('div', { class: 'panel' });
    pt.appendChild(el('h3', { text: 'تحلیل متن توضیحات' }));
    const labels = (S.meta.commentLabels || []).filter(Boolean);
    pt.appendChild(el('p', { text: labels.length
      ? `ستون‌های متنی شناسایی‌شده در گزارش: ${labels.join('، ')}.`
      : 'در این گزارش هیچ ستون متنی شناسایی نشد. اگر ستون توضیحات را در Jira اضافه کرده‌اید، آن را در خروجی HTML هم انتخاب کنید.' }));
    pt.appendChild(el('p', { text: 'بار متن با فهرست واژگان فارسیِ بازخورد کاری سنجیده می‌شود: عبارت‌های چندکلمه‌ای («نیاز به بهبود»، «به موقع») اول تطبیق داده و از متن حذف می‌شوند، بعد واژه‌های تکی با در نظر گرفتن نفی («دقیق نبود») شمرده می‌شوند.' }));
    const ult = el('ul');
    [['مثبت', 'واژهٔ منفی ندارد یا دست‌کم دو واژه بیشتر مثبت دارد'],
     ['منفی', 'واژهٔ مثبت ندارد یا دست‌کم دو واژه بیشتر منفی دارد'],
     ['دوسویه', 'هر دو بار در متن هست و هیچ‌کدام غالب نیست'],
     ['خنثی', 'هیچ واژهٔ شاخصی در متن پیدا نشد']].forEach(([a, b]) =>
      ult.appendChild(el('li', null, [el('b', { text: a }), el('span', { text: ' — ' + b })])));
    pt.appendChild(ult);
    pt.appendChild(el('p', { style: 'margin-top:8px' }, [
      tagEl(C.TAGS.CONFLICT),
      el('span', { text: ` وقتی می‌خورد که نمرهٔ ${fa(o.conflictHigh)} یا بالاتر با متنی با بار منفی همراه شود، یا نمرهٔ ${fa(o.conflictLow)} و پایین‌تر با متنی با بار مثبت.` })
    ]));
    pt.appendChild(el('p', { style: 'margin-top:8px', text: 'این سنجش واژگانی است، نه درک معنا؛ طعنه، شرط و جملهٔ پیچیده را اشتباه می‌فهمد. با نگه‌داشتن نشانگر روی برچسبِ بار متن، واژه‌هایی که شمرده شده‌اند را می‌بینید تا خودتان قضاوت کنید.' }));
    g.appendChild(pt);

    const p2 = el('div', { class: 'panel' });
    p2.appendChild(el('h3', { text: 'تبدیل پاسخ به نمره' }));
    p2.appendChild(el('p', { text: 'گزینه‌های هر سه فرم (مدیران، ذی‌نفعان، خودارزیابی) روی یک مقیاس ۱ تا ۵ نگاشت می‌شوند:' }));
    const dl = el('dl', { class: 'kv' });
    [5, 4, 3, 2, 1].forEach(s => {
      dl.appendChild(el('dt', { text: fa(s) }));
      dl.appendChild(el('dd', { text: C.SCORE_LABEL[s] + ` — ${fa(st.dist[s] || 0)} نظر` }));
    });
    p2.appendChild(dl);
    const unk = Object.keys(S.res.unknownAnswers);
    if (unk.length) {
      p2.appendChild(el('h3', { text: 'پاسخ‌های ناشناخته', style: 'margin-top:14px' }));
      const u = el('ul');
      unk.forEach(k => u.appendChild(el('li', { text: `${k} (${fa(S.res.unknownAnswers[k])} بار)` })));
      p2.appendChild(u);
    }
    g.appendChild(p2);

    const p3 = el('div', { class: 'panel' });
    p3.appendChild(el('h3', { text: 'دادهٔ این گزارش' }));
    const dl2 = el('dl', { class: 'kv' });
    const pairs = [
      ['فایل ذی‌نفعان', S.meta.xlsx || '—'],
      ['گزارش Jira', S.meta.html || '—'],
      ['سال‌های لحاظ‌شده', S.years.map(fa).join('، ')],
      ['پاسخ‌های لحاظ‌شده', fa(st.kept)],
      ['کنار گذاشته‌شده (سال دیگر)', fa(st.dropped)],
      ['نظر دربارهٔ دیگران', fa(st.comments)],
      ['خودارزیابی', fa(S.res.selfCount)],
      ['ارزیابی‌های محول‌شده', fa(st.totalAssigned)],
      ['ثبت‌شده', `${fa(st.totalDone)} (${pct(st.pct)})`]
    ];
    pairs.forEach(([k, v]) => { dl2.appendChild(el('dt', { text: k })); dl2.appendChild(el('dd', { text: v })); });
    p3.appendChild(dl2);
    const extras = S.res.peopleByRow.filter(x => x.extras.length);
    if (extras.length) {
      p3.appendChild(el('h3', { text: 'نظرهای خارج از فهرست ذی‌نفعان', style: 'margin-top:14px' }));
      p3.appendChild(el('p', { class: 'hint', text: 'این نظرها ثبت شده‌اند ولی نظردهنده در فهرست ذی‌نفعانِ آن فرد نبوده، پس در تگ‌گذاری لحاظ نشده‌اند.' }));
      const u = el('ul');
      extras.forEach(x => x.extras.forEach(e => u.appendChild(el('li', { text: `${e.reviewer} دربارهٔ ${x.name}` }))));
      p3.appendChild(u);
    }
    g.appendChild(p3);
    return g;
  }

  /* ---------- کشوی جزئیات ---------- */
  function openDrawer(pp) {
    $('#dName').textContent = pp.name;
    const t = $('#dTags'); t.innerHTML = '';
    pp.tags.forEach(x => t.appendChild(tagEl(x)));
    const b = $('#dBody'); b.innerHTML = '';

    b.appendChild(el('div', { class: 'dsec' }, [
      el('h4', { text: 'جمع‌بندی' }), el('div', { class: 'why', text: pp.why })
    ]));

    const stats = el('dl', { class: 'kv' });
    const wtxt = pp.final === null ? '—'
      : (pp.wMgrUsed && pp.wStkUsed)
        ? `${num(pp.mgrScore)} × ${fa(pp.wMgrUsed)} + ${num(pp.stkMean, 2)} × ${fa(pp.wStkUsed)}`
        : (pp.wMgrUsed ? 'فقط نمرهٔ مدیر (وزن ۱)' : 'فقط میانگین ذی‌نفعان (وزن ۱)');
    const ap = approvedScore(pp), dc = decisionOf(pp);
    [['تعداد نظر', `${fa(pp.done)} از ${fa(pp.assigned)} ارزیاب`],
     ['نمرهٔ نهایی (وزنی)', num(pp.final, pp.final === null ? undefined : 2)],
     ['نحوهٔ محاسبه', wtxt],
     ['وضعیت نمرهٔ نهایی', dc.status ? DEC_LABEL[dc.status] : 'تعیین نشده'],
     ['نمرهٔ نهایی تأییدشده', ap === null ? '—' : num(ap, 2)],
     ['نمرهٔ مدیر', num(pp.mgrScore)],
     ['میانگین ذی‌نفعان', num(pp.stkMean, pp.stkMean === null ? undefined : 2)],
     ['میانگین سادهٔ نمره‌ها', num(pp.avg, pp.avg === null ? undefined : 2)],
     ['دامنه', num(pp.range)],
     ['خودارزیابی', pp.self ? `${num(pp.self.score)} — ${pp.self.text}` : 'ثبت نشده']
    ].forEach(([k, v]) => { stats.appendChild(el('dt', { text: k })); stats.appendChild(el('dd', { text: v })); });
    b.appendChild(el('div', { class: 'dsec' }, [el('h4', { text: 'شاخص‌ها' }), stats]));

    const list = el('div');
    pp.cells.forEach(c => {
      if (c.state === 'none') return;
      const left = el('div', { style: 'flex:1;min-width:0' }, [
        el('div', { class: 'who' }, [el('span', { text: c.name }), leanEl(c.sent, c.conflict)]),
        el('div', { class: 'role', text: c.role }),
        el('div', { class: 'ans', text: c.state === 'done' ? c.text : 'نظر ثبت نشده' }),
        c.comment ? el('div', { class: 'cmtbox', text: c.comment }) : null
      ]);
      list.appendChild(el('div', { class: 'qrow' + (c.state === 'missing' ? ' missing' : '') }, [
        dotEl(c), left
      ]));
    });
    pp.extras.forEach(e => {
      list.appendChild(el('div', { class: 'qrow' }, [
        el('span', { class: 'dot s' + (e.score === null ? 3 : Math.round(e.score)), text: fa(e.score === null ? '?' : e.score) }),
        el('div', { style: 'flex:1;min-width:0' }, [
          el('div', { class: 'who', text: e.reviewer }),
          el('div', { class: 'role', text: 'خارج از فهرست ذی‌نفعان' }),
          el('div', { class: 'ans', text: e.text })
        ])
      ]));
    });
    b.appendChild(el('div', { class: 'dsec' }, [el('h4', { text: 'نظرها' }), list]));

    $('#drawer').classList.add('on');
    $('#drawer').setAttribute('aria-hidden', 'false');
    $('#scrim').classList.add('on');
    $('#dClose').focus();
  }
  function closeDrawer() {
    $('#drawer').classList.remove('on');
    $('#drawer').setAttribute('aria-hidden', 'true');
    $('#scrim').classList.remove('on');
  }

  /* ---------- خروجی اکسل ---------- */
  function exportXlsx() {
    if (!S.res) return note('ابتدا فایل‌ها را بارگذاری کنید.', true);
    if (typeof XLSX === 'undefined') return note('کتابخانهٔ ساخت اکسل بارگذاری نشده است.', true);
    const wb = XLSX.utils.book_new();
    const rows = [['ردیف', 'نام همکار', 'نمرهٔ مدیر', 'میانگین ذی‌نفعان', 'وزن مدیر', 'وزن ذی‌نفعان',
                   'نمرهٔ نهایی (وزنی)', 'وضعیت نمرهٔ نهایی', 'نمرهٔ نهایی تأییدشده']];
    S.res.peopleByRow.forEach((p, i) => {
      const d = decisionOf(p), ap = approvedScore(p);
      rows.push([i + 1, p.name, p.mgrScore, p.stkMean,
                 p.wMgrUsed || null, p.wStkUsed || null, p.final,
                 d.status ? DEC_LABEL[d.status] : 'تعیین نشده', ap]);
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'نمرات نهایی');
    XLSX.writeFile(wb, `نمرات نهایی ${S.years.map(fa).join('-')}.xlsx`);
  }

  /* ---------- تم ---------- */
  function initTheme() {
    let t = null;
    try { t = localStorage.getItem(STORE + ':theme'); } catch (e) {}
    if (t) document.documentElement.setAttribute('data-theme', t);
    $('#btnTheme').addEventListener('click', () => {
      const cur = document.documentElement.getAttribute('data-theme');
      const isDark = cur ? cur === 'dark' : matchMedia('(prefers-color-scheme:dark)').matches;
      const next = isDark ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem(STORE + ':theme', next); } catch (e) {}
    });
  }

  /* ---------- راه‌اندازی ---------- */
  async function init() {
    initTheme();
    hookDrop('dropXlsx', 'fileXlsx', readXlsx);
    hookDrop('dropHtml', 'fileHtml', readHtml);
    $('#btnExport').addEventListener('click', exportXlsx);
    $('#btnShare').addEventListener('click', downloadDataJson);
    $('#btnReset').addEventListener('click', () => {
      try { localStorage.removeItem(STORE); } catch (e) {}
      S.people = []; S.records = []; S.meta = {}; S.years = null; S.overrides = {}; S.decisions = {}; S.basedOn = null; S.tagFilter = null; S.q = '';
      const d = sampleData(); S.people = d.people; S.records = d.records; S.meta = d.meta;
      refresh(true);
    });
    $('#search').addEventListener('input', e => { S.q = e.target.value; renderPanel(); });
    $('#scrim').addEventListener('click', closeDrawer);
    $('#dClose').addEventListener('click', closeDrawer);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });

    const hasLocal = load();
    const shared = await fetchShared();
    if (shared) {
      if (!hasLocal || S.basedOn !== shared.savedAt) {
        const localDecisions = hasLocal ? S.decisions : {};
        S.people = shared.people;
        S.records = shared.records;
        S.meta = Object.assign({}, shared.meta || {}, { shared: true, demo: false, savedAt: shared.savedAt });
        S.years = shared.years || null;
        S.overrides = shared.overrides || {};
        S.decisions = Object.assign({}, shared.decisions || {}, localDecisions);
        S.basedOn = shared.savedAt;
        sharedState = hasLocal ? 'updated' : 'loaded';
        save();
      } else {
        S.meta = Object.assign({}, S.meta, { shared: true, savedAt: shared.savedAt });
      }
    } else if (!hasLocal) {
      const d = sampleData(); S.people = d.people; S.records = d.records; S.meta = d.meta;
    }
    refresh(true);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
