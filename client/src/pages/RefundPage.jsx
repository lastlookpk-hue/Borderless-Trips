import { motion } from 'framer-motion';
import { CreditCard, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';

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

export default function RefundPage() {
  return (
    <div>
      <section className="page-hero">
        <div className="page-hero-bg" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1600&q=80)' }} />
        <div className="page-hero-overlay" />
        <div className="container page-hero-content">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <span className="section-label" style={{ color: 'var(--color-accent)' }}>Refund Policy</span>
            <h1 className="heading-1" style={{ color: 'white', margin: '0.5rem 0 1rem' }}>Refund & Cancellation</h1>
            <p style={{ color: 'rgba(255,255,255,0.7)', maxWidth: 550, fontSize: 'var(--text-lg)' }}>
              Transparent and fair conditions regarding cancellations, bookings, and fee structures for our services.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--color-bg)' }}>
        <div className="container container-narrow">
          
          <Reveal>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)', marginBottom: 'var(--space-12)' }}>
              <div className="card" style={{ padding: 'var(--space-6)', borderLeft: '4px solid var(--color-secondary)' }}>
                <RefreshCw size={24} color="var(--color-secondary)" style={{ marginBottom: 12 }} />
                <h3 className="heading-4" style={{ marginBottom: 8 }}>Flexible Cancellations</h3>
                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                  We understand that travel plans can change. We support cancellations and deposits processing under the timelines specified below.
                </p>
              </div>

              <div className="card" style={{ padding: 'var(--space-6)', borderLeft: '4px solid var(--color-success)' }}>
                <ShieldCheck size={24} color="#10b981" style={{ marginBottom: 12 }} />
                <h3 className="heading-4" style={{ marginBottom: 8 }}>Secure Process</h3>
                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                  Approved refunds are processed securely and returned to your original payment method within 7 to 10 business days.
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="rich-text" style={{ fontSize: '14px', lineHeight: '1.7', color: 'var(--color-text)' }}>
              
              <h2 className="heading-3" style={{ marginTop: 24, marginBottom: 12 }}>1. Visa Services & Consultations</h2>
              <p>
                Our primary goal is to help you successfully obtain your travel visas. Please read the following conditions regarding visa assistance payments:
              </p>
              <ul>
                <li><strong>Professional Service Fees:</strong> The fees charged for travel consultation and application reviews are fully refundable if requested within 24 hours of booking, provided document validation or submission has not commenced.</li>
                <li><strong>Government & Embassy Fees:</strong> Government embassy visa fee charges, travel insurance premium cards, and biometric booking slots are non-refundable once paid to the respective consular or third-party visa centers.</li>
                <li><strong>Application Decisions:</strong> Consular departments of the destination countries have sole authority regarding visa approvals and rejections. Borderless Trips cannot issue refunds in the event of consular visa refusal, unless you have selected our Premium Guaranteed Visa Service package (where specific terms apply as declared on the request voucher).</li>
              </ul>

              <h2 className="heading-3" style={{ marginTop: 32, marginBottom: 12 }}>2. Holiday Packages & Tours</h2>
              <p>
                Cancellations of pre-planned holiday packages are subject to terms dependent on the travel operators and timeline:
              </p>
              <ul>
                <li><strong>30+ Days Before Departure:</strong> Cancellations made 30 days or more prior to the scheduled departure will receive a full refund of deposit payments, less a standard 10% administrative planning fee.</li>
                <li><strong>15 to 29 Days Before Departure:</strong> Cancellations will be subject to a 50% penalty fee of the package total deposit, unless booking clauses specify otherwise.</li>
                <li><strong>Under 15 Days Before Departure:</strong> Package cancellations made within 14 days of departure are non-refundable, as flights, hotel slots, and transport activities will have been locked by operators.</li>
              </ul>

              <h2 className="heading-3" style={{ marginTop: 32, marginBottom: 12 }}>3. Flight & Hotel Bookings</h2>
              <p>
                Flights and hotel room accommodations are governed directly by airline fare rules and provider booking conditions:
              </p>
              <ul>
                <li><strong>Airlines:</strong> Non-refundable promotional flights are strictly non-refundable as per airline rules. Date changes and cancellations on flexible fares will be processed according to the carrier's terms, subject to any processing fees.</li>
                <li><strong>Hotels:</strong> Free cancellation rooms can be cancelled without penalty up to the provider's threshold date. Pre-paid non-refundable room rates cannot be refunded.</li>
              </ul>

              <div style={{ marginTop: 40, padding: '20px', background: 'var(--color-bg-alt)', borderRadius: 12, border: '1px solid var(--color-border)', display: 'flex', gap: 16 }}>
                <AlertTriangle size={32} color="var(--color-secondary)" style={{ flexShrink: 0 }} />
                <div>
                  <h4 style={{ fontSize: 13, fontWeight: 700, margin: '0 0 6px 0', color: 'var(--color-text-title)' }}>Need to request a refund?</h4>
                  <p className="text-muted" style={{ margin: 0, fontSize: 12, lineHeight: 1.5 }}>
                    Please submit a refund request directly by contacting support at <a href="mailto:refunds@borderlesstrips.com" style={{ fontWeight: 600 }}>refunds@borderlesstrips.com</a> or through your Portal dashboard. Ensure you state your Reference Number and attach payment transaction receipts.
                  </p>
                </div>
              </div>

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
