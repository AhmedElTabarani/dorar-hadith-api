const express = require('express');
const cors = require('cors');
const dorarAPI = require('./dorarAPI');

const app = express();
app.use(cors());

const port = process.env.PORT || 5000;

app.get('/', (req, res) => {
  res.json({
    status: 'success',
    endpoint: '/api/search?value={text}&page={page}',
    example: '/api/search?value=الحج&page=5',
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
    query: {
      value: 'محتوى نص الحديث المراد البحث عنه',
      page: 'تحديد رقم الصفحة',
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
  res.json(await dorarAPI(query, next));
});

app.get('*', (req, res, next) => {
  res.status(501).json({
    status: 'error',
    message:
      "There is no router for this url, Please try '/api/search?value={text}&page={page}'",
  });
});

app.use((err, req, res, next) => {
  res.status(400).json({
    status: 'error',
    message: err.message,
  });
});

app.listen(port, () =>
  console.log(`Server is listening at http://localhost:${port}`)
);
