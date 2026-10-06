import { useEffect, useState } from 'react';
import { api } from '../api';
import { useToast } from '../ctx';
import { DEPTS, Empty, Field, Modal } from '../ui';

const blank = { name: '', email: '', password: '', rollNo: '', department: 'CSE', academicYear: 1 };

export default function Students() {
  const [list, setList] = useState([]);
  const [q, setQ] = useState('');
  const [form, setForm] = useState(null);
  const [err, setErr] = useState({});
  const toast = useToast();
  const load = () => api('/students').then(setList);
  useEffect(() => { load(); }, []);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    const er = {};
    if (form.name.trim().length < 3) er.name = 'Name must be at least 3 characters';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) er.email = 'Enter a valid email address';
    if (!form.id && form.password.length < 6) er.password = 'Password must be at least 6 characters';
    if (form.id && form.password && form.password.length < 6) er.password = 'Use at least 6 characters or leave blank';
    setErr(er);
    if (Object.keys(er).length) return;
    try {
      const body = { ...form, academicYear: +form.academicYear };
      if (form.id) await api('/students/' + form.id, 'PUT', body); else await api('/students', 'POST', body);
      toast(form.id ? 'Student updated' : 'Student added');
      setForm(null); load();
    } catch (x) { toast(x.message, 'bad'); }
  };
  const del = async (s) => {
    if (!confirm(`Delete ${s.name}? Their enrolments will be removed too.`)) return;
    try { await api('/students/' + s.id, 'DELETE'); toast('Student deleted'); load(); } catch (x) { toast(x.message, 'bad'); }
  };
  const rows = list.filter((s) => (s.name + s.rollNo + s.email + s.department).toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <h1>Students</h1>
      <p className="sub">Manage student accounts. New students can also sign up themselves.</p>
      <div className="toolbar">
        <input placeholder="Search by name, roll number or email" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn primary" onClick={() => { setErr({}); setForm({ ...blank }); }}>Add student</button>
      </div>
      {rows.length === 0 ? <Empty text="No students found." /> : (
        <div className="table-wrap card"><table>
          <thead><tr><th>Roll no.</th><th>Name</th><th>Email</th><th>Dept</th><th>Year</th><th>Courses</th><th></th></tr></thead>
          <tbody>{rows.map((s) => (
            <tr key={s.id}>
              <td><b>{s.rollNo || '–'}</b></td><td>{s.name}</td><td>{s.email}</td><td>{s.department}</td><td>{s.academicYear}</td><td>{s.enrolled}</td>
              <td className="actions">
                <button className="btn" onClick={() => { setErr({}); setForm({ ...s, password: '' }); }}>Edit</button>
                <button className="btn danger" onClick={() => del(s)}>Delete</button>
              </td>
            </tr>
          ))}</tbody>
        </table></div>
      )}
      {form && (
        <Modal title={form.id ? 'Edit student' : 'Add student'} onClose={() => setForm(null)}>
          <form onSubmit={save} noValidate>
            <Field label="Full name" error={err.name}><input value={form.name} onChange={set('name')} /></Field>
            <Field label="Email" error={err.email}><input type="email" value={form.email} onChange={set('email')} /></Field>
            <Field label={form.id ? 'New password (optional)' : 'Password'} error={err.password}><input type="password" value={form.password} onChange={set('password')} /></Field>
            <div className="row2">
              <Field label="Roll number"><input value={form.rollNo} onChange={set('rollNo')} /></Field>
              <Field label="Year"><select value={form.academicYear} onChange={set('academicYear')}>{[1, 2, 3, 4].map((y) => <option key={y}>{y}</option>)}</select></Field>
            </div>
            <Field label="Department"><select value={form.department} onChange={set('department')}>{DEPTS.map((d) => <option key={d}>{d}</option>)}</select></Field>
            <button className="btn primary wide">{form.id ? 'Save changes' : 'Add student'}</button>
          </form>
        </Modal>
      )}
    </>
  );
}
