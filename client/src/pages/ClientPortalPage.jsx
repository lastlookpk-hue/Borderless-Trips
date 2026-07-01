import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import {
  LayoutDashboard, FileText, Plane, Upload, User, Bell, LogOut, Clock,
  CheckCircle2, AlertCircle, Package, DollarSign, Send, MessageSquare,
  Plus, ChevronRight, Globe, Shield, Calendar, Users as UsersIcon,
  MapPin, X, ArrowRight, Download, Eye, Menu, ClipboardList,
  Briefcase, Hotel, HelpCircle, Phone
} from 'lucide-react';

const tabs = [
  { id:'dashboard', label:'Dashboard', icon:LayoutDashboard },
  { id:'bookings', label:'My Bookings', icon:Package },
  { id:'visa', label:'Visa Applications', icon:FileText },
  { id:'request-service', label:'Request a Service', icon:ClipboardList },
  { id:'my-requests', label:'My Requests', icon:Briefcase },
  { id:'documents', label:'Documents', icon:Upload },
  { id:'messages', label:'Support Chat', icon:MessageSquare },
  { id:'notifications', label:'Notifications', icon:Bell },
  { id:'profile', label:'Profile', icon:User },
];

const statusColors = {
  confirmed:'#10b981', pending:'#f59e0b', approved:'#10b981', in_review:'#6366f1',
  rejected:'#ef4444', submitted:'#f59e0b', completed:'#0ea5e9', cancelled:'#ef4444',
  paid:'#10b981', partial:'#0ea5e9', new:'#f59e0b', accepted:'#10b981', in_progress:'#6366f1',
  pending_upload:'#f59e0b', uploaded:'#6366f1', document_complete:'#0ea5e9',
};
const statusLabels = {
  confirmed:'Confirmed', pending:'Pending', approved:'Approved', in_review:'In Review',
  rejected:'Rejected', submitted:'Submitted', completed:'Completed', cancelled:'Cancelled',
  paid:'Paid', partial:'Partial', new:'New', accepted:'Accepted', in_progress:'In Progress',
  pending_upload:'Pending Upload', uploaded:'Pending Review', document_complete:'Docs Complete',
};

function StatusBadge({ status }) {
  const color = statusColors[status] || '#94a3b8';
  const label = statusLabels[status] || status;
  return (
    <span style={{
      background:`${color}14`, color, padding:'3px 10px', borderRadius:20,
      fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.03em',
      border:`1px solid ${color}30`, whiteSpace:'nowrap', display:'inline-block'
    }}>{label}</span>
  );
}

const getArrayField = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }
  return [];
};

