module.exports = (req, res, next) => {
  res.json({
    status: 'success',
    github: 'https://github.com/AhmedElTabarani/dorar-hadith-api',
    postman:
      'https://www.postman.com/crimson-robot-408440/workspace/hadith-api/collection/14391446-6a1c5404-cc59-4d59-933d-c07547ee75ca?action=share&creator=14391446',
    endpoints: [
      {
        endpoint: '/v1/api/hadith/search?value={text}&page={page}',
        example:
          '/v1/api/hadith/search?value=انما الاعمال بالنيات&page=2',
        abstractResponse: {
          metadata: {
            length: 'عدد نتائج البحث',
            page: 'رقم الصفحة',
            removeHTML: 'هل عناصر الـ HTML ممسوحة أم لا',
            isCached: 'هل هذه النتائج من الـ cache أم لا',
          },
          data: [
            {
              hadith: 'الحديث',
              rawi: 'الراوي',
              mohdith: 'المحدث',
              book: 'الكتاب',
              numberOrPage: 'رقم الحديث او الصفحة',
              grade: 'درجة الصحة',
            },
          ],
        },
      },
      {
        endpoint: '/v1/site/hadith/search?value={text}&page={page}',
        example:
          '/v1/site/hadith/search?value=انما الاعمال بالنيات&page=2',
        abstractResponse: {
          metadata: {
            length: 'عدد نتائج البحث',
            page: 'رقم الصفحة',
            removeHTML: 'هل عناصر الـ HTML ممسوحة أم لا',
            specialist: 'نوع الاحاديث هل هي للمتخصصين أم لا',
            numberOfNonSpecialist: 'عدد الأحاديث لغير المتخصصين',
            numberOfSpecialist: 'عدد الأحاديث للمتخصصين',
            isCached: 'هل هذه النتائج من الـ cache أم لا',
          },
          data: [
            {
              hadith: 'الحديث',
              rawi: 'الراوي',
              mohdith: 'المحدث',
              mohdithId: 'رقم المحدث',
              book: 'الكتاب',
              bookId: 'رقم الكتاب',
              numberOrPage: 'رقم الحديث او الصفحة',
              grade: 'درجة الصحة',
              explainGrade: 'توضيح درجة الصحة',
              takhrij: 'تخريج الحديث في كتب أخرى',
              hadithId:
                'رقم الحديث لاستخدامه في البحث عن الأحاديث البديلة أو الحديث البديل الصحيح',
              hasSimilarHadith: 'هل الحديث له أحاديث مشابهة أم لا',
              hasAlternateHadithSahih:
                'هل الحديث له حديث صحيح بديل أم لا',
              similarHadithDorar:
                'رابط الأحاديث المشابهة في موقع الدرر',
              alternateHadithSahihDorar:
                'رابط الحديث الصحيح في موقع الدرر',
              urlToGetSimilarHadith:
                'رابط لكي تبحث عن الأحاديث المشابهة',
              urlToGetAlternateHadithSahih:
                'رابط لكي تبحث عن الحديث الصحيح',
              hasSharhMetadata: 'هل الحديث له شرح أم لا',
              sharhMetadata: {
                id: 'رقم الشرح',
                isContainSharh:
                  'هل يحتوى هذا الرد على شرح الحديث أم لا؟',
                urlToGetSharh: 'رابط لكي تبحث عن شرح الحديث',
              },
            },
          ],
        },
      },
      {
        endpoint: '/v1/site/hadith/:id',
        example: '/v1/site/hadith/5mtakqyd',
        abstractResponse: {
          metadata: {
            isCached: 'هل هذه النتائج من الـ cache أم لا',
          },
          data: {
            hadith: 'الحديث',
            rawi: 'الراوي',
            mohdith: 'المحدث',
            mohdithId: 'رقم المحدث',
            book: 'الكتاب',
            bookId: 'رقم الكتاب',
            numberOrPage: 'رقم الحديث او الصفحة',
            grade: 'درجة الصحة',
            explainGrade: 'توضيح درجة الصحة',
            hadithId:
              'رقم الحديث لاستخدامه في البحث عن الأحاديث البديلة أو الحديث البديل الصحيح',
            hasSimilarHadith: 'هل الحديث له أحاديث مشابهة أم لا',
            hasAlternateHadithSahih:
              'هل الحديث له حديث صحيح بديل أم لا',
            similarHadithDorar:
              'رابط الأحاديث المشابهة في موقع الدرر',
            alternateHadithSahihDorar:
              'رابط الحديث الصحيح في موقع الدرر',
            urlToGetSimilarHadith:
              'رابط لكي تبحث عن الأحاديث المشابهة',
            urlToGetAlternateHadithSahih:
              'رابط لكي تبحث عن الحديث الصحيح',
            hasSharhMetadata: 'هل الحديث له شرح أم لا',
            sharhMetadata: {
              id: 'رقم الشرح',
              isContainSharh:
                'هل يحتوى هذا الرد على شرح الحديث أم لا؟',
              urlToGetSharh: 'رابط لكي تبحث عن شرح الحديث',
            },
          },
        },
      },
      {
        endpoint: '/v1/site/hadith/similar/:id',
        example: '/v1/site/hadith/similar/5mtakqyd',
        abstractResponse: {
          metadata: {
            length: 'عدد نتائج البحث',
            isCached: 'هل هذه النتائج من الـ cache أم لا',
          },
          data: [
            {
              hadith: 'الحديث',
              rawi: 'الراوي',
              mohdith: 'المحدث',
              mohdithId: 'رقم المحدث',
              book: 'الكتاب',
              bookId: 'رقم الكتاب',
              numberOrPage: 'رقم الحديث او الصفحة',
              grade: 'درجة الصحة',
              explainGrade: 'توضيح درجة الصحة',
              hadithId:
                'رقم الحديث لاستخدامه في البحث عن الأحاديث البديلة أو الحديث البديل الصحيح',
              hasSimilarHadith: 'هل الحديث له أحاديث مشابهة أم لا',
              hasAlternateHadithSahih:
                'هل الحديث له حديث صحيح بديل أم لا',
              similarHadithDorar:
                'رابط الأحاديث المشابهة في موقع الدرر',
              alternateHadithSahihDorar:
                'رابط الحديث الصحيح في موقع الدرر',
              urlToGetSimilarHadith:
                'رابط لكي تبحث عن الأحاديث المشابهة',
              urlToGetAlternateHadithSahih:
                'رابط لكي تبحث عن الحديث الصحيح',
              hasSharhMetadata: 'هل الحديث له شرح أم لا',
              sharhMetadata: {
                id: 'رقم الشرح',
                isContainSharh:
                  'هل يحتوى هذا الرد على شرح الحديث أم لا؟',
                urlToGetSharh: 'رابط لكي تبحث عن شرح الحديث',
              },
            },
          ],
        },
      },
      {
        endpoint: '/v1/site/hadith/alternate/:id',
        example: '/v1/site/hadith/alternate/5mtakqyd',
        abstractResponse: {
          metadata: {
            isCached: 'هل هذه النتائج من الـ cache أم لا',
          },
          data: {
            hadith: 'الحديث',
            rawi: 'الراوي',
            mohdith: 'المحدث',
            mohdithId: 'رقم المحدث',
            book: 'الكتاب',
            bookId: 'رقم الكتاب',
            numberOrPage: 'رقم الحديث او الصفحة',
            grade: 'درجة الصحة',
            hadithId:
              'رقم الحديث لاستخدامه في البحث عن الأحاديث البديلة أو الحديث البديل الصحيح',
            hasSimilarHadith: 'هل الحديث له أحاديث مشابهة أم لا',
            hasAlternateHadithSahih:
              'هل الحديث له حديث صحيح بديل أم لا',
            similarHadithDorar:
              'رابط الأحاديث المشابهة في موقع الدرر',
            urlToGetSimilarHadith:
              'رابط لكي تبحث عن الأحاديث المشابهة',
            hasSharhMetadata: 'هل الحديث له شرح أم لا',
            sharhMetadata: {
              id: 'رقم الشرح',
              isContainSharh:
                'هل يحتوى هذا الرد على شرح الحديث أم لا؟',
              urlToGetSharh: 'رابط لكي تبحث عن شرح الحديث',
            },
          },
        },
      },
      {
        endpoint: '/v1/site/sharh/:id',
        example: '/v1/site/sharh/3429',
        abstractResponse: {
          metadata: {
            isCached: 'هل هذه النتائج من الـ cache أم لا',
          },
          data: {
            hadith: 'الحديث',
            rawi: 'الراوي',
            mohdith: 'المحدث',
            book: 'الكتاب',
            numberOrPage: 'رقم الحديث او الصفحة',
            grade: 'درجة الصحة',
            takhrij: 'تخريج الحديث في كتب أخرى',
            hasSharhMetadata: 'هل الحديث له شرح أم لا',
            sharhMetadata: {
              id: 'رقم الشرح',
              isContainSharh:
                'هل يحتوى هذا الرد على شرح الحديث أم لا؟',
              urlToGetSharh: 'رابط لكي تبحث عن شرح الحديث',
              sharh: 'شرح الحديث',
            },
          },
        },
      },
      {
        endpoint: '/v1/site/sharh/text/:text',
        example: '/v1/site/sharh/text/انما الاعمال بالنيات',
        abstractResponse: {
          metadata: {
            specialist: 'نوع الاحاديث هل هي للمتخصصين أم لا',
            isCached: 'هل هذه النتائج من الـ cache أم لا',
          },
          data: {
            hadith: 'الحديث',
            rawi: 'الراوي',
            mohdith: 'المحدث',
            book: 'الكتاب',
            numberOrPage: 'رقم الحديث او الصفحة',
            grade: 'درجة الصحة',
            takhrij: 'تخريج الحديث في كتب أخرى',
            hasSharhMetadata: 'هل الحديث له شرح أم لا',
            sharhMetadata: {
              id: 'رقم الشرح',
              isContainSharh:
                'هل يحتوى هذا الرد على شرح الحديث أم لا؟',
              urlToGetSharh: 'رابط لكي تبحث عن شرح الحديث',
              sharh: 'شرح الحديث',
            },
          },
        },
      },
      {
        endpoint: '/v1/site/sharh/search?value={text}',
        example: '/v1/site/sharh/search?value=انما الاعمال بالنيات',
        abstractResponse: {
          metadata: {
            length: 'عدد نتائج البحث',
            page: 'رقم الصفحة',
            removeHTML: 'هل عناصر الـ HTML ممسوحة أم لا',
            specialist: 'نوع الاحاديث هل هي للمتخصصين أم لا',
            isCached: 'هل هذه النتائج من الـ cache أم لا',
          },
          data: [
            {
              hadith: 'الحديث',
              rawi: 'الراوي',
              mohdith: 'المحدث',
              book: 'الكتاب',
              numberOrPage: 'رقم الحديث او الصفحة',
              grade: 'درجة الصحة',
              takhrij: 'تخريج الحديث في كتب أخرى',
              hasSharhMetadata: 'هل الحديث له شرح أم لا',
              sharhMetadata: {
                id: 'رقم الشرح',
                isContainSharh:
                  'هل يحتوى هذا الرد على شرح الحديث أم لا؟',
                urlToGetSharh: 'رابط لكي تبحث عن شرح الحديث',
                sharh: 'شرح الحديث',
              },
            },
          ],
        },
      },
      {
        endpoint: '/v1/site/mohdith/:id',
        example: '/v1/site/mohdith/261',
        abstractResponse: {
          metadata: {
            isCached: 'هل هذه النتائج من الـ cache أم لا',
          },
          data: {
            name: 'المحدث',
            mohdithId: 'رقم المحدث',
            info: 'معلومات عن المحدث',
          },
        },
      },
      {
        endpoint: '/v1/site/book/:id',
        example: '/v1/site/book/3088',
        abstractResponse: {
          metadata: {
            isCached: 'هل هذه النتائج من الـ cache أم لا',
          },
          data: {
            name: 'الكتاب',
            bookId: 'رقم الكتاب',
            author: 'المؤلف',
            reviewer: 'المراجع',
            publisher: 'دار النشر',
            edition: 'رقم الطبعة',
            editionYear: 'سنة الطبعة',
          },
        },
      },
    ],
    query: {
      value: 'محتوى نص الحديث المراد البحث عنه',
      page: 'تحديد رقم الصفحة',
      removehtml:
        'حذف عناصر الـ HTML في الحديث كـ <span class="search-keys">...</span>',
      specialist:
        'تستخدم لتحدد نوع الاحاديث هل هي للمتخصصين أم لا قيمها هي "true" للمتخصصين و "false" لغير المتخصصين، القيمة الافتراضية هي "false"',
      st: 'تحدد طريقة البحث',
      xclude: 'استبعاد بعض الكلمات من البحث',
      t: 'تحديد نطاق البحث',
      'd[]': 'تحديد درجة الحديث سواء صحيح ام ضعيف',
      'm[]': 'تحديد اسماء المحدثين التي تريدهم',
      's[]': 'تحديد الكتب التي تريد البحث فيها',
      'rawi[]': 'تحديد اسماء الرواة التي تريدهم',
    },
    data: [
      {
        endpoint: '/v1/data/book',
        description: 'احضار كل الكتب المتاحة',
        abstractResponse: [
          {
            key: 'الكلمة  المفتاحية',
            value: 'القيمة',
          },
        ],
      },
      {
        endpoint: '/v1/data/degree',
        description: 'احضار كل درجات الحديث المتاحة',
        abstractResponse: [
          {
            key: 'الكلمة  المفتاحية',
            value: 'القيمة',
          },
        ],
      },
      {
        endpoint: '/v1/data/methodSearch',
        description: 'احضار كل طرق البحث المتاحة',
        abstractResponse: [
          {
            key: 'الكلمة  المفتاحية',
            value: 'القيمة',
          },
        ],
      },
      {
        endpoint: '/v1/data/mohdith',
        description: 'احضار كل المحدثين المتاحين',
        abstractResponse: [
          {
            key: 'الكلمة  المفتاحية',
            value: 'القيمة',
          },
        ],
      },
      {
        endpoint: '/v1/data/rawi',
        description: 'احضار كل الرواة المتاحين',
        abstractResponse: [
          {
            key: 'الكلمة  المفتاحية',
            value: 'القيمة',
          },
        ],
      },
      {
        endpoint: '/v1/data/zoneSearch',
        description: 'احضار كل نطاقات البحث المتاحة',
        abstractResponse: [
          {
            key: 'الكلمة  المفتاحية',
            value: 'القيمة',
          },
        ],
      },
    ],
  });
};
