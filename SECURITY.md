# Xavfsizlik va S4 (qonunchilikka muvofiqlik) hujjati

Bu hujjat hakamlar (ayniqsa soha mentori — S4) va texnik mentor uchun tizimning
xavfsizlik va yuridik holatini bayon qiladi.

## 1. Klinik xavfsizlik (eng muhim — S4)
- **Qaror qo'llab-quvvatlash, avtonom emas.** Tizim tashxis qo'ymaydi, dori
  belgilamaydi. Faqat xavf zonasi + kuzatuv/triaj tavsiyasi beradi.
- **AI dori/doza aytmaydi.** Ham qoida asosidagi tavsiyalar, ham LLM prompti
  (`llm.py`) aniq dori nomi/dozasini AYTISHNI taqiqlaydi.
- **Yakuniy qaror shifokorda** — bu har bir tavsiya kartasida yozilgan.
- **Tushuntiriladigan (explainable).** Har zona "nega" bilan ko'rsatiladi (qaysi
  omil, qanday qiymat) — "qora quti" emas.
- **Ma'lumot yetishmasa yashil demaydi** — qoida dvigateli faqat mavjud
  ko'rsatkichlar asosida ishlaydi; bo'sh qiymatlar xavfni yashirmaydi.

## 2. Ma'lumot maxfiyligi
- **Demoда faqat sintetik ma'lumot** (real bemor yo'q). Pitchda ochiq aytiladi.
- Real integratsiya (DMED) — kelajak rejasi; hozir hech qanday real PII yig'ilmaydi.
- Shaxsiy ma'lumot URL/query'ga qo'yilmaydi.

## 3. Ilova xavfsizligi
- **Sirlar kodда yo'q.** LLM kaliti faqat `backend/.env` (env) orqali; `.gitignore`da.
- **Kirish validatsiyasi:** API pydantic bilan barcha kirishни tekshiradi.
- **LLM fail-safe:** kalit yo'q yoki xato bo'lsa — qoida asosidagi xavfsiz tavsiyaга
  qaytadi (hech qachon bo'sh/xato javob bermaydi).
- **CORS:** demo uchun ochiq; ishlab chiqarishда faqat frontend domeniga cheklanadi.

## 4. Roadmap (ishlab chiqarish uchun)
- Rollarga asoslangan kirish nazorati (RBAC) + JWT autentifikatsiya (hozir demo rol-tanlash).
- Ma'lumotni shifrlash (at-rest/in-transit), audit-iz.
- DMED developers dasturi orqali xavfsiz integratsiya + rozilik (consent).
- Rate-limiting va so'rovlar monitoringi.
