module.exports = (info) => {
  const hadithId = info.querySelector('a[tag]');
  return hadithId?.getAttribute('tag');
};
