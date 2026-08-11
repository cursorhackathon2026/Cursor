import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type Lang = 'uz' | 'ru' | 'en'
export const LANGS: { code: Lang; label: string }[] = [
  { code: 'uz', label: "O‘zbek" },
  { code: 'ru', label: 'Русский' },
  { code: 'en', label: 'English' },
]

type Tr = Record<Lang, string>
const D: Record<string, Tr> = {
  // common
  'app.tagline': {
    uz: 'AI Raqamli egizak · monitoring, prognoz va optimal davolash',
    ru: 'AI Цифровой двойник · мониторинг, прогноз и оптимальное лечение',
    en: 'AI Digital Twin · monitoring, prognosis & optimal treatment',
  },
  'c.signin': { uz: 'Kirish', ru: 'Войти', en: 'Sign in' },
  'c.signing': { uz: 'Kirish…', ru: 'Вход…', en: 'Signing in…' },
  'c.logout': { uz: 'Chiqish', ru: 'Выход', en: 'Log out' },
  'c.back': { uz: 'Orqaga', ru: 'Назад', en: 'Back' },
  'c.loading': { uz: 'Yuklanmoqda…', ru: 'Загрузка…', en: 'Loading…' },
  'c.save': { uz: 'Saqlash', ru: 'Сохранить', en: 'Save' },
  'c.send': { uz: 'Yuborish', ru: 'Отправить', en: 'Send' },
  'c.all': { uz: 'Barchasi', ru: 'Все', en: 'All' },
  'c.retry': { uz: 'Qayta urinish', ru: 'Повторить', en: 'Retry' },
  'c.notFound': { uz: 'Topilmadi', ru: 'Не найдено', en: 'Not found' },

  // zones
  'zone.Qizil': { uz: 'Qizil', ru: 'Красный', en: 'Red' },
  'zone.Sariq': { uz: 'Sariq', ru: 'Жёлтый', en: 'Yellow' },
  'zone.Yashil': { uz: 'Yashil', ru: 'Зелёный', en: 'Green' },

  // roles
  'role.hamshira': { uz: 'Hamshira', ru: 'Медсестра', en: 'Nurse' },
  'role.mutaxassis': { uz: 'Mutaxassis / Shifokor', ru: 'Специалист / Врач', en: 'Specialist / Doctor' },
  'role.oilaviy': { uz: 'Oilaviy shifokor', ru: 'Семейный врач', en: 'Family doctor' },
  'role.bemor': { uz: 'Bemor', ru: 'Пациент', en: 'Patient' },
  'role.hamshira.sub': { uz: "Ma'lumot kiritish va kuzatuv", ru: 'Ввод данных и наблюдение', en: 'Data entry & monitoring' },
  'role.mutaxassis.sub': { uz: 'Monitoring va tahlil paneli', ru: 'Панель мониторинга и анализа', en: 'Monitoring & analytics' },
  'role.oilaviy.sub': { uz: 'Kuzatuv va chaqiruv topshiriqlari', ru: 'Наблюдение и активные вызовы', en: 'Follow-up & active calls' },

  // login
  'login.phone': { uz: 'Telefon raqami', ru: 'Номер телефона', en: 'Phone number' },
  'login.demo': { uz: 'Demo raqamlar (bosing)', ru: 'Демо-номера (нажмите)', en: 'Demo numbers (tap)' },
  'login.err': {
    uz: 'Bu raqam ro‘yxatda yo‘q. Quyidagi demo raqamlardan birini bosing.',
    ru: 'Этот номер не найден. Нажмите один из демо-номеров ниже.',
    en: 'This number is not registered. Tap one of the demo numbers below.',
  },
  'login.note': { uz: "Demo rejimi · sintetik ma'lumot · SMS-kod yo‘q", ru: 'Демо-режим · синтетические данные · без SMS', en: 'Demo mode · synthetic data · no SMS' },

  // nav
  'nav.home': { uz: 'Bosh sahifa', ru: 'Главная', en: 'Home' },
  'nav.alerts': { uz: 'Ogohlantirishlar', ru: 'Оповещения', en: 'Alerts' },
  'nav.activeCall': { uz: 'Aktiv chaqiruv', ru: 'Активный вызов', en: 'Active call' },
  'nav.addVisit': { uz: 'Ko‘rik qo‘shish', ru: 'Добавить осмотр', en: 'Add visit' },
  'nav.myPage': { uz: 'Mening sahifam', ru: 'Моя страница', en: 'My page' },

  // dashboard
  'dash.sub': { uz: 'Bugun', ru: 'Сегодня', en: 'Today' },
  'dash.total': { uz: 'Jami bemorlar', ru: 'Всего пациентов', en: 'Total patients' },
  'dash.red': { uz: 'Qizil zona', ru: 'Красная зона', en: 'Red zone' },
  'dash.yellow': { uz: 'Sariq zona', ru: 'Жёлтая зона', en: 'Yellow zone' },
  'dash.openAlerts': { uz: 'Ochiq ogohlantirishlar', ru: 'Открытые оповещения', en: 'Open alerts' },
  'dash.patients': { uz: 'Bemorlar', ru: 'Пациенты', en: 'Patients' },
  'th.name': { uz: 'Ism', ru: 'Имя', en: 'Name' },
  'th.age': { uz: 'Yosh', ru: 'Возраст', en: 'Age' },
  'th.week': { uz: 'Homilalik haftasi', ru: 'Неделя беременности', en: 'Gestation week' },
  'th.zone': { uz: 'Xavf zonasi', ru: 'Зона риска', en: 'Risk zone' },
  'th.reason': { uz: 'Xavf sababi', ru: 'Причина риска', en: 'Risk reason' },
  'th.last': { uz: 'Oxirgi', ru: 'Последнее', en: 'Last' },
  'dash.noPatients': { uz: 'Bemor topilmadi', ru: 'Пациенты не найдены', en: 'No patients found' },
  'dash.noAlerts': { uz: 'Ochiq ogohlantirish yo‘q', ru: 'Нет открытых оповещений', en: 'No open alerts' },
  'dash.viewAll': { uz: 'Barchasi', ru: 'Все', en: 'View all' },

  // patient detail
  'pd.years': { uz: 'yosh', ru: 'лет', en: 'yrs' },
  'pd.weekHomilalik': { uz: 'hafta homilalik', ru: 'нед. беременности', en: 'weeks pregnant' },
  'pd.score': { uz: 'Ball', ru: 'Балл', en: 'Score' },
  'pd.factorsTitle': { uz: 'Xavf omillari — nega', ru: 'Факторы риска — почему', en: 'Risk factors — why' },
  'pd.aiTitle': { uz: 'AI xavf xulosasi va tavsiya', ru: 'AI-оценка риска и рекомендация', en: 'AI risk summary & recommendation' },
  'pd.urgent': { uz: 'Shoshilinch — kechiktirmang', ru: 'Срочно — не откладывайте', en: 'Urgent — do not delay' },
  'pd.dss': { uz: '* Qaror qo‘llab-quvvatlash. Yakuniy qaror shifokorda.', ru: '* Поддержка принятия решений. Окончательное решение — за врачом.', en: '* Decision support. Final decision rests with the doctor.' },
  'pd.historyTitle': { uz: 'Kasallik tarixi va allergiya', ru: 'История болезни и аллергии', en: 'Medical history & allergies' },
  'pd.noHistory': { uz: 'Surunkali kasallik/allergiya qayd etilmagan', ru: 'Хронические болезни/аллергии не отмечены', en: 'No chronic conditions/allergies recorded' },
  'pd.allergy': { uz: 'Allergiya', ru: 'Аллергия', en: 'Allergy' },
  'pd.visitsTitle': { uz: 'Ko‘riklar tarixi', ru: 'История осмотров', en: 'Visit history' },
  'pd.factorNone': { uz: 'Xavf omili aniqlanmadi — ko‘rsatkichlar me’yorda.', ru: 'Факторы риска не выявлены — показатели в норме.', en: 'No risk factors — indicators normal.' },

  // twin
  'twin.title': { uz: 'Raqamli egizak — dori xavfsizligini tekshirish', ru: 'Цифровой двойник — проверка безопасности препарата', en: 'Digital Twin — drug safety check' },
  'twin.desc': {
    uz: 'Dori belgilashдан oldin tekshiring: AI bemorning kasallik tarixi, allergiya va homiladorligiga qarab xavfni baholaydi.',
    ru: 'Проверьте перед назначением: AI оценивает риск по истории болезни, аллергиям и беременности.',
    en: 'Check before prescribing: AI evaluates risk from history, allergies and pregnancy.',
  },
  'twin.drug': { uz: 'Dori nomi', ru: 'Название препарата', en: 'Drug name' },
  'twin.dose': { uz: 'Doza', ru: 'Доза', en: 'Dose' },
  'twin.run': { uz: 'Egizakда tekshirish', ru: 'Проверить в двойнике', en: 'Check in twin' },
  'twin.running': { uz: 'Tekshirilmoqda…', ru: 'Проверка…', en: 'Checking…' },
  'twin.aiBadge': { uz: 'AI baholovi', ru: 'AI-оценка', en: 'AI evaluation' },
  'twin.ruleBadge': { uz: 'Qoida asosidagi baholov', ru: 'Оценка по правилам', en: 'Rule-based evaluation' },
  'twin.level.Xavfsiz': { uz: 'Xavfsiz', ru: 'Безопасно', en: 'Safe' },
  'twin.level.Ehtiyot': { uz: 'Ehtiyot', ru: 'Осторожно', en: 'Caution' },
  'twin.level.Xavfli': { uz: 'Xavfli', ru: 'Опасно', en: 'Danger' },
  'twin.prescribe': { uz: 'Retsept berish', ru: 'Назначить', en: 'Prescribe' },
  'twin.prescribed': { uz: 'Retsept berildi — bemor ilovasiga tushdi', ru: 'Назначено — отправлено пациенту', en: 'Prescribed — sent to patient app' },
  'twin.schedule': { uz: 'Qabul jadvali (masalan: 2 marta/kun)', ru: 'График приёма (напр.: 2 раза/день)', en: 'Schedule (e.g. twice a day)' },
  'pd.trajectory': { uz: 'Xavf prognozi (6 oy)', ru: 'Прогноз риска (6 мес)', en: 'Risk forecast (6 mo)' },
  'pd.adhLabel': { uz: 'Dori intizomi', ru: 'Приверженность', en: 'Adherence' },
  'pd.discharge': { uz: 'Chiqarish → oilaviy chaqiruv', ru: 'Выписать → семейный врач', en: 'Discharge → family doctor' },
  'pd.discharged': { uz: 'Chaqiruv yuborildi', ru: 'Вызов отправлен', en: 'Referral sent' },
  // 3D egizak tana
  'body.title': { uz: 'Raqamli egizak — 3D tana', ru: 'Цифровой двойник — 3D тело', en: 'Digital twin — 3D body' },
  'body.desc': { uz: 'Bemor data’siga qarab ta’sirlangan a’zolar', ru: 'Затронутые зоны по данным пациента', en: 'Affected areas from patient data' },
  'body.rotate': { uz: 'aylantirish uchun torting', ru: 'вращайте мышью', en: 'drag to rotate' },
  'body.head': { uz: 'Bosh', ru: 'Голова', en: 'Head' },
  'body.eyes': { uz: 'Ko‘rish', ru: 'Зрение', en: 'Vision' },
  'body.heart': { uz: 'Yurak / bosim', ru: 'Сердце / давление', en: 'Heart / BP' },
  'body.belly': { uz: 'Bachadon / qorin', ru: 'Матка / живот', en: 'Uterus / abdomen' },
  'body.hands': { uz: 'Shish', ru: 'Отёки', en: 'Swelling' },
  'body.lungs': { uz: "O'pka / nafas", ru: 'Лёгкие / дыхание', en: 'Lungs / breathing' },
  'body.kidney': { uz: 'Buyrak', ru: 'Почки', en: 'Kidneys' },
  'body.abdomen': { uz: 'Qorin / metabolizm', ru: 'Живот / обмен', en: 'Abdomen / metabolism' },
  'body.joints': { uz: "Bo'g'imlar", ru: 'Суставы', en: 'Joints' },
  'body.analysis': { uz: 'AI tahlillari — ta’sirlangan a’zolar', ru: 'AI-анализ — затронутые органы', en: 'AI analysis — affected organs' },
  'body.normal': { uz: 'Barcha asosiy a’zolar me’yorda ko‘rinmoqda.', ru: 'Все основные органы в норме.', en: 'All major organs appear normal.' },
  'body.high': { uz: 'Yuqori e’tibor', ru: 'Высокое внимание', en: 'High attention' },
  'body.watch': { uz: 'Kuzatuv', ru: 'Наблюдение', en: 'Watch' },
  'body.ok': { uz: 'Me’yorda', ru: 'В норме', en: 'Normal' },
  'body.hintDrag': { uz: 'Modelni sichqoncha bilan aylantiring', ru: 'Вращайте модель мышью', en: 'Drag to rotate the model' },

  // AI 5-yillik prognoz
  'prog.title': { uz: 'AI 5-yillik prognoz', ru: 'AI-прогноз на 5 лет', en: 'AI 5-year prognosis' },
  'prog.desc': {
    uz: 'AI bemorning kasallik tarixi va ko‘rsatkichlariga qarab kelgusi asoratlarni bashorat qiladi.',
    ru: 'AI прогнозирует будущие осложнения по истории болезни и показателям.',
    en: 'AI forecasts future complications from the patient’s history and indicators.',
  },
  'prog.loading': { uz: 'Prognoz hisoblanmoqda…', ru: 'Расчёт прогноза…', en: 'Computing forecast…' },
  'prog.none': { uz: 'Jiddiy uzoq muddatli xavf aniqlanmadi.', ru: 'Серьёзных долгосрочных рисков не выявлено.', en: 'No serious long-term risks found.' },
  'prog.when': { uz: 'Muddat', ru: 'Срок', en: 'Timeframe' },
  'prog.why': { uz: 'Sabab', ru: 'Причина', en: 'Why' },
  'prog.prevent': { uz: 'Oldini olish', ru: 'Профилактика', en: 'Prevention' },
  'prog.risk.yuqori': { uz: 'yuqori xavf', ru: 'высокий риск', en: 'high risk' },
  "prog.risk.o'rta": { uz: "o'rta xavf", ru: 'средний риск', en: 'moderate risk' },
  'prog.risk.past': { uz: 'past xavf', ru: 'низкий риск', en: 'low risk' },

  // AI davolash rejasi (назначение)
  'tp.title': { uz: 'AI optimal davolash rejasi', ru: 'AI-оптимальное назначение', en: 'AI optimal treatment plan' },
  'tp.desc': {
    uz: 'Tashxisni kiriting — AI bemor tarixi, allergiya va holatiga qarab eng optimal dori/ukol/osmani izohi bilan taklif qiladi. Siz tahrirlaysiz va tasdiqlaysiz.',
    ru: 'Введите диагноз — AI предложит оптимальные препараты/уколы/капельницы с пояснением. Вы редактируете и подтверждаете.',
    en: 'Enter the diagnosis — AI proposes the optimal drugs/injections/IV with rationale. You edit and confirm.',
  },
  'tp.diagnosis': { uz: 'Bugungi tashxis (masalan: Nazoratsiz gipertenziya)', ru: 'Диагноз (напр.: неконтролируемая гипертензия)', en: 'Diagnosis (e.g. uncontrolled hypertension)' },
  'tp.generate': { uz: 'AI reja tuzsin', ru: 'Составить план (AI)', en: 'Generate plan (AI)' },
  'tp.generating': { uz: 'AI reja tuzmoqda…', ru: 'AI составляет план…', en: 'AI is drafting…' },
  'tp.regenerate': { uz: 'Qayta tuzish', ru: 'Пересоздать', en: 'Regenerate' },
  'tp.summary': { uz: 'Umumiy yondashuv', ru: 'Общий подход', en: 'Overall approach' },
  'tp.editHint': { uz: 'Har bandni tahrirlashingiz mumkin — o‘zgartirsangiz oqibati pastda chiqadi.', ru: 'Можно редактировать каждый пункт — последствие покажется ниже.', en: 'Edit any item — the consequence appears below.' },
  'tp.name': { uz: 'Nomi', ru: 'Название', en: 'Name' },
  'tp.dose': { uz: 'Doza', ru: 'Доза', en: 'Dose' },
  'tp.schedule': { uz: 'Qabul tartibi', ru: 'График приёма', en: 'Schedule' },
  'tp.rationale': { uz: 'Nega bu tayinlandi', ru: 'Почему назначено', en: 'Why prescribed' },
  'tp.consequence': { uz: 'O‘zgartirish oqibati', ru: 'Последствие изменения', en: 'Consequence of change' },
  'tp.checking': { uz: 'Oqibat baholanmoqda…', ru: 'Оценка последствия…', en: 'Assessing consequence…' },
  'tp.remove': { uz: 'Olib tashlash', ru: 'Убрать', en: 'Remove' },
  'tp.add': { uz: '+ Band qo‘shish', ru: '+ Добавить пункт', en: '+ Add item' },
  'tp.confirm': { uz: 'Tasdiqlash va bemorga yuborish', ru: 'Подтвердить и отправить пациенту', en: 'Confirm & send to patient' },
  'tp.confirming': { uz: 'Yuborilmoqda…', ru: 'Отправка…', en: 'Sending…' },
  'tp.confirmed': { uz: '✓ Tasdiqlandi — bemorga yuborildi, kunlik eslatma yoqildi', ru: '✓ Подтверждено — отправлено пациенту, ежедневные напоминания включены', en: '✓ Confirmed — sent to patient, daily reminders enabled' },
  'tp.aiBadge': { uz: 'AI tuzgan reja', ru: 'План составлен AI', en: 'AI-generated plan' },
  'tp.ruleBadge': { uz: 'Klinik baza asosidagi reja', ru: 'План по клинической базе', en: 'Knowledge-base plan' },
  'tp.empty': { uz: 'Bandlar yo‘q — tashxis kiriting va AI reja tuzsin.', ru: 'Нет пунктов — введите диагноз и сгенерируйте план.', en: 'No items — enter a diagnosis and generate.' },

  // dori turlari
  'kind.dori': { uz: 'Dori (ichimlik)', ru: 'Таблетка', en: 'Oral drug' },
  'kind.ukol': { uz: 'Ukol (in’yeksiya)', ru: 'Укол (инъекция)', en: 'Injection' },
  'kind.osma': { uz: 'Osma (venaga)', ru: 'Капельница (в/в)', en: 'IV drip' },
  'kind.ingalyator': { uz: 'Ingalyator', ru: 'Ингалятор', en: 'Inhaler' },

  // gender + kasalliklar ustuni
  'g.M': { uz: 'Erkak', ru: 'Мужчина', en: 'Male' },
  'g.F': { uz: 'Ayol', ru: 'Женщина', en: 'Female' },
  'th.conditions': { uz: 'Kasalliklar', ru: 'Заболевания', en: 'Conditions' },
  'pd.pregnant': { uz: 'homilador', ru: 'беременна', en: 'pregnant' },
  'pd.reminders': { uz: 'Kunlik eslatmalar', ru: 'Ежедневные напоминания', en: 'Daily reminders' },
  'pd.whyThis': { uz: 'Nega bu dori', ru: 'Почему это лекарство', en: 'Why this medication' },
  'al.notePh': { uz: 'Izoh (ixtiyoriy)', ru: 'Комментарий (необязательно)', en: 'Note (optional)' },
  'nc.offlineSaved': { uz: 'Oflayn saqlandi — ulanganda yuboriladi', ru: 'Сохранено офлайн — отправится при подключении', en: 'Saved offline — will sync when online' },
  'nc.queued': { uz: 'Navbatda', ru: 'В очереди', en: 'Queued' },
  'nc.sync': { uz: 'Sinxronlash', ru: 'Синхронизировать', en: 'Sync' },

  // nurse capture
  'nc.title': { uz: 'Ko‘rik qo‘shish', ru: 'Добавить осмотр', en: 'Add visit' },
  'nc.subtitle': { uz: 'Hamshira paneli', ru: 'Панель медсестры', en: 'Nurse panel' },
  'nc.synced': { uz: 'Sinxronlashtirildi · hozir', ru: 'Синхронизировано · сейчас', en: 'Synced · now' },
  'nc.selectPatient': { uz: 'Bemorni tanlang', ru: 'Выберите пациента', en: 'Select patient' },
  'nc.vitals': { uz: 'Asosiy ko‘rsatkichlar', ru: 'Основные показатели', en: 'Vital signs' },
  'nc.bp': { uz: 'Qon bosimi (mmHg)', ru: 'Артериальное давление (мм рт.ст.)', en: 'Blood pressure (mmHg)' },
  'nc.sys': { uz: 'Sistolik', ru: 'Систолическое', en: 'Systolic' },
  'nc.dia': { uz: 'Diastolik', ru: 'Диастолическое', en: 'Diastolic' },
  'nc.weight': { uz: 'Vazn (kg)', ru: 'Вес (кг)', en: 'Weight (kg)' },
  'nc.hb': { uz: 'Gemoglobin (g/L)', ru: 'Гемоглобин (г/л)', en: 'Hemoglobin (g/L)' },
  'nc.glu': { uz: 'Glyukoza (mmol/L)', ru: 'Глюкоза (ммоль/л)', en: 'Glucose (mmol/L)' },
  'nc.pulse': { uz: 'Puls (zarba/daq)', ru: 'Пульс (уд/мин)', en: 'Pulse (bpm)' },
  'nc.spo2': { uz: 'Kislorod SpO₂ (%)', ru: 'Кислород SpO₂ (%)', en: 'Oxygen SpO₂ (%)' },
  'nc.temp': { uz: 'Harorat (°C)', ru: 'Температура (°C)', en: 'Temperature (°C)' },
  'nc.week': { uz: 'Homilalik haftasi', ru: 'Неделя беременности', en: 'Gestation week' },
  'nc.symptoms': { uz: 'Belgilar', ru: 'Симптомы', en: 'Symptoms' },
  'nc.submit': { uz: 'Saqlash va tahlil qilish', ru: 'Сохранить и проанализировать', en: 'Save & analyze' },
  'nc.analyzing': { uz: 'Tahlil qilinmoqda…', ru: 'Анализ…', en: 'Analyzing…' },
  'nc.result': { uz: 'AI tahlil natijasi', ru: 'Результат AI-анализа', en: 'AI analysis result' },
  'nc.zoneChanged': { uz: 'Zona o‘zgardi', ru: 'Зона изменилась', en: 'Zone changed' },
  'nc.rec': { uz: 'Tavsiya', ru: 'Рекомендация', en: 'Recommendation' },
  'nc.alertSent': { uz: 'Mutaxassisga ogohlantirish yuborildi', ru: 'Оповещение отправлено специалисту', en: 'Alert sent to specialist' },
  'nc.newVisit': { uz: 'Yangi ko‘rik', ru: 'Новый осмотр', en: 'New visit' },
  // symptoms
  'sym.bosh_ogrigi': { uz: "Bosh og'rig'i", ru: 'Головная боль', en: 'Headache' },
  'sym.koz_parcha': { uz: "Ko'z oldida parcha", ru: 'Мелькание перед глазами', en: 'Visual disturbance' },
  'sym.kongil_aynishi': { uz: "Ko'ngil aynishi", ru: 'Тошнота', en: 'Nausea' },
  'sym.shish': { uz: "Shish (qo'l/yuz)", ru: 'Отёки (руки/лицо)', en: 'Swelling (hands/face)' },
  'sym.qorin_ogrigi': { uz: "Qorin og'rig'i", ru: 'Боль в животе', en: 'Abdominal pain' },
  'sym.harakat_kamaygan': { uz: 'Harakat kamaygan', ru: 'Снижение шевелений', en: 'Reduced fetal movement' },
  'sym.kokrak_ogrigi': { uz: "Ko'krak og'rig'i", ru: 'Боль в груди', en: 'Chest pain' },
  'sym.nafas_qisilishi': { uz: 'Nafas qisilishi', ru: 'Одышка', en: 'Shortness of breath' },
  'sym.bosh_aylanishi': { uz: 'Bosh aylanishi', ru: 'Головокружение', en: 'Dizziness' },
  'sym.holsizlik': { uz: 'Umumiy holsizlik', ru: 'Общая слабость', en: 'Weakness / fatigue' },

  // alerts
  'al.title': { uz: 'Ogohlantirishlar', ru: 'Оповещения', en: 'Alerts' },
  'al.open': { uz: 'ta ochiq', ru: 'открытых', en: 'open' },
  'al.filterOpen': { uz: 'Ochiq', ru: 'Открытые', en: 'Open' },
  'al.urgent': { uz: 'Shoshilinch', ru: 'Срочно', en: 'Urgent' },
  'al.ack': { uz: 'Ko‘rildi deb belgilash', ru: 'Отметить как просмотрено', en: 'Mark as seen' },
  'al.seen': { uz: 'Ko‘rildi', ru: 'Просмотрено', en: 'Seen' },
  'al.none': { uz: 'Ogohlantirish yo‘q', ru: 'Нет оповещений', en: 'No alerts' },

  // family doctor
  'fd.title': { uz: 'Aktiv chaqiruv', ru: 'Активный вызов', en: 'Active call' },
  'fd.waiting': { uz: 'ta vazifa kutmoqda', ru: 'задач в ожидании', en: 'tasks pending' },
  'fd.active': { uz: 'Aktiv chaqiruv', ru: 'Активные вызовы', en: 'Active calls' },
  'fd.urgentRed': { uz: 'Shoshilinch', ru: 'Срочные', en: 'Urgent' },
  'fd.call': { uz: 'Qo‘ng‘iroq', ru: 'Позвонить', en: 'Call' },
  'fd.done': { uz: 'Bajarildi deb belgilash', ru: 'Отметить выполненным', en: 'Mark done' },
  'fd.doneShort': { uz: 'Bajarildi', ru: 'Выполнено', en: 'Done' },
  'fd.none': { uz: 'Aktiv chaqiruv yo‘q', ru: 'Нет активных вызовов', en: 'No active calls' },
  'fd.rec': { uz: 'Tavsiya', ru: 'Рекомендация', en: 'Recommendation' },

  // patient home
  'ph.title': { uz: 'Mening sahifam', ru: 'Моя страница', en: 'My page' },
  'ph.hello': { uz: 'Assalomu alaykum,', ru: 'Здравствуйте,', en: 'Hello,' },
  'ph.meds': { uz: 'Bugungi dorilar', ru: 'Лекарства на сегодня', en: "Today's medications" },
  'ph.taken': { uz: 'qabul qilindi', ru: 'принято', en: 'taken' },
  'ph.noMeds': { uz: 'Dori tayinlanmagan', ru: 'Лекарства не назначены', en: 'No medications' },
  'ph.twinTitle': { uz: 'Sizning raqamli egizagingiz', ru: 'Ваш цифровой двойник', en: 'Your digital twin' },
  'ph.twinDesc': {
    uz: 'Ko‘rsatkichlaringiz asosida shaxsiy tavsiyalar. Bajarmoqchi bo‘lsangiz — belgilang, shifokoringiz ko‘radi.',
    ru: 'Персональные рекомендации по вашим показателям. Отметьте — врач увидит.',
    en: 'Personal recommendations from your indicators. Mark it — your doctor will see.',
  },
  'ph.try': { uz: 'Sinab ko‘raman', ru: 'Попробую', en: "I'll try it" },
  'ph.accepted': { uz: 'Qabul qilindi', ru: 'Принято', en: 'Accepted' },
  'ph.recsLoading': { uz: 'Tavsiyalar yuklanmoqda…', ru: 'Рекомендации загружаются…', en: 'Loading recommendations…' },
  'ph.book': { uz: 'Shifokor qabuliga yozilish', ru: 'Запись к врачу', en: 'Book a doctor visit' },
  'ph.date': { uz: 'Sana', ru: 'Дата', en: 'Date' },
  'ph.reason': { uz: 'Sabab (ixtiyoriy)', ru: 'Причина (необязательно)', en: 'Reason (optional)' },
  'ph.bookBtn': { uz: 'Yozilish', ru: 'Записаться', en: 'Book' },
  'ph.report': { uz: 'Ahvolim haqida xabar', ru: 'Сообщить о самочувствии', en: 'Report my condition' },
  'ph.reportPh': { uz: 'Bugungi ahvolingiz, shikoyatlaringizni yozing…', ru: 'Опишите ваше самочувствие, жалобы…', en: 'Describe how you feel, any complaints…' },
  'ph.reportSent': { uz: 'Xabaringiz shifokorga yuborildi', ru: 'Ваше сообщение отправлено врачу', en: 'Your message was sent to the doctor' },

  // qabul jadvali (FAZA 2)
  'ph.doctor': { uz: 'Shifokor', ru: 'Врач', en: 'Doctor' },
  'ph.chooseSlot': { uz: 'Bo‘sh vaqtni tanlang', ru: 'Выберите свободное время', en: 'Choose a free time' },
  'ph.noSlots': { uz: 'Bu kunda bo‘sh vaqt yo‘q', ru: 'Нет свободного времени в этот день', en: 'No free slots on this day' },
  'nav.schedule': { uz: 'Jadval', ru: 'Расписание', en: 'Schedule' },
  'sch.title': { uz: 'Qabullar jadvali', ru: 'Расписание приёмов', en: 'Appointment schedule' },
  'sch.none': { uz: 'Qabullar yo‘q', ru: 'Нет приёмов', en: 'No appointments' },
  'sch.confirm': { uz: 'Tasdiqlash', ru: 'Подтвердить', en: 'Confirm' },
  'sch.complete': { uz: 'Bajarildi', ru: 'Завершить', en: 'Complete' },
  'sch.total': { uz: 'Jami qabullar', ru: 'Всего приёмов', en: 'Total appointments' },
  'sch.pending': { uz: 'Kutilmoqda', ru: 'В ожидании', en: 'Pending' },

  // FAZA 3: Inbox + xabarlar
  'nav.inbox': { uz: 'Inbox', ru: 'Входящие', en: 'Inbox' },
  'inbox.title': { uz: 'Shifokor inbox', ru: 'Входящие врача', en: 'Doctor inbox' },
  'inbox.reports': { uz: 'Ahvol xabarlari', ru: 'Сообщения о самочувствии', en: 'Condition reports' },
  'inbox.adherence': { uz: 'Dori intizomi', ru: 'Приверженность лечению', en: 'Medication adherence' },
  'inbox.notifs': { uz: 'Bildirishnomalar', ru: 'Уведомления', en: 'Notifications' },
  'inbox.reply': { uz: 'Javob berish', ru: 'Ответить', en: 'Reply' },
  'inbox.replyPh': { uz: 'Bemorga javob yozing…', ru: 'Напишите ответ пациенту…', en: 'Write a reply to the patient…' },
  'inbox.noReports': { uz: 'Xabarlar yo‘q', ru: 'Нет сообщений', en: 'No reports' },
  'inbox.noNotifs': { uz: 'Bildirishnoma yo‘q', ru: 'Нет уведомлений', en: 'No notifications' },
  'ph.messages': { uz: 'Xabarlar', ru: 'Сообщения', en: 'Messages' },
  'ph.noMessages': { uz: 'Xabar yo‘q', ru: 'Нет сообщений', en: 'No messages' },

  // errors
  'err.connect': { uz: 'Serverga ulanib bo‘lmadi', ru: 'Не удалось подключиться к серверу', en: 'Could not connect to server' },
}

