import { useState } from 'react';
import { motion } from 'framer-motion';
import { Phone, Mail, MapPin, Clock, Send, CheckCircle2, MessageSquare } from 'lucide-react';

const Reveal = ({ children, delay = 0 }) => (
  <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }} transition={{ duration: 0.5, delay }}>{children}</motion.div>
);

export default function ContactPage() {
  const [form, setForm] = useState({ name:'', email:'', phone:'', subject:'general', message:'' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch('/api/inquiries', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(form) }).catch(()=>{});
    setSubmitted(true);
  };

  const contacts = [
    { icon: Phone, title: 'Call Us', value: '+44 123 456 7890', link: 'tel:+441234567890', desc: 'Mon-Sat, 9AM-6PM GMT' },
    { icon: Mail, title: 'Email Us', value: 'info@borderlesstrips.com', link: 'mailto:info@borderlesstrips.com', desc: 'We reply within 2 hours' },
    { icon: MapPin, title: 'Visit Us', value: 'London, United Kingdom', link: '#', desc: 'By appointment only' },
    { icon: MessageSquare, title: 'WhatsApp', value: 'Chat with us', link: 'https://wa.me/441234567890', desc: 'Instant messaging' },
  ];

  return (
    <div>
      <section className="page-hero">
        <div className="page-hero-bg" style={{ backgroundImage:'url(https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1600&q=80)' }} />
        <div className="page-hero-overlay" />
        <div className="container page-hero-content">
          <motion.div initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }}>
            <span className="section-label" style={{ color:'var(--color-accent)' }}>Get In Touch</span>
            <h1 className="heading-1" style={{ color:'white', margin:'0.5rem 0 1rem' }}>Contact Us</h1>
            <p style={{ color:'rgba(255,255,255,0.7)', maxWidth:550, fontSize:'var(--text-lg)' }}>
              Have a question? We'd love to hear from you. Reach out and our team will respond promptly.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Cards */}
      <section className="section-sm" style={{ marginTop:'-60px', position:'relative', zIndex:2 }}>
        <div className="container">
          <div className="grid grid-4">
            {contacts.map((c,i) => (
              <Reveal key={i} delay={i*0.1}>
                <a href={c.link} className="card" style={{ padding:'var(--space-6)', textAlign:'center', textDecoration:'none', color:'inherit' }} target={c.link.startsWith('http')?'_blank':undefined}>
                  <div style={{ width:56, height:56, borderRadius:'var(--radius-full)', background:'rgba(14,165,233,0.1)', color:'var(--color-secondary)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto var(--space-3)' }}>
                    <c.icon size={24}/>
                  </div>
                  <h4 className="heading-4">{c.title}</h4>
                  <p style={{ fontWeight:600, color:'var(--color-secondary)', fontSize:'var(--text-sm)', marginTop:4 }}>{c.value}</p>
                  <p className="text-muted" style={{ fontSize:'var(--text-xs)', marginTop:4 }}>{c.desc}</p>
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form + Map */}
      <section className="section">
        <div className="container">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--space-8)' }}>
            <Reveal>
              <div>
                <h2 className="heading-2" style={{ marginBottom:8 }}>Send Us a Message</h2>
                <p className="text-muted" style={{ marginBottom:'var(--space-6)' }}>
                  Fill in the form and we'll get back to you within 2 hours during business hours.
                </p>
                {!submitted ? (
                  <form onSubmit={handleSubmit}>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
                      <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <input className="form-input" placeholder="John Doe" required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Email</label>
                        <input className="form-input" type="email" placeholder="john@example.com" required value={form.email} onChange={e=>setForm({...form,email:e.target.value})} />
                      </div>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
                      <div className="form-group">
                        <label className="form-label">Phone</label>
                        <input className="form-input" placeholder="+44 XXX XXX XXXX" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Subject</label>
                        <select className="form-input form-select" value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})}>
                          <option value="general">General Enquiry</option>
                          <option value="visa">Visa Services</option>
                          <option value="packages">Holiday Packages</option>
                          <option value="flights">Flight Booking</option>
                          <option value="complaint">Complaint</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-group" style={{ marginBottom:24 }}>
                      <label className="form-label">Message</label>
                      <textarea className="form-input form-textarea" placeholder="Tell us how we can help..." required value={form.message} onChange={e=>setForm({...form,message:e.target.value})} rows={5} />
                    </div>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                      <button type="submit" className="btn btn-primary btn-lg" style={{ flex: '1 1 200px' }}>
                        <Send size={18}/> Send Message
                      </button>
                      <a 
                        href={`https://wa.me/441234567890?text=${encodeURIComponent(`Hello Borderless Trips! I would like to book a consultation about ${form.subject === 'general' ? 'general travel enquiry' : form.subject + ' services'}. My name is ${form.name || 'Guest'}.`)}`}
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="btn btn-success btn-lg" 
                        style={{ 
                          flex: '1 1 200px', 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          gap: 8, 
                          background: '#25D366', 
                          color: 'white', 
                          border: 'none', 
                          textDecoration: 'none', 
                          padding: '12px 24px',
                          borderRadius: 'var(--radius-lg)',
                          fontWeight: 600
                        }}
                      >
                        <MessageSquare size={18}/> WhatsApp Consultation
                      </a>
                    </div>
                  </form>
                ) : (
                  <div className="card text-center" style={{ padding:'var(--space-10)' }}>
                    <CheckCircle2 size={56} color="var(--color-success)" />
                    <h3 className="heading-3" style={{ marginTop:16 }}>Message Sent!</h3>
                    <p className="text-muted" style={{ margin:'8px 0 24px' }}>Thank you for reaching out. We'll respond within 2 hours.</p>
                    <button className="btn btn-outline" onClick={()=>{ setSubmitted(false); setForm({name:'',email:'',phone:'',subject:'general',message:''}); }}>
                      Send Another Message
                    </button>
                  </div>
                )}
              </div>
            </Reveal>

            <Reveal delay={0.2}>
              <div style={{ borderRadius:'var(--radius-xl)', overflow:'hidden', height:'100%', minHeight:400, background:'var(--color-bg-alt)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d158858.182370148!2d-0.26640456816498!3d51.52855824155108!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47d8a00baf21de75%3A0x52963a5addd52a99!2sLondon%2C%20UK!5e0!3m2!1sen!2s!4v1"
                  width="100%" height="100%" style={{ border:0, minHeight:400 }} allowFullScreen loading="lazy"
                  title="Our Location"
                ></iframe>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Working Hours */}
      <section className="section" style={{ background:'var(--color-bg-alt)' }}>
        <div className="container container-narrow text-center">
          <Reveal>
            <Clock size={32} color="var(--color-secondary)" />
            <h2 className="heading-3" style={{ marginTop:16, marginBottom:24 }}>Business Hours</h2>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, maxWidth:400, margin:'0 auto' }}>
              {[['Monday - Friday','9:00 AM - 6:00 PM'],['Saturday','10:00 AM - 4:00 PM'],['Sunday','Closed'],['Bank Holidays','Closed']].map(([d,h],i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--color-border)', gridColumn: i<2?'auto':'span 2' }}>
                  <span style={{ fontWeight:600, fontSize:'var(--text-sm)' }}>{d}</span>
                  <span className="text-muted" style={{ fontSize:'var(--text-sm)' }}>{h}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <style>{`
        .page-hero { position:relative; padding:calc(var(--nav-height)+var(--space-20)) 0 var(--space-24); min-height:400px; display:flex; align-items:center; }
        .page-hero-bg { position:absolute; inset:0; background-size:cover; background-position:center; }
        .page-hero-overlay { position:absolute; inset:0; background:linear-gradient(135deg,rgba(11,29,53,0.93),rgba(11,29,53,0.8)); }
        .page-hero-content { position:relative; z-index:1; }
        @media(max-width:768px) {
          .grid-4 { grid-template-columns:1fr 1fr !important; }
          .section > .container > div { grid-template-columns:1fr !important; }
          form > div { grid-template-columns:1fr !important; }
        }
      `}</style>
    </div>
  );
}
