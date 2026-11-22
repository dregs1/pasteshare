/* PasteShare — configura SUPABASE_URL e SUPABASE_ANON_KEY em config.js */
const CONFIG = window.PASTESHARE_CONFIG || {};
const $ = (id) => document.getElementById(id);
const supabaseReady = Boolean(
  CONFIG.url && CONFIG.anonKey && window.supabase &&
  /^https:\/\/[^\s]+\.supabase\.co$/i.test(CONFIG.url) &&
  !/TEU-PROJETO|TUA_CHAVE|COLOCA_AQUI/i.test(`${CONFIG.url} ${CONFIG.anonKey}`)
);
const db = supabaseReady ? window.supabase.createClient(CONFIG.url, CONFIG.anonKey) : null;
let currentUser = null;
let authMode = "login";
let currentViewPaste = null;

document.addEventListener("DOMContentLoaded", async () => {
  $("year").textContent = new Date().getFullYear();
  bindUI();
  if (!supabaseReady) {
    setEditorMessage("Configura o Supabase: abre config.js e substitui os dois valores de exemplo pelas credenciais públicas do teu projeto.", true);
    $("paste-list").innerHTML = `<div class="empty-state"><div class="empty-icon">⚙</div><h3>Falta configurar a ligação</h3><p>Abre config.js e coloca a Project URL e a chave pública do Supabase. Depois executa schema.sql no SQL Editor do Supabase.</p></div>`;
    return;
  }
  const { data: { session }, error } = await db.auth.getSession();
  if (error) toast(error.message);
  await setSession(session);
  db.auth.onAuthStateChange((_event, session) => {
    // Evita operações Supabase demoradas dentro do callback de auth.
    setTimeout(() => setSession(session), 0);
  });
  handleDeepLink();
});

function bindUI() {
  $("nav-login").onclick = () => openAuth("login");
  $("nav-signup").onclick = () => openAuth("signup");
  $("hero-create").onclick = () => $("editor-section").scrollIntoView({behavior:"smooth"});
  $("empty-login").onclick = () => openAuth("login");
  $("logout-btn").onclick = logout;
  $("paste-form").addEventListener("submit", savePaste);
  $("refresh-btn").onclick = loadPastes;
  $("switch-auth").onclick = () => openAuth(authMode === "login" ? "signup" : "login");
  $("auth-form").addEventListener("submit", submitAuth);
  $("forgot-password").onclick = resetPassword;
  $("copy-view").onclick = () => currentViewPaste && copyText(currentViewPaste.content);
  document.querySelectorAll("[data-close]").forEach(b => b.onclick = () => closeModal(b.dataset.close));
  document.querySelectorAll(".modal-backdrop").forEach(m => m.addEventListener("click", e => { if (e.target === m) m.classList.add("hidden"); }));
  window.addEventListener("keydown", e => { if (e.key === "Escape") document.querySelectorAll(".modal-backdrop").forEach(m=>m.classList.add("hidden")); });
}

