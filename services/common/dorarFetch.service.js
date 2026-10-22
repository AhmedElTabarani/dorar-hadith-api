const { decode } = require('html-entities');
const { parseHTML } = require('linkedom');

const fetchWithTimeout = require('../../utils/fetchWithTimeout');

const loadDocument = async (url) => {
  const response = await fetchWithTimeout(url);
  const html = await response.text();
  return parseHTML(decode(html)).document;
};

const documents = new Map();
const fetchDocument = (url) => {
  if (!documents.has(url)) {
    documents.set(
      url,
      loadDocument(url).finally(() => documents.delete(url)),
    );
  }
  return documents.get(url);
};

const fetchDecodedJsonBody = async (url) => {
  const response = await fetchWithTimeout(url);
  return response.json();
};

module.exports = {
  fetchDocument,
  fetchDecodedJsonBody,
};
