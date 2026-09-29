const urls = document.getElementById("urls");
const output = document.getElementById("output");

document.getElementById("run").onclick = run;
document.getElementById("copy").onclick = () =>
  navigator.clipboard.writeText(output.textContent);

document.getElementById("clear").onclick = () => {
  urls.value = "";
  output.textContent = "";
};

async function run() {

  const list = urls.value
    .split(/\n/)
    .map(v => v.trim())
    .filter(Boolean);

  if (!list.length) {
    output.textContent = "Нет ссылок.";
    return;
  }

  output.textContent = "Обработка...";

  const result = [];

  for (const url of list) {

    try {

      // r.jina.ai позволяет получить HTML страницы без CORS
      const proxy = "https://r.jina.ai/http://" + url.replace(/^https?:\/\//,"");

      const html = await fetch(proxy).then(r => r.text());

      const match = html.match(
        /product-detailed__info-block[^>]*data-id=["']?(\d+)["']?/i
      );

      result.push(match ? `[${match[1]}]` : "[NOT_FOUND]");

    } catch (e) {

      result.push("[ERROR]");

    }

  }

  output.textContent = result.join("\n");

}