import { useState } from 'react';
import { useAuth } from '../ctx';
import { DEPTS, Field } from '../ui';

export default function Login() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [f, setF] = useState({ name: '', email: '', password: '', confirm: '', rollNo: '', department: 'CSE', academicYear: 1 });
  const [err, setErr] = useState({});
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const reg = mode === 'register';

  const submit = async (e) => {
    e.preventDefault();
    const er = {};
    if (!/^\S+@\S+\.\S+$/.test(f.email)) er.email = 'Enter a valid email address';
    if (!f.password) er.password = 'Password is required';
    else if (reg && f.password.length < 6) er.password = 'Use at least 6 characters';
    if (reg && f.name.trim().length < 3) er.name = 'Enter your full name (3+ letters)';
    if (reg && f.confirm !== f.password) er.confirm = 'Passwords do not match';
    setErr(er); setMsg('');
    if (Object.keys(er).length) return;
    setBusy(true);
    try {
      if (reg) await register({ name: f.name, email: f.email, password: f.password, rollNo: f.rollNo, department: f.department, academicYear: +f.academicYear });
      else await login(f.email, f.password);
    } catch (x) { setMsg(x.message); }
    setBusy(false);
  };

  const demo = (email, password) => setF({ ...f, email, password });

  return (
    <div className="login-page">
      <div className="login-hero">
        <h1>One place for every course you take or teach.</h1>
        <p>Browse the catalogue, enrol in seconds, and keep marks and attendance in view.</p>
      </div>
      <form className="login-card" onSubmit={submit} noValidate>
        <div className="tabs">
          <button type="button" className={!reg ? 'on' : ''} onClick={() => { setMode('login'); setErr({}); setMsg(''); }}>Log in</button>
          <button type="button" className={reg ? 'on' : ''} onClick={() => { setMode('register'); setErr({}); setMsg(''); }}>Student sign-up</button>
        </div>
        {reg && <Field label="Full name" error={err.name}><input value={f.name} onChange={set('name')} /></Field>}
        <Field label="Email" error={err.email}><input type="email" value={f.email} onChange={set('email')} /></Field>
        <Field label="Password" error={err.password}><input type="password" value={f.password} onChange={set('password')} /></Field>
        {reg && (
          <>
            <Field label="Confirm password" error={err.confirm}><input type="password" value={f.confirm} onChange={set('confirm')} /></Field>
            <div className="row2">
              <Field label="Roll number"><input value={f.rollNo} onChange={set('rollNo')} /></Field>
              <Field label="Year"><select value={f.academicYear} onChange={set('academicYear')}>{[1, 2, 3, 4].map((y) => <option key={y}>{y}</option>)}</select></Field>
            </div>
            <Field label="Department"><select value={f.department} onChange={set('department')}>{DEPTS.map((d) => <option key={d}>{d}</option>)}</select></Field>
          </>
        )}
        {msg && <div className="alert bad">{msg}</div>}
        <button className="btn primary wide" disabled={busy}>{busy ? 'Please wait…' : reg ? 'Create account' : 'Log in'}</button>
        {!reg && (
          <div className="demo">
            <span>Try a demo account:</span>
            <button type="button" onClick={() => demo('admin@college.edu', 'admin123')}>Admin</button>
            <button type="button" onClick={() => demo('rahul@student.edu', 'student123')}>Student</button>
          </div>
        )}
      </form>
    </div>
  );
}
