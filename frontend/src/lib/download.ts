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

/**
 * Скачивает Blob как файл с заданным именем (используется для .docx и
 * других форматов, которые браузер не умеет превью, в отличие от PDF).
 */
export function downloadBlobAsFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
