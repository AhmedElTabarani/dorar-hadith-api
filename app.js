const express = require('express');
const cors = require('cors');
const dorarAPI = require('./dorarAPI');

const app = express();
app.use(cors());

const port = process.env.PORT || 5000;

app.get('/', (req, res) => {
  res.json({
    status: 'success',
    endpint: '/api/search?value={value}&page={page}',
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
  });
});

app.get('/api/search', async (req, res, next) => {
  res.json(await dorarAPI(req.query, next));
});

app.get('*', (req, res, next) => {
  res.status(501).json({
    status: 'error',
    message:
      "There is no router for this url, Please try '/api/search?value={value}&page={page}'",
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
