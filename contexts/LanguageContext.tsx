'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'es';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translations
const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    'nav.features': 'Features',
    'nav.industries': 'Industries',
    'nav.business': 'Business Value',
    'nav.login': 'Login',
    
    // Hero
    'hero.title': 'OpsList',
    'hero.subtitle': 'Intelligent Operations Management System',
    'hero.description': 'Manage and supervise your team in daily operations, ensuring every worker completes their tasks flawlessly with evidence.',
    'hero.cta': 'Get Started',
    'hero.learnMore': 'Learn More',
    
    // What is OpsList
    'what.title': 'What is OpsList?',
    'what.description': 'OpsList is an intelligent system for managing operations and work teams. It allows you to create daily operational lists (checklists), assign them to employees, and monitor in real-time how each area of the operation progresses.',
    
    // Features
    'features.title': 'With OpsList you can:',
    'features.config': 'Configure your operation according to your internal processes.',
    'features.create': 'Create your daily operational lists (checklists).',
    'features.register': 'Register and manage your employees within the system.',
    'features.assign': 'Automatically assign the tasks each collaborator must complete.',
    'features.visibility': 'Have total visibility of operational compliance in real-time.',
    'features.identify': 'Immediately identify who is complying and who is not.',
    'features.evidence': 'Review evidence with photos taken from the app (without being able to upload images from the gallery, to prevent fraud).',
    'features.monitor': 'Monitor efficiency by areas, roles, or locations.',
    'features.purpose': 'A tool designed to organize operations, eliminate blind spots, and ensure that every process is executed correctly every day.',
    
    // Industries
    'industries.title': 'Who is OpsList ideal for?',
    'industries.subtitle': 'Primarily for restaurant groups, but also perfect for any business that depends on repetitive operations and daily compliance.',
    'industries.food.title': 'Food & Beverage Industry',
    'industries.food.restaurants': 'Restaurants',
    'industries.food.groups': 'Restaurant Groups',
    'industries.food.cafes': 'Cafes',
    'industries.food.darkKitchens': 'Dark Kitchens',
    'industries.industrial.title': 'Industrial & Field Operations',
    'industries.industrial.cleaning': 'Industrial Cleaning Companies',
    'industries.industrial.landscaping': 'Industrial Landscaping Companies',
    'industries.industrial.facility': 'Facility Management',
    'industries.industrial.maintenance': 'Preventive and Corrective Maintenance',
    'industries.hospitality.title': 'Hospitality & Retail',
    'industries.hospitality.hotels': 'Hotels',
    'industries.hospitality.motels': 'Motels',
    'industries.hospitality.boutiques': 'Boutiques and Retail Stores',
    'industries.hospitality.gyms': 'Gyms',
    'industries.other.title': 'Other Use Cases',
    'industries.other.security': 'Private Security',
    'industries.other.logistics': 'Logistics Centers',
    'industries.other.production': 'Production Plants',
    'industries.other.franchises': 'Franchises of Any Sector',
    'industries.other.healthcare': 'Clinics and Health Centers (cleaning, maintenance, opening/closing)',
    'industries.summary': 'Basically, any company that needs its team to complete daily tasks in a verifiable way can use OpsList.',
    
    // Business Value
    'business.title': 'Business Value',
    'business.efficiency': 'Operational Efficiency',
    'business.efficiency.desc': 'Eliminate blind spots and ensure every process is executed correctly.',
    'business.control': 'Total Control',
    'business.control.desc': 'Real-time visibility of operational compliance across all areas.',
    'business.standardization': 'Standardization',
    'business.standardization.desc': 'Standardize processes and ensure consistent execution across all locations.',
    'business.evidence': 'Verifiable Evidence',
    'business.evidence.desc': 'Photo evidence captured directly from the app, preventing fraud and manipulation.',
    
    // Footer
    'footer.rights': 'All rights reserved.',
  },
  es: {
    // Navigation
    'nav.features': 'Características',
    'nav.industries': 'Industrias',
    'nav.business': 'Valor de Negocio',
    'nav.login': 'Iniciar Sesión',
    
    // Hero
    'hero.title': 'OpsList',
    'hero.subtitle': 'Sistema Inteligente de Gestión Operativa',
    'hero.description': 'Administra y supervisa a tu equipo en operaciones diarias, asegurando que cada trabajador cumpla sus tareas sin fallas y con evidencia.',
    'hero.cta': 'Comenzar',
    'hero.learnMore': 'Saber Más',
    
    // What is OpsList
    'what.title': '¿Qué es OpsList?',
    'what.description': 'OpsList es un sistema inteligente para gestionar operaciones y equipos de trabajo. Permite crear listas operativas diarias (checklists), asignarlas a los empleados y monitorear en tiempo real cómo avanza cada área de la operación.',
    
    // Features
    'features.title': 'Con OpsList puedes:',
    'features.config': 'Configurar tu operación según tus procesos internos.',
    'features.create': 'Crear tus listas operativas diarias (checklists).',
    'features.register': 'Registrar y administrar a tus empleados dentro del sistema.',
    'features.assign': 'Asignar automáticamente las tareas que cada colaborador debe cumplir.',
    'features.visibility': 'Tener visibilidad total del cumplimiento operativo en tiempo real.',
    'features.identify': 'Identificar de inmediato quién está cumpliendo y quién no.',
    'features.evidence': 'Revisar evidencia con fotos tomadas desde la app (sin poder subir imágenes del carrete, para evitar fraudes).',
    'features.monitor': 'Monitorear la eficiencia por áreas, roles o ubicaciones.',
    'features.purpose': 'Una herramienta diseñada para ordenar la operación, eliminar los puntos ciegos y asegurar que cada proceso se ejecute correctamente todos los días.',
    
    // Industries
    'industries.title': '¿Para quién es ideal OpsList?',
    'industries.subtitle': 'Principalmente para grupos restauranteros, pero también es perfecto para cualquier negocio que dependa de operaciones repetitivas y cumplimiento diario.',
    'industries.food.title': 'Industria Gastronómica',
    'industries.food.restaurants': 'Restaurantes',
    'industries.food.groups': 'Grupos Restauranteros',
    'industries.food.cafes': 'Cafeterías',
    'industries.food.darkKitchens': 'Dark Kitchens',
    'industries.industrial.title': 'Operaciones Industriales y de Campo',
    'industries.industrial.cleaning': 'Empresas de Limpieza Industrial',
    'industries.industrial.landscaping': 'Empresas de Jardinería Industrial',
    'industries.industrial.facility': 'Facility Management',
    'industries.industrial.maintenance': 'Mantenimiento Preventivo y Correctivo',
    'industries.hospitality.title': 'Hospitality y Retail',
    'industries.hospitality.hotels': 'Hoteles',
    'industries.hospitality.motels': 'Moteles',
    'industries.hospitality.boutiques': 'Boutiques y Tiendas Retail',
    'industries.hospitality.gyms': 'Gimnasios',
    'industries.other.title': 'Otros Casos de Uso',
    'industries.other.security': 'Seguridad Privada',
    'industries.other.logistics': 'Centros Logísticos',
    'industries.other.production': 'Plantas de Producción',
    'industries.other.franchises': 'Franquicias de Cualquier Sector',
    'industries.other.healthcare': 'Clínicas y Centros de Salud (limpieza, mantenimiento, apertura/cierre)',
    'industries.summary': 'Básicamente, cualquier empresa que necesite que su equipo cumpla tareas diarias de manera verificable puede usar OpsList.',
    
    // Business Value
    'business.title': 'Valor de Negocio',
    'business.efficiency': 'Eficiencia Operativa',
    'business.efficiency.desc': 'Elimina puntos ciegos y asegura que cada proceso se ejecute correctamente.',
    'business.control': 'Control Total',
    'business.control.desc': 'Visibilidad en tiempo real del cumplimiento operativo en todas las áreas.',
    'business.standardization': 'Estandarización',
    'business.standardization.desc': 'Estandariza procesos y asegura ejecución consistente en todas las ubicaciones.',
    'business.evidence': 'Evidencia Verificable',
    'business.evidence.desc': 'Evidencia fotográfica capturada directamente desde la app, previniendo fraudes y manipulaciones.',
    
    // Footer
    'footer.rights': 'Todos los derechos reservados.',
  }
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    // Load language from localStorage or default to 'en'
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'es')) {
      setLanguageState(savedLanguage);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

