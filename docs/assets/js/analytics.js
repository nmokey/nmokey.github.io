/** Local previews and tests must not contribute analytics traffic. */
if (['www.nmokey.com', 'nmokey.com'].includes(window.location.hostname)) {
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', 'G-NK15EEMEB2');
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=G-NK15EEMEB2';
  document.head.append(script);
}
