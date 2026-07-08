import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getOrganization, deleteOrganization, updateOrganization } from '../api/client';
import { Organization } from '../types';
import Modal from '../components/Modal';

export default function OrganizationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [org, setOrg] = useState<Organization & { contacts: any[]; deals: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(false);

  const load = () => {
    if (!id) return;
    setLoading(true);
    getOrganization(id).then(setOrg).catch(() => navigate('/organizations')).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const handleDelete = async () => {
    if (!confirm('Delete this organization? This cannot be undone.')) return;
    if (!id) return;
    await deleteOrganization(id);
    navigate('/organizations');
  };

  const handleEdit = async (data: Partial<Organization>) => {
    if (!id) return;
    await updateOrganization(id, data);
    setEditModal(false);
    load();
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!org) return <div className="loading">Organization not found.</div>;

  return (
    <div>
      <Link to="/organizations" className="back-link">← Back to Organizations</Link>

      <div className="detail-header">
        <h1 className="detail-title">{org.name}</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => setEditModal(true)}>Edit</button>
          <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="detail-grid">
          <div>
            <div className="detail-field">
              <div className="detail-label">Industry</div>
              <div className="detail-value">{org.industry || '—'}</div>
            </div>
          </div>
          <div>
            <div className="detail-field">
              <div className="detail-label">Website</div>
              <div className="detail-value">{org.website ? <a href={org.website} target="_blank" rel="noopener noreferrer">{org.website}</a> : '—'}</div>
            </div>
          </div>
        </div>
        {org.notes && (
          <div className="detail-field">
            <div className="detail-label">Notes</div>
            <div className="detail-value" style={{ whiteSpace: 'pre-wrap' }}>{org.notes}</div>
          </div>
        )}
      </div>

      <div className="detail-section">
        <h3 className="detail-section-title">Contacts ({org.contacts?.length || 0})</h3>
        {org.contacts && org.contacts.length > 0 ? (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Job Title</th>
                  <th>Email</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {org.contacts.map((c) => (
                  <tr key={c.id} className="clickable" onClick={() => navigate(`/contacts/${c.id}`)}>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td>{c.job_title || '—'}</td>
                    <td>{c.email || '—'}</td>
                    <td><span className={`badge badge-${c.status}`}>{c.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state"><div className="empty-state-text">No contacts yet</div></div>
        )}
      </div>

      <div className="detail-section">
        <h3 className="detail-section-title">Deals ({org.deals?.length || 0})</h3>
        {org.deals && org.deals.length > 0 ? (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Stage</th>
                  <th>Value</th>
                  <th>Close Date</th>
                </tr>
              </thead>
              <tbody>
                {org.deals.map((d) => (
                  <tr key={d.id} className="clickable" onClick={() => navigate(`/deals/${d.id}`)}>
                    <td style={{ fontWeight: 600 }}>{d.name}</td>
                    <td>{d.contact_name || '—'}</td>
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

      {editModal && (
        <Modal title="Edit Organization" onClose={() => setEditModal(false)}>
          <OrganizationEditForm initial={org} onSave={handleEdit} onCancel={() => setEditModal(false)} />
        </Modal>
      )}
    </div>
  );
}

function OrganizationEditForm({ initial, onSave, onCancel }: { initial: any; onSave: (data: any) => void; onCancel: () => void }) {
  const [name, setName] = useState(initial.name || '');
  const [website, setWebsite] = useState(initial.website || '');
  const [industry, setIndustry] = useState(initial.industry || '');
  const [notes, setNotes] = useState(initial.notes || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave({ name: name.trim(), website: website.trim() || null, industry: industry.trim() || null, notes: notes.trim() || null });
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
          <label className="form-label">Website</label>
          <input className="form-input" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Industry</label>
          <input className="form-input" value={industry} onChange={(e) => setIndustry(e.target.value)} />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Notes</label>
        <textarea className="form-textarea" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={saving || !name.trim()}>{saving ? 'Saving...' : 'Update'}</button>
      </div>
    </form>
  );
}
