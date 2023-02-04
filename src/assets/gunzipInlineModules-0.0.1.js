var H = window.gunzipSync;
var fr = () => {
  var n;
  let r = document.querySelectorAll(
    'script[type="text/inline-module+gzip"][src]'
  );
  for (let t of r)
    try {
      let e = t.src.match(/^data:(.*?)(?:;(base64))?,(.*)$/);
      if (!e) continue;
      let [a, u, g, s] = e,
        i = Uint8Array.from(g ? atob(s) : decodeURIComponent(s), (w) =>
          w.charCodeAt(0)
        ),
        h = new TextDecoder().decode(H(i)),
        l = document.createElement("script");
      l.type = "inline-module";
      l.id = t.id;
      (l.textContent = h), (n = t.parentNode) == null || n.replaceChild(l, t);
    } catch (e) {
      console.error("Could not gunzip script", t, e);
    }
};
fr();
