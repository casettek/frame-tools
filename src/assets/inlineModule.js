const loaderMap = window["inline-module-loaders"],
  currentScript = document.currentScript || document.querySelector("script"),
  map = { imports: {}, scopes: {} },
  installed = new Set();
function toBase64(t) {
  return btoa(unescape(encodeURIComponent(t)));
}
function loadContent(t) {
  const e = new XMLHttpRequest();
  if ((e.open("GET", t, !1), e.send(null), 200 === e.status))
    return e.responseText;
  throw new Error(e.statusText);
}
function replaceImport(t, e) {
  return t.replace(
    /^(\s*import\s+[\s\S]*?from\s*['"`])([\s\S]*?)(['"`])/gim,
    (t, n, r, o) => {
      const s = e[r];
      return s ? `${n}${s}${o}` : `${n}${r}${o}`;
    }
  );
}
function getBlobURL(t, e = !1, n = {}) {
  let r = t.textContent;
  if (t.hasAttribute("src")) {
    (r = loadContent(t.getAttribute("src"))), (t.textContent = r);
  }
  e && (r = replaceImport(r, n));
  let o = t.getAttribute("loader");
  return (
    o &&
      ((o = o.split(/\s*>\s*/)),
      (r = o.reduce((e, r) => {
        const { transform: o, imports: s } = loaderMap[r],
          { code: i, map: c } = o(e, {
            sourceMap: !0,
            filename: t.getAttribute("name") || t.id || "anonymous",
          });
        return (
          (e = c
            ? `${i}\n\n//# sourceMappingURL=data:application/json;base64,${toBase64(
                JSON.stringify(c)
              )}`
            : i),
          Object.assign(n.imports, s),
          e
        );
      }, r))),
    createBlob(r, "text/javascript")
  );
}
function createBlob(t, e = "text/plain") {
  const n = new Blob([t], { type: e });
  return URL.createObjectURL(n);
}
function setup() {
  const t = document.querySelectorAll('script[type="inline-module"]'),
    e = {},
    n = [],
    r = document.querySelector('script[type="importmap"]');
  r &&
    console.warn(
      'Cannot update importmap after  <script type="importmap"> is set. Please use <script type="inline-module-importmap"> instead.'
    ),
    [...t].forEach((t) => {
      const { id: o } = t,
        s = t.getAttribute("name"),
        i = getBlobURL(t, !!r, e);
      o && ((e[`#${o}`] = i), (e[`//#${o}`] = i)),
        s && ((e[s] = i), (e[`//${s}`] = i)),
        n.push(i);
    });
  const o = document.querySelector('script[type="inline-module-importmap"]');
  if (o) {
    const t = JSON.parse(o.textContent);
    Object.assign(map.imports, t.imports), Object.assign(map.scopes, t.scopes);
  }
  if ((Object.assign(map.imports, e), !r)) {
    const t = document.createElement("script");
    t.setAttribute("type", "importmap"),
      (t.textContent = JSON.stringify(map)),
      currentScript.after(t);
  }
  n.forEach((t) => {
    if (!installed.has(t)) {
      const e = document.createElement("script");
      (e.async = !1),
        e.setAttribute("type", "module"),
        e.setAttribute("src", t),
        currentScript.after(e),
        installed.add(t);
    }
  });
}
"false" !== currentScript.getAttribute("setup") && setup(),
  (window.inlineImport = async (t) => {
    const { imports: e } = map;
    let n = null;
    if (t in e) n = e[t];
    else {
      let r;
      /^#/.test(t) &&
        (r = document.querySelector(`script[type="inline-module"]${t}`)),
        r ||
          (r = document.querySelector(
            `script[type="inline-module"][name="${t}"]`
          )),
        r && ((n = getBlobURL(r)), (e[t] = n));
    }
    if (n) {
      return await import(n);
    }
    return null;
  });
