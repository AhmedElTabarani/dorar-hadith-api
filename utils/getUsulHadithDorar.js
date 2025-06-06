module.exports = (info) => {
  const usulHadithLink = info.querySelector('a[href$="?osoul=1"]');
  return usulHadithLink?.getAttribute('href');
};
