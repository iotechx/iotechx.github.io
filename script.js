document.addEventListener('DOMContentLoaded', () => {
    const app = document.getElementById('app');

    fetch('thesis.json')
        .then(response => {
            if (!response.ok) {
                throw new Error("HTTP error " + response.status);
            }
            return response.json();
        })
        .then(data => {
            app.innerHTML = '';
            renderThesis(data);
        })
        .catch(err => {
            console.error("Fetch Error:", err);
            app.innerHTML = `<div class="error-message">
                <strong>Error loading thesis data.</strong><br>
                <em>Note: Browsers block direct file access for security (CORS). 
                Please use a local server (e.g., Live Server in VS Code, or 'python -m http.server').</em>
            </div>`;
        });

    function renderThesis(thesisData) {
        // Styling is handled by styles.css now.

        // --- 2. RENDER HEADER ---
        const header = document.createElement('div');

        // Authors
        let authorsHtml = '';
        if (thesisData.meta.authors && Array.isArray(thesisData.meta.authors)) {
            authorsHtml = thesisData.meta.authors.map(author =>
                `<a href="${author.url}" target="_blank" rel="noopener noreferrer" class="author-link">${author.name}</a>`
            ).join(', ');
        } else if (thesisData.meta.author) {
            authorsHtml = thesisData.meta.author;
        }

        // Fields
        let fieldsHtml = '';
        if (thesisData.meta.fields && Array.isArray(thesisData.meta.fields)) {
            fieldsHtml = thesisData.meta.fields.map(field =>
                `<a href="${field.url}" target="_blank" rel="noopener noreferrer" class="field-link">${field.name}</a>`
            ).join(', ');
        } else {
            fieldsHtml = thesisData.meta.field || '';
        }

        header.innerHTML = `
            <h1 class="doc-title">${thesisData.meta.title}</h1>
            <div class="meta-data">
                <div class="meta-row meta-authors">
                    <strong>By:</strong> ${authorsHtml}
                </div>
                <div class="meta-row"><strong>Date:</strong> ${thesisData.meta.date}</div>
                <div class="meta-row"><strong>Field:</strong> ${fieldsHtml}</div>
            </div>
        `;
        app.appendChild(header);

        // --- 3. RENDER SECTIONS ---
        thesisData.content.forEach(section => {


            if (section.type === 'abstract') {
                const div = document.createElement('div');
                div.innerHTML = `<h3>${section.heading}</h3><p><strong>${parseText(section.body)}</strong></p><hr>`;
                app.appendChild(div);
            }

            else if (section.type === 'section') {
                const wrapper = document.createElement('div');
                const h2 = document.createElement('h2');
                h2.textContent = section.number ? `${section.number}. ${section.heading}` : section.heading;
                wrapper.appendChild(h2);

                section.content.forEach(item => {
                    if (item.type === 'paragraph') {
                        const p = document.createElement('p');
                        p.innerHTML = parseText(item.text);
                        wrapper.appendChild(p);
                    }
                    else if (item.type === 'subheader') {
                        const h3 = document.createElement('h3');
                        h3.textContent = item.text;
                        wrapper.appendChild(h3);
                    }
                    else if (item.type === 'definition') {
                        const div = document.createElement('div');
                        div.className = 'definition-list';
                        div.innerHTML = `<span class="def-term">${item.term}:</span> ${parseText(item.def)}`;
                        wrapper.appendChild(div);
                    }
                    else if (item.type === 'list') {
                        const ul = document.createElement('ul');
                        item.items.forEach(liText => {
                            const li = document.createElement('li');
                            li.innerHTML = parseText(liText);
                            ul.appendChild(li);
                        });
                        wrapper.appendChild(ul);
                    }
                    else if (item.type === 'blockquote') {
                        const bq = document.createElement('blockquote');
                        bq.innerHTML = parseText(item.text);
                        wrapper.appendChild(bq);
                    }
                    else if (item.type === 'image') {
                        const figure = document.createElement('figure');
                        const imgSource = item.fileName || 'missing-file-ref.png';
                        figure.innerHTML = `
                            <img src="${imgSource}" alt="${item.alt}" onerror="this.onerror=null;this.parentElement.innerHTML='<p style=color:red>[Image missing: ${imgSource}]</p>'">
                            <figcaption>${item.caption}</figcaption>
                        `;
                        wrapper.appendChild(figure);
                    }
                });
                app.appendChild(wrapper);
            }

            else if (section.type === 'bibliography') {
                const wrapper = document.createElement('div');
                wrapper.className = 'bibliography';
                const h2 = document.createElement('h2');
                h2.textContent = section.heading;
                wrapper.appendChild(h2);

                section.entries.forEach(entry => {
                    const div = document.createElement('div');
                    div.className = 'bib-entry';
                    div.id = `ref-${entry.id}`;
                    let content = `<span class="bib-id">[${entry.id}]</span> `;
                    content += `<a href="${entry.url}" target="_blank" rel="noopener noreferrer">${entry.text}</a> <span class="external-link-icon">↗</span>`;
                    div.innerHTML = content;
                    wrapper.appendChild(div);
                });
                app.appendChild(wrapper);
            }
        });
    }

    function parseText(text) {
        if (!text) return "";
        return text.replace(/\[(\d+)\]/g, '<a href="#ref-$1" class="citation-link">[$1]</a>');
    }
});