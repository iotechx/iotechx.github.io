document.addEventListener('DOMContentLoaded', () => {
 const articleCatalog = [];
 const readerPage = document.getElementById('reader-page');
 const issueNav = document.getElementById('issue-nav');
 const pageStatus = document.getElementById('page-status');
 const previousButton = document.getElementById('previous-button');
 const nextButton = document.getElementById('next-button');
 const pageControls = document.querySelector('.page-controls');
 const issueRail = document.querySelector('.issue-rail');
 const readerWorkspace = document.querySelector('.reader-workspace');
 const drawerToggle = document.getElementById('mobile-drawer-toggle');
 const drawerBackdrop = document.getElementById('drawer-backdrop');
 const mobileNavigationQuery = window.matchMedia('(max-width: 680px)');
 const backToTopButton = document.getElementById('back-to-top');
 const articleCache = new Map();
 let currentArticleIndex = -1;

 document.getElementById('home-link').addEventListener('click', event => {
  event.preventDefault();
  showContents(true);
 });
 drawerToggle.addEventListener('click', () => {
  setDrawerOpen(!readerWorkspace.classList.contains('reader-workspace--drawer-open'));
 });
 drawerBackdrop.addEventListener('click', closeDrawerAndReturnFocus);
 document.addEventListener('keydown', event => {
  if (!readerWorkspace.classList.contains('reader-workspace--drawer-open')) return;
  if (event.key === 'Escape') {
   closeDrawerAndReturnFocus();
   return;
  }
  if (event.key !== 'Tab') return;
  const links = issueNav.querySelectorAll('.rail-link');
  if (!links.length) return;
  const firstLink = links[0];
  const lastLink = links[links.length - 1];
  if (event.shiftKey && (document.activeElement === firstLink || !issueRail.contains(document.activeElement))) {
   event.preventDefault();
   lastLink.focus();
  } else if (!event.shiftKey && (document.activeElement === lastLink || !issueRail.contains(document.activeElement))) {
   event.preventDefault();
   firstLink.focus();
  }
 });
 mobileNavigationQuery.addEventListener('change', () => {
  setDrawerOpen(false);
  setNavigationState();
 });
 backToTopButton.addEventListener('click', () => {
  const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
  const articleScrollArea = readerPage.querySelector('.article-scroll-content');
  if (articleScrollArea && !mobileNavigationQuery.matches) {
   articleScrollArea.scrollTo({ top: 0, behavior });
  } else {
   window.scrollTo({ top: 0, behavior });
  }
 });
 window.addEventListener('scroll', updateBackToTopVisibility, { passive: true });
 readerPage.addEventListener('scroll', updateBackToTopVisibility, { capture: true, passive: true });
 updateBackToTopVisibility();
 document.addEventListener('click', event => {
  const citationLink = event.target.closest('.citation-link');
  if (!citationLink) return;
  const reference = document.getElementById(citationLink.hash.slice(1));
  if (!reference) return;
  event.preventDefault();
  reference.scrollIntoView({ behavior: 'smooth', block: 'start' });
 });
 previousButton.addEventListener('click', () => openArticle(currentArticleIndex - 1, true));
 nextButton.addEventListener('click', () => openArticle(currentArticleIndex + 1, true));
 document.addEventListener('click', event => {
  const articleLink = event.target.closest('[data-article-index]');
  if (!articleLink) return;
  event.preventDefault();
  openArticle(Number(articleLink.dataset.articleIndex), true);
 });
 window.addEventListener('popstate', () => routeFromHash());
 loadArticleCatalog();

 function updateBackToTopVisibility() {
  const articleScrollArea = readerPage.querySelector('.article-scroll-content');
  const scrollTop = articleScrollArea && !mobileNavigationQuery.matches ? articleScrollArea.scrollTop : window.scrollY;
  backToTopButton.hidden = scrollTop <= window.innerHeight;
 }

 function setDrawerOpen(open) {
  const shouldOpen = open && currentArticleIndex >= 0 && mobileNavigationQuery.matches;
  readerWorkspace.classList.toggle('reader-workspace--drawer-open', shouldOpen);
  drawerBackdrop.hidden = !shouldOpen;
  drawerToggle.setAttribute('aria-expanded', String(shouldOpen));
  document.body.classList.toggle('drawer-open', shouldOpen);
  issueRail.inert = currentArticleIndex >= 0 && mobileNavigationQuery.matches && !shouldOpen;
  if (shouldOpen) issueNav.querySelector('.rail-link')?.focus();
 }

 function closeDrawerAndReturnFocus() {
  setDrawerOpen(false);
  if (!drawerToggle.hidden) drawerToggle.focus();
 }

 async function loadArticleCatalog() {
  try {
   const response = await fetch('articles/catalog.json');
   if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
   const entries = await response.json();
   if (!Array.isArray(entries)) throw new Error('Article catalog must be an array');
   articleCatalog.push(...entries.map((article, index) => ({
    ...article,
    number: String(index + 1).padStart(2, '0')
   })));
   renderIssueNavigation();
   routeFromHash();
  } catch (error) {
   console.error('Unable to load article catalog:', error);
   readerPage.replaceChildren(createElement('p', 'load-error', 'The article catalog could not be loaded.'));
   pageStatus.textContent = 'Catalog unavailable';
  }
 }

 function renderIssueNavigation() {
  const list = document.createElement('ol');
  list.className = 'rail-list';
  articleCatalog.forEach((article, index) => {
   const item = document.createElement('li');
   const link = document.createElement('a');
   link.className = 'rail-link';
   link.href = `#${article.id}`;
   link.dataset.articleIndex = index;
   link.innerHTML = `<span class="rail-number">${article.number}</span><span class="rail-link-copy"><span class="rail-category">${article.category} / ${article.year}</span><span class="rail-title">${article.title}</span></span>`;
   item.appendChild(link);
   list.appendChild(item);
  });
  issueNav.replaceChildren(list);
 }

 function routeFromHash() {
  const articleIndex = articleCatalog.findIndex(article => article.id === location.hash.slice(1));
  if (articleIndex < 0) {
   showContents(false);
   return;
  }
  openArticle(articleIndex, false);
 }

 function showContents(updateHistory) {
  currentArticleIndex = -1;
  if (updateHistory) history.pushState({ view: 'contents' }, '', `${location.pathname}${location.search}#contents`);
  document.title = 'IOTechX | Journal of Consciousness & Metaphysics';
  pageStatus.textContent = 'Contents';
  readerPage.setAttribute('aria-busy', 'false');
  readerPage.classList.add('paper--contents');
  readerPage.replaceChildren(renderContentsPage());
  setNavigationState();
  window.scrollTo({ top: 0, behavior: 'smooth' });
 }

 async function openArticle(articleIndex, updateHistory) {
  if (articleIndex < 0 || articleIndex >= articleCatalog.length) return;
  const article = articleCatalog[articleIndex];
  currentArticleIndex = articleIndex;
  if (updateHistory) history.pushState({ articleId: article.id }, '', `${location.pathname}${location.search}#${article.id}`);
  document.title = `${article.title} | IOTechX`;
  pageStatus.textContent = `Article ${article.number} of ${articleCatalog.length}`;
  readerPage.classList.remove('paper--contents');
  readerPage.setAttribute('aria-busy', 'true');
  readerPage.replaceChildren(createElement('p', 'loading-message', 'Loading article…'));
  setNavigationState();

  try {
   if (article.type === 'pdf') {
    readerPage.replaceChildren(renderPdfArticle(article));
    readerPage.setAttribute('aria-busy', 'false');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    readerPage.querySelector('h1')?.focus({ preventScroll: true });
    return;
   }

   let data = articleCache.get(article.id);
   if (!data) {
    const response = await fetch(article.file);
    if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
    data = await response.json();
    articleCache.set(article.id, data);
   }
   if (currentArticleIndex !== articleIndex) return;
   readerPage.replaceChildren(renderArticle(data, article));
   readerPage.setAttribute('aria-busy', 'false');
   window.scrollTo({ top: 0, behavior: 'smooth' });
   readerPage.querySelector('h1')?.focus({ preventScroll: true });
  } catch (error) {
   console.error('Unable to load article:', error);
   if (currentArticleIndex !== articleIndex) return;
   const errorPanel = createElement('section', 'load-error');
   errorPanel.append(createElement('p', 'eyebrow', 'Article unavailable'));
   errorPanel.append(createElement('h1', '', 'This article could not be opened.'));
   errorPanel.append(createElement('p', '', 'Check your connection and try loading the article again.'));
   const retryButton = createElement('button', 'action-button', 'Retry');
   retryButton.type = 'button';
   retryButton.addEventListener('click', () => openArticle(articleIndex, false));
   errorPanel.appendChild(retryButton);
   readerPage.replaceChildren(errorPanel);
   readerPage.setAttribute('aria-busy', 'false');
  }
 }

 function setNavigationState() {
  document.querySelectorAll('.rail-link').forEach((link, index) => {
   if (index === currentArticleIndex) link.setAttribute('aria-current', 'page');
   else link.removeAttribute('aria-current');
  });
  const hasArticle = currentArticleIndex >= 0;
  previousButton.disabled = !hasArticle || currentArticleIndex === 0;
  nextButton.disabled = !hasArticle || currentArticleIndex === articleCatalog.length - 1;
  pageControls.hidden = !hasArticle;
  readerWorkspace.classList.toggle('reader-workspace--article', hasArticle);
  issueRail.hidden = !hasArticle;
  drawerToggle.hidden = !hasArticle || !mobileNavigationQuery.matches;
  setDrawerOpen(false);
 }

 function renderContentsPage() {
  const content = createElement('div', 'contents-content');
  const masthead = createElement('div', 'contents-masthead');
  masthead.append(createElement('span', 'eyebrow', 'Journal of Consciousness and Metaphysics'));
  content.appendChild(masthead);

  content.appendChild(createElement('h1', 'contents-page-title', 'Contents'));
  content.appendChild(createElement('p', 'contents-deck', 'Research articles / Open access'));

  const contents = createElement('section', 'contents-listing');
  const contentsHeading = createElement('div', 'contents-heading');
  contentsHeading.append(createElement('h2', '', 'Articles'));
  contentsHeading.append(createElement('span', 'contents-count', `${articleCatalog.length} articles`));
  contents.appendChild(contentsHeading);

  const list = createElement('ol', 'contents-entries');
  articleCatalog.forEach((article, index) => {
   const item = createElement('li', 'contents-item');
   const link = createElement('a', 'contents-link');
   link.href = `#${article.id}`;
   link.dataset.articleIndex = index;
   link.append(createElement('span', 'contents-number', article.number));
   const copy = createElement('span', 'contents-copy');
   copy.append(createElement('span', 'eyebrow', `${article.category} / ${article.year}`));
   copy.append(createElement('span', 'contents-title', article.title));
   copy.append(createElement('span', 'contents-summary', article.summary));
   link.appendChild(copy);
   link.append(createElement('span', 'contents-arrow', 'Read article'));
   item.appendChild(link);
   list.appendChild(item);
  });
  contents.appendChild(list);
  content.appendChild(contents);
  content.appendChild(createElement('footer', 'paper-footer', 'IOTECHX  /  OPEN ACCESS'));
  return content;
 }

 function renderArticle(data, catalogEntry) {
  const metadata = data.metadata;
  const title = metadata.title || catalogEntry.title;
  const body = createElement('div', 'article-content');
  const header = createElement('header', 'article-header');
  const headerLine = createElement('div', 'article-kicker-row');
  headerLine.append(createElement('span', 'eyebrow', `${catalogEntry.number} / ${catalogEntry.category}`));
  headerLine.append(createElement('span', 'article-year', metadata.year || metadata.date || catalogEntry.year));
  header.appendChild(headerLine);
  const heading = createElement('h1', 'article-title', title);
  heading.tabIndex = -1;
  header.appendChild(heading);
  if (metadata.subtitle) header.appendChild(createElement('p', 'article-subtitle', metadata.subtitle));

  const authorEntries = Array.isArray(metadata.authors) ? metadata.authors : [];
  const authors = authorEntries.map(author => author.name).join(' · ');
  if (authorEntries.length) {
   header.appendChild(renderAuthorLinks(authorEntries, 'p', 'article-author'));
  }
  if (metadata.affiliation) header.appendChild(createElement('p', 'article-affiliation', metadata.affiliation));
  if (Array.isArray(metadata.fields) && metadata.fields.length) {
   const fields = createElement('ul', 'field-list');
   metadata.fields.forEach(field => {
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = field.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = field.name;
    item.appendChild(link);
    fields.appendChild(item);
   });
   header.appendChild(fields);
  }
  body.appendChild(header);
  const scrollArea = createElement('div', 'article-scroll-content');
  body.appendChild(scrollArea);

  if (metadata.abstract) {
   const abstract = createElement('section', 'abstract-section');
   abstract.appendChild(createElement('h2', 'section-label', 'Abstract'));
   const paragraph = document.createElement('p');
   appendRichText(paragraph, metadata.abstract);
   abstract.appendChild(paragraph);
   if (metadata.keywords.length) {
    abstract.appendChild(createElement('p', 'keyword-line', `Keywords: ${metadata.keywords.join(' / ')}`));
   }
   scrollArea.appendChild(abstract);
  }

  renderArticleContent(data.content, scrollArea, catalogEntry);

  const footer = createElement('footer', 'article-footer');
  footer.append(createElement('span', '', `IOTECHX / ARTICLE ${catalogEntry.number}`));
  if (authorEntries.length) footer.append(renderAuthorLinks(authorEntries, 'span', 'footer-authors'));
  else footer.append(createElement('span', '', 'Open access'));
  if (data.footer?.license) footer.append(createElement('span', '', data.footer.license));
  scrollArea.appendChild(footer);
  return body;
 }

 function renderPdfArticle(article) {
  const body = createElement('div', 'article-content pdf-article-content');
  const header = createElement('header', 'article-header');
  const headerLine = createElement('div', 'article-kicker-row');
  headerLine.append(createElement('span', 'eyebrow', `${article.number} / ${article.category}`));
  headerLine.append(createElement('span', 'article-year', article.year));
  header.appendChild(headerLine);
  const heading = createElement('h1', 'article-title', article.title);
  heading.tabIndex = -1;
  header.appendChild(heading);
  if (article.summary) header.appendChild(createElement('p', 'article-subtitle', article.summary));
  body.appendChild(header);
  const scrollArea = createElement('div', 'article-scroll-content');
  body.appendChild(scrollArea);

  const actions = createElement('div', 'pdf-actions');
  const openLink = createElement('a', 'pdf-action-link', 'Open PDF in a new tab');
  openLink.href = article.file;
  openLink.target = '_blank';
  openLink.rel = 'noopener noreferrer';
  const downloadLink = createElement('a', 'pdf-action-link', 'Download PDF');
  downloadLink.href = article.file;
  downloadLink.download = '';
  actions.append(openLink, downloadLink);
  scrollArea.appendChild(actions);

  const viewer = createElement('div', 'pdf-viewer');
  const frame = document.createElement('iframe');
  frame.className = 'pdf-viewer-frame';
  frame.src = article.file;
  frame.title = `PDF document: ${article.title}`;
  frame.loading = 'lazy';
  viewer.appendChild(frame);
  scrollArea.appendChild(viewer);

  const footer = createElement('footer', 'article-footer');
  footer.append(createElement('span', '', `IOTECHX / ARTICLE ${article.number}`));
  footer.append(createElement('span', '', 'PDF edition'));
  scrollArea.appendChild(footer);
  return body;
 }

 function renderArticleContent(blocks, body, catalogEntry) {
  blocks.forEach(block => {
   if (block.type === 'bibliography') {
    const section = createElement('section', 'article-section bibliography');
    section.appendChild(createElement('h2', 'section-heading', block.heading || 'References'));
    const list = createElement('ol', 'reference-list');
    block.entries.forEach(entry => {
     const item = createElement('li', 'reference-entry');
     item.id = `ref-${entry.id}`;
     const text = document.createElement('span');
     appendRichText(text, entry.text);
     if (entry.url) {
      const link = createElement('a', 'reference-entry-link');
      link.href = entry.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.appendChild(text);
      item.appendChild(link);
     } else {
      item.appendChild(text);
     }
     list.appendChild(item);
    });
    section.appendChild(list);
    body.appendChild(section);
    return;
   }

   if (block.type === 'section') {
    const section = createElement('section', 'article-section');
    const headingText = [block.number, block.heading].filter(Boolean).join(' ');
    if (headingText) section.appendChild(createElement('h2', 'section-heading', headingText));
    renderContentBlocks(block.content || [], section, catalogEntry);
    body.appendChild(section);
    return;
   }

   if (block.type === 'framework') {
    const section = createElement('section', 'article-section');
    section.appendChild(createElement('h2', 'section-heading', block.heading));
    block.entries.forEach(entry => {
     const frameworkEntry = createElement('section', 'framework-entry');
     frameworkEntry.appendChild(createElement('h3', '', entry.name));
     frameworkEntry.appendChild(createElement('p', 'framework-terms', `${entry.principle} / ${entry.vedanta} / ${entry.tech}`));
     frameworkEntry.appendChild(createElement('p', '', entry.desc));
     section.appendChild(frameworkEntry);
    });
    body.appendChild(section);
    return;
   }

   if (block.type === 'table') {
    renderConcordance(block, body);
   }
  });
 }

 function renderContentBlocks(blocks, container, catalogEntry) {
  blocks.forEach(block => {
   if (block.type === 'paragraph') {
    const paragraph = document.createElement('p');
    appendRichText(paragraph, block.text);
    container.appendChild(paragraph);
   } else if (block.type === 'subheader') {
    const heading = createElement('h3', 'subsection-heading');
    appendRichText(heading, block.text);
    container.appendChild(heading);
   } else if (block.type === 'definition') {
    const definition = createElement('div', 'definition-entry');
    definition.appendChild(createElement('dt', '', block.term));
    const description = document.createElement('dd');
    appendRichText(description, block.def);
    definition.appendChild(description);
    container.appendChild(definition);
   } else if (block.type === 'list') {
    const list = document.createElement('ul');
    block.items.forEach(text => {
     const item = document.createElement('li');
     appendRichText(item, text);
     list.appendChild(item);
    });
    container.appendChild(list);
   } else if (block.type === 'blockquote') {
    const quote = document.createElement('blockquote');
    appendRichText(quote, block.text);
    container.appendChild(quote);
   } else if (block.type === 'image') {
    const figure = document.createElement('figure');
    const image = document.createElement('img');
    image.src = new URL(block.fileName, new URL(catalogEntry.file, document.baseURI)).href;
    image.alt = block.alt || '';
    image.loading = 'lazy';
    figure.appendChild(image);
    if (block.caption) figure.appendChild(createElement('figcaption', '', block.caption));
    container.appendChild(figure);
   }
  });
 }

 function renderConcordance(tableData, body) {
  const section = createElement('section', 'article-section concordance-section');
  section.appendChild(createElement('h2', 'section-heading', tableData.title));
  const tableWrap = createElement('div', 'table-wrap');
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  tableData.headers.forEach(text => {
   const cell = createElement('th', '', text);
   cell.scope = 'col';
   headerRow.appendChild(cell);
  });
  thead.appendChild(headerRow);
  const tbody = document.createElement('tbody');
  tableData.rows.forEach(row => {
   const tableRow = document.createElement('tr');
   row.forEach(text => tableRow.appendChild(createElement('td', '', text)));
   tbody.appendChild(tableRow);
  });
  table.append(thead, tbody);
  tableWrap.appendChild(table);
  section.appendChild(tableWrap);
  body.appendChild(section);
 }

 function appendRichText(parent, value) {
  if (!value) return;
  const source = value.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  const parsed = new DOMParser().parseFromString(source, 'text/html');
  Array.from(parsed.body.childNodes).forEach(node => appendSafeNode(parent, node));
 }

 function appendSafeNode(parent, node) {
  if (node.nodeType === Node.TEXT_NODE) {
   appendTextWithCitations(parent, node.textContent);
   return;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return;
  const safeTags = new Set(['STRONG', 'EM', 'B', 'I', 'SUP', 'SUB', 'CODE']);
  if (!safeTags.has(node.tagName)) {
   Array.from(node.childNodes).forEach(child => appendSafeNode(parent, child));
   return;
  }
  const element = document.createElement(node.tagName.toLowerCase());
  Array.from(node.childNodes).forEach(child => appendSafeNode(element, child));
  parent.appendChild(element);
 }

 function appendTextWithCitations(parent, text) {
  text.split(/(\[\d+\])/g).forEach(part => {
   const citation = part.match(/^\[(\d+)\]$/);
   if (!citation) {
    parent.appendChild(document.createTextNode(part));
    return;
   }
   const link = createElement('a', 'citation-link', part);
   link.href = `#ref-${citation[1]}`;
   parent.appendChild(link);
  });
 }

 function createElement(tagName, className = '', text = '') {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
 }

 function renderAuthorLinks(authors, tagName, className) {
  const authorList = createElement(tagName, className);
  authors.forEach((author, index) => {
   if (index) authorList.appendChild(document.createTextNode(' · '));
   let authorUrl;
   try {
    authorUrl = new URL(author.url, document.baseURI);
   } catch { }
   if (authorUrl && ['http:', 'https:'].includes(authorUrl.protocol)) {
    const link = createElement('a', '', author.name);
    link.href = authorUrl.href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    authorList.appendChild(link);
   } else {
    authorList.appendChild(document.createTextNode(author.name));
   }
  });
  return authorList;
 }
});