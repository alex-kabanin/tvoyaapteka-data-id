const urlsInput = document.getElementById("urls");
const output = document.getElementById("output");
const status = document.getElementById("status");
const debugOutput = document.getElementById("debug");

const runButton = document.getElementById("run");
const copyButton = document.getElementById("copy");
const clearButton = document.getElementById("clear");

const PROXY = "https://api.allorigins.win/raw?url=";


function log(...args) {
  console.log(...args);

  debugOutput.textContent +=
    args.map(String).join(" ") + "\n";
}


async function getDataId(url) {

  log("URL:", url);

  const proxyUrl =
    PROXY + encodeURIComponent(url);

  log("Запрашиваем:", proxyUrl);

  const response = await fetch(proxyUrl);

  log("HTTP:", response.status);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const html = await response.text();

  log("HTML:", html.length, "символов");

  // Парсим полученный HTML
  const parser = new DOMParser();

  const doc = parser.parseFromString(
    html,
    "text/html"
  );

  // Ищем нужный элемент
  const element = doc.querySelector(
    ".product-detailed__info-block"
  );

  console.log("НАЙДЕННЫЙ ELEMENT:", element);

  if (!element) {

    log("❌ .product-detailed__info-block НЕ НАЙДЕН");

    // Для диагностики
    const all = doc.querySelectorAll("[data-id]");

    log("Всего [data-id]:", all.length);

    all.forEach(el => {
      console.log(
        "data-id element:",
        el
      );
    });

    return null;
  }

  const dataId =
    element.getAttribute("data-id");

  log("✅ DATA-ID:", dataId);

  return dataId;
}


async function run() {

  output.textContent = "";
  debugOutput.textContent = "";

  const urls = urlsInput.value
    .split(/\r?\n/)
    .map(x => x.trim())
    .filter(Boolean);

  if (!urls.length) {
    status.textContent = "Нет URL";
    return;
  }

  runButton.disabled = true;

  const results = [];

  for (let i = 0; i < urls.length; i++) {

    status.textContent =
      `Обработка ${i + 1} / ${urls.length}`;

    try {

      const id = await getDataId(urls[i]);

      if (id) {
        results.push(`[${id}]`);
      } else {
        results.push("[NOT_FOUND]");
      }

    } catch (error) {

      console.error(error);

      log("❌ ERROR:", error.message);

      results.push("[ERROR]");
    }

    // Показываем результат сразу
    output.textContent =
      results.join("\n");
  }

  status.textContent =
    `Готово: ${urls.length} URL`;

  runButton.disabled = false;
}


copyButton.onclick = async () => {

  await navigator.clipboard.writeText(
    output.textContent
  );

  status.textContent = "Скопировано!";
};


clearButton.onclick = () => {

  urlsInput.value = "";
  output.textContent = "";
  debugOutput.textContent = "";
  status.textContent = "";
};


runButton.onclick = run;