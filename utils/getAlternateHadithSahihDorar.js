module.exports = (info) => {
  const alternateHadith = info.querySelector('a[href$="?alts=1"]');
  return alternateHadith?.getAttribute('href');
};
