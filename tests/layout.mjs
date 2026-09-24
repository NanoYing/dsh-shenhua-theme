// Run through the local preview server at /tests/layout.html. No host credentials
// or agent tasks are used. The fixture nests settings inside the sidebar, as
// Harness does, so hit-testing catches stacking regressions that tokens cannot.
const frame = document.querySelector('iframe');
const results = document.querySelector('#results');
let failures = 0;
function check(ok, message) {
  const row = document.createElement('li');
  row.className = ok ? 'pass' : 'fail';
  row.textContent = `${ok ? 'PASS' : 'FAIL'} ${message}`;
  results.append(row);
  if (!ok) failures++;
}
function panelOnTop(doc) {
  const panel = doc.querySelector('[role=dialog]');
  const rect = panel.getBoundingClientRect();
  return [[.1,.1],[.5,.5],[.9,.9]].every(([x,y]) =>
    panel.contains(doc.elementFromPoint(rect.x + rect.width*x, rect.y + rect.height*y)));
}
for (const [width,height] of [[1280,720],[390,844],[320,568],[900,480]]) {
  for (const mode of ['dark','light']) {
    frame.width = width;
    frame.height = height;
    await new Promise(resolve => {
      frame.onload = resolve;
      frame.src = `../preview/?mode=${mode}`;
    });
    const doc = frame.contentDocument;
    const win = frame.contentWindow;
    const label = `${width}×${height} ${mode}`;
    check(doc.documentElement.scrollWidth <= width, `${label} 无横向溢出`);
    const toggle = doc.querySelector('[data-toggle-sidebar]');
    check(toggle.getAttribute('aria-expanded') === String(width > 720), `${label} 折叠状态正确`);
    toggle.click();
    check(toggle.getAttribute('aria-expanded') === String(width <= 720), `${label} 可切换侧栏`);
    toggle.click();
    doc.querySelector('.topbar [data-open-settings]').click();
    // Inert nodes are skipped by hit-testing even when painted above a modal.
    // Allow the background to participate so this checks actual stacking.
    check(doc.querySelector('main').inert, `${label} 弹窗打开后背景不可交互`);
    doc.querySelector('main').inert = false;
    check(panelOnTop(doc), `${label} 设置弹窗三个位置均未被遮挡`);
    const rect = doc.querySelector('[role=dialog]').getBoundingClientRect();
    check(rect.x >= 0 && rect.right <= width && rect.y >= 0 && rect.bottom <= height, `${label} 设置完整位于视口内`);
    if (width === 1280 && mode === 'dark') {
      const sidebar = doc.querySelector('.sidebar');
      const main = doc.querySelector('main');
      sidebar.style.isolation = 'isolate';
      main.style.isolation = 'isolate';
      check(!panelOnTop(doc), '负向对照：旧版侧栏 isolation 可复现设置被遮挡');
      sidebar.style.removeProperty('isolation');
      main.style.removeProperty('isolation');
      check(panelOnTop(doc), '去掉 isolation 后设置恢复');
    }
    doc.dispatchEvent(new win.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
    check(doc.querySelector('.settings-overlay').hidden && !doc.querySelector('main').inert, `${label} Escape 关闭并恢复页面操作`);
    doc.querySelector('.quick-actions button').click();
    check(doc.querySelector('textarea').value.length > 0, `${label} 快捷操作可填入文本`);
    doc.querySelector('.new-session').click();
    check(doc.querySelector('textarea').value === '', `${label} 新建会话清空预览输入`);
  }
}
document.querySelector('#status').textContent = failures ? `${failures} 项失败` : `${results.children.length} 项检查全部通过`;
document.title = failures ? 'FAIL · 申花主题布局回归' : 'PASS · 申花主题布局回归';
