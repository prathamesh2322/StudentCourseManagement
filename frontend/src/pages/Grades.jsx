import { useEffect, useState } from 'react';
import { api } from '../api';
import { useToast } from '../ctx';
import { Empty, GradeBadge } from '../ui';

const toRow = (x) => ({ ...x, m: x.marks ?? '', a: x.attendance });

export default function Grades() {
  const [rows, setRows] = useState([]);
  const [courses, setCourses] = useState([]);
  const [cid, setCid] = useState('');
  const toast = useToast();
  useEffect(() => { api('/courses').then(setCourses); }, []);
  useEffect(() => { api('/enrollments' + (cid ? '?courseId=' + cid : '')).then((r) => setRows(r.map(toRow))); }, [cid]);

  const edit = (id, k, v) => setRows(rows.map((r) => (r.id === id ? { ...r, [k]: v } : r)));
  const save = async (r) => {
    try {
      const out = await api('/enrollments/' + r.id, 'PUT', { marks: r.m === '' ? null : +r.m, attendance: +r.a });
      setRows(rows.map((x) => (x.id === r.id ? toRow(out) : x)));
      toast('Saved ' + r.studentName);
    } catch (x) { toast(x.message, 'bad'); }
  };

  return (
    <>
      <h1>Marks & attendance</h1>
      <p className="sub">Enter marks out of 100. The grade is worked out for you.</p>
      <div className="toolbar">
        <select value={cid} onChange={(e) => setCid(e.target.value)}>
          <option value="">All courses</option>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.code} · {c.title}</option>)}
        </select>
      </div>
      {rows.length === 0 ? <Empty text="No enrolments for this course yet." /> : (
        <div className="table-wrap card"><table>
          <thead><tr><th>Student</th><th>Course</th><th>Marks</th><th>Attendance %</th><th>Grade</th><th></th></tr></thead>
          <tbody>{rows.map((r) => (
            <tr key={r.id}>
              <td><b>{r.studentName}</b><small className="block">{r.rollNo}</small></td>
              <td>{r.courseCode}</td>
              <td><input className="num" type="number" min="0" max="100" value={r.m} onChange={(e) => edit(r.id, 'm', e.target.value)} /></td>
              <td><input className="num" type="number" min="0" max="100" value={r.a} onChange={(e) => edit(r.id, 'a', e.target.value)} /></td>
              <td><GradeBadge grade={r.grade} /></td>
              <td className="actions"><button className="btn primary" onClick={() => save(r)}>Save</button></td>
            </tr>
          ))}</tbody>
        </table></div>
      )}
    </>
  );
}