// Backenddan keladigan MA'LUMOT (data) tarjimasi — cheklangan, aniq to'plam.
const DATA: Record<string, Tr> = {
  // region
  'Navoiy viloyati': { uz: 'Navoiy viloyati', ru: 'Навоийская область', en: 'Navoiy region' },
  // qabul holatlari
  "so'ralgan": { uz: "so'ralgan", ru: 'запрошено', en: 'requested' },
  'tasdiqlangan': { uz: 'tasdiqlangan', ru: 'подтверждено', en: 'confirmed' },
  'bajarilgan': { uz: 'bajarilgan', ru: 'завершено', en: 'completed' },
  'yangi': { uz: 'yangi', ru: 'новое', en: 'new' },
  'javob berildi': { uz: 'javob berildi', ru: 'отвечено', en: 'replied' },
  // xavf omillari (risk_engine)
  "Og'ir gipertenziya": { uz: "Og'ir gipertenziya", ru: 'Тяжёлая гипертензия', en: 'Severe hypertension' },
  'Gipertenziya': { uz: 'Gipertenziya', ru: 'Гипертензия', en: 'Hypertension' },
  "Og'ir anemiya": { uz: "Og'ir anemiya", ru: 'Тяжёлая анемия', en: 'Severe anemia' },
  "O'rtacha anemiya": { uz: "O'rtacha anemiya", ru: 'Умеренная анемия', en: 'Moderate anemia' },
  'Yengil anemiya': { uz: 'Yengil anemiya', ru: 'Лёгкая анемия', en: 'Mild anemia' },
  'Yuqori glyukoza': { uz: 'Yuqori glyukoza', ru: 'Высокая глюкоза', en: 'High glucose' },
  'Gestatsion diabet belgisi': { uz: 'Gestatsion diabet belgisi', ru: 'Признак гестационного диабета', en: 'Gestational diabetes sign' },
  'Homila harakati kamaygan': { uz: 'Homila harakati kamaygan', ru: 'Снижение шевелений плода', en: 'Reduced fetal movement' },
  "Ko'rish buzilishi": { uz: "Ko'rish buzilishi", ru: 'Нарушение зрения', en: 'Visual disturbance' },
  'Preeklampsiya belgilari': { uz: 'Preeklampsiya belgilari', ru: 'Признаки преэклампсии', en: 'Signs of preeclampsia' },
  "Bosh og'rig'i": { uz: "Bosh og'rig'i", ru: 'Головная боль', en: 'Headache' },
  "Ko'z oldida parcha": { uz: "Ko'z oldida parcha", ru: 'Мелькание перед глазами', en: 'Visual spots' },
  "Ko'ngil aynishi": { uz: "Ko'ngil aynishi", ru: 'Тошнота', en: 'Nausea' },
  "Shish (qo'l/yuz)": { uz: "Shish (qo'l/yuz)", ru: 'Отёки (руки/лицо)', en: 'Swelling (hands/face)' },
  "Qorin og'rig'i": { uz: "Qorin og'rig'i", ru: 'Боль в животе', en: 'Abdominal pain' },
  // omil detali (fixed)
  "Shoshilinch akusher ko'rigi talab etiladi": { uz: "Shoshilinch akusher ko'rigi talab etiladi", ru: 'Требуется срочный акушерский осмотр', en: 'Urgent obstetric exam required' },
  'Bemor shikoyati': { uz: 'Bemor shikoyati', ru: 'Жалоба пациентки', en: 'Patient complaint' },
  // surunkali kasalliklar
  'Surunkali gipertenziya': { uz: 'Surunkali gipertenziya', ru: 'Хроническая гипертензия', en: 'Chronic hypertension' },
  'Qandli diabet (2-tip)': { uz: 'Qandli diabet (2-tip)', ru: 'Сахарный диабет (2 тип)', en: 'Type 2 diabetes' },
  'Temir tanqisligi anemiyasi': { uz: 'Temir tanqisligi anemiyasi', ru: 'Железодефицитная анемия', en: 'Iron-deficiency anemia' },
  'Qalqonsimon bez faoliyati pasayishi': { uz: 'Qalqonsimon bez faoliyati pasayishi', ru: 'Гипотиреоз', en: 'Hypothyroidism' },
  // allergiya
  'Penitsillin': { uz: 'Penitsillin', ru: 'Пенициллин', en: 'Penicillin' },
  'Aspirin': { uz: 'Aspirin', ru: 'Аспирин', en: 'Aspirin' },
  'Sulfanilamidlar': { uz: 'Sulfanilamidlar', ru: 'Сульфаниламиды', en: 'Sulfonamides' },
  'NPVP': { uz: 'NPVP (nosteroid)', ru: 'НПВП', en: 'NSAIDs' },
  // yangi surunkali kasalliklar
  'Yurak ishemik kasalligi': { uz: 'Yurak ishemik kasalligi', ru: 'Ишемическая болезнь сердца', en: 'Coronary artery disease' },
  'Surunkali yurak yetishmovchiligi': { uz: 'Surunkali yurak yetishmovchiligi', ru: 'Хроническая сердечная недостаточность', en: 'Chronic heart failure' },
  'Bronxial astma': { uz: 'Bronxial astma', ru: 'Бронхиальная астма', en: 'Bronchial asthma' },
  'Surunkali buyrak kasalligi': { uz: 'Surunkali buyrak kasalligi', ru: 'Хроническая болезнь почек', en: 'Chronic kidney disease' },
  'Oilaviy giperxolesterinemiya': { uz: 'Oilaviy giperxolesterinemiya', ru: 'Семейная гиперхолестеринемия', en: 'Familial hypercholesterolemia' },
  'Giperlipidemiya': { uz: 'Giperlipidemiya', ru: 'Гиперлипидемия', en: 'Hyperlipidemia' },
  'Podagra': { uz: 'Podagra', ru: 'Подагра', en: 'Gout' },
  'Osteoartroz': { uz: 'Osteoartroz', ru: 'Остеоартроз', en: 'Osteoarthritis' },
  'Gastroezofageal reflyuks (GERD)': { uz: 'Gastroezofageal reflyuks (GERD)', ru: 'ГЭРБ (рефлюкс)', en: 'GERD (reflux)' },
  'Migren': { uz: 'Migren', ru: 'Мигрень', en: 'Migraine' },
  'Qalqonsimon bez faoliyati pasayishi (gipotireoz)': { uz: 'Qalqonsimon bez faoliyati pasayishi (gipotireoz)', ru: 'Гипотиреоз', en: 'Hypothyroidism' },
  // yangi xavf omillari (risk_engine)
  'Gipertonik kriz': { uz: 'Gipertonik kriz', ru: 'Гипертонический криз', en: 'Hypertensive crisis' },
  'Past qon bosimi (gipotoniya)': { uz: 'Past qon bosimi (gipotoniya)', ru: 'Низкое АД (гипотония)', en: 'Low BP (hypotension)' },
  'Kislorod tanqisligi': { uz: 'Kislorod tanqisligi', ru: 'Кислородная недостаточность', en: 'Oxygen deficiency' },
  'Kislorod pasaygan': { uz: 'Kislorod pasaygan', ru: 'Снижение кислорода', en: 'Reduced oxygen' },
  'Yuqori puls (taxikardiya)': { uz: 'Yuqori puls (taxikardiya)', ru: 'Высокий пульс (тахикардия)', en: 'High pulse (tachycardia)' },
  'Taxikardiya': { uz: 'Taxikardiya', ru: 'Тахикардия', en: 'Tachycardia' },
  'Past puls (bradikardiya)': { uz: 'Past puls (bradikardiya)', ru: 'Низкий пульс (брадикардия)', en: 'Low pulse (bradycardia)' },
  'Isitma': { uz: 'Isitma', ru: 'Лихорадка', en: 'Fever' },
  'Yuqori isitma': { uz: 'Yuqori isitma', ru: 'Высокая лихорадка', en: 'High fever' },
  'Gipoglikemiya (past qand)': { uz: 'Gipoglikemiya (past qand)', ru: 'Гипогликемия (низкий сахар)', en: 'Hypoglycemia (low sugar)' },
  'Juda yuqori qand': { uz: 'Juda yuqori qand', ru: 'Очень высокий сахар', en: 'Very high glucose' },
  'Yuqori qand': { uz: 'Yuqori qand', ru: 'Высокий сахар', en: 'High glucose' },
  'Yuqori qand (diabet nazoratsiz)': { uz: 'Yuqori qand (diabet nazoratsiz)', ru: 'Высокий сахар (диабет неконтролируем)', en: 'High glucose (uncontrolled diabetes)' },
  "Ko'krak og'rig'i (yurak xavfi)": { uz: "Ko'krak og'rig'i (yurak xavfi)", ru: 'Боль в груди (риск сердца)', en: 'Chest pain (cardiac risk)' },
  'Nafas qisilishi': { uz: 'Nafas qisilishi', ru: 'Одышка', en: 'Shortness of breath' },
  'Umumiy holsizlik': { uz: 'Umumiy holsizlik', ru: 'Общая слабость', en: 'Weakness / fatigue' },
  "Shish (oyoq/yuz)": { uz: "Shish (oyoq/yuz)", ru: 'Отёки (ноги/лицо)', en: 'Swelling (legs/face)' },
  'Yurak ishemiyasi ehtimoli — shoshilinch baholash': { uz: 'Yurak ishemiyasi ehtimoli — shoshilinch baholash', ru: 'Вероятна ишемия сердца — срочная оценка', en: 'Possible cardiac ischemia — urgent assessment' },
  'Nafas olish qiyinlashgan': { uz: 'Nafas olish qiyinlashgan', ru: 'Затруднённое дыхание', en: 'Difficulty breathing' },
  // tarix (fixed eventlar)
  "Gipertenziya tashxisi qo'yildi (I bosqich)": { uz: "Gipertenziya tashxisi qo'yildi (I bosqich)", ru: 'Диагностирована гипертензия (I стадия)', en: 'Hypertension diagnosed (stage I)' },
  "Qon bosimi ko'tarilishi, dori dozasi oshirildi": { uz: "Qon bosimi ko'tarilishi, dori dozasi oshirildi", ru: 'Повышение АД, доза препарата увеличена', en: 'BP rise, drug dose increased' },
  '2-tip qandli diabet aniqlandi (HbA1c 7.8%)': { uz: '2-tip qandli diabet aniqlandi (HbA1c 7.8%)', ru: 'Выявлен сахарный диабет 2 типа (HbA1c 7.8%)', en: 'Type 2 diabetes found (HbA1c 7.8%)' },
  'Anemiya, temir preparatlari tayinlandi': { uz: 'Anemiya, temir preparatlari tayinlandi', ru: 'Анемия, назначены препараты железа', en: 'Anemia, iron supplements prescribed' },
  'Homiladorlik hisobga olindi (antenatal kuzatuv)': { uz: 'Homiladorlik hisobga olindi (antenatal kuzatuv)', ru: 'Беременность взята на учёт (антенатальное наблюдение)', en: 'Pregnancy registered (antenatal care)' },
  "Joriy homiladorlik — muntazam ko'rik": { uz: "Joriy homiladorlik — muntazam ko'rik", ru: 'Текущая беременность — регулярный осмотр', en: 'Current pregnancy — regular check-up' },
  // qoida tavsiyalari (risk_engine._safe_recommendation, 5 variant)
  "Zudlik bilan OvaBMU mutaxassisiga yo'naltiring; bemorni kuzatuvsiz qoldirmang.": { uz: "Zudlik bilan OvaBMU mutaxassisiga yo'naltiring; bemorni kuzatuvsiz qoldirmang.", ru: 'Немедленно направьте к специалисту роддома; не оставляйте пациентку без наблюдения.', en: 'Immediately refer to the maternity specialist; do not leave the patient unmonitored.' },
  "Zudlik bilan OvaBMU mutaxassisiga yo'naltiring; bemorni kuzatuvsiz qoldirmang. Qon bosimini takroran o'lchang.": { uz: "Zudlik bilan OvaBMU mutaxassisiga yo'naltiring; bemorni kuzatuvsiz qoldirmang. Qon bosimini takroran o'lchang.", ru: 'Немедленно направьте к специалисту роддома; не оставляйте пациентку без наблюдения. Повторно измерьте АД.', en: 'Immediately refer to the maternity specialist; do not leave the patient unmonitored. Re-measure blood pressure.' },
  "Zudlik bilan OvaBMU mutaxassisiga yo'naltiring; bemorni kuzatuvsiz qoldirmang. Homila harakati va yurak urishini shoshilinch tekshiring.": { uz: "Zudlik bilan OvaBMU mutaxassisiga yo'naltiring; bemorni kuzatuvsiz qoldirmang. Homila harakati va yurak urishini shoshilinch tekshiring.", ru: 'Немедленно направьте к специалисту роддома; не оставляйте пациентку без наблюдения. Срочно проверьте шевеления плода и сердцебиение.', en: 'Immediately refer to the maternity specialist; do not leave the patient unmonitored. Urgently check fetal movement and heart rate.' },
  "24 soat ichida shifokor ko'rigidan o'tkazing va ko'rsatkichlarni qayta tekshiring.": { uz: "24 soat ichida shifokor ko'rigidan o'tkazing va ko'rsatkichlarni qayta tekshiring.", ru: 'Осмотрите у врача в течение 24 часов и повторно проверьте показатели.', en: 'Have a doctor examine within 24 hours and re-check the indicators.' },
  "Rejali kuzatuvni davom ettiring; keyingi rejali ko'rik belgilangan muddatда.": { uz: "Rejali kuzatuvni davom ettiring; keyingi rejali ko'rik belgilangan muddatда.", ru: 'Продолжайте плановое наблюдение; следующий плановый осмотр в назначенный срок.', en: 'Continue routine monitoring; next scheduled visit as planned.' },
}

const LangCtx = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({
  lang: 'uz',
  setLang: () => {},
})

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => (localStorage.getItem('lang') as Lang) || 'uz')
  useEffect(() => { localStorage.setItem('lang', lang) }, [lang])
  return (
    <LangCtx.Provider value={{ lang, setLang: setLangState }}>{children}</LangCtx.Provider>
  )
}

export function useT() {
  const { lang, setLang } = useContext(LangCtx)
  const t = (key: string) => D[key]?.[lang] ?? key
  const zone = (z: string) => D[`zone.${z}`]?.[lang] ?? z
  const role = (r: string) => D[`role.${r}`]?.[lang] ?? r
  const sym = (s: string) => D[`sym.${s}`]?.[lang] ?? s
  const twinLevel = (l: string) => D[`twin.level.${l}`]?.[lang] ?? l
  const td = (s: string) => DATA[s]?.[lang] ?? s // backend data tarjimasi
  return { t, zone, role, sym, twinLevel, td, lang, setLang }
}
