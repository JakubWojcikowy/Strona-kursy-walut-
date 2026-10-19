/**
 * ============================================================================
 * PROJEKT: Kursy walut – dane historyczne (Temat 27)
 * KIERUNEK: Inżynieria i analiza danych | Aplikacje internetowe
 * PLIK: js/app.js - Główna logika interaktywna aplikacji (Vanilla JS)
 * ============================================================================
 * Plik odpowiada za:
 * - Obsługę motywu jasnego/ciemnego (localStorage)
 * - Dynamiczne renderowanie i sortowanie tabeli notowań walutowych
 * - Filtrowanie wielokryterialne i wyszukiwanie danych
 * - Obliczanie wskaźników analitycznych (min, max, średnia, spread)
 * - Inicjalizację i aktualizację wykresów Chart.js
 * - Interaktywny kalkulator walutowy
 * - Kompleksową walidację formularza w JS i dodawanie rekordów
 * - Eksport aktualnego widoku danych do formatu CSV
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Inicjalizacja wspólnych modułów
  initThemeManager();

  // 2. Wykrycie aktywnej podstrony i inicjalizacja odpowiednich komponentów
  const pageId = document.body.dataset.page;

  if (pageId === 'home') {
    initHomePage();
  } else if (pageId === 'dane') {
    initDataTablePage();
  } else if (pageId === 'analiza') {
    initAnalyticsDashboardPage();
  } else if (pageId === 'formularz') {
    initSubmissionFormPage();
  }
});

/* ==========================================================================
   MODUŁ 1: MOTYW JASNY / CIEMNY (DARK / LIGHT THEME)
   ========================================================================== */
function initThemeManager() {
  const themeToggleBtn = document.querySelector('#theme-toggle');
  const storedTheme = localStorage.getItem('walutastat_theme') || 'light';

  // Zastosowanie zapisanego motywu
  if (storedTheme === 'dark') {
    document.body.classList.add('dark-theme');
    updateThemeButtonText(true);
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const isDark = document.body.classList.toggle('dark-theme');
      localStorage.setItem('walutastat_theme', isDark ? 'dark' : 'light');
      updateThemeButtonText(isDark);
      
      // Jeśli na stronie znajduje się wykres Chart.js, odśwież jego kolory
      if (window.activeChartInstance) {
        updateChartTheme(window.activeChartInstance, isDark);
      }
    });
  }
}

function updateThemeButtonText(isDark) {
  const themeToggleBtn = document.querySelector('#theme-toggle');
  if (themeToggleBtn) {
    themeToggleBtn.innerHTML = isDark 
      ? '☀️ <span>Tryb jasny</span>' 
      : '🌙 <span>Tryb ciemny</span>';
  }
}

/* ==========================================================================
   MODUŁ 2: STRONA GŁÓWNA (PODSUMOWANIE RYNKU)
   ========================================================================== */
function initHomePage() {
  const records = window.ExchangeDataService.getAll();
  renderHomeHighlights(records);
}

function renderHomeHighlights(records) {
  // Pobieramy najnowsze notowania dla każdej waluty
  const currencies = ['EUR', 'USD', 'GBP', 'CHF'];
  const latestByCurrency = {};

  // Sortujemy malejąco po dacie, aby pierwsze wystąpienie było najnowsze
  const sorted = [...records].sort((a, b) => new Date(b.date) - new Date(a.date));
  
  currencies.forEach(curr => {
    latestByCurrency[curr] = sorted.find(r => r.currency === curr);
  });

  currencies.forEach(curr => {
    const rec = latestByCurrency[curr];
    if (!rec) return;

    const rateElem = document.querySelector(`#rate-${curr.toLowerCase()}`);
    const changeElem = document.querySelector(`#change-${curr.toLowerCase()}`);

    if (rateElem) {
      rateElem.textContent = rec.midRate.toFixed(4) + ' PLN';
    }
    if (changeElem) {
      const isPositive = rec.changePercent >= 0;
      changeElem.className = `badge ${isPositive ? 'badge-green' : 'badge-red'}`;
      changeElem.textContent = (isPositive ? '+' : '') + rec.changePercent.toFixed(2) + '%';
    }
  });

  // Liczba wszystkich notowań w bazie
  const totalCountElem = document.querySelector('#total-records-count');
  if (totalCountElem) {
    totalCountElem.textContent = records.length;
  }
}

