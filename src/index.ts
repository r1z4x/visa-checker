import cron from 'node-cron';
import { config } from './config/environment';
import { fetchAppointments } from './services/api';
import { cacheService } from './services/cache';
import { telegramService } from './services/telegram';

/**
 * Merkez adından şehir ismini çıkarır
 * @param centerName Merkez adı
 * @returns Şehir ismi
 */
function extractCity(centerName: string): string {
  // Merkez adından şehir ismini çıkar
  const match = centerName.match(/(?:^|\s)-\s*([^-]+)$/);
  return match ? match[1].trim() : centerName;
}

/**
 * Ana kontrol fonksiyonu
 * Yeni randevuları kontrol eder ve uygun olanları Telegram'a gönderir
 */
async function checkAppointments(): Promise<void> {
  try {
    const appointments = await fetchAppointments();
    
    if (appointments.length === 0) {
      console.log('Randevu bulunamadı veya bir hata oluştu');
      return;
    }
    
    for (const appointment of appointments) {
      // Sadece hedef ülke için olan randevuları kontrol et
      if (appointment.source_country !== config.app.targetCountry) continue;

      // Sadece hedef misyon ülkesi için olan randevuları kontrol et
      if (appointment.mission_country !== config.app.missionCountry) continue;

      // Eğer hedef şehirler belirtilmişse, sadece o şehirlerdeki randevuları kontrol et
      if (config.app.targetCities.length > 0) {
        const appointmentCity = extractCity(appointment.center_name);
        const cityMatch = config.app.targetCities.some(city => 
          appointmentCity.toLowerCase().includes(city.toLowerCase())
        );
        if (!cityMatch) continue;
      }
      
      const appointmentKey = cacheService.createKey(appointment);
      
      // Debug modunda tüm randevuları göster
      if (config.app.debug) {
        console.log(`Randevu bulundu: ${JSON.stringify(appointment, null, 2)}`);
      }
      
      // Daha önce gönderilmemiş randevuları işle
      if (!cacheService.has(appointmentKey)) {
        cacheService.set(appointmentKey);
        
        const success = await telegramService.sendNotification(appointment);
        if (success) {
          console.log(`Bildirim gönderildi: ${appointmentKey}`);
        } else {
          // Hata durumunda önbellekten sil ve bir sonraki kontrolde tekrar dene
          cacheService.delete(appointmentKey);
        }
      }
    }
  } catch (error) {
    console.error('Randevu kontrolü sırasında hata:', error);
  }
}

// Önbellek temizleme işlemini başlat
cacheService.startCleanupInterval();

// Zamanlanmış görevi başlat
cron.schedule(config.app.checkInterval, checkAppointments);
console.log(`Vize randevu kontrolü başlatıldı. Kontrol sıklığı: ${config.app.checkInterval}`);
console.log(`Hedef ülke: ${config.app.targetCountry}`);
console.log(`Misyon ülkesi: ${config.app.missionCountry}`);
if (config.app.targetCities.length > 0) {
  console.log(`Hedef şehirler: ${config.app.targetCities.join(', ')}`);
}

// İlk kontrolü yap
void checkAppointments();