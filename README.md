# Kursy Walut – Dane Historyczne (Temat 27)

**Kierunek studiów:** Inżynieria i analiza danych | III rok  
**Przedmiot:** Aplikacje internetowe  
**Rok akademicki:** 2026/2027  
**Autor:** Student kierunku Inżynieria i Analiza Danych  
**Technologie:** HTML5, CSS3, JavaScript (Vanilla JS), Chart.js (UMD)

---

## 1. Opis projektu i cel

Projekt stanowi realizację interaktywnej witryny internetowej prezentującej i analizującej zbiór danych historycznych kursów walut NBP (Temat 27). Aplikacja łączy wiedzę z zakresu tworzenia responsywnych interfejsów front-endowych z narzędziami eksploracji i statystycznej analizy danych rynkowych.

Projekt został zrealizowany w **czystym JavaScript (Vanilla JS)** bez użycia frameworków (React, Angular, Vue), co zapewnia maksymalną przejrzystość kodu, brak zależności zewnętrznych oraz możliwość bezpośredniego uruchomienia w dowolnej przeglądarce internetowej.

---

## 2. Struktura plików w projekcie

Zgodnie z zalecaną strukturą katalogów (pkt 6 wytycznych):

```text
projekt-kursy-walut/
├── index.html              # Strona główna z podsumowaniem rynku, opisem projektu i kartami kursów
├── dane.html               # Tabela danych historycznych z wyszukiwaniem, filtrami, sortowaniem i eksportem CSV
├── analiza.html            # Dashboard analityczny z wykresem Chart.js, statystykami i kalkulatorem walutowym
├── formularz.html          # Formularz rejestracji nowego notowania z podwójną walidacją HTML5 i JS
├── css/
│   └── style.css           # Główny arkusz stylów CSS (Flexbox, Grid, Media Queries, Dark/Light Mode)
├── js/
│   ├── app.js              # Główna logika interaktywna (DOM, filtrowanie, sortowanie, walidacja, kalkulator)
│   ├── data.js             # Zbiór danych historycznych oraz obsługa magazynu localStorage
│   └── chart.umd.min.js    # Lokalna biblioteka Chart.js (gwarantuje działanie 100% offline bez serwera)
├── data/
│   └── dane.json           # Zbiór danych w formacie JSON (40 rekordów z pełnymi atrybutami)
├── img/
│   ├── logo.svg            # Wektorowe logo serwisu WalutaStat
│   ├── currency-exchange.svg # Ilustracja rynków walutowych i notowań (Hero)
│   ├── analytics-chart.svg # Ilustracja analizy i wykresów (Dashboard)
│   └── security-check.svg  # Ilustracja weryfikacji i bezpieczeństwa danych (Formularz)
└── README.md               # Kompletna dokumentacja projektu
```

---

## 3. Zrealizowane wymagania i opis funkcji

### 3.1. Struktura i semantyka HTML5 (pkt 4.1, 4.2)
- **Minimum 4 podstrony:** `index.html`, `dane.html`, `analiza.html`, `formularz.html`.
- **Spójne menu nawigacyjne:** Dostępne na każdej podstronie z oznaczeniem aktywnej karty (`.active`).
- **Semantyczne znaczniki:** Wykorzystano `<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`, `<article>`, `<aside>`, `<figure>`, `<figcaption>`.
- **Dostępność (a11y):** Wszystkie pola formularzy posiadają powiązane etykiety `<label for="...">`, obrazy posiadają czytelne teksty alternatywne `alt`, zachowano poprawną hierarchię nagłówków (`h1` &rarr; `h2` &rarr; `h3`).
- **Zasoby graficzne:** 4 wektorowe grafiki SVG zoptymalizowane pod kątem czytelności i kontrastu.

### 3.2. Arkusz stylów CSS3 (pkt 4.3)
- Osobny plik `css/style.css`.
- Układ witryny oparty o nowoczesny **CSS Grid** (karty statystyk, formularz, stopka) oraz **Flexbox** (pasek nawigacji, filtry, elementy sterujące).
- **Responsywność (RWD):** Zaimplementowano 2 główne punkty przerwania `@media`:
  - `@media (max-width: 992px)` – tablety i mniejsze ekrany laptopów.
  - `@media (max-width: 640px)` – urządzenia mobilne (smartfony).
- **Interakcja wizualna:** Efekty `:hover`, `:focus-visible` na przyciskach i kontrolkach, płynne przejścia `transition`, animacje `@keyframes` (unoszenie grafiki hero, płynne pojawianie się alertów `fadeIn`).
- **Tryb jasny i ciemny (Dark / Light Theme):** Możliwość przełączania motywu na każdej podstronie za pomocą zmiennych CSS (`:root` / `body.dark-theme`) z zapamiętywaniem preferencji w `localStorage`.

### 3.3. Logika JavaScript i praca z DOM (pkt 4.4)
- Czysty JavaScript w modularnych plikach `js/data.js` i `js/app.js`.
- Pobieranie elementów przez `querySelector` i `querySelectorAll`.
- Obsługa zdarzeń: `click`, `input`, `change`, `submit`, `reset`.
- **Filtrowanie wielokryterialne:** Wyszukiwanie tekstowe w locie (`input`), selektor waluty (`select`), zakres dat początkowej i końcowej (`date`).
- **Dynamiczne sortowanie tabeli:** Możliwość kliknięcia w nagłówki kolumn (Data, Waluta, Kurs średni, Kurs kupna, Kurs sprzedaży, Zmiana procentowa) z automatycznym przełączaniem kierunku rosnąco/malejąco i wskaźnikami wizualnymi (strzałki).
- **Eksport do CSV:** Generowanie i natychmiastowe pobieranie pliku `.csv` z aktualnie przefiltrowanymi rekordami bez użycia serwera.

