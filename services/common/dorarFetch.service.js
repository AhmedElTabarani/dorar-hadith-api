const { decode } = require('html-entities');
const { parseHTML } = require('linkedom');

const fetchWithTimeout = require('../../utils/fetchWithTimeout');

const fetchDocument = async (url) => {
  const response = await fetchWithTimeout(url);
  const html = decode(await response.text());
  return parseHTML(html).document;
};

const fetchDecodedJsonBody = async (url) => {
  const response = await fetchWithTimeout(url);
  return response.json();
};

module.exports = {
  fetchDocument,
  fetchDecodedJsonBody,
};
