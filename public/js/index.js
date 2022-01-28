document.getElementById("shorten_form").addEventListener("submit", (ev) => {
  (async () => {
    const request = await fetch("/url", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams(Array.from(ev.target.elements).map(elm => [elm.name, elm.value]))
    });
    if (!request.ok) {
      alert("URL作成に失敗しました…ごめんなさい…");
      return;
    }
    const url = await request.text();
    
    document.getElementById("url").value = url;
  
    return false;
  })()

  ev.preventDefault();
  return false;
});

document.getElementById("copy").addEventListener("click", () => {
  const url = document.getElementById("url").value;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url);
  }
})
