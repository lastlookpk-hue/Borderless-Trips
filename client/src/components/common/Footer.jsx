import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock, ArrowUp, Send } from 'lucide-react';
import { useState } from 'react';
import { useSettings } from '../../context/SettingsContext';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const { settings } = useSettings();

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      }).catch(() => {});
      setSubscribed(true);
      setEmail('');
    }
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <footer className="footer" id="site-footer">
      {/* Newsletter Strip */}
      <div className="footer-newsletter">
        <div className="container">
          <div className="newsletter-inner">
            <div className="newsletter-text">
              <h3 className="heading-3" style={{ color: 'white' }}>Get Exclusive Travel Deals</h3>
              <p style={{ color: 'rgba(255,255,255,0.7)' }}>Subscribe for the best holiday packages and visa updates</p>
            </div>
            <form className="newsletter-form" onSubmit={handleSubscribe}>
              {subscribed ? (
                <div className="newsletter-success">✓ Thank you for subscribing!</div>
              ) : (
                <>
                  <input
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="newsletter-input"
                    required
                    id="newsletter-email"
                  />
                  <button type="submit" className="btn btn-secondary" id="newsletter-submit">
                    <Send size={16} /> Subscribe
                  </button>
                </>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="footer-main">
        <div className="container">
          <div className="footer-grid">
            {/* Brand */}
            <div className="footer-col footer-brand-col">
              <Link to="/" className="footer-logo">
                <img src={settings.logo_url || "/logo.png"} alt={settings.business_name || "Borderless Trips"} style={{ width: 50, height: 50, borderRadius: 8 }} />
                <div>
                  <div className="footer-brand-name">{settings.business_name || "Borderless Trips"}</div>
                  <div className="footer-brand-tag">Unlimited Journeys, Endless Discoveries</div>
                </div>
              </Link>
              <p className="footer-description">
                Your trusted UK-based travel partner specialising in Schengen visa services, 
                luxury holiday packages, and unforgettable travel experiences worldwide.
              </p>
              <div className="footer-socials">
                <a href="#" className="footer-social" aria-label="Facebook">
                  <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M9 8H7v3h2v9h4v-9h3.6l.4-3H13V6c0-.5.5-1 1-1h3V1H13c-3 0-4 2-4 4v3z"/></svg>
                </a>
                <a href="#" className="footer-social" aria-label="Instagram">
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                </a>
                <a href="#" className="footer-social" aria-label="Twitter">
                  <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M18.2 2.4h3.3L14.3 11l8.5 11.3h-6.7L10.8 15.6 4.9 22.3H1.6l7.6-8.7L1 2.4h6.9l4.7 6.3 5.6-6.3zm-1.2 17.9h1.8L7.1 4.3H5.2l11.8 16z"/></svg>
                </a>
                <a href="#" className="footer-social" aria-label="YouTube">
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17z"/><polygon points="10 15 15 12 10 9"/></svg>
                </a>
              </div>
            </div>

            {/* Services */}
            <div className="footer-col">
              <h4 className="footer-heading">Our Services</h4>
              <div className="footer-links">
                <Link to="/visa-services">Schengen Visa Services</Link>
                <Link to="/holiday-packages">Holiday Packages</Link>
                <Link to="/flights">Flight Bookings</Link>
                <Link to="/visa-services#eligibility">Visa Eligibility Check</Link>
                <Link to="/holiday-packages?type=honeymoon">Honeymoon Packages</Link>
                <Link to="/holiday-packages?type=family">Family Holidays</Link>
              </div>
            </div>

            {/* Quick Links */}
            <div className="footer-col">
              <h4 className="footer-heading">Quick Links</h4>
              <div className="footer-links">
                <Link to="/about">About Us</Link>
                <Link to="/blog">Travel Blog</Link>
                <Link to="/faq">FAQ</Link>
                <Link to="/contact">Contact Us</Link>
                <Link to="/login">Client Login</Link>
                <Link to="/register">Create Account</Link>
              </div>
            </div>

            {/* Contact */}
            <div className="footer-col">
              <h4 className="footer-heading">Contact Us</h4>
              <div className="footer-contact-list">
                <div className="footer-contact-item">
                  <MapPin size={16} />
                  <span>{settings.address || "London, United Kingdom"}</span>
                </div>
                <div className="footer-contact-item">
                  <Phone size={16} />
                  <a href={`tel:${settings.phone || "+44 123 456 7890"}`}>{settings.phone || "+44 123 456 7890"}</a>
                </div>
                <div className="footer-contact-item">
                  <Mail size={16} />
                  <a href={`mailto:${settings.email || "info@borderlesstrips.com"}`}>{settings.email || "info@borderlesstrips.com"}</a>
                </div>
                <div className="footer-contact-item">
                  <Clock size={16} />
                  <span>Mon - Sat: 9:00 AM - 6:00 PM</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="footer-bottom">
        <div className="container footer-bottom-inner">
          <p>© {new Date().getFullYear()} Borderless Trips. All rights reserved.</p>
          <div className="footer-legal">
            <Link to="/privacy-policy">Privacy Policy</Link>
            <Link to="/terms-of-service">Terms of Service</Link>
            <Link to="/refund-policy">Refund Policy</Link>
          </div>
          <button className="footer-scroll-top" onClick={scrollToTop} aria-label="Scroll to top" id="scroll-top-btn">
            <ArrowUp size={18} />
          </button>
        </div>
      </div>

      <style>{`
        .footer {
          background: var(--color-primary);
          color: rgba(255,255,255,0.8);
        }

        .footer-newsletter {
          background: var(--gradient-primary);
          border-bottom: 1px solid rgba(255,255,255,0.08);
          padding: var(--space-12) 0;
        }

        .newsletter-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-8);
        }

        .newsletter-form {
          display: flex;
          gap: var(--space-3);
          flex: 1;
          max-width: 500px;
        }

        .newsletter-input {
          flex: 1;
          padding: var(--space-3) var(--space-5);
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: var(--radius-lg);
          color: white;
          font-size: var(--text-sm);
        }

        .newsletter-input::placeholder {
          color: rgba(255,255,255,0.5);
        }

        .newsletter-input:focus {
          border-color: var(--color-secondary);
          background: rgba(255,255,255,0.15);
        }

        .newsletter-success {
          color: var(--color-success-light);
          font-weight: 600;
          font-size: var(--text-lg);
        }

        .footer-main {
          padding: var(--space-16) 0 var(--space-12);
        }

        .footer-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr 1fr 1.2fr;
          gap: var(--space-10);
        }

        .footer-logo {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          text-decoration: none;
          margin-bottom: var(--space-4);
        }

        .footer-brand-name {
          font-family: var(--font-serif);
          font-size: var(--text-xl);
          font-weight: 700;
          color: white;
        }

        .footer-brand-tag {
          font-size: var(--text-xs);
          color: var(--color-accent);
          letter-spacing: 0.05em;
        }

        .footer-description {
          font-size: var(--text-sm);
          line-height: var(--leading-relaxed);
          margin-bottom: var(--space-6);
          color: rgba(255,255,255,0.6);
        }

        .footer-socials {
          display: flex;
          gap: var(--space-3);
        }

        .footer-social {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: var(--radius-full);
          background: rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.7);
          transition: all var(--transition-fast);
        }

        .footer-social:hover {
          background: var(--color-secondary);
          color: white;
          transform: translateY(-2px);
        }

        .footer-heading {
          font-size: var(--text-base);
          font-weight: 700;
          color: white;
          margin-bottom: var(--space-5);
          position: relative;
          padding-bottom: var(--space-3);
        }

        .footer-heading::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 30px;
          height: 2px;
          background: var(--color-accent);
          border-radius: var(--radius-full);
        }

        .footer-links {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }

        .footer-links a {
          font-size: var(--text-sm);
          color: rgba(255,255,255,0.6);
          text-decoration: none;
          transition: all var(--transition-fast);
          display: inline-block;
        }

        .footer-links a:hover {
          color: var(--color-secondary-light);
          transform: translateX(4px);
        }

        .footer-contact-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .footer-contact-item {
          display: flex;
          align-items: flex-start;
          gap: var(--space-3);
          font-size: var(--text-sm);
          color: rgba(255,255,255,0.6);
        }

        .footer-contact-item svg {
          color: var(--color-secondary);
          flex-shrink: 0;
          margin-top: 2px;
        }

        .footer-contact-item a {
          color: rgba(255,255,255,0.6);
          text-decoration: none;
        }

        .footer-contact-item a:hover {
          color: var(--color-secondary-light);
        }

        .footer-bottom {
          border-top: 1px solid rgba(255,255,255,0.08);
          padding: var(--space-6) 0;
        }

        .footer-bottom-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: var(--text-sm);
          color: rgba(255,255,255,0.4);
        }

        .footer-legal {
          display: flex;
          gap: var(--space-6);
        }

        .footer-legal a {
          color: rgba(255,255,255,0.4);
          text-decoration: none;
        }

        .footer-legal a:hover {
          color: white;
        }

        .footer-scroll-top {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-full);
          background: rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-fast);
          border: none;
          cursor: pointer;
        }

        .footer-scroll-top:hover {
          background: var(--color-secondary);
          color: white;
          transform: translateY(-3px);
        }

        @media (max-width: 1024px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 768px) {
          .newsletter-inner {
            flex-direction: column;
            text-align: center;
          }
          .newsletter-form {
            flex-direction: column;
            max-width: 100%;
          }
          .footer-grid {
            grid-template-columns: 1fr;
            gap: var(--space-8);
          }
          .footer-bottom-inner {
            flex-direction: column;
            gap: var(--space-4);
            text-align: center;
          }
        }
      `}</style>
    </footer>
  );
}
