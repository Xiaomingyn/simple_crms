import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOrganizations, createOrganization, updateOrganization, deleteOrganization } from '../api/client';
import { Organization } from '../types';
import Modal from '../components/Modal';

export default function Organizations() {
  const navigate = useNavigate();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ type: 'add' | 'edit'; org?: Organization } | null>(null);

  const load = () => {
    setLoading(true);
    getOrganizations(search).then(setOrgs).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search]);

  const handleSave = async (data: Partial<Organization>) => {
    if (modal?.type === 'add') {
      await createOrganization(data);
    } else if (modal?.type === 'edit' && modal.org) {
      await updateOrganization(modal.org.id, data);
    }
    setModal(null);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this organization? This cannot be undone.')) return;
    await deleteOrganization(id);
    load();
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Organizations</h1>
        <div className="toolbar">
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search organizations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={() => setModal({ type: 'add' })}>
            + Add Organization
          </button>
        </div>
      </div>

      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Industry</th>
              <th>Website</th>
              <th>Notes</th>
              <th style={{ width: 100 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5}><div className="loading">Loading...</div></td></tr>
            ) : orgs.length === 0 ? (
              <tr><td colSpan={5}><div className="empty-state"><div className="empty-state-text">No organizations found</div></div></td></tr>
            ) : (
              orgs.map((org) => (
                <tr key={org.id}>
                  <td className="clickable" onClick={() => navigate(`/organizations/${org.id}`)} style={{ fontWeight: 600 }}>
                    {org.name}
                  </td>
                  <td>{org.industry || '—'}</td>
                  <td>{org.website ? <a href={org.website} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>{org.website}</a> : '—'}</td>
                  <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{org.notes || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-sm btn-secondary" onClick={(e) => { e.stopPropagation(); setModal({ type: 'edit', org }); }}>Edit</button>
                      <button className="btn btn-sm btn-danger" onClick={(e) => { e.stopPropagation(); handleDelete(org.id); }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal title={modal.type === 'add' ? 'Add Organization' : 'Edit Organization'} onClose={() => setModal(null)}>
          <OrganizationForm
            initial={modal.org}
            onSave={handleSave}
            onCancel={() => setModal(null)}
          />
        </Modal>
      )}
    </div>
  );
}

function OrganizationForm({ initial, onSave, onCancel }: { initial?: Organization; onSave: (data: Partial<Organization>) => void; onCancel: () => void }) {
  const [name, setName] = useState(initial?.name || '');
  const [website, setWebsite] = useState(initial?.website || '');
  const [industry, setIndustry] = useState(initial?.industry || '');
  const [notes, setNotes] = useState(initial?.notes || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave({ name: name.trim(), website: website.trim() || null, industry: industry.trim() || null, notes: notes.trim() || null });
    } catch (err) {
      alert('Failed to save organization');
    } finally {
      setSaving(false);
    }
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
          <input className="form-input" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." />
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
        <button type="submit" className="btn btn-primary" disabled={saving || !name.trim()}>
          {saving ? 'Saving...' : initial ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
}
