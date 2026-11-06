/**
 * Prints one element on its own (Print and "Save as PDF"). The element is copied into #print-root, a direct child of
 * <body>, and print CSS hides every other body child with display:none, so the page layout (sidebar, cards, transforms,
 * blur) cannot shift, clip or blank the document. [title] becomes the suggested PDF file name.
 */
export function printElement(el: Element, title?: string) {
  document.getElementById('print-root')?.remove();
  const root = document.createElement('div');
  root.id = 'print-root';
  root.appendChild(el.cloneNode(true));
  document.body.appendChild(root);
  document.documentElement.classList.add('printing');
  const prevTitle = document.title;
  if (title) document.title = title;
  const done = () => {
    document.documentElement.classList.remove('printing');
    root.remove();
    document.title = prevTitle;
    window.removeEventListener('afterprint', done);
  };
  window.addEventListener('afterprint', done);
  window.print();
}
