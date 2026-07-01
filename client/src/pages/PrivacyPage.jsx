import { motion } from 'framer-motion';
import { ShieldAlert, Lock, UserCheck, Eye } from 'lucide-react';

const Reveal = ({ children, delay = 0 }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }} 
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }} 
    transition={{ duration: 0.5, delay }}
  >
    {children}
  </motion.div>
);

export default function PrivacyPage() {
  return (
    <div>
      <section className="page-hero">
        <div className="page-hero-bg" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1563986768609-322da13575f3?w=1600&q=80)' }} />
        <div className="page-hero-overlay" />
        <div className="container page-hero-content">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <span className="section-label" style={{ color: 'var(--color-accent)' }}>Privacy Policy</span>
            <h1 className="heading-1" style={{ color: 'white', margin: '0.5rem 0 1rem' }}>Privacy Policy</h1>
            <p style={{ color: 'rgba(255,255,255,0.7)', maxWidth: 550, fontSize: 'var(--text-lg)' }}>
              How we collect, use, and safeguard your personal details and application documents.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--color-bg)' }}>
        <div className="container container-narrow">
          
          <Reveal>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)', marginBottom: 'var(--space-12)' }}>
              <div className="card" style={{ padding: 'var(--space-6)', borderLeft: '4px solid var(--color-secondary)' }}>
                <Lock size={24} color="var(--color-secondary)" style={{ marginBottom: 12 }} />
                <h3 className="heading-4" style={{ marginBottom: 8 }}>Secure Storage</h3>
                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                  Uploaded files (bank statements, IDs, employer letters) are encrypted and stored in persistent database volumes with restricted access.
                </p>
              </div>

              <div className="card" style={{ padding: 'var(--space-6)', borderLeft: '4px solid var(--color-success)' }}>
                <UserCheck size={24} color="#10b981" style={{ marginBottom: 12 }} />
                <h3 className="heading-4" style={{ marginBottom: 8 }}>GDPR Compliant</h3>
                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                  You have full rights to request access, rectification, or complete deletion of your personal records at any time.
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="rich-text" style={{ fontSize: '14px', lineHeight: '1.7', color: 'var(--color-text)' }}>
              
              <h2 className="heading-3" style={{ marginTop: 24, marginBottom: 12 }}>1. Information We Collect</h2>
              <p>
                To provide Schengen visa reviews and holiday bookings, we collect the following categories of information:
              </p>
              <ul>
                <li><strong>Contact details:</strong> Name, email address, phone number, and physical mailing address.</li>
                <li><strong>Identity information:</strong> Nationality, passport number, visa history, and country details.</li>
                <li><strong>Financial records:</strong> Bank statements, employment documents, and payslips submitted to complete visa checklists.</li>
                <li><strong>Activity logs:</strong> IP addresses, browser types, session history, and quick-action chats.</li>
              </ul>

              <h2 className="heading-3" style={{ marginTop: 32, marginBottom: 12 }}>2. How We Use Your Information</h2>
              <p>
                Your personal and travel information is utilized strictly to run our business services:
              </p>
              <ul>
                <li>To calculate your Schengen visa eligibility score and prepare checklist items.</li>
                <li>To book flight tickets, hotel rooms, and holiday tour packages on your behalf.</li>
                <li>To provision and administer your personal Client Portal account.</li>
                <li>To notify you about application updates, payments confirmation, and document reviews.</li>
              </ul>

              <h2 className="heading-3" style={{ marginTop: 32, marginBottom: 12 }}>3. Document Sharing & Third-Parties</h2>
              <p>
                We do **not** sell, rent, or trade your personal travel profiles or documents. We share data only with trusted partners required to fulfill your bookings:
              </p>
              <ul>
                <li>Airlines and hotels to finalize reservations.</li>
                <li>Embassies and designated visa centers (VFS Global, TLScontact, BLS International) during biometric slot bookings.</li>
                <li>Government regulatory or judicial institutions where required by law.</li>
              </ul>

              <h2 className="heading-3" style={{ marginTop: 32, marginBottom: 12 }}>4. Data Security</h2>
              <p>
                We implement state-of-the-art security measures to protect your sensitive documents:
              </p>
              <ul>
                <li>All uploads are saved on secure server directories.</li>
                <li>Sessions and API endpoints require JSON Web Token (JWT) authorization header checks.</li>
                <li>Databases reside in SQLite files mounted in private local server volumes with restricted ssh network layers.</li>
              </ul>

              <h2 className="heading-3" style={{ marginTop: 32, marginBottom: 12 }}>5. Your Privacy Rights</h2>
              <p>
                You retain complete control over your profiles. You can write to our data protection officer at <a href="mailto:privacy@borderlesstrips.com" style={{ fontWeight: 600 }}>privacy@borderlesstrips.com</a> to download, modify, or permanently purge your account records from our servers.
              </p>
              
              <p style={{ marginTop: 30, fontSize: 12, color: 'var(--color-text-muted)' }}>
                Last updated: June 30, 2026
              </p>

            </div>
          </Reveal>

        </div>
      </section>

      <style>{`
        .page-hero { position: relative; padding: calc(var(--nav-height) + var(--space-20)) 0 var(--space-24); min-height: 400px; display: flex; align-items: center; }
        .page-hero-bg { position: absolute; inset: 0; background-size: cover; background-position: center; }
        .page-hero-overlay { position: absolute; inset: 0; background: linear-gradient(135deg, rgba(11,29,53,0.93), rgba(11,29,53,0.8)); }
        .page-hero-content { position: relative; z-index: 1; }
        .rich-text ul { padding-left: 20px; margin-bottom: 20px; }
        .rich-text li { margin-bottom: 8px; }
      `}</style>
    </div>
  );
}
