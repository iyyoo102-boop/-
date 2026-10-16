/**
 * 잡세미나 좌석 신청 → 구글 시트 저장
 * 시트 1행(제목줄): 신청일시 | 이름 | 휴대폰 | 현재상황 | 듣고싶은이야기 | 참석인원 | 개인정보동의 | 유입경로 | 연락상태 | 메모
 */

var HEADERS = ['신청일시', '이름', '휴대폰', '현재상황', '듣고싶은이야기', '참석인원', '개인정보동의', '유입경로', '연락상태', '메모'];

function doGet() {
  return ContentService.createTextOutput('잡세미나 신청 접수용 주소입니다. 정상 작동 중입니다.');
}

// 초대장 페이지(public/seminar/index.html)에서 보내는 신청을 받는 입구
function doPost(e) {
  var row = JSON.parse(e.postData.contents);
  saveLead(row);
  return ContentService.createTextOutput('ok');
}

function saveLead(row) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);
    sheet.appendRow([
      Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss'),
      clean(row.name),
      clean(row.phone),
      clean(row.situation),
      clean(row.interest),
      clean(row.people),
      clean(row.agree),
      clean(row.source),
      '미연락',
      ''
    ]);
  } finally {
    lock.releaseLock();
  }
}

// 수식 삽입 방지 + 100자 제한
function clean(v) {
  var s = String(v == null ? '' : v).slice(0, 100);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}
