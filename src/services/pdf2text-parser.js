const pdfUtil = require('pdf-to-text');


module.exports = {
  getInfo: getInfo,
  getText: getText,
};


function getInfo(path) {
  return new Promise(
    (resolve, reject) => {
      pdfUtil.info(
        path,
        (error, data) => {
          if (error) {
            reject(error);
          }
          resolve(data);
        }
      );
    }
  );
}

function getText(path) {
  return new Promise(
    (resolve, reject) => {
      pdfUtil.pdfToText(
        path,
        (error, data) => {
          if (error) {
            reject(error);
          }
    
          let lines = [];
          let line = '';
      
          const numCharacters = data.length;
          for (let i = 0; i < numCharacters; i++) {
            const character = data[i];
      
            switch (character) {
              case '\n':
              case '\r':
                if (line.length) {
                  // create new line only if current one already has content
                  lines.push(line);
                  line = '';
                }
                break;
              
              case '\b':  // backspace
              case '\t':  // horizontal tab
              case '\f':  // form feed
              case '\v':  // vertical tab
              case '':    // empty
                // ignore these characters (for now)
                break;
      
              default:
                line += character;
            }
          }
          const text = lines.join('\n');
          resolve(text);
        }
      );
    }
  )
}