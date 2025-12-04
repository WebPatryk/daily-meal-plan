# Przewodnik Testowania - Generowanie Posiłków AI

## 🎯 Cel
Przetestowanie pełnego flow generowania posiłków przy użyciu AI (GPT-4o-mini przez OpenRouter).

## ⚙️ Przygotowanie

### 1. Sprawdź zmienne środowiskowe

Upewnij się, że masz poprawnie skonfigurowany plik `.env`:

```bash
# Wymagane dla AI
OPENROUTER_API_KEY=sk-or-v1-xxx...

# Wymagane dla Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJxxx...
```

**Gdzie znaleźć klucz OpenRouter:**
1. Przejdź do https://openrouter.ai/
2. Zaloguj się lub załóż konto
3. Idź do "Settings" → "API Keys"
4. Skopiuj swój klucz API (zaczyna się od `sk-or-v1-`)

### 2. Uruchom aplikację

```bash
npm run dev
```

Aplikacja powinna być dostępna pod: `http://localhost:4321`

### 3. Zaloguj się

Musisz być zalogowany, żeby testować funkcjonalność AI.

---

## 📋 Scenariusze testowe

### ✅ Test 1: Podstawowe generowanie śniadania

**Krok po kroku:**

1. Otwórz planer tygodniowy (`/planner`)
2. Kliknij przycisk **"Generuj AI"** (w prawym górnym rogu)
3. Wypełnij formularz:
   - **Kalorie (min):** 300
   - **Kalorie (max):** 500
   - **Białko (min):** 20
   - **Białko (max):** 35
   - **Opis:** `Zdrowe śniadanie z owocami i orzechami`
   - **Dzień:** Poniedziałek
   - **Typ posiłku:** Śniadanie
4. Kliknij **"Generuj"**
5. ⏳ Poczekaj 5-10 sekund (AI generuje odpowiedź)

**Oczekiwany rezultat:**
- ✅ Pojawia się podgląd wygenerowanego posiłku
- ✅ Nazwa posiłku po polsku (np. "Owsianka z bananami i orzechami")
- ✅ Kalorie w zakresie 300-500 kcal
- ✅ Białko w zakresie 20-35g
- ✅ Lista składników (np. "200g płatków owsianych", "1 banan")
- ✅ Kroki przygotowania (numerowane)

6. Kliknij **"Zapisz"**

**Oczekiwany rezultat:**
- ✅ Modal się zamyka
- ✅ Nowy posiłek pojawia się w kafelku "Poniedziałek - Śniadanie"
- ✅ Wyświetla się toast "Posiłek został dodany"
- ✅ Suma kalorii i białka aktualizuje się na górze strony

---

### ✅ Test 2: Obiad wysokobiałkowy

**Krok po kroku:**

1. Kliknij **"Generuj AI"**
2. Wypełnij:
   - **Kalorie:** 600-800
   - **Białko:** 40-60
   - **Opis:** `Wysokobiałkowy obiad z kurczakiem i ryżem`
   - **Dzień:** Wtorek
   - **Typ:** Obiad
3. Kliknij **"Generuj"**

**Oczekiwany rezultat:**
- ✅ AI generuje posiłek z dużą ilością białka
- ✅ Składniki zawierają kurczaka lub inne źródło białka
- ✅ Wartości odżywcze mieszczą się w zakresie

4. Kliknij **"Zapisz"**

---

### ✅ Test 3: Kolacja wegańska

**Parametry:**
- Kalorie: 400-600
- Białko: 15-25
- Opis: `Wegańska kolacja bez produktów odzwierzęcych`
- Dzień: Środa
- Typ: Kolacja

**Oczekiwany rezultat:**
- ✅ AI generuje posiłek wegański
- ✅ Brak mięsa, nabiału, jajek w składnikach
- ✅ Może zawierać tofu, tempeh, rośliny strączkowe

---

### ✅ Test 4: Drugie śniadanie niskokaloryczne

**Parametry:**
- Kalorie: 150-250
- Białko: 10-15
- Opis: `Lekkie drugie śniadanie dla osób na diecie`
- Dzień: Czwartek
- Typ: Drugie śniadanie

**Oczekiwany rezultat:**
- ✅ Mała porcja, niskokaloryczna
- ✅ Odpowiednia dla przekąski między posiłkami

---

### ✅ Test 5: Podwieczorek dla dziecka

**Parametry:**
- Kalorie: 200-300
- Białko: 8-15
- Opis: `Smaczny i zdrowy podwieczorek dla dziecka w wieku szkolnym`
- Dzień: Piątek
- Typ: Podwieczorek

**Oczekiwany rezultat:**
- ✅ AI dostosowuje przepis do dziecka
- ✅ Proste składniki i przygotowanie
- ✅ Atrakcyjna prezentacja

---

## 🐛 Testowanie błędów

### Test 6: Nieprawidłowe zakresy

1. Ustaw:
   - Kalorie min: 500
   - Kalorie max: 400 (mniejsze niż min!)
2. Kliknij "Generuj"

**Oczekiwany rezultat:**
- ✅ Formularz wyświetla błąd walidacji
- ✅ Przycisk "Generuj" jest zablokowany lub pokazuje błąd

### Test 7: Pusty opis

1. Wypełnij wszystko oprócz opisu
2. Kliknij "Generuj"

**Oczekiwany rezultat:**
- ✅ Błąd: "Opis jest wymagany"

### Test 8: Brak połączenia z API

1. Wyłącz internet ALBO ustaw nieprawidłowy klucz API w `.env`
2. Spróbuj wygenerować posiłek

