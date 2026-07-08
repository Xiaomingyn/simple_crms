import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getDeal, deleteDeal, updateDeal, createActivity, toggleActivityDone } from '../api/client';
import { Deal } from '../types';
import Modal from '../components/Modal';
import { ActivityForm } from './ContactDetail';
import { format, parseISO } from 'date-fns';

export default function DealDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [deal, setDeal] = useState<Deal & { activities: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(false);
  const [activityModal, setActivityModal] = useState(false);

  const load = () => {
    if (!id) return;
    setLoading(true);
    getDeal(id).then(setDeal).catch(() => navigate('/deals')).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const handleDelete = async () => {
    if (!confirm('Delete this deal? This cannot be undone.')) return;
    if (!id) return;
    await deleteDeal(id);
    navigate('/deals');
  };

  const handleEdit = async (data: Partial<Deal>) => {
    if (!id) return;
    await updateDeal(id, data);
    setEditModal(false);
    load();
  };

  const handleAddActivity = async (data: any) => {
    if (!id) return;
    await createActivity({ ...data, deal_id: id });
    setActivityModal(false);
    load();
  };

  const handleToggleDone = async (activityId: string) => {
    await toggleActivityDone(activityId);
    load();
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!deal) return <div className="loading">Deal not found.</div>;

  return (
    <div>
      <Link to="/deals" className="back-link">← Back to Deals</Link>

      <div className="detail-header">
        <h1 className="detail-title">{deal.name}</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" onClick={() => setActivityModal(true)}>+ Log Activity</button>
          <button className="btn btn-secondary" onClick={() => setEditModal(true)}>Edit</button>
          <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="detail-grid">
          <div>
            <div className="detail-field">
              <div className="detail-label">Stage</div>
              <div className="detail-value"><span className={`badge badge-stage-${deal.stage}`}>{deal.stage}</span></div>
            </div>
            <div className="detail-field">
              <div className="detail-label">Value</div>
              <div className="detail-value dollar" style={{ fontSize: 20, fontWeight: 700 }}>${deal.value.toLocaleString()}</div>
            </div>
          </div>
          <div>
            <div className="detail-field">
              <div className="detail-label">Organization</div>
              <div className="detail-value">{deal.organization_name || '—'}</div>
            </div>
            <div className="detail-field">
              <div className="detail-label">Contact</div>
              <div className="detail-value">{deal.contact_name || '—'}</div>
            </div>
            <div className="detail-field">
              <div className="detail-label">Close Date</div>
              <div className="detail-value">{deal.close_date || '—'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="detail-section">
        <h3 className="detail-section-title">Activity Timeline</h3>
        {deal.activities && deal.activities.length > 0 ? (
          <div className="timeline">
            {deal.activities.map((act) => (
              <div key={act.id} className="timeline-item">
                <div className={`timeline-dot ${act.type}`} />
                <div className="timeline-content">
                  <div className="timeline-meta">
                    <span className={`timeline-type ${act.type}`}>{act.type}</span>
                    {' · '}
                    {act.date ? format(parseISO(act.date), 'MMM d, yyyy h:mm a') : ''}
                    {act.contact_name && ` · ${act.contact_name}`}
                  </div>
                  <p>{act.description}</p>
                  {act.due_date && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <label style={{ fontSize: 12, color: 'var(--gray-500)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <input
                          type="checkbox"
                          checked={!!act.done}
                          onChange={() => handleToggleDone(act.id)}
                          style={{ accentColor: 'var(--blue)' }}
                        />
                        Due: {format(parseISO(act.due_date), 'MMM d, yyyy')}
                        {act.done ? ' (Done)' : ''}
                      </label>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state"><div className="empty-state-text">No activity logged yet</div></div>
        )}
      </div>

      {editModal && (
        <Modal title="Edit Deal" onClose={() => setEditModal(false)}>
          <DealEditForm initial={deal} onSave={handleEdit} onCancel={() => setEditModal(false)} />
        </Modal>
      )}

      {activityModal && (
        <Modal title="Log Activity" onClose={() => setActivityModal(false)}>
          <ActivityForm dealId={id!} onSave={handleAddActivity} onCancel={() => setActivityModal(false)} />
        </Modal>
      )}
    </div>
  );
}

function DealEditForm({ initial, onSave, onCancel }: { initial: any; onSave: (data: any) => void; onCancel: () => void }) {
  const [name, setName] = useState(initial.name || '');
  const [stage, setStage] = useState(initial.stage || 'new');
  const [value, setValue] = useState(initial.value?.toString() || '');
  const [closeDate, setCloseDate] = useState(initial.close_date || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        stage,
        value: parseFloat(value) || 0,
        close_date: closeDate || null,
      });
    } catch { alert('Failed to save'); } finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label className="form-label">Name *</label>
        <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Stage</label>
          <select className="form-select" value={stage} onChange={(e) => setStage(e.target.value)}>
            <option value="new">New</option>
            <option value="qualified">Qualified</option>
            <option value="proposal">Proposal</option>
            <option value="negotiation">Negotiation</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Value ($)</label>
          <input className="form-input" type="number" min="0" value={value} onChange={(e) => setValue(e.target.value)} />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Close Date</label>
        <input className="form-input" type="date" value={closeDate} onChange={(e) => setCloseDate(e.target.value)} />
      </div>
      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={saving || !name.trim()}>{saving ? 'Saving...' : 'Update'}</button>
      </div>
    </form>
  );
}
