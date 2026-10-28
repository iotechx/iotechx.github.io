# IOTechX

Static A4 journal reader for independent research articles.

## Article files

Each publication has its own directory under `articles/`:

- `articles/eternal-now/` contains the thesis JSON and its figures in `images/`.
- `articles/architecture-unnamable/` contains the article data and reference PDF.
- `articles/cosmic-arc-of-symbols/` contains the related essay PDF.
- `articles/illusion-of-separation/` contains the essay PDF.

The article list is generated from `articles/catalog.json`. Add each PDF or JSON manuscript there, using paths relative to the repository root, and keep the source document, images, and other related files together in the article's folder. PDF entries are displayed in the reader with open and download links.

All active JSON theses use the same top-level structure: `metadata`, `content`, and `footer`. Metadata contains the article details and abstract; content is an ordered list of typed blocks such as sections, figures, tables, frameworks, and bibliography entries.