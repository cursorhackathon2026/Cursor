# Deploy qo'llanmasi (public URL)

Ikki qism: **Backend** (FastAPI) + **Frontend** (Vite). Ikkalasi ham GitHub repodan bepul deploy qilinadi.

## 1. Backend → Render (bepul)
1. https://render.com → GitHub bilan kiring → **New → Web Service** → `cursorhackathon2026/Cursor` repo.
2. Sozlamalar:
   - **Root Directory:** `backend`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
3. **Environment** bo'limiga LLM kalitni qo'ying (ixtiyoriy — AI matni uchun):
   - `OPENAI_BASE_URL = https://api.groq.com/openai/v1`
   - `OPENAI_API_KEY = <groq kalitingiz>`
   - `LLM_MODEL = llama-3.3-70b-versatile`
4. Deploy → URL oling, masalan: `https://cursor-backend.onrender.com`

> Eslatma: SQLite fayl har redeploy'da tozalanadi (demo uchun yetarli — startda avto-seed bo'ladi).

## 2. Frontend → Vercel (bepul)
1. https://vercel.com → GitHub bilan kiring → **Add New → Project** → o'sha repo.
2. Sozlamalar:
   - **Root Directory:** `frontend`
   - **Framework:** Vite (avto)
   - **Environment Variable:** `VITE_API_URL = https://cursor-backend.onrender.com` (yuqoridagi backend URL)
3. Deploy → public sayt URL'ini oling.

## 3. APK (ixtiyoriy, public backend bilan)
Backend URL tayyor bo'lgach:
```
cd mobile
flutter build apk --release --dart-define=API_BASE=https://cursor-backend.onrender.com
```
APK: `mobile/build/app/outputs/flutter-apk/app-release.apk` — endi istalgan tarmoqda ishlaydi.

## Mahalliy demo (deploysiz)
```
cd backend  && ./.venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
cd frontend && npm run dev      # http://localhost:5173
```
