import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDeals, createDeal, updateDeal, deleteDeal, getOrganizations, getContacts } from '../api/client';
import { Deal, Organization, Contact } from '../types';
import Modal from '../components/Modal';

export default function Deals() {
  const navigate = useNavigate();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ type: 'add' | 'edit'; deal?: Deal } | null>(null);

  const load = () => {
    setLoading(true);
    getDeals(search || undefined).then(setDeals).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search]);

  const handleSave = async (data: Partial<Deal>) => {
    if (modal?.type === 'add') {
      await createDeal(data);
    } else if (modal?.type === 'edit' && modal.deal) {
      await updateDeal(modal.deal.id, data);
    }
    setModal(null);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this deal? This cannot be undone.')) return;
    await deleteDeal(id);
    load();
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Deals</h1>
        <div className="toolbar">
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search deals..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={() => setModal({ type: 'add' })}>
            + Add Deal
          </button>
        </div>
      </div>

      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Organization</th>
              <th>Contact</th>
              <th>Stage</th>
              <th>Value</th>
              <th>Close Date</th>
              <th style={{ width: 100 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7}><div className="loading">Loading...</div></td></tr>
            ) : deals.length === 0 ? (
              <tr><td colSpan={7}><div className="empty-state"><div className="empty-state-text">No deals found</div></div></td></tr>
            ) : (
              deals.map((d) => (
                <tr key={d.id}>
                  <td className="clickable" onClick={() => navigate(`/deals/${d.id}`)} style={{ fontWeight: 600 }}>
                    {d.name}
                  </td>
                  <td>{d.organization_name || '—'}</td>
                  <td>{d.contact_name || '—'}</td>
                  <td><span className={`badge badge-stage-${d.stage}`}>{d.stage}</span></td>
                  <td className="dollar">${d.value.toLocaleString()}</td>
                  <td>{d.close_date || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-sm btn-secondary" onClick={(e) => { e.stopPropagation(); setModal({ type: 'edit', deal: d }); }}>Edit</button>
                      <button className="btn btn-sm btn-danger" onClick={(e) => { e.stopPropagation(); handleDelete(d.id); }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal title={modal.type === 'add' ? 'Add Deal' : 'Edit Deal'} onClose={() => setModal(null)}>
          <DealForm
            initial={modal.deal}
            onSave={handleSave}
            onCancel={() => setModal(null)}
          />
        </Modal>
      )}
    </div>
  );
}

function DealForm({ initial, onSave, onCancel }: { initial?: Deal; onSave: (data: Partial<Deal>) => void; onCancel: () => void }) {
  const [name, setName] = useState(initial?.name || '');
  const [orgId, setOrgId] = useState(initial?.organization_id || '');
  const [contactId, setContactId] = useState(initial?.contact_id || '');
  const [stage, setStage] = useState(initial?.stage || 'new');
  const [value, setValue] = useState(initial?.value?.toString() || '');
  const [closeDate, setCloseDate] = useState(initial?.close_date || '');
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getOrganizations().then(setOrgs);
    getContacts().then(setContacts);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        organization_id: orgId || null,
        contact_id: contactId || null,
        stage: stage as any,
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
          <label className="form-label">Organization</label>
          <select className="form-select" value={orgId} onChange={(e) => setOrgId(e.target.value)}>
            <option value="">None</option>
            {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Contact</label>
          <select className="form-select" value={contactId} onChange={(e) => setContactId(e.target.value)}>
            <option value="">None</option>
            {contacts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
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
          <input className="form-input" type="number" min="0" step="0.01" value={value} onChange={(e) => setValue(e.target.value)} />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Close Date</label>
        <input className="form-input" type="date" value={closeDate} onChange={(e) => setCloseDate(e.target.value)} />
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
