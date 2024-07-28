module.exports = (info) => {
  const similarHadith = info.querySelector('a[href$="?sims=1"]');
  return similarHadith?.getAttribute('href');
};
