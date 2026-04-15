/**
 * タイムカードテスト
 * 出退勤打刻・勤務時間計算・給与計算・スタッフ管理・打刻修正
 */
const { loadApp } = require('./helpers/loadApp');

describe('出退勤打刻', () => {
  let win, alerts;

  beforeEach(() => {
    ({ win, alerts } = loadApp());
    win.__setState({ staffList: ['田中', '山田'], tcRecords: [], selectedStaff: '田中' });
  });

  test('出勤打刻が記録される', () => {
    win.punchIn();
    const rec = win.__getState().tcRecords.find(r => r.staff === '田中' && r.type === '出勤');
    expect(rec).toBeDefined();
    expect(rec.date).toBe(win.getToday());
    expect(rec.time).toMatch(/^\d{2}:\d{2}$/);
  });

  test('退勤打刻が記録される', () => {
    const tcRecords = win.__getState().tcRecords;
    tcRecords.push({ staff: '田中', date: win.getToday(), time: '09:00', type: '出勤' });
    win.__setState({ tcRecords });
    win.punchOut();
    const rec = win.__getState().tcRecords.find(r => r.staff === '田中' && r.type === '退勤');
    expect(rec).toBeDefined();
  });

  test('出勤なしで退勤はできない', () => {
    win.punchOut();
    expect(alerts.some(a => a.includes('出勤打刻がありません'))).toBe(true);
    expect(win.__getState().tcRecords.filter(r => r.type === '退勤').length).toBe(0);
  });

  test('スタッフ未選択では打刻できない', () => {
    win.__setState({ selectedStaff: '' });
    win.punchIn();
    expect(alerts.length).toBeGreaterThan(0);
    expect(win.__getState().tcRecords.length).toBe(0);
  });

  test('打刻データがlocalStorageに保存される', () => {
    win.punchIn();
    const saved = JSON.parse(win.localStorage.getItem('pos_tc') || '[]');
    expect(saved.length).toBeGreaterThan(0);
    expect(saved[0].staff).toBe('田中');
    expect(saved[0].type).toBe('出勤');
  });
});

describe('勤務時間・給与計算', () => {
  let win;

  beforeEach(() => {
    ({ win } = loadApp());
    win.__setState({
      staffList: ['田中'],
      adminViewStaff: '田中',
      adminViewMonth: '2026-04',
      tcRecords: [
        { staff: '田中', date: '2026-04-01', time: '09:00', type: '出勤' },
        { staff: '田中', date: '2026-04-01', time: '18:00', type: '退勤' }, // 9h
        { staff: '田中', date: '2026-04-02', time: '10:00', type: '出勤' },
        { staff: '田中', date: '2026-04-02', time: '17:30', type: '退勤' }  // 7h30m
      ]
    });
  });

  test('勤怠一覧に打刻日が表示される', () => {
    win.renderAdminTcBody();
    const body = win.document.getElementById('adminTcBody').innerHTML;
    expect(body).toContain('2026-04-01');
    expect(body).toContain('2026-04-02');
  });

  test('勤怠一覧に出退勤時刻が表示される', () => {
    win.renderAdminTcBody();
    const body = win.document.getElementById('adminTcBody').innerHTML;
    expect(body).toContain('09:00');
    expect(body).toContain('18:00');
  });

  test('給与計算が正しい（16.5時間 × 1000円 = 16500円）', () => {
    win.document.getElementById('hourlyRate').value = '1000';
    win.calcSalary();
    const result = win.document.getElementById('salaryResult').innerHTML;
    // 9h + 7.5h = 16.5h → 16500円
    expect(result).toMatch(/16.?500/);
  });

  test('時給未入力でアラートが出る', () => {
    const { win: w, alerts: a } = loadApp();
    win.__setState({
      adminViewStaff: '田中',
      adminViewMonth: '2026-04',
      tcRecords: win.__getState().tcRecords
    });
    w.__setState({
      adminViewStaff: '田中',
      adminViewMonth: '2026-04',
      tcRecords: win.__getState().tcRecords
    });
    w.document.getElementById('hourlyRate').value = '';
    w.calcSalary();
    expect(a.length).toBeGreaterThan(0);
  });

  test('別スタッフのデータは含まれない', () => {
    const tcRecords = win.__getState().tcRecords;
    tcRecords.push(
      { staff: '山田', date: '2026-04-01', time: '08:00', type: '出勤' },
      { staff: '山田', date: '2026-04-01', time: '20:00', type: '退勤' }
    );
    win.__setState({ tcRecords });
    win.document.getElementById('hourlyRate').value = '1000';
    win.calcSalary();
    const result = win.document.getElementById('salaryResult').innerHTML;
    // 田中の16.5h分だけ計算される
    expect(result).toMatch(/16.?500/);
    expect(result).not.toMatch(/24.?000/);
  });
});

