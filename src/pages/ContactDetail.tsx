import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getContact, deleteContact, updateContact, createActivity, toggleActivityDone } from '../api/client';
import { Contact } from '../types';
import Modal from '../components/Modal';
import { format, parseISO } from 'date-fns';

export default function ContactDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [contact, setContact] = useState<Contact & { activities: any[]; deals: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(false);
  const [activityModal, setActivityModal] = useState(false);

  const load = () => {
    if (!id) return;
    setLoading(true);
    getContact(id).then(setContact).catch(() => navigate('/contacts')).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const handleDelete = async () => {
    if (!confirm('Delete this contact? This cannot be undone.')) return;
    if (!id) return;
    await deleteContact(id);
    navigate('/contacts');
  };

  const handleEdit = async (data: Partial<Contact>) => {
    if (!id) return;
    await updateContact(id, data);
    setEditModal(false);
    load();
  };

  const handleAddActivity = async (data: any) => {
    if (!id) return;
    await createActivity({ ...data, contact_id: id });
    setActivityModal(false);
    load();
  };

  const handleToggleDone = async (activityId: string) => {
    await toggleActivityDone(activityId);
    load();
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!contact) return <div className="loading">Contact not found.</div>;

  return (
    <div>
      <Link to="/contacts" className="back-link">← Back to Contacts</Link>

      <div className="detail-header">
        <h1 className="detail-title">{contact.name}</h1>
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
              <div className="detail-label">Email</div>
              <div className="detail-value">{contact.email || '—'}</div>
            </div>
            <div className="detail-field">
              <div className="detail-label">Phone</div>
              <div className="detail-value">{contact.phone || '—'}</div>
            </div>
          </div>
          <div>
            <div className="detail-field">
              <div className="detail-label">Job Title</div>
              <div className="detail-value">{contact.job_title || '—'}</div>
            </div>
            <div className="detail-field">
              <div className="detail-label">Organization</div>
              <div className="detail-value">
                {contact.organization_id ? (
                  <Link to={`/organizations/${contact.organization_id}`}>{contact.organization_name || 'View'}</Link>
                ) : '—'}
              </div>
            </div>
          </div>
        </div>
        <div className="detail-field">
          <div className="detail-label">Status</div>
          <div className="detail-value"><span className={`badge badge-${contact.status}`}>{contact.status}</span></div>
        </div>
      </div>

      {/* Deals Section */}
      <div className="detail-section">
        <h3 className="detail-section-title">Deals ({contact.deals?.length || 0})</h3>
        {contact.deals && contact.deals.length > 0 ? (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Organization</th>
                  <th>Stage</th>
                  <th>Value</th>
                  <th>Close Date</th>
                </tr>
              </thead>
              <tbody>
                {contact.deals.map((d) => (
                  <tr key={d.id} className="clickable" onClick={() => navigate(`/deals/${d.id}`)}>
                    <td style={{ fontWeight: 600 }}>{d.name}</td>
                    <td>{d.organization_name || '—'}</td>
                    <td><span className={`badge badge-stage-${d.stage}`}>{d.stage}</span></td>
                    <td className="dollar">${d.value.toLocaleString()}</td>
                    <td>{d.close_date || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state"><div className="empty-state-text">No deals yet</div></div>
        )}
      </div>

      {/* Activity Timeline */}
      <div className="detail-section">
        <h3 className="detail-section-title">Activity Timeline</h3>
        {contact.activities && contact.activities.length > 0 ? (
          <div className="timeline">
            {contact.activities.map((act) => (
              <div key={act.id} className="timeline-item">
                <div className={`timeline-dot ${act.type}`} />
                <div className="timeline-content">
                  <div className="timeline-meta">
                    <span className={`timeline-type ${act.type}`}>{act.type}</span>
                    {' · '}
                    {act.date ? format(parseISO(act.date), 'MMM d, yyyy h:mm a') : ''}
                    {act.deal_name && ` · ${act.deal_name}`}
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
        <Modal title="Edit Contact" onClose={() => setEditModal(false)}>
          <ContactEditForm initial={contact} onSave={handleEdit} onCancel={() => setEditModal(false)} />
        </Modal>
      )}

      {activityModal && (
        <Modal title="Log Activity" onClose={() => setActivityModal(false)}>
          <ActivityForm contactId={id!} onSave={handleAddActivity} onCancel={() => setActivityModal(false)} />
        </Modal>
      )}
    </div>
  );
}

function ContactEditForm({ initial, onSave, onCancel }: { initial: any; onSave: (data: any) => void; onCancel: () => void }) {
  const [name, setName] = useState(initial.name || '');
  const [email, setEmail] = useState(initial.email || '');
  const [phone, setPhone] = useState(initial.phone || '');
  const [jobTitle, setJobTitle] = useState(initial.job_title || '');
  const [status, setStatus] = useState(initial.status || 'lead');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        job_title: jobTitle.trim() || null,
        status,
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
          <label className="form-label">Email</label>
          <input className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Phone</label>
          <input className="form-input" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Job Title</label>
          <input className="form-input" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Status</label>
          <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="lead">Lead</option>
            <option value="qualified">Qualified</option>
            <option value="customer">Customer</option>
          </select>
        </div>
      </div>
      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={saving || !name.trim()}>{saving ? 'Saving...' : 'Update'}</button>
      </div>
    </form>
  );
}

function ActivityForm({ contactId, dealId, onSave, onCancel }: { contactId?: string; dealId?: string; onSave: (data: any) => void; onCancel: () => void }) {
  const [type, setType] = useState('note');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !type) return;
    setSaving(true);
    try {
      await onSave({
        type,
        description: description.trim(),
        contact_id: contactId || null,
        deal_id: dealId || null,
        due_date: dueDate || null,
        done: false,
      });
    } catch { alert('Failed to save activity'); } finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label className="form-label">Type</label>
        <select className="form-select" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="note">Note</option>
          <option value="call">Call</option>
          <option value="email">Email</option>
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">Description *</label>
        <textarea className="form-textarea" value={description} onChange={(e) => setDescription(e.target.value)} required />
      </div>
      <div className="form-group">
        <label className="form-label">Follow-up Due Date (optional)</label>
        <input className="form-input" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
      </div>
      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={saving || !description.trim()}>
          {saving ? 'Saving...' : 'Log Activity'}
        </button>
      </div>
    </form>
  );
}

export { ActivityForm };
