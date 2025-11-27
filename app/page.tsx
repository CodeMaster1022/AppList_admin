'use client';

import { useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { 
  Globe, 
  CheckCircle, 
  BarChart3, 
  Users, 
  Camera, 
  MapPin, 
  TrendingUp,
  Shield,
  Zap,
  Target,
  ArrowRight,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';

export default function LandingPage() {
  const { language, setLanguage, t } = useLanguage();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8]);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-white">OpsList</h1>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-white/80 hover:text-white transition-colors">
                {t('nav.features')}
              </a>
              <a href="#industries" className="text-white/80 hover:text-white transition-colors">
                {t('nav.industries')}
              </a>
              <a href="#business" className="text-white/80 hover:text-white transition-colors">
                {t('nav.business')}
              </a>
              <Link 
                href="/login"
                className="px-4 py-2 bg-white text-black rounded-lg font-semibold hover:bg-white/90 transition-colors"
              >
                {t('nav.login')}
              </Link>
              
              {/* Language Selector */}
              <button
                onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
                className="p-2 text-white/80 hover:text-white transition-colors"
                title={language === 'en' ? 'Cambiar a Español' : 'Switch to English'}
              >
                <Globe size={20} />
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-4">
              <button
                onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
                className="p-2 text-white"
              >
                <Globe size={20} />
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-white"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 bg-black">
            <div className="px-4 py-4 space-y-3">
              <a 
                href="#features" 
                onClick={() => setMobileMenuOpen(false)}
                className="block text-white/80 hover:text-white transition-colors"
              >
                {t('nav.features')}
              </a>
              <a 
                href="#industries" 
                onClick={() => setMobileMenuOpen(false)}
                className="block text-white/80 hover:text-white transition-colors"
              >
                {t('nav.industries')}
              </a>
              <a 
                href="#business" 
                onClick={() => setMobileMenuOpen(false)}
                className="block text-white/80 hover:text-white transition-colors"
              >
                {t('nav.business')}
              </a>
              <Link 
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 bg-white text-black rounded-lg font-semibold text-center"
              >
                {t('nav.login')}
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <motion.section
        ref={heroRef}
        style={{ opacity, scale }}
        className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16"
      >
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.05),transparent_50%)]"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
              {t('hero.title')}
            </h1>
            <p className="text-xl md:text-2xl text-white/70 mb-4">
              {t('hero.subtitle')}
            </p>
            <p className="text-lg md:text-xl text-white/60 mb-12 max-w-3xl mx-auto">
              {t('hero.description')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/login"
                className="px-8 py-4 bg-white text-black rounded-lg font-semibold text-lg hover:bg-white/90 transition-all transform hover:scale-105"
              >
                {t('hero.cta')}
              </Link>
              <a
                href="#features"
                className="px-8 py-4 border-2 border-white text-white rounded-lg font-semibold text-lg hover:bg-white/10 transition-all"
              >
                {t('hero.learnMore')}
              </a>
            </div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center"
          >
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1 h-3 bg-white/50 rounded-full mt-2"
            />
          </motion.div>
        </motion.div>
      </motion.section>

      {/* What is OpsList Section */}
      <Section id="what">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">{t('what.title')}</h2>
          <p className="text-xl text-white/70 leading-relaxed mb-12">
            {t('what.description')}
          </p>
          
          {/* Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative mt-12"
          >
            <div className="bg-white/5 border border-white/10 rounded-lg p-6 backdrop-blur-sm">
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-white/10 rounded p-4">
                  <div className="text-white/60 text-sm mb-2">{language === 'en' ? 'Operational Compliance' : 'Cumplimiento Operativo'}</div>
                  <div className="text-3xl font-bold text-white">94%</div>
                </div>
                <div className="bg-white/10 rounded p-4">
                  <div className="text-white/60 text-sm mb-2">{language === 'en' ? 'Active Users' : 'Usuarios Activos'}</div>
                  <div className="text-3xl font-bold text-white">127</div>
                </div>
                <div className="bg-white/10 rounded p-4">
                  <div className="text-white/60 text-sm mb-2">{language === 'en' ? 'Without Checklist' : 'Sin Checklist'}</div>
                  <div className="text-3xl font-bold text-white">3</div>
                </div>
              </div>
              <div className="bg-white/10 rounded p-4 h-32 flex items-center justify-center">
                <BarChart3 size={48} className="text-white/30" />
              </div>
            </div>
          </motion.div>
        </motion.div>
      </Section>

      {/* Features Section */}
      <Section id="features" className="bg-gray-900/50">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-center mb-16"
          >
            {t('features.title')}
          </motion.h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Target, text: t('features.config') },
              { icon: CheckCircle, text: t('features.create') },
              { icon: Users, text: t('features.register') },
              { icon: Zap, text: t('features.assign') },
              { icon: BarChart3, text: t('features.visibility') },
              { icon: Shield, text: t('features.identify') },
              { icon: Camera, text: t('features.evidence') },
              { icon: TrendingUp, text: t('features.monitor') },
            ].map((feature, index) => (
              <FeatureCard key={index} feature={feature} index={index} />
            ))}
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="text-center text-xl text-white/70 mt-12 max-w-3xl mx-auto"
          >
            {t('features.purpose')}
          </motion.p>
        </div>
      </Section>

      {/* Industries Section */}
      <Section id="industries">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">{t('industries.title')}</h2>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              {t('industries.subtitle')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <IndustryCategory
              title={t('industries.food.title')}
              items={[
                t('industries.food.restaurants'),
                t('industries.food.groups'),
                t('industries.food.cafes'),
                t('industries.food.darkKitchens'),
              ]}
              delay={0}
            />
            <IndustryCategory
              title={t('industries.industrial.title')}
              items={[
                t('industries.industrial.cleaning'),
                t('industries.industrial.landscaping'),
                t('industries.industrial.facility'),
                t('industries.industrial.maintenance'),
              ]}
              delay={0.1}
            />
            <IndustryCategory
              title={t('industries.hospitality.title')}
              items={[
                t('industries.hospitality.hotels'),
                t('industries.hospitality.motels'),
                t('industries.hospitality.boutiques'),
                t('industries.hospitality.gyms'),
              ]}
              delay={0.2}
            />
            <IndustryCategory
              title={t('industries.other.title')}
              items={[
                t('industries.other.security'),
                t('industries.other.logistics'),
                t('industries.other.production'),
                t('industries.other.franchises'),
                t('industries.other.healthcare'),
              ]}
              delay={0.3}
              className="md:col-span-2 lg:col-span-1"
            />
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="text-center text-lg text-white/60 mt-12 max-w-3xl mx-auto"
          >
            {t('industries.summary')}
          </motion.p>
        </div>
      </Section>

      {/* Business Value Section */}
      <Section id="business" className="bg-gray-900/50">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-center mb-16"
          >
            {t('business.title')}
          </motion.h2>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {[
              { icon: Zap, title: t('business.efficiency'), desc: t('business.efficiency.desc') },
              { icon: Shield, title: t('business.control'), desc: t('business.control.desc') },
              { icon: Target, title: t('business.standardization'), desc: t('business.standardization.desc') },
              { icon: Camera, title: t('business.evidence'), desc: t('business.evidence.desc') },
            ].map((value, index) => (
              <BusinessValueCard key={index} value={value} index={index} />
            ))}
          </div>

          {/* Visual Evidence Section */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="bg-white/5 border border-white/10 rounded-lg p-8"
          >
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-20 h-20 bg-white/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Camera size={32} className="text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">{language === 'en' ? 'Photo Evidence' : 'Evidencia Fotográfica'}</h3>
                <p className="text-white/70 text-sm">
                  {language === 'en' 
                    ? 'Direct capture from mobile app'
                    : 'Captura directa desde la app móvil'}
                </p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 bg-white/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <MapPin size={32} className="text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">{language === 'en' ? 'Location Verification' : 'Verificación de Ubicación'}</h3>
                <p className="text-white/70 text-sm">
                  {language === 'en' 
                    ? 'Geofencing ensures task completion at the right place'
                    : 'Geocercas aseguran cumplimiento en el lugar correcto'}
                </p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 bg-white/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <BarChart3 size={32} className="text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">{language === 'en' ? 'Real-time Analytics' : 'Analíticas en Tiempo Real'}</h3>
                <p className="text-white/70 text-sm">
                  {language === 'en' 
                    ? 'Monitor compliance across all operations'
                    : 'Monitorea cumplimiento en todas las operaciones'}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </Section>

      {/* CTA Section */}
      <Section className="bg-gradient-to-r from-white/5 to-white/10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            {language === 'en' ? 'Ready to Transform Your Operations?' : '¿Listo para Transformar tus Operaciones?'}
          </h2>
          <p className="text-xl text-white/70 mb-8">
            {language === 'en' 
              ? 'Start managing your team with precision and efficiency today.'
              : 'Comienza a gestionar tu equipo con precisión y eficiencia hoy.'}
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black rounded-lg font-semibold text-lg hover:bg-white/90 transition-all transform hover:scale-105"
          >
            {t('hero.cta')}
            <ArrowRight size={20} />
          </Link>
        </motion.div>
      </Section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <p className="text-white/60 text-sm mb-4 md:mb-0">
              © {new Date().getFullYear()} OpsList. {t('footer.rights')}
            </p>
            <div className="flex items-center gap-6">
              <Link href="/login" className="text-white/60 hover:text-white text-sm transition-colors">
                {t('nav.login')}
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Section Component
function Section({ 
  id, 
  className = '', 
  children 
}: { 
  id?: string; 
  className?: string; 
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={`py-20 md:py-32 ${className}`}>
      {children}
    </section>
  );
}

// Feature Card Component
function FeatureCard({ 
  feature, 
  index 
}: { 
  feature: { icon: any; text: string }; 
  index: number;
}) {
  const Icon = feature.icon;
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="bg-white/5 border border-white/10 rounded-lg p-6 hover:bg-white/10 transition-all"
    >
      <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mb-4">
        <Icon size={24} className="text-white" />
      </div>
      <p className="text-white/90">{feature.text}</p>
    </motion.div>
  );
}

// Industry Category Component
function IndustryCategory({ 
  title, 
  items, 
  delay = 0,
  className = ''
}: { 
  title: string; 
  items: string[]; 
  delay?: number;
  className?: string;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay }}
      className={`bg-white/5 border border-white/10 rounded-lg p-6 ${className}`}
    >
      <h3 className="text-xl font-bold mb-4">{title}</h3>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-2 text-white/70">
            <CheckCircle size={16} className="text-white/50 flex-shrink-0" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

// Business Value Card Component
function BusinessValueCard({ 
  value, 
  index 
}: { 
  value: { icon: any; title: string; desc: string }; 
  index: number;
}) {
  const Icon = value.icon;
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="bg-white/5 border border-white/10 rounded-lg p-8"
    >
      <div className="w-16 h-16 bg-white/10 rounded-lg flex items-center justify-center mb-6">
        <Icon size={32} className="text-white" />
      </div>
      <h3 className="text-2xl font-bold mb-4">{value.title}</h3>
      <p className="text-white/70">{value.desc}</p>
    </motion.div>
  );
}
