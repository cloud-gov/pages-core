/* eslint-disable import/prefer-default-export */
export const downloadCSV = async (fetchCSV, filename) => {
  const csv = await fetchCSV();
  const blob = new Blob([csv], { type: 'application/octet-stream' });
  const aElement = document.createElement('a');
  aElement.setAttribute('download', filename);
  const href = URL.createObjectURL(blob);
  aElement.href = href;
  aElement.setAttribute('target', '_blank');
  aElement.click();
  URL.revokeObjectURL(href);
};