/* ==========================================================================
   MODUŁ 3: DANE HISTORYCZNE (TABELA, FILTRY, SORTOWANIE, EKSPORT)
   ========================================================================== */
let currentSortColumn = 'date';
let currentSortDirection = 'desc'; // 'asc' lub 'desc'

function initDataTablePage() {
  const tableBody = document.querySelector('#exchange-table-body');
  const searchInput = document.querySelector('#search-input');
  const currencyFilter = document.querySelector('#currency-filter');
  const dateFromFilter = document.querySelector('#date-from');
  const dateToFilter = document.querySelector('#date-to');
  const resetFiltersBtn = document.querySelector('#reset-filters-btn');
  const exportCsvBtn = document.querySelector('#export-csv-btn');
  const tableHeaders = document.querySelectorAll('.data-table th.sortable');

  if (!tableBody) return;

  // Główna funkcja odświeżająca tabelę
  function refreshView() {
    const rawData = window.ExchangeDataService.getAll();
    const filtered = filterData(rawData, {
      query: searchInput ? searchInput.value.trim().toLowerCase() : '',
      currency: currencyFilter ? currencyFilter.value : 'all',
      dateFrom: dateFromFilter ? dateFromFilter.value : '',
      dateTo: dateToFilter ? dateToFilter.value : ''
    });

    const sorted = sortData(filtered, currentSortColumn, currentSortDirection);
    renderTable(sorted, tableBody);
    updateFilterSummary(sorted.length, rawData.length);
  }

  // Zdarzenie 1: 'input' - szybkie wyszukiwanie w locie
  if (searchInput) {
    searchInput.addEventListener('input', refreshView);
  }

  // Zdarzenie 2: 'change' - filtry rozwijane i daty
  if (currencyFilter) {
    currencyFilter.addEventListener('change', refreshView);
  }
  if (dateFromFilter) {
    dateFromFilter.addEventListener('change', refreshView);
  }
  if (dateToFilter) {
    dateToFilter.addEventListener('change', refreshView);
  }

  // Zdarzenie 3: 'click' - resetowanie filtrów
  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (currencyFilter) currencyFilter.value = 'all';
      if (dateFromFilter) dateFromFilter.value = '';
      if (dateToFilter) dateToFilter.value = '';
      currentSortColumn = 'date';
      currentSortDirection = 'desc';
      updateSortHeaderIndicators();
      refreshView();
    });
  }

  // Zdarzenie 4: 'click' - eksport do pliku CSV
  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', () => {
      const rawData = window.ExchangeDataService.getAll();
      const filtered = filterData(rawData, {
        query: searchInput ? searchInput.value.trim().toLowerCase() : '',
        currency: currencyFilter ? currencyFilter.value : 'all',
        dateFrom: dateFromFilter ? dateFromFilter.value : '',
        dateTo: dateToFilter ? dateToFilter.value : ''
      });
      exportToCsv(filtered);
    });
  }

  // Obsługa kliknięcia w nagłówki kolumn w celu sortowania
  tableHeaders.forEach(th => {
    th.addEventListener('click', () => {
      const colKey = th.dataset.sort;
      if (currentSortColumn === colKey) {
        currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        currentSortColumn = colKey;
        currentSortDirection = 'asc';
      }
      updateSortHeaderIndicators();
      refreshView();
    });
  });

  // Pierwsze załadowanie
  updateSortHeaderIndicators();
  refreshView();
}

/**
 * Filtruje zestaw danych na podstawie przekazanych kryteriów.
 */
