const fs = require('fs');
const pdf2text = require('./services/pdf2text-parser');
const pdfjs = require('./services/pdfjs-parser');


// constants
const ASSETS_DIR = '/Volumes/Documents/Projects/databyss/pdf-parser/_assets/pdf';

const pdf1 = {
  path: `${ASSETS_DIR}/Schreibman et al. - A New Companion to Digital Humanities.pdf`,
  title: 'Schreibman et al. - A New Companion to Digital Humanities',
};
const pdf2 = {
  path: `${ASSETS_DIR}/blackcamera.pdf`,
  title: 'Social Death and Narrative Aporia in 12 Years a Slave',
};
const pdf3 = {
  path: `${ASSETS_DIR}/blackcamera-redacted.pdf`,
  title: 'Social Death and Narrative Aporia in 12 Years a Slave (redacted)',
};

const OUTPUT_DIR = './tmp/';


// vars
const selectedPDF = pdf3;
let info = undefined;
let text = undefined;


// init
parse(selectedPDF);


// method definitions
function parse(pdf) {
  console.log('📄 File:', pdf.path);
  console.log('🏷  Title:', pdf.title);

  parseWithPDFJS(pdf);
  // parseWithPDF2Text(pdf.path);
}

function parseWithPDFJS(pdf) {
  pdfjs.parse(pdf.path)
    .then(response => { 
      pdf.pagesData = response;
      console.log('pdf:', pdf);
      console.log('👍 PDF parsed');
     })
    .catch(console.error)
    .finally(() => {
      console.log('🎉 Parsing completed');
    });
}

function parseWithPDF2Text(path) {
  pdf2text.getInfo(path)
    .then(response => { info = response })
    .catch(console.error)
    .finally(() => saveToFile());

  pdf2text.getText(path)
    .then(response => { text = response })
    .catch(console.error)
    .finally(() => saveToFile());
}

function saveToFile() {
  if (!info || !text) {
    return;
  }

  console.info('--- saveToFile ---');
  // console.log('info: ', info);

  const regex = new RegExp(' ', 'g');
  // let filename = info.title
  let filename = selectedPDF.title
    .replace(regex, '-')
    .toLowerCase()
    .concat('.txt');

  let content = '';

  // add info
  content += '=== INFO ===\n\n';
  for (const key in info) {
    if (info.hasOwnProperty(key)) {
      const value = info[key];
      content += key + ': ' + value + '\n';
    }
  }

  // add text
  content += '\n\n=== TEXT ===\n\n';
  content += text;

  const filePath = `${OUTPUT_DIR}${filename}`;
  console.log('💾 Save to ', filePath);
  fs.writeFileSync(filePath, content);
}
