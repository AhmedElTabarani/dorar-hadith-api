module.exports = (info) => {
  const similarHadith = info.querySelector('a[href$="?alts=1"]');
  return similarHadith?.getAttribute('href');
};