### 3.4. Dane i Dashboard analityczny (pkt 4.5)
- **Baza danych:** 40 historycznych notowań 4 kluczowych walut (EUR, USD, GBP, CHF) w relacji do PLN z okresu października 2026.
- Każdy rekord posiada atrybuty: `id`, `date`, `currency`, `currencyName`, `symbol`, `midRate`, `buyRate`, `sellRate`, `spread`, `changePercent`, `source`.
- **Wskaźniki statystyczne (wyliczane dynamicznie w JS):**
  1. Kurs średni w badanym okresie (średnia arytmetyczna).
  2. Kurs minimalny (Min).
  3. Kurs maksymalny (Max).
  4. Średni rynkowy spread walutowy (\( \text{Kurs sprzedaży} - \text{Kurs kupna} \)).
  5. Maksymalna zmienność sesyjna.
  6. Liczba sesji w próbie badawczej.
- **Wykresy Chart.js:** Interaktywny wykres liniowy lub słupkowy z przełączaniem analizowanej waluty oraz dynamicznym dostosowaniem kolorystyki do trybu jasnego/ciemnego.

### 3.5. Funkcjonalność indywidualna (pkt 4.6 + Temat 27)
- **Kalkulator przeliczeń walutowych:** Narzędzie pozwalające przeliczać dowolne kwoty pomiędzy PLN a wybraną walutą obcą (EUR, USD, GBP, CHF) z wyborem typu kursu (kurs średni NBP, kurs kupna kantoru, kurs sprzedaży kantoru) oraz przyciskiem natychmiastowej zamiany kierunku (swap).
- **Tryb ciemny (Dark Mode):** Pełna integracja z `localStorage`.
- **Persystencja danych użytkownika:** Nowo dodane notowania w formularzu automatycznie zapisują się w pamięci przeglądarki `localStorage` i są natychmiast uwzględniane w tabeli, na wykresie i w kalkulatorze.

### 3.6. Formularz rejestracji notowania (pkt 5)
Zawiera 10 kontrolek w 3 logicznych sekcjach (`<fieldset>` z `<legend>`):
1. `record-date` (`type="date"`) – data notowania.
2. `record-currency` (`<select>`) – kod waluty ISO.
3. `record-currency-name` (`type="text"`) – pełna polska nazwa.
4. `record-mid-rate` (`type="number"`, `step="0.0001"`) – kurs średni NBP.
5. `record-buy-rate` (`type="number"`, `step="0.0001"`) – kurs kupna.
6. `record-sell-rate` (`type="number"`, `step="0.0001"`) – kurs sprzedaży.
7. `record-source` (`type="radio"`) – źródło (NBP, EBC, Kantor).
8. `record-analyst-email` (`type="email"`) – e-mail weryfikatora.
9. `record-verified` (`type="checkbox"`) – oświadczenie o weryfikacji.
10. `record-notes` (`<textarea>`) – uwagi analityka.

**Walidacja JavaScript (dodatkowe warunki poza HTML5):**
1. *Warunek spójności cenowej:* Kurs sprzedaży musi być większy niż kurs kupna (\( \text{Sell} > \text{Buy} \)).
2. *Warunek kursu średniego:* Kurs średni musi leżeć wewnątrz widełek (\( \text{Buy} \le \text{Mid} \le \text{Sell} \)).
3. *Warunek chronologii:* Data nie może być datą z przyszłości (\( \text{Data} \le \text{Dziś} \)).
4. *Warunek akceptacji:* Wymóg potwierdzenia weryfikacji w checkboxie.

Po zatwierdzeniu formularza wyświetlana jest elegancka karta podsumowująca parametry rekordu w obrębie strony (bez przeładowania).

---

## 4. Źródła danych i zasobów

1. **Dane rynkowe kursów walut:**
   - Narodowy Bank Polski (NBP) – oficjalne tabele kursów średnich walut obcych (Tabela A): [https://nbp.pl](https://nbp.pl).
2. **Biblioteka wykresów:**
   - Chart.js (v4.4.1 UMD): [https://www.chartjs.org](https://www.chartjs.org) – dołączona lokalnie do katalogu `js/chart.umd.min.js` (działa całkowicie offline).
3. **Grafiki i ikony:**
   - Autorskie wektorowe pliki SVG (`logo.svg`, `currency-exchange.svg`, `analytics-chart.svg`, `security-check.svg`) utworzone na potrzeby projektu.

---

## 5. Instrukcja uruchomienia projektu

Projekt **nie wymaga instalowania żadnego środowiska serwerowego**, Node.js, PHP ani baz danych (zgodnie z założeniem pkt 2.3 i 10.3).

### Sposób uruchomienia:
1. Otwórz katalog projektu `projekt-kursy-walut/`.
2. Kliknij dwukrotnie w plik `index.html` lub przeciągnij go do okna dowolnej przeglądarki internetowej (Google Chrome, Mozilla Firefox, Microsoft Edge, Opera, Safari).
3. Aplikacja natychmiast załaduje się i udostępni wszystkie moduły: przegląd rynku, tabelę danych z wyszukiwarką i sortowaniem, analizę statystyczną z wykresem Chart.js, kalkulator walutowy oraz formularz dodawania danych.
