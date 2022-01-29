/*
 * わざわざ仮想DOM使うほどじゃないけどDOM手書きが面倒なときに使うやつ
 * モダンブラウザにしか対応してないから必要に応じてトランスパイルしてから使おう
 * t.body([t.div({style: "background-color: red", onclick: () => alert("Hello, world!")})(["Open alert"])])
 */
t = (name) => (attributes) => (children) => {
  const elm = document.createElement(name);
  Object.keys(attributes).forEach((key) => {
    if (key === "className") {
      elm.setAttribute("class", attributes[key]);
    } else if (key.slice(0, 2) === "on") {
      elm.addEventListener(key.slice(2), attributes[key])
    } else {
      elm.setAttribute(key, attributes[key]);
    }
  });
  children.forEach(child => {
    if (typeof child === "string") {
      elm.appendChild(document.createTextNode(child))
    } else {
      elm.appendChild(child)
    }
  });
  return elm;
}

["h1", "h2", "h3", "h4", "h5", "h6", "p", "a", "div", "span", "input", "button"].forEach(e => t[e] = t(e))
t.text = (text) => document.createTextNode(text);
t.body = (children) => { children.forEach(child => document.body.appendChild(child)) }
