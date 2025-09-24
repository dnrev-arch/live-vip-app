import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Validação de email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Formatação de tempo
export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Formatação de número de espectadores
export function formatViewers(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

// Geração de número de espectadores com oscilação
export function generateViewerCount(baseViewers: number, variancePercent: number): number {
  const variance = baseViewers * (variancePercent / 100);
  const randomFactor = (Math.random() - 0.5) * 2; // -1 a 1
  const adjustment = variance * randomFactor;
  return Math.max(1, Math.round(baseViewers + adjustment));
}

// Verificação se usuário é premium
export function isPremiumUser(user: { premium_until?: Date }): boolean {
  if (!user.premium_until) return false;
  return new Date(user.premium_until) > new Date();
}

// Cálculo de tempo restante gratuito
export function getRemainingFreeTime(user: { free_seconds_today: number }): number {
  const totalFreeSeconds = 7 * 60; // 7 minutos
  return Math.max(0, totalFreeSeconds - user.free_seconds_today);
}

// Storage local para PWA
export const storage = {
  get: (key: string) => {
    if (typeof window === 'undefined') return null;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },
  set: (key: string, value: any) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Silently fail
    }
  },
  remove: (key: string) => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
  }
};

// Debounce para heartbeat
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
