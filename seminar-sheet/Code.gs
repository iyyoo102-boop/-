/**
 * 무료 강연 신청 → 구글 시트 저장
 * 시트 1행(제목줄): 신청일시 | 이름 | 휴대폰 | 성별 | 나이대 | 현재직업 | 강의신청목적 | 개인정보동의 | 유입경로 | 연락상태 | 메모
 */

// 신청자가 쌓일 구글 시트: 무료 강연 신청자 명단 (AI시대 커리어 전환)
var SHEET_ID = '1HSs7HE9zIBR-S8G0aw9aAxIGAQ9H-a7EmIxjaHUcJN0';

var HEADERS = ['신청일시', '이름', '휴대폰', '성별', '나이대', '현재직업', '강의신청목적', '개인정보동의', '유입경로', '연락상태', '메모'];

function doGet() {
  return ContentService.createTextOutput('무료 강연 신청 접수용 주소입니다. 정상 작동 중입니다.');
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
    var sheet = SpreadsheetApp.openById(SHEET_ID).getSheets()[0];
    if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);
    sheet.appendRow([
      Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss'),
      clean(row.name),
      clean(row.phone),
      clean(row.gender),
      clean(row.age),
      clean(row.job),
      clean(row.purpose, 300),
      clean(row.agree),
      clean(row.source),
      '미연락',
      ''
    ]);
  } finally {
    lock.releaseLock();
  }
}

// 수식 삽입 방지 + 글자 수 제한(기본 100자)
function clean(v, max) {
  var s = String(v == null ? '' : v).slice(0, max || 100);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}