function PortalCaseExtensions({ item, type, loadPortalData }) {
  const [uploading, setUploading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedTravelers, setEditedTravelers] = useState([]);
  
  const travelers = getArrayField(item.travelers_json);
  const payments = getArrayField(item.payment_info_json);
  const comments = getArrayField(item.comments_json).filter(c => c.is_public);
  
  const handleProofUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      setUploading(true);
      const res = await api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      if(res.url) {
        const endpoint = type === 'visa' ? `/visa/applications/${item.id}` : `/bookings/${item.id}`;
        await api.put(endpoint, { payment_proof: res.url });
        await loadPortalData();
        alert('Payment proof uploaded successfully!');
      }
    } catch (err) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSignedDocUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      setUploading(true);
      const res = await api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      if(res.url) {
        const endpoint = type === 'visa' ? `/visa/applications/${item.id}` : `/bookings/${item.id}`;
        await api.put(endpoint, { signed_document_url: res.url });
        await loadPortalData();
        alert('Signed agreement uploaded successfully!');
      }
    } catch (err) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveTravelers = async () => {
    const endpoint = type === 'visa' ? `/visa/applications/${item.id}` : `/bookings/${item.id}`;
    try {
      await api.put(endpoint, { travelers: editedTravelers });
      await loadPortalData();
      setEditMode(false);
      alert('Travelers list updated successfully!');
    } catch (err) {
      alert('Failed to update: ' + err.message);
    }
  };

  return (
    <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: 16 }}>
      
      {/* 1. Premium Banking Card & Invoicing Details */}
      {item.payment_status !== 'paid' && item.status !== 'cancelled' && (
        <div>
          <h4 style={{ fontSize:13, fontWeight:700, marginBottom:8, color:'var(--color-text-secondary)' }}>💳 Banking Details & Invoice</h4>
          <div style={{
            background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
            color: '#F8FAFC',
            borderRadius: 12,
            padding: 20,
            boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            position: 'relative',
            overflow: 'hidden',
            marginBottom: 12
          }}>
            <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(245, 158, 11, 0.04)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#F59E0B' }}>Official Bank Transfer</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: 'white', letterSpacing: '0.5px' }}>BARCLAYS</span>
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '0.5px', marginBottom: 14, color: 'white' }}>Borderless Trips Ltd</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, fontSize: 12, marginBottom: 14 }}>
              <div>
                <span style={{ color: '#94A3B8', fontSize: 9, textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>Sort Code</span>
                <span style={{ fontWeight: 600, fontFamily: 'monospace', color: 'white' }}>20-XX-XX</span>
              </div>
              <div>
                <span style={{ color: '#94A3B8', fontSize: 9, textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>Account Number</span>
                <span style={{ fontWeight: 600, fontFamily: 'monospace', color: 'white' }}>XXXXXXXX</span>
              </div>
            </div>
            <div style={{ fontSize: 11, color: '#CBD5E1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '8px 12px', borderRadius: 6 }}>
              <span><strong>Reference:</strong> BT-{item.id}-{item.booking_ref || item.app_ref}</span>
              {item.invoice_url && (
                <a href={item.invoice_url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, padding: '4px 8px', background: 'var(--color-secondary)', color: '#000', fontWeight: 'bold', borderRadius: 4 }}>
                  <Download size={12}/> Invoice
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. Specific custom payment options & Upload evidence */}
      {payments.length > 0 && (
        <div>
          <h4 style={{ fontSize:13, fontWeight:700, marginBottom:8, color:'var(--color-text-secondary)' }}>💳 Specific Payment Options</h4>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {payments.map((p, i) => (
              <div key={i} style={{ background:'var(--color-bg)', padding:'10px 14px', borderRadius:6, fontSize:12, border:'1px solid var(--color-border)' }}>
                <div style={{ fontWeight:600 }}>{p.bank_name}</div>
                <div style={{ color:'var(--color-text-muted)', marginTop:2 }}>{p.account_name} • {p.account_number}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {item.status !== 'cancelled' && (
        <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap: 'wrap' }}>
          {!item.payment_proof ? (
            <label className="btn btn-primary btn-sm" style={{ cursor:'pointer' }}>
              <Upload size={14}/> {uploading ? 'Uploading...' : 'Upload Payment Receipt'}
              <input type="file" disabled={uploading} onChange={handleProofUpload} style={{ display:'none' }} accept="image/*,.pdf"/>
            </label>
          ) : (
            <div style={{ fontSize:12, background:'rgba(16, 185, 129, 0.08)', padding:'8px 14px', borderRadius:6, display:'flex', alignItems: 'center', gap: 8, border: '1px solid rgba(16,185,129,0.2)', color: 'var(--color-success)' }}>
              <span>✅ Payment proof uploaded. We are verifying it.</span>
              <a href={item.payment_proof} target="_blank" rel="noreferrer" style={{ color:'var(--color-success)', fontWeight:700, textDecoration: 'underline' }}>View Receipt</a>
            </div>
          )}
        </div>
      )}

      {/* 3. Signature & Agreement Section */}
      {(item.signature_link || item.signature_doc || item.signed_document_url) && (
        <div style={{ background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)', borderRadius: 10, padding: 16 }}>
          <h4 style={{ fontSize:13, fontWeight:700, marginBottom:8, color:'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            ✍️ Travelers Agreement & E-Signing
          </h4>
          
          {item.signed_document_url ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-success)', fontSize: 12 }}>
              <CheckCircle2 size={16} />
              <span>Agreement Signed and Submitted successfully.</span>
              <a href={item.signed_document_url} target="_blank" rel="noreferrer" style={{ fontWeight: 600, textDecoration: 'underline', color: 'var(--color-success)', marginLeft: 6 }}>
                View Signed Copy
              </a>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {item.signature_link && (
                <div style={{ fontSize: 12, background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245,158,11,0.2)', padding: 12, borderRadius: 8 }}>
                  <p style={{ margin: '0 0 10px 0', lineHeight: 1.4 }}>
                    Please click the button below to sign the travel agreement digitally.
                  </p>
                  <a href={item.signature_link} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--color-secondary)', color: '#000', fontWeight: 'bold' }}>
                    Sign Online Now
                  </a>
                </div>
              )}

              {item.signature_doc && (
                <div style={{ fontSize: 12, background: 'var(--color-bg)', border: '1px solid var(--color-border)', padding: 12, borderRadius: 8 }}>
                  <p style={{ margin: '0 0 10px 0', lineHeight: 1.4 }}>
                    Please download the agreement document, sign it, and upload the signed copy.
                  </p>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                    <a href={item.signature_doc} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <Download size={12}/> Download Agreement
                    </a>
                    
                    <label className="btn btn-primary btn-sm" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <Upload size={12}/> {uploading ? 'Uploading...' : 'Upload Signed PDF'}
                      <input type="file" disabled={uploading} onChange={handleSignedDocUpload} style={{ display: 'none' }} accept=".pdf,.png,.jpg,.jpeg"/>
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 4. Travelers / Co-Travelers Editor */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h4 style={{ fontSize:13, fontWeight:700, color:'var(--color-text-secondary)', margin: 0 }}>👥 Co-Travelers List</h4>
          {!editMode && (type === 'booking' ? item.status === 'pending' || item.edit_unlocked === 1 : item.status === 'submitted' || item.edit_unlocked === 1) && (
            <button className="btn btn-outline btn-sm" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => {
              setEditedTravelers(travelers.length > 0 ? travelers : [{ name: '', passport: '', email: '', phone: '', nationality: '' }]);
              setEditMode(true);
            }}>
              Edit Travelers
            </button>
          )}
        </div>

        {/* Lockout Notice */}
        {!(type === 'booking' ? item.status === 'pending' || item.edit_unlocked === 1 : item.status === 'submitted' || item.edit_unlocked === 1) && (
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, padding: '8px 12px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: 6, border: '1px solid rgba(239, 68, 68, 0.15)' }}>
            <span>🔒 Co-travelers and applications are locked. If edits are needed, ask support to unlock editing.</span>
          </div>
        )}

        {editMode ? (
          <div style={{ background: 'var(--color-bg-alt)', padding: 16, borderRadius: 10, border: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
              {editedTravelers.map((t, idx) => (
                <div key={idx} style={{ background: 'var(--color-bg)', padding: 12, borderRadius: 8, border: '1px solid var(--color-border)', position: 'relative' }}>
                  <button type="button" onClick={() => setEditedTravelers(editedTravelers.filter((_, i) => i !== idx))} style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', fontSize: 12 }}>
                    Remove
                  </button>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
                    <div>
                      <label style={{ fontSize: 10, display: 'block', marginBottom: 2 }}>Name</label>
                      <input className="form-input" style={{ padding: '6px 10px', fontSize: 12 }} value={t.name || ''} onChange={e => {
                        const newT = [...editedTravelers];
                        newT[idx].name = e.target.value;
                        setEditedTravelers(newT);
                      }} placeholder="Name" />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, display: 'block', marginBottom: 2 }}>Passport No</label>
                      <input className="form-input" style={{ padding: '6px 10px', fontSize: 12 }} value={t.passport || ''} onChange={e => {
                        const newT = [...editedTravelers];
                        newT[idx].passport = e.target.value;
                        setEditedTravelers(newT);
                      }} placeholder="Passport" />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, display: 'block', marginBottom: 2 }}>Email</label>
                      <input className="form-input" style={{ padding: '6px 10px', fontSize: 12 }} value={t.email || ''} onChange={e => {
                        const newT = [...editedTravelers];
                        newT[idx].email = e.target.value;
                        setEditedTravelers(newT);
                      }} placeholder="Email" />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, display: 'block', marginBottom: 2 }}>Nationality</label>
                      <input className="form-input" style={{ padding: '6px 10px', fontSize: 12 }} value={t.nationality || ''} onChange={e => {
                        const newT = [...editedTravelers];
                        newT[idx].nationality = e.target.value;
                        setEditedTravelers(newT);
                      }} placeholder="Nationality" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between' }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setEditedTravelers([...editedTravelers, { name: '', passport: '', email: '', phone: '', nationality: '' }])}>
                + Add Traveler
              </button>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditMode(false)}>Cancel</button>
                <button type="button" className="btn btn-primary btn-sm" onClick={handleSaveTravelers}>Save List</button>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {travelers.length > 0 ? travelers.map((t, i) => (
              <div key={i} style={{ background:'var(--color-bg)', padding:'8px 12px', borderRadius:6, fontSize:12, border:'1px solid var(--color-border)', flex: '1 1 200px' }}>
                <strong style={{ display: 'block' }}>{t.name || 'Traveler'}</strong>
                <div style={{ color:'var(--color-text-muted)', fontSize: 11, marginTop: 4 }}>
                  {t.passport && <span>Passport: {t.passport}</span>}
                  {t.email && <span style={{ marginLeft: 8 }}>Email: {t.email}</span>}
                  {t.nationality && <span style={{ marginLeft: 8 }}>({t.nationality})</span>}
                </div>
              </div>
            )) : (
              <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>No additional travelers added.</span>
            )}
          </div>
        )}
      </div>

      {/* 5. Messages from Agent */}
      {comments.length > 0 && (
        <div>
          <h4 style={{ fontSize:13, fontWeight:700, marginBottom:8, color:'var(--color-text-secondary)' }}>💬 Messages from Agent</h4>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {comments.map((c, i) => (
              <div key={i} style={{ background:'rgba(16, 185, 129, 0.05)', padding:'10px 14px', borderRadius:8, fontSize:12, border:'1px solid rgba(16, 185, 129, 0.2)' }}>
                <div style={{ fontWeight:700, color:'var(--color-success)', marginBottom:4 }}>{c.agent_name} <span style={{ opacity:0.6, fontWeight:400, fontSize:10 }}>• {new Date(c.date).toLocaleString()}</span></div>
                <p style={{ margin:0, lineHeight:1.5 }}>{c.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ClientPortalPage() {
  const { user, logout, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [bookings, setBookings] = useState([]);
  const [visaApps, setVisaApps] = useState([]);
  const [messages, setMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [serviceRequests, setServiceRequests] = useState([]);
  const [countries, setCountries] = useState([]);
  const [unreadMsgs, setUnreadMsgs] = useState(0);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Form states
  const [paymentRefs, setPaymentRefs] = useState({});
  const [profileForm, setProfileForm] = useState({ name:'', phone:'', nationality:'' });
  const [msgInput, setMsgInput] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const msgEndRef = useRef(null);

  // Service request form
  const [srForm, setSrForm] = useState({
    service_type: '', country: '', name: '', email: '', phone: '',
    travelDate: '', duration: '', travelers: '1', budget: '',
    nationality: '', purpose: 'tourism', employment: 'employed',
    monthlyIncome: '', previousVisa: 'no', previousRejection: 'no',
    fromCity: '', toCity: '', flightClass: 'economy', tripType: 'return',
    notes: ''
  });
  const [submittingSR, setSubmittingSR] = useState(false);
  const [srSuccess, setSrSuccess] = useState(null);

  const loadPortalData = async () => {
    try {
      setLoading(true);
      const [bookingsData, visaData, msgsData, notifsData, unreadMsgData, unreadNotifData, srData, ctryData] = await Promise.all([
        api.get('/bookings').catch(() => []),
        api.get('/visa/applications').catch(() => []),
        api.get('/messages').catch(() => []),
        api.get('/notifications').catch(() => []),
        api.get('/messages/unread-count').catch(() => ({ count:0 })),
        api.get('/notifications/unread-count').catch(() => ({ count:0 })),
        api.get('/service-requests').catch(() => []),
        api.get('/countries').catch(() => []),
      ]);
      setBookings(bookingsData);
      setVisaApps(visaData);
      setMessages(msgsData);
      setNotifications(notifsData);
      setUnreadMsgs(unreadMsgData.count);
      setUnreadNotifs(unreadNotifData.count);
      setServiceRequests(Array.isArray(srData) ? srData : (srData.requests || []));
      setCountries(ctryData);
    } catch (err) { console.error('Portal load error:', err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (user) {
      setProfileForm({ name: user.name||'', phone: user.phone||'', nationality: user.nationality||'' });
      setSrForm(f => ({ ...f, name: user.name||'', email: user.email||'', phone: user.phone||'' }));
      loadPortalData();
    }
  }, [user]);

  // Auto-scroll chat
  useEffect(() => {
    if (activeTab === 'messages') {
      msgEndRef.current?.scrollIntoView({ behavior:'smooth' });
      api.put('/messages/read', {}).catch(() => {});
      setUnreadMsgs(0);
    }
  }, [activeTab, messages]);

  // Polling
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(async () => {
      try {
        const data = await api.get('/messages/unread-count');
        setUnreadMsgs(data.count);
        if (activeTab === 'messages') {
          const msgsData = await api.get('/messages');
          setMessages(msgsData);
        }
      } catch {}
    }, 8000);
    return () => clearInterval(interval);
  }, [user, activeTab]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateProfile(profileForm);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (err) { alert('Failed: ' + err.message); }
  };

  const handlePaymentSubmit = async (bookingId) => {
    const ref = paymentRefs[bookingId];
    if (!ref) return alert('Please enter your deposit transaction reference.');
    try {
      await api.post(`/bookings/${bookingId}/payment`, { paymentRef: ref });
      alert('Payment reference submitted! Admin will verify shortly.');
      setPaymentRefs({ ...paymentRefs, [bookingId]: '' });
      await loadPortalData();
    } catch (err) { alert('Failed: ' + err.message); }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await api.put(`/bookings/${bookingId}/cancel`);
      alert('Booking cancelled.');
      await loadPortalData();
    } catch (err) { alert('Failed: ' + err.message); }
  };

  const handleCancelRequest = async (id) => {
    if (!confirm('Are you sure you want to cancel this request?')) return;
    try {
      await api.delete(`/service-requests/${id}`);
      alert('Request cancelled.');
      await loadPortalData();
    } catch (err) { alert('Failed to cancel request: ' + err.message); }
  };

  const handleDocumentUpload = async (e, visaAppId, docId = null) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      setUploadingDoc(true);
      const fileData = await api.upload('/upload', formData);
      const app = visaApps.find(a => a.id === visaAppId);
      if (!app) return;
      
      const currentDocs = app.documents_json || [];
      let updatedDocs;
      if (docId) {
        // Specific requested document
        updatedDocs = currentDocs.map(d => d.id === docId ? { 
          ...d, 
          filename: fileData.filename, 
          url: fileData.url, 
          status: 'uploaded',
          uploaded_at: new Date().toISOString()
        } : d);
      } else {
        // Generic document upload
        updatedDocs = [...currentDocs, { filename: fileData.filename, url: fileData.url, is_requested: false }];
      }
      
      await api.put(`/visa/applications/${app.id}`, { documents: updatedDocs });
      await loadPortalData();
    } catch (err) { alert('Upload failed: ' + err.message); }
    finally { setUploadingDoc(false); }
  };

  const handleSendMessage = async () => {
    if (!msgInput.trim() || sendingMsg) return;
    try {
      setSendingMsg(true);
      await api.post('/messages', { message: msgInput.trim() });
      setMsgInput('');
      const msgsData = await api.get('/messages');
      setMessages(msgsData);
    } catch (err) { alert('Failed: ' + err.message); }
    finally { setSendingMsg(false); }
  };

  const handleMarkNotifsRead = async () => {
    await api.put('/notifications/read-all', {}).catch(() => {});
    setUnreadNotifs(0);
    setNotifications(n => n.map(x => ({ ...x, is_read: 1 })));
  };

  // Service Request Submit
  const handleSRSubmit = async (e) => {
    e.preventDefault();
    if (!srForm.service_type) return alert('Please select a service type.');
    if (!srForm.name || !srForm.email) return alert('Name and email are required.');

    try {
      setSubmittingSR(true);
      const details = {};

      // Build details based on service type
      if (srForm.service_type === 'visa') {
        Object.assign(details, {
          nationality: srForm.nationality, purpose: srForm.purpose,
          travelDate: srForm.travelDate, employment: srForm.employment,
          monthlyIncome: srForm.monthlyIncome, previousVisa: srForm.previousVisa,
          previousRejection: srForm.previousRejection,
        });
      } else if (srForm.service_type === 'flight') {
        Object.assign(details, {
          fromCity: srForm.fromCity, toCity: srForm.toCity,
          departDate: srForm.travelDate, returnDate: srForm.duration,
          passengers: srForm.travelers, flightClass: srForm.flightClass, tripType: srForm.tripType,
        });
      } else if (['holiday_package', 'hotel'].includes(srForm.service_type)) {
        Object.assign(details, {
          travelDate: srForm.travelDate, duration: srForm.duration,
          travelers: srForm.travelers, budget: srForm.budget,
        });
      } else {
        Object.assign(details, {
          travelDate: srForm.travelDate, travelers: srForm.travelers, budget: srForm.budget,
        });
      }

      if (srForm.notes) details.notes = srForm.notes;

      const result = await api.post('/service-requests', {
        name: srForm.name, email: srForm.email, phone: srForm.phone,
        service_type: srForm.service_type, country: srForm.country, details,
      });
      setSrSuccess(result.request);
      await loadPortalData();
    } catch (err) { alert('Failed: ' + err.message); }
    finally { setSubmittingSR(false); }
  };

  if (!user) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', paddingTop:'var(--nav-height)', flexDirection:'column', gap:16 }}>
        <AlertCircle size={48} color="#f59e0b"/>
        <h2 className="heading-3">Login Required</h2>
        <p className="text-muted">Please log in or register to access your portal.</p>
        <Link to="/login" className="btn btn-primary">Login / Register</Link>
      </div>
    );
  }

  const allDocs = visaApps.flatMap(v => (v.documents_json || []).map(d => ({ ...d, appRef: v.app_ref, country: v.country })));
  const serviceTypeLabel = (t) => ({ visa:'Visa Service', holiday_package:'Holiday Package', flight:'Flight Booking', hotel:'Hotel Booking', consultation:'Consultation', other:'Other' }[t] || t);
  const serviceTypeIcon = (t) => ({ visa:Shield, holiday_package:Globe, flight:Plane, hotel:Hotel, consultation:Phone, other:HelpCircle }[t] || ClipboardList);

  return (
    <div style={{ minHeight:'100vh', background:'var(--color-bg)', paddingTop:'var(--nav-height)' }}>
      <div style={{ display:'flex', maxWidth:1400, margin:'0 auto' }}>
        {/* Mobile toggle */}
        <button className="portal-mobile-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}><Menu size={20}/> <span>Menu</span></button>

        {/* Sidebar */}
        <aside className={`portal-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="portal-user-card">
            <div className="portal-avatar">{user.name?.[0] || 'U'}</div>
            <div style={{ fontWeight:600, fontSize:13 }}>{user.name}</div>
            <div className="text-muted" style={{ fontSize:11 }}>{user.email}</div>
          </div>
          <nav className="portal-nav">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); }}
                className={`portal-nav-item ${activeTab===tab.id ? 'active' : ''}`}>
                <tab.icon size={18}/>
                <span>{tab.label}</span>
                {tab.id === 'messages' && unreadMsgs > 0 && <span className="portal-badge">{unreadMsgs}</span>}
                {tab.id === 'notifications' && unreadNotifs > 0 && <span className="portal-badge">{unreadNotifs}</span>}
                {tab.id === 'my-requests' && serviceRequests.filter(r=>r.status==='new').length > 0 && <span className="portal-badge">{serviceRequests.filter(r=>r.status==='new').length}</span>}
              </button>
            ))}
            <div style={{ height:1, background:'var(--color-border)', margin:'8px 0' }}/>
            <button onClick={logout} className="portal-nav-item" style={{ color:'var(--color-danger)' }}>
              <LogOut size={18}/> <span>Sign Out</span>
            </button>
          </nav>
        </aside>
        {sidebarOpen && <div className="portal-overlay" onClick={() => setSidebarOpen(false)} />}

        {/* Content */}
        <main style={{ flex:1, padding:'24px 32px', minHeight:'calc(100vh - var(--nav-height))' }}>
          {loading ? (
            <div style={{ textAlign:'center', padding:'100px 0' }}><div className="portal-spinner"/><p className="text-muted" style={{ marginTop:16 }}>Loading your portal...</p></div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div key={activeTab} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} transition={{ duration:0.2 }}>

                {/* ===== DASHBOARD ===== */}
                {activeTab === 'dashboard' && (
                  <div>
                    <h1 className="heading-2" style={{ marginBottom:4 }}>Welcome back, {user.name?.split(' ')[0]}!</h1>
                    <p className="text-muted" style={{ marginBottom:24 }}>Here's an overview of your travel journey with us.</p>

                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:14, marginBottom:32 }}>
                      {[
                        { label:'Active Bookings', value:bookings.filter(b=>b.status!=='cancelled').length, icon:Package, color:'#0ea5e9' },
                        { label:'Visa Applications', value:visaApps.length, icon:FileText, color:'#d4a574' },
                        { label:'Service Requests', value:serviceRequests.length, icon:ClipboardList, color:'#6366f1' },
                        { label:'Documents', value:allDocs.length, icon:Upload, color:'#10b981' },
                        { label:'Unread Messages', value:unreadMsgs, icon:MessageSquare, color:'#f59e0b' },
                      ].map((s,i) => (
                        <div key={i} className="card" style={{ padding:16, display:'flex', alignItems:'center', gap:14 }}>
                          <div style={{ width:44, height:44, borderRadius:10, background:`${s.color}14`, color:s.color, display:'flex', alignItems:'center', justifyContent:'center' }}>
                            <s.icon size={20}/>
                          </div>
                          <div>
                            <div style={{ fontSize:22, fontWeight:800 }}>{s.value}</div>
                            <div className="text-muted" style={{ fontSize:11 }}>{s.label}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Quick Actions */}
                    <h3 className="heading-4" style={{ marginBottom:12 }}>Quick Actions</h3>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:10, marginBottom:32 }}>
                      <button className="portal-action-btn" onClick={() => setActiveTab('request-service')}>
                        <ClipboardList size={20} color="#6366f1"/> Request a Service <ArrowRight size={14}/>
                      </button>
                      <Link to="/holiday-packages" className="portal-action-btn">
                        <Globe size={20} color="#d4a574"/> Browse Packages <ArrowRight size={14}/>
                      </Link>
                      <button className="portal-action-btn" onClick={() => setActiveTab('messages')}>
                        <MessageSquare size={20} color="#10b981"/> Chat with Us <ArrowRight size={14}/>
                      </button>
                      <button className="portal-action-btn" onClick={() => setActiveTab('documents')}>
                        <Upload size={20} color="#0ea5e9"/> Upload Documents <ArrowRight size={14}/>
                      </button>
                    </div>

                    {/* Recent Activity */}
                    <h3 className="heading-4" style={{ marginBottom:12 }}>Recent Activity</h3>
                    <div className="card" style={{ overflow:'hidden' }}>
                      {[...bookings, ...visaApps, ...serviceRequests].length > 0 ? (
                        [...bookings, ...visaApps, ...serviceRequests].sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).slice(0,6).map((item,i,arr) => (
                          <div key={i} style={{ padding:'12px 18px', borderBottom:i<arr.length-1?'1px solid var(--color-border)':'none', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                            <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                              <div style={{ width:34, height:34, borderRadius:8, background:item.booking_ref?'#0ea5e914':item.app_ref?'#d4a57414':'#6366f114', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                {item.booking_ref ? <Package size={15} color="#0ea5e9"/> : item.app_ref ? <FileText size={15} color="#d4a574"/> : <ClipboardList size={15} color="#6366f1"/>}
                              </div>
                              <div>
                                <div style={{ fontWeight:600, fontSize:13 }}>{item.package_title || (item.country ? `Visa — ${item.country}` : serviceTypeLabel(item.service_type))}</div>
                                <div className="text-muted" style={{ fontSize:11 }}>Ref: {item.booking_ref || item.app_ref || item.ref} · {new Date(item.created_at).toLocaleDateString()}</div>
                              </div>
                            </div>
                            <StatusBadge status={item.status}/>
                          </div>
                        ))
                      ) : (
                        <div style={{ padding:40, textAlign:'center', color:'var(--color-text-muted)' }}>
                          <Globe size={32} style={{ marginBottom:8, opacity:0.3 }}/>
                          <p>No activity yet. Start your travel journey today!</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ===== MY BOOKINGS ===== */}
                {activeTab === 'bookings' && (
                  <div>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24, flexWrap:'wrap', gap:12 }}>
                      <h1 className="heading-2">My Bookings</h1>
                      <Link to="/holiday-packages" className="btn btn-primary btn-sm"><Plus size={14}/> Book New Package</Link>
                    </div>
                    {bookings.length > 0 ? bookings.map((b,i) => (
                      <div key={i} className="card" style={{ padding:20, marginBottom:14 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:14 }}>
                          <div style={{ flex:1 }}>
                            <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                              <span style={{ fontWeight:700, fontSize:16 }}>{b.package_title}</span>
                              <StatusBadge status={b.status}/>
                            </div>
                            <div className="text-muted" style={{ fontSize:12, marginTop:6, display:'flex', gap:14, flexWrap:'wrap' }}>
                              <span><Calendar size={13} style={{ verticalAlign:'middle', marginRight:4 }}/>{b.travel_date || 'TBD'}</span>
                              <span><UsersIcon size={13} style={{ verticalAlign:'middle', marginRight:4 }}/>{b.travelers} traveller(s)</span>
                              <span style={{ fontFamily:'monospace', opacity:0.6 }}>#{b.booking_ref}</span>
                            </div>
                          </div>
                          <div style={{ textAlign:'right' }}>
                            <div style={{ fontWeight:800, fontSize:18, color:'var(--color-primary)' }}>£{b.total_price?.toLocaleString()}</div>
                            <div style={{ fontSize:11, marginTop:4 }}>Payment: <StatusBadge status={b.payment_status}/></div>
                          </div>
                        </div>

                        {b.payment_status === 'pending' && b.status !== 'cancelled' && (
                          <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:14, padding:'12px 16px', background:'var(--color-bg)', borderRadius:8, flexWrap:'wrap' }}>
                            <div style={{ flex:1, minWidth:200 }}>
                              <div style={{ fontSize:13, fontWeight:600, marginBottom:3 }}>💳 Pay by Bank Transfer</div>
                              <div style={{ fontSize:11, color:'var(--color-text-muted)' }}>Use booking ref <strong>{b.booking_ref}</strong> as payment reference</div>
                            </div>
                            <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                              <input className="form-input" placeholder="Transaction ID" value={paymentRefs[b.id]||''} onChange={e => setPaymentRefs({...paymentRefs, [b.id]:e.target.value})} style={{ maxWidth:180, padding:'7px 12px', fontSize:13 }}/>
                              <button className="btn btn-primary btn-sm" onClick={() => handlePaymentSubmit(b.id)}><CheckCircle2 size={14}/> Submit</button>
                            </div>
                          </div>
                        )}
                        {b.payment_ref && (
                          <div style={{ marginTop:10, fontSize:12, color:'var(--color-text-muted)', background:'var(--color-bg)', padding:'8px 12px', borderRadius:8 }}>
                            ✅ Payment ref: <strong>{b.payment_ref}</strong>
                            {b.payment_status === 'paid' ? ' — Verified' : ' — Awaiting verification'}
                          </div>
                        )}
                        {!['cancelled','completed'].includes(b.status) && (
                          <div style={{ marginTop:10, display:'flex', justifyContent:'flex-end' }}>
                            <button className="btn btn-ghost btn-sm" style={{ color:'var(--color-danger)', fontSize:12 }} onClick={() => handleCancelBooking(b.id)}>Cancel Booking</button>
                          </div>
                        )}
                        <PortalCaseExtensions item={b} type="booking" loadPortalData={loadPortalData} />
                      </div>
                    )) : (
                      <div className="card" style={{ padding:50, textAlign:'center' }}>
                        <Package size={40} color="var(--color-text-muted)" style={{ marginBottom:12, opacity:0.3 }}/>
                        <h3 className="heading-4">No Bookings Yet</h3>
                        <p className="text-muted" style={{ fontSize:13, margin:'8px 0 20px' }}>Browse our holiday packages and book your dream trip.</p>
                        <Link to="/holiday-packages" className="btn btn-primary">Explore Packages</Link>
                      </div>
                    )}
                  </div>
                )}

                {/* ===== VISA APPLICATIONS ===== */}
                {activeTab === 'visa' && (
                  <div>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24, flexWrap:'wrap', gap:12 }}>
                      <h1 className="heading-2">Visa Applications</h1>
                      <button className="btn btn-primary btn-sm" onClick={() => { setSrForm(f=>({...f, service_type:'visa'})); setActiveTab('request-service'); }}><Plus size={14}/> New Application</button>
                    </div>
                    {visaApps.length > 0 ? visaApps.map((v,i) => {
                      const isLocked = v.status !== 'submitted' && v.edit_unlocked !== 1;
                      return (
                        <div key={i} className="card" style={{ padding:20, marginBottom:14 }}>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
                            <div>
                              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                                <Shield size={18} color="#0ea5e9"/>
                                <span style={{ fontWeight:700 }}>Schengen Visa — {v.country}</span>
                                <StatusBadge status={v.status}/>
                              </div>
                              <div className="text-muted" style={{ fontSize:12, marginTop:4 }}>
                                ID: {v.app_ref} · Applied: {new Date(v.created_at).toLocaleDateString()} · Purpose: {v.purpose}
                              </div>
                            </div>
                          </div>

                          {/* Progress Timeline */}
                          <div className="portal-timeline">
                            {['Submitted','In Review','Docs Complete','Decision'].map((step,j) => {
                              const done = 
                                (v.status==='approved'&&j<=3) || 
                                (v.status==='rejected'&&j<=3) || 
                                (v.status==='document_complete'&&j<=2) || 
                                (v.status==='in_review'&&j<=1) || 
                                j===0;
                              const isCurrent = 
                                (v.status==='submitted'&&j===0) || 
                                (v.status==='in_review'&&j===1) || 
                                (v.status==='document_complete'&&j===2) || 
                                ((v.status==='approved'||v.status==='rejected')&&j===3);
                              return (
                                <div key={j} className="portal-timeline-step">
                                  <div className={`portal-timeline-dot ${done?'done':''} ${isCurrent?'current':''} ${v.status==='rejected'&&j===3?'rejected':''}`}>
                                    {done ? '✓' : j+1}
                                  </div>
                                  <div style={{ fontSize:11, fontWeight:600, color:done?'var(--color-text)':'var(--color-text-muted)' }}>{step}</div>
                                  {j < 3 && <div className={`portal-timeline-line ${done?'done':''}`}/>}
                                </div>
                              );
                            })}
                          </div>

                          {/* Documents */}
                          <div style={{ marginTop:14, paddingTop:14, borderTop:'1px dashed var(--color-border)' }}>
                            
                            {/* Document Completion Status Banner */}
                            {(() => {
                              const docs = v.documents_json || [];
                              const requestedDocs = docs.filter(d => d.is_requested);
                              const approvedDocs = requestedDocs.filter(d => d.status === 'approved');
                              const isComplete = requestedDocs.length > 0 && requestedDocs.every(d => d.status === 'approved');
                              
                              if (requestedDocs.length > 0) {
                                return (
                                  <div style={{ 
                                    background: isComplete ? 'rgba(16, 185, 129, 0.05)' : 'rgba(245, 158, 11, 0.05)',
                                    border: `1px dashed ${isComplete ? 'var(--color-success)' : 'var(--color-warning)'}`,
                                    borderRadius: 8,
                                    padding: '10px 14px',
                                    marginBottom: 16,
                                    fontSize: 12,
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                  }}>
                                    <div>
                                      <span style={{ fontWeight: 700 }}>
                                        {isComplete ? '🎉 All Documents Complete' : '⚠️ Action Required: Document Checklist'}
                                      </span>
                                      <div className="text-muted" style={{ fontSize: 11, marginTop: 2 }}>
                                        {isComplete 
                                          ? 'All requested documents have been approved by your visa agent.' 
                                          : `${approvedDocs.length} of ${requestedDocs.length} requested documents approved.`
                                        }
                                      </div>
                                    </div>
                                    <span style={{ 
                                      fontWeight: 700, 
                                      color: isComplete ? 'var(--color-success)' : 'var(--color-warning)',
                                      fontSize: 11
                                    }}>
                                      {isComplete ? 'COMPLETE' : 'PENDING REVIEW'}
                                    </span>
                                  </div>
                                );
                              }
                              return null;
                            })()}

                            <h4 style={{ fontSize:13, fontWeight:600, marginBottom:12, display:'flex', alignItems:'center', gap:6 }}><Upload size={14}/> Documents Checklist</h4>
                            
                            {(() => {
                              const docs = v.documents_json || [];
                              const genericDocs = docs.filter(d => !d.is_requested);
                              const requestedDocs = docs.filter(d => d.is_requested);
                              const passportDocs = requestedDocs.filter(d => d.name && d.name.toLowerCase().includes('passport'));
                              const otherChecklistDocs = requestedDocs.filter(d => !d.name || !d.name.toLowerCase().includes('passport'));

                              return (
                                <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:12 }}>
                                  {/* Passport Upload Section */}
                                  {passportDocs.length > 0 && (
                                    <div>
                                      <div style={{ fontSize:11, fontWeight:700, color:'var(--color-text-secondary)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.03em', display:'flex', alignItems:'center', gap:4 }}>
                                        <Shield size={12} color="#0ea5e9"/> Passport Section
                                      </div>
                                      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                                        {passportDocs.map((doc, dIdx) => (
                                          <div key={`pass-${dIdx}`} style={{ 
                                            background: 'rgba(14, 165, 233, 0.03)', 
                                            padding: '12px 14px', 
                                            borderRadius: 8, 
                                            display: 'flex', 
                                            justifyContent: 'space-between', 
                                            alignItems: 'center',
                                            border: '1px solid rgba(14, 165, 233, 0.15)'
                                          }}>
                                            <div style={{ fontSize: 12 }}>
                                              <div style={{ fontWeight: 700, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                                {doc.name}
                                                <span style={{ fontSize: 10, background: 'rgba(14, 165, 233, 0.08)', color: '#0ea5e9', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                                                  👤 {doc.traveler_name || 'Primary Applicant'}
                                                </span>
                                              </div>
                                              {doc.filename && (
                                                <a href={doc.url} target="_blank" rel="noreferrer" style={{ fontSize:11, color:'var(--color-secondary)', display:'inline-block', marginTop:2, fontWeight:600 }}>
                                                  Uploaded: {doc.filename}
                                                </a>
                                              )}
                                              {doc.feedback && doc.status === 'rejected' && (
                                                <div style={{ fontSize: 11, color: 'var(--color-danger)', marginTop: 2 }}>
                                                  Feedback: {doc.feedback}
                                                </div>
                                              )}
                                            </div>
                                            <div>
                                              {['pending_upload', 'rejected'].includes(doc.status) ? (
                                                isLocked ? (
                                                  <span style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                                    🔒 Locked
                                                  </span>
                                                ) : (
                                                  <label className="btn btn-outline btn-sm" style={{ cursor:'pointer', padding:'4px 10px', fontSize:11, borderColor:'#0ea5e9', color:'#0ea5e9' }}>
                                                    <Upload size={12}/> {uploadingDoc ? '...' : (doc.status === 'rejected' ? 'Re-upload' : 'Upload Passport')}
                                                    <input type="file" disabled={uploadingDoc} onChange={(e) => handleDocumentUpload(e, v.id, doc.id)} style={{ display:'none' }} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"/>
                                                  </label>
                                                )
                                              ) : (
                                                <StatusBadge status={doc.status} />
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Other Required Documents */}
                                  {otherChecklistDocs.length > 0 && (
                                    <div>
                                      <div style={{ fontSize:11, fontWeight:700, color:'var(--color-text-secondary)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.03em', display:'flex', alignItems:'center', gap:4 }}>
                                        <FileText size={12} color="#6366f1"/> Other Required Documents
                                      </div>
                                      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                                        {otherChecklistDocs.map((doc, dIdx) => (
                                          <div key={`other-${dIdx}`} style={{ 
                                            background: 'var(--color-bg-alt)', 
                                            padding: 10, 
                                            borderRadius: 8, 
                                            display: 'flex', 
                                            justifyContent: 'space-between', 
                                            alignItems: 'center',
                                            border: '1px solid var(--color-border)'
                                          }}>
                                            <div style={{ fontSize: 12 }}>
                                              <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                                {doc.name}
                                                <span style={{ fontSize: 10, background: 'rgba(14, 165, 233, 0.08)', color: '#0ea5e9', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                                                  👤 {doc.traveler_name || 'Primary Applicant'}
                                                </span>
                                              </div>
                                              {doc.filename && (
                                                <a href={doc.url} target="_blank" rel="noreferrer" style={{ fontSize:11, color:'var(--color-secondary)', display:'inline-block', marginTop:2 }}>
                                                  Uploaded: {doc.filename}
                                                </a>
                                              )}
                                              {doc.feedback && doc.status === 'rejected' && (
                                                <div style={{ fontSize: 11, color: 'var(--color-danger)', marginTop: 2 }}>
                                                  Feedback: {doc.feedback}
                                                </div>
                                              )}
                                            </div>
                                            <div>
                                              {['pending_upload', 'rejected'].includes(doc.status) ? (
                                                isLocked ? (
                                                  <span style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                                    🔒 Locked
                                                  </span>
                                                ) : (
                                                  <label className="btn btn-outline btn-sm" style={{ cursor:'pointer', padding:'3px 8px', fontSize:11 }}>
                                                    <Upload size={12}/> {uploadingDoc ? '...' : (doc.status === 'rejected' ? 'Re-upload' : 'Upload')}
                                                    <input type="file" disabled={uploadingDoc} onChange={(e) => handleDocumentUpload(e, v.id, doc.id)} style={{ display:'none' }} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"/>
                                                  </label>
                                                )
                                              ) : (
                                                <StatusBadge status={doc.status} />
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Generic list */}
                                  {genericDocs.length > 0 && (
                                    <div>
                                      <div style={{ fontSize:11, fontWeight:700, color:'var(--color-text-secondary)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.03em' }}>Supporting Documents</div>
                                      <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                                        {genericDocs.map((doc, dIdx) => (
                                          <a key={`gen-${dIdx}`} href={doc.url} target="_blank" rel="noreferrer" className="portal-doc-chip" style={{ background:'var(--color-bg)', padding:'6px 10px', borderRadius:20, fontSize:12, textDecoration:'none', color:'var(--color-text)', border:'1px solid var(--color-border)', display:'inline-flex', alignItems:'center', gap:4 }}>
                                            <CheckCircle2 size={12} color="#10b981"/> {doc.filename}
                                          </a>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}

                            {!isLocked ? (
                              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                                <label className="btn btn-outline btn-sm" style={{ cursor:'pointer' }}>
                                  <Upload size={14}/> {uploadingDoc ? 'Uploading...' : 'Upload General Doc'}
                                  <input type="file" disabled={uploadingDoc} onChange={(e) => handleDocumentUpload(e, v.id)} style={{ display:'none' }} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"/>
                                </label>
                                <span style={{ fontSize:11, color:'var(--color-text-muted)' }}>PDF, JPG, PNG · Max 10MB</span>
                              </div>
                            ) : (
                              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                                🔒 Uploading documents is locked for this application.
                              </div>
                            )}
                          </div>

                          <PortalCaseExtensions item={v} type="visa" loadPortalData={loadPortalData} />
                        </div>
                      );
                    }) : (
                      <div className="card" style={{ padding:50, textAlign:'center' }}>
                        <Shield size={40} color="var(--color-text-muted)" style={{ marginBottom:12, opacity:0.3 }}/>
                        <h3 className="heading-4">No Visa Applications</h3>
                        <p className="text-muted" style={{ fontSize:13, margin:'8px 0 20px' }}>Apply for your Schengen visa right here in the portal.</p>
                        <button className="btn btn-primary" onClick={() => { setSrForm(f=>({...f, service_type:'visa'})); setActiveTab('request-service'); }}>Start Application</button>
                      </div>
                    )}
                  </div>
                )}

                {/* ===== REQUEST A SERVICE ===== */}
                {activeTab === 'request-service' && (
                  <div>
                    <h1 className="heading-2" style={{ marginBottom:4 }}>Request a Service</h1>
                    <p className="text-muted" style={{ marginBottom:24 }}>Tell us what you need and our team will get back to you within 24 hours.</p>

                    {srSuccess ? (
                      <div className="card" style={{ padding:40, textAlign:'center' }}>
                        <CheckCircle2 size={56} color="#10b981" style={{ marginBottom:16 }}/>
                        <h2 className="heading-3">Request Submitted!</h2>
                        <p className="text-muted" style={{ margin:'8px auto 16px', maxWidth:450 }}>
                          Your request <strong>{srSuccess.ref}</strong> has been submitted. Our team will review it within 24 hours.
                        </p>
                        <div style={{ display:'flex', gap:12, justifyContent:'center' }}>
                          <button className="btn btn-primary" onClick={() => { setSrSuccess(null); setActiveTab('my-requests'); }}>View Requests</button>
                          <button className="btn btn-outline" onClick={() => setSrSuccess(null)}>Submit Another</button>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleSRSubmit}>
                        {/* Step 1: Service Type */}
                        <div className="card" style={{ padding:20, marginBottom:16 }}>
                          <h3 style={{ fontSize:15, fontWeight:700, marginBottom:16 }}>🎯 What do you need?</h3>
                          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', gap:10 }}>
                            {[
                              { id:'visa', label:'Visa Service', icon:Shield, color:'#0ea5e9' },
                              { id:'holiday_package', label:'Holiday Package', icon:Globe, color:'#10b981' },
                              { id:'flight', label:'Flight Booking', icon:Plane, color:'#6366f1' },
                              { id:'hotel', label:'Hotel Booking', icon:Hotel, color:'#d4a574' },
                              { id:'consultation', label:'Consultation', icon:Phone, color:'#f59e0b' },
                              { id:'other', label:'Other', icon:HelpCircle, color:'#94a3b8' },
                            ].map(s => (
                              <button type="button" key={s.id} onClick={() => setSrForm({...srForm, service_type:s.id})} style={{
                                padding:'16px 14px', borderRadius:10, border:`2px solid ${srForm.service_type===s.id ? s.color : 'var(--color-border)'}`,
                                background:srForm.service_type===s.id ? `${s.color}08` : 'var(--color-surface)',
                                cursor:'pointer', textAlign:'center', transition:'all 0.2s'
                              }}>
                                <s.icon size={24} color={s.color} style={{ marginBottom:6 }}/>
                                <div style={{ fontWeight:600, fontSize:12 }}>{s.label}</div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {srForm.service_type && (
                          <div className="card" style={{ padding:20, marginBottom:16 }}>
                            <h3 style={{ fontSize:15, fontWeight:700, marginBottom:16 }}>📝 Details</h3>
                            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                              {/* Country selector (visa, holiday, hotel) */}
                              {['visa','holiday_package','hotel'].includes(srForm.service_type) && (
                                <div className="form-group">
                                  <label className="form-label">Destination Country {srForm.service_type==='visa'?'*':''}</label>
                                  <select className="form-input form-select" value={srForm.country} onChange={e=>setSrForm({...srForm,country:e.target.value})} required={srForm.service_type==='visa'}>
                                    <option value="">Select country...</option>
                                    {countries.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                  </select>
                                </div>
                              )}

                              {/* Visa-specific fields */}
                              {srForm.service_type === 'visa' && (<>
                                <div className="form-group">
                                  <label className="form-label">Your Nationality *</label>
                                  <input className="form-input" placeholder="e.g. Pakistani, Indian" value={srForm.nationality} onChange={e=>setSrForm({...srForm,nationality:e.target.value})} required/>
                                </div>
                                <div className="form-group">
                                  <label className="form-label">Purpose of Visit</label>
                                  <select className="form-input form-select" value={srForm.purpose} onChange={e=>setSrForm({...srForm,purpose:e.target.value})}>
                                    {['tourism','business','family','medical','study'].map(p=><option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
                                  </select>
                                </div>
                                <div className="form-group">
                                  <label className="form-label">Planned Travel Date</label>
                                  <input className="form-input" type="date" value={srForm.travelDate} onChange={e=>setSrForm({...srForm,travelDate:e.target.value})}/>
                                </div>
                                <div className="form-group">
                                  <label className="form-label">Employment Status</label>
                                  <select className="form-input form-select" value={srForm.employment} onChange={e=>setSrForm({...srForm,employment:e.target.value})}>
                                    {['employed','self-employed','student','retired','unemployed'].map(e=><option key={e} value={e}>{e.charAt(0).toUpperCase()+e.slice(1)}</option>)}
                                  </select>
                                </div>
                                <div className="form-group">
                                  <label className="form-label">Monthly Income (GBP)</label>
                                  <input className="form-input" type="number" placeholder="e.g. 2500" value={srForm.monthlyIncome} onChange={e=>setSrForm({...srForm,monthlyIncome:e.target.value})}/>
                                </div>
                                <div className="form-group">
                                  <label className="form-label">Previous Schengen Visa?</label>
                                  <select className="form-input form-select" value={srForm.previousVisa} onChange={e=>setSrForm({...srForm,previousVisa:e.target.value})}>
                                    <option value="yes">Yes</option><option value="no">No</option>
                                  </select>
                                </div>
                                <div className="form-group">
                                  <label className="form-label">Any Previous Rejection?</label>
                                  <select className="form-input form-select" value={srForm.previousRejection} onChange={e=>setSrForm({...srForm,previousRejection:e.target.value})}>
                                    <option value="no">No</option><option value="yes">Yes</option>
                                  </select>
                                </div>
                              </>)}

                              {/* Flight-specific fields */}
                              {srForm.service_type === 'flight' && (<>
                                <div className="form-group">
                                  <label className="form-label">From City *</label>
                                  <input className="form-input" placeholder="e.g. London" value={srForm.fromCity} onChange={e=>setSrForm({...srForm,fromCity:e.target.value})} required/>
                                </div>
                                <div className="form-group">
                                  <label className="form-label">To City *</label>
                                  <input className="form-input" placeholder="e.g. Paris" value={srForm.toCity} onChange={e=>setSrForm({...srForm,toCity:e.target.value})} required/>
                                </div>
                                <div className="form-group">
                                  <label className="form-label">Departure Date *</label>
                                  <input className="form-input" type="date" value={srForm.travelDate} onChange={e=>setSrForm({...srForm,travelDate:e.target.value})} required/>
                                </div>
                                <div className="form-group">
                                  <label className="form-label">Return Date</label>
                                  <input className="form-input" type="date" value={srForm.duration} onChange={e=>setSrForm({...srForm,duration:e.target.value})}/>
                                </div>
                                <div className="form-group">
                                  <label className="form-label">Passengers</label>
                                  <input className="form-input" type="number" min="1" value={srForm.travelers} onChange={e=>setSrForm({...srForm,travelers:e.target.value})}/>
                                </div>
                                <div className="form-group">
                                  <label className="form-label">Class</label>
                                  <select className="form-input form-select" value={srForm.flightClass} onChange={e=>setSrForm({...srForm,flightClass:e.target.value})}>
                                    {['economy','premium_economy','business','first'].map(c=><option key={c} value={c}>{c.replace('_',' ').split(' ').map(w=>w[0].toUpperCase()+w.slice(1)).join(' ')}</option>)}
                                  </select>
                                </div>
                                <div className="form-group">
                                  <label className="form-label">Trip Type</label>
                                  <select className="form-input form-select" value={srForm.tripType} onChange={e=>setSrForm({...srForm,tripType:e.target.value})}>
                                    <option value="return">Return</option><option value="one_way">One Way</option><option value="multi_city">Multi City</option>
                                  </select>
                                </div>
                              </>)}

                              {/* Package/Hotel fields */}
                              {['holiday_package','hotel'].includes(srForm.service_type) && (<>
                                <div className="form-group">
                                  <label className="form-label">Travel Date</label>
                                  <input className="form-input" type="date" value={srForm.travelDate} onChange={e=>setSrForm({...srForm,travelDate:e.target.value})}/>
                                </div>
                                <div className="form-group">
                                  <label className="form-label">Duration</label>
                                  <input className="form-input" placeholder="e.g. 5 days" value={srForm.duration} onChange={e=>setSrForm({...srForm,duration:e.target.value})}/>
                                </div>
                                <div className="form-group">
                                  <label className="form-label">Travellers</label>
                                  <input className="form-input" type="number" min="1" value={srForm.travelers} onChange={e=>setSrForm({...srForm,travelers:e.target.value})}/>
                                </div>
                                <div className="form-group">
                                  <label className="form-label">Budget (£)</label>
                                  <input className="form-input" type="number" placeholder="e.g. 1500" value={srForm.budget} onChange={e=>setSrForm({...srForm,budget:e.target.value})}/>
                                </div>
                              </>)}

                              {/* Consultation / Other minimal fields */}
                              {['consultation','other'].includes(srForm.service_type) && (
                                <div className="form-group" style={{ gridColumn:'span 2' }}>
                                  <label className="form-label">What do you need help with?</label>
                                  <textarea className="form-input form-textarea" placeholder="Describe what you're looking for..." value={srForm.notes} onChange={e=>setSrForm({...srForm,notes:e.target.value})} rows={4}/>
                                </div>
                              )}
                            </div>

                            {/* Common notes field (except consultation/other which already have it) */}
                            {!['consultation','other'].includes(srForm.service_type) && (
                              <div className="form-group" style={{ marginTop:14 }}>
                                <label className="form-label">Additional Notes</label>
                                <textarea className="form-input form-textarea" placeholder="Any special requirements or preferences..." value={srForm.notes} onChange={e=>setSrForm({...srForm,notes:e.target.value})} rows={3}/>
                              </div>
                            )}
                          </div>
                        )}

                        {srForm.service_type && (
                          <div style={{ display:'flex', gap:12, alignItems:'center', marginTop:4 }}>
                            <button type="submit" className="btn btn-primary btn-lg" disabled={submittingSR}>
                              {submittingSR ? 'Submitting...' : <><Send size={16}/> Submit Request</>}
                            </button>
                            <span style={{ fontSize:12, color:'var(--color-text-muted)' }}>Free consultation included · No fees until you proceed</span>
                          </div>
                        )}
                      </form>
                    )}
                  </div>
                )}

                {/* ===== MY REQUESTS ===== */}
                {activeTab === 'my-requests' && (
                  <div>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24, flexWrap:'wrap', gap:12 }}>
                      <h1 className="heading-2">My Requests ({serviceRequests.length})</h1>
                      <button className="btn btn-primary btn-sm" onClick={() => setActiveTab('request-service')}><Plus size={14}/> New Request</button>
                    </div>
                    {serviceRequests.length > 0 ? serviceRequests.map((sr,i) => {
                      const Icon = serviceTypeIcon(sr.service_type);
                      const steps = ['Submitted','Accepted','In Progress','Completed'];
                      const statusToStep = { new:0, accepted:1, in_progress:2, completed:3, rejected:3 };
                      const currentStep = statusToStep[sr.status] ?? 0;
                      return (
                        <div key={i} className="card" style={{ padding:20, marginBottom:14 }}>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
                            <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                              <div style={{ width:40, height:40, borderRadius:10, background:'#6366f114', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                <Icon size={18} color="#6366f1"/>
                              </div>
                              <div>
                                <div style={{ fontWeight:700, fontSize:14 }}>{serviceTypeLabel(sr.service_type)} {sr.country && `— ${sr.country}`}</div>
                                <div className="text-muted" style={{ fontSize:11 }}>Ref: {sr.ref} · {new Date(sr.created_at).toLocaleDateString()}</div>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                              <StatusBadge status={sr.status}/>
                              {sr.status === 'new' && (
                                <button 
                                  className="btn btn-outline btn-sm" 
                                  style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)', padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}
                                  onClick={() => handleCancelRequest(sr.id)}
                                >
                                  Cancel Request
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Progress bar */}
                          {sr.status !== 'rejected' && (
                            <div style={{ display:'flex', alignItems:'center', gap:0, marginTop:16, padding:'0 4px' }}>
                              {steps.map((step,j) => (
                                <div key={j} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', position:'relative' }}>
                                  <div style={{
                                    width:26, height:26, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                                    fontSize:11, fontWeight:700, zIndex:1,
                                    background: j <= currentStep ? '#6366f1' : 'var(--color-border)',
                                    color: j <= currentStep ? 'white' : 'var(--color-text-muted)',
                                  }}>{j <= currentStep ? '✓' : j+1}</div>
                                  <div style={{ fontSize:10, marginTop:4, fontWeight:600, color: j<=currentStep ? 'var(--color-text)' : 'var(--color-text-muted)' }}>{step}</div>
                                  {j < steps.length - 1 && (
                                    <div style={{ position:'absolute', top:13, left:'50%', width:'100%', height:2, background: j < currentStep ? '#6366f1' : 'var(--color-border)', zIndex:0 }}/>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          {sr.status === 'rejected' && (
                            <div style={{ marginTop:12, padding:'8px 14px', background:'#ef444414', borderRadius:8, fontSize:13, color:'#ef4444', fontWeight:600 }}>
                              ❌ This request was declined. Please contact support for more details.
                            </div>
                          )}
                        </div>
                      );
                    }) : (
                      <div className="card" style={{ padding:50, textAlign:'center' }}>
                        <ClipboardList size={40} color="var(--color-text-muted)" style={{ marginBottom:12, opacity:0.3 }}/>
                        <h3 className="heading-4">No Requests Yet</h3>
                        <p className="text-muted" style={{ fontSize:13, margin:'8px 0 20px' }}>Submit a service request and track its progress here.</p>
                        <button className="btn btn-primary" onClick={() => setActiveTab('request-service')}>Request a Service</button>
                      </div>
                    )}
                  </div>
                )}

                {/* ===== DOCUMENTS ===== */}
                {activeTab === 'documents' && (
                  <div>
                    <h1 className="heading-2" style={{ marginBottom:24 }}>My Documents</h1>
                    {allDocs.length > 0 ? (
                      <div className="card" style={{ overflow:'hidden' }}>
                        <table style={{ width:'100%', borderCollapse:'collapse' }}>
                          <thead>
                            <tr style={{ background:'var(--color-bg)' }}>
                              {['File Name','Application','Country','Actions'].map(h => (
                                <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:11, fontWeight:600, color:'var(--color-text-muted)', textTransform:'uppercase' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {allDocs.map((doc,i) => (
                              <tr key={i} style={{ borderTop:'1px solid var(--color-border)' }}>
                                <td style={{ padding:'12px 16px', fontSize:13, display:'flex', alignItems:'center', gap:8 }}>
                                  <FileText size={16} color="#0ea5e9"/> {doc.filename}
                                </td>
                                <td style={{ padding:'12px 16px', fontSize:13, fontFamily:'monospace' }}>{doc.appRef}</td>
                                <td style={{ padding:'12px 16px', fontSize:13 }}>{doc.country}</td>
                                <td style={{ padding:'12px 16px' }}>
                                  <a href={doc.url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm"><Eye size={14}/> View</a>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="card" style={{ padding:50, textAlign:'center', border:'2px dashed var(--color-border)' }}>
                        <Upload size={48} color="var(--color-text-muted)" style={{ marginBottom:12, opacity:0.3 }}/>
                        <h3 className="heading-4">No Documents Uploaded</h3>
                        <p className="text-muted" style={{ fontSize:13, margin:'8px auto 20px', maxWidth:400 }}>
                          Upload documents from the <strong>Visa Applications</strong> tab.
                        </p>
                        <button className="btn btn-outline" onClick={() => setActiveTab('visa')}>Go to Visa Applications</button>
                      </div>
                    )}
                  </div>
                )}

                {/* ===== SUPPORT CHAT ===== */}
                {activeTab === 'messages' && (
                  <div>
                    <h1 className="heading-2" style={{ marginBottom:24 }}>Support Chat</h1>
                    <div className="card" style={{ overflow:'hidden', display:'flex', flexDirection:'column', height:500 }}>
                      <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--color-border)', display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:34, height:34, borderRadius:'50%', background:'linear-gradient(135deg,#0ea5e9,#06b6d4)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <MessageSquare size={15} color="white"/>
                        </div>
                        <div>
                          <div style={{ fontWeight:600, fontSize:13 }}>
                            {user.assigned_name ? `Support (Agent: ${user.assigned_name})` : 'Borderless Trips Support'}
                          </div>
                          <div style={{ fontSize:11, color:'#10b981', display:'flex', alignItems:'center', gap:4 }}>
                            <span style={{ width:6, height:6, borderRadius:'50%', background:'#10b981', display:'inline-block' }}/> Online
                          </div>
                        </div>
                      </div>
                      <div style={{ flex:1, overflowY:'auto', padding:16, display:'flex', flexDirection:'column', gap:12, background:'var(--color-bg)' }}>
                        {messages.length === 0 && (
                          <div style={{ textAlign:'center', padding:'40px 20px', color:'var(--color-text-muted)' }}>
                            <MessageSquare size={32} style={{ opacity:0.3, marginBottom:8 }}/>
                            <p style={{ fontSize:13 }}>No messages yet. Start a conversation!</p>
                          </div>
                        )}
                        {messages.map((msg,i) => {
                          const isSelf = msg.sender === 'customer';
                          return (
                            <div key={i} style={{ display:'flex', justifyContent:isSelf?'flex-end':'flex-start', gap:8, alignItems:'flex-start' }}>
                              {!isSelf && (
                                <div style={{ width:28, height:28, borderRadius:'50%', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:10, flexShrink:0, marginTop:2 }}>
                                  {user.assigned_name?.[0] || 'A'}
                                </div>
                              )}
                              <div style={{
                                maxWidth:'70%', padding:'10px 14px', borderRadius:14, fontSize:13, lineHeight:1.5,
                                background:isSelf?'linear-gradient(135deg, #0ea5e9, #0284c7)':'var(--color-surface)',
                                color:isSelf?'white':'var(--color-text)',
                                boxShadow:'0 1px 2px rgba(0,0,0,0.05)',
                                border:isSelf?'none':'1px solid var(--color-border)',
                                borderBottomRightRadius:isSelf?4:14,
                                borderBottomLeftRadius:isSelf?14:4,
                              }}>
                                {msg.message}
                                <div style={{ fontSize:10, opacity:0.6, marginTop:4, textAlign:'right' }}>
                                  {new Date(msg.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                </div>
                              </div>
                              {isSelf && (
                                <div style={{ width:28, height:28, borderRadius:'50%', background:'linear-gradient(135deg,#0ea5e9,#06b6d4)', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:10, flexShrink:0, marginTop:2 }}>
                                  {user.name?.[0] || 'C'}
                                </div>
                              )}
                            </div>
                          );
                        })}
                        <div ref={msgEndRef}/>
                      </div>
                      <div style={{ display:'flex', gap:6, padding:'8px 12px', borderTop:'1px solid var(--color-border)' }}>
                        <input
                          className="form-input"
                          placeholder="Type your message..."
                          value={msgInput}
                          onChange={e => setMsgInput(e.target.value)}
                          onKeyDown={e => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }}}
                          style={{ flex:1, border:'none', background:'transparent', padding:'8px 14px' }}
                        />
                        <button className="btn btn-primary btn-icon" onClick={handleSendMessage} disabled={sendingMsg || !msgInput.trim()} style={{ flexShrink:0, width:40, height:40 }}>
                          <Send size={16}/>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ===== NOTIFICATIONS ===== */}
                {activeTab === 'notifications' && (
                  <div>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
                      <h1 className="heading-2">Notifications</h1>
                      {notifications.some(n => !n.is_read) && (
                        <button className="btn btn-ghost btn-sm" onClick={handleMarkNotifsRead}>Mark all as read</button>
                      )}
                    </div>
                    {notifications.length > 0 ? (
                      <div className="card" style={{ overflow:'hidden' }}>
                        {notifications.map((n,i) => (
                          <div key={i} style={{
                            padding:'14px 18px', borderBottom:i<notifications.length-1?'1px solid var(--color-border)':'none',
                            display:'flex', gap:12, alignItems:'flex-start',
                            background:n.is_read ? 'transparent' : 'rgba(14,165,233,0.03)'
                          }}>
                            <div style={{ width:34, height:34, borderRadius:'50%', background:n.is_read?'var(--color-bg)':'#0ea5e914', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                              <Bell size={15} color={n.is_read?'var(--color-text-muted)':'#0ea5e9'}/>
                            </div>
                            <div style={{ flex:1 }}>
                              <div style={{ fontWeight:n.is_read?400:600, fontSize:13 }}>{n.title}</div>
                              <div className="text-muted" style={{ fontSize:12, marginTop:2 }}>{n.message}</div>
                              <div className="text-muted" style={{ fontSize:11, marginTop:4 }}>{new Date(n.created_at).toLocaleString()}</div>
                            </div>
                            {!n.is_read && <span style={{ width:8, height:8, borderRadius:'50%', background:'#0ea5e9', flexShrink:0, marginTop:6 }}/>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="card" style={{ padding:50, textAlign:'center' }}>
                        <Bell size={40} color="var(--color-text-muted)" style={{ opacity:0.3, marginBottom:12 }}/>
                        <h3 className="heading-4">No Notifications</h3>
                        <p className="text-muted" style={{ fontSize:13 }}>You're all caught up!</p>
                      </div>
                    )}
                  </div>
                )}

                {/* ===== PROFILE ===== */}
                {activeTab === 'profile' && (
                  <div>
                    <h1 className="heading-2" style={{ marginBottom:24 }}>Profile Settings</h1>
                    <div className="card" style={{ padding:24 }}>
                      <form onSubmit={handleProfileSubmit}>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                          <div className="form-group"><label className="form-label">Full Name</label><input className="form-input" value={profileForm.name} onChange={e => setProfileForm({...profileForm, name:e.target.value})} required/></div>
                          <div className="form-group"><label className="form-label">Email Address</label><input className="form-input" defaultValue={user.email} disabled style={{ opacity:0.6 }}/></div>
                          <div className="form-group"><label className="form-label">Phone Number</label><input className="form-input" value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone:e.target.value})} placeholder="+44 xxx xxx xxxx"/></div>
                          <div className="form-group"><label className="form-label">Nationality</label><input className="form-input" value={profileForm.nationality} onChange={e => setProfileForm({...profileForm, nationality:e.target.value})} placeholder="e.g. British, Pakistani"/></div>
                        </div>
                        <div style={{ marginTop:20, display:'flex', alignItems:'center', gap:12 }}>
                          <button type="submit" className="btn btn-primary">Save Changes</button>
                          {profileSaved && <span style={{ color:'#10b981', fontSize:13, fontWeight:600 }}>✓ Profile updated!</span>}
                        </div>
                      </form>
                    </div>

                    <div className="card" style={{ padding:24, marginTop:20 }}>
                      <h3 style={{ fontSize:15, fontWeight:700, marginBottom:12, color:'var(--color-danger)' }}>Danger Zone</h3>
                      <p className="text-muted" style={{ fontSize:13, marginBottom:12 }}>Logging out will clear your session.</p>
                      <button className="btn btn-outline" style={{ borderColor:'var(--color-danger)', color:'var(--color-danger)' }} onClick={logout}><LogOut size={14}/> Sign Out</button>
                    </div>
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          )}
        </main>
      </div>

      <style>{`
        @keyframes spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
        .portal-spinner { width:36px; height:36px; border:3px solid var(--color-border); border-top:3px solid var(--color-secondary); border-radius:50%; animation:spin 1s linear infinite; margin:0 auto; }
        .portal-mobile-toggle { display:none; position:fixed; bottom:85px; left:20px; right:auto; z-index:var(--z-widget); background:var(--color-secondary); color:white; border:none; border-radius:var(--radius-full); padding:12px 20px; font-weight:600; font-size:13px; box-shadow:var(--shadow-lg); cursor:pointer; gap:8px; align-items:center; }
        .portal-sidebar { width:240px; background:var(--color-surface); border-right:1px solid var(--color-border); min-height:calc(100vh - var(--nav-height)); position:sticky; top:var(--nav-height); flex-shrink:0; overflow-y:auto; max-height:calc(100vh - var(--nav-height)); }
        .portal-user-card { padding:20px 16px; text-align:center; border-bottom:1px solid var(--color-border); }
        .portal-avatar { width:48px; height:48px; border-radius:50%; background:linear-gradient(135deg,#0ea5e9,#06b6d4); color:white; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:18px; margin:0 auto 8px; }
        .portal-nav { padding:8px; display:flex; flex-direction:column; gap:2px; }
        .portal-nav-item { display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:8px; font-size:13px; cursor:pointer; border:none; width:100%; text-align:left; transition:all 0.15s; background:transparent; color:var(--color-text-muted); font-weight:400; }
        .portal-nav-item.active { background:#0ea5e90a; color:var(--color-secondary); font-weight:600; }
        .portal-nav-item:hover { background:var(--color-bg); color:var(--color-text); }
        .portal-badge { margin-left:auto; background:#ef4444; color:white; font-size:10px; font-weight:700; min-width:18px; height:18px; border-radius:9px; display:flex; align-items:center; justify-content:center; padding:0 5px; }
        .portal-overlay { display:none; }
        .portal-action-btn { display:flex; align-items:center; gap:10px; padding:14px 16px; background:var(--color-surface); border:1px solid var(--color-border); border-radius:10px; cursor:pointer; font-size:13px; font-weight:600; color:var(--color-text); transition:all 0.2s; text-decoration:none; }
        .portal-action-btn:hover { border-color:var(--color-secondary); background:#0ea5e906; }
        .portal-doc-chip { display:inline-flex; align-items:center; gap:5px; padding:5px 10px; background:var(--color-bg); border:1px solid var(--color-border); border-radius:6px; font-size:12px; color:var(--color-text); text-decoration:none; }
        .portal-doc-chip:hover { border-color:var(--color-secondary); }
        .portal-timeline { display:flex; align-items:center; gap:0; margin-top:16px; padding:0 20px; }
        .portal-timeline-step { display:flex; flex-direction:column; align-items:center; position:relative; flex:1; }
        .portal-timeline-dot { width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; background:var(--color-border); color:var(--color-text-muted); z-index:1; }
        .portal-timeline-dot.done { background:#10b981; color:white; }
        .portal-timeline-dot.current { box-shadow:0 0 0 4px #10b98130; }
        .portal-timeline-dot.rejected { background:#ef4444; color:white; box-shadow:0 0 0 4px #ef444430; }
        .portal-timeline-line { position:absolute; top:14px; left:50%; width:100%; height:2px; background:var(--color-border); z-index:0; }
        .portal-timeline-line.done { background:#10b981; }
        @media(max-width:768px) {
          .portal-mobile-toggle { display:flex; }
          .portal-sidebar { position:fixed; left:-100%; top:var(--nav-height); bottom:0; z-index:var(--z-modal); transition:left 0.3s ease; width:260px; box-shadow:var(--shadow-2xl); }
          .portal-sidebar.open { left:0; }
          .portal-overlay { display:block; position:fixed; inset:0; background:rgba(0,0,0,0.4); z-index:calc(var(--z-modal) - 1); }
          main { padding:16px 16px 140px 16px !important; }
        }
      `}</style>
    </div>
  );
}
