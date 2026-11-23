# PasteShare

Aplicação web estática de partilha de snippets, em português, com autenticação Supabase e deploy no GitHub Pages.

## Funcionalidades

- Registo por email e palavra-passe e login.
- Recuperação de palavra-passe por email.
- Criar e listar os próprios pastes.
- Eliminar pastes.
- Linguagens comuns e destaque de sintaxe.
- Expiração opcional (a limpeza automática requer configurar o Cron no Supabase).
- Visibilidade: público, não listado e privado.
- Links diretos para pastes públicos.
- Layout responsivo com tema escuro.

## 1. Criar o projeto Supabase

1. Cria um projeto em [supabase.com](https://supabase.com/).
2. Abre **SQL Editor** e executa todo o conteúdo de `schema.sql`.
3. Vai a **Project Settings → API** e copia a Project URL e a chave `anon`/`publishable`.
4. Faz uma cópia de `config.example.js` com o nome `config.js`.
5. Preenche `url` e `anonKey` no `config.js`.

**Nunca uses `service_role` ou uma chave `secret` no frontend.** A aplicação usa a chave pública e depende das políticas RLS do SQL para proteger os dados.

## 2. Configurar autenticação

No Supabase, abre **Authentication → URL Configuration**:
- Site URL: o URL do teu GitHub Pages, por exemplo `https://dregs1.github.io/pasteshare/`.
- Redirect URLs: adiciona também `https://dregs1.github.io/pasteshare/**`.
- Em **Authentication → Providers → Email**, mantém Email ativo.
- Para desenvolvimento local, adiciona `http://localhost:8000/**` aos Redirect URLs.

Por defeito, o Supabase pode exigir confirmação de email. O utilizador recebe uma mensagem antes de poder iniciar sessão. Personaliza o template em **Authentication → Email Templates**.

## 3. Testar localmente

Não abras `index.html` diretamente como `file://`. Usa um servidor local, por exemplo:

```bash
python -m http.server 8000
```

Depois visita `http://localhost:8000`.

## 4. Publicar no GitHub Pages

1. Cria um repositório GitHub chamado `pasteshare`.
2. Envia `index.html`, `styles.css`, `app.js`, `config.js` e `README.md`.
3. Em **Settings → Pages**, escolhe **Deploy from a branch**, branch `main`, pasta `/ (root)`.
4. Guarda e espera que o GitHub publique o site.
5. Confirma que o URL publicado está incluído nas Redirect URLs do Supabase.

> O ficheiro `config.js` contém apenas a URL do projeto e a chave pública anon/publishable. Estas informações são visíveis no navegador. A segurança vem das políticas RLS e nunca da ocultação da chave pública.

## Notas importantes sobre privacidade

- **Público:** qualquer pessoa pode ler o paste.
- **Privado:** apenas o proprietário autenticado pode ler o paste.
- **Não listado:** nesta versão inicial, o registo é guardado como `unlisted`, mas a leitura pública por link ainda não está implementada. Para não expor conteúdo privado acidentalmente, o acesso público permanece bloqueado. É possível evoluir para partilha não listada com token de acesso e uma função RPC segura.
- A expiração é verificada pela interface. Para apagar fisicamente os registos expirados, configura o `pg_cron` no Supabase e agenda a instrução SQL comentada no fim de `schema.sql`.
- Esta é uma base funcional inicial. Antes de uma utilização pública alargada, considera adicionar rate limiting, CAPTCHA no registo, limites de abuso, moderação e política de privacidade.

## Estrutura

```text
pasteshare/
├── index.html
├── styles.css
├── app.js
├── config.example.js
├── schema.sql
└── README.md
```
