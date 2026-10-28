document.addEventListener('DOMContentLoaded', async () => {
 const apavadaToggle = document.getElementById('apavada-toggle');
 apavadaToggle.addEventListener('change', () => {
  document.body.classList.toggle('apavada-active', apavadaToggle.checked);
 });

 try {
  const response = await fetch('thesis-data-reference.json');
  if (!response.ok) {
   throw new Error(`HTTP error ${response.status}`);
  }
  renderThesis(await response.json());
 } catch (error) {
  console.error('Failed to load thesis data:', error);
  const message = document.createElement('p');
  message.className = 'error-message';
  message.textContent = 'Unable to load the manuscript. Open this page through a local web server and confirm thesis-data-reference.json is available.';
  document.querySelector('.a4-container').prepend(message);
 }

 function renderThesis(data) {
  document.title = data.metadata.title;
  setText('journal-name', data.metadata.journal || 'Academic Monograph');
  setText('article-type', data.metadata.articleType || 'Research Article');
  setText('meta-title', data.metadata.title);
  setText('meta-author', data.metadata.author);
  setText('meta-affiliation', data.metadata.affiliation || '');
  setText('meta-abstract', data.metadata.abstract || '');
  setText('meta-keywords', (data.metadata.keywords || []).join(' • '));
  setText('toolbar-system-tag', data.toolbar.systemTag || '');
  setText('toolbar-label-left', data.toolbar.aadhyaropaLabel || 'Aadhyāropa');
  setText('toolbar-label-right', data.toolbar.apavadaLabel || 'Apavāda');
  setText('footer-copyright', `© ${data.footer.year} ${data.footer.author}`);
  setText('footer-license', data.footer.license || '');

  const triadContainer = document.getElementById('triad-container');
  data.triadNodes.forEach(node => {
   const card = document.createElement('article');
   card.className = 'triad-card scaffold-hide';

   const heading = document.createElement('h3');
   heading.textContent = node.name;
   const subtitle = document.createElement('span');
   subtitle.className = 'sub';
   subtitle.textContent = `${node.principle} | ${node.vedanta} | ${node.tech}`;
   const description = document.createElement('p');
   description.textContent = node.desc;

   card.append(heading, subtitle, description);
   triadContainer.appendChild(card);
  });

  if (data.concordanceTable) {
   renderConcordance(data.concordanceTable);
  }

  const chapterContainer = document.getElementById('chapter-container');
  data.chapters.forEach((chapter, index) => {
   const article = document.createElement('article');
   article.className = `chapter${index > 3 ? ' scaffold-hide' : ''}`;

   const heading = document.createElement('h2');
   heading.textContent = `${chapter.number}. ${chapter.title}`;
   article.appendChild(heading);

   chapter.content.split(/\n\s*\n/).filter(Boolean).forEach(text => {
    const paragraph = document.createElement('p');
    paragraph.textContent = text;
    article.appendChild(paragraph);
   });

   chapterContainer.appendChild(article);
  });
 }

 function renderConcordance(tableData) {
  const section = document.getElementById('concordance-container');
  const heading = document.createElement('h2');
  heading.textContent = tableData.title;

  const table = document.createElement('table');
  table.className = 'concordance-table';
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  tableData.headers.forEach(text => {
   const cell = document.createElement('th');
   cell.scope = 'col';
   cell.textContent = text;
   headerRow.appendChild(cell);
  });
  thead.appendChild(headerRow);

  const tbody = document.createElement('tbody');
  tableData.rows.forEach(row => {
   const tableRow = document.createElement('tr');
   row.forEach(text => {
    const cell = document.createElement('td');
    cell.textContent = text;
    tableRow.appendChild(cell);
   });
   tbody.appendChild(tableRow);
  });

  table.append(thead, tbody);
  section.append(heading, table);
 }

 function setText(id, value) {
  document.getElementById(id).textContent = value || '';
 }
});