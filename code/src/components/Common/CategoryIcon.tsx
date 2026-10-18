import React from 'react';
import {
  ShoppingCart,
  UtensilsCrossed,
  Baby,
  Car,
  Home,
  ShoppingBag,
  Smartphone,
  Clock,
  Briefcase,
  Laptop,
  TrendingUp,
  Gift,
  HandCoins,
  CreditCard,
  ArrowRightLeft,
  HeartPulse,
  PawPrint,
  Heart,
  Users,
  GraduationCap,
  Dumbbell,
  Plane,
  Coffee,
  Gamepad2,
  Wrench,
  Sparkles,
  Tag,
  HelpCircle,
  type LucideProps
} from 'lucide-react';

interface CategoryIconProps extends LucideProps {
  name: string;
}

const iconMap: Record<string, React.FC<LucideProps>> = {
  ShoppingCart,
  UtensilsCrossed,
  Baby,
  Car,
  Home,
  ShoppingBag,
  Smartphone,
  Clock,
  Briefcase,
  Laptop,
  TrendingUp,
  Gift,
  HandCoins,
  CreditCard,
  ArrowRightLeft,
  HeartPulse,
  PawPrint,
  Heart,
  Users,
  GraduationCap,
  Dumbbell,
  Plane,
  Coffee,
  Gamepad2,
  Wrench,
  Sparkles,
  Tag,
};

export const AVAILABLE_CATEGORY_ICONS: { key: string; label: string }[] = [
  { key: 'ShoppingCart', label: 'Súper' },
  { key: 'UtensilsCrossed', label: 'Comida' },
  { key: 'Baby', label: 'Hijos/Bebé' },
  { key: 'PawPrint', label: 'Mascotas' },
  { key: 'Users', label: 'Familia' },
  { key: 'Heart', label: 'Pareja' },
  { key: 'Car', label: 'Auto' },
  { key: 'Home', label: 'Hogar' },
  { key: 'HeartPulse', label: 'Salud' },
  { key: 'ShoppingBag', label: 'Compras' },
  { key: 'Smartphone', label: 'Digital' },
  { key: 'GraduationCap', label: 'Estudios' },
  { key: 'Dumbbell', label: 'Deporte' },
  { key: 'Plane', label: 'Viajes' },
  { key: 'Coffee', label: 'Café' },
  { key: 'Gamepad2', label: 'Juegos/Ocio' },
  { key: 'Wrench', label: 'Servicios' },
  { key: 'Briefcase', label: 'Trabajo' },
  { key: 'Laptop', label: 'Freelance' },
  { key: 'TrendingUp', label: 'Inversión' },
  { key: 'Gift', label: 'Regalos' },
  { key: 'Sparkles', label: 'Extras' },
  { key: 'Tag', label: 'Etiqueta' },
];

export const AVAILABLE_CATEGORY_COLORS: string[] = [
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#EF4444', // Red
  '#14B8A6', // Teal
  '#6366F1', // Indigo
];

export const CategoryIcon: React.FC<CategoryIconProps> = ({ name, ...props }) => {
  const IconComponent = iconMap[name] || HelpCircle;
  return <IconComponent {...props} />;
};

