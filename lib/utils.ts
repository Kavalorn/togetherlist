import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Об'єднує класи CSS з використанням clsx і tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Форматує дату з ISO формату в більш читабельний вигляд
 */
export function formatDate(date?: string): string {
  if (!date) return "Невідома дата";
  
  try {
    const formatted = new Date(date).toLocaleDateString("uk-UA", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    return formatted;
  } catch (error) {
    return "Невідома дата";
  }
}

/**
 * Форматує число в грошовий формат (наприклад, для бюджету фільму)
 */
export function formatCurrency(amount?: number): string {
  if (!amount) return "Невідомо";
  
  return new Intl.NumberFormat("uk-UA", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Форматує тривалість у хвилинах в години і хвилини
 */
export function formatRuntime(minutes?: number): string {
  if (!minutes) return "Невідомо";
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours === 0) {
    return `${remainingMinutes}хв`;
  }
  
  return `${hours}год ${remainingMinutes > 0 ? `${remainingMinutes}хв` : ""}`;
}

/**
 * Обрізає текст до певної довжини і додає трикрапку
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text || "";
  
  return text.substring(0, maxLength) + "...";
}

/**
 * Генерує URL для зображення з TMDB API з відповідним розміром
 */
export function getTMDBImageUrl(path?: string, size: 'poster' | 'backdrop' | 'profile' = 'poster'): string {
  if (!path) return "/placeholder-image.png";
  
  const sizes = {
    poster: "w500",
    backdrop: "w1280",
    profile: "w185"
  };
  
  return `https://image.tmdb.org/t/p/${sizes[size]}${path}`;
}

/**
 * Затримка виконання функції на певний час (наприклад, для анімацій)
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Генерує ініціали з імені
 */
export function getInitials(name: string): string {
  if (!name) return "U";
  
  const parts = name.split(" ");
  if (parts.length === 1) return name.substring(0, 2).toUpperCase();
  
  return (parts[0][0] + parts[1][0]).toUpperCase();
}