describe('打刻修正', () => {
  let win;

  beforeEach(() => {
    ({ win } = loadApp());
    win.__setState({
      adminViewStaff: '田中',
      tcRecords: [
        { staff: '田中', date: '2026-04-05', time: '09:00', type: '出勤' },
        { staff: '田中', date: '2026-04-05', time: '18:00', type: '退勤' }
      ]
    });
  });

  test('打刻修正で時刻が更新される', () => {
    win.editTcRecord('2026-04-05');
    win.document.getElementById('editInTime').value = '08:30';
    win.document.getElementById('editOutTime').value = '19:00';
    win.saveTcEdit('2026-04-05');
    const records = win.__getState().tcRecords;
    const inRec = records.find(r => r.staff === '田中' && r.date === '2026-04-05' && r.type === '出勤');
    const outRec = records.find(r => r.staff === '田中' && r.date === '2026-04-05' && r.type === '退勤');
    expect(inRec.time).toBe('08:30');
    expect(outRec.time).toBe('19:00');
  });

  test('修正後にlocalStorageが更新される', () => {
    win.editTcRecord('2026-04-05');
    win.document.getElementById('editInTime').value = '08:00';
    win.document.getElementById('editOutTime').value = '17:00';
    win.saveTcEdit('2026-04-05');
    const saved = JSON.parse(win.localStorage.getItem('pos_tc') || '[]');
    const inRec = saved.find(r => r.staff === '田中' && r.type === '出勤');
    expect(inRec.time).toBe('08:00');
  });
});

describe('スタッフ管理', () => {
  let win, alerts;

  beforeEach(() => {
    ({ win, alerts } = loadApp());
    win.__setState({ staffList: [] });
  });

  test('スタッフを追加できる', () => {
    win.document.getElementById('staffInput').value = '佐藤';
    win.addStaff();
    expect(win.__getState().staffList).toContain('佐藤');
  });

  test('スタッフがlocalStorageに保存される', () => {
    win.document.getElementById('staffInput').value = '鈴木';
    win.addStaff();
    const saved = JSON.parse(win.localStorage.getItem('pos_staff') || '[]');
    expect(saved).toContain('鈴木');
  });

  test('重複スタッフは登録できない', () => {
    win.__setState({ staffList: ['田中'] });
    win.document.getElementById('staffInput').value = '田中';
    win.addStaff();
    expect(win.__getState().staffList.length).toBe(1);
    expect(alerts.some(a => a.includes('同じ名前'))).toBe(true);
  });

  test('最大10人まで登録できる', () => {
    win.__setState({ staffList: Array.from({ length: 10 }, (_, i) => `スタッフ${i + 1}`) });
    win.document.getElementById('staffInput').value = '11人目';
    win.addStaff();
    expect(win.__getState().staffList.length).toBe(10);
    expect(alerts.some(a => a.includes('最大10人'))).toBe(true);
  });

  test('スタッフを削除できる', () => {
    win.__setState({ staffList: ['田中', '山田'] });
    win.deleteStaff(0);
    const staffList = win.__getState().staffList;
    expect(staffList).not.toContain('田中');
    expect(staffList).toContain('山田');
  });
});
