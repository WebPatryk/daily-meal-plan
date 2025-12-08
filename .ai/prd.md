# Dokument wymagań produktu (PRD) - DailyMeal

## 1. Przegląd produktu

DailyMeal to webowa aplikacja wspomagająca osoby aktywne fizycznie w planowaniu posiłków na każdy dzień tygodnia. Wykorzystując preferencje żywieniowe użytkownika oraz możliwości AI, aplikacja generuje lub pozwala ręcznie definiować przepisy, przechowuje je w Supabase oraz prezentuje w przejrzystym, dostępnościowym interfejsie. MVP koncentruje się na planowaniu tygodniowym, podstawowej autoryzacji (e-mail + hasło), integracji z Supabase (Postgres + Storage) i generowaniu przepisów przez AI.

## 2. Problem użytkownika

Osoby ćwiczące na siłowni często:

1. Tracą czas na ręczne obliczanie makroskładników i doboru przepisów.
2. Potrzebują spersonalizowanych jadłospisów zgodnych z ich celami (kcal, białko).
3. Nie mają jednego narzędzia, które łączy plan tygodniowy, edycję i generowanie przepisów w jednym miejscu.
   DailyMeal rozwiązuje te problemy, automatyzując generowanie posiłków przez AI, umożliwiając ręczną edycję i przechowywanie danych w chmurze.

## 3. Wymagania funkcjonalne

FR-01 Rejestracja i logowanie użytkownika przy użyciu Supabase (e-mail + hasło).
FR-02 Podczas rejestracji użytkownik ustawia docelową dzienną liczbę kcal i białka (z możliwością późniejszej edycji).
FR-03 Walidacja danych front-end (1–3000 kcal, 1–300 g białka na posiłek) oraz back-end (Supabase RLS lub Edge Function).
FR-04 Wyświetlanie tygodniowego planera (grid 5 posiłków × 7 dni) z widokiem tylko na bieżący tydzień.
FR-05 Ręczne dodawanie posiłku do dowolnej komórki gridu, w tym: nazwa, kcal, białko, Opcjonalne: składniki, kroki.
FR-06 Generowanie posiłku przez AI po podaniu zakresu kcal/białka i opcjonalnego opisu; AI zwraca nazwę, makra, składniki, kroki i ikonę SVG.
FR-07 Edycja istniejącego posiłku (nazwa, makra, składniki, kroki, zastąpienie miniatury).
FR-08 Ikony posiłków: generowanie ikony SVG przez AI podczas tworzenia posiłku.
FR-09 Zapisywanie i odczytywanie danych posiłków w tabeli `meals` (indeksy: user_id, date, meal_type).
FR-10 UI zgodne z WCAG (kontrast, klawiatura, opisy alt, fokus).

## 4. Granice produktu

GB-01 Brak importu przepisów z URL w MVP.
GB-02 Brak funkcji społecznościowych i udostępniania przepisów.
GB-03 Brak limitu wywołań AI w MVP (może ulec zmianie w kolejnych wersjach).
GB-04 Widok offline nieobsługiwany.
GB-05 Obsługiwany wyłącznie bieżący tydzień.

## 5. Historyjki użytkowników

ID: US-001  
Tytuł: Rejestracja konta  
Opis: Jako nowy użytkownik chcę utworzyć konto e-mail + hasło, aby móc zapisywać własne plany.  
Kryteria akceptacji:

- Użytkownik może zarejestrować się przy użyciu ważnego adresu e-mail i hasła.
- Po rejestracji użytkownik otrzymuje e-mail weryfikacyjny.
- Dane są zapisywane w Supabase Auth.
- Pola obowiązkowe są walidowane zarówno po stronie front-end, jak i back-end.

ID: US-002  
Tytuł: Logowanie  
Opis: Jako zarejestrowany użytkownik chcę się zalogować, aby uzyskać dostęp do mojego planu.  
Kryteria akceptacji:

- Poprawne dane logowania umożliwiają dostęp do dashboardu.
- Niepoprawne dane wyświetlają komunikat błędu.
- Sesja jest utrzymywana do czasu wylogowania lub wygaśnięcia tokenu.

ID: US-003  
Tytuł: Ustawienie docelowych makr  
Opis: Jako użytkownik chcę określić docelowe dzienne kcal i białko, aby AI mogło lepiej dopasować przepisy.  
Kryteria akceptacji:

- Formularz przyjmuje wartości w zakresie 1–3000 kcal oraz 1–300 g białka.
- W przypadku błędnych wartości pojawia się komunikat walidacyjny.
- Zapisane wartości są widoczne w profilu i mogą być edytowane.

ID: US-004  
Tytuł: Ręczne dodanie posiłku  
Opis: Jako użytkownik chcę ręcznie dodać posiłek do siatki tygodnia, aby odzwierciedlić mój plan.  
Kryteria akceptacji:

- Użytkownik wybiera dzień oraz typ posiłku.
- Formularz umożliwia wpisanie nazwy, makr, opcjonalnie składników i kroków.
- Po zapisaniu posiłek pojawia się w odpowiedniej komórce gridu.

ID: US-005  
Tytuł: Generowanie posiłku przez AI  
Opis: Jako użytkownik chcę wygenerować posiłek przez AI, aby zaoszczędzić czas.  
Kryteria akceptacji:

- Użytkownik podaje zakres kcal/białka oraz opcjonalny opis posiłku.
- System wyświetla wygenerowany posiłek z nazwą, makrami, składnikami, krokami i ikoną SVG.
- Użytkownik może zaakceptować lub edytować dane przed zapisaniem.

ID: US-006  
Tytuł: Edycja posiłku  
Opis: Jako użytkownik chcę edytować istniejący posiłek, aby dopasować go do aktualnych potrzeb.  
Kryteria akceptacji:

- Kliknięcie posiłku otwiera formularz edycji (modal).
- Użytkownik może zmienić nazwę, makra, składniki i kroki.
- Zmiany można zapisać lub anulować; po zapisie dane aktualizują się w tabeli `meals`.

ID: US-007  
Tytuł: Walidacja makr back-end  
Opis: Jako system chcę uniemożliwić zapisanie posiłku z niepoprawnymi makrami, aby zachować integralność danych.  
Kryteria akceptacji:

- Edge Function/RLS odrzuca wartości poza dozwolonym zakresem.
- Odrzucone żądanie zwraca kod błędu i czytelną wiadomość walidacyjną.
- Log bazy danych rejestruje przypadki odrzuceń.

## 6. Metryki sukcesu

M-01 90 % aktywnych użytkowników uzupełni sekcję preferencji żywieniowych na cały tydzień w profilu w ciągu 7 dni od rejestracji.
M-02 75 % aktywnych użytkowników wygeneruje ≥ 1 posiłek AI w ciągu tygodnia.
