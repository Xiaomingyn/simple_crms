import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getContacts, createContact, updateContact, deleteContact, getOrganizations } from '../api/client';
import { Contact, Organization } from '../types';
import Modal from '../components/Modal';

export default function Contacts() {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ type: 'add' | 'edit'; contact?: Contact } | null>(null);

  const load = () => {
    setLoading(true);
    getContacts(search || undefined, statusFilter || undefined).then(setContacts).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search, statusFilter]);

  const handleSave = async (data: Partial<Contact>) => {
    if (modal?.type === 'add') {
      await createContact(data);
    } else if (modal?.type === 'edit' && modal.contact) {
      await updateContact(modal.contact.id, data);
    }
    setModal(null);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this contact? This cannot be undone.')) return;
    await deleteContact(id);
    load();
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Contacts</h1>
        <div className="toolbar">
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search contacts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="lead">Lead</option>
            <option value="qualified">Qualified</option>
            <option value="customer">Customer</option>
          </select>
          <button className="btn btn-primary" onClick={() => setModal({ type: 'add' })}>
            + Add Contact
          </button>
        </div>
      </div>

      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Job Title</th>
              <th>Organization</th>
              <th>Status</th>
              <th style={{ width: 100 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7}><div className="loading">Loading...</div></td></tr>
            ) : contacts.length === 0 ? (
              <tr><td colSpan={7}><div className="empty-state"><div className="empty-state-text">No contacts found</div></div></td></tr>
            ) : (
              contacts.map((c) => (
                <tr key={c.id}>
                  <td className="clickable" onClick={() => navigate(`/contacts/${c.id}`)} style={{ fontWeight: 600 }}>
                    {c.name}
                  </td>
                  <td>{c.email || '—'}</td>
                  <td>{c.phone || '—'}</td>
                  <td>{c.job_title || '—'}</td>
                  <td>{c.organization_name || '—'}</td>
                  <td><span className={`badge badge-${c.status}`}>{c.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-sm btn-secondary" onClick={(e) => { e.stopPropagation(); setModal({ type: 'edit', contact: c }); }}>Edit</button>
                      <button className="btn btn-sm btn-danger" onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal title={modal.type === 'add' ? 'Add Contact' : 'Edit Contact'} onClose={() => setModal(null)}>
          <ContactForm
            initial={modal.contact}
            onSave={handleSave}
            onCancel={() => setModal(null)}
          />
        </Modal>
      )}
    </div>
  );
}

function ContactForm({ initial, onSave, onCancel }: { initial?: Contact; onSave: (data: Partial<Contact>) => void; onCancel: () => void }) {
  const [name, setName] = useState(initial?.name || '');
  const [email, setEmail] = useState(initial?.email || '');
  const [phone, setPhone] = useState(initial?.phone || '');
  const [jobTitle, setJobTitle] = useState(initial?.job_title || '');
  const [orgId, setOrgId] = useState(initial?.organization_id || '');
  const [status, setStatus] = useState(initial?.status || 'lead');
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getOrganizations().then(setOrgs);
  }, []);

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
        organization_id: orgId || null,
        status: status as any,
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
          <input className="form-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
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
          <label className="form-label">Organization</label>
          <select className="form-select" value={orgId} onChange={(e) => setOrgId(e.target.value)}>
            <option value="">None</option>
            {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Status</label>
        <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="lead">Lead</option>
          <option value="qualified">Qualified</option>
          <option value="customer">Customer</option>
        </select>
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
