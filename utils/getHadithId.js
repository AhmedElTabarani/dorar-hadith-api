module.exports = (info) => {
  const similarHadith = info.querySelector('a[tag]');
  return similarHadith?.getAttribute('tag');
};
