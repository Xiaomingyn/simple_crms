import { useState, useEffect } from 'react';
import { getDashboard } from '../api/client';
import { DashboardData } from '../types';
import { format, parseISO, isBefore } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading dashboard...</div>;
  if (!data) return <div className="loading">Failed to load dashboard.</div>;

  const { summary, wonByMonth, recentActivity, tasks } = data;
  const today = new Date();

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Active Deals</div>
          <div className="stat-value">{summary.activeDeals}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Won Deals</div>
          <div className="stat-value">{summary.wonDeals}</div>
          <div className="stat-sub">out of {summary.totalDeals} total</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Revenue Won</div>
          <div className="stat-value dollar">${summary.totalRevenue.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Open Tasks</div>
          <div className="stat-value">{tasks.length}</div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Chart Section */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Deals Won per Month</h3>
          </div>
          {wonByMonth.length > 0 ? (
            <SimpleChart data={wonByMonth} />
          ) : (
            <div className="empty-state">
              <div className="empty-state-text">No won deals yet</div>
            </div>
          )}
        </div>

        {/* Tasks Section */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Upcoming Tasks</h3>
          </div>
          {tasks.length > 0 ? (
            <ul className="task-list">
              {tasks.slice(0, 10).map((task) => {
                const dueDate = task.due_date ? parseISO(task.due_date) : null;
                const isOverdue = dueDate && isBefore(dueDate, today);
                const isToday = dueDate && format(dueDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
                return (
                  <li key={task.id} className="task-item">
                    <input type="checkbox" className="task-checkbox" checked={!!task.done} readOnly />
                    <div className="task-info">
                      <div className={`task-title ${isOverdue ? 'overdue' : ''}`}>
                        {task.description.length > 60 ? task.description.slice(0, 60) + '...' : task.description}
                      </div>
                      <div className="task-due">
                        {isOverdue ? 'Overdue' : isToday ? 'Today' : ''}
                        {dueDate ? ` — ${format(dueDate, 'MMM d, yyyy')}` : ''}
                      </div>
                      {task.contact_name && <div className="task-related">{task.contact_name}</div>}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="empty-state">
              <div className="empty-state-text">No upcoming tasks</div>
            </div>
          )}
        </div>

        {/* Recent Activity Feed */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="card-header">
            <h3 className="card-title">Recent Activity</h3>
          </div>
          {recentActivity.length > 0 ? (
            <ul className="activity-feed">
              {recentActivity.slice(0, 15).map((act) => (
                <li key={act.id} className="activity-feed-item">
                  <div className="activity-feed-text">
                    <strong className={`timeline-type ${act.type}`}>{act.type.toUpperCase()}</strong>
                    {' — '}
                    {act.description.length > 100 ? act.description.slice(0, 100) + '...' : act.description}
                  </div>
                  <div className="activity-feed-meta">
                    {act.date && format(parseISO(act.date), 'MMM d, yyyy h:mm a')}
                    {act.contact_name && ` — ${act.contact_name}`}
                    {act.deal_name && ` — ${act.deal_name}`}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-state">
              <div className="empty-state-text">No recent activity</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SimpleChart({ data }: { data: { month: string; count: number; revenue: number }[] }) {
  const chartData = data.map(d => ({
    month: d.month,
    deals: d.count,
    revenue: d.revenue,
  }));

  return (
    <div style={{ width: '100%', height: 220, padding: '8px 0' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={{ stroke: '#e5e7eb' }} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #e5e7eb' }}
            formatter={((value: any, name: string) => [
              name === 'revenue' ? `$${Number(value).toLocaleString()}` : value,
              name === 'revenue' ? 'Revenue' : 'Deals Won',
            ]) as any}
          />
          <Bar dataKey="deals" fill="#209dd7" radius={[4, 4, 0, 0]} maxBarSize={48} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
