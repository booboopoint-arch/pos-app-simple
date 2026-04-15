/**
 * 起動テスト
 * アプリの初期化・DOM構造・初期値を確認する
 */
const { loadApp } = require('./helpers/loadApp');

describe('起動・初期化テスト', () => {
  let win;
  beforeAll(() => {
    ({ win } = loadApp());
  });

  test('必須DOM要素が存在する', () => {
    expect(win.document.getElementById('buttons')).not.toBeNull();
    expect(win.document.getElementById('total')).not.toBeNull();
    expect(win.document.getElementById('list')).not.toBeNull();
    expect(win.document.getElementById('money')).not.toBeNull();
    expect(win.document.getElementById('change')).not.toBeNull();
    expect(win.document.getElementById('displaying')).not.toBeNull();
    expect(win.document.getElementById('editModal')).not.toBeNull();
  });

  test('12個のメニューボタンが生成される', () => {
    const buttons = win.document.querySelectorAll('#buttons button');
    expect(buttons.length).toBe(12);
  });

  test('初期合計金額は「合計 0」', () => {
    expect(win.document.getElementById('total').textContent).toBe('合計 0');
  });

  test('初期預り金は「預り金 0」', () => {
    expect(win.document.getElementById('money').textContent).toBe('預り金 0');
  });

  test('初期お釣りは「お釣り 0」', () => {
    expect(win.document.getElementById('change').textContent).toBe('お釣り 0');
  });

  test('3ページタブが存在する', () => {
    const tabs = win.document.querySelectorAll('.pageTab');
    expect(tabs.length).toBe(3);
  });

  test('1ページ目タブがアクティブになっている', () => {
    const activeTabs = win.document.querySelectorAll('.pageTab.active');
    expect(activeTabs.length).toBe(1);
  });

  test('デフォルトメニューが読み込まれる', () => {
    expect(win.menuData).toBeDefined();
    expect(Array.isArray(win.menuData)).toBe(true);
    expect(win.menuData[0].length).toBeGreaterThan(0);
  });

  test('items・money は空の初期状態', () => {
    expect(win.items).toBeDefined();
    expect(win.money).toBeDefined();
  });

  test('デフォルト店名が設定されている', () => {
    expect(win.shopName).toBeDefined();
    expect(typeof win.shopName).toBe('string');
  });

  test('受付番号が1から始まる', () => {
    expect(win.orderNumber).toBeGreaterThanOrEqual(1);
  });

  test('electronAPI がモックされている', () => {
    expect(typeof win.electronAPI.saveCsv).toBe('function');
    expect(typeof win.electronAPI.appendCsv).toBe('function');
    expect(typeof win.electronAPI.appendJournal).toBe('function');
    expect(typeof win.electronAPI.shutdown).toBe('function');
  });
});
