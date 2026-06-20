/**
 * Открывает скачанный Blob в новой вкладке (превью для PDF/изображений,
 * для остальных типов браузер сам предложит сохранить файл).
 * Object URL отзывается через минуту — этого достаточно, чтобы вкладка
 * успела загрузить содержимое.
 */
export function openBlobInNewTab(blob: Blob) {
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
