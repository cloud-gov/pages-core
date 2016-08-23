export default function convertFileToData(file) {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();

    fileReader.onload = () => {
      if (fileReader.error) {
        return reject(error);
      }

      const fileHeaderRegex = /data:\w+\/\w+;base64,/;
      return resolve(fileReader.result.replace(fileHeaderRegex, ''));
    };

    fileReader.readAsDataURL(file);
  });
};
