// Mock successful hadith search response from dorar.net
const mockHadithSearchResponse = {
  ahadith: {
    result: `
      <div class="text">1 - حديث صحيح</div>
      <div class="hadith-info">
        <div class="info">
          <span class="info-subtitle">الراوي:</span>أبو هريرة
          <span class="info-subtitle">المحدث:</span>البخاري
          <span class="info-subtitle">المصدر:</span>صحيح البخاري
          <span class="info-subtitle">الصفحة أو الرقم:</span>1
          <span class="info-subtitle">خلاصة حكم المحدث:</span>صحيح
        </div>
      </div>
    `
  }
};

// Mock successful sharh response
const mockSharhResponse = `
  <article>حديث صحيح</article>
  <div class="primary-text-color">أبو هريرة</div>
  <div class="primary-text-color">البخاري</div>
  <div class="primary-text-color">صحيح البخاري</div>
  <div class="primary-text-color">1</div>
  <div class="primary-text-color">صحيح</div>
  <div class="primary-text-color">تخريج</div>
  <div class="text-justify"></div>
  <div>شرح الحديث</div>
`;

// Mock successful sharh search response
const mockSharhSearchResponse = `
  <div id="home">
    <div class="border-bottom">
      <div>حديث صحيح</div>
      <div>
        <div class="primary-text-color">أبو هريرة</div>
        <div class="primary-text-color">البخاري</div>
        <div class="primary-text-color">صحيح البخاري</div>
        <div class="primary-text-color">1</div>
        <div class="primary-text-color">صحيح</div>
      </div>
      <a xplain="123"></a>
    </div>
  </div>
  <div id="specialist">
    <div class="border-bottom">
      <div>حديث صحيح</div>
      <div>
        <div class="primary-text-color">أبو هريرة</div>
        <div class="primary-text-color">البخاري</div>
        <div class="primary-text-color">صحيح البخاري</div>
        <div class="primary-text-color">1</div>
        <div class="primary-text-color">صحيح</div>
      </div>
      <a xplain="123"></a>
    </div>
  </div>
`;

// Mock error responses
const mockNotFoundResponse = {
  status: 'fail',
  message: 'not found'
};

const mockSharhNotFoundResponse = {
  status: 'fail',
  message: 'Sharh not found'
};

const mockServerErrorResponse = {
  status: 'error',
  message: 'Internal Server Error'
};

// Mock malformed responses for error handling testing
const mockMalformedHadithResponse = {
  // Simulate malformed response by omitting the 'ahadith' property
  // This should trigger 'Invalid response from Dorar API' error
};

const mockMalformedSharhResponse = '<div>Invalid structure</div>';

module.exports = {
  mockHadithSearchResponse,
  mockSharhResponse,
  mockSharhSearchResponse,
  mockNotFoundResponse,
  mockSharhNotFoundResponse,
  mockServerErrorResponse,
  mockMalformedHadithResponse,
  mockMalformedSharhResponse
};
