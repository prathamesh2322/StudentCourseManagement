import { useEffect, useState } from 'react';
import { api } from '../api';
import { useToast } from '../ctx';
import { Empty, GradeBadge } from '../ui';

export default function MyCourses() {
  const [rows, setRows] = useState(null);
  const toast = useToast();
  const load = () => api('/enrollments/my').then(setRows);
  useEffect(() => { load(); }, []);

  const drop = async (r) => {
    if (!confirm(`Drop ${r.courseCode}? You can enrol again later if seats are free.`)) return;
    try { await api('/enrollments/' + r.id, 'DELETE'); toast(`Dropped ${r.courseCode}`); load(); }
    catch (x) { toast(x.message, 'bad'); }
  };
  if (!rows) return <p className="muted">Loading…</p>;

  return (
    <>
      <h1>My courses</h1>
      <p className="sub">Your marks, grades and attendance for every course.</p>
      {rows.length === 0 ? <Empty icon="🔍" text="No courses yet. Open Browse Courses to enrol." /> : (
        <div className="table-wrap card"><table>
          <thead><tr><th>Course</th><th>Instructor</th><th>Credits</th><th>Attendance</th><th>Marks</th><th>Grade</th><th></th></tr></thead>
          <tbody>{rows.map((r) => (
            <tr key={r.id}>
              <td><b>{r.courseCode}</b><small className="block">{r.courseTitle}</small></td>
              <td>{r.instructor}</td><td>{r.credits}</td>
              <td><span className={'badge ' + (r.attendance < 75 ? 'bad' : 'ok')}>{r.attendance}%</span></td>
              <td>{r.marks != null ? r.marks + '/100' : '–'}</td>
              <td><GradeBadge grade={r.grade} /></td>
              <td className="actions"><button className="btn danger" onClick={() => drop(r)}>Drop</button></td>
            </tr>
          ))}</tbody>
        </table></div>
      )}
    </>
  );
}
