# Kafe Otomasyon Sistemi v3 - Proje İster Dokümanı

## 1. Sistem Genel Bakış
Modern bir kafe yönetim sistemi olarak tasarlanan bu proje, üç ana bileşenden oluşmaktadır:
- Backend API (Node.js + Express + PostgreSQL)
- Web Arayüzü (React)
- Mobil Uygulama (React Native)

## 2. Sistem Mimarisi

### 2.1 Backend (Node.js + Express + PostgreSQL)
- RESTful API tasarımı
- PostgreSQL veritabanı
- JWT tabanlı kimlik doğrulama
- WebSocket desteği (real-time işlemler için)
- Redis önbellek (performans optimizasyonu)
- Docker container desteği
- API dokümantasyonu (Swagger/OpenAPI)

### 2.2 Web Arayüzü (React)
- Modern ve responsive tasarım
- Material-UI veya Tailwind CSS
- Redux/Context API state yönetimi
- Progressive Web App (PWA) desteği
- Offline çalışabilme özelliği

### 2.3 Mobil Uygulama (React Native)
- iOS ve Android platform desteği
- Native performans
- Offline veri senkronizasyonu
- Push notification desteği

## 3. Ana Modüller

### 3.1 Kasa Modülü
- **Masa Görüntüleme**
  - Tüm masaların anlık durumlarının görüntülenmesi
  - Masaların doluluk/boşluk durumlarının renk kodlarıyla gösterimi
  - Aktif siparişi olan masaların belirtilmesi
  
- **Hesap İşlemleri**
  - Seçilen masanın detaylı hesap görüntüleme
  - Masa hesabının kapatılması
  - Kısmi ödeme alma
  - Farklı ödeme yöntemlerinin desteklenmesi
  - Para üstü hesaplama tuş takımı
  - Hızlı ödeme butonları
  - Ödeme yöntemleri (Nakit, Kredi Kartı, Yemek Çeki)
  - Yüzdelik iskonto uygulama
  - Tutarı yuvarlama seçeneği
  - Tümünü hesaplama ve bölme seçenekleri

### 3.2 Sipariş Modülü
- **Masa Seçimi**
  - Tüm masaların interaktif görüntülenmesi
  - Masa durumlarının real-time takibi
  
- **Ürün Seçimi**
  - Kategorilere göre ürün listeleme
  - Hızlı ürün arama
  - Özel ürünler için ek özelleştirme pencereleri
  
- **Sipariş Oluşturma**
  - Seçilen ürünlerin sepete eklenmesi
  - Ürün miktarı değiştirme
  - Özel notlar ekleme
  - Siparişi onaylama ve mutfağa iletme

### 3.3 Barista Ekranı
- **Sipariş Takibi**
  - Yeni siparişlerin real-time görüntülenmesi
  - Hazırlanan siparişlerin işaretlenmesi
  - Sipariş detaylarının görüntülenmesi
  - Hazırlanan siparişlerin listeden kaldırılması

### 3.4 Kayıtlar Modülü
- **Satış Analizi**
  - Günlük/haftalık/aylık satış raporları
  - Ürün bazlı satış analizleri
  - Grafik ve tablolarla veri görselleştirme
  
- **Hesap Kayıtları**
  - Detaylı filtreleme seçenekleri
  - Tarih aralığına göre filtreleme
  - Ödeme yöntemine göre filtreleme
  - Masa/garson bazlı filtreleme

### 3.5 Depo Modülü
- **Stok Takibi**
  - Mevcut ürünlerin stok durumu
  - Minimum stok uyarı sistemi
  - Stok giriş/çıkış işlemleri
  - Ürün bazlı stok geçmişi

### 3.6 Ayarlar Modülü
- **Ürün Yönetimi**
  - Yeni ürün ekleme
  - Mevcut ürünleri düzenleme
  - Ürün fiyat güncelleme
  - Ürün görsellerini yönetme
  
- **Kategori Yönetimi**
  - Kategori ekleme/düzenleme/silme
  - Kategori sıralaması ayarlama
  - Kategori-ürün ilişkilendirme
  
- **Masa Yönetimi**
  - Yeni masa ekleme
  - Masa düzenleme/silme
  - Masa yerleşim planı oluşturma
  
- **Menü Düzeni**
  - Kategori sıralaması
  - Ürün sıralaması
  - Öne çıkan ürünleri belirleme
  
- **Kampanya Yönetimi**
  - Yeni kampanya oluşturma
  - Kampanya süre/içerik belirleme
  - Kampanya aktivasyon kontrolü
  - Menüde kampanya görünürlüğü ayarları
  
- **Müzik İstek Sistemi**
  - Spotify entegrasyonu
  - İstek sistemini açma/kapatma
  - İstek limiti belirleme
  - İstek kuralları belirleme

- **Rol Yönetimi**
  - Yeni rol oluşturma
  - Rol düzenleme/silme
  - Rol yetkilerini belirleme
    - Modül bazlı erişim yetkileri
    - İşlem bazlı yetkilendirme
    - Özel yetki tanımlama
  - Kullanıcı-rol atama
  - Rol hiyerarşisi belirleme

## 4. Teknik Gereksinimler

### 4.1 Backend
- Node.js ve Express.js
- PostgreSQL veritabanı
- Redis önbellek
- JWT authentication
- WebSocket (Socket.io)
- Docker container desteği
- API dokümantasyonu
- Loglama sistemi
- Hata yönetimi
- Rate limiting
- CORS yapılandırması

### 4.2 Web Arayüzü
- React 18
- TypeScript
- Material-UI veya Tailwind CSS
- Redux Toolkit veya Context API
- React Query
- PWA desteği
- Responsive tasarım
- Offline çalışabilme
- Progressive loading
- Error boundary

### 4.3 Mobil Uygulama
- React Native
- TypeScript
- Redux Toolkit
- React Query
- Offline storage
- Push notifications
- Deep linking
- Biometric authentication
- Camera ve barcode scanner desteği

## 5. Güvenlik Gereksinimleri
- JWT tabanlı kimlik doğrulama
- Rol bazlı yetkilendirme
- API rate limiting
- Input validasyonu
- SQL injection koruması
- XSS koruması
- CSRF koruması
- Veri şifreleme
- İşlem logları
- Yedekleme sistemi
- Güvenli dosya upload
- SSL/TLS zorunluluğu

## 6. Performans Gereksinimleri
- API response time < 200ms
- Sayfa yüklenme süresi < 2s
- Concurrent kullanıcı desteği
- Önbellek stratejisi
- Database optimizasyonu
- Image optimizasyonu
- Code splitting
- Lazy loading

## 7. Deployment ve DevOps
- Docker container desteği
- CI/CD pipeline
- Automated testing
- Monitoring ve logging
- Backup stratejisi
- Disaster recovery planı
- Environment yönetimi
- Version control (Git) 