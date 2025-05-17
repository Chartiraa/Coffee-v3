# Coffee v3 API Referansı

Bu doküman, Coffee v3 API'sini kullanmak için gereken tüm bilgileri içerir.

## İçindekiler
- [Kimlik Doğrulama](#kimlik-doğrulama)
  - [Google OAuth ile Giriş](#google-oauth-ile-giriş)
- [Kullanıcı Yönetimi](#kullanıcı-yönetimi)
  - [Kendi Profilini Görüntüleme](#kendi-profilini-görüntüleme)
  - [Tüm Kullanıcıları Listeleme](#tüm-kullanıcıları-listeleme)
  - [Bekleyen Kullanıcıları Listeleme](#bekleyen-kullanıcıları-listeleme)
  - [Kullanıcı Rolü Güncelleme](#kullanıcı-rolü-güncelleme)
  - [Kullanıcı Silme](#kullanıcı-silme)
- [Menü Yönetimi](#menü-yönetimi)
  - [Kategoriler](#kategoriler)
  - [Ürünler](#ürünler)
  - [Ürün Seçenekleri](#ürün-seçenekleri)
    - [Ürüne Özel Parametreler İçin Örnek Kullanım](#ürüne-özel-parametreler-için-örnek-kullanım)
- [Masa Yönetimi](#masa-yönetimi)
  - [Tüm Masaları Listeleme](#tüm-masaları-listeleme)
  - [Masa Detayı Görüntüleme](#masa-detayı-görüntüleme)
  - [Yeni Masa Oluşturma](#yeni-masa-oluşturma)
  - [Masa Güncelleme](#masa-güncelleme)
  - [Masa Durumu Güncelleme](#masa-durumu-güncelleme)
  - [Masa Silme](#masa-silme)
- [Sipariş Yönetimi](#sipariş-yönetimi)
  - [Sipariş Oluşturma](#sipariş-oluşturma)
  - [Sipariş Detayı Görüntüleme](#sipariş-detayı-görüntüleme)
  - [Tüm Siparişleri Listeleme](#tüm-siparişleri-listeleme)
  - [Masa Siparişlerini Listeleme](#masa-siparişlerini-listeleme)
  - [Sipariş Durumu Güncelleme](#sipariş-durumu-güncelleme)
  - [Sipariş Güncelleme](#sipariş-güncelleme)
  - [Sipariş İptal Etme](#sipariş-i̇ptal-etme)
- [Stok Yönetimi](#stok-yönetimi)
  - [Tüm Stok Öğelerini Listeleme](#tüm-stok-öğelerini-listeleme)
  - [Stok Kategorilerini Listeleme](#stok-kategorilerini-listeleme)
  - [Düşük Stok Öğelerini Listeleme](#düşük-stok-öğelerini-listeleme)
  - [Stok Öğesi Detayı Görüntüleme](#stok-öğesi-detayı-görüntüleme)
  - [Yeni Stok Öğesi Oluşturma](#yeni-stok-öğesi-oluşturma)
  - [Stok Öğesi Güncelleme](#stok-öğesi-güncelleme)
  - [Stok Miktarı Güncelleme](#stok-miktarı-güncelleme)
  - [Stok İşlemlerini Görüntüleme](#stok-i̇şlemlerini-görüntüleme)
- [Kasa ve Ödeme Yönetimi](#kasa-ve-ödeme-yönetimi)
  - [Masa Bazlı Ödeme İşlemleri](#masa-bazlı-ödeme-işlemleri)
    - [Masa Ödeme Kaydı Oluşturma/Getirme](#masa-ödeme-kaydı-oluşturmagetirme)
    - [Masadaki Ürünlerin Ödeme Durumunu Görüntüleme](#masadaki-ürünlerin-ödeme-durumunu-görüntüleme)
    - [Masa Ödemesi Kapatma](#masa-ödemesi-kapatma)
    - [Masa Ödemesine İndirim Uygulama](#masa-ödemesine-indirim-uygulama)
  - [Ödeme İşlemleri](#ödeme-i̇şlemleri)
    - [Ödeme Oluşturma](#ödeme-oluşturma)
    - [Ödeme Detaylarını Görüntüleme](#ödeme-detaylarını-görüntüleme)
    - [Masa Ödemelerini Listeleme](#masa-ödemelerini-listeleme)
    - [Sipariş Öğesi Ödeme Durumunu Görüntüleme](#sipariş-öğesi-ödeme-durumunu-görüntüleme)
    - [Sipariş Ödemelerini Listeleme](#sipariş-ödemelerini-listeleme)
    - [Ödeme İadesi](#ödeme-i̇adesi)
  - [Kasa İşlemleri](#kasa-i̇şlemleri)
    - [Kasa Bakiyesi Görüntüleme](#kasa-bakiyesi-görüntüleme)
    - [Kasa Açma](#kasa-açma)
    - [Kasa Kapatma](#kasa-kapatma)
    - [Kasa İşlemi Oluşturma](#kasa-i̇şlemi-oluşturma)
    - [Kasa İşlemlerini Listeleme](#kasa-i̇şlemlerini-listeleme)
  - [Raporlar](#raporlar)
    - [Günlük Satış Raporu](#günlük-satış-raporu)
    - [Satış Raporu](#satış-raporu)
    - [Son Ödemeler](#son-ödemeler)
  - [Masa Bazlı Ödeme İşlemleri](#masa-bazlı-ödeme-işlemleri)
    - [Masa Ödeme Kaydı Oluşturma/Getirme](#masa-ödeme-kaydı-oluşturma/getirme)
    - [Masadaki Ürünlerin Ödeme Durumunu Görüntüleme](#masadaki-ürünlerin-ödeme-durumunu-görüntüleme)
    - [Masa Ödemesi Kapatma](#masa-ödemesi-kapatma)
    - [Masa Ödemesine İndirim Uygulama](#masa-ödemesine-indirim-uygulama)

## Kimlik Doğrulama

Tüm API isteklerinizde, kimlik doğrulama için JWT token kullanılmalıdır. Token, Google OAuth ile giriş yaptıktan sonra size sağlanır.

### Google OAuth ile Giriş

Google hesabınızla giriş yapmak ve JWT token almak için:

```
GET /api/v1/auth/google
```

Bu endpoint, kullanıcıyı Google giriş sayfasına yönlendirir. Başarılı giriş sonrasında, kullanıcı frontend URL'e JWT token ile birlikte yönlendirilir: `http://frontend-url?token=YOUR_JWT_TOKEN`

**Not:** Bu endpoint'i doğrudan API aracılığıyla çağırmak için değil, tarayıcıda açın veya frontend uygulamanızdan yönlendirme yapın.

## Kullanıcı Yönetimi

### Kendi Profilini Görüntüleme

Giriş yapmış kullanıcının profil bilgilerini döndürür.

```
GET /api/v1/auth/profile
```

**Gerekli Yetkiler:** Tüm roller (kullanıcı giriş yapmış olmalı)

**Request Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Başarılı Yanıt (200 OK)**
```json
{
  "id": 1,
  "google_id": "123456789012345678901",
  "email": "user@example.com",
  "full_name": "Örnek Kullanıcı",
  "profile_picture": "https://example.com/profile.jpg",
  "role": "admin",
  "created_at": "2023-10-15T12:30:45.000Z",
  "updated_at": "2023-10-15T12:30:45.000Z"
}
```

### Tüm Kullanıcıları Listeleme

Sistemdeki tüm kullanıcıları listeler.

```
GET /api/v1/auth/users
```

**Gerekli Yetkiler:** admin, manager

**Request Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Başarılı Yanıt (200 OK)**
```json
[
  {
    "id": 1,
    "google_id": "123456789012345678901",
    "email": "admin@example.com",
    "full_name": "Admin Kullanıcı",
    "profile_picture": "https://example.com/admin.jpg",
    "role": "admin",
    "created_at": "2023-10-15T12:30:45.000Z",
    "updated_at": "2023-10-15T12:30:45.000Z"
  },
  {
    "id": 2,
    "google_id": "234567890123456789012",
    "email": "manager@example.com",
    "full_name": "Yönetici Kullanıcı",
    "profile_picture": "https://example.com/manager.jpg",
    "role": "manager",
    "created_at": "2023-10-16T10:20:30.000Z",
    "updated_at": "2023-10-16T10:20:30.000Z"
  }
]
```

### Bekleyen Kullanıcıları Listeleme

Henüz rol atanmamış (pending) kullanıcıları listeler.

```
GET /api/v1/auth/pending-users
```

**Gerekli Yetkiler:** admin, manager

**Request Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Başarılı Yanıt (200 OK)**
```json
[
  {
    "id": 3,
    "google_id": "345678901234567890123",
    "email": "pending@example.com",
    "full_name": "Bekleyen Kullanıcı",
    "profile_picture": "https://example.com/pending.jpg",
    "role": "pending",
    "created_at": "2023-10-17T09:15:25.000Z",
    "updated_at": "2023-10-17T09:15:25.000Z"
  }
]
```

### Kullanıcı Rolü Güncelleme

Kullanıcının rolünü günceller.

```
POST /api/v1/auth/update-role
```

**Gerekli Yetkiler:** admin, manager (Not: admin rolünü sadece admin atayabilir)

**Request Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "userId": 3,
  "role": "waiter"
}
```

**Geçerli Rol Değerleri:** "admin", "manager", "waiter", "cashier", "barista"

**Başarılı Yanıt (200 OK)**
```json
{
  "id": 3,
  "google_id": "345678901234567890123",
  "email": "user@example.com",
  "full_name": "Güncellenmiş Kullanıcı",
  "profile_picture": "https://example.com/user.jpg",
  "role": "waiter",
  "created_at": "2023-10-17T09:15:25.000Z",
  "updated_at": "2023-10-17T14:30:10.000Z"
}
```

**Hata Yanıtları:**

- `403 Forbidden`: Yetki sorunu
  ```json
  { "error": "Bu işlem için yetkiniz yok" }
  ```
  veya
  ```json
  { "error": "Admin rolünü sadece admin kullanıcılar atayabilir" }
  ```

- `404 Not Found`: Kullanıcı bulunamadı
  ```json
  { "error": "Kullanıcı bulunamadı" }
  ```

### Kullanıcı Silme

Bir kullanıcıyı sistemden siler.

```
DELETE /api/v1/auth/users/:id
```

**Gerekli Yetkiler:** admin, manager (Not: admin kullanıcıları sadece admin silebilir)

**Request Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Path Parameters:**
- `id`: Silinecek kullanıcının ID'si

**Başarılı Yanıt (200 OK)**
```json
{
  "message": "Kullanıcı başarıyla silindi"
}
```

**Hata Yanıtları:**

- `400 Bad Request`: Kullanıcı kendisini silmeye çalışıyor
  ```json
  { "error": "Kendinizi silemezsiniz" }
  ```

- `403 Forbidden`: Yetki sorunu
  ```json
  { "error": "Bu işlem için yetkiniz yok" }
  ```
  veya
  ```json
  { "error": "Admin kullanıcıları sadece admin silebilir" }
  ```

- `404 Not Found`: Kullanıcı bulunamadı
  ```json
  { "error": "Kullanıcı bulunamadı" }
  ```

## Menü Yönetimi

### Kategoriler

#### Tüm Kategorileri Listeleme

Sistemdeki tüm kategorileri listeler.

```
GET /api/v1/menu/categories
```

**Gerekli Yetkiler:** Yetki gerekmez (herkes erişebilir)

**Başarılı Yanıt (200 OK)**
```json
[
  {
    "id": 1,
    "name": "Türk Kahvesi",
    "description": "Geleneksel Türk kahvesi çeşitleri",
    "image_url": "https://example.com/turk-kahvesi.jpg",
    "is_active": true,
    "sort_order": 1,
    "created_at": "2023-10-15T12:30:45.000Z",
    "updated_at": "2023-10-15T12:30:45.000Z"
  },
  {
    "id": 2,
    "name": "Espresso Bazlı",
    "description": "Espresso bazlı kahve çeşitleri",
    "image_url": "https://example.com/espresso.jpg",
    "is_active": true,
    "sort_order": 2,
    "created_at": "2023-10-16T10:20:30.000Z",
    "updated_at": "2023-10-16T10:20:30.000Z"
  }
]
```

#### Aktif Kategorileri Listeleme

Sadece aktif olan kategorileri listeler.

```
GET /api/v1/menu/categories/active
```

**Gerekli Yetkiler:** Yetki gerekmez (herkes erişebilir)

#### Kategori Detayı Görüntüleme

ID'ye göre kategori detayını gösterir.

```
GET /api/v1/menu/categories/:id
```

**Gerekli Yetkiler:** Yetki gerekmez (herkes erişebilir)

**Path Parameters:**
- `id`: Kategori ID'si

#### Yeni Kategori Oluşturma

Yeni bir kategori oluşturur.

```
POST /api/v1/menu/categories
```

**Gerekli Yetkiler:** admin, manager

**Request Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Filtre Kahveler",
  "description": "Çeşitli filtre kahve seçenekleri",
  "image_url": "https://example.com/filter-coffee.jpg",
  "is_active": true,
  "sort_order": 3
}
```

**Başarılı Yanıt (201 Created)**
```json
{
  "id": 3,
  "name": "Filtre Kahveler",
  "description": "Çeşitli filtre kahve seçenekleri",
  "image_url": "https://example.com/filter-coffee.jpg",
  "is_active": true,
  "sort_order": 3,
  "created_at": "2023-10-17T14:30:45.000Z",
  "updated_at": "2023-10-17T14:30:45.000Z"
}
```

#### Kategori Güncelleme

ID'ye göre kategori bilgilerini günceller.

```
PUT /api/v1/menu/categories/:id
```

**Gerekli Yetkiler:** admin, manager

**Path Parameters:**
- `id`: Kategori ID'si

**Request Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Filtre Kahveler",
  "description": "Güncellenmiş açıklama",
  "is_active": true
}
```

#### Kategori Silme

ID'ye göre kategoriyi siler.

```
DELETE /api/v1/menu/categories/:id
```

**Gerekli Yetkiler:** admin, manager

**Path Parameters:**
- `id`: Kategori ID'si

### Ürünler

#### Tüm Ürünleri Listeleme

Sistemdeki tüm ürünleri listeler.

```
GET /api/v1/menu/products
```

**Gerekli Yetkiler:** Yetki gerekmez (herkes erişebilir)

**Başarılı Yanıt (200 OK)**
```json
[
  {
    "id": 1,
    "name": "Türk Kahvesi",
    "description": "Geleneksel Türk kahvesi",
    "price": 30.0,
    "image_url": "https://example.com/turk-kahvesi.jpg",
    "is_active": true,
    "is_available": true,
    "preparation_time": 5,
    "sort_order": 1,
    "category": {
      "id": 1,
      "name": "Türk Kahvesi",
      "description": "Geleneksel Türk kahvesi çeşitleri"
    }
  },
  {
    "id": 2,
    "name": "Latte",
    "description": "Süt ve espresso",
    "price": 45.0,
    "image_url": "https://example.com/latte.jpg",
    "is_active": true,
    "is_available": true,
    "preparation_time": 3,
    "sort_order": 1,
    "category": {
      "id": 2,
      "name": "Espresso Bazlı",
      "description": "Espresso bazlı kahve çeşitleri"
    }
  }
]
```

#### Aktif ve Mevcut Ürünleri Listeleme

Sadece aktif ve stokta olan ürünleri listeler.

```
GET /api/v1/menu/products/active
```

**Gerekli Yetkiler:** Yetki gerekmez (herkes erişebilir)

#### Ürün Detayı Görüntüleme

ID'ye göre ürün detayını gösterir. Ürünün seçenekleri (options) de dahil edilir.

```
GET /api/v1/menu/products/:id
```

**Gerekli Yetkiler:** Yetki gerekmez (herkes erişebilir)

**Path Parameters:**
- `id`: Ürün ID'si

**Başarılı Yanıt (200 OK)**
```json
{
  "id": 1,
  "name": "Türk Kahvesi",
  "description": "Geleneksel Türk kahvesi",
  "price": 30.0,
  "image_url": "https://example.com/turk-kahvesi.jpg",
  "is_active": true,
  "is_available": true,
  "preparation_time": 5,
  "sort_order": 1,
  "category": {
    "id": 1,
    "name": "Türk Kahvesi",
    "description": "Geleneksel Türk kahvesi çeşitleri"
  },
  "options": [
    {
      "id": 1,
      "name": "Şeker Miktarı",
      "description": "Kahvenize ne kadar şeker istiyorsunuz?",
      "is_active": true,
      "is_required": true,
      "values": [
        {
          "id": 1,
          "option_id": 1,
          "value": "Sade",
          "price_modifier": 0,
          "is_default": false,
          "sort_order": 1
        },
        {
          "id": 2,
          "option_id": 1,
          "value": "Az Şekerli",
          "price_modifier": 0,
          "is_default": true,
          "sort_order": 2
        },
        {
          "id": 3,
          "option_id": 1,
          "value": "Orta",
          "price_modifier": 0,
          "is_default": false,
          "sort_order": 3
        },
        {
          "id": 4,
          "option_id": 1,
          "value": "Şekerli",
          "price_modifier": 0,
          "is_default": false,
          "sort_order": 4
        }
      ]
    },
    {
      "id": 2,
      "name": "Fincan Boyutu",
      "description": "Fincan boyutunu seçin",
      "is_active": true,
      "is_required": false,
      "values": [
        {
          "id": 5,
          "option_id": 2,
          "value": "Küçük",
          "price_modifier": 0,
          "is_default": true,
          "sort_order": 1
        },
        {
          "id": 6,
          "option_id": 2,
          "value": "Orta",
          "price_modifier": 5,
          "is_default": false,
          "sort_order": 2
        },
        {
          "id": 7,
          "option_id": 2,
          "value": "Büyük",
          "price_modifier": 10,
          "is_default": false,
          "sort_order": 3
        }
      ]
    }
  ]
}
```

#### Kategoriye Göre Ürünleri Listeleme

Belirli bir kategoriye ait ürünleri listeler.

```
GET /api/v1/menu/categories/:categoryId/products
```

**Gerekli Yetkiler:** Yetki gerekmez (herkes erişebilir)

**Path Parameters:**
- `categoryId`: Kategori ID'si

**Query Parameters:**
- `activeOnly=true`: Sadece aktif ürünleri getir (opsiyonel)
- `availableOnly=true`: Sadece stokta olan ürünleri getir (opsiyonel)

#### Yeni Ürün Oluşturma

Yeni bir ürün oluşturur.

```
POST /api/v1/menu/products
```

**Gerekli Yetkiler:** admin, manager

**Request Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "category_id": 1,
  "name": "Dibek Kahvesi",
  "description": "Özel dibek kahvesi",
  "price": 35.0,
  "image_url": "https://example.com/dibek.jpg",
  "is_active": true,
  "preparation_time": 7,
  "is_available": true,
  "sort_order": 2
}
```

#### Ürün Güncelleme

ID'ye göre ürün bilgilerini günceller.

```
PUT /api/v1/menu/products/:id
```

**Gerekli Yetkiler:** admin, manager

**Path Parameters:**
- `id`: Ürün ID'si

#### Ürün Silme

ID'ye göre ürünü siler.

```
DELETE /api/v1/menu/products/:id
```

**Gerekli Yetkiler:** admin, manager

**Path Parameters:**
- `id`: Ürün ID'si

#### Ürün Stok Durumu Güncelleme

ID'ye göre ürünün stok durumunu günceller (barista da erişebilir).

```
PATCH /api/v1/menu/products/:id/availability
```

**Gerekli Yetkiler:** admin, manager, barista

**Path Parameters:**
- `id`: Ürün ID'si

**Request Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "is_available": false
}
```

### Ürün Seçenekleri

#### Ürün Seçenek Kategorileri Listeleme

Sistemdeki tüm seçenek kategorilerini listeler.

```
GET /api/v1/menu/options
```

**Gerekli Yetkiler:** Yetki gerekmez (herkes erişebilir)

**Query Parameters:**
- `activeOnly=true`: Sadece aktif seçenekleri getir (opsiyonel)

#### Seçenek Kategorisi Detayı

ID'ye göre seçenek kategorisini ve değerlerini gösterir.

```
GET /api/v1/menu/options/:id
```

**Gerekli Yetkiler:** Yetki gerekmez (herkes erişebilir)

**Path Parameters:**
- `id`: Seçenek ID'si

#### Yeni Seçenek Kategorisi Oluşturma

Yeni bir seçenek kategorisi oluşturur.

```
POST /api/v1/menu/options
```

**Gerekli Yetkiler:** admin, manager

**Request Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Aroma",
  "description": "Kahvenize eklenecek aroma",
  "is_active": true
}
```

#### Seçenek Kategori Değerlerini Listeleme

Belirli bir seçenek kategorisinin değerlerini listeler.

```
GET /api/v1/menu/options/:optionId/values
```

**Gerekli Yetkiler:** Yetki gerekmez (herkes erişebilir)

**Path Parameters:**
- `optionId`: Seçenek ID'si

#### Yeni Seçenek Değeri Oluşturma

Belirli bir seçenek kategorisine değer ekler.

```
POST /api/v1/menu/options/:optionId/values
```

**Gerekli Yetkiler:** admin, manager

**Request Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "value": "Karamel",
  "price_modifier": 5.0,
  "is_default": false,
  "sort_order": 1
}
```

#### Ürüne Seçenek Kategorisi Ekleme

Bir ürüne seçenek kategorisi ekler.

```
POST /api/v1/menu/products/:id/options
```

**Gerekli Yetkiler:** admin, manager

**Request Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "option_id": 3,
  "is_required": true
}
```

#### Üründen Seçenek Kategorisi Kaldırma

Bir üründen seçenek kategorisini kaldırır.

```
DELETE /api/v1/menu/products/:id/options/:optionId
```

**Gerekli Yetkiler:** admin, manager

**Path Parameters:**
- `id`: Ürün ID'si
- `optionId`: Seçenek ID'si

### Ürüne Özel Parametreler İçin Örnek Kullanım

Kafe otomasyonunuzda ürünlere özel parametreler eklemek için şu adımları izleyebilirsiniz. Örneğin, Türk kahvesi için özel seçenekler:

1. **Önce seçenek kategorilerini oluşturun:**

```
POST /api/v1/menu/options
{
  "name": "Şeker Miktarı",
  "description": "Kahvenize ne kadar şeker istiyorsunuz?",
  "is_active": true
}

POST /api/v1/menu/options
{
  "name": "Fincan Boyutu",
  "description": "Fincan boyutunu seçin",
  "is_active": true
}
```

2. **Her kategoriye değerler ekleyin:**

```
POST /api/v1/menu/options/1/values
{
  "value": "Sade", 
  "price_modifier": 0,
  "is_default": false,
  "sort_order": 1
}

POST /api/v1/menu/options/1/values
{
  "value": "Az Şekerli", 
  "price_modifier": 0,
  "is_default": true,
  "sort_order": 2
}

POST /api/v1/menu/options/1/values
{
  "value": "Orta", 
  "price_modifier": 0,
  "is_default": false,
  "sort_order": 3
}

POST /api/v1/menu/options/1/values
{
  "value": "Şekerli", 
  "price_modifier": 0,
  "is_default": false,
  "sort_order": 4
}

POST /api/v1/menu/options/2/values
{
  "value": "Küçük", 
  "price_modifier": 0,
  "is_default": true,
  "sort_order": 1
}

POST /api/v1/menu/options/2/values
{
  "value": "Orta", 
  "price_modifier": 5,
  "is_default": false,
  "sort_order": 2
}

POST /api/v1/menu/options/2/values
{
  "value": "Büyük", 
  "price_modifier": 10,
  "is_default": false,
  "sort_order": 3
}
```

3. **Bu seçenekleri ilgili ürünlere ekleyin:**

```
POST /api/v1/menu/products/1/options
{
  "option_id": 1,
  "is_required": true
}

POST /api/v1/menu/products/1/options
{
  "option_id": 2,
  "is_required": false
}
```

4. **Sipariş oluştururken, bu seçenekleri şu şekilde kullanabilirsiniz:**

```
POST /api/v1/orders
{
  "items": [
    {
      "product_id": 1,
      "quantity": 2,
      "options": [
        {
          "option_id": 1,
          "value_id": 3  // "Orta" şekerli
        },
        {
          "option_id": 2,
          "value_id": 6  // "Orta" boy fincan
        }
      ],
      "notes": "Özel istek: köpüklü olsun"
    }
  ],
  "table_id": 5
}
```

Bu şekilde, farklı ürünlere farklı seçenek parametreleri ekleyebilir ve her ürün için özel parametreler tanımlayabilirsiniz. Örneğin:

- **Türk kahvesi** için şeker ve fincan boyutu
- **Espresso bazlı içecekler** için süt tipi (normal, laktozsuz, badem, soya), ekstra shot ve sıcaklık
- **Çaylar** için demleme süresi ve tatlandırıcı
- **Smoothie'ler** için ekstra meyve ve protein tozu

Her ürün grubu için özel parametreler tanımlayarak müşteri isteklerini detaylı şekilde alabilirsiniz. 

## Masa Yönetimi

### Tüm Masaları Listeleme

Sistemdeki tüm masaları listeler.

```
GET /api/v1/tables
```

**Gerekli Yetkiler:** Yetki gerekmez (herkes erişebilir)

**Query Parameters:**
- `activeOnly=true`: Sadece aktif masaları listeler (opsiyonel)

**Başarılı Yanıt (200 OK)**
```json
[
  {
    "id": 1,
    "name": "Masa 1",
    "capacity": 2,
    "is_active": true,
    "location": "İç Mekan",
    "status": "available",
    "qr_code": null,
    "created_at": "2023-10-15T12:30:45.000Z",
    "updated_at": "2023-10-15T12:30:45.000Z"
  },
  {
    "id": 2,
    "name": "Masa 2",
    "capacity": 4,
    "is_active": true,
    "location": "İç Mekan",
    "status": "occupied",
    "qr_code": null,
    "created_at": "2023-10-15T12:31:15.000Z",
    "updated_at": "2023-10-15T12:31:15.000Z"
  }
]
```

### Masa Detayı Görüntüleme

ID'ye göre masa detayını gösterir.

```
GET /api/v1/tables/:id
```

**Gerekli Yetkiler:** Yetki gerekmez (herkes erişebilir)

**Path Parameters:**
- `id`: Masa ID'si

**Başarılı Yanıt (200 OK)**
```json
{
  "id": 1,
  "name": "Masa 1",
  "capacity": 2,
  "is_active": true,
  "location": "İç Mekan",
  "status": "available",
  "qr_code": null,
  "created_at": "2023-10-15T12:30:45.000Z",
  "updated_at": "2023-10-15T12:30:45.000Z"
}
```

### Yeni Masa Oluşturma

Yeni bir masa oluşturur.

```
POST /api/v1/tables
```

**Gerekli Yetkiler:** admin, manager

**Request Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Masa 11",
  "capacity": 6,
  "is_active": true,
  "location": "Teras",
  "status": "available"
}
```

**Başarılı Yanıt (201 Created)**
```json
{
  "id": 11,
  "name": "Masa 11",
  "capacity": 6,
  "is_active": true,
  "location": "Teras",
  "status": "available",
  "qr_code": null,
  "created_at": "2023-10-17T14:30:45.000Z",
  "updated_at": "2023-10-17T14:30:45.000Z"
}
```

### Masa Güncelleme

ID'ye göre masa bilgilerini günceller.

```
PUT /api/v1/tables/:id
```

**Gerekli Yetkiler:** admin, manager

**Path Parameters:**
- `id`: Masa ID'si

**Request Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "capacity": 8,
  "is_active": true,
  "location": "Bahçe"
}
```

**Başarılı Yanıt (200 OK)**
```json
{
  "id": 11,
  "name": "Masa 11",
  "capacity": 8,
  "is_active": true,
  "location": "Bahçe",
  "status": "available",
  "qr_code": null,
  "created_at": "2023-10-17T14:30:45.000Z",
  "updated_at": "2023-10-17T15:25:10.000Z"
}
```

### Masa Durumu Güncelleme

ID'ye göre masa durumunu günceller. Bu özel endpoint, masa durumu değişimini işlerken ilgili otomatik işlemleri de gerçekleştirir.

```
PATCH /api/v1/tables/:id/status
```

**Gerekli Yetkiler:** admin, manager, waiter, cashier, barista

**Path Parameters:**
- `id`: Masa ID'si

**Request Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "occupied"
}
```

**Geçerli Durum Değerleri:**
- `available`: Boş masa
- `occupied`: Dolu masa
- `reserved`: Rezerve edilmiş masa
- `maintenance`: Bakım durumundaki masa

**Başarılı Yanıt (200 OK)**
```json
{
  "id": 11,
  "name": "Masa 11",
  "capacity": 8,
  "is_active": true,
  "location": "Bahçe",
  "status": "occupied",
  "qr_code": null,
  "created_at": "2023-10-17T14:30:45.000Z",
  "updated_at": "2023-10-17T15:35:22.000Z"
}
```

**Not:** 
- Masa durumu `available` (boş) olarak değiştirildiğinde:
  1. Masadaki tüm aktif siparişler "tamamlandı" olarak işaretlenir
  2. Eğer ödenmemiş tutar yoksa, masa ödeme kaydı kapatılır
- Masa durumu `occupied` (dolu) olarak değiştirildiğinde:
  1. Eğer yoksa, masaya yeni bir ödeme kaydı oluşturulur

### Masa Silme

ID'ye göre masayı siler.

```
DELETE /api/v1/tables/:id
```

**Gerekli Yetkiler:** admin, manager

**Path Parameters:**
- `id`: Masa ID'si

**Başarılı Yanıt (200 OK)**
```json
{
  "message": "Masa başarıyla silindi"
}
```

## Sipariş Yönetimi

### Sipariş Oluşturma

Yeni bir sipariş oluşturur.

```
POST /api/v1/orders
```

**Gerekli Yetkiler:** admin, manager, waiter

**Request Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "table_id": 1,
  "items": [
    {
      "product_id": 1,
      "quantity": 2,
      "notes": "Ekstra sıcak olsun",
      "options": [
        {
          "option_id": 1,
          "value_id": 3  // "Orta" şekerli
        },
        {
          "option_id": 2,
          "value_id": 6  // "Orta" boy fincan
        }
      ]
    },
    {
      "product_id": 5,
      "quantity": 1,
      "options": [
        {
          "option_id": 3,
          "value_id": 9  // "Soya" sütü
        }
      ]
    }
  ]
}
```

**Başarılı Yanıt (201 Created)**
```json
{
  "id": 1,
  "table_id": 1,
  "user_id": 2,
  "status": "created",
  "total_amount": 115.00,
  "created_at": "2023-10-17T14:30:45.000Z",
  "updated_at": "2023-10-17T14:30:45.000Z",
  "items": [
    {
      "id": 1,
      "order_id": 1,
      "product_id": 1,
      "product_name": "Türk Kahvesi",
      "quantity": 2,
      "product_price": 30.00,
      "total_price": 70.00,
      "notes": "Ekstra sıcak olsun",
      "created_at": "2023-10-17T14:30:45.000Z",
      "updated_at": "2023-10-17T14:30:45.000Z",
      "product_options": [
        {
          "id": 1,
          "order_item_id": 1,
          "option_id": 1,
          "option_value_id": 3,
          "option_name": "Şeker Miktarı",
          "option_value": "Orta",
          "price_modifier": 0
        },
        {
          "id": 2,
          "order_item_id": 1,
          "option_id": 2,
          "option_value_id": 6,
          "option_name": "Fincan Boyutu",
          "option_value": "Orta",
          "price_modifier": 5
        }
      ]
    },
    {
      "id": 2,
      "order_id": 1,
      "product_id": 5,
      "product_name": "Cappuccino",
      "quantity": 1,
      "product_price": 40.00,
      "total_price": 45.00,
      "notes": null,
      "created_at": "2023-10-17T14:30:45.000Z",
      "updated_at": "2023-10-17T14:30:45.000Z",
      "product_options": [
        {
          "id": 3,
          "order_item_id": 2,
          "option_id": 3,
          "option_value_id": 9,
          "option_name": "Süt Tipi",
          "option_value": "Soya",
          "price_modifier": 5
        }
      ]
    }
  ]
}
```

### Sipariş Detayı Görüntüleme

ID'ye göre sipariş detayını gösterir.

```
GET /api/v1/orders/:id
```

**Gerekli Yetkiler:** Kimlik doğrulama gerekli

**Path Parameters:**
- `id`: Sipariş ID'si

**Request Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Başarılı Yanıt (200 OK)**
```json
{
  "id": 1,
  "table_id": 1,
  "user_id": 2,
  "status": "created",
  "total_amount": 115.00,
  "created_at": "2023-10-17T14:30:45.000Z",
  "updated_at": "2023-10-17T14:30:45.000Z",
  "items": [
    {
      "id": 1,
      "order_id": 1,
      "product_id": 1,
      "product_name": "Türk Kahvesi",
      "quantity": 2,
      "product_price": 30.00,
      "total_price": 70.00,
      "notes": "Ekstra sıcak olsun",
      "created_at": "2023-10-17T14:30:45.000Z",
      "updated_at": "2023-10-17T14:30:45.000Z",
      "product_options": [
        {
          "id": 1,
          "order_item_id": 1,
          "option_id": 1,
          "option_value_id": 3,
          "option_name": "Şeker Miktarı",
          "option_value": "Orta",
          "price_modifier": 0
        },
        {
          "id": 2,
          "order_item_id": 1,
          "option_id": 2,
          "option_value_id": 6,
          "option_name": "Fincan Boyutu",
          "option_value": "Orta",
          "price_modifier": 5
        }
      ]
    },
    {
      "id": 2,
      "order_id": 1,
      "product_id": 5,
      "product_name": "Cappuccino",
      "quantity": 1,
      "product_price": 40.00,
      "total_price": 45.00,
      "notes": null,
      "created_at": "2023-10-17T14:30:45.000Z",
      "updated_at": "2023-10-17T14:30:45.000Z",
      "product_options": [
        {
          "id": 3,
          "order_item_id": 2,
          "option_id": 3,
          "option_value_id": 9,
          "option_name": "Süt Tipi",
          "option_value": "Soya",
          "price_modifier": 5
        }
      ]
    }
  ]
}
```

### Tüm Siparişleri Listeleme

Tüm siparişleri listeler.

```
GET /api/v1/orders
```

**Gerekli Yetkiler:** admin, manager, barista, cashier

**Request Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Query Parameters:**
- `status`: Sipariş durumuna göre filtreleme. Olası değerler: created, in_progress, ready, delivered, completed, cancelled

**Başarılı Yanıt (200 OK)**
```json
[
  {
    "id": 1,
    "table_id": 1,
    "user_id": 2,
    "status": "created",
    "total_amount": 115.00,
    "created_at": "2023-10-17T14:30:45.000Z",
    "updated_at": "2023-10-17T14:30:45.000Z"
  },
  {
    "id": 2,
    "table_id": 3,
    "user_id": 3,
    "status": "in_progress",
    "total_amount": 75.00,
    "created_at": "2023-10-17T14:35:22.000Z",
    "updated_at": "2023-10-17T14:40:15.000Z"
  }
]
```

### Masa Siparişlerini Listeleme

Belirli bir masanın siparişlerini listeler.

```
GET /api/v1/orders/table/:tableId
```

**Gerekli Yetkiler:** Kimlik doğrulama gerekli

**Path Parameters:**
- `tableId`: Masa ID'si

**Request Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Query Parameters:**
- `status`: Sipariş durumuna göre filtreleme. Olası değerler: created, in_progress, ready, delivered, completed, cancelled

**Başarılı Yanıt (200 OK)**
```json
[
  {
    "id": 1,
    "table_id": 1,
    "user_id": 2,
    "status": "created",
    "total_amount": 115.00,
    "created_at": "2023-10-17T14:30:45.000Z",
    "updated_at": "2023-10-17T14:30:45.000Z"
  },
  {
    "id": 5,
    "table_id": 1,
    "user_id": 3,
    "status": "completed",
    "total_amount": 95.00,
    "created_at": "2023-10-16T17:30:45.000Z",
    "updated_at": "2023-10-16T18:15:20.000Z"
  }
]
```

### Sipariş Durumu Güncelleme

Sipariş durumunu günceller.

```
PATCH /api/v1/orders/:id/status
```

**Gerekli Yetkiler:** Kimlik doğrulama gerekli ve role göre değişir:
- in_progress, ready: admin, manager, barista
- delivered: admin, manager, waiter
- completed: admin, manager, cashier
- cancelled: admin, manager

**Path Parameters:**
- `id`: Sipariş ID'si

**Request Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "in_progress"
}
```

**Başarılı Yanıt (200 OK)**
```json
{
  "id": 1,
  "table_id": 1,
  "user_id": 2,
  "status": "in_progress",
  "total_amount": 115.00,
  "created_at": "2023-10-17T14:30:45.000Z",
  "updated_at": "2023-10-17T14:45:30.000Z",
  "items": [
    // Sipariş öğeleri listesi
  ]
}
```

### Sipariş Güncelleme

Mevcut bir siparişi günceller. Sadece 'created' veya 'in_progress' durumundaki siparişler güncellenebilir.

```
PUT /api/v1/orders/:id
```

**Gerekli Yetkiler:** admin, manager, waiter

**Path Parameters:**
- `id`: Sipariş ID'si

**Request Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "table_id": 2,
  "items": [
    {
      "product_id": 1,
      "quantity": 2,
      "notes": "Şekersiz",
      "options": [
        {
          "option_id": 1,
          "value_id": 2
        }
      ]
    },
    {
      "product_id": 3,
      "quantity": 1
    }
  ]
}
```

**Başarılı Yanıt (200 OK)**
```json
{
  "id": 1,
  "table_id": 2,
  "user_id": 2,
  "status": "created",
  "total_amount": 159.80,
  "created_at": "2023-10-17T14:30:45.000Z",
  "updated_at": "2023-10-17T15:20:15.000Z",
  "items": [
    {
      "id": 6,
      "order_id": 1,
      "product_id": 1,
      "product_name": "Filtre Kahve",
      "quantity": 2,
      "product_price": 35.90,
      "total_price": 71.80,
      "notes": "Şekersiz",
      "product_options": [
        {
          "id": 8,
          "order_item_id": 6,
          "option_id": 1,
          "option_value_id": 2,
          "option_name": "Süt",
          "option_value": "Badem Sütü",
          "price_modifier": 8.00
        }
      ]
    },
    {
      "id": 7,
      "order_id": 1,
      "product_id": 3,
      "product_name": "Latte",
      "quantity": 1,
      "product_price": 40.00,
      "total_price": 40.00
    }
  ]
}
```

**Not:** Güncelleme işlemi, tüm sipariş öğelerini yeniden oluşturur. Mevcut öğeler silinip, yeni öğeler eklenir.

**Hata Yanıtları:**
- `400 Bad Request`: Geçersiz veri gönderildi veya sipariş durumu güncellenemez.
- `401 Unauthorized`: Giriş yapılmamış.
- `403 Forbidden`: Bu işlemi yapmak için yetkiniz yok.
- `404 Not Found`: Sipariş veya masa bulunamadı.
- `500 Internal Server Error`: Sunucu hatası.

### Sipariş İptal Etme

Siparişi iptal eder.

```
DELETE /api/v1/orders/:id
```

**Gerekli Yetkiler:** admin, manager

**Path Parameters:**
- `id`: Sipariş ID'si

**Request Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Başarılı Yanıt (200 OK)**
```json
{
  "id": 1,
  "table_id": 1,
  "user_id": 2,
  "status": "cancelled",
  "total_amount": 115.00,
  "created_at": "2023-10-17T14:30:45.000Z",
  "updated_at": "2023-10-17T14:50:20.000Z",
  "items": [
    // Sipariş öğeleri listesi
  ]
}
```

**Hata Yanıtları:**

- `400 Bad Request`: Kullanıcı kendisini silmeye çalışıyor
  ```json
  { "error": "Kendinizi silemezsiniz" }
  ```

- `403 Forbidden`: Yetki sorunu
  ```json
  { "error": "Bu işlem için yetkiniz yok" }
  ```
  veya
  ```json
  { "error": "Admin kullanıcıları sadece admin silebilir" }
  ```

- `404 Not Found`: Kullanıcı bulunamadı
  ```json
  { "error": "Kullanıcı bulunamadı" }
  ```

## Stok Yönetimi

### Tüm Stok Öğelerini Listeleme

Sistemdeki tüm stok öğelerini listeler.

```
GET /api/v1/inventory
```

**Gerekli Yetkiler:** Kimlik doğrulama gerekli

**Request Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Query Parameters:**
- `category`: Belirli bir kategoriye göre filtreleme (opsiyonel)
- `lowStock=true`: Sadece düşük stokta olanları listele (quantity <= min_quantity)

**Başarılı Yanıt (200 OK)**
```json
[
  {
    "id": 1,
    "name": "Arabica Çekirdek Kahve",
    "category": "Kahve Çekirdeği",
    "unit": "kg",
    "quantity": 10.00,
    "min_quantity": 2.00,
    "cost_price": 150.00,
    "supplier_id": null,
    "supplier_name": null,
    "is_active": true,
    "last_restock_date": "2023-10-15T12:30:45.000Z",
    "created_at": "2023-10-15T12:30:45.000Z",
    "updated_at": "2023-10-15T12:30:45.000Z"
  },
  {
    "id": 2,
    "name": "Robusta Çekirdek Kahve",
    "category": "Kahve Çekirdeği",
    "unit": "kg",
    "quantity": 8.00,
    "min_quantity": 2.00,
    "cost_price": 120.00,
    "supplier_id": null,
    "supplier_name": null,
    "is_active": true,
    "last_restock_date": "2023-10-15T12:30:45.000Z",
    "created_at": "2023-10-15T12:30:45.000Z",
    "updated_at": "2023-10-15T12:30:45.000Z"
  }
]
```

### Stok Kategorilerini Listeleme

Sistemdeki tüm stok kategorilerini listeler.

```
GET /api/v1/inventory/categories
```

**Gerekli Yetkiler:** Kimlik doğrulama gerekli

**Request Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Başarılı Yanıt (200 OK)**
```json
[
  "Ambalaj",
  "Çay",
  "Kahve",
  "Kahve Çekirdeği",
  "Süt Ürünleri",
  "Şeker",
  "Şurup",
  "Tatlı"
]
```

### Düşük Stok Öğelerini Listeleme

Miktarı minimum miktarın altına düşen stok öğelerini listeler.

```
GET /api/v1/inventory/low-stock
```

**Gerekli Yetkiler:** Kimlik doğrulama gerekli

**Request Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Başarılı Yanıt (200 OK)**
```json
[
  {
    "id": 12,
    "name": "Bitki Çayı - Nane",
    "category": "Çay",
    "unit": "kg",
    "quantity": 0.30,
    "min_quantity": 0.50,
    "cost_price": 70.00,
    "supplier_id": null,
    "supplier_name": null,
    "is_active": true,
    "last_restock_date": "2023-10-01T09:30:45.000Z",
    "created_at": "2023-10-01T09:30:45.000Z",
    "updated_at": "2023-10-18T15:20:10.000Z"
  }
]
```

### Stok Öğesi Detayı Görüntüleme

ID'ye göre stok öğesi detayını gösterir.

```
GET /api/v1/inventory/:id
```

**Gerekli Yetkiler:** Kimlik doğrulama gerekli

**Path Parameters:**
- `id`: Stok öğesi ID'si

**Request Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Başarılı Yanıt (200 OK)**
```json
{
  "id": 1,
  "name": "Arabica Çekirdek Kahve",
  "category": "Kahve Çekirdeği",
  "unit": "kg",
  "quantity": 10.00,
  "min_quantity": 2.00,
  "cost_price": 150.00,
  "supplier_id": null,
  "supplier_name": null,
  "is_active": true,
  "last_restock_date": "2023-10-15T12:30:45.000Z",
  "created_at": "2023-10-15T12:30:45.000Z",
  "updated_at": "2023-10-15T12:30:45.000Z"
}
```

### Yeni Stok Öğesi Oluşturma

Yeni bir stok öğesi oluşturur.

```
POST /api/v1/inventory
```

**Gerekli Yetkiler:** admin, manager

**Request Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Yeşil Çay",
  "category": "Çay",
  "unit": "kg",
  "quantity": 3.00,
  "min_quantity": 0.50,
  "cost_price": 80.00,
  "supplier_name": "Çay Tedarikçisi Ltd.",
  "is_active": true
}
```

**Başarılı Yanıt (201 Created)**
```json
{
  "id": 26,
  "name": "Yeşil Çay",
  "category": "Çay",
  "unit": "kg",
  "quantity": 3.00,
  "min_quantity": 0.50,
  "cost_price": 80.00,
  "supplier_id": null,
  "supplier_name": "Çay Tedarikçisi Ltd.",
  "is_active": true,
  "last_restock_date": null,
  "created_at": "2023-10-19T14:30:45.000Z",
  "updated_at": "2023-10-19T14:30:45.000Z"
}
```

### Stok Öğesi Güncelleme

ID'ye göre stok öğesi bilgilerini günceller.

```
PUT /api/v1/inventory/:id
```

**Gerekli Yetkiler:** admin, manager

**Path Parameters:**
- `id`: Stok öğesi ID'si

**Request Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Yeşil Çay Premium",
  "min_quantity": 1.00,
  "cost_price": 90.00,
  "supplier_name": "Premium Çay Tedarikçisi"
}
```

**Başarılı Yanıt (200 OK)**
```json
{
  "id": 26,
  "name": "Yeşil Çay Premium",
  "category": "Çay",
  "unit": "kg",
  "quantity": 3.00,
  "min_quantity": 1.00,
  "cost_price": 90.00,
  "supplier_id": null,
  "supplier_name": "Premium Çay Tedarikçisi",
  "is_active": true,
  "last_restock_date": null,
  "created_at": "2023-10-19T14:30:45.000Z",
  "updated_at": "2023-10-19T14:45:20.000Z"
}
```

### Stok Miktarı Güncelleme

Stok öğesinin miktarını günceller ve işlem kaydı oluşturur. Bu endpoint iki işlemi birden yapar:
1. Yeni bir stok işlem kaydı oluşturur (inventory_transactions)
2. Stok öğesinin miktarını günceller (inventory)

```
PATCH /api/v1/inventory/:id/quantity
```

**Gerekli Yetkiler:** admin, manager, barista

**Path Parameters:**
- `id`: Stok öğesi ID'si

**Request Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "quantity": number,
  "transaction_type": "purchase" | "usage" | "adjustment" | "loss",
  "unit_cost": number (optional),
  "notes": string (optional)
}
```

**Not:** Miktar pozitif ise ekleme, negatif ise çıkarma işlemi yapılır.

**İşlem Türleri (transaction_type):**
- `purchase`: Satın alma (stok girişi)
- `usage`: Kullanım (stok çıkışı)
- `adjustment`: Stok ayarlaması
- `loss`: Stok kaybı (kayıp, bozulma vb.)

**Başarılı Yanıt (200 OK)**
```json
{
  "id": 26,
  "name": "Yeşil Çay Premium",
  "category": "Çay",
  "unit": "kg",
  "quantity": 5.50,
  "min_quantity": 1.00,
  "cost_price": 90.00,
  "supplier_id": null,
  "supplier_name": "Premium Çay Tedarikçisi",
  "is_active": true,
  "last_restock_date": "2023-10-19T15:10:30.000Z",
  "created_at": "2023-10-19T14:30:45.000Z",
  "updated_at": "2023-10-19T15:10:30.000Z",
  "transaction": {
    "id": 1,
    "inventory_item_id": 26,
    "transaction_type": "purchase",
    "quantity": 2.50,
    "previous_quantity": 3.00,
    "current_quantity": 5.50,
    "unit_cost": 90.00,
    "total_cost": 225.00,
    "notes": "Tedarikçiden yeni alım",
    "user_id": 1,
    "created_at": "2023-10-19T15:10:30.000Z"
  }
}
```

**Hata Yanıtları:**
- `400 Bad Request`: Geçersiz veri gönderildi
- `401 Unauthorized`: Giriş yapılmamış
- `403 Forbidden`: Bu işlemi yapmak için yetkiniz yok
- `404 Not Found`: Stok öğesi bulunamadı
- `500 Internal Server Error`: Sunucu hatası

### Stok İşlemlerini Görüntüleme

Stok işlemlerini listeler.

```
GET /api/v1/inventory/transactions
```

**Gerekli Yetkiler:** admin, manager

**Request Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Query Parameters:**
- `itemId`: Belirli bir stok öğesine ait işlemleri listele (opsiyonel)
- `transactionType`: İşlem türüne göre filtreleme (purchase, usage, adjustment, loss)
- `startDate`: Başlangıç tarihi (YYYY-MM-DD formatında)
- `endDate`: Bitiş tarihi (YYYY-MM-DD formatında)

**Başarılı Yanıt (200 OK)**
```json
[
  {
    "id": 1,
    "inventory_item_id": 26,
    "transaction_type": "purchase",
    "quantity": 2.50,
    "previous_quantity": 3.00,
    "current_quantity": 5.50,
    "unit_cost": 90.00,
    "total_cost": 225.00,
    "notes": "Tedarikçiden yeni alım",
    "user_id": 1,
    "created_at": "2023-10-19T15:10:30.000Z"
  },
  {
    "id": 2,
    "inventory_item_id": 5,
    "transaction_type": "usage",
    "quantity": -2.00,
    "previous_quantity": 20.00,
    "current_quantity": 18.00,
    "unit_cost": null,
    "total_cost": null,
    "notes": "Günlük kullanım",
    "user_id": 2,
    "created_at": "2023-10-19T15:15:10.000Z"
  }
]
```

## Kasa ve Ödeme Yönetimi

### Ödeme İşlemleri

#### Ödeme Oluşturma

Sipariş veya masa için ödeme işlemi oluşturur.

```
POST /api/v1/payments
```

**Gerekli Yetkiler:** admin, manager, cashier

**Request Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Request Body (Sipariş Bazlı Ödeme):**
```json
{
  "order_id": 101,
  "amount": 115.00,
  "payment_method": "cash",
  "reference_number": null,
  "notes": "Nakit ödeme"
}
```

**Request Body (Masa Bazlı ve Ürün Seçimli Ödeme):**
```json
{
  "table_id": 5,
  "amount": 65.00,
  "payment_method": "credit_card",
  "notes": "Kısmen ödeme",
  "order_items": [
    {
      "order_item_id": 1,
      "paid_quantity": 1
    },
    {
      "order_item_id": 2,
      "paid_quantity": 1
    }
  ]
}
```

**Başarılı Yanıt (201 Created)**
```json
{
  "id": 1,
  "order_id": null,
  "table_payment_id": 1,
  "amount": 65.00,
  "payment_method": "credit_card",
  "status": "completed",
  "reference_number": null,
  "notes": "Kısmen ödeme",
  "user_id": 3,
  "created_at": "2023-10-20T15:30:45.000Z",
  "updated_at": "2023-10-20T15:30:45.000Z",
  "item_payments": [
    {
      "id": 1,
      "order_item_id": 1,
      "payment_id": 1,
      "paid_quantity": 1,
      "amount": 30.00,
      "created_at": "2023-10-20T15:30:45.000Z"
    },
    {
      "id": 2,
      "order_item_id": 2,
      "payment_id": 1,
      "paid_quantity": 1,
      "amount": 35.00,
      "created_at": "2023-10-20T15:30:45.000Z"
    }
  ]
}
```

#### Ödeme Detaylarını Görüntüleme

Bir ödemenin ayrıntılarını gösterir.

```
GET /api/v1/payments/:id
```

**Gerekli Yetkiler:** Kimlik doğrulama gerekli

**Path Parameters:**
- `id`: Ödeme ID'si

**Request Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Başarılı Yanıt (200 OK)**
```json
{
  "id": 1,
  "order_id": null,
  "table_payment_id": 1,
  "amount": 65.00,
  "payment_method": "credit_card",
  "status": "completed",
  "reference_number": null,
  "notes": "Kısmen ödeme",
  "user_id": 3,
  "created_at": "2023-10-20T15:30:45.000Z",
  "updated_at": "2023-10-20T15:30:45.000Z",
  "item_payments": [
    {
      "id": 1,
      "order_item_id": 1,
      "payment_id": 1,
      "paid_quantity": 1,
      "amount": 30.00,
      "created_at": "2023-10-20T15:30:45.000Z",
      "product_name": "Türk Kahvesi",
      "product_price": 30.00,
      "total_quantity": 2
    },
    {
      "id": 2,
      "order_item_id": 2,
      "payment_id": 1,
      "paid_quantity": 1,
      "amount": 35.00,
      "created_at": "2023-10-20T15:30:45.000Z",
      "product_name": "Limonata",
      "product_price": 35.00,
      "total_quantity": 1
    }
  ]
}
```

#### Masa Ödemelerini Listeleme

Bir masanın tüm ödemelerini listeler.

```
GET /api/v1/payments/table/:tableId
```

**Gerekli Yetkiler:** Kimlik doğrulama gerekli

**Path Parameters:**
- `tableId`: Masa ID'si

**Request Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Başarılı Yanıt (200 OK)**
```json
[
  {
    "id": 1,
    "order_id": null,
    "table_payment_id": 1,
    "amount": 65.00,
    "payment_method": "credit_card",
    "status": "completed",
    "reference_number": null,
    "notes": "Kısmen ödeme",
    "user_id": 3,
    "created_at": "2023-10-20T15:30:45.000Z",
    "updated_at": "2023-10-20T15:30:45.000Z"
  },
  {
    "id": 2,
    "order_id": null,
    "table_payment_id": 1,
    "amount": 150.00,
    "payment_method": "cash",
    "status": "completed",
    "reference_number": null,
    "notes": "Kalan hesap ödemesi",
    "user_id": 3,
    "created_at": "2023-10-20T16:10:20.000Z",
    "updated_at": "2023-10-20T16:10:20.000Z"
  }
]
```

#### Sipariş Öğesi Ödeme Durumunu Görüntüleme

Bir siparişin öğelerinin ödeme durumunu gösterir.

```
GET /api/v1/payments/order/:orderId/items-status
```

**Gerekli Yetkiler:** Kimlik doğrulama gerekli

**Path Parameters:**
- `orderId`: Sipariş ID'si

**Request Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Başarılı Yanıt (200 OK)**
```json
[
  {
    "order_item_id": 1,
    "product_name": "Türk Kahvesi",
    "total_quantity": 2,
    "paid_quantity": 1,
    "remaining_quantity": 1
  },
  {
    "order_item_id": 2,
    "product_name": "Limonata",
    "total_quantity": 1,
    "paid_quantity": 1,
    "remaining_quantity": 0
  }
]
```

#### Sipariş Ödemelerini Listeleme

Belirli bir siparişe ait ödemeleri listeler.

```
GET /api/v1/payments/order/:orderId
```

**Gerekli Yetkiler:** Kimlik doğrulama gerekli

**Path Parameters:**
- `orderId`: Sipariş ID'si

**Request Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Başarılı Yanıt (200 OK)**
```json
[
  {
    "id": 1,
    "order_id": 101,
    "table_payment_id": null,
    "amount": 115.00,
    "payment_method": "cash",
    "status": "refunded",
    "reference_number": null,
    "notes": "Nakit ödeme\nMüşteri memnuniyetsizliği nedeniyle iade",
    "user_id": 3,
    "created_at": "2023-10-19T16:30:45.000Z",
    "updated_at": "2023-10-19T17:15:20.000Z"
  }
]
```

#### Ödeme İadesi

Tamamlanmış bir ödemeyi iade eder.

```
POST /api/v1/payments/:id/refund
```

**Gerekli Yetkiler:** admin, manager

**Path Parameters:**
- `id`: Ödeme ID'si

**Request Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "notes": "Müşteri memnuniyetsizliği nedeniyle iade"
}
```

**Başarılı Yanıt (200 OK)**
```json
{
  "id": 1,
  "order_id": 101,
  "table_payment_id": null,
  "amount": 115.00,
  "payment_method": "cash",
  "status": "refunded",
  "reference_number": null,
  "notes": "Nakit ödeme\nMüşteri memnuniyetsizliği nedeniyle iade",
  "user_id": 3,
  "created_at": "2023-10-19T16:30:45.000Z",
  "updated_at": "2023-10-19T17:15:20.000Z"
}
```

### Raporlar

#### Günlük Satış Raporu

Belirli bir günün satış raporunu gösterir.

```
GET /api/v1/payments/reports/daily-sales
```

**Gerekli Yetkiler:** admin, manager, cashier

**Request Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Query Parameters:**
- `date`: Rapor tarihi (YYYY-MM-DD formatında, belirtilmezse bugün)

**Başarılı Yanıt (200 OK)**
```json
{
  "date": "2023-10-19",
  "total_sales": 3150.75,
  "total_orders": 25,
  "total_discounts": 150.25,
  "total_complimentary": 2,
  "payment_methods": [
    {
      "payment_method": "cash",
      "count": 15,
      "amount": 1750.25
    },
    {
      "payment_method": "credit_card",
      "count": 8,
      "amount": 1250.50
    },
    {
      "payment_method": "mobile",
      "count": 2,
      "amount": 150.00
    }
  ]
}
```

#### Satış Raporu

Belirli bir tarih aralığı için detaylı satış raporu gösterir.

```
GET /api/v1/payments/reports/sales
```

**Gerekli Yetkiler:** admin, manager, cashier

**Request Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Query Parameters:**
- `startDate`: Başlangıç tarihi (YYYY-MM-DD formatında)
- `endDate`: Bitiş tarihi (YYYY-MM-DD formatında)

**Başarılı Yanıt (200 OK)**
```json
{
  "start_date": "2023-10-01",
  "end_date": "2023-10-31",
  "total_sales": 45250.75,
  "total_orders": 325,
  "average_order_value": 139.23,
  "payment_methods": [
    {
      "payment_method": "cash",
      "count": 150,
      "amount": 20150.25,
      "percentage": 44.5
    },
    {
      "payment_method": "credit_card",
      "count": 160,
      "amount": 22500.50,
      "percentage": 49.7
    },
    {
      "payment_method": "mobile",
      "count": 15,
      "amount": 2600.00,
      "percentage": 5.8
    }
  ],
  "top_products": [
    {
      "product_id": 1,
      "product_name": "Türk Kahvesi",
      "quantity": 450,
      "total_sales": 13500.00,
      "average_price": 30.00
    }
  ],
  "hourly_sales": [
    {
      "hour": 9,
      "total_sales": 2500.50,
      "order_count": 25
    }
  ],
  "payments": [
    {
      "id": 1,
      "order_id": 101,
      "amount": 115.00,
      "payment_method": "cash",
      "status": "completed",
      "created_at": "2023-10-19T16:30:45.000Z",
      "user_id": 3,
      "user_name": "Ahmet Yılmaz"
    }
  ]
}
```

#### Son Ödemeler

Son yapılan ödemeleri listeler.

```
GET /api/v1/payments/recent
```

**Gerekli Yetkiler:** admin, manager, cashier

**Request Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Query Parameters:**
- `limit`: Listelenecek maksimum ödeme sayısı (varsayılan: 100)

**Başarılı Yanıt (200 OK)**
```json
[
  {
    "id": 1,
    "order_id": 101,
    "table_number": 5,
    "amount": 115.00,
    "payment_method": "cash",
    "status": "completed",
    "created_at": "2023-10-19T16:30:45.000Z",
    "cashier_id": 3,
    "cashier_name": "Ahmet Yılmaz",
    "notes": "Nakit ödeme",
    "item_payments": [
      {
        "product_name": "Türk Kahvesi",
        "paid_quantity": 2,
        "product_price": 30.00,
        "amount": 60.00
      },
      {
        "product_name": "Limonata",
        "paid_quantity": 1,
        "product_price": 35.00,
        "amount": 35.00
      }
    ]
  }
]
``` 