import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../ctx';
import { Bars, Card, Empty, GradeBadge, Ring, Stat } from '../ui';

const greet = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };

export default function Dashboard() {
  const { user } = useAuth();
  const admin = user.role === 'ADMIN';
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { api('/dashboard/' + (admin ? 'admin' : 'student')).then(setD).catch((e) => setErr(e.message)); }, []);
  if (err) return <div className="alert bad">{err}</div>;
  if (!d) return <p className="muted">Loading your dashboard…</p>;
  return admin ? <AdminView d={d} /> : <StudentView d={d} name={user.name} />;
}

function AdminView({ d }) {
  return (
    <>
      <h1>{greet()}, Admin</h1>
      <p className="sub">Here is how the term looks across the college.</p>
      <div className="stats">
        <Stat icon="🎓" label="Students" value={d.students} />
        <Stat icon="📚" label="Courses" value={d.courses} tone="amber" />
        <Stat icon="✅" label="Active enrolments" value={d.enrollments} tone="blue" />
        <Stat icon="📅" label="Average attendance" value={d.avgAttendance + '%'} tone="coral" />
      </div>
      <div className="grid2">
        <Card title="Seats filled per course"><Bars data={d.perCourse} /></Card>
        <Card title="Overall seat usage"><div className="center"><Ring value={d.seatFill} label="of all seats taken" /></div></Card>
        <Card title="Students by department"><Bars data={d.byDept} color="var(--amber)" /></Card>
        <Card title="Grade distribution"><Bars data={d.grades} color="var(--blue)" /></Card>
      </div>
      <Card title="Latest enrolments" className="mt">
        {d.recent.length === 0 ? <Empty text="No enrolments yet." /> : (
          <div className="table-wrap"><table>
            <thead><tr><th>Student</th><th>Roll no.</th><th>Course</th><th>Grade</th></tr></thead>
            <tbody>{d.recent.map((r) => (
              <tr key={r.id}><td>{r.studentName}</td><td>{r.rollNo}</td><td>{r.courseCode} · {r.courseTitle}</td><td><GradeBadge grade={r.grade} /></td></tr>
            ))}</tbody>
          </table></div>
        )}
      </Card>
    </>
  );
}

function StudentView({ d, name }) {
  return (
    <>
      <h1>{greet()}, {name.split(' ')[0]}</h1>
      <p className="sub">Your term at a glance.</p>
      {d.lowAttendance > 0 && (
        <div className="alert warn">Attendance is below 75% in {d.lowAttendance} course{d.lowAttendance > 1 ? 's' : ''}. Talk to your instructor to avoid a shortage.</div>
      )}
      <div className="stats">
        <Stat icon="📚" label="Courses enrolled" value={d.enrolled} />
        <Stat icon="🎯" label="Credits this term" value={d.credits} tone="amber" />
        <Stat icon="⭐" label="GPA (out of 10)" value={d.gpa.toFixed(2)} tone="blue" />
        <Stat icon="📅" label="Average attendance" value={d.avgAttendance + '%'} tone="coral" />
      </div>
      <Card title="My courses" className="mt">
        {d.courses.length === 0 ? <Empty icon="🔍" text="You have not enrolled in any course yet. Open Browse Courses to start." /> : (
          <div className="course-list">
            {d.courses.map((c) => (
              <div className="course-row" key={c.id}>
                <div><b>{c.courseCode}</b> · {c.courseTitle}<small>{c.instructor} · {c.credits} credits</small></div>
                <div className="meter"><small>Attendance {c.attendance}%</small>
                  <div className="track"><div className="fill" style={{ width: c.attendance + '%', background: c.attendance < 75 ? 'var(--coral)' : 'var(--teal)' }} /></div></div>
                <div className="marks">{c.marks != null ? c.marks + '/100' : '–'}</div>
                <GradeBadge grade={c.grade} />
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
