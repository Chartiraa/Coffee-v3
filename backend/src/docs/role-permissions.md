# Kullanıcı Rolleri ve Yetkileri

Bu dokümanda Coffee v3 sistemindeki kullanıcı rolleri ve her rolün yetkileri açıklanmaktadır.

## Roller

Sistemde aşağıdaki roller bulunmaktadır:

- **Admin**: Tam yetkili kullanıcı, tüm işlemleri yapabilir
- **Manager**: İşletme yöneticisi, admin haricinde tüm yetkilere sahiptir
- **Waiter**: Garson, sipariş alma ve güncellemeye yetkilidir
- **Cashier**: Kasiyer, hesap kapama ve ödeme işlemlerine yetkilidir
- **Barista**: Kahve hazırlama ve sipariş durumu güncellemeye yetkilidir
- **Pending**: Yeni kayıt olmuş, henüz rol atanmamış kullanıcılar

## Rol Yetkileri

| İşlem | Admin | Manager | Waiter | Cashier | Barista | Pending |
|-------|-------|---------|--------|---------|---------|---------|
| Profil Görüntüleme | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Tüm Kullanıcıları Listeleme | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Bekleyen Kullanıcıları Listeleme | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Kullanıcı Rolü Değiştirme | ✅ | ✅* | ❌ | ❌ | ❌ | ❌ |
| Admin Rolü Atama | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Kullanıcı Silme | ✅ | ✅* | ❌ | ❌ | ❌ | ❌ |
| Admin Kullanıcıları Silme | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Sipariş Oluşturma | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Sipariş Güncelleme | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| Sipariş İptal Etme | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Ödeme Alma | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Rapor Görüntüleme | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |

*Manager rolü admin rolü veremez ve admin kullanıcıları silemez.

## Yetkilendirme Akışı

1. Kullanıcı Google hesabıyla sisteme giriş yapar
2. İlk giriş yapan kullanıcılar "pending" rolüyle kaydedilir
3. Admin veya manager rolündeki bir kullanıcı, "pending" kullanıcılarına uygun rol atar
4. Kullanıcılar atanan rollerine göre sistemdeki özelliklere erişebilir

## API Endpoints

- **/api/v1/auth/profile**: Kendi profil bilgilerini görüntüleme
- **/api/v1/auth/users**: Tüm kullanıcıları listeleme (admin, manager)
- **/api/v1/auth/pending-users**: Bekleyen kullanıcıları listeleme (admin, manager)
- **/api/v1/auth/update-role**: Kullanıcı rolü güncelleme (admin, manager)
- **/api/v1/auth/users/:id**: Kullanıcı silme (admin, manager) 