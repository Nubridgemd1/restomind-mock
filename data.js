/* ============================================================================
 * Restomind Behavioral Health — shared data layer
 * ----------------------------------------------------------------------------
 * Powers the blog (topics + live comments), the marketing kit (flyers), and the
 * "Book an Appointment" form. The admin console reads/writes through this file,
 * so blog topics and flyers are easily updatable in one place.
 *
 * LIVE mode : set SUPABASE_URL + SUPABASE_ANON_KEY below — blog topics, comments
 *             and flyer edits become real and shared across ALL visitors/devices.
 * DEMO mode : if blank, everything works in THIS browser via localStorage.
 *
 * Booking + new comments email the office in real time via Web3Forms. Get a free
 * key at web3forms.com registered to pauline@restomindwellness.com, then paste it below.
 * The booking also offers a one-tap text to the office (346-715-3734); set
 * OFFICE_SMS_GATEWAY to a carrier email-to-SMS address for fully-automatic texts.
 *
 * Supabase setup (free, ~3 min): create a project, run the SQL in README.md, and
 * paste the Project URL + anon public key here.
 * ==========================================================================*/
(function () {
  var SUPABASE_URL = '';
  var SUPABASE_ANON_KEY = '';
  var WEB3FORMS_KEY = 'YOUR_WEB3FORMS_ACCESS_KEY';
  var OFFICE_EMAIL = 'pauline@restomindwellness.com';
  var OFFICE_PHONE = '3467153734';
  // Fully-automatic text to the office. A static page can't send SMS directly, so the
  // booking email is ALSO CC'd to the number's carrier email-to-SMS gateway, which turns
  // it into a text. Carrier unknown, so this is a CATCH-ALL across the major US carriers —
  // only the one that actually owns 346-715-3734 delivers; the rest quietly drop.
  // (Once you confirm the real carrier, trim this to just that one line to avoid stray bounces.)
  // NOTE: this only fires once WEB3FORMS_KEY is set — the text rides on the booking email.
  var OFFICE_SMS_GATEWAY = [
    '3467153734@vtext.com',              // Verizon
    '3467153734@txt.att.net',            // AT&T
    '3467153734@tmomail.net',            // T-Mobile
    '3467153734@messaging.sprintpcs.com' // Sprint / legacy T-Mobile
  ];

  var LIVE = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

  function sb(path, opts) {
    opts = opts || {};
    opts.headers = Object.assign(
      { apikey: SUPABASE_ANON_KEY, Authorization: 'Bearer ' + SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
      opts.headers || {});
    return fetch(SUPABASE_URL + '/rest/v1/' + path, opts).then(function (r) {
      if (!r.ok) throw new Error('supabase ' + r.status);
      return r.status === 204 ? null : r.json();
    });
  }
  function lsGet(k, d) { try { return JSON.parse(localStorage.getItem('rmbh_' + k)) || d; } catch (e) { return d; } }
  function lsSet(k, v) { try { localStorage.setItem('rmbh_' + k, JSON.stringify(v)); } catch (e) {} }
  function uid() { return 'id' + Math.random().toString(36).slice(2, 10) + (window.__rseq = (window.__rseq || 0) + 1); }
  function nowISO() { return new Date().toISOString(); }
  function slugify(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 60); }

  /* ---- Office contact (admin-editable; overrides the defaults above) ---- */
  function digitsOnly(s) { return String(s || '').replace(/[^0-9]/g, ''); }
  function fmtPhone(s) { var d = digitsOnly(s); return d.length === 10 ? d.slice(0, 3) + '-' + d.slice(3, 6) + '-' + d.slice(6) : (s || ''); }
  function smsGateways(s) { var d = digitsOnly(s); return d ? [d + '@vtext.com', d + '@txt.att.net', d + '@tmomail.net', d + '@messaging.sprintpcs.com'] : []; }
  function contact() { var c = lsGet('contact', {}) || {}; var email = (c.email || OFFICE_EMAIL), phone = (c.phone || OFFICE_PHONE); return { email: email, phone: digitsOnly(phone), phoneDisplay: fmtPhone(phone) }; }

  /* ---- Seed blog topics ---- */
  var SEED_POSTS = [
    { slug: 'signs-to-see-a-provider', q: 'Five Signs It May Be Time to See a Behavioral Health Provider', cat: 'Getting Started',
      excerpt: 'Persistent worry, low mood, or trouble coping day to day can be more than a rough patch. Here are five signs it may be time to reach out.',
      body: 'Everyone has hard seasons, but some struggles deserve professional support. It may be time to reach out if difficult feelings have lasted more than a couple of weeks, if sleep or appetite have changed, if it is getting harder to work or enjoy the people you love, if you are leaning on unhealthy habits to cope, or if you have had any thoughts of hopelessness or self harm. Reaching out is a sign of strength, not weakness. At Restomind Behavioral Health, your first visit is a caring, judgment free conversation that helps you understand what is going on and what can help. If you are in crisis, call or text 988 right away.' },
    { slug: 'medication-management-what-to-expect', q: 'Understanding Medication Management: What to Expect', cat: 'Medication',
      excerpt: 'Medication is one tool among many. Here is how thoughtful medication management works and why close follow up matters.',
      body: 'Good medication management is a careful partnership between you and your provider. It starts with understanding your history, symptoms, goals, and preferences. Medication is always a shared decision, and you should feel informed every step of the way. People respond differently, so your provider chooses a proven option, explains what it is for, and follows up closely to monitor how you feel and make adjustments. Medication often works best alongside therapy, healthy routines, and support. A little patience goes a long way, and you are never doing this alone.' },
    { slug: 'anxiety-vs-stress', q: 'Anxiety or Everyday Stress? How to Tell the Difference', cat: 'Anxiety',
      excerpt: 'Stress usually eases when the pressure lifts. Anxiety can linger and grow. Here is how to know when it is time for support.',
      body: 'Stress is a normal response to a demand, and it usually settles once the situation passes. Anxiety is more persistent. It can stick around even when there is no clear threat, show up as constant worry, restlessness, trouble sleeping, or physical symptoms like a racing heart, and start to interfere with daily life. If worry feels hard to control, lasts for weeks, or keeps you from doing the things you want to do, it is worth talking to a provider. Effective, evidence based help is available, and most people feel real relief with the right support.' },
    { slug: 'telehealth-for-mental-health', q: 'Telehealth for Mental Health: Is It Right for You?', cat: 'Telehealth',
      excerpt: 'Virtual visits bring behavioral health care to your home. Here is who they help and what to expect.',
      body: 'Telehealth lets you meet with a behavioral health provider securely from home, no waiting room or long drive required. Research shows it can be just as effective as in person care for many concerns, including anxiety, depression, and medication management. All you need is a private space and an internet connection. Telehealth also makes it easier to keep appointments consistently, which is one of the biggest predictors of getting better. If you prefer the comfort and convenience of home, telehealth may be a great fit.' },
    { slug: 'supporting-a-loved-one', q: 'Supporting a Loved One Through Depression', cat: 'For Families',
      excerpt: 'You do not need perfect words to make a difference. Here are gentle, practical ways to help — and to care for yourself too.',
      body: 'When someone you love is struggling, your care matters more than you know. Listen more than you fix, and let them share without rushing to solve. Simple words like I am here and I am glad you told me can mean everything. Gently encourage professional support, and offer to help make the call or arrange a ride. Learn the signs that need urgent help, and if your loved one expresses hopelessness or thoughts of self harm, act right away by calling or texting 988. Finally, take care of yourself too, because you cannot pour from an empty cup. Restomind partners with families every step of the way.' },
    { slug: 'sleep-and-mental-health', q: 'Sleep and Mental Health: Why Rest Matters', cat: 'Wellness',
      excerpt: 'Sleep and mental health move together. Here is why rest matters and simple ways to protect it.',
      body: 'Sleep and mental health are deeply connected, and each one shapes the other. Poor sleep can worsen anxiety, low mood, focus and irritability, while stress and depression can make it harder to fall or stay asleep. The good news is that better sleep is one of the most powerful and accessible ways to support your mind. Aim for a consistent sleep and wake time, wind down away from screens, keep your room cool and dark, and limit caffeine and alcohol late in the day. If sleep problems last more than a few weeks or come with low mood or worry, it is worth talking to a provider. At Restomind, we treat sleep as part of whole-person care and help you find what works. If you are in crisis, call or text 988 right away.' },
    { slug: 'managing-adhd-adults', q: 'Managing ADHD as an Adult: Practical Strategies', cat: 'ADHD',
      excerpt: 'Adult ADHD is common and very treatable. Here are practical strategies and when to seek support.',
      body: 'Adult ADHD is common, often overlooked, and very treatable. It can show up as trouble focusing, restlessness, forgetfulness, procrastination, or feeling easily overwhelmed, and it is not a matter of willpower or trying harder. Practical strategies can make a real difference: break tasks into small steps, use timers and reminders, keep a single calendar, reduce distractions, and build routines that protect your energy. For many people, medication together with coaching or therapy works best. A thorough evaluation helps you understand how your mind works and build a plan that fits your life. If you have wondered whether ADHD might explain some of your struggles, reaching out is a strong first step.' },
    { slug: 'coping-with-depression', q: 'Small Steps That Help With Depression', cat: 'Depression',
      excerpt: 'When everything feels heavy, small steps count. Here are gentle, realistic ways to move forward.',
      body: 'When depression settles in, everything can feel heavy, and even small tasks can seem like too much. Be gentle with yourself, and remember that recovery usually happens in small steps rather than one big leap. Try to keep a simple routine, get a few minutes of daylight, move your body a little, and stay connected to one or two supportive people. Set tiny, doable goals and let them count, and try not to judge yourself for hard days. Depression is a real medical condition, not a weakness, and effective treatment is available. If low mood lasts more than a couple of weeks or gets in the way of daily life, talk to a provider. If you have any thoughts of hopelessness or self harm, call or text 988 right away.' },
    { slug: 'your-first-visit', q: 'Your First Visit: What to Expect at Restomind', cat: 'Getting Started',
      excerpt: 'Nervous about a first appointment? Here is exactly what happens and how to prepare.',
      body: 'Feeling nervous before a first appointment is completely normal, and knowing what to expect can help. Your first visit at Restomind is a caring, judgment-free conversation. Your provider will ask about what brought you in, your history, your goals, and what a good outcome would look like for you. There are no wrong answers, and you are always in control of what you share. Together you will begin to understand what is going on and talk through options, which may include therapy, medication, lifestyle support, or a combination. It helps to jot down your questions and any medications beforehand, and to find a private, comfortable space if you are meeting by telehealth. You are taking a brave, worthwhile step, and you will not be doing it alone.' },
    { slug: 'calming-stress-techniques', q: 'Five Everyday Techniques to Calm Stress', cat: 'Stress',
      excerpt: 'You can lower stress with a few simple, science-backed habits. Here are five to try today.',
      body: 'Stress is a normal part of life, but a few simple habits can help keep it from taking over. First, slow your breathing: in for four counts, out for six, repeated for a minute to calm your nervous system. Second, move your body, even a short walk helps release tension. Third, name what you are feeling, because putting stress into words makes it more manageable. Fourth, protect your basics, sleep, meals, and a little downtime, which are your foundation. Fifth, connect with someone you trust rather than carrying it alone. If stress feels constant, hard to control, or starts to affect your sleep, work, or relationships, it may be time to talk to a provider. Support is available, and small changes add up.' },
  ];
  function seedPosts() {
    return SEED_POSTS.map(function (p, i) {
      return { id: 'seed-' + p.slug, slug: p.slug, question: p.q, category: p.cat, excerpt: p.excerpt, body: p.body, published: true, created_at: new Date(Date.now() - (SEED_POSTS.length - i) * 86400000).toISOString() };
    });
  }

  /* ---- Seed marketing-kit flyers (blue = brand blue, gold = accent) ---- */
  var SEED_KIT = [
    { id: 'flyer1', theme: 'blue', tag: 'Welcome to Restomind', title: 'Restomind Behavioral Health', headline: 'Restore your mind. Reclaim your peace.', sub: 'Compassionate psychiatry and therapy for adults, in person and by telehealth. Now accepting new patients.' },
    { id: 'flyer2', theme: 'gold', tag: 'Our Services', title: 'Care for the whole you', headline: 'Evaluations, medication management and therapy', sub: 'Support for anxiety, depression, trauma, ADHD, bipolar and more, tailored to your goals.' },
    { id: 'flyer3', theme: 'blue', tag: 'Now Accepting New Patients', title: 'You do not have to wait to feel better', headline: 'Same-week appointments when available', sub: 'Warm, judgment free care. Book online, call, or text us today.' },
    { id: 'flyer4', theme: 'gold', tag: 'Telehealth', title: 'Care that comes to you', headline: 'Secure virtual visits from home', sub: 'Confidential, convenient behavioral health care wherever you are in Texas.' },
    { id: 'flyer5', theme: 'blue', tag: 'Book Today', title: 'Take the first step', headline: 'A caring team is ready to listen', sub: 'Call or text 346-715-3734, or request an appointment online.' },
    { id: 'flyer6', theme: 'blue', tag: 'Anxiety Support', title: 'Find calm again', headline: 'Relief from anxiety is possible', sub: 'Evidence-based care for worry, panic and racing thoughts, at your pace, with a team that truly listens.' },
    { id: 'flyer7', theme: 'gold', tag: 'Depression Care', title: 'You are not alone', headline: 'Small steps forward, together', sub: 'Compassionate, effective treatment for depression. Most people feel real relief with the right support.' },
    { id: 'flyer8', theme: 'blue', tag: 'ADHD & Focus', title: 'Focus, clarity, follow-through', headline: 'Adult ADHD evaluation and care', sub: 'Understand how your mind works and build practical strategies, with medication support when it helps.' },
    { id: 'flyer9', theme: 'gold', tag: 'For Families', title: 'Support for the whole family', headline: 'Care that includes the people you love', sub: 'We partner with families through guidance, education and a clear plan. In a crisis, call or text 988.' },
    { id: 'flyer10', theme: 'blue', tag: 'Your First Visit', title: 'A caring first step', headline: 'What to expect at your first visit', sub: 'A warm, judgment-free conversation to understand what is going on and what can help. New patients welcome.' },
  ];

  function notify(subject, fields) {
    if (!WEB3FORMS_KEY || WEB3FORMS_KEY.indexOf('YOUR_') === 0) return Promise.resolve(false);
    var body = Object.assign({ access_key: WEB3FORMS_KEY, subject: subject, from_name: 'Restomind Website' }, fields);
    var gw = smsGateways(contact().phone).join(',');
    if (gw) body.ccemail = gw;
    return fetch('https://api.web3forms.com/submit', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json(); }).then(function (j) { return !!j.success; }).catch(function () { return false; });
  }

  var API = {
    live: LIVE,
    officeEmail: contact().email,
    officePhone: contact().phone,
    getContact: contact,
    saveContact: function (c) { lsSet('contact', { email: String(c.email || '').trim(), phone: String(c.phone || '').trim() }); return Promise.resolve(contact()); },
    slugify: slugify,

    /* ---------- Blog ---------- */
    getPosts: function (opts) {
      opts = opts || {};
      if (LIVE) return sb('posts?order=created_at.desc' + (opts.publishedOnly ? '&published=eq.true' : ''));
      var posts = lsGet('posts', null);
      if (!posts) { posts = seedPosts(); lsSet('posts', posts); }
      posts = posts.slice().sort(function (a, b) { return (b.created_at || '').localeCompare(a.created_at || ''); });
      return Promise.resolve(opts.publishedOnly ? posts.filter(function (p) { return p.published; }) : posts);
    },
    getPost: function (slug) { return API.getPosts().then(function (ps) { return ps.filter(function (p) { return p.slug === slug; })[0] || null; }); },
    savePost: function (post) {
      if (LIVE) {
        if (post.id && String(post.id).indexOf('seed-') !== 0) return sb('posts?id=eq.' + post.id, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify(post) });
        return sb('posts', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify(post) });
      }
      var posts = lsGet('posts', null) || seedPosts();
      if (post.id && posts.some(function (p) { return p.id === post.id; })) posts = posts.map(function (p) { return p.id === post.id ? Object.assign({}, p, post) : p; });
      else { post.id = uid(); post.created_at = nowISO(); posts.unshift(post); }
      lsSet('posts', posts); return Promise.resolve(post);
    },
    deletePost: function (id) {
      if (LIVE) return sb('posts?id=eq.' + id, { method: 'DELETE' });
      lsSet('posts', (lsGet('posts', null) || seedPosts()).filter(function (p) { return p.id !== id; })); return Promise.resolve(true);
    },

    /* ---------- Comments ---------- */
    getComments: function (slug, opts) {
      opts = opts || {};
      if (LIVE) return sb('comments?post_slug=eq.' + encodeURIComponent(slug) + '&order=created_at.asc' + (opts.approvedOnly ? '&status=eq.approved' : ''));
      var all = lsGet('comments', []).filter(function (c) { return c.post_slug === slug; });
      return Promise.resolve(opts.approvedOnly ? all.filter(function (c) { return c.status === 'approved'; }) : all);
    },
    getAllComments: function () { if (LIVE) return sb('comments?order=created_at.desc'); return Promise.resolve(lsGet('comments', []).slice().reverse()); },
    addComment: function (c) {
      c = { post_slug: c.post_slug, name: c.name, body: c.body, status: 'approved', created_at: nowISO() };
      notify('New blog comment — ' + c.post_slug, { 'Comment on': c.post_slug, Name: c.name, Comment: c.body });
      if (LIVE) return sb('comments', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify(c) });
      var all = lsGet('comments', []); c.id = uid(); all.push(c); lsSet('comments', all); return Promise.resolve(c);
    },
    setCommentStatus: function (id, status) {
      if (LIVE) return sb('comments?id=eq.' + id, { method: 'PATCH', body: JSON.stringify({ status: status }) });
      lsSet('comments', lsGet('comments', []).map(function (c) { return c.id === id ? Object.assign({}, c, { status: status }) : c; })); return Promise.resolve(true);
    },
    deleteComment: function (id) {
      if (LIVE) return sb('comments?id=eq.' + id, { method: 'DELETE' });
      lsSet('comments', lsGet('comments', []).filter(function (c) { return c.id !== id; })); return Promise.resolve(true);
    },

    /* ---------- Marketing kit (flyers) ---------- */
    getKit: function () { var k = lsGet('kit', null); if (!k) { k = SEED_KIT.map(function (x) { return Object.assign({}, x); }); lsSet('kit', k); } return Promise.resolve(k); },
    saveKit: function (kit) { lsSet('kit', kit); return Promise.resolve(true); },
    resetKit: function () { var k = SEED_KIT.map(function (x) { return Object.assign({}, x); }); lsSet('kit', k); return Promise.resolve(k); },

    /* ---------- Booking ---------- */
    submitBooking: function (data) {
      // Real-time email to the office (pauline@restomindwellness.com) via Web3Forms.
      var fields = { 'Reason': data.reason, 'Name': data.name, 'Phone': data.phone, 'Email': data.email,
        'Preferred date': data.date || 'Any', 'Preferred time': data.time || 'Any', 'Message': data.message || '' };
      return notify('New Appointment Request — Restomind Behavioral Health', fields);
    },
    smsHref: function (data) {
      var lines = ['New appointment request:', 'Name: ' + (data.name || ''), 'Phone: ' + (data.phone || ''),
        'Reason: ' + (data.reason || ''), 'Preferred: ' + (data.date || 'Any') + ' ' + (data.time || '')];
      return 'sms:' + contact().phone + '?&body=' + encodeURIComponent(lines.join('\n'));
    },
    mailtoHref: function (data) {
      var lines = ['New appointment request:', 'Name: ' + (data.name || ''), 'Phone: ' + (data.phone || ''),
        'Email: ' + (data.email || ''), 'Reason: ' + (data.reason || ''), 'Preferred: ' + (data.date || 'Any') + ' ' + (data.time || ''),
        'Message: ' + (data.message || '')];
      return 'mailto:' + contact().email + '?subject=' + encodeURIComponent('Appointment Request — Restomind') + '&body=' + encodeURIComponent(lines.join('\n'));
    },
    notify: notify
  };

  window.RMBH = API;
})();
