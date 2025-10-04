# 🌐 pluviax.earth DNS Ayarları

## Vercel Custom Domain Kurulumu

### 1. Vercel Dashboard'da Domain Ayarları
1. Vercel dashboard'a gidin: https://vercel.com/dashboard
2. Projenizi seçin
3. **Settings** → **Domains**
4. **Add Domain** → `pluviax.earth`
5. **Add Domain** → `www.pluviax.earth`

### 2. DNS Kayıtları (Domain sağlayıcınızda)

#### A. Vercel'e Point Etme
```
Type: A
Name: @
Value: 76.76.19.61

Type: A  
Name: www
Value: 76.76.19.61
```

#### B. CNAME Kayıtları (Alternatif)
```
Type: CNAME
Name: @
Value: cname.vercel-dns.com

Type: CNAME
Name: www  
Value: cname.vercel-dns.com
```

### 3. SSL Sertifikası
- Vercel otomatik olarak SSL sertifikası sağlar
- HTTPS otomatik aktif olur

### 4. Subdomain Ayarları (İsteğe Bağlı)
```
Type: CNAME
Name: api
Value: cname.vercel-dns.com

Type: CNAME  
Name: app
Value: cname.vercel-dns.com
```

## Domain Sağlayıcı Örnekleri

### Cloudflare
1. Cloudflare dashboard'a gidin
2. Domain'inizi seçin
3. **DNS** → **Records**
4. Yukarıdaki kayıtları ekleyin

### GoDaddy
1. GoDaddy DNS yönetimi
2. **DNS Records** bölümü
3. A ve CNAME kayıtlarını ekleyin

### Namecheap
1. Namecheap DNS yönetimi
2. **Advanced DNS** sekmesi
3. Kayıtları ekleyin

## Test Etme
```bash
# DNS propagation kontrolü
nslookup pluviax.earth
nslookup www.pluviax.earth

# SSL sertifikası kontrolü
curl -I https://pluviax.earth
```
