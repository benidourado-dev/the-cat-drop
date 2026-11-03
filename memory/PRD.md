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
- Credenciais admin: admin@thecatdrop.com / catdrop2026 (teste)

### Update 02/11/2026 — links reais + pagamento + contato
- Catálogo substituído pelos 20 produtos reais do CSV de afiliado do usuário (links s.shopee.com.br), categorias: Fitness & Suplementos, Tech & Gadgets, Moda & Estilo, Casa & Cozinha, Ferramentas, Beleza & Cuidados
- 3 produtos em destaque (Whey+Creatina, Power Bank, Creatina 300g) com cupom GATO10
- Nova seção "Formas de Pagamento": Pix (chave oficial 152074587790 com botão copiar), Cartão de Débito, Cartão de Crédito, Boleto & ShopeePay, cada um com passo a passo
- Footer com contatos reais: benidourado@gmail.com e WhatsApp (97) 3054-829 (wa.me/55973054829)
- Novas categorias adicionadas ao select do painel admin
- Verificado: 20 produtos na API, nenhuma imagem quebrada, layout 375/1366 OK

## Verificado
- GET /api/products (7 itens), login, /auth/me, criar produto autenticado, 401 sem auth
- Fluxo UI admin: login → adicionar produto → aparece na lista e na home → removido após teste
- Layout em 375 / 768 / 1366 px

## Implementado (02/11/2026 — atualização 2)
- 20 produtos reais do CSV de afiliado do usuário (links s.shopee.com.br, comissões reais), categorizados (Fitness, Tech, Moda, Casa, Ferramentas, Beleza) com imagens Unsplash verificadas
- Seção "Formas de Pagamento": Pix (chave 152074587790 com botão copiar), Débito, Crédito, Boleto & ShopeePay, com passo a passo
- Rodapé com contatos do lojista: benidourado@gmail.com e WhatsApp (97) 3054-829 (wa.me/55973054829)
- Nav atualizada com âncora Pagamento
- Verificado: 0 imagens quebradas, catálogo e pagamento em 1366px e 375px

## Contatos do lojista (referência)
- E-mail: benidourado@gmail.com
- WhatsApp: 973054829 (wa.me/55973054829)
- Pix: 152074587790

## Implementado (02/11/2026 — atualização 3)
- Contador de cliques: POST /api/products/{id}/click (público), campo clicks no produto, badge "X pessoas viram este achadinho" nos cards, GET /api/stats/clicks (admin), painel admin com total de cliques + Top 3 mais clicados + contagem por linha de produto
- Tentativa de scraping das fotos oficiais da Shopee: BLOQUEADA (login/captcha nas APIs e páginas). Solução: placeholder do campo imagem no admin orienta a colar a URL da foto oficial (botão direito na foto na Shopee → copiar endereço da imagem)
- Verificado: clique real no card abriu a página de afiliado na Shopee e incrementou o contador; painel exibe totais e ranking

## Implementado (03/11/2026 — atualização 4)
- REMOVIDO o card de cupom relâmpago das Ofertas do Dia e o campo cupom do admin/banco (coupon=null em todos os produtos)
- REMOVIDAS as fotos dos produtos: cards do catálogo e Ofertas do Dia agora são só texto (nome, categoria, preço, desconto, frase do gato, botão Shopee)
- Admin sem campo de imagem e sem campo cupom; image_url preenchida com fallback interno (não exibida)
- Verificado: 0 imagens em drops+catálogo, sem card de cupom, form admin limpo, layout 375/1366 OK

## Implementado (03/11/2026 — atualização 5)
- Emergent managed Google Sign-In: botão "Entrar com Google" na tela de login do /admin, fluxo auth.emergentagent.com → #session_id → AuthCallback (useLocation().hash) → POST /api/auth/google
- Backend: user_id custom (uuid), _id excluído, sessões em db.user_sessions (7 dias), cookie httpOnly session_token; get_current_user aceita session_token OU JWT legado
- Role: admin se e-mail Google == ADMIN_EMAIL, senão viewer
- Login por senha continua funcionando em paralelo
- Verificado: JWT login/me OK, sessão Google simulada retorna user, botão renderiza, logout limpa sessão

## Implementado (03/11/2026 — atualização 6)
- GitHub Pages: criada pasta /app/docs com build estático (PUBLIC_URL=/the-cat-drop, .nojekyll). Os 20 produtos reais estão embutidos em frontend/src/data/productsFallback.js e são usados quando a API falha (GitHub Pages não tem backend)
- App.js: HashRouter quando PUBLIC_URL existe (build Pages), BrowserRouter no Emergent
- No GitHub Pages a loja abre completa e idêntica (hero, drops, catálogo, pagamento, contatos) com links de afiliado funcionando; painel admin e contador de cliques NÃO funcionam lá (sem backend)
- Para publicar: Save to GitHub → repo Settings → Pages → Source: main branch /docs folder
- Verificado: build servido localmente em /the-cat-drop/ renderiza 20 cards, links s.shopee.com.br, Pix; preview Emergent intacto com 20 produtos da API
- 03/11/2026 13:15 — CONFIRMADO AO VIVO em https://benidourado-dev.github.io/the-cat-drop/: 20 cards, links de afiliado s.shopee.com.br, Pix 152074587790. O primeiro acesso falhou porque o deploy do GitHub Pages ainda estava propagando (JS 404 → 200 após alguns minutos)

## Backlog
### P0
- Deploy: os dados do preview (20 produtos reais) serão copiados no primeiro deploy; edições posteriores no preview ficam só no preview
- GitHub Pages NÃO funciona para este app: precisa de backend FastAPI + MongoDB. Se o usuário insistir em GitHub Pages, seria necessário gerar build estático com homepage "/the-cat-drop/" e backend externo — mas produtos/admin/cliques não funcionariam sem backend

### P1
- Newsletter/WhatsApp real (hoje o rodapé tem links de contato direto)
- Troca de senha pelo próprio admin no painel

### P2
- Contador de cliques por produto (analytics simples)
- OG image / favicon customizado com a marca do gato
- Página individual de produto com SEO
