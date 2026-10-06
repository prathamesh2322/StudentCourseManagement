import { useEffect, useState } from 'react';
import { api } from '../api';
import { useToast } from '../ctx';
import { DEPTS, Empty, Field, Modal } from '../ui';

const blank = { code: '', title: '', department: 'CSE', credits: 3, instructor: '', capacity: 60, description: '' };

function useCourses() {
  const [list, setList] = useState([]);
  const load = () => api('/courses').then(setList);
  useEffect(() => { load(); }, []);
  return [list, load];
}
const match = (c, q, dept) => (!dept || c.department === dept) && (c.code + c.title + c.instructor).toLowerCase().includes(q.toLowerCase());

function Filters({ q, setQ, dept, setDept, children }) {
  return (
    <div className="toolbar">
      <input placeholder="Search by code, title or instructor" value={q} onChange={(e) => setQ(e.target.value)} />
      <select value={dept} onChange={(e) => setDept(e.target.value)}>
        <option value="">All departments</option>{DEPTS.map((d) => <option key={d}>{d}</option>)}
      </select>
      {children}
    </div>
  );
}

export function AdminCourses() {
  const [list, load] = useCourses();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [dept, setDept] = useState('');
  const [form, setForm] = useState(null);
  const [err, setErr] = useState({});
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    const er = {};
    if (!form.code.trim()) er.code = 'Course code is required';
    if (form.title.trim().length < 3) er.title = 'Title must be at least 3 characters';
    if (!(+form.capacity >= 1)) er.capacity = 'Capacity must be at least 1';
    setErr(er);
    if (Object.keys(er).length) return;
    try {
      const body = { ...form, credits: +form.credits, capacity: +form.capacity };
      if (form.id) await api('/courses/' + form.id, 'PUT', body); else await api('/courses', 'POST', body);
      toast(form.id ? 'Course updated' : 'Course added');
      setForm(null); load();
    } catch (x) { toast(x.message, 'bad'); }
  };
  const del = async (c) => {
    if (!confirm(`Delete ${c.code}? Its enrolments will be removed too.`)) return;
    try { await api('/courses/' + c.id, 'DELETE'); toast('Course deleted'); load(); } catch (x) { toast(x.message, 'bad'); }
  };
  const rows = list.filter((c) => match(c, q, dept));

  return (
    <>
      <h1>Courses</h1>
      <p className="sub">Add, edit and remove the courses offered this term.</p>
      <Filters q={q} setQ={setQ} dept={dept} setDept={setDept}>
        <button className="btn primary" onClick={() => { setErr({}); setForm({ ...blank }); }}>Add course</button>
      </Filters>
      {rows.length === 0 ? <Empty text="No courses match your search." /> : (
        <div className="table-wrap card"><table>
          <thead><tr><th>Code</th><th>Title</th><th>Dept</th><th>Credits</th><th>Instructor</th><th>Seats</th><th></th></tr></thead>
          <tbody>{rows.map((c) => (
            <tr key={c.id}>
              <td><b>{c.code}</b></td><td>{c.title}</td><td>{c.department}</td><td>{c.credits}</td><td>{c.instructor}</td>
              <td><span className={'badge ' + (c.enrolled >= c.capacity ? 'bad' : 'ok')}>{c.enrolled} / {c.capacity}</span></td>
              <td className="actions">
                <button className="btn" onClick={() => { setErr({}); setForm({ ...c }); }}>Edit</button>
                <button className="btn danger" onClick={() => del(c)}>Delete</button>
              </td>
            </tr>
          ))}</tbody>
        </table></div>
      )}
      {form && (
        <Modal title={form.id ? 'Edit course' : 'Add course'} onClose={() => setForm(null)}>
          <form onSubmit={save} noValidate>
            <div className="row2">
              <Field label="Course code" error={err.code}><input value={form.code} onChange={set('code')} /></Field>
              <Field label="Department"><select value={form.department} onChange={set('department')}>{DEPTS.map((d) => <option key={d}>{d}</option>)}</select></Field>
            </div>
            <Field label="Title" error={err.title}><input value={form.title} onChange={set('title')} /></Field>
            <Field label="Instructor"><input value={form.instructor} onChange={set('instructor')} /></Field>
            <div className="row2">
              <Field label="Credits"><select value={form.credits} onChange={set('credits')}>{[1, 2, 3, 4, 5, 6].map((n) => <option key={n}>{n}</option>)}</select></Field>
              <Field label="Seats" error={err.capacity}><input type="number" value={form.capacity} onChange={set('capacity')} /></Field>
            </div>
            <Field label="Description"><textarea rows="3" value={form.description} onChange={set('description')} /></Field>
            <button className="btn primary wide">{form.id ? 'Save changes' : 'Add course'}</button>
          </form>
        </Modal>
      )}
    </>
  );
}

export function Catalog() {
  const [list, load] = useCourses();
  const [mine, setMine] = useState([]);
  const [q, setQ] = useState('');
  const [dept, setDept] = useState('');
  const toast = useToast();
  const loadMine = () => api('/enrollments/my').then(setMine);
  useEffect(() => { loadMine(); }, []);
  const ids = new Set(mine.map((m) => m.courseId));

  const enroll = async (c) => {
    try { await api('/enrollments/' + c.id, 'POST'); toast(`Enrolled in ${c.code}`); load(); loadMine(); }
    catch (x) { toast(x.message, 'bad'); }
  };
  const rows = list.filter((c) => match(c, q, dept));

  return (
    <>
      <h1>Browse courses</h1>
      <p className="sub">Pick a course and enrol. Seats update instantly.</p>
      <Filters q={q} setQ={setQ} dept={dept} setDept={setDept} />
      {rows.length === 0 ? <Empty text="No courses match your search." /> : (
        <div className="cards">
          {rows.map((c) => {
            const left = c.capacity - c.enrolled;
            const joined = ids.has(c.id);
            return (
              <article className="card course-card" key={c.id}>
                <div className="cc-top"><span className="code">{c.code}</span><span className="badge muted-b">{c.department}</span></div>
                <h3>{c.title}</h3>
                <p className="muted">{c.description || 'No description yet.'}</p>
                <small>{c.instructor} · {c.credits} credits</small>
                <div className="track"><div className="fill" style={{ width: (c.enrolled / c.capacity) * 100 + '%', background: left === 0 ? 'var(--coral)' : 'var(--teal)' }} /></div>
                <div className="cc-foot">
                  <small>{left > 0 ? `${left} seat${left > 1 ? 's' : ''} left` : 'Full'}</small>
                  <button className="btn primary" disabled={joined || left <= 0} onClick={() => enroll(c)}>{joined ? 'Enrolled' : left <= 0 ? 'Full' : 'Enrol'}</button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
