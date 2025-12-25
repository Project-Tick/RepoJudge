# RepoJudge Puanlama Sistemi

RepoJudge projeleri adil ama gerçekçi bir yaklaşımla değerlendirir.
Amaç geliştiriciyi gömmek değil, gerçek riskleri ortaya çıkarmaktır.

Varsayılan yaklaşımımız:
**"Çalışan kod > Mükemmel görünen kod"**

Bu yüzden sistem, projelerin çalıştığını varsayarak 100 puandan başlar ve yalnızca gerçek sorunlar için puan düşürür.

---

## Varsayılan Mod: Balanced Mode (Önerilen)

Balanced Mode, gerçek dünya yazılım geliştirme koşullarına göre tasarlanmıştır.
*   **Stil tercihleri yüzünden puan kırılmaz**
*   **Hobi projelerinde %100 test yok diye ceza verilmez**
*   **"Şöyle yazılsa daha şık olurdu" tarzı yorumlar skoru etkilemez**

Bu mod şu soruya cevap verir:
**"Bu proje çalışıyor mu ve güvenli mi?"**

### Puan Aralıkları
*   **90–100:** Sağlam, güvenli, amacı net
*   **75–89:** Üretime yakın, küçük teknik borçlar var
*   **50–74:** Çalışıyor ama düzenleme şart
*   **0–49:** Riskli, eksik veya bozuk

---

## Puan Düşürme Mantığı (Deduction Model)

RepoJudge puan kırarken insaflıdır ama kör değildir.
*   **Kritik güvenlik açığı:** -20
*   **Çökme riski veya ciddi mantık hatası:** -15
*   **Aşırı düzensiz yapı / spaghetti kod:** -10 ila -20
*   **Hiç dokümantasyon olmaması:** -10

> Aynı tip hatalar sınırsız şekilde cezalandırılmaz. Bir sorunu on kez yapmak, on kat daha kötü sayılmaz.

---

## Alternatif Analiz Modları

İsteyen kullanıcılar için analiz sertliği değiştirilebilir.

### Audit Mode (Kurumsal Denetçi)

Bu mod "çalışıyor" demekle yetinmez.
*   **Best practice yoksa puan kırar**
*   **Konfigürasyon eksikse ceza verir**
*   **Logging, test, yapılandırma eksikliği dikkate alınır**

Bu mod şu soruya cevap verir:
**"Bu proje üretime gerçekten hazır mı?"**