function filterData(data, filters) {
  return data.filter(item => {
    // 1. Filtr tekstowy (wyszukiwanie po kodzie waluty, nazwie lub dacie)
    if (filters.query) {
      const matchCurrency = item.currency.toLowerCase().includes(filters.query);
      const matchName = item.currencyName.toLowerCase().includes(filters.query);
      const matchDate = item.date.includes(filters.query);
      if (!matchCurrency && !matchName && !matchDate) {
        return false;
      }
    }

    // 2. Filtr waluty
    if (filters.currency && filters.currency !== 'all') {
      if (item.currency !== filters.currency) {
        return false;
      }
    }

    // 3. Filtr daty 'od'
    if (filters.dateFrom) {
      if (new Date(item.date) < new Date(filters.dateFrom)) {
        return false;
      }
    }

    // 4. Filtr daty 'do'
    if (filters.dateTo) {
      if (new Date(item.date) > new Date(filters.dateTo)) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Sortuje tablicę obiektów po wybranej kolumnie i kierunku.
 */
function sortData(data, column, direction) {
  return [...data].sort((a, b) => {
    let valA = a[column];
    let valB = b[column];

    // Porównywanie dat
    if (column === 'date') {
      valA = new Date(valA).getTime();
      valB = new Date(valB).getTime();
    }

    if (valA < valB) return direction === 'asc' ? -1 : 1;
    if (valA > valB) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}

/**
 * Renderuje wiersze tabeli HTML.
 */
function renderTable(records, tbodyElement) {
  tbodyElement.innerHTML = '';

  if (records.length === 0) {
    const emptyRow = document.createElement('tr');
    emptyRow.innerHTML = `
      <td colspan="8" style="text-align: center; padding: 2rem; color: var(--text-muted);">
        Brak notowań spełniających wybrane kryteria wyszukiwania.
      </td>
    `;
    tbodyElement.appendChild(emptyRow);
    return;
  }

  records.forEach(r => {
    const tr = document.createElement('tr');
    const isChangePositive = r.changePercent >= 0;
    const changeSign = isChangePositive ? '+' : '';
    const badgeClass = isChangePositive ? 'badge-green' : 'badge-red';

    tr.innerHTML = `
      <td><strong>${escapeHtml(r.date)}</strong></td>
      <td>
        <span class="badge badge-currency">${escapeHtml(r.currency)}</span>
        <span style="font-size: 0.85rem; color: var(--text-muted); margin-left: 0.35rem;">${escapeHtml(r.currencyName)}</span>
      </td>
      <td><strong>${r.midRate.toFixed(4)} PLN</strong></td>
      <td>${r.buyRate.toFixed(4)} PLN</td>
      <td>${r.sellRate.toFixed(4)} PLN</td>
      <td>${(r.sellRate - r.buyRate).toFixed(4)} PLN</td>
      <td>
        <span class="badge ${badgeClass}">${changeSign}${r.changePercent.toFixed(2)}%</span>
      </td>
      <td><small style="color: var(--text-muted);">${escapeHtml(r.source || 'NBP')}</small></td>
    `;
    tbodyElement.appendChild(tr);
  });
}

/**
 * Aktualizuje strzałki sortowania w nagłówkach kolumn.
 */
function updateSortHeaderIndicators() {
  const headers = document.querySelectorAll('.data-table th.sortable');
  headers.forEach(th => {
    th.classList.remove('sorted-asc', 'sorted-desc');
    if (th.dataset.sort === currentSortColumn) {
      th.classList.add(currentSortDirection === 'asc' ? 'sorted-asc' : 'sorted-desc');
    }
  });
}

/**
 * Aktualizuje informację o liczbie znalezionych rekordów.
 */
function updateFilterSummary(displayedCount, totalCount) {
  const countDisplay = document.querySelector('#filter-results-count');
  if (countDisplay) {
    countDisplay.textContent = `Wyświetlono ${displayedCount} z ${totalCount} notowań`;
  }
}

/**
 * Eksportuje bieżącą listę do pliku CSV.
 */
function exportToCsv(data) {
  if (!data || data.length === 0) {
    alert("Brak danych do eksportu!");
    return;
  }

  const headers = ["Data", "Waluta", "Nazwa", "Kurs_sredni", "Kurs_kupna", "Kurs_sprzedazy", "Spread", "Zmiana_proc", "Zrodlo"];
  const rows = data.map(r => [
    r.date,
    r.currency,
    `"${r.currencyName}"`,
    r.midRate.toFixed(4),
    r.buyRate.toFixed(4),
    r.sellRate.toFixed(4),
    (r.sellRate - r.buyRate).toFixed(4),
    r.changePercent.toFixed(2),
    r.source || 'NBP'
  ]);

  const csvContent = "data:text/csv;charset=utf-8," 
    + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `notowania_walut_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/* ==========================================================================
   MODUŁ 4: ANALIZA, STATYSTYKI I WYKRESY (DASHBOARD + KALKULATOR)
   ========================================================================== */
function initAnalyticsDashboardPage() {
  const records = window.ExchangeDataService.getAll();
  const currencySelect = document.querySelector('#dashboard-currency-select');
  const chartTypeSelect = document.querySelector('#dashboard-chart-type');

  // Funkcja odświeżająca cały dashboard
  function refreshDashboard() {
    const selectedCurrency = currencySelect ? currencySelect.value : 'EUR';
    const chartType = chartTypeSelect ? chartTypeSelect.value : 'line';
    
    // Filtrowanie notowań dla wybranej waluty
    const currencyRecords = records
      .filter(r => r.currency === selectedCurrency)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // 1. Obliczanie wskaźników statystycznych (min. 3 wyliczone wskaźniki w JS)
    calculateAndDisplayMetrics(currencyRecords, selectedCurrency);

    // 2. Renderowanie wykresu Chart.js
    renderCurrencyChart(currencyRecords, selectedCurrency, chartType);
  }

  if (currencySelect) {
    currencySelect.addEventListener('change', refreshDashboard);
  }
  if (chartTypeSelect) {
    chartTypeSelect.addEventListener('change', refreshDashboard);
  }

  // Inicjalizacja kalkulatora walutowego
  initCurrencyCalculator(records);

  // Pierwsze załadowanie
  refreshDashboard();
}

/**
 * Oblicza dynamiczne wskaźniki na podstawie danych:
 * - Kurs średni
 * - Kurs minimalny
 * - Kurs maksymalny
 * - Średni spread walutowy
 * - Największa zmiana dzienna
 */
function calculateAndDisplayMetrics(records, currencyCode) {
  if (!records || records.length === 0) return;

  const rates = records.map(r => r.midRate);
  const spreads = records.map(r => r.sellRate - r.buyRate);
  const changes = records.map(r => Math.abs(r.changePercent));

  // Średnia arytmetyczna kursu
  const sumRates = rates.reduce((acc, val) => acc + val, 0);
  const avgRate = sumRates / rates.length;

  // Minimum i maksimum
  const minRate = Math.min(...rates);
  const maxRate = Math.max(...rates);

  // Średni spread
  const sumSpreads = spreads.reduce((acc, val) => acc + val, 0);
  const avgSpread = sumSpreads / spreads.length;

  // Maksymalne wahanie dzienne
  const maxVolatility = Math.max(...changes);

  // Podstawienie wartości do elementów DOM
  setDomText('#metric-avg-rate', `${avgRate.toFixed(4)} PLN`);
  setDomText('#metric-min-rate', `${minRate.toFixed(4)} PLN`);
  setDomText('#metric-max-rate', `${maxRate.toFixed(4)} PLN`);
  setDomText('#metric-avg-spread', `${avgSpread.toFixed(4)} PLN`);
  setDomText('#metric-max-volatility', `±${maxVolatility.toFixed(2)}%`);
  setDomText('#metric-sample-count', `${records.length} sesji`);
}

function setDomText(selector, text) {
  const el = document.querySelector(selector);
  if (el) el.textContent = text;
}

/**
 * Renderuje wykres Chart.js w elemencie <canvas id="currencyChart">
 */
function renderCurrencyChart(records, currencyCode, chartType) {
  const canvas = document.querySelector('#currencyChart');
  if (!canvas || typeof Chart === 'undefined') return;

  const labels = records.map(r => r.date);
  const midRates = records.map(r => r.midRate);
  const buyRates = records.map(r => r.buyRate);
  const sellRates = records.map(r => r.sellRate);

  const isDark = document.body.classList.contains('dark-theme');
  const textColor = isDark ? '#94a3b8' : '#64748b';
  const gridColor = isDark ? '#27354f' : '#e2e8f0';

  // Niszczymy stary wykres przed utworzeniem nowego
  if (window.activeChartInstance) {
    window.activeChartInstance.destroy();
  }

  const ctx = canvas.getContext('2d');
  window.activeChartInstance = new Chart(ctx, {
    type: chartType,
    data: {
      labels: labels,
      datasets: [
        {
          label: `Kurs średni ${currencyCode} (PLN)`,
          data: midRates,
          borderColor: '#2563eb',
          backgroundColor: chartType === 'bar' ? 'rgba(37, 99, 235, 0.7)' : 'rgba(37, 99, 235, 0.1)',
          fill: chartType === 'line',
          tension: 0.3,
          borderWidth: 3,
          pointRadius: 4,
          pointHoverRadius: 7
        },
        {
          label: `Kurs sprzedaży (PLN)`,
          data: sellRates,
          borderColor: '#ef4444',
          backgroundColor: chartType === 'bar' ? 'rgba(239, 68, 68, 0.6)' : 'rgba(239, 68, 68, 0.05)',
          borderDash: chartType === 'line' ? [5, 5] : [],
          borderWidth: 2,
          fill: false,
          tension: 0.3
        },
        {
          label: `Kurs kupna (PLN)`,
          data: buyRates,
          borderColor: '#10b981',
          backgroundColor: chartType === 'bar' ? 'rgba(16, 185, 129, 0.6)' : 'rgba(16, 185, 129, 0.05)',
          borderDash: chartType === 'line' ? [5, 5] : [],
          borderWidth: 2,
          fill: false,
          tension: 0.3
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: { color: textColor, font: { weight: '600' } }
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          padding: 10
        }
      },
      scales: {
        x: {
          grid: { color: gridColor },
          ticks: { color: textColor }
        },
        y: {
          grid: { color: gridColor },
          ticks: {
            color: textColor,
            callback: value => value.toFixed(4) + ' zł'
          }
        }
      }
    }
  });
}

function updateChartTheme(chart, isDark) {
  const textColor = isDark ? '#94a3b8' : '#64748b';
  const gridColor = isDark ? '#27354f' : '#e2e8f0';

  if (chart.options.scales.x) {
    chart.options.scales.x.grid.color = gridColor;
    chart.options.scales.x.ticks.color = textColor;
  }
  if (chart.options.scales.y) {
    chart.options.scales.y.grid.color = gridColor;
    chart.options.scales.y.ticks.color = textColor;
  }
  if (chart.options.plugins.legend) {
    chart.options.plugins.legend.labels.color = textColor;
  }
  chart.update();
}

/**
 * KALKULATOR PRZELICZEŃ WALUTOWYCH (Temat 27 - funkcja zalecana)
 */
function initCurrencyCalculator(allRecords) {
  const calcAmount = document.querySelector('#calc-amount');
  const calcCurrency = document.querySelector('#calc-currency');
  const calcRateType = document.querySelector('#calc-rate-type'); // mid, buy, sell
  const calcDirection = document.querySelector('#calc-direction'); // PLN_TO_CURR, CURR_TO_PLN
  const swapBtn = document.querySelector('#calc-swap-direction-btn');
  const resultDisplay = document.querySelector('#calc-result-value');
  const rateInfoDisplay = document.querySelector('#calc-rate-info');

  if (!calcAmount || !calcCurrency || !resultDisplay) return;

  function recalculate() {
    const amount = parseFloat(calcAmount.value) || 0;
    const currency = calcCurrency.value;
    const rateType = calcRateType ? calcRateType.value : 'mid';
    const direction = calcDirection ? calcDirection.value : 'PLN_TO_CURR';

    // Znajdź najnowszy rekord dla wybranej waluty
    const sorted = [...allRecords]
      .filter(r => r.currency === currency)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    const latest = sorted[0];
    if (!latest) {
      resultDisplay.textContent = 'Brak danych';
      return;
    }

    let rate = latest.midRate;
    let rateLabel = 'kurs średni NBP';
    if (rateType === 'buy') {
      rate = latest.buyRate;
      rateLabel = 'kurs kupna kantoru';
    } else if (rateType === 'sell') {
      rate = latest.sellRate;
      rateLabel = 'kurs sprzedaży kantoru';
    }

    let calculated = 0;
    if (direction === 'PLN_TO_CURR') {
      calculated = amount / rate;
      resultDisplay.textContent = `${calculated.toFixed(2)} ${latest.symbol || currency}`;
      if (rateInfoDisplay) {
        rateInfoDisplay.textContent = `1 ${currency} = ${rate.toFixed(4)} PLN (${rateLabel} z dnia ${latest.date})`;
      }
    } else {
      calculated = amount * rate;
      resultDisplay.textContent = `${calculated.toFixed(2)} PLN`;
      if (rateInfoDisplay) {
        rateInfoDisplay.textContent = `1 ${currency} = ${rate.toFixed(4)} PLN (${rateLabel} z dnia ${latest.date})`;
      }
    }
  }

  // Zdarzenia
  calcAmount.addEventListener('input', recalculate);
  calcCurrency.addEventListener('change', recalculate);
  if (calcRateType) calcRateType.addEventListener('change', recalculate);
  if (calcDirection) calcDirection.addEventListener('change', recalculate);

  if (swapBtn && calcDirection) {
    swapBtn.addEventListener('click', () => {
      calcDirection.value = calcDirection.value === 'PLN_TO_CURR' ? 'CURR_TO_PLN' : 'PLN_TO_CURR';
      recalculate();
    });
  }

  // Pierwsze przeliczenie
  recalculate();
}

/* ==========================================================================
   MODUŁ 5: FORMULARZ REJESTRACJI NOWEGO NOTOWANIA (WALIDACJA JS + DOM)
   ========================================================================== */
function initSubmissionFormPage() {
  const form = document.querySelector('#exchange-submission-form');
  const alertContainer = document.querySelector('#form-feedback-container');
  const successSummary = document.querySelector('#form-summary-card');
  const dateInput = document.querySelector('#record-date');
  const currencySelect = document.querySelector('#record-currency');
  const currencyNameInput = document.querySelector('#record-currency-name');

  if (!form) return;

  // Ustawienie dzisiejszej daty jako domyślnej i maksymalnej
  const todayStr = new Date().toISOString().slice(0, 10);
  if (dateInput) {
    dateInput.max = todayStr;
    if (!dateInput.value) dateInput.value = todayStr;
  }

  // Automatyczne uzupełnianie pełnej nazwy waluty przy zmianie select
  const currencyMap = {
    'EUR': 'Euro',
    'USD': 'Dolar amerykański',
    'GBP': 'Funt szterling',
    'CHF': 'Frank szwajcarski'
  };

  if (currencySelect && currencyNameInput) {
    currencySelect.addEventListener('change', () => {
      currencyNameInput.value = currencyMap[currencySelect.value] || '';
    });
  }

  // Obsługa zdarzenia 'submit' z pełną walidacją HTML5 oraz JavaScript (min. 2 reguły JS)
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    clearAlerts();

    const dateVal = document.querySelector('#record-date').value;
    const currencyVal = document.querySelector('#record-currency').value;
    const currencyNameVal = document.querySelector('#record-currency-name').value;
    const midRateVal = parseFloat(document.querySelector('#record-mid-rate').value);
    const buyRateVal = parseFloat(document.querySelector('#record-buy-rate').value);
    const sellRateVal = parseFloat(document.querySelector('#record-sell-rate').value);
    const sourceVal = document.querySelector('input[name="record-source"]:checked')?.value || 'NBP';
    const analystEmailVal = document.querySelector('#record-analyst-email').value.trim();
    const verifiedCheckbox = document.querySelector('#record-verified');
    const notesVal = document.querySelector('#record-notes').value.trim();

    // -------------------------------------------------------------
    // WALIDACJA JAVASCRIPT (spełnienie wymogów pkt 4.4 i 5):
    // -------------------------------------------------------------
    const errors = [];

    // Warunek 1: Kurs sprzedaży musi być większy od kursu kupna (spread dodatni)
    if (sellRateVal <= buyRateVal) {
      errors.push("Błąd spójności rynkowej: Kurs sprzedaży kantoru musi być wyższy niż kurs kupna (spread musi być dodatni).");
    }

    // Warunek 2: Kurs średni musi leżeć w przedziale pomiędzy kursem kupna a sprzedaży
    if (midRateVal < buyRateVal || midRateVal > sellRateVal) {
      errors.push("Błąd kursu średniego: Kurs średni NBP musi znajdować się pomiędzy kursem kupna a kursem sprzedaży.");
    }

    // Warunek 3: Data notowania nie może być z przyszłości
    if (new Date(dateVal) > new Date(todayStr)) {
      errors.push("Błąd chronologii: Data notowania nie może być datą z przyszłości.");
    }

    // Warunek 4: Sprawdzenie zaznaczenia oświadczenia weryfikatora
    if (!verifiedCheckbox.checked) {
      errors.push("Wymagane jest zaznaczenie oświadczenia o weryfikacji wprowadzanych danych.");
    }

    // Wyświetlenie ewentualnych błędów
    if (errors.length > 0) {
      renderAlert(errors, 'danger');
      return;
    }

    // Obliczenie wskaźników nowego rekordu
    const spread = parseFloat((sellRateVal - buyRateVal).toFixed(4));
    
    // Obliczenie zmiany względem poprzedniego notowania tej waluty
    const existing = window.ExchangeDataService.getAll().filter(r => r.currency === currencyVal);
    let changePercent = 0.0;
    if (existing.length > 0) {
      const prev = existing[existing.length - 1];
      changePercent = parseFloat((((midRateVal - prev.midRate) / prev.midRate) * 100).toFixed(2));
    }

    const symbolMap = { 'EUR': '€', 'USD': '$', 'GBP': '£', 'CHF': 'CHF' };

    const newRecord = {
      date: dateVal,
      currency: currencyVal,
      currencyName: currencyNameVal,
      symbol: symbolMap[currencyVal] || currencyVal,
      midRate: midRateVal,
      buyRate: buyRateVal,
      sellRate: sellRateVal,
      spread: spread,
      changePercent: changePercent,
      source: sourceVal,
      analystEmail: analystEmailVal,
      notes: notesVal
    };

    // Zapis do magazynu danych localStorage
    window.ExchangeDataService.add(newRecord);

    // Wyświetlenie komunikatu o sukcesie i podsumowania rekordu
    renderAlert(["Notowanie zostało pomyślnie zweryfikowane i dodane do lokalnej bazy danych!"], 'success');
    renderSummaryCard(newRecord);

    // Opcjonalne wyczyszczenie formularza z zachowaniem daty
    form.reset();
    if (dateInput) dateInput.value = todayStr;
    if (currencySelect) currencySelect.value = 'EUR';
    if (currencyNameInput) currencyNameInput.value = 'Euro';
  });

  function clearAlerts() {
    if (alertContainer) alertContainer.innerHTML = '';
    if (successSummary) successSummary.style.display = 'none';
  }

  function renderAlert(messages, type) {
    if (!alertContainer) return;
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert-box alert-${type}`;
    
    let html = `<div><strong>${type === 'danger' ? 'Proszę poprawić poniższe błędy:' : 'Sukces!'}</strong><ul>`;
    messages.forEach(m => {
      html += `<li>${escapeHtml(m)}</li>`;
    });
    html += `</ul></div>`;
    
    alertDiv.innerHTML = html;
    alertContainer.appendChild(alertDiv);
    alertDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function renderSummaryCard(record) {
    if (!successSummary) return;
    successSummary.style.display = 'block';
    
    const fields = {
      '#sum-date': record.date,
      '#sum-currency': `${record.currency} (${record.currencyName})`,
      '#sum-mid': `${record.midRate.toFixed(4)} PLN`,
      '#sum-buy': `${record.buyRate.toFixed(4)} PLN`,
      '#sum-sell': `${record.sellRate.toFixed(4)} PLN`,
      '#sum-spread': `${record.spread.toFixed(4)} PLN`,
      '#sum-source': record.source,
      '#sum-notes': record.notes || 'Brak uwag'
    };

    for (const [selector, val] of Object.entries(fields)) {
      const el = successSummary.querySelector(selector);
      if (el) el.textContent = val;
    }
  }
}

/* ==========================================================================
   FUNKCJE POMOCNICZE
   ========================================================================== */
function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
