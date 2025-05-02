import type { AppointmentCache, VisaAppointment } from "../types";
import { config } from "../config/environment";

/**
 * Önbellek Servisi
 * Daha önce gönderilen randevuları takip eder ve tekrar gönderilmesini engeller
 */
class CacheService {
  private cache: AppointmentCache = {};

  /**
   * Randevu bilgilerinden benzersiz bir anahtar oluşturur
   * Bu anahtar randevunun daha önce gönderilip gönderilmediğini kontrol etmek için kullanılır
   */
  createKey(appointment: VisaAppointment): string {
    return String(appointment.id);
  }

  /**
   * Belirtilen anahtarın önbellekte olup olmadığını kontrol eder
   */
  has(key: string): boolean {
    return !!this.cache[key];
  }

  /**
   * Yeni bir randevuyu önbelleğe ekler
   */
  set(key: string): void {
    this.cache[key] = true;
  }

  /**
   * Belirtilen anahtarı önbellekten siler
   */
  delete(key: string): void {
    delete this.cache[key];
  }

  /**
   * Önbelleği temizler:
   * Maksimum önbellek boyutunu aşan durumlarda en eski kayıtları siler
   */
  cleanup(): void {
    const currentSize = Object.keys(this.cache).length;
    if (currentSize > config.cache.maxSize) {
      console.log(
        `Önbellek boyutu (${currentSize}) maksimumu (${config.cache.maxSize}) aştı. Temizleniyor...`
      );
      const keysToRemove = Object.keys(this.cache).slice(
        0,
        currentSize - config.cache.maxSize
      );
      for (const key of keysToRemove) {
        this.delete(key);
      }
      console.log(`${keysToRemove.length} eski kayıt silindi.`);
    }
  }

  /**
   * Düzenli temizleme işlemini başlatır
   * Belirlenen aralıklarla önbelleği temizler
   */
  startCleanupInterval(): void {
    setInterval(() => this.cleanup(), config.cache.cleanupInterval);
  }
}

export const cacheService = new CacheService();
