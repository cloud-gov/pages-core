const filterAssetsWithTypeOfFile = assets => {
  return assets.filter(asset => {
    return asset.type === 'file';
  });
};

export default filterAssetsWithTypeOfFile;