**Oczekiwany rezultat:**
- ✅ Wyświetla się komunikat błędu
- ✅ Nie zawiesza się aplikacja
- ✅ Możliwość ponowienia próby

---

## 🔍 Co sprawdzać podczas testów

### Jakość wygenerowanych posiłków

- [ ] Nazwa po polsku i sensowna
- [ ] Wartości odżywcze w zakresie (±10% tolerancja)
- [ ] Składniki z konkretnymi ilościami (np. "200g", "2 łyżki")
- [ ] Kroki jasne i wykonalne
- [ ] Brak absurdalnych połączeń składników

### UI/UX

- [ ] Loading spinner podczas generowania
- [ ] Możliwość zamknięcia modalu w każdym momencie
- [ ] Przyciski disabled podczas generowania/zapisywania
- [ ] Toast notifications po zapisaniu
- [ ] Brak błędów w console (F12)

### Performance

- [ ] Czas generowania: 5-15 sekund (akceptowalne)
- [ ] Czas zapisywania: < 2 sekundy
- [ ] Brak zawieszania UI podczas operacji
- [ ] Smooth animations

### Integracja

- [ ] Zapisany posiłek widoczny od razu w gridzie
- [ ] Suma kalorii/białka aktualizuje się
- [ ] Możliwość edycji wygenerowanego posiłku
- [ ] Możliwość usunięcia wygenerowanego posiłku
- [ ] Posiłek jest oznaczony jako `source: "ai_generated"`

---

## 📊 Test coverage

### Różne kombinacje

Przetestuj co najmniej:
- ✅ Wszystkie 5 typów posiłków (śniadanie, 2. śniadanie, obiad, podwieczorek, kolacja)
- ✅ Wszystkie 7 dni tygodnia
- ✅ Różne zakresy kaloryczne (małe: 150-300, średnie: 400-700, duże: 800-1200)
- ✅ Różne zakresy białkowe (niskie: 5-15g, średnie: 20-40g, wysokie: 50-80g)
- ✅ Różne opisy (wegańskie, wysokobiałkowe, niskokaloryczne, dla dzieci, itp.)

### Edge cases

- [ ] Minimalne wartości (1 kcal, 1g białka)
- [ ] Maksymalne wartości (3000 kcal, 300g białka)
- [ ] Bardzo długi opis (500 znaków)
- [ ] Opis z emoji 🥗🍎
- [ ] Opis z polskimi znakami (ą, ę, ć, ł, ń, ó, ś, ź, ż)

---

## 🎓 Przykłady ciekawych opisów do przetestowania

1. **"Posiłek przedtreningowy z szybko przyswajalnym białkiem"**
2. **"Obiad keto z wysoką zawartością tłuszczów"**
3. **"Śniadanie bezglutenowe dla osoby z celiakią"**
4. **"Kolacja mediterrańska z rybą i warzywami"**
5. **"Lunch box do pracy, szybki w przygotowaniu"**
6. **"Deser proteinowy po treningu"**
7. **"Posiłek z polskimi produktami sezonowymi"**
8. **"Lekka kolacja dla osoby na diecie redukcyjnej"**
9. **"Śniadanie dla osoby aktywnej fizycznie"**
10. **"Obiad rodzinny dla 4 osób"**

---

## 📝 Raportowanie błędów

Jeśli znajdziesz błąd, zanotuj:

1. **Kroki do reprodukcji** (dokładnie co zrobić)
2. **Oczekiwane zachowanie** (co powinno się stać)
3. **Rzeczywiste zachowanie** (co się stało)
4. **Screenshot** (jeśli możliwe)
5. **Console errors** (F12 → Console)
6. **Network errors** (F12 → Network → błędy w kolorze czerwonym)
7. **Parametry użyte** (zakres kalorii, białka, opis)

### Przykład raportu błędu

```
Błąd: AI generuje posiłek spoza zakresu kalorycznego

Kroki:
1. Otwórz "Generuj AI"
2. Ustaw kalorie: 300-500
3. Opis: "Śniadanie wegańskie"
4. Kliknij "Generuj"

Oczekiwane: Posiłek 300-500 kcal
Rzeczywiste: Posiłek ma 650 kcal

Screenshot: [załącz]
Console: No errors
Network: 200 OK
```

---

## ✅ Checklist przed zatwierdzeniem

- [ ] Wszystkie 5 testów podstawowych (1-5) przeszły pomyślnie
- [ ] Co najmniej 1 test błędów (6-8) potwierdził poprawną obsługę
- [ ] Przetestowano minimum 3 różne typy posiłków
- [ ] Przetestowano minimum 3 różne opisy
- [ ] UI jest responsywny i nie zawiesza się
- [ ] Brak błędów w konsoli
- [ ] Suma kalorii/białka aktualizuje się poprawnie
- [ ] Zapisane posiłki są widoczne w gridzie
- [ ] Możliwa edycja i usuwanie wygenerowanych posiłków

---

## 🚀 Gotowe!

Jeśli wszystkie testy przeszły pomyślnie, funkcjonalność generowania AI jest gotowa do użycia! 🎉

**Następne kroki:**
1. Deploy na środowisko testowe
2. User acceptance testing (UAT)
3. Performance monitoring
4. Cost tracking (OpenRouter usage)
5. Feedback loop od użytkowników

**Kontakt:**
W razie pytań lub problemów, sprawdź:
- `.ai/generation-service-summary.md` - szczegóły implementacji
- `src/lib/generation.service.ts` - kod źródłowy
- OpenRouter docs: https://openrouter.ai/docs


