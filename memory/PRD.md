# The Cat Drop — PRD

## Problema original
"crie um site pra min de afiliado da shoppe q o nome da loja e thecatdrop deixe atrativo e bote um gato preto como um personagem de vendas"

## Resumo
Site de afiliados da Shopee chamado **The Cat Drop**, com um gato preto ("O Gato do Drop") como personagem de vendas. O visitante navega por achadinhos com desconto real, cada card tem botão "Ver na Shopee" com o link de afiliado do lojista. O lojista gerencia tudo por um painel admin simples (login + CRUD de produtos).

## Personas
- **Visitante/comprador**: quer achadinhos baratos e confiáveis da Shopee, clica nos botões de afiliado.
- **Lojista (dono)**: cola seus links de afiliado Shopee e gerencia produtos pelo painel admin.

## Requisitos núcleo (fixos)
- Tema escuro obsidian + acento âmbar/laranja Shopee
- Mascote gato preto no hero com reveal animado linha a linha
- Marquee editorial lento
- Bento "Ofertas do Dia" com countdown, escolha do gato e cupom clicável
- Catálogo com busca, filtro por categoria, ordenação
- Botão de afiliado em cada produto (target _blank, rel noopener)
- Painel admin em /admin com JWT cookie auth + CRUD de produtos
- Idioma: pt-BR

## Arquitetura
- Frontend: React 19 + Tailwind + framer-motion (src/pages/Home.js, src/pages/Admin.js, componentes em src/components/)
- Backend: FastAPI (server.py) — /api/products (GET público; POST/PUT/DELETE protegidos), /api/auth/login|logout|me|refresh
- DB: MongoDB (collections: products, users, login_attempts)
- Auth: JWT httpOnly cookies (access 15min + refresh 7d), bcrypt, brute force lockout 5 tentativas/15min
- Admin seeded no startup apenas se ausente (sem reconciliação de hash)

## Implementado (02/11/2026)
- Site completo: Header, Hero cinético com mascote, Marquee, FeaturedDrops (bento), Catalog (busca/filtros/sort), MascotSection, Footer com captura de contato (toast)
- Painel admin com login, lista, criar/editar/excluir produtos, flag destaque, cupom, frase do gato
- 7 produtos seed com imagens Unsplash curadas
- Credenciais admin: admin@thecatdrop.com / catdrop2026 (teste)

## Verificado
- GET /api/products (7 itens), login, /auth/me, criar produto autenticado, 401 sem auth
- Fluxo UI admin: login → adicionar produto → aparece na lista e na home → removido após teste
- Layout em 375 / 768 / 1366 px

## Backlog
### P0
- Lojista colar links de afiliado reais da Shopee (site já pronto para receber)

### P1
- Mais produtos nas categorias Pets / Achadinhos até R$50
- Newsletter/WhatsApp real (hoje é só toast de confirmação — MOCKED)
- Troca de senha pelo próprio admin no painel

### P2
- Contador de cliques por produto (analytics simples)
- OG image / favicon customizado com a marca do gato
- Página individual de produto com SEO
