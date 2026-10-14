import { useState, useMemo, useRef, useEffect } from 'react';
import { useI18n } from './I18nContext.jsx';
import { SWAP_MATCHES, BLOCKED_DOMAINS, instructorProfiles } from './data2.js';

const html = (s) => ({ dangerouslySetInnerHTML: { __html: s } });

export function About({ go }) {
  const { t } = useI18n();
  const team = [['👩‍💼', 'rgba(245,166,35,0.15)'], ['👨‍💻', 'rgba(45,212,191,0.15)'], ['👩‍🎨', 'rgba(224,92,92,0.15)'], ['👨‍🏫', 'rgba(245,166,35,0.15)']];
  return (
    <>
      <div className="about-hero">
        <div className="about-hero-text">
          <div className="section-tag">{t('about_tag')}</div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(2.2rem,4vw,3.5rem)', fontWeight: 900, marginBottom: 20 }} {...html(t('about_h1'))} />
          <p style={{ color: 'var(--muted)', lineHeight: 1.8, maxWidth: 550, marginBottom: 28 }}>{t('about_sub')}</p>
          <button className="btn-primary" onClick={() => go('courses')}>{t('about_btn')}</button>
        </div>
        <div className="about-visual"><span className="av-emoji">🌍</span><div className="av-quote">{t('about_quote')}</div><div className="av-author">— B.B. King</div></div>
      </div>
      <section className="section">
        <div className="section-tag">{t('journey_tag')}</div><h2 className="section-title">{t('journey_title')}</h2>
        <div className="timeline" style={{ marginTop: 40 }}>
          {[2018, 2020, 2022, 2026].map((y, i) => (
            <div className="tl-item" key={y} style={i === 3 ? { paddingBottom: 0 } : null}>
              <div className="tl-dot" style={i === 3 ? { background: 'var(--teal)' } : null} />
              <div className="tl-year">{y}</div><div className="tl-title">{t(`tl${i + 1}t`)}</div><div className="tl-desc">{t(`tl${i + 1}d`)}</div>
            </div>
          ))}
        </div>
      </section>
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="section-tag">{t('team_tag')}</div><h2 className="section-title">{t('team_title')}</h2>
        <div className="team-grid" style={{ marginTop: 32 }}>
          {team.map(([e, bg], i) => <div className="team-card" key={i}><div className="team-avatar" style={{ background: bg }}>{e}</div><div className="team-name">{t('n' + (i + 1))}</div><div className="team-role">{t('r' + (i + 1))}</div></div>)}
        </div>
      </section>
      <footer><div className="footer-bottom" style={{ border: 'none', padding: '20px 0 0' }}><div className="footer-copy">© 2026 Skill Swapping Inc.</div></div></footer>
    </>
  );
}

