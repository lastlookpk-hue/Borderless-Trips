import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { EvaluationProvider, useEvaluation } from './context/EvaluationContext';
import { SettingsProvider } from './context/SettingsContext';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import WhatsAppWidget from './components/common/WhatsAppWidget';
import AIChatWidget from './components/common/AIChatWidget';
import EvaluationModal from './components/common/EvaluationModal';
import { Shield } from 'lucide-react';

// Lazy load pages for performance
const HomePage = lazy(() => import('./pages/HomePage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const VisaServicesPage = lazy(() => import('./pages/VisaServicesPage'));
const HolidayPackagesPage = lazy(() => import('./pages/HolidayPackagesPage'));
const PackageDetailPage = lazy(() => import('./pages/PackageDetailPage'));
const FlightsPage = lazy(() => import('./pages/FlightsPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const FAQPage = lazy(() => import('./pages/FAQPage'));
const BlogPage = lazy(() => import('./pages/BlogPage'));
const ClientPortalPage = lazy(() => import('./pages/ClientPortalPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const ServiceRequestPage = lazy(() => import('./pages/ServiceRequestPage'));
const RefundPage = lazy(() => import('./pages/RefundPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));

// Auth pages
const AuthPagesImport = () => import('./pages/AuthPages');
const LoginPage = lazy(() => AuthPagesImport().then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => AuthPagesImport().then(m => ({ default: m.RegisterPage })));

// Loading fallback
function PageLoader() {
  return (
    <div style={{
      minHeight: '60vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        width: 40,
        height: 40,
        border: '3px solid var(--color-border)',
        borderTopColor: 'var(--color-secondary)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
    </div>
  );
}

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// Layout wrapper — no navbar/footer on auth and admin/portal pages
function AppLayout() {
  const location = useLocation();
  const hideLayout = ['/login', '/register'].includes(location.pathname);
  const isPortalOrAdmin = location.pathname.startsWith('/portal') || location.pathname.startsWith('/admin');

  return (
    <>
      <ScrollToTop />
      {!hideLayout && <Navbar />}
      <main style={{ flex: 1 }}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/visa-services" element={<VisaServicesPage />} />
            <Route path="/holiday-packages" element={<HolidayPackagesPage />} />
            <Route path="/holiday-packages/:id" element={<PackageDetailPage />} />
            <Route path="/flights" element={<FlightsPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/blog/:slug" element={<BlogPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/portal" element={<ClientPortalPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/request-service" element={<ServiceRequestPage />} />
            <Route path="/refund-policy" element={<RefundPage />} />
            <Route path="/terms-of-service" element={<TermsPage />} />
            <Route path="/privacy-policy" element={<PrivacyPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>
      {!hideLayout && !isPortalOrAdmin && <Footer />}
      {!hideLayout && <WhatsAppWidget />}
      {!hideLayout && <AIChatWidget />}
      {!hideLayout && <FloatingEligibilityButton />}
      <EvaluationModal />
    </>
  );
}

function FloatingEligibilityButton() {
  const { user } = useAuth();
  const { openEvaluation } = useEvaluation();
  const location = useLocation();
  const hideLayout = ['/login', '/register'].includes(location.pathname);
  const isPortalOrAdmin = location.pathname.startsWith('/portal') || location.pathname.startsWith('/admin');

  if (user || hideLayout || isPortalOrAdmin) return null;

  return (
    <motion.button
      className="floating-eligibility-btn"
      onClick={() => openEvaluation()}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      style={{
        position: 'fixed',
        bottom: 96,
        right: 24,
        zIndex: 9999,
        background: 'linear-gradient(135deg, #d4a574, #b48554)',
        color: 'white',
        border: 'none',
        borderRadius: 30,
        padding: '12px 20px',
        fontWeight: 600,
        fontSize: 13,
        boxShadow: '0 4px 15px rgba(212, 165, 116, 0.4)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 6
      }}
    >
      <Shield size={16} /> Check Visa Eligibility
    </motion.button>
  );
}

export default function App() {
  return (
    <Router>
      <SettingsProvider>
        <AuthProvider>
          <EvaluationProvider>
            <AppLayout />
          </EvaluationProvider>
        </AuthProvider>
      </SettingsProvider>
    </Router>
  );
}
