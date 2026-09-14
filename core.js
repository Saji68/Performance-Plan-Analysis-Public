/* =====================================================================
   داشبورد تجربه همکاری — هستهٔ محاسباتی
   تمام پردازش در مرورگر انجام می‌شود؛ هیچ داده‌ای به سروری ارسال نمی‌شود.
   ===================================================================== */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Core = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ---------- ۱. نرمال‌سازی متن فارسی ---------- */
  const AR2FA = { 'ي': 'ی', 'ى': 'ی', 'ك': 'ک', 'ة': 'ه' };
  const DIGITS = { '۰':'0','۱':'1','۲':'2','۳':'3','۴':'4','۵':'5','۶':'6','۷':'7','۸':'8','۹':'9',
                   '٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9' };

  function normText(s) {
    if (s === null || s === undefined) return '';
    let t = String(s).replace(/[‌‎‏‪-‮]/g, ' ');
    t = t.replace(/[ً-ْٰ]/g, '');
    t = t.replace(/[يىكة]/g, c => AR2FA[c]);
    return t.replace(/\s+/g, ' ').trim();
  }
  function faDigits(s) { return String(s).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d]); }
  function enDigits(s) { return String(s).replace(/[۰-۹٠-٩]/g, d => DIGITS[d]); }

  /* ---------- ۲. تطبیق نام فارسی ↔ لاتین ---------- */
  const FA_MAP = {
    'ا':'a','آ':'a','أ':'a','إ':'a','ب':'b','پ':'p','ت':'t','ث':'s','ج':'j','چ':'c','ح':'h','خ':'x',
    'د':'d','ذ':'z','ر':'r','ز':'z','ژ':'j','س':'s','ش':'$','ص':'s','ض':'z','ط':'t','ظ':'z',
    'ع':'','غ':'q','ف':'f','ق':'q','ک':'k','گ':'g','ل':'l','م':'m','ن':'n','و':'v','ه':'h','ی':'i','ئ':'','ء':''
  };
  const VOWELS = /[aeiouy]/g;

  function collapse(s) { return s.replace(/(.)\1+/g, '$1'); }

  /* «و» در فارسی گاهی صامت (روان) و گاهی مصوت (نوروزی) است؛ هر دو حالت ساخته
     و در تطبیق بهترین نتیجه انتخاب می‌شود. همین کار برای ou/oo لاتین هم انجام می‌شود. */
  function faWordSkeleton(w, keepV) {
    let x = w;
    if (x.length > 2 && x.endsWith('ه')) x = x.slice(0, -1);      // «ه» پایانی بی‌صدا
    let out = '';
    for (const ch of x) {
      const c = FA_MAP[ch];
      if (c === undefined) continue;
      out += (c === 'v' && !keepV) ? '' : c;
    }
    return collapse(out.replace(VOWELS, ''));
  }
  function latWordSkeleton(w, keepV) {
    let x = w.toLowerCase().replace(/[^a-z]/g, '');
    if (x.length > 2 && x.endsWith('h') && /[aeiou]/.test(x[x.length - 2])) x = x.slice(0, -1);
    x = x.replace(/kh/g, 'x').replace(/gh/g, 'q').replace(/ch/g, 'c')
         .replace(/zh/g, 'j').replace(/sh/g, '$').replace(/ph/g, 'f')
         .replace(/ou|oo|au/g, keepV ? 'v' : 'u').replace(/ee|ei|ey/g, 'i').replace(/aa/g, 'a')
         .replace(/w/g, 'v');
    if (!keepV) x = x.replace(/v/g, '');
    return collapse(x.replace(VOWELS, ''));
  }
  function tokensFa(name, keepV) { return normText(name).split(' ').filter(Boolean).map(w => faWordSkeleton(w, keepV !== false)).filter(Boolean); }
  function tokensLat(name, keepV) { return String(name).split(/[\s,]+/).filter(Boolean).map(w => latWordSkeleton(w, keepV !== false)).filter(Boolean); }
  function variantsFa(name) { return [tokensFa(name, true), tokensFa(name, false)]; }
  function variantsLat(name) { return [tokensLat(name, true), tokensLat(name, false)]; }

  function lev(a, b) {
    if (a === b) return 0;
    const m = a.length, n = b.length;
    if (!m) return n; if (!n) return m;
    let prev = Array.from({ length: n + 1 }, (_, i) => i), cur = new Array(n + 1);
    for (let i = 1; i <= m; i++) {
      cur[0] = i;
      for (let j = 1; j <= n; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
      [prev, cur] = [cur, prev];
    }
    return prev[n];
  }
  const tokEq = (a, b) => a === b || (Math.min(a.length, b.length) >= 4 && lev(a, b) <= 1);
  const ratio = (a, b) => (!a.length && !b.length) ? 1 : 1 - lev(a, b) / Math.max(a.length, b.length);
  const join = arr => collapse(arr.join(''));

  /** نسبت توکن‌های نام کوتاه‌تر که در نام بلندتر همتا دارند */
  function subsetScore(t1, t2) {
    const [short, long] = t1.length <= t2.length ? [t1, t2] : [t2, t1];
    const used = new Set();
    let hit = 0;
    for (const s of short) {
      for (let i = 0; i < long.length; i++) {
        if (!used.has(i) && tokEq(s, long[i])) { used.add(i); hit++; break; }
      }
    }
    return hit === short.length ? 0.85 + 0.1 * (short.length / long.length) : 0;
  }

  /* در Jira نام به شکل «نام‌خانوادگی، نام» و در اکسل به شکل «نام نام‌خانوادگی» است.
     مرز واژه‌ها هم یکسان نیست (بهشتی نژاد ↔ Beheshtinezhad)، بنابراین همهٔ جای‌های
     ممکن برای مرز «نام | نام‌خانوادگی» در نام فارسی امتحان و بهترین انطباق انتخاب می‌شود. */
  const HONORIFIC_LAT = /^(seyed|seyyed|sayed|sayyed|sayyid|mir|haj|hajj)$/;
  const HONORIFIC_FA = /^(سید|سیّد|میر|حاج)$/;

  function splitLat(name, keepV) {
    const parts = String(name).split(',');
    const fam = (parts[0] || '').split(/\s+/).filter(Boolean);
    const giv = (parts.slice(1).join(' ') || '').split(/\s+/).filter(Boolean);
    const sk = ws => ws.filter(w => !HONORIFIC_LAT.test(w.toLowerCase()))
                       .map(w => latWordSkeleton(w, keepV)).filter(Boolean);
    const F = sk(fam), G = sk(giv);
    return { family: F, given: G, all: F.concat(G) };
  }
  function wordsFa(name) { return normText(name).split(' ').filter(Boolean).filter(w => !HONORIFIC_FA.test(w)); }

  /** امتیاز تطبیق یک نام لاتین با یک نام فارسی (۰ تا ۱) */
  function simLatFa(latName, faName) {
    let best = 0;
    for (const keepV of [true, false]) {
      const L = splitLat(latName, keepV);
      const fw = wordsFa(faName).map(w => faWordSkeleton(w, keepV)).filter(Boolean);
      if (!fw.length || !L.all.length) continue;
      best = Math.max(best, ratio(join(L.all), join(fw)), subsetScore(L.all, fw));
      if (!L.given.length) continue;
      const gl = join(L.given), fl = join(L.family);
      for (let k = 1; k < fw.length; k++) {
        const gf = join(fw.slice(0, k)), ff = join(fw.slice(k));
        const rg = ratio(gl, gf), rf = ratio(fl, ff);
        const wg = Math.max(gl.length, gf.length), wf = Math.max(fl.length, ff.length);
        best = Math.max(best, (rg * wg + rf * wf) / (wg + wf));
      }
    }
    return best;
  }
  /** امتیاز تطبیق دو املای فارسی */
  function simFaFa(a, b) {
    let best = 0;
    for (const keepV of [true, false]) {
      const ta = wordsFa(a).map(w => faWordSkeleton(w, keepV)).filter(Boolean);
      const tb = wordsFa(b).map(w => faWordSkeleton(w, keepV)).filter(Boolean);
      if (!ta.length || !tb.length) continue;
      best = Math.max(best, ratio(join(ta), join(tb)), subsetScore(ta, tb));
    }
    return best;
  }

  const MATCH_MIN = 0.74;

  /** بهترین گزینهٔ فارسی برای یک نام لاتین */
  function bestFaFor(latName, faList) {
    let best = null, bestScore = 0, second = 0;
    for (let i = 0; i < faList.length; i++) {
      const sc = simLatFa(latName, faList[i]);
      if (sc > bestScore) { second = bestScore; bestScore = sc; best = faList[i]; }
      else if (sc > second) second = sc;
    }
    return { name: best, score: bestScore, margin: bestScore - second };
  }

  /** خوشه‌بندی املاهای مختلف یک نام فارسی → نام متعارف */
  function canonicalMap(faNames) {
    const uniq = Array.from(new Set(faNames.map(normText).filter(Boolean)));
    const parent = uniq.map((_, i) => i);
    const find = i => (parent[i] === i ? i : (parent[i] = find(parent[i])));
    for (let i = 0; i < uniq.length; i++) {
      for (let j = i + 1; j < uniq.length; j++) {
        if (simFaFa(uniq[i], uniq[j]) >= 0.86) parent[find(i)] = find(j);
      }
    }
    const groups = {};
    uniq.forEach((n, i) => { (groups[find(i)] = groups[find(i)] || []).push(n); });
    const map = {};
    Object.values(groups).forEach(g => {
      // طولانی‌ترین املا به‌عنوان نام متعارف (کامل‌ترین شکل)
      const canon = g.slice().sort((a, b) => b.length - a.length || a.localeCompare(b))[0];
      g.forEach(n => { map[n] = canon; });
    });
    return map;
  }

  /* ---------- ۳. تاریخ شمسی ---------- */
  function toJalali(gy, gm, gd) {
    const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    let jy = gy <= 1600 ? 0 : 979;
    gy -= gy <= 1600 ? 621 : 1600;
    const gy2 = gm > 2 ? gy + 1 : gy;
    let days = 365 * gy + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100)
      + Math.floor((gy2 + 399) / 400) - 80 + gd + g_d_m[gm - 1];
    jy += 33 * Math.floor(days / 12053); days %= 12053;
    jy += 4 * Math.floor(days / 1461); days %= 1461;
    if (days > 365) { jy += Math.floor((days - 1) / 365); days = (days - 1) % 365; }
    const jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
    const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);
    return [jy, jm, jd];
  }
  const MONTHS_EN = { jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12 };
  const JMONTHS = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];

  /** «12/Sep/26 10:02 AM» → {date, jy, jm, label} */
  function parseJiraDate(s) {
    const m = String(s || '').match(/(\d{1,2})\/([A-Za-z]{3})\/(\d{2,4})/);
    if (!m) return null;
    const d = +m[1], mo = MONTHS_EN[m[2].toLowerCase()], y0 = +m[3];
    if (!mo) return null;
    const gy = y0 < 100 ? 2000 + y0 : y0;
    const [jy, jm, jd] = toJalali(gy, mo, d);
    return { gy, gm: mo, gd: d, jy, jm, jd, label: `${faDigits(jy)}/${faDigits(String(jm).padStart(2,'0'))}/${faDigits(String(jd).padStart(2,'0'))}`,
             monthLabel: `${JMONTHS[jm - 1]} ${faDigits(jy)}` };
  }

  /* ---------- ۴. تبدیل پاسخ به نمره ---------- */
  const ROLE_PREFIX = /^\s*(ذی\s?نفعان|ذینفعان|مدیران)\s*[-–—]\s*/;
  function cleanAnswer(t) { return normText(t).replace(ROLE_PREFIX, '').trim(); }
  function answerRole(t) {
    const n = normText(t);
    if (/^\s*(ذی\s?نفعان|ذینفعان)/.test(n)) return 'ذی‌نفع';
    if (/^\s*مدیران/.test(n)) return 'مدیر';
    return null;
  }

  const SCORE_TABLE = [
    [5, ['بیش از انتظارات', 'فراتر از برنامه عملکرد', 'عملکرد فراتر از اهداف']],
    [4, ['انتظارات را کامل و مطلوب', 'نه تنها مطلوب', 'رسیدن به تمامی اهداف', 'علاوه بر عملکرد مطلوب', '۹۰٪ - ۱۰۰٪', '90% - 100%']],
    [3, ['تا حد خوبی', 'کار محوله را مطلوب انجام داده', 'عملکرد مطلوب در انجام مسئولیت', '۸۰٪ - ۹۰٪', '80% - 90%']],
    [2, ['نیاز به ارتقا', 'عملکرد متوسط']],
    [1, ['برآورده نشده', 'عملکرد ضعیف']]
  ];
  function scoreOf(answer) {
    const t = cleanAnswer(answer).replace(/‌/g, '');
    if (!t) return null;
    for (const [sc, keys] of SCORE_TABLE) {
      for (const k of keys) if (t.indexOf(normText(k).replace(/‌/g, '')) !== -1) return sc;
    }
    return null;
  }
  const SCORE_LABEL = { 5: 'بسیار فراتر از انتظار', 4: 'مطابق انتظار و دستیابی به اهداف', 3: 'انجام قابل قبول', 2: 'نیازمند ارتقا', 1: 'ضعیف' };


  /* ---------- ۵.۱ تحلیل متن توضیحات ---------- */
  /* فهرست واژگان فارسیِ بازخورد کاری. عبارت‌های چندکلمه‌ای اول تطبیق داده و از متن
     حذف می‌شوند تا مثلاً «نیاز به بهبود» مثبت شمرده نشود. */
  const NEG_PHRASES = ['نیاز به بهبود','نیاز به ارتقا','جای بهبود','جای کار دارد','باید بهبود','قابل بهبود',
    'کافی نیست','کافی نبود','کافی نبوده','کافی نداشت','کند بود','کند است','کند پیش','سرعت کم','کم توجه','کامل نیست','کامل نبود','مطلوب نیست','مطلوب نبود','راضی نیستم','راضی نبودم',
    'انتظار می‌رفت','انتظار میرفت','عمل نکرد','پیگیری نمی','پاسخگو نیست','پاسخگو نبود','همکاری نمی','تحویل نداد',
    'به موقع نبود','بموقع نبود','سر وقت نبود','عدم همکاری','عدم پیگیری','عدم تسلط','عدم دقت','کم کاری','کم‌کاری',
    'بی توجه','بی‌توجه','بی دقت','بی‌دقت','بی نظم','بی‌نظم','بی برنامه','بی‌برنامه','زیر بار نمی'];
  const POS_PHRASES = ['بسیار خوب','بسیار عالی','فراتر از انتظار','بالاتر از انتظار','به موقع','بموقع','سر وقت',
    'پیگیر است','پیگیری خوب','پیگیری مناسب','قابل اتکا','قابل اعتماد','مسئولیت پذیر','مسئولیت‌پذیر','خوش برخورد','خوش‌برخورد','روحیه همکاری',
    'دانش فنی خوب','کیفیت بالا','تسلط خوب','پیشرفت خوب','رشد خوب','جای تقدیر','قابل تقدیر'];
  const NEG_WORDS = ['ضعیف','کندی','تاخیر','تأخیر','دیر','مشکل','ایراد','اشکال','نارضایتی','ناراضی','نقص','ناقص',
    'خطا','اشتباه','کمبود','فقدان','سردرگم','مقاومت','تنش','اختلاف','شکایت','عقب','رها','فراموش','غفلت','نگران',
    'ناهماهنگ','بی‌کیفیت','بی کیفیت','نامنظم','کم‌تجربه','کم تجربه','انفعال','منفعل','پراکنده'];
  const POS_WORDS = ['عالی','خوب','قوی','مسلط','دقیق','منظم','همکاری','همراهی','سریع','چابک',
    'خلاق','ابتکار','توانمند','ارزشمند','تشکر','ممنون','رضایت','مثبت','پیشرفت','رشد','بهبود','تلاش','کوشا',
    'متعهد','اعتماد','کمک','پشتیبان','سازنده','مؤثر','موثر','حرفه‌ای','حرفه ای','دلسوز','صبور','منعطف','یادگیر',
    'مطلوب','تقدیر','ستودنی','ممتاز','بی‌نظیر','نمونه'];
  const NEGATORS = ['نیست','نبود','نبوده','ندارد','نداشت','نمی','نکرد','نشد','نداره','خیلی کم'];

  /** تحلیل واژگانی یک متن: {pos, neg, lean, words} */
  function sentiment(text) {
    let t = ' ' + normText(text).replace(/[\u200c]/g, ' ') + ' ';
    if (!t.trim()) return { pos: 0, neg: 0, lean: 'none', hits: [] };
    let pos = 0, neg = 0; const hits = [];
    const eat = (list, bucket) => {
      list.forEach(ph => {
        const k = ' ' + ph.replace(/[\u200c]/g, ' ') + '';
        let i;
        while ((i = t.indexOf(k)) !== -1) {
          t = t.slice(0, i) + ' ' + t.slice(i + k.length);
          hits.push({ w: ph, s: bucket });
          if (bucket > 0) pos++; else neg++;
        }
      });
    };
    eat(NEG_PHRASES, -1);
    eat(POS_PHRASES, 1);
    /* واژه‌های تکی، با در نظر گرفتن نفیِ بعد از واژه («دقیق نبود») */
    const words = t.split(/[\s\.،,؛:!?()«»\/]+/).filter(Boolean);
    words.forEach((w, i) => {
      const nextTwo = words.slice(i + 1, i + 3).join(' ');
      const negated = NEGATORS.some(n => nextTwo.indexOf(n) === 0 || nextTwo.split(' ').indexOf(n) !== -1);
      if (POS_WORDS.some(x => w.indexOf(x) === 0)) {
        if (negated) { neg++; hits.push({ w: w + ' (منفی‌شده)', s: -1 }); }
        else { pos++; hits.push({ w, s: 1 }); }
      } else if (NEG_WORDS.some(x => w.indexOf(x) === 0)) {
        if (!negated) { neg++; hits.push({ w, s: -1 }); }   // «مشکلی نیست» منفی شمرده نمی‌شود
      }
    });
    let lean = 'mixed';
    if (pos === 0 && neg === 0) lean = 'neutral';
    else if (neg === 0 || pos >= neg + 2) lean = 'pos';
    else if (pos === 0 || neg >= pos + 2) lean = 'neg';
    return { pos, neg, lean, hits };
  }
  const LEAN_LABEL = { pos: 'مثبت', neg: 'منفی', mixed: 'دوسویه', neutral: 'خنثی', none: 'بدون متن' };

  /* ---------- ۵. خواندن فایل ذی‌نفعان (اکسل) ---------- */
  const HDR = { person: ['نام همکار','همکار','نام'], mgr: ['مدیر مستقیم','مدیر'] };
  function parseStakeholders(rows2d) {
    const rows = rows2d.filter(r => r && r.some(c => String(c ?? '').trim()));
    if (!rows.length) return { people: [], warnings: ['فایل خالی است.'] };
    let head = 0;
    for (let i = 0; i < Math.min(rows.length, 10); i++) {
      const joined = rows[i].map(c => normText(c)).join('|');
      if (HDR.person.some(h => joined.includes(h)) || HDR.mgr.some(h => joined.includes(h))) { head = i; break; }
    }
    const out = [], warnings = [];
    for (let i = head + 1; i < rows.length; i++) {
      const r = rows[i].map(c => normText(c));
      if (!r[0]) continue;
      out.push({ name: r[0], manager: r[1] || '', stakeholders: [r[2] || '', r[3] || '', r[4] || ''] });
    }
    if (!out.length) warnings.push('هیچ سطر همکاری در فایل پیدا نشد.');
    return { people: out, warnings };
  }

  /* ---------- ۶. خواندن گزارش Jira (HTML) ---------- */
  const FIELD = { key: 'issuekey', created: 'created', reporter: 'reporter',
                  stake: 'customfield_14450', mgrSelf: 'customfield_14001', user: 'customfield_11007' };
  const KNOWN_FIELDS = ['issuekey', 'issuetype', 'status', 'priority', 'resolution', 'created', 'updated',
    'duedate', 'assignee', 'reporter', 'progress', 'votes', 'watches',
    'customfield_10000', FIELD.stake, FIELD.mgrSelf, FIELD.user];
  const COMMENT_HDR = /توضیح|شرح|توضیحات|بازخورد|نظر\s|comment|description|note|feedback/i;

  /** ستون متن آزاد («توضیحات») را از سربرگ جدول پیدا می‌کند */
  function findCommentFields(rows, labels) {
    const cand = Object.keys(labels).filter(f => KNOWN_FIELDS.indexOf(f) === -1);
    if (!cand.length) return [];
    const named = cand.filter(f => COMMENT_HDR.test(labels[f]));
    if (named.length) return named;
    /* اگر سربرگ گویا نبود: ستونی که متن آزادِ بلند دارد */
    const stat = {};
    cand.forEach(f => { stat[f] = { n: 0, len: 0 }; });
    rows.forEach(cell => cand.forEach(f => {
      const v = cell[f]; if (v) { stat[f].n++; stat[f].len += v.length; }
    }));
    return cand.filter(f => stat[f].n >= 2 && stat[f].len / stat[f].n >= 25)
               .sort((a, b) => (stat[b].len / stat[b].n) - (stat[a].len / stat[a].n))
               .slice(0, 2);
  }

  function parseJiraDoc(doc) {
    const tables = Array.from(doc.querySelectorAll('table'));
    let table = doc.querySelector('table#issuetable') || tables.find(t => t.querySelector('td.issuekey'));
    const records = [], warnings = [];
    if (!table) { warnings.push('جدول آیتم‌های Jira در فایل پیدا نشد.'); return { records, warnings }; }

    const labels = {};
    Array.from(table.querySelectorAll('td,th')).forEach(c => {
      const m = (c.getAttribute('class') || '').match(/headerrow-([A-Za-z0-9_]+)/);
      if (m && !labels[m[1]]) labels[m[1]] = normText(c.textContent);
    });

    const raws = [];
    for (const tr of Array.from(table.querySelectorAll('tr'))) {
      const tds = Array.from(tr.querySelectorAll('td'));
      if (!tds.length) continue;
      const cell = {};
      for (const td of tds) {
        const cls = (td.getAttribute('class') || '').split(/\s+/)[0];
        if (cls) cell[cls] = normText(td.textContent);
      }
      if (cell[FIELD.key]) raws.push(cell);
    }
    const commentFields = findCommentFields(raws, labels);

    raws.forEach(cell => {
      const raw = cell[FIELD.stake] || cell[FIELD.mgrSelf] || '';
      const comment = commentFields.map(f => cell[f]).filter(Boolean).join(' — ');
      records.push({
        key: cell[FIELD.key],
        created: cell[FIELD.created] || '',
        date: parseJiraDate(cell[FIELD.created]),
        reporterLat: cell[FIELD.reporter] || '',
        targetLat: cell[FIELD.user] || '',
        answer: cleanAnswer(raw),
        declaredRole: answerRole(raw),
        score: scoreOf(raw),
        comment: comment,
        rawField: cell[FIELD.stake] ? 'stake' : 'self'
      });
    });
    if (!records.length) warnings.push('هیچ آیتمی در جدول Jira خوانده نشد.');
    return { records, warnings, commentFields, commentLabels: commentFields.map(f => labels[f] || f), labels };
  }
  function parseJiraHtml(text) {
    const doc = new DOMParser().parseFromString(text, 'text/html');
    return parseJiraDoc(doc);
  }

  /* ---------- ۷. محاسبهٔ کامل ---------- */
  const DEFAULTS = {
    wMgr: 0.6, wStk: 0.4,          // وزن نمرهٔ مدیر و میانگین ذی‌نفعان در نمرهٔ نهایی
    hiMean: 4.5, hiMin: 4,          // آستانهٔ «نمرهٔ بالای مشکوک»
    loMaxScore: 2,                  // «نمرهٔ پایین» یعنی ۲ و کمتر
    gapMgrStk: 1.5, stkRange: 2, totalRange: 2,
    minVotes: 2, leniency: 0.4, minGiven: 3,
    conflictHigh: 4, conflictLow: 2      // تناقض: نمرهٔ ≥۴ با متن منفی، یا نمرهٔ ≤۲ با متن مثبت
  };

  const TAGS = {
    HIGH: 'نمرهٔ بالای مشکوک', LOW: 'نمرهٔ پایین مشکوک', DIFF: 'اختلاف نظر',
    CONFLICT: 'تناقض متن و نمره',
    OK: 'طبیعی', THIN: 'داده ناکافی', NONE: 'بدون نظر'
  };
  const TAG_ORDER = [TAGS.HIGH, TAGS.LOW, TAGS.DIFF, TAGS.CONFLICT, TAGS.OK, TAGS.THIN, TAGS.NONE];

  const mean = a => a.reduce((s, x) => s + x, 0) / a.length;
  const r2 = x => Math.round(x * 100) / 100;

  /* ================= تحلیل توزیع نمرهٔ نهایی ================= */

  /* باندهای عملکردی روی مقیاس ۱ تا ۵ (بازهٔ پایین بسته، بالا باز) */
  const BANDS = [
    { key: 'b5', lo: 4.5, hi: 5.01, label: 'برجسته', range: '۴٫۵ و بالاتر', hint: 'فراتر از انتظار نقش' },
    { key: 'b4', lo: 4.0, hi: 4.5, label: 'بالاتر از انتظار', range: '۴ تا ۴٫۵', hint: 'مستمراً بالای سطح انتظار' },
    { key: 'b3', lo: 3.0, hi: 4.0, label: 'مطابق انتظار', range: '۳ تا ۴', hint: 'عملکرد مورد انتظار نقش' },
    { key: 'b2', lo: 2.0, hi: 3.0, label: 'نیازمند بهبود', range: '۲ تا ۳', hint: 'فاصله تا سطح انتظار' },
    { key: 'b1', lo: 0, hi: 2.0, label: 'نیازمند اقدام', range: 'زیر ۲', hint: 'نیازمند برنامهٔ اصلاحی' }
  ];
  const bandOf = v => BANDS.find(b => v >= b.lo && v < b.hi) || BANDS[BANDS.length - 1];

  function quantile(sorted, q) {
    if (!sorted.length) return null;
    if (sorted.length === 1) return sorted[0];
    const pos = (sorted.length - 1) * q, i = Math.floor(pos), frac = pos - i;
    return sorted[i + 1] === undefined ? sorted[i] : sorted[i] + frac * (sorted[i + 1] - sorted[i]);
  }

  /* آمار توصیفی یک بردار نمره */
  function describe(vals) {
    if (!vals.length) return null;
    const s = vals.slice().sort((a, b) => a - b);
    const n = s.length, m = mean(s);
    const sd = n > 1 ? Math.sqrt(s.reduce((a, x) => a + (x - m) * (x - m), 0) / (n - 1)) : 0;
    const q1 = quantile(s, 0.25), med = quantile(s, 0.5), q3 = quantile(s, 0.75);
    const skew = (sd > 0 && n > 2)
      ? (n / ((n - 1) * (n - 2))) * s.reduce((a, x) => a + Math.pow((x - m) / sd, 3), 0)
      : 0;
    return {
      n: n, mean: r2(m), sd: r2(sd), min: s[0], max: s[n - 1],
      q1: r2(q1), median: r2(med), q3: r2(q3), iqr: r2(q3 - q1),
      skew: r2(skew), cv: m ? r2(sd / m) : 0, sorted: s
    };
  }

  /* هیستوگرام با گام دلخواه روی بازهٔ ۱ تا ۵ */
  function histogram(items, step) {
    const st = step || 0.5, bins = [];
    for (let x = 1; x < 5 - 1e-9; x = r2(x + st)) {
      bins.push({ lo: r2(x), hi: r2(Math.min(5, x + st)), n: 0, names: [] });
    }
    items.forEach(it => {
      let i = Math.floor((it.v - 1) / st);
      if (i < 0) i = 0; if (i >= bins.length) i = bins.length - 1;
      bins[i].n++; bins[i].names.push(it.name);
    });
    return bins;
  }

  /* برچسب وضعیت شکل توزیع */
  const SHAPE = {
    tight: 'فشرده', wide: 'پراکنده', normal: 'متعارف',
    left: 'چوله به چپ', right: 'چوله به راست', sym: 'تقریباً متقارن'
  };

  /**
   * تحلیل توزیع نمرهٔ نهایی.
   * people: خروجی compute().people
   * opts.approvedOf(person) → عدد یا null (نمرهٔ تأییدشده در کالیبراسیون)
   */
  function distribution(people, opts) {
    const o = Object.assign({ step: 0.5, inflateBand: 4, inflateShare: 0.6, tightSd: 0.45, wideSd: 0.9, mode: 'calc' }, opts || {});
    const isApproved = o.mode === 'approved';
    const approvedOf = o.approvedOf || (() => null);

    const scored = people.filter(p => p.final !== null);
    const noScore = people.filter(p => p.final === null);
    const items = scored.map(p => ({ name: p.name, v: p.final, tags: p.tags }));
    const st = describe(items.map(i => i.v));
    const bins = histogram(items, o.step);

    /* مبنای نمره: هر دو طرف / فقط مدیر / فقط ذی‌نفع */
    const basis = { full: [], mgr: [], stk: [] };
    scored.forEach(p => {
      if (p.mgrScore !== null && p.stkMean !== null) basis.full.push(p.name);
      else if (p.mgrScore !== null) basis.mgr.push(p.name);
      else basis.stk.push(p.name);
    });

    /* باندهای عملکردی */
    const bands = BANDS.map(b => {
      const list = items.filter(i => i.v >= b.lo && i.v < b.hi);
      return Object.assign({}, b, {
        n: list.length, share: st ? list.length / st.n : 0,
        names: list.sort((a, b2) => b2.v - a.v).map(i => i.name + ' (' + faDigits(i.v.toFixed(2)).replace(/\./g, '٫') + ')')
      });
    });

    /* کالیبراسیون: نمرهٔ تأییدشده در برابر محاسبه‌شده */
    const calib = { decided: 0, changed: 0, pairs: [], shift: null, approvedStats: null };
    const appVals = [];
    scored.forEach(p => {
      const a = approvedOf(p);
      if (a === null || a === undefined || !isFinite(a)) return;
      calib.decided++;
      appVals.push(a);
      const d = r2(a - p.final);
      if (Math.abs(d) >= 0.01) { calib.changed++; calib.pairs.push({ name: p.name, from: p.final, to: r2(a), delta: d }); }
    });
    calib.pairs.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
    if (appVals.length) {
      calib.approvedStats = describe(appVals);
      calib.shift = r2(calib.approvedStats.mean - mean(scored.filter(p => {
        const a = approvedOf(p); return a !== null && a !== undefined && isFinite(a);
      }).map(p => p.final)));
    }

    if (!st) return { stats: null, bins: bins, bands: bands, basis: basis, calib: calib, noScore: noScore.map(p => p.name), insights: [], shape: null, top: [], bottom: [] };

    /* شکل توزیع */
    const topShare = bands.filter(b => b.lo >= o.inflateBand).reduce((s, b) => s + b.share, 0);
    const nearMean = items.filter(i => Math.abs(i.v - st.mean) <= 0.5).length / st.n;
    const biggest = bins.reduce((a, b) => b.n > a.n ? b : a, bins[0]);
    const shape = {
      spread: st.sd <= o.tightSd ? 'tight' : st.sd >= o.wideSd ? 'wide' : 'normal',
      skewDir: st.skew <= -0.35 ? 'left' : st.skew >= 0.35 ? 'right' : 'sym',
      topShare: r2(topShare), nearMean: r2(nearMean),
      biggest: biggest, distinct: new Set(items.map(i => i.v)).size
    };

    const sortedItems = items.slice().sort((a, b) => b.v - a.v);
    const top = sortedItems.slice(0, 3);
    const bottom = sortedItems.slice(-3).reverse();

    /* ---- جملات تحلیلی ---- */
    const ins = [];
    const P = x => faDigits(Math.round(x * 100)) + '٪';
    const N = (x, d) => faDigits(Number(x).toFixed(d === undefined ? 2 : d)).replace(/\./g, '٫');

    ins.push({
      kind: 'info', title: 'مرکز توزیع',
      text: `نمرهٔ نهایی برای ${faDigits(st.n)} نفر محاسبه شده است. میانگین ${N(st.mean)} و میانه ${N(st.median)} است؛ ` +
        (Math.abs(st.mean - st.median) < 0.1
          ? 'نزدیکی این دو یعنی نمرهٔ چند نفر خاص، تصویر کلی را جابه‌جا نکرده است.'
          : `فاصلهٔ ${N(Math.abs(st.mean - st.median))} میان آن‌ها یعنی چند نمرهٔ ${st.mean < st.median ? 'پایین' : 'بالا'} میانگین را نسبت به وضعیت اکثریت ${st.mean < st.median ? 'پایین' : 'بالا'} کشیده‌اند.`) +
        ` نیمهٔ میانی افراد بین ${N(st.q1)} تا ${N(st.q3)} قرار دارند.`
    });

    if (shape.spread === 'tight') {
      ins.push({
        kind: 'warn', title: 'فشردگی نمرات',
        text: `انحراف معیار فقط ${N(st.sd)} است و ${P(shape.nearMean)} افراد در فاصلهٔ نیم‌نمره‌ای از میانگین جمع شده‌اند. ` +
          `عملاً همهٔ نمرات یک عدد را تکرار می‌کنند و این توزیع برای تصمیم‌هایی مثل ارتقا یا پاداش، قدرت تفکیک لازم را ندارد. ` +
          `در جلسهٔ کالیبراسیون لازم است ارزیاب‌ها تفاوت‌های واقعی را صریح‌تر بیان کنند.`
      });
    } else if (shape.spread === 'wide') {
      ins.push({
        kind: 'warn', title: 'پراکندگی زیاد',
        text: `انحراف معیار ${N(st.sd)} و دامنه از ${N(st.min)} تا ${N(st.max)} است. این پراکندگی یا واقعاً تفاوت عملکردی بزرگی را نشان می‌دهد، ` +
          `یا نشانهٔ آن است که ارزیاب‌ها معیار مشترکی از «سطح انتظار» ندارند. پیش از استفاده از این نمرات، تب «ارزیاب‌ها» را برای تشخیص سخت‌گیرها و سهل‌گیرها ببینید.`
      });
    } else {
      ins.push({
        kind: 'ok', title: 'پراکندگی متعارف',
        text: `انحراف معیار ${N(st.sd)} در محدودهٔ سالم است؛ نمرات نه آن‌قدر فشرده‌اند که تفکیک‌ناپذیر شوند و نه آن‌قدر پراکنده که به بی‌معیاری ارزیاب‌ها مشکوک شویم.`
      });
    }

    if (Math.round(topShare * 100) >= Math.round(o.inflateShare * 100)) {
      ins.push({
        kind: 'bad', title: 'نشانهٔ تورم نمره',
        text: `${P(topShare)} افراد نمرهٔ ${faDigits(o.inflateBand)} یا بالاتر گرفته‌اند. وقتی اکثریت در بالاترین باندها جمع می‌شوند، نمره دیگر عملکرد را از هم جدا نمی‌کند ` +
          `و بیشتر بازتاب فرهنگ تعارف در ارزیابی است تا تفاوت واقعی. توصیه می‌شود در جلسهٔ کالیبراسیون، رتبه‌بندی نسبی افراد هم‌نقش بررسی شود، نه فقط عدد مطلق.`
      });
    }

    if (shape.skewDir !== 'sym') {
      ins.push({
        kind: 'info', title: 'شکل توزیع: ' + SHAPE[shape.skewDir],
        text: shape.skewDir === 'left'
          ? `توده نمرات در سمت بالا جمع شده و دم توزیع به سمت پایین کشیده شده (شاخص چولگی ${N(Math.abs(st.skew))} به چپ). یعنی اکثریت نمرهٔ بالایی دارند و تعداد کمی به‌وضوح پایین‌تر هستند؛ همان چند نفر معمولاً موضوع اصلی جلسهٔ کالیبراسیون‌اند.`
          : `توده نمرات در سمت پایین جمع شده و دم توزیع به سمت بالا کشیده شده (شاخص چولگی ${N(Math.abs(st.skew))} به راست). یعنی اکثریت در سطح میانی یا پایین‌اند و تعداد کمی به‌وضوح بالاتر؛ بررسی کنید آیا این چند نفر واقعاً متمایزند یا ارزیاب متفاوتی داشته‌اند.`
      });
    }

    if (shape.biggest && st.n && shape.biggest.n / st.n >= 0.4) {
      ins.push({
        kind: 'warn', title: 'تمرکز در یک بازه',
        text: `${P(shape.biggest.n / st.n)} افراد (${faDigits(shape.biggest.n)} نفر) در همان بازهٔ ${N(shape.biggest.lo, 1)} تا ${N(shape.biggest.hi, 1)} قرار گرفته‌اند. ` +
          `درون این گروه، نمره تقریباً هیچ تمایزی ایجاد نمی‌کند و برای تصمیم‌گیری باید به متن نظرها و تگ‌ها تکیه کرد.`
      });
    }

    if (basis.mgr.length || basis.stk.length) {
      const part = [];
      if (basis.mgr.length) part.push(`${faDigits(basis.mgr.length)} نفر فقط نمرهٔ مدیر دارند`);
      if (basis.stk.length) part.push(`${faDigits(basis.stk.length)} نفر فقط نمرهٔ ذی‌نفعان`);
      ins.push({
        kind: 'bad', title: 'مبنای نمره یکسان نیست',
        text: `نمرهٔ ${faDigits(basis.mgr.length + basis.stk.length)} نفر از ${faDigits(st.n)} نفر با فرمول کامل (۶۰٪ مدیر + ۴۰٪ ذی‌نفعان) ساخته نشده است: ${part.join(' و ')}. ` +
          `نمرهٔ این افراد روی مقیاس متفاوتی نسبت به بقیه قرار دارد و مقایسهٔ مستقیم آن‌ها با کسانی که هر دو طرف را دارند، دقیق نیست. ` +
          `بهترین اقدام، تکمیل ارزیابی‌های جامانده پیش از نهایی‌سازی است.`
      });
    }

    const flaggedTop = items.filter(i => i.v >= o.inflateBand && i.tags.indexOf(TAGS.HIGH) !== -1).length;
    const flaggedLow = items.filter(i => i.v <= 2.5 && i.tags.indexOf(TAGS.LOW) !== -1).length;
    const flaggedDiff = items.filter(i => i.tags.indexOf(TAGS.DIFF) !== -1).length;
    if (flaggedTop || flaggedLow || flaggedDiff) {
      const part = [];
      if (flaggedTop) part.push(`${faDigits(flaggedTop)} نفر از افراد بالای ${faDigits(o.inflateBand)} تگ «${TAGS.HIGH}» دارند`);
      if (flaggedLow) part.push(`${faDigits(flaggedLow)} نفر در باندهای پایین تگ «${TAGS.LOW}» دارند`);
      if (flaggedDiff) part.push(`${faDigits(flaggedDiff)} نفر تگ «${TAGS.DIFF}» دارند که نمرهٔ نهایی‌شان میانگین دو نگاه متفاوت است`);
      ins.push({
        kind: 'warn', title: 'کیفیت دادهٔ پشت نمره',
        text: part.join('؛ ') + '. نمرهٔ نهایی این افراد پیش از تأیید باید در جلسه بررسی شود، چون عدد به‌تنهایی تصویر درستی نمی‌دهد.'
      });
    }

    if (noScore.length) {
      ins.push(isApproved ? {
        kind: 'warn', title: 'هنوز تأیید نشده',
        text: `${faDigits(noScore.length)} نفر هنوز نمرهٔ تأییدشده ندارند و در این نمودار نیامده‌اند. ` +
          `تا وقتی وضعیت آن‌ها در تب «تحلیل و تگ‌ها» مشخص نشود، این توزیع فقط بخشی از سازمان را نشان می‌دهد.`
      } : {
        kind: 'bad', title: 'بدون نمرهٔ نهایی',
        text: `${faDigits(noScore.length)} نفر هیچ نمره‌ای دریافت نکرده‌اند و در این توزیع نیامده‌اند: ${noScore.slice(0, 8).map(p => p.name).join('، ')}${noScore.length > 8 ? ' و ...' : ''}. ` +
          `تا وقتی ارزیابی آن‌ها ثبت نشود، هر میانگین سازمانی ناقص است.`
      });
    }

    if (isApproved) { /* در نمای تأییدشده، مقایسه با خودش معنا ندارد */ }
    else if (calib.decided) {
      ins.push({
        kind: calib.changed ? 'info' : 'ok', title: 'اثر کالیبراسیون',
        text: `برای ${faDigits(calib.decided)} نفر تصمیم ثبت شده است` +
          (calib.changed
            ? `، که نمرهٔ ${faDigits(calib.changed)} نفرشان در جلسه تغییر کرده و میانگین تأییدشده ${calib.shift >= 0 ? 'به‌اندازهٔ ' + N(Math.abs(calib.shift)) + ' بالاتر' : 'به‌اندازهٔ ' + N(Math.abs(calib.shift)) + ' پایین‌تر'} از نمرهٔ محاسبه‌شده است. اگر این جابه‌جایی یک‌طرفه و بزرگ باشد، یعنی فرمول با قضاوت واقعی مدیران هم‌راستا نیست و بهتر است وزن‌ها بازبینی شود.`
            : ` و هیچ‌کدام تغییر نکرده‌اند؛ یعنی خروجی فرمول با قضاوت جلسه هم‌خوان بوده است.`)
      });
    } else {
      ins.push({
        kind: 'info', title: 'هنوز تأیید نشده',
        text: `برای هیچ‌کس تصمیم کالیبراسیون ثبت نشده است. در تب «تحلیل و تگ‌ها» می‌توانید برای هر نفر یکی از حالت‌های تأیید را انتخاب کنید تا ستون نمرهٔ تأییدشده در همین نمودار و در خروجی اکسل پر شود.`
      });
    }

    return { stats: st, bins: bins, bands: bands, basis: basis, calib: calib, shape: shape,
             top: top, bottom: bottom, noScore: noScore.map(p => p.name), insights: ins };
  }

  function compute(peopleRows, records, opts) {
    const o = Object.assign({}, DEFAULTS, opts || {});
    const years = o.years && o.years.length ? o.years.slice() : null;

    /* نام‌های متعارف فارسی از فایل اکسل */
    const allFa = [];
    peopleRows.forEach(p => { allFa.push(p.name); if (p.manager) allFa.push(p.manager); p.stakeholders.forEach(s => s && allFa.push(s)); });
    const canon = canonicalMap(allFa);
    const canonOf = n => canon[normText(n)] || normText(n);
    const faList = Array.from(new Set(Object.values(canon)));

    /* نگاشت لاتین → فارسی */
    const latNames = Array.from(new Set(records.flatMap(r => [r.reporterLat, r.targetLat]).filter(Boolean)));
    const nameMap = {}, unmatched = [];
    const overrides = o.overrides || {};
    latNames.forEach(l => {
      if (overrides[l]) { nameMap[l] = canonOf(overrides[l]); return; }
      const b = bestFaFor(l, faList);
      if (b.name && b.score >= MATCH_MIN) nameMap[l] = b.name;
      else { nameMap[l] = null; unmatched.push({ lat: l, guess: b.name, score: r2(b.score) }); }
    });

    /* فیلتر سال و دسته‌بندی رکوردها */
    const yearsSeen = {};
    records.forEach(r => { if (r.date) yearsSeen[r.date.jy] = (yearsSeen[r.date.jy] || 0) + 1; });
    const inYear = r => !years || !r.date || years.indexOf(r.date.jy) !== -1;

    const kept = [], dropped = [], unknownAnswers = {};
    records.forEach(r => {
      if (r.answer && r.score === null) unknownAnswers[r.answer] = (unknownAnswers[r.answer] || 0) + 1;
      (inYear(r) ? kept : dropped).push(r);
    });

    /* شاخص نظرها */
    const fb = new Map();          // "target|reviewer" → {texts, scores, keys}
    const selfMap = new Map();     // reviewer → {text, score, key}
    kept.forEach(r => {
      const rev = nameMap[r.reporterLat]; if (!rev) return;
      if (r.targetLat) {
        const tgt = nameMap[r.targetLat]; if (!tgt) return;
        const k = tgt + '|' + rev;
        const cur = fb.get(k) || { texts: [], scores: [], keys: [], dates: [], comments: [] };
        cur.texts.push(r.answer); if (r.score !== null) cur.scores.push(r.score);
        cur.keys.push(r.key); if (r.date) cur.dates.push(r.date.label);
        if (r.comment) cur.comments.push(r.comment);
        fb.set(k, cur);
      } else {
        selfMap.set(rev, { text: r.answer, score: r.score, key: r.key, date: r.date ? r.date.label : '', comment: r.comment || '' });
      }
    });

    const allScores = [];
    fb.forEach(v => v.scores.forEach(s => allScores.push(s)));
    const pop = allScores.length ? mean(allScores) : 0;

    /* تحلیل هر نفر */
    const pending = [];
    const people = peopleRows.map((p, idx) => {
      const tgt = canonOf(p.name);
      const revs = [
        { role: 'مدیر مستقیم', name: p.manager ? canonOf(p.manager) : '', raw: p.manager },
        ...p.stakeholders.map((s, i) => ({ role: 'ذی‌نفع ' + faDigits(i + 1), name: s ? canonOf(s) : '', raw: s }))
      ];
      const cells = revs.map(rv => {
        if (!rv.name) return Object.assign({}, rv, { state: 'none' });
        const got = fb.get(tgt + '|' + rv.name);
        if (!got) { pending.push({ reviewer: rv.name, target: p.name, role: rv.role }); return Object.assign({}, rv, { state: 'missing' }); }
        const comment = (got.comments || []).join(' — ');
        const sent = comment ? sentiment(comment) : null;
        const sc = got.scores.length ? r2(mean(got.scores)) : null;
        const conflict = !!(sent && sc !== null &&
          ((sc >= o.conflictHigh && sent.lean === 'neg') || (sc <= o.conflictLow && sent.lean === 'pos')));
        return Object.assign({}, rv, {
          state: 'done', text: got.texts.join(' ؛ '),
          score: sc, comment, sent, conflict,
          count: got.texts.length, keys: got.keys, dates: got.dates
        });
      });
      const assigned = cells.filter(c => c.state !== 'none').length;
      const done = cells.filter(c => c.state === 'done').length;
      const mgrCell = cells[0], stkCells = cells.slice(1);
      const mgrScore = mgrCell.state === 'done' && mgrCell.score !== null ? mgrCell.score : null;
      const stkScores = stkCells.filter(c => c.state === 'done' && c.score !== null).map(c => c.score);
      const vals = (mgrScore !== null ? [mgrScore] : []).concat(stkScores);
      const n = vals.length;
      const avg = n ? r2(mean(vals)) : null;
      /* نمرهٔ نهایی = میانگین وزنی مدیر و میانگین ذی‌نفعان؛
         اگر یکی از دو طرف نظری نداده باشد، وزن طرف دیگر ۱ می‌شود. */
      const stkAvg = stkScores.length ? mean(stkScores) : null;
      let final = null, wMgrUsed = 0, wStkUsed = 0;
      if (mgrScore !== null && stkAvg !== null) {
        wMgrUsed = o.wMgr; wStkUsed = o.wStk;
        final = r2(o.wMgr * mgrScore + o.wStk * stkAvg);
      } else if (mgrScore !== null) { wMgrUsed = 1; final = r2(mgrScore); }
      else if (stkAvg !== null) { wStkUsed = 1; final = r2(stkAvg); }
      const min = n ? Math.min(...vals) : null, max = n ? Math.max(...vals) : null;
      const range = n ? r2(max - min) : null;
      const self = selfMap.get(tgt) || null;
      const gapSelf = (self && self.score !== null && final !== null) ? r2(self.score - final) : null;

      /* موارد خارج از فهرست ذی‌نفعان */
      const known = new Set(revs.filter(r => r.name).map(r => r.name));
      const extras = [];
      fb.forEach((v, k) => {
        const [t, rev] = k.split('|');
        if (t === tgt && !known.has(rev)) extras.push({ reviewer: rev, text: v.texts.join(' ؛ '), score: v.scores.length ? r2(mean(v.scores)) : null, keys: v.keys });
      });

      /* تگ‌گذاری */
      const tags = [], why = [];
      if (n === 0) {
        tags.push(TAGS.NONE);
        why.push(assigned ? `هیچ‌کدام از ${faDigits(assigned)} ارزیاب تعیین‌شده نظری ثبت نکرده‌اند.` : 'برای این همکار ارزیابی تعیین نشده است.');
      } else if (n < o.minVotes) {
        tags.push(TAGS.THIN);
        why.push(`فقط یک نظر ثبت شده (نمرهٔ ${faDigits(vals[0])}) و با یک داده نمی‌توان الگوی مشکوک را تشخیص داد.`);
      } else {
        const stkMean = stkScores.length ? mean(stkScores) : null;
        const gapMS = (mgrScore !== null && stkMean !== null) ? Math.abs(mgrScore - stkMean) : 0;
        const stkRange = stkScores.length > 1 ? Math.max(...stkScores) - Math.min(...stkScores) : 0;
        if (final >= o.hiMean && min >= o.hiMin) {
          tags.push(TAGS.HIGH);
          why.push(`هر ${faDigits(n)} ارزیاب دست‌کم نمرهٔ ${faDigits(min)} داده‌اند و نمرهٔ نهایی او ${faDigits(final.toFixed(2))} شده، در حالی که میانگین کل سازمان ${faDigits(pop.toFixed(2))} است.`);
          why.push('اتفاق‌نظر کامل روی بالاترین سطوح، بدون هیچ نمرهٔ میانی، الگوی رایج «نمره‌دهی تعارفی» است و بهتر است با شواهد عملکردی راستی‌آزمایی شود.');
        }
        if (max <= o.loMaxScore) {
          tags.push(TAGS.LOW);
          why.push(`هر ${faDigits(n)} ارزیاب نمرهٔ ${faDigits(o.loMaxScore)} یا پایین‌تر داده‌اند (بالاترین نمرهٔ دریافتی ${faDigits(max)}) و نمرهٔ نهایی او ${faDigits(final.toFixed(2))} است.`);
          why.push('وقتی همهٔ ارزیاب‌ها هم‌زمان پایین می‌دهند، یا مسئلهٔ واقعی عملکردی وجود دارد یا انتظارات نقش از ابتدا شفاف نبوده؛ هر دو حالت نیاز به گفت‌وگوی جداگانه دارد.');
        }
        if (range >= o.totalRange || gapMS >= o.gapMgrStk || stkRange >= o.stkRange) {
          tags.push(TAGS.DIFF);
          const parts = [];
          if (gapMS >= o.gapMgrStk) parts.push(`نمرهٔ مدیر مستقیم (${faDigits(mgrScore)}) با میانگین ذی‌نفعان (${faDigits(stkMean.toFixed(2))}) حدود ${faDigits(gapMS.toFixed(1))} نمره فاصله دارد`);
          if (stkRange >= o.stkRange) parts.push(`ذی‌نفعان خودشان از ${faDigits(Math.min(...stkScores))} تا ${faDigits(Math.max(...stkScores))} پراکنده‌اند`);
          if (!parts.length) parts.push(`نمره‌ها از ${faDigits(min)} تا ${faDigits(max)} پخش شده‌اند`);
          why.push(parts.join(' و ') + '.');
          why.push('این واگرایی معمولاً یعنی عملکرد او در تعامل‌های مختلف یکسان تجربه نشده؛ پیش از جمع‌بندی نمره لازم است دلیل اختلاف از خود ارزیاب‌ها پرسیده شود.');
        }
        if (!tags.length) {
          tags.push(TAGS.OK);
          why.push(`نمرهٔ نهایی ${faDigits(final.toFixed(2))} با دامنهٔ ${faDigits(range)} در محدودهٔ طبیعی سازمان قرار دارد و ارزیاب‌ها تصویر هم‌راستایی از او داده‌اند.`);
        }
      }
      const withText = cells.filter(c => c.state === 'done' && c.comment);
      const conflicts = withText.filter(c => c.conflict);
      if (conflicts.length) {
        tags.push(TAGS.CONFLICT);
        const one = conflicts[0];
        why.push(`${conflicts.length > 1 ? faDigits(conflicts.length) + ' ارزیاب' : one.name} نمره و متن ناهم‌خوان داده‌اند — برای نمونه نمرهٔ ${faDigits(one.score)} در کنار توضیحی با بار ${one.sent.lean === 'neg' ? 'منفی' : 'مثبت'} («${one.sent.hits.slice(0, 3).map(h => h.w).join('، ')}»).`);
        why.push('این ناهم‌خوانی معمولاً یعنی ارزیاب حرف واقعی‌اش را در متن نوشته ولی در گزینه محافظه‌کاری کرده؛ متن را مبنا بگیرید، نه گزینه را.');
      }
      if (gapSelf !== null && Math.abs(gapSelf) >= 1.5) {
        why.push(`ضمناً خودارزیابی او (${faDigits(self.score)}) حدود ${faDigits(Math.abs(gapSelf))} نمره ${gapSelf > 0 ? 'بالاتر از' : 'پایین‌تر از'} میانگین نظر دیگران است.`);
      }
      if (n && done < assigned) {
        why.push(`توجه: از ${faDigits(assigned)} ارزیاب تعیین‌شده تنها ${faDigits(done)} نفر نظر داده‌اند، پس تحلیل بر دادهٔ ناقص استوار است.`);
      }
      return { idx, name: p.name, canon: tgt, cells, assigned, done, missing: assigned - done,
               mgrScore, stkScores, stkMean: stkScores.length ? r2(mean(stkScores)) : null,
               values: vals, n, avg, final, wMgrUsed, wStkUsed, min, max, range, self, gapSelf, extras,
               withText: withText.length, conflicts: conflicts.length,
               tags, tag: tags[0] || TAGS.NONE, why: why.join(' ') };
    });

    /* ارزیاب‌ها */
    const assignMap = new Map();
    peopleRows.forEach(p => {
      const t = canonOf(p.name);
      [p.manager, ...p.stakeholders].forEach(rv => {
        if (!rv) return;
        const c = canonOf(rv);
        const cur = assignMap.get(c) || [];
        cur.push(t); assignMap.set(c, cur);
      });
    });
    const employeeSet = new Set(peopleRows.map(p => canonOf(p.name)));
    const reviewers = Array.from(assignMap.entries()).map(([rev, targets]) => {
      const given = [], doneT = [];
      let texts = 0;
      targets.forEach(t => {
        const g = fb.get(t + '|' + rev);
        if (g) { doneT.push(t); g.scores.forEach(s => given.push(s)); if ((g.comments || []).length) texts++; }
      });
      const avg = given.length ? r2(mean(given)) : null;
      const dev = avg !== null ? r2(avg - pop) : null;
      let style = '—';
      if (avg !== null) style = given.length >= o.minGiven ? (dev >= o.leniency ? 'سهل‌گیر' : dev <= -o.leniency ? 'سخت‌گیر' : 'متعادل') : 'نمونهٔ کم';
      return { name: rev, assigned: targets.length, done: doneT.length, missing: targets.length - doneT.length,
               pct: targets.length ? doneT.length / targets.length : 0, avg, dev, style, texts,
               self: selfMap.has(rev) ? 'انجام شده' : (employeeSet.has(rev) ? 'ثبت نشده' : 'لازم نیست') };
    }).sort((a, b) => b.missing - a.missing || b.assigned - a.assigned);

    let cWith = 0, cLen = 0, cConflict = 0;
    const leanCount = { pos: 0, neg: 0, mixed: 0, neutral: 0 };
    people.forEach(p => p.cells.forEach(c => {
      if (c.state !== 'done') return;
      if (c.comment) { cWith++; cLen += c.comment.length; leanCount[c.sent.lean === 'none' ? 'neutral' : c.sent.lean]++; }
      if (c.conflict) cConflict++;
    }));

    const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    allScores.forEach(s => { dist[s]++; });
    const tagCount = {};
    TAG_ORDER.forEach(t => { tagCount[t] = 0; });
    people.forEach(p => p.tags.forEach(t => { tagCount[t]++; }));

    const totalAssigned = people.reduce((s, p) => s + p.assigned, 0);
    const totalDone = people.reduce((s, p) => s + p.done, 0);

    return {
      people: people.slice().sort((a, b) => TAG_ORDER.indexOf(a.tag) - TAG_ORDER.indexOf(b.tag) || (b.final ?? -1) - (a.final ?? -1)),
      peopleByRow: people, pending, reviewers, dropped, unmatched, unknownAnswers,
      selfCount: selfMap.size, yearsSeen, canonMap: canon, nameMap,
      stats: { pop: r2(pop), dist, tagCount, totalAssigned, totalDone,
               withText: cWith, avgLen: cWith ? Math.round(cLen / cWith) : 0,
               conflicts: cConflict, leanCount,
               pct: totalAssigned ? totalDone / totalAssigned : 0, comments: allScores.length,
               people: people.length, kept: kept.length, dropped: dropped.length },
      opts: o
    };
  }

  return { normText, faDigits, enDigits, tokensFa, tokensLat, simLatFa, simFaFa, canonicalMap, bestFaFor,
           sentiment, LEAN_LABEL,
           toJalali, parseJiraDate, scoreOf, cleanAnswer, SCORE_LABEL,
           parseStakeholders, parseJiraDoc, parseJiraHtml, compute, TAGS, TAG_ORDER, DEFAULTS,
           distribution, describe, histogram, quantile, BANDS, bandOf, SHAPE };
});
