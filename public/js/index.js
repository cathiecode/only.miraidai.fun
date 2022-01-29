const setSubmitButtonLoading = (isLoading) => {
  const button = document.getElementById("submit")
  if (isLoading) {
    button.classList.add("loading");
    button.setAttribute("disabled", "");
  
    button.appendChild(t.div({id: "submit_loader", className: "spinner-grow spinner-grow-sm text-light ms-1", role: "status"})([
      t.span({className: "visually-hidden"})([t.text("")])
    ]));
  } else {
    button.classList.remove("loading");
    button.removeAttribute("disabled");
    button.removeChild(document.getElementById("submit_loader"));
  }
}

document.getElementById("shorten_form").addEventListener("submit", (ev) => {
  setSubmitButtonLoading(true);
  (async () => {
    const request = await fetch("/url", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams(Array.from(ev.target.elements).map(elm => [elm.name, elm.value]))
    });
    if (!request.ok) {
      alert("URL作成に失敗しました…ごめんなさい…\n(" + await request.text() + ")");
      return;
    }
    const url = await request.text();
    
    document.getElementById("url").value = url;
  })().finally(() => setSubmitButtonLoading(false))

  ev.preventDefault();
  return false;
});

document.getElementById("copy").addEventListener("click", () => {
  const url = document.getElementById("url").value;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url);
  }
});

if (Math.random() < 0.01) {
  document.getElementById("logo").src = "/assets/logo-secret.svg";
}
