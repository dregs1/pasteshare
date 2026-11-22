PasteShare

Aplicação web estática de partilha de snippets de código, em português,
com autenticação Supabase e publicação no GitHub Pages.

FUNCIONALIDADES - Registo por email e palavra-passe e início de
sessão. - Recuperação de palavra-passe por email. - Criar e listar os
próprios pastes. - Eliminar pastes. - Suporte para linguagens de
programação comuns e destaque de sintaxe. - Expiração opcional (a
limpeza automática requer configuração do Cron no Supabase). -
Visibilidade: público, não listado e privado. - Links diretos para
pastes públicos. - Layout responsivo com tema escuro.

1.  CRIAR O PROJETO SUPABASE

2.  Cria um projeto em https://supabase.com.

3.  Abre o SQL Editor e executa todo o conteúdo de schema.sql.

4.  Vai a Project Settings > API e copia a Project URL e a chave
    anon/publishable.

5.  Faz uma cópia de config.example.js com o nome config.js.

6.  Preenche os campos url e anonKey no ficheiro config.js.

Importante: Nunca uses service_role ou uma chave secreta no frontend. A
aplicação utiliza a chave pública e depende das políticas RLS definidas
no SQL para proteger os dados.

2.  CONFIGURAR A AUTENTICAÇÃO

No Supabase, abre Authentication > URL Configuration e configura:

Site URL: https://dregs1.github.io/pasteshare/

Redirect URLs: https://dregs1.github.io/pasteshare/**

Em Authentication > Providers > Email, mantém a opção Email ativa.

Para desenvolvimento local, adiciona também: http://localhost:8000/**

Por defeito, o Supabase pode exigir confirmação do email. Nesse caso, o
utilizador recebe uma mensagem de confirmação antes de poder iniciar
sessão.

Podes personalizar a mensagem em Authentication > Email Templates.

3.  TESTAR LOCALMENTE

Não abras o ficheiro index.html diretamente através de file://.

Utiliza um servidor local. Por exemplo:

python -m http.server 8000

Depois, abre no navegador: http://localhost:8000

4.  PUBLICAR NO GITHUB PAGES

5.  Cria ou utiliza o repositório GitHub chamado pasteshare.

6.  Confirma que o proprietário do repositório é dregs1.

7.  Envia os seguintes ficheiros:

    -   index.html
    -   styles.css
    -   app.js
    -   config.js
    -   README.md

8.  No GitHub, abre Settings > Pages.

9.  Em Build and deployment, escolhe:

    -   Source: Deploy from a branch
    -   Branch: main
    -   Folder: / (root)

10. Guarda as alterações e aguarda a publicação.

URL oficial da aplicação: https://dregs1.github.io/pasteshare/

Confirma que esta URL está incluída nas Redirect URLs do Supabase.

O ficheiro config.js contém apenas a URL do projeto e a chave pública
anon/publishable. Estas informações são visíveis no navegador. A
segurança depende das políticas RLS e nunca da ocultação da chave
pública.

5.  NOTAS IMPORTANTES SOBRE PRIVACIDADE

Público: qualquer pessoa pode ler o paste.

Privado: apenas o proprietário autenticado pode ler o paste.

Não listado: nesta versão inicial, o registo é guardado como unlisted,
mas a leitura pública através de link ainda não está implementada. Para
evitar a exposição acidental de conteúdo privado, o acesso público
permanece bloqueado.

É possível evoluir esta funcionalidade através de tokens de acesso e de
uma função RPC segura.

Expiração: é verificada pela interface. Para apagar fisicamente os
registos expirados, configura o pg_cron no Supabase e agenda a instrução
SQL comentada no final de schema.sql.

6.  SEGURANÇA E MELHORIAS FUTURAS

Esta é uma base funcional inicial. Antes de uma utilização pública
alargada, recomenda-se adicionar: - Rate limiting. - CAPTCHA no
registo. - Limites de utilização e prevenção de abuso. - Moderação de
conteúdos. - Política de privacidade. - Proteção adicional contra spam.

7.  ESTRUTURA DO PROJETO

pasteshare/ ├── index.html ├── styles.css ├── app.js ├──
config.example.js ├── config.js ├── schema.sql └── README.md

URLS DEFINITIVAS DO PASTESHARE

GitHub Pages: https://dregs1.github.io/pasteshare/

Supabase Site URL: https://dregs1.github.io/pasteshare/

Supabase Redirect URL: https://dregs1.github.io/pasteshare/**

Servidor local: http://localhost:8000

Nota: O config.js deve ser criado a partir de config.example.js e
preenchido com as credenciais públicas do teu projeto Supabase. Não
publiques chaves secretas no GitHub.
