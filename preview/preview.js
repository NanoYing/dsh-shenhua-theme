// Minimal renderer for the theme's stateless brand components. Preview loads
// the real browser bundle, so tokens, imagery and overrides cannot drift.
const modeButton = document.querySelector('[data-toggle-mode]');
let tokens = {};
let mode = new URLSearchParams(location.search).get('mode') === 'light' ? 'light' : 'dark';
function setMode() {
  document.body.dataset.mode = mode;
  document.body.toggleAttribute('data-ds-dark-theme', mode === 'dark');
  for (const [name, values] of Object.entries(tokens)) document.body.style.setProperty(name, values[mode]);
  const appearance = document.querySelector('#appearance');
  if (appearance) appearance.value = mode;
  modeButton.textContent = mode === 'dark' ? '浅色模式' : '深色模式';
}
function render(element) {
  if (element == null || element === false) return document.createTextNode('');
  if (typeof element !== 'object') return document.createTextNode(String(element));
  if (typeof element.type === 'function') return render(element.type(element.props));
  const node = document.createElement(element.type);
  for (const [key, value] of Object.entries(element.props || {})) {
    if (key === 'children') {
      for (const child of [value].flat()) node.append(render(child));
    } else if (key === 'className') node.className = value;
    else if (key === 'style') {
      for (const [name, val] of Object.entries(value)) {
        if (name.startsWith('--')) node.style.setProperty(name, val);
        else node.style[name] = typeof val === 'number' ? `${val}px` : val;
      }
    } else node.setAttribute(key, value);
  }
  return node;
}
window.__ModuleLoader__ = {
  load(definition) {
    const jsx = (type, props) => ({type, props});
    const plugin = definition.factory(id => {
      if (id === 'react/jsx-runtime') return {jsx, jsxs: jsx};
      throw new Error(`Unexpected preview dependency: ${id}`);
    });
    plugin.apply({
      effect: thunk => thunk(),
      theme: {overrideTokens(_source, palette) {tokens = palette; setMode(); return () => {}; }},
      slots: {
        inject: (_name, factory) => factory(),
        register({name}, Component) {
          for (const seat of document.querySelectorAll(`[data-slot="${name}"]`)) {
            seat.replaceChildren(render(Component({size: name.includes('hero') ? 58 : 30})));
          }
        },
      },
    });
  },
};
setMode();
modeButton.addEventListener('click', () => {mode = mode === 'dark' ? 'light' : 'dark'; setMode();});
const shell = document.querySelector('.app-shell');
const sidebar = document.querySelector('.sidebar');
const sidebarToggle = document.querySelector('[data-toggle-sidebar]');
function setCollapsed(collapsed) {
  shell.classList.toggle('rail', collapsed);
  sidebar.classList.toggle('preview_collapsed', collapsed);
  sidebarToggle.setAttribute('aria-expanded', String(!collapsed));
}
const narrowScreen = matchMedia('(max-width: 720px)');
setCollapsed(narrowScreen.matches);
narrowScreen.addEventListener('change', event => setCollapsed(event.matches));
sidebarToggle.addEventListener('click', () => setCollapsed(!shell.classList.contains('rail')));
const overlay = document.querySelector('.settings-overlay');
let previousFocus;
function closeSettings() {
  overlay.hidden = true;
  document.querySelector('main').inert = false;
  for (const child of sidebar.children) if (child !== overlay) child.inert = false;
  previousFocus?.focus();
}
for (const button of document.querySelectorAll('[data-open-settings]')) button.addEventListener('click', () => {
  previousFocus = document.activeElement;
  overlay.hidden = false;
  document.querySelector('main').inert = true;
  for (const child of sidebar.children) if (child !== overlay) child.inert = true;
  overlay.querySelector('button').focus();
});
for (const button of document.querySelectorAll('[data-close-settings]')) button.addEventListener('click', closeSettings);
document.addEventListener('keydown', event => {
  if (overlay.hidden) return;
  if (event.key === 'Escape') closeSettings();
  if (event.key === 'Tab') {
    const controls = [...overlay.querySelectorAll('button, select')];
    const next = (controls.indexOf(document.activeElement) + (event.shiftKey ? -1 : 1) + controls.length) % controls.length;
    event.preventDefault();
    controls[next].focus();
  }
});
document.querySelector('#appearance').addEventListener('change', event => {mode = event.target.value; setMode();});
for (const button of document.querySelectorAll('.quick-actions button')) button.addEventListener('click', () => {
  const textarea = document.querySelector('textarea');
  textarea.value = `${button.textContent}：`;
  textarea.focus();
});
document.querySelector('.new-session').addEventListener('click', () => {
  document.querySelector('textarea').value = '';
  document.querySelector('textarea').focus();
  for (const item of document.querySelectorAll('.session')) {
    item.classList.remove('active');
    item.setAttribute('aria-selected', 'false');
  }
});
for (const session of document.querySelectorAll('.session')) session.addEventListener('click', event => {
  event.preventDefault();
  for (const item of document.querySelectorAll('.session')) {
    item.classList.toggle('active', item === session);
    item.setAttribute('aria-selected', String(item === session));
  }
});
