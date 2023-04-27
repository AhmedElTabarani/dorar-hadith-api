const express = require('express');
const cors = require('cors');

const dorarAPI = require('./dorarAPI');
const dorarSite = require('./dorarSite');
const sharhByText = require('./dorarSharhByText');
const oneSharhById = require('./dorarOneSharhById');
const oneSharhByText = require('./dorarOneSharhByText');

const app = express();
app.use(cors());

const port = process.env.PORT || 5000;

// to delete elements from hadith text or not
// including this `<span class="search-keys">...</span>`
app.use((req, res, next) => {
  req.isRemoveHTML = req.query.removehtml || true;
  req.isRemoveHTML =
    req.query.removehtml?.toLowerCase() === 'false' ? false : true;
  next();
});

// to chose the tab to search in /site/search
// tab value can be 'home' (non-specialist) or 'specialist'
app.use((req, res, next) => {
  req.tab = req.query.tab || 'home';
  req.tab =
    req.query.tab?.toLowerCase() === 'specialist'
      ? 'specialist'
      : 'home';
  next();
});

app.get('/docs', (req, res, next) => {
  res.json({
    status: 'success',
    endpoints: [
      {
        endpoint: '/api/search?value={text}&page={page}',
        example: '/api/search?value=انما الاعمال بالنيات&page=2',
        abstractResponse: [
          {
            hadith: 'الحديث',
            el_rawi: 'الراوي',
            el_mohdith: 'المحدث',
            source: 'المصدر',
            number_or_page: 'رقم الحديث او الصفحة',
            grade: 'درجة الصحة',
          },
        ],
      },
      {
        endpoint: '/site/search?value={text}&page={page}',
        example: '/site/search?value=انما الاعمال بالنيات&page=2',
        abstractResponse: [
          {
            hadith: 'الحديث',
            el_rawi: 'الراوي',
            el_mohdith: 'المحدث',
            source: 'المصدر',
            number_or_page: 'رقم الحديث او الصفحة',
            grade: 'درجة الصحة',
            hasSharh: 'هل الحديث له شرح أم لا؟',
            sharh: {
              id: 'رقم الشرح',
              urlToGetSharh: 'رابط لكي تبحث عن شرح الحديث',
            },
          },
        ],
      },
      {
        endpoint: '/site/sharh?value={text}',
        example: '/site/sharh?value=انما الاعمال بالنيات',
        abstractResponse: [
          {
            hadith: 'الحديث',
            el_rawi: 'الراوي',
            el_mohdith: 'المحدث',
            source: 'المصدر',
            number_or_page: 'رقم الحديث او الصفحة',
            grade: 'درجة الصحة',
            sharh: 'شرح الحديث',
            sharhId: 'رقم الشرح',
          },
        ],
      },
      {
        endpoint: '/site/oneSharhBy?id={sharhId}',
        example: '/site/oneSharhBy?id=3429',
        abstractResponse: {
          hadith: 'الحديث',
          el_rawi: 'الراوي',
          el_mohdith: 'المحدث',
          source: 'المصدر',
          number_or_page: 'رقم الحديث او الصفحة',
          grade: 'درجة الصحة',
          sharh: 'شرح الحديث',
          sharhId: 'رقم الشرح',
        },
      },
      {
        endpoint: '/site/onSharhBy?value={text}',
        example: '/site/onSharhBy?value=انما الاعمال بالنيات',
        abstractResponse: {
          hadith: 'الحديث',
          el_rawi: 'الراوي',
          el_mohdith: 'المحدث',
          source: 'المصدر',
          number_or_page: 'رقم الحديث او الصفحة',
          grade: 'درجة الصحة',
          sharh: 'شرح الحديث',
          sharhId: 'رقم الشرح',
        },
      },
    ],
    query: {
      value: 'محتوى نص الحديث المراد البحث عنه',
      page: 'تحديد رقم الصفحة',
      removehtml:
        'حذف عناصر الـ HTML في الحديث كـ <span class="search-keys">...</span>',
      tab: 'تستخدم فقط في "/site/search" لتحدد نوع الاحاديث هل هي للمتخصصين أم لا قيمها هي "specialist" للمتخصصين و "home" لغير المختصيين',
      st: 'تحدد طريقة البحث',
      xclude: 'استبعاد بعض الكلمات من البحث',
      t: 'تحديد نطاق البحث',
      'd[]': 'تحديد درجة الحديث سواء صحيح ام ضعيف',
      'm[]': 'تحديد اسماء المحدثين التي تريدهم',
      's[]': 'تحديد الكتب التي تريد البحث فيها',
      'rawi[]': 'تحديد اسماء الرواة التي تريدهم',
    },
  });
});

app.get('/api/search', async (req, res, next) => {
  const query = req._parsedUrl.query.replace('value=', 'skey=');
  res.json(await dorarAPI(query, req, next));
});

app.get('/site/search', async (req, res, next) => {
  const query = req._parsedUrl.query.replace('value=', 'q=');
  res.json(await dorarSite(query, req, next));
});

app.get('/site/sharh', async (req, res, next) => {
  const text = req.query.value;

  if (text)
    res.json(
      await sharhByText(text, req._parsedUrl.query, req, next),
    );
  else
    res.status(400).json({
      status: 'error',
      message: "'value' is required",
    });
});

app.get('/site/oneSharhBy', async (req, res, next) => {
  const { id, value: text } = req.query;

  if (id) res.json(await oneSharhById(id, req, next));
  else if (text) res.json(await oneSharhByText(text, req, next));
  else
    res.status(400).json({
      status: 'error',
      message: "'id' or 'value' is required",
    });
});

app.get('*', (req, res, next) => {
  res.status(501).json({
    status: 'error',
    message:
      "There is no router for this url, Please check docs '/docs'",
  });
});

app.use((err, req, res, next) => {
  res.status(400).json({
    status: 'error',
    message: err.message,
  });
});

app.listen(port, () =>
  console.log(`Server is listening at http://localhost:${port}`),
);
