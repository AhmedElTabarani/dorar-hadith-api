const { decode } = require('html-entities');
const { parseHTML } = require('linkedom');

const catchAsync = require('../utils/catchAsync');
const sendSuccess = require('../utils/sendSuccess');
const cache = require('../utils/cache');
const AppError = require('../utils/AppError');
const fetchWithTimeout = require('../utils/fetchWithTimeout');

class MohdithSearchController {
  getOneMohdithByIdUsingSiteDorar = catchAsync(
    async (req, res, next) => {
      const mohdithId = req.params.id;
      if (!mohdithId) {
        throw new AppError('Mohdith ID is required', 400);
      }

      const url = `https://www.dorar.net/hadith/mhd/${mohdithId}`;

      if (cache.has(url)) {
        const result = cache.get(url);
        return sendSuccess(res, 200, result, {
          isCached: true,
        });
      }

      const response = await fetchWithTimeout(url);
      const html = decode(await response.text());
      const doc = parseHTML(html).document;

      const h4 = doc.querySelector('h4');
      const name = h4.textContent;
      const info = h4.nextSibling.textContent.trim();

      const result = {
        name,
        mohdithId,
        info,
      };

      cache.set(url, result);
      sendSuccess(res, 200, result, {
        isCached: false,
      });
    },
  );
}

module.exports = new MohdithSearchController();
