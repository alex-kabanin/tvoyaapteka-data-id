const urlsInput = document.getElementById("urls");
const output = document.getElementById("output");
const debugOutput = document.getElementById("debug");
const status = document.getElementById("status");

const runButton = document.getElementById("run");
const copyButton = document.getElementById("copy");
const clearButton = document.getElementById("clear");


// --------------------------------------------------
// CORS proxy
// --------------------------------------------------

const proxies = [
  {
    name: "AllOrigins",
    makeUrl: url =>
      "https://api.allorigins.win/raw?url=" +
      encodeURIComponent(url)
  },

  {
    name: "CorsProxy",
    makeUrl: url =>
      "https://corsproxy.io/?" +
      encodeURIComponent(url)
  }
];


// --------------------------------------------------
// Debug
// --------------------------------------------------

function debug(...args) {

  console.log(...args);

  const text = args
    .map(x => {
      if (typeof x === "string") return x;

      try {
        return JSON.stringify(x, null, 2);
      } catch {
        return String(x);
      }
    })
    .join(" ");

  debugOutput.textContent += text + "\n";
}


// --------------------------------------------------
// Получение HTML
// --------------------------------------------------

async function fetchHtml(url) {

  let lastError = null;

  for (const proxy of proxies) {

    const proxyUrl = proxy.makeUrl(url);

    debug(`Пробуем ${proxy.name}`);
    debug(proxyUrl);

    try {

      const response = await fetch(proxyUrl, {
        method: "GET",
        cache: "no-store"
      });

      debug(`${proxy.name}: HTTP ${response.status}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();

      debug(`${proxy.name}: получено ${html.length} символов`);

      if (!html || html.length < 100) {
        throw new Error("HTML слишком короткий");
      }

      return {
        html,
        proxy: proxy.name
      };

    } catch (error) {

      lastError = error;

      debug(`${proxy.name}: ошибка`);
      debug(error.message);
    }
  }

  throw lastError || new Error("Не удалось получить HTML");
}


// --------------------------------------------------
// Извлечение data-id
// --------------------------------------------------

function extractDataId(html) {

  const parser = new DOMParser();

  const doc = parser.parseFromString(
    html,
    "text/html"
  );

  const element = doc.querySelector(
    ".product-detailed__info-block"
  );

  if (!element) {

    debug(
      "Элемент .product-detailed__info-block НЕ найден"
    );

    // Дополнительный поиск для диагностики
    const possibleElements =
      doc.querySelectorAll("[data-id]");

    debug(
      `Элементов с data-id вообще найдено: ${possibleElements.length}`
    );

    if (possibleElements.length > 0) {

      for (const el of possibleElements) {

        debug({
          tag: el.tagName,
          class: el.className,
          dataId: el.getAttribute("data-id")
        });

      }
    }

    return null;
  }

  const dataId =
    element.getAttribute("data-id");

  debug("Найден элемент:");
  debug(element.outerHTML.slice(0, 1000));

  debug(`data-id = ${dataId}`);

  return dataId;
}


// --------------------------------------------------
// Обработка одного URL
// --------------------------------------------------

async function processUrl(url, index, total) {

  status.textContent =
    `Обработка ${index} / ${total}`;

  debug("");
  debug("========================================");
  debug(`URL ${index}/${total}`);
  debug(url);
  debug("========================================");

  try {

    const result = await fetchHtml(url);

    debug(`Использован прокси: ${result.proxy}`);

    const dataId =
      extractDataId(result.html);

    if (!dataId) {

      debug("RESULT: NOT_FOUND");

      return "[NOT_FOUND]";
    }

    debug(`RESULT: [${dataId}]`);

    return `[${dataId}]`;

  } catch (error) {

    debug("RESULT: ERROR");
    debug(error.message);

    return "[ERROR]";
  }
}


// --------------------------------------------------
// Основная функция
// --------------------------------------------------

async function run() {

  debugOutput.textContent = "";
  output.textContent = "";

  const urls = urlsInput.value
    .split(/\r?\n/)
    .map(url => url.trim())
    .filter(Boolean);

  if (urls.length === 0) {

    status.textContent =
      "Введите хотя бы один URL.";

    return;
  }

  runButton.disabled = true;

  debug(`Всего URL: ${urls.length}`);

  const results = [];

  for (let i = 0; i < urls.length; i++) {

    const result =
      await processUrl(
        urls[i],
        i + 1,
        urls.length
      );

    results.push(result);

    // Показываем результат сразу,
    // не дожидаясь окончания всего списка
    output.textContent =
      results.join("\n");
  }

  status.textContent =
    `Готово. Обработано: ${urls.length}`;

  runButton.disabled = false;
}


// --------------------------------------------------
// Copy
// --------------------------------------------------

copyButton.onclick = async () => {

  const text = output.textContent;

  if (!text) return;

  await navigator.clipboard.writeText(text);

  status.textContent =
    "Результат скопирован.";
};


// --------------------------------------------------
// Clear
// --------------------------------------------------

clearButton.onclick = () => {

  urlsInput.value = "";
  output.textContent = "";
  debugOutput.textContent = "";
  status.textContent = "";
};


// --------------------------------------------------
// Run
// --------------------------------------------------

runButton.onclick = run;