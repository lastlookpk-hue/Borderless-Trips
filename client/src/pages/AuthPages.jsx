import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Phone, Globe, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const [form, setForm] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      email: params.get('email') || '',
      password: params.get('password') || ''
    };
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(form.email, form.password);
      navigate(data.user.role === 'admin' ? '/admin' : '/portal');
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--color-bg)', padding:'var(--space-6)' }}>
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
        style={{ width:'100%', maxWidth:440, padding:0 }}>
        <div className="text-center" style={{ marginBottom:'var(--space-8)' }}>
          <Link to="/"><img src="/logo.png" alt="Borderless Trips" style={{ width:64, height:64, margin:'0 auto', borderRadius:12 }}/></Link>
          <h1 className="heading-2" style={{ marginTop:16 }}>Welcome Back</h1>
          <p className="text-muted">Sign in to your Borderless Trips account</p>
        </div>
        <div className="card" style={{ padding:'var(--space-8)' }}>
          {error && <div style={{ padding:'12px 16px', background:'rgba(239,68,68,0.08)', color:'var(--color-danger)', borderRadius:'var(--radius-md)', fontSize:'var(--text-sm)', marginBottom:16 }}>{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom:16 }}>
              <label className="form-label">Email Address</label>
              <div style={{ position:'relative' }}>
                <Mail size={16} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--color-text-muted)' }}/>
                <input className="form-input" type="email" placeholder="you@example.com" required value={form.email}
                  onChange={e=>setForm({...form,email:e.target.value})} style={{ paddingLeft:38 }}/>
              </div>
            </div>
            <div className="form-group" style={{ marginBottom:24 }}>
              <label className="form-label">Password</label>
              <div style={{ position:'relative' }}>
                <Lock size={16} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--color-text-muted)' }}/>
                <input className="form-input" type={showPw?'text':'password'} placeholder="••••••••" required value={form.password}
                  onChange={e=>setForm({...form,password:e.target.value})} style={{ paddingLeft:38, paddingRight:38 }}/>
                <button type="button" onClick={()=>setShowPw(!showPw)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--color-text-muted)' }}>
                  {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-lg" style={{ width:'100%' }} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <p className="text-center text-muted" style={{ marginTop:24, fontSize:'var(--text-sm)' }}>
            Don't have an account? <Link to="/register" style={{ fontWeight:600 }}>Create Account</Link>
          </p>
        </div>
        <p className="text-center" style={{ marginTop:24 }}>
          <Link to="/" className="text-muted" style={{ fontSize:'var(--text-sm)' }}>← Back to Home</Link>
        </p>
      </motion.div>
    </div>
  );
}

export function RegisterPage() {
  const [form, setForm] = useState({ name:'', email:'', phone:'', nationality:'', password:'', confirmPassword:'' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await register({ name:form.name, email:form.email, phone:form.phone, nationality:form.nationality, password:form.password });
      navigate('/portal');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--color-bg)', padding:'var(--space-6)' }}>
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
        style={{ width:'100%', maxWidth:440 }}>
        <div className="text-center" style={{ marginBottom:'var(--space-6)' }}>
          <Link to="/"><img src="/logo.png" alt="Borderless Trips" style={{ width:64, height:64, margin:'0 auto', borderRadius:12 }}/></Link>
          <h1 className="heading-2" style={{ marginTop:16 }}>Create Account</h1>
          <p className="text-muted">Join Borderless Trips for exclusive access</p>
        </div>
        <div className="card" style={{ padding:'var(--space-8)' }}>
          {error && <div style={{ padding:'12px 16px', background:'rgba(239,68,68,0.08)', color:'var(--color-danger)', borderRadius:'var(--radius-md)', fontSize:'var(--text-sm)', marginBottom:16 }}>{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom:12 }}>
              <label className="form-label">Full Name</label>
              <div style={{ position:'relative' }}>
                <User size={16} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--color-text-muted)' }}/>
                <input className="form-input" placeholder="John Doe" required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} style={{ paddingLeft:38 }}/>
              </div>
            </div>
            <div className="form-group" style={{ marginBottom:12 }}>
              <label className="form-label">Email</label>
              <div style={{ position:'relative' }}>
                <Mail size={16} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--color-text-muted)' }}/>
                <input className="form-input" type="email" placeholder="you@example.com" required value={form.email} onChange={e=>setForm({...form,email:e.target.value})} style={{ paddingLeft:38 }}/>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" placeholder="+44 XXX" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/>
              </div>
              <div className="form-group">
                <label className="form-label">Nationality</label>
                <input className="form-input" placeholder="e.g. British" value={form.nationality} onChange={e=>setForm({...form,nationality:e.target.value})}/>
              </div>
            </div>
            <div className="form-group" style={{ marginBottom:12 }}>
              <label className="form-label">Password</label>
              <div style={{ position:'relative' }}>
                <Lock size={16} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--color-text-muted)' }}/>
                <input className="form-input" type={showPw?'text':'password'} placeholder="Min. 6 characters" required value={form.password} onChange={e=>setForm({...form,password:e.target.value})} style={{ paddingLeft:38 }}/>
              </div>
            </div>
            <div className="form-group" style={{ marginBottom:24 }}>
              <label className="form-label">Confirm Password</label>
              <input className="form-input" type="password" placeholder="Repeat password" required value={form.confirmPassword} onChange={e=>setForm({...form,confirmPassword:e.target.value})}/>
            </div>
            <button type="submit" className="btn btn-primary btn-lg" style={{ width:'100%' }} disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
          <p className="text-center text-muted" style={{ marginTop:24, fontSize:'var(--text-sm)' }}>
            Already have an account? <Link to="/login" style={{ fontWeight:600 }}>Sign In</Link>
          </p>
        </div>
        <p className="text-center" style={{ marginTop:24 }}>
          <Link to="/" className="text-muted" style={{ fontSize:'var(--text-sm)' }}>← Back to Home</Link>
        </p>
      </motion.div>
    </div>
  );
}
