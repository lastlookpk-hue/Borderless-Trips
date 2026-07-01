import { motion } from 'framer-motion';
import { BookOpen, Shield, Globe, Scale } from 'lucide-react';

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

export default function TermsPage() {
  return (
    <div>
      <section className="page-hero">
        <div className="page-hero-bg" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1600&q=80)' }} />
        <div className="page-hero-overlay" />
        <div className="container page-hero-content">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <span className="section-label" style={{ color: 'var(--color-accent)' }}>Terms & Conditions</span>
            <h1 className="heading-1" style={{ color: 'white', margin: '0.5rem 0 1rem' }}>Terms of Service</h1>
            <p style={{ color: 'rgba(255,255,255,0.7)', maxWidth: 550, fontSize: 'var(--text-lg)' }}>
              Please read these terms of service carefully before accessing our portal and booking services.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--color-bg)' }}>
        <div className="container container-narrow">
          
          <Reveal>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)', marginBottom: 'var(--space-12)' }}>
              <div className="card" style={{ padding: 'var(--space-6)', borderLeft: '4px solid var(--color-secondary)' }}>
                <Scale size={24} color="var(--color-secondary)" style={{ marginBottom: 12 }} />
                <h3 className="heading-4" style={{ marginBottom: 8 }}>Governing Contract</h3>
                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                  These terms constitute a legally binding agreement between you and Borderless Trips regarding visa and holiday package bookings.
                </p>
              </div>

              <div className="card" style={{ padding: 'var(--space-6)', borderLeft: '4px solid var(--color-success)' }}>
                <Shield size={24} color="#10b981" style={{ marginBottom: 12 }} />
                <h3 className="heading-4" style={{ marginBottom: 8 }}>Intellectual Property</h3>
                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                  All software interfaces, logos, travel templates, checklists, and visual structures are property of Borderless Trips.
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="rich-text" style={{ fontSize: '14px', lineHeight: '1.7', color: 'var(--color-text)' }}>
              
              <h2 className="heading-3" style={{ marginTop: 24, marginBottom: 12 }}>1. Agreement to Terms</h2>
              <p>
                By using our website, AI assistant, or Client Portal, you agree to comply with and be bound by these Terms of Service. If you do not agree to all of these terms, please do not access or use our services.
              </p>

              <h2 className="heading-3" style={{ marginTop: 32, marginBottom: 12 }}>2. Services Offered</h2>
              <p>
                Borderless Trips acts as an intermediary agency providing Schengen and global visa application support, premium holiday packages, flight reservations, and luxury hotel bookings.
              </p>

              <h2 className="heading-3" style={{ marginTop: 32, marginBottom: 12 }}>3. User Obligations & Document Accuracy</h2>
              <p>
                As a client, you agree to:
              </p>
              <ul>
                <li>Provide accurate, complete, and up-to-date documentation (bank statements, employer letters, identification cards) for visa applications and flight reservations.</li>
                <li>Verify that passport validity complies with international rules (must not expire within 6 months of departure and have at least 2 blank pages).</li>
                <li>Acknowledge that submitting false or doctored paperwork to Schengen embassies will lead to immediate cancellation of your request without refund, and report to regulatory agencies.</li>
              </ul>

              <h2 className="heading-3" style={{ marginTop: 32, marginBottom: 12 }}>4. Payments, Billing & Portal Security</h2>
              <p>
                All bookings and service requests require clear transactions:
              </p>
              <ul>
                <li><strong>Billing:</strong> Visa consultation and booking deposits are billed upfront. Balance payments for holiday packages must be completed 15 days before travel, unless agreed otherwise.</li>
                <li><strong>Portal Accounts:</strong> When an account is auto-created or set up manually, you are solely responsible for keeping your password secure. Inform us immediately if you suspect unauthorized access.</li>
              </ul>

              <h2 className="heading-3" style={{ marginTop: 32, marginBottom: 12 }}>5. Limitation of Liability</h2>
              <p>
                Borderless Trips holds zero liability for events outside our operational control (force majeure):
              </p>
              <ul>
                <li>We do not control consular or diplomatic decisions regarding Schengen visa issuances, administrative delays, or biometric slot queues.</li>
                <li>We are not liable for flight cancellations, carrier rescheduling, lost baggage, hotel booking cancellations, or activity changes managed by third-party suppliers.</li>
              </ul>

              <h2 className="heading-3" style={{ marginTop: 32, marginBottom: 12 }}>6. Amendments to Terms</h2>
              <p>
                We reserve the right to modify these Terms of Service at any time. Changes will be posted to this page and the updated "Last Modified" date will be updated. Continual use of the portal implies acceptance of modifications.
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
