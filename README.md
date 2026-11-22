# PasteShare — conta pessoal única

Este pacote mantém o login e a criação inicial da conta. Para ficar só para o dono, configure o Supabase uma vez e depois desative novos registos.

## 1) Ligar ao Supabase
1. Crie um projeto no https://supabase.com.
2. Em Project Settings > API (ou Data API), copie o Project URL e a chave pública Publishable/anon.
3. Edite `config.js` e preencha os dois valores. Não use `service_role` nem secret keys.
4. No SQL Editor do Supabase, execute todo o conteúdo de `schema.sql`.

## 2) Criar a sua conta
1. Publique os ficheiros no GitHub Pages.
2. Abra o site e use **Criar conta** para criar a sua conta pessoal.
3. Se a confirmação por email estiver ativa, confirme o email recebido.
4. Entre na conta e verifique que consegue guardar pastes.

## 3) Bloquear novas contas (depois de criar a sua)
No painel Supabase, abra Authentication > Settings (ou Auth > Signups) e desligue **Allow new users to sign up** / **Enable signups**. Guarde.

Depois de desligar os registos, novos visitantes não poderão criar contas; o login da conta existente continua disponível. Não apague a sua conta.

## Segurança e privacidade
- Nunca publique uma chave `service_role` ou `secret` no GitHub.
- A chave Publishable/anon é destinada a uso no cliente, mas a proteção dos dados depende das políticas RLS do `schema.sql`.
- Os pastes configurados como `public` podem ser lidos publicamente. Use `private` para conteúdo privado.
- O site no GitHub Pages é público como página; o controlo de registos é feito pelo Supabase.
