# Portfólio · João Marcos

Página única, bilíngue (PT/EN), publicada em https://joao-marcosom.github.io/portfolio/.
HTML, CSS e JavaScript puros, sem etapa de build. Todos os assets ficam no repositório.

## Rodar localmente

```bash
python3 -m http.server 8000
# abra http://localhost:8000/
```

O `404.html` usa caminhos absolutos (`/portfolio/...`), então só aparece estilizado no GitHub Pages.

## Onde trocar cada coisa

| O quê | Onde |
|---|---|
| URL do LinkedIn | `const LINKEDIN_URL` na primeira linha de `assets/js/main.js`. Todos os links da página e o JSON-LD usam essa constante. O `href` que está no HTML é só a versão para quem navega sem JavaScript. |
| Currículo | Substitua `assets/docs/curriculo-joao-marcos.pdf` (PT) e `assets/docs/resume-joao-marcos.pdf` (EN) mantendo os nomes. O botão baixa a versão do idioma escolhido. |
| Textos em português | Direto no `index.html`. |
| Textos em inglês | `assets/js/i18n-en.js`. Cada chave corresponde a um `data-i18n`, `data-i18n-html` ou `data-i18n-attr` do HTML. |
| Cores e fontes | Variáveis no topo de `assets/css/style.css` (claro em `:root`, escuro em `prefers-color-scheme: dark`). |
| Imagens dos projetos | `assets/img/projetos/`. Os prints já estão cortados e com dados sensíveis borrados. |

## Idioma

Português é o padrão. O botão PT/EN troca todos os textos, o título e a descrição, e lembra a escolha.
Para mandar o link já em inglês: `https://joao-marcosom.github.io/portfolio/?lang=en`.

## Publicação

O GitHub Pages publica a branch `master`, na raiz. A versão antiga está na branch `backup-portfolio-antigo`.
