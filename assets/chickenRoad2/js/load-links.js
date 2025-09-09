// Функция для загрузки и применения ссылок
async function loadLinks() {
  try {
    const response = await fetch("./links.json");

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const linksData = await response.json();
    applyLinks(linksData);
  } catch (error) {
    console.error("Error loading links configuration:", error);
    // Можно добавить fallback ссылки здесь
    applyFallbackLinks();
  }
}

// Применяем ссылки из конфига
function applyLinks(linksData) {
  // Обрабатываем все элементы с data-link атрибутом
  const linkElements = document.querySelectorAll("[data-link]");

  linkElements.forEach((element) => {
    const linkKey = element.getAttribute("data-link");
    const link = getNestedValue(linksData, linkKey);

    if (link && typeof link === "string") {
      element.href = link;
    } else {
      console.warn(`Link not found for key: ${linkKey}`);
      element.href = "#"; // Fallback
    }
  });
}

// Вспомогательная функция для получения вложенных значений
function getNestedValue(obj, key) {
  return key.split(".").reduce((current, part) => {
    return current ? current[part] : undefined;
  }, obj);
}

// Fallback на случай если JSON не загрузится
function applyFallbackLinks() {
  const fallbackLinks = {
    winButton: "https://default-link.com/fallback",
  };

  applyLinks(fallbackLinks);
}

// Загружаем ссылки когда DOM готов
document.addEventListener("DOMContentLoaded", loadLinks);
