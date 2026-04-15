/**
 * テスト用 JSDOM ローダー
 * pos_menu.html をブラウザ環境でロードして全グローバル関数をテスト可能にする
 */
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

const HTML_PATH = path.join(__dirname, '../../pos_menu.html');

function loadApp(overrides = {}) {
  const html = fs.readFileSync(HTML_PATH, 'utf8');

  const alerts = [];
  const confirms = [];
  const writtenDocs = [];

  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    url: 'http://localhost/',
    beforeParse(window) {
      // window.open をモック（印刷・レポートウィンドウ用）
      window.open = () => {
        const doc = { chunks: [] };
        writtenDocs.push(doc);
        return {
          document: {
            write: (s) => doc.chunks.push(s),
            close: () => {}
          },
          print: () => {},
          close: () => {}
        };
      };

      // alert / confirm / print をキャプチャ
      window.alert = (msg) => {
        alerts.push(msg == null ? '' : String(msg));
        if (overrides.alert) overrides.alert(msg);
      };
      window.confirm = overrides.confirm != null
        ? overrides.confirm
        : () => true;
      window.print = () => {};

      // Electron API をモック
      window.electronAPI = Object.assign({
        saveCsv: () => Promise.resolve('/test/sales.csv'),
        appendCsv: () => Promise.resolve('/test/detail.csv'),
        appendJournal: () => Promise.resolve('/test/journal.csv'),
        selectFolder: () => Promise.resolve('/test/folder'),
        saveBackup: () => Promise.resolve(true),
        shutdown: () => {}
      }, overrides.electronAPI || {});
    }
  });

  const win = dom.window;

  // window.onload は非同期で発火する場合があるため手動で初期化
  if (typeof win.renderButtons === 'function') {
    win.renderButtons();
  }

  return { win, alerts, confirms, writtenDocs };
}

module.exports = { loadApp };
