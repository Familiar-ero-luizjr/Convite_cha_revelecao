(() => {
  const loginPanel = document.getElementById("loginPanel");
  const dashboard = document.getElementById("dashboard");
  const form = document.getElementById("loginForm");
  const input = document.getElementById("adminPassword");
  const status = document.getElementById("loginStatus");
  const logout = document.getElementById("logout");

  function showDashboard() {
    loginPanel.hidden = true;
    dashboard.hidden = false;
    const target = new URLSearchParams(location.search).get("return");
    if (target && /^[a-z0-9_.?=&%-]+$/i.test(target)) location.replace(target);
  }

  if (window.InviteAdminAuth.isAuthorized()) showDashboard();

  form.addEventListener("submit", async event => {
    event.preventDefault();
    const submit = form.querySelector("button[type=submit]");
    submit.disabled = true;
    submit.textContent = "Validando…";
    status.textContent = "";
    try {
      await window.InviteAdminAuth.login(input.value);
      input.value = "";
      showDashboard();
    } catch (error) {
      status.textContent = error.message || "Não foi possível entrar.";
    } finally {
      submit.disabled = false;
      submit.textContent = "Entrar";
    }
  });

  logout.addEventListener("click", () => {
    window.InviteAdminAuth.clear();
    dashboard.hidden = true;
    loginPanel.hidden = false;
    input.focus();
  });
})();
