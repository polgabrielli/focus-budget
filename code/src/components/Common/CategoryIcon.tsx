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
};

export const CategoryIcon: React.FC<CategoryIconProps> = ({ name, ...props }) => {
  const IconComponent = iconMap[name] || HelpCircle;
  return <IconComponent {...props} />;
};