async function setSession(session) {
  currentUser = session?.user || null;
  $("nav-login").classList.toggle("hidden", !!currentUser);
  $("nav-signup").classList.toggle("hidden", !!currentUser);
  $("user-menu").classList.toggle("hidden", !currentUser);
  if (currentUser) {
    $("user-email").textContent = currentUser.email || "Utilizador";
    $("user-avatar").textContent = (currentUser.email || "U").charAt(0).toUpperCase();
    $("empty-login").classList.add("hidden");
    await loadPastes();
  } else {
    $("paste-list").innerHTML = `<div class="empty-state"><div class="empty-icon">⌘</div><h3>A tua coleção começa aqui</h3><p>Inicia sessão para veres e gerires os teus snippets.</p><button class="btn btn-outline" id="empty-login">Entrar na conta</button></div>`;
    $("empty-login").onclick = () => openAuth("login");
  }
}
function openAuth(mode) {
  authMode = mode;
  const signup = mode === "signup";
  $("auth-eyebrow").textContent = signup ? "COMEÇA A PARTILHAR" : "BEM-VINDO DE VOLTA";
  $("auth-title").textContent = signup ? "Cria a tua conta" : "Entra na tua conta";
  $("auth-copy").textContent = signup ? "Cria a tua biblioteca pessoal de snippets." : "A tua biblioteca de snippets espera por ti.";
  $("auth-submit").innerHTML = signup ? "Criar conta <span>↗</span>" : "Entrar <span>↗</span>";
  $("auth-switch").innerHTML = signup ? 'Já tens conta? <button id="switch-auth">Entrar</button>' : 'Ainda não tens conta? <button id="switch-auth">Criar conta</button>';
  $("switch-auth").onclick = () => openAuth(signup ? "login" : "signup");
  $("forgot-password").classList.toggle("hidden", signup);
  $("auth-message").textContent = "";
  $("auth-message").classList.remove("error");
  $("auth-modal").classList.remove("hidden");
}
async function submitAuth(e) {
  e.preventDefault();
  const email = $("auth-email").value.trim().toLowerCase();
  const password = $("auth-password").value;
  if (!email || !password) { showMessage("auth-message", "Preenche o email e a palavra-passe.", true); return; }
  if (authMode === "signup" && password.length < 8) { showMessage("auth-message", "A palavra-passe deve ter pelo menos 8 caracteres.", true); return; }
  const button = $("auth-submit");
  if (!db) {
    showMessage("auth-message", "Supabase ainda não configurado. Abre config.js e coloca a Project URL e a chave pública (anon/publishable) do teu projeto.", true);
    return;
  }
  button.disabled = true; button.textContent = "A processar…";
  showMessage("auth-message", "");
  try {
    if (authMode === "signup") {
      const { data, error } = await db.auth.signUp({ email, password });
      if (error) throw error;
      if (data.session) {
        // Supabase emitiu uma sessão: o utilizador fica autenticado automaticamente.
        closeModal("auth-modal");
        toast("Conta criada e sessão iniciada automaticamente.");
        await setSession(data.session);
      } else {
        showMessage("auth-message", "Conta criada! Confirma o email que enviámos. Depois poderás entrar.");
      }
    } else {
      const { error } = await db.auth.signInWithPassword({ email, password });
      if (error) throw error;
      closeModal("auth-modal"); toast("Sessão iniciada.");
    }
  } catch (err) { showMessage("auth-message", friendlyError(err), true); }
  finally { button.disabled = false; button.innerHTML = authMode === "signup" ? "Criar conta <span>↗</span>" : "Entrar <span>↗</span>"; }
}
async function resetPassword() {
  if (!db) return showMessage("auth-message", "A ligação ao Supabase não está configurada. Falta o ficheiro config.js.", true);
  const email = $("auth-email").value.trim();
  if (!email) return showMessage("auth-message", "Escreve primeiro o teu email.", true);
  const { error } = await db.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + window.location.pathname });
  showMessage("auth-message", error ? friendlyError(error) : "Enviámos um link de recuperação para o teu email.", !!error);
}
async function logout() {
  const { error } = await db.auth.signOut();
  if (error) toast(friendlyError(error)); else toast("Sessão terminada.");
}
async function savePaste(e) {
  e.preventDefault();
  if (!db) return;
  if (!currentUser) { openAuth("login"); showMessage("auth-message", "Inicia sessão para guardar os teus pastes."); return; }
  const title = $("paste-title").value.trim();
  const content = $("paste-content").value;
  if (!title || !content.trim()) return setEditorMessage("Preenche o título e o conteúdo.", true);
  const btn = $("save-paste"); btn.disabled = true; btn.textContent = "A guardar…";
  try {
    const expires = expiryDate($("paste-expiry").value);
    const { data, error } = await db.from("pastes").insert({
      user_id: currentUser.id, title, content,
      language: $("paste-language").value,
      visibility: $("paste-visibility").value,
      expires_at: expires
    }).select("id").single();
    if (error) throw error;
    $("paste-form").reset();
    setEditorMessage("Paste guardado com sucesso.");
    await loadPastes();
    const shareUrl = new URL(window.location.href); shareUrl.searchParams.set("paste", data.id);
    toast("Paste guardado. Link copiado.");
    await copyText(shareUrl.toString());
  } catch (err) { setEditorMessage(friendlyError(err), true); }
  finally { btn.disabled = false; btn.innerHTML = 'Guardar paste <span>↗</span>'; }
}
function expiryDate(value) {
  if (value === "never") return null;
  const mins = {"10m":10,"1h":60,"1d":1440,"7d":10080,"30d":43200}[value];
  return new Date(Date.now() + mins * 60000).toISOString();
}
async function loadPastes() {
  if (!db || !currentUser) return;
  $("paste-list").innerHTML = `<div class="empty-state"><p>A carregar os teus pastes…</p></div>`;
  const { data, error } = await db.from("pastes").select("id,title,language,visibility,created_at,expires_at").eq("user_id", currentUser.id).order("created_at", {ascending:false});
  if (error) { $("paste-list").innerHTML = `<div class="empty-state"><p>${escapeHTML(friendlyError(error))}</p></div>`; return; }
  const active = (data || []).filter(p => !p.expires_at || new Date(p.expires_at) > new Date());
  if (!active.length) {
    $("paste-list").innerHTML = `<div class="empty-state"><div class="empty-icon">⌘</div><h3>Ainda não tens pastes</h3><p>Cria o teu primeiro snippet no editor acima.</p></div>`;
    return;
  }
  $("paste-list").innerHTML = active.map(p => `
    <article class="paste-item">
      <div class="paste-main"><div class="paste-title">${escapeHTML(p.title)}</div><div class="paste-meta"><span>${escapeHTML(p.language)}</span><span class="tag">${visibilityLabel(p.visibility)}</span><span>${formatDate(p.created_at)}</span>${p.expires_at ? `<span>Expira ${formatDate(p.expires_at)}</span>` : ""}</div></div>
      <div class="paste-actions"><button class="icon-btn" data-action="open" data-id="${p.id}">Abrir</button><button class="icon-btn" data-action="share" data-id="${p.id}">Partilhar</button><button class="icon-btn" data-action="delete" data-id="${p.id}">Eliminar</button></div>
    </article>`).join("");
  $("paste-list").querySelectorAll("[data-action]").forEach(b => b.onclick = () => pasteAction(b.dataset.action, b.dataset.id));
}
async function pasteAction(action, id) {
  if (action === "delete") {
    if (!confirm("Queres mesmo eliminar este paste? Esta ação não pode ser desfeita.")) return;
    const { error } = await db.from("pastes").delete().eq("id", id);
    if (error) toast(friendlyError(error)); else { toast("Paste eliminado."); loadPastes(); }
    return;
  }
  if (action === "share") {
    const url = new URL(window.location.href); url.searchParams.set("paste", id);
    await copyText(url.toString()); return;
  }
  await openPaste(id);
}
async function openPaste(id) {
  const { data, error } = await db.from("pastes").select("id,user_id,title,content,language,visibility,created_at,expires_at").eq("id", id).maybeSingle();
  if (error || !data || (data.expires_at && new Date(data.expires_at) < new Date())) return toast("Paste não encontrado, expirado ou sem permissão.");
  if (data.visibility === "private" && data.user_id !== currentUser?.id) return toast("Este paste é privado.");
  currentViewPaste = data;
  $("view-title").textContent = data.title;
  $("view-meta").textContent = data.visibility === "unlisted" ? "PASTE NÃO LISTADO" : "PASTE";
  $("view-language").textContent = data.language;
  $("view-date").textContent = formatDate(data.created_at);
  const code = $("view-content"); code.textContent = data.content; code.className = data.language === "plaintext" ? "" : `language-${data.language}`;
  if (window.hljs && data.language !== "plaintext") window.hljs.highlightElement(code);
  $("view-modal").classList.remove("hidden");
}
async function handleDeepLink() {
  const id = new URLSearchParams(window.location.search).get("paste");
  if (id) await openPaste(id);
}
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); toast("Copiado para a área de transferência."); }
  catch { toast("Não foi possível copiar automaticamente. Copia o link manualmente."); }
}
function visibilityLabel(v) { return ({public:"Público",unlisted:"Não listado",private:"Privado"})[v] || v; }
function formatDate(value) { return new Date(value).toLocaleString("pt-PT",{dateStyle:"medium",timeStyle:"short"}); }
function showMessage(id, text, error=false) { const el=$(id); el.textContent=text; el.classList.toggle("error",error); }
function setEditorMessage(text,error=false) { showMessage("editor-message",text,error); }
function toast(message) { const el=$("toast"); el.textContent=message; el.classList.add("show"); clearTimeout(window.toastTimer); window.toastTimer=setTimeout(()=>el.classList.remove("show"),3200); }
function closeModal(id) { $(id).classList.add("hidden"); }
function escapeHTML(s) { return String(s ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function friendlyError(err) {
  const msg = err?.message || "Ocorreu um erro inesperado.";
  if (/Invalid login credentials/i.test(msg)) return "Email ou palavra-passe incorretos.";
  if (/Email not confirmed/i.test(msg)) return "Confirma o teu email antes de iniciar sessão.";
  if (/row-level security|permission denied/i.test(msg)) return "Sem permissão para esta operação. Confirma as políticas RLS no Supabase.";
  if (/already registered|user already exists/i.test(msg)) return "Este email já tem uma conta. Tenta entrar ou recuperar a palavra-passe.";
  if (/already registered|user already exists/i.test(msg)) return "Este email já tem conta. Tenta entrar ou recuperar a palavra-passe.";
  if (/duplicate key/i.test(msg)) return "Este registo já existe.";
  return msg;
}