function RoleSelect({ value, onChange }) {
  const { t } = useI18n();
  return (
    <div className="role-select-wrap">
      <div className="role-label">{t('reg_acct')}</div>
      <div className="role-options">
        {[['learner', '📚'], ['teacher', '🎓']].map(([r, ic]) => (
          <div key={r} role="button" tabIndex={0} className={`role-option ${value === r ? 'active' : ''}`} onClick={() => onChange(r)}
               onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onChange(r)}>
            <span className="role-icon">{ic}</span><span className="role-title">{t(`role_${r}_title`)}</span><span className="role-desc">{t(`role_${r}_desc`)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Login helpers ──────────────────────────────────────────────────────────
// Validators return a translation KEY ('' = valid) so messages follow the active language.
const EMAIL_RE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[^\s@.]{2,}$/;
const validateEmail = (v) => (!v.trim() ? 'err_email_required' : EMAIL_RE.test(v.trim()) ? '' : 'err_email_invalid');
const validatePass = (v) => (v ? '' : 'err_pass_required'); // not trimmed: passwords may contain spaces
const VALIDATORS = { email: validateEmail, pass: validatePass };

// Existing authentication logic, unchanged in behaviour (the app has no backend yet): the user is
// derived from the email. To plug in a real API, replace the body and throw on failure with
// `status` 401/403 (or code 'invalid_credentials') for bad credentials; fetch network failures
// (TypeError) and any other error are handled by errorKey() below.
async function defaultAuthenticate({ email, role }) {
  return { name: email.split('@')[0], email, role };
}
const errorKey = (e) => {
  if (e?.code === 'invalid_credentials' || e?.status === 401 || e?.status === 403) return 'err_creds';
  if (e?.code === 'network' || e instanceof TypeError || (typeof navigator !== 'undefined' && navigator.onLine === false)) return 'err_network';
  return 'err_server';
};

function EyeIcon({ off }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" />
      {off && <line x1="3" y1="3" x2="21" y2="21" />}
    </svg>
  );
}

export function Login({ go, toast, setUser, authenticate = defaultAuthenticate }) {
  const { t } = useI18n();
  const [role, setRole] = useState('learner');
  const [f, setF] = useState({ email: '', pass: '' });
  const [errs, setErrs] = useState({});        // per-field error keys
  const [formErr, setFormErr] = useState('');  // credentials / server / network error key
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const refs = { email: useRef(null), pass: useRef(null) };
  const busy = useRef(false), alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  const change = (k) => (e) => {
    const v = e.target.value;
    setF(s => ({ ...s, [k]: v }));
    setFormErr('');
    if (errs[k]) setErrs(s => ({ ...s, [k]: VALIDATORS[k](v) })); // re-check a flagged field as it is corrected
  };

  const submit = async (e) => {
    e.preventDefault();
    if (busy.current) return;
    const next = { email: validateEmail(f.email), pass: validatePass(f.pass) };
    setErrs(next); setFormErr('');
    const bad = ['email', 'pass'].find(k => next[k]);
    if (bad) return refs[bad].current?.focus();
    busy.current = true; setLoading(true);
    try {
      const user = await authenticate({ email: f.email.trim(), password: f.pass, role });
      if (!alive.current) return;
      setUser(user); toast(t('toast_login_success')); go('courses');
    } catch (err) {
      if (!alive.current) return;
      const key = errorKey(err);
      setFormErr(key);
      if (key === 'err_creds') refs.pass.current?.focus();
    } finally {
      busy.current = false;
      if (alive.current) setLoading(false);
    }
  };

  const fieldErr = (k) => errs[k] && <div id={`login-${k}-err`} className="email-error show" role="alert">⚠️ {t(errs[k])}</div>;
  return (
    <div className="auth-page">
      <div className="auth-left"><form className="auth-form" onSubmit={submit} noValidate>
        <div className="form-title">{t('login_title')}</div><div className="form-sub">{t('login_sub')}</div>
        <RoleSelect value={role} onChange={setRole} />
        <div className="form-group"><label className="form-label" htmlFor="login-email">{t('login_email')}</label>
          <input id="login-email" ref={refs.email} className={`form-input ${errs.email ? 'invalid' : ''}`} type="email" name="email" autoComplete="email" inputMode="email"
            value={f.email} onChange={change('email')} placeholder="name@email.com" readOnly={loading}
            aria-invalid={!!errs.email} aria-describedby={errs.email ? 'login-email-err' : undefined} />
          {fieldErr('email')}</div>
        <div className="form-group"><label className="form-label" htmlFor="login-pass">{t('login_pass')}</label>
          <div className="pw-wrap">
            <input id="login-pass" ref={refs.pass} className={`form-input has-toggle ${errs.pass ? 'invalid' : ''}`} type={showPw ? 'text' : 'password'} name="password" autoComplete="current-password"
              autoCapitalize="off" autoCorrect="off" spellCheck={false}
              value={f.pass} onChange={change('pass')} placeholder={t('login_pass_ph')} readOnly={loading}
              aria-invalid={!!errs.pass} aria-describedby={errs.pass ? 'login-pass-err' : undefined} />
            <button type="button" className="pw-toggle" aria-label={t(showPw ? 'pw_hide' : 'pw_show')} aria-controls="login-pass"
              onMouseDown={e => e.preventDefault()} onClick={() => setShowPw(v => !v)}><EyeIcon off={showPw} /></button>
          </div>
          {fieldErr('pass')}</div>
        <div className="form-check"><label className="check-label"><input type="checkbox" /> <span>{t('login_remember')}</span></label><a className="forgot-link">{t('login_forgot')}</a></div>
        {formErr && <div className="email-error show login-form-error" role="alert">⚠️ {t(formErr)}</div>}
        <button className="btn-full" type="submit" disabled={loading} aria-busy={loading}>
          {loading ? <><span className="btn-spinner" aria-hidden="true" />{t('login_loading')}</> : t('login_btn')}</button>
        <div className="auth-switch"><span>{t('login_switch')}</span> <a onClick={() => go('register')}>{t('login_link')}</a></div>
      </form></div>
      <div className="auth-right"><div className="auth-illustration">🎓</div><div className="auth-right-title">{t('login_right_title')}</div><div className="auth-right-sub">{t('login_right_sub')}</div></div>
    </div>
  );
}

const SPECS = ['💻 Web Development', '🐍 Python Programming', '📊 Data Science', '🤖 Machine Learning', '🎨 UI/UX Design', '🔒 Cybersecurity', '📱 Mobile Development', '⚙️ DevOps'];
const isUni = (e) => {
  if (!e.includes('@')) return false;
  const d = e.split('@')[1].toLowerCase();
  if (!d.includes('.') || BLOCKED_DOMAINS.includes(d)) return false;
  return [/\.edu$/, /\.edu\.\w+$/, /\.ac\.\w+$/, /uni\./, /university/, /college/].some(p => p.test(d));
};

export function Register({ go, toast, setUser, startExam }) {
  const { t } = useI18n();
  const [role, setRole] = useState('learner');
  const [emailType, setEmailType] = useState('university');
  const [f, setF] = useState({ fname: '', lname: '', email: '', phone: '', pass: '', bio: '', spec: '' });
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [err, setErr] = useState('');
  const [photo, setPhoto] = useState('');
  const set = (k) => (e) => { setF({ ...f, [k]: e.target.value }); if (k === 'email') setErr(''); };
  const strength = useMemo(() => {
    const p = f.pass; let s = 0;
    if (p.length >= 8) s++; if (/[A-Z]/.test(p)) s++; if (/\d/.test(p)) s++; if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  }, [f.pass]);
  const addSkill = (e) => {
    if (e.key !== 'Enter') return; e.preventDefault();
    const v = skillInput.trim();
    if (v && !skills.includes(v)) setSkills([...skills, v]);
    setSkillInput('');
  };
  const submit = () => {
    const email = f.email.trim();
    if (!f.fname.trim() || !email || !f.phone.trim()) return toast(t('toast_fill_fields'));
    if (role === 'teacher' && emailType === 'university') { if (!isUni(email)) return setErr(t('err_uni')); }
    else if (!email.includes('@') || !email.includes('.')) return setErr(t('err_email'));
    const name = `${f.fname} ${f.lname}`.trim();
    if (role === 'teacher') {
      if (!f.bio.trim() || !f.spec) return toast(t('toast_fill_fields'));
      instructorProfiles[name] = { avatar: '👤', bio_ar: f.bio, bio_en: f.bio, skills: [f.spec] };
      setUser({ name, email, role, skill: f.spec }); toast(t('toast_registered'));
      setTimeout(() => startExam(f.spec), 700);
    } else {
      setUser({ name, email, role, skills }); toast(t('toast_registered')); setTimeout(() => go('login'), 700);
    }
  };
  const teacher = role === 'teacher';
  return (
    <div className="auth-page">
      <div className="auth-left"><div className="auth-form">
        <div className="form-title">{t('reg_title')}</div><div className="form-sub">{t('reg_sub')}</div>
        <RoleSelect value={role} onChange={setRole} />
        <div className="form-row">
          <div className="form-group"><label className="form-label">{t('reg_fname')}</label><input className="form-input" value={f.fname} onChange={set('fname')} /></div>
          <div className="form-group"><label className="form-label">{t('reg_lname')}</label><input className="form-input" value={f.lname} onChange={set('lname')} /></div>
        </div>
        <div className="form-group">
          <label className="form-label">{t('reg_email')}</label>
          {teacher && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                {['university', 'regular'].map(k => (
                  <button key={k} type="button" onClick={() => { setEmailType(k); setErr(''); }}
                    style={{ flex: 1, padding: 9, borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                      border: `1.5px solid ${emailType === k ? 'var(--accent)' : 'var(--border)'}`,
                      background: emailType === k ? 'rgba(245,166,35,0.1)' : 'var(--surface2)', color: emailType === k ? 'var(--accent)' : 'var(--muted)' }}>
                    {t(k === 'university' ? 'email_uni' : 'email_reg')}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 6 }}>{t(emailType === 'university' ? 'email_hint_uni' : 'email_hint_reg')}</div>
            </div>
          )}
          <input className="form-input" type="email" value={f.email} onChange={set('email')} placeholder="name@university.edu" />
          <div className="email-error" style={{ display: err ? 'block' : 'none' }}>{err}</div>
        </div>
        <div className="form-group"><label className="form-label">{t('reg_phone')}</label><input className="form-input" type="tel" value={f.phone} onChange={set('phone')} placeholder="+20 1x xxxx xxxx" /></div>
        <div className="form-group"><label className="form-label">{t('reg_pass')}</label>
          <input className="form-input" type="password" value={f.pass} onChange={set('pass')} placeholder={t('reg_pass_ph')} />
          <div className="strength-bar"><div className="strength-fill" style={{ width: `${strength * 25}%`, background: ['var(--border)', 'var(--accent2)', 'var(--accent)', 'var(--teal)', 'var(--success)'][strength] }} /></div>
          <div className="form-hint">{t('reg_hint2')}</div></div>
        {!teacher ? (
          <div className="form-group"><label className="form-label">{t('reg_learn_skills')}</label>
            <div className="tags-input-wrap">
              {skills.map(s => <span className="skill-tag" key={s}>{s}<button type="button" onClick={() => setSkills(skills.filter(x => x !== s))}>×</button></span>)}
              <input className="tags-input" value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={addSkill} placeholder={t('reg_skill_ph')} />
            </div></div>
        ) : (
          <>
            <div className="form-group"><label className="form-label">{t('reg_spec')}</label>
              <select className="form-input" value={f.spec} onChange={set('spec')}>
                <option value="">{t('reg_spec_sel')}</option>
                {SPECS.map(s => <option key={s} value={s.replace(/^\S+\s/, '')}>{s}</option>)}
              </select></div>
            <div className="form-group"><label className="form-label">{t('reg_bio')}</label><textarea className="form-input" rows={3} value={f.bio} onChange={set('bio')} placeholder={t('reg_bio_ph')} /></div>
            <div className="form-group"><label className="form-label">{t('reg_photo')}</label>
              <label className="img-upload-wrap">
                {photo && <img className="img-preview" style={{ display: 'block' }} src={photo} alt="" />}
                <div className="img-upload-icon">📷</div>
                <div className="img-upload-text"><span>{t('reg_photo_pick')}</span></div>
                <input type="file" accept="image/*" onChange={e => { const file = e.target.files[0]; if (file) setPhoto(URL.createObjectURL(file)); }} />
              </label></div>
          </>
        )}
        <div className="terms-text">{t('reg_terms')}</div>
        <button className="btn-full" onClick={submit}>{t('reg_btn')}</button>
        <div className="auth-switch"><span>{t('reg_switch')}</span> <a onClick={() => go('login')}>{t('reg_link')}</a></div>
      </div></div>
      <div className="auth-right"><div className="auth-illustration">🚀</div><div className="auth-right-title">{t('reg_right_title')}</div><div className="auth-right-sub">{t('reg_right_sub')}</div></div>
    </div>
  );
}

export function Profile({ user }) {
  const { t } = useI18n();
  const name = user?.name || 'Nour Ibrahim';
  const teach = user?.skill ? [user.skill] : ['Python', 'TensorFlow', 'Machine Learning'];
  const learn = user?.skills?.length ? user.skills : ['React', 'UI/UX Design'];
  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-avatar-wrap"><div className="profile-avatar">👩‍💻</div>
          <div className="profile-badges"><span className="badge badge-teacher">{t('p_teacher')}</span><span className="badge badge-verified">{t('p_verified')}</span></div></div>
        <div className="profile-info"><div className="profile-name">{name}</div><div className="profile-joined">{t('p_since')}</div><p className="profile-bio">{t('p_bio')}</p></div>
      </div>
      <div className="profile-grid">
        <div className="profile-card"><div className="profile-card-title">{t('p_teach')}</div><div className="skill-pills">{teach.map(s => <span key={s} className="skill-pill teaching">{s}</span>)}</div></div>
        <div className="profile-card"><div className="profile-card-title">{t('p_learn')}</div><div className="skill-pills">{learn.map(s => <span key={s} className="skill-pill learning">{s}</span>)}</div></div>
      </div>
      <div className="profile-card" style={{ marginBottom: 24 }}><div className="profile-card-title">{t('p_portfolio')}</div>
        <div className="portfolio-grid">{[['🤖', 'AI Dashboard'], ['📊', 'Data Viz'], ['⚙️', 'ML Pipeline']].map(([e, l]) => <div className="portfolio-item" key={l}>{e}<div className="portfolio-item-label">{l}</div></div>)}</div></div>
      <div className="profile-card"><div className="profile-card-title">{t('p_reviews')}</div>
        <div style={{ marginTop: 16 }}>
          {[['👨‍🎓', 'Ahmed Mostafa', 'rev1'], ['👩‍🎓', 'Sara Ali', 'rev2']].map(([e, n, k]) => (
            <div className="review-card" key={n}><div className="review-header"><div className="reviewer-avatar">{e}</div><div><div className="reviewer-name">{n}</div></div></div>
              <div className="review-stars">★★★★★</div><p className="review-text">{t(k)}</p></div>
          ))}
        </div></div>
    </div>
  );
}

function Booking({ toast, onClose }) {
  const { t, lang } = useI18n();
  const [day, setDay] = useState(null), [time, setTime] = useState(null);
  const today = new Date(), y = today.getFullYear(), m = today.getMonth();
  const first = new Date(y, m, 1).getDay(), count = new Date(y, m + 1, 0).getDate();
  const wd = [...Array(7)].map((_, i) => new Intl.DateTimeFormat(lang, { weekday: 'short' }).format(new Date(2023, 0, 1 + i)));
  const slot = (h) => new Intl.DateTimeFormat(lang, { hour: '2-digit', minute: '2-digit' }).format(new Date(2023, 0, 1, h));
  const confirm = () => {
    if (!day || time === null) return toast(t('book_pick'));
    toast(`${t('booked')} — ${day} ${slot(time)}`); onClose();
  };
  return (
    <div className="booking-card">
      <div className="booking-title">{t('book_title')}</div>
      <div style={{ marginBottom: 16, fontSize: '0.9rem', color: 'var(--muted)' }}>{t('book_sub')}</div>
      <div className="calendar-grid">
        {wd.map((d, i) => <div className="cal-header" key={i}>{d}</div>)}
        {[...Array(first)].map((_, i) => <div key={'e' + i} className="cal-day empty" />)}
        {[...Array(count)].map((_, i) => { const d = i + 1, past = d < today.getDate();
          return <div key={d} role={past ? undefined : 'button'} tabIndex={past ? undefined : 0}
            className={`cal-day ${d === today.getDate() ? 'today' : ''} ${past ? '' : 'available'} ${day === d ? 'selected' : ''}`}
            onClick={() => !past && setDay(d)}>{d}</div>; })}
      </div>
      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--muted)', marginBottom: 10 }}>{t('book_times')}</div>
      <div className="booking-times">{[9, 11, 14, 16, 19].map(h => <button key={h} className={`time-slot ${time === h ? 'selected' : ''}`} onClick={() => setTime(h)}>{slot(h)}</button>)}</div>
      <button className="booking-confirm-btn" onClick={confirm}>{t('book_confirm')}</button>
    </div>
  );
}

export function Swap({ go, toast }) {
  const { t } = useI18n();
  const [sent, setSent] = useState(new Set());
  const [reqStatus, setReqStatus] = useState('pending');
  const [booking, setBooking] = useState(false);
  const send = (n) => { setSent(new Set(sent).add(n)); toast(`${t('sent_toast')} ${n}`); };
  const badge = { pending: 'status-pending', accepted: 'status-accepted', rejected: 'status-rejected' };
  return (
    <div className="swap-page">
      <div className="swap-page-title">{t('swap_title')}</div><p className="swap-page-sub">{t('swap_sub')}</p>
      <div className="section-tag" style={{ marginBottom: 16 }}>{t('swap_best')}</div>
      <div className="swap-grid">
        {SWAP_MATCHES.map(m => (
          <div className="skill-match-card" key={m.name}>
            <div className="smc-header"><div className="smc-avatar">{m.avatar}</div><div className="smc-meta"><div className="smc-name">{m.name}</div>
              <div className="smc-role-badges"><span className="badge badge-teacher">{t('teaches')}: {m.teach}</span><span className="badge badge-learner">{t('learns')}: {m.learn}</span></div></div></div>
            <div className="smc-skills"><div className="smc-skills-label">{t('avail')}</div><div className="smc-tags">{m.tags.map(x => <span className="smc-tag" key={x}>{x}</span>)}</div></div>
            <div className="smc-match-score"><div className="match-score-bar"><div className="match-score-fill" style={{ width: m.pct + '%' }} /></div><span className="match-score-pct">{m.pct}% {t('match')}</span></div>
            <div className="smc-footer">
              <button className="send-request-btn" disabled={sent.has(m.name)} onClick={() => send(m.name)}>{sent.has(m.name) ? t('sent') : t('send_req')}</button>
              <button className="view-profile-btn" onClick={() => go('profile')}>{t('view_profile')}</button>
            </div>
          </div>
        ))}
      </div>
      <div className="requests-section"><div className="requests-section-title">{t('incoming')}</div>
        <div className="request-card"><div className="request-avatar">👨‍🎓</div>
          <div className="request-info"><div className="request-name">Ahmed Mostafa</div><div className="request-skills">{t('wants')}: Python · {t('offers')}: JavaScript</div></div>
          <span className={`request-status ${badge[reqStatus]}`}>{t(reqStatus)}</span>
          {reqStatus === 'pending' && <div className="request-actions">
            <button className="req-action-btn accept" onClick={() => setReqStatus('accepted')}>{t('accept')}</button>
            <button className="req-action-btn reject" onClick={() => setReqStatus('rejected')}>{t('reject')}</button></div>}
          {reqStatus === 'accepted' && <div className="request-actions"><button className="req-action-btn" onClick={() => setBooking(true)}>{t('book')}</button></div>}
        </div>
        <div className="request-card"><div className="request-avatar">👩‍🎓</div>
          <div className="request-info"><div className="request-name">Mera Amel</div><div className="request-skills">{t('wants')}: TensorFlow · {t('offers')}: Figma</div></div>
          <span className="request-status status-accepted">{t('accepted')}</span>
          <div className="request-actions"><button className="req-action-btn" onClick={() => setBooking(true)}>{t('book')}</button></div></div>
      </div>
      {booking && <Booking toast={toast} onClose={() => setBooking(false)} />}
    </div>
  );
}
