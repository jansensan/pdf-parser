const fs = require('fs');
const pdfjs = require('pdfjs-dist/es5/build/pdf.js');


module.exports = {
  parse: parse,
};


let numPages = 0;
let allPagesData = [];



function parse(path) {
  return new Promise((resolve, reject) => {
    loadPDF(path)
      .then((data) => {
        parsePDF(data)
          .then((data) => {
            resolve(data)
          })
          .catch(reject); 
        })
      .catch(reject); 
  });
}


// private methods
function loadPDF(path) {
  return new Promise((resolve, reject) => {
    fs.readFile(
      path,
      (error, data) => {
        if (error) {
          reject(error);
        }
        resolve(data);
      }
    );
  });
}

function parsePDF(data) {
  return new Promise((resolve, reject) => {
    pdfjs.getDocument(data).promise
      .then((pdf) => {
        numPages = pdf.numPages;

        getAllPages(pdf)
          .then(() => {
            // all pages are loaded

            const allPromises = [];
            const annotationsPromise =  getAllAnnotations();
            allPromises.push(annotationsPromise);
            
            const textPromise = getAllPagesText();
            allPromises.push(textPromise);

            Promise.all(allPromises)
              .then(() => {
                // // console.log('TODO: extract text for annotations');
                // const page1 = allPagesData[0];
                // extractTextFromAnnotations(page1);

                resolve(allPagesData);
              })
              .catch(reject);
          })
          .catch(reject)
      })
      .catch(reject);
  });
}

function getAllPages(pdf) {
  allPagesData.length = 0;
  allPagesData = [];

  return new Promise((resolve, reject) => {
    let allPromises = [];
    for (let i = 0; i < numPages; i++) {
      const pageNumber = i + 1; // note: pages are 1-based
      const page = pdf.getPage(pageNumber)
        .then((pageContent) => {
          allPagesData.push({
            data: pageContent,
            pageNumber: pageContent.pageNumber,
          });
        })
        .catch(reject);
      allPromises.push(page);
    }
    Promise.all(allPromises)
      .then(() => {
        allPagesData.sort(sortByPageNumber);
        resolve(allPagesData);
      })
      .catch(reject);
  });
}

function getAllPagesText() {
  return new Promise((resolve, reject) => {
    let allPromises = [];

    allPagesData.forEach((page) => {
      const { data } = page;
      const textContent = data.getTextContent({normalizeWhitespace: true})
        .then((text) => { page.text = text; })
        .catch(reject);

      allPromises.push(textContent);
    });
    Promise.all(allPromises)
      .then(() => resolve(allPagesData))
      .catch(reject);
  });
}

function getAllAnnotations() {
  return new Promise((resolve, reject) => {
    let allPromises = [];
    allPagesData.forEach((page) => {
      const { data } = page;
      const annotationPromise = data.getAnnotations()
        .then((annotations) => {
          page.numAnnotations = annotations.length;
          page.annotations = [];
          if (page.numAnnotations) {
            annotations.forEach(annotation => {
              page.annotations.push(parseAnnotation(annotation));
            });
          }
        })
        .catch(reject);
      allPromises.push(annotationPromise);
    });
    Promise.all(allPromises)
      .then(() => resolve(allPagesData))
      .catch(reject);
  });
}

function parseAnnotation(data) {
  let response = {
    data,
    id: data.id,
    type: data.subtype,
    author: data.title,
  };

  if (data.parentId) {
    response.parentId = data.parentId;
  }

  switch (data.subtype) {
    case 'Link':
      // TODO: parse link label
      console.log('// TODO: parse link label');
      response.contents = data.url; // also available: unsafeUrl
      break;

    case 'Highlight':
      // const highlightedText = extractTextFrom(data);
      response.contents = 'TODO: parse highlighted text';
      break;

    case 'Popup':
      response.contents = data.contents;
      break;

    case 'Stamp':
      response.contents = data.contents;
      break;

    case 'StrikeOut':
      response.contents = 'TODO: parse striken text';
      break;
    
    case 'Underline':
      // TODO: parse undelined text
      response.contents = 'TODO: parse underlined text';
      break;
    
    default:
      response.contents = `Unhandled annotation type: ${data.subtype}`;
  }

  return response;
}

function extractTextFromAnnotations(pageData) {
  console.info('--- extractTextFromAnnotations ---');
  console.log('page number:', pageData.pageNumber);

  let longForm = '';
  const { items } = pageData.text;
  items.forEach(item => {
    longForm += `${item.str} `;
  });
  console.log('longForm:', longForm);
  // console.log('pageData.text:', pageData.text);


  // console.log('pageData.annotations:', pageData.annotations);
  const annotation = pageData.annotations[0];
  // console.log('annotation.data:', annotation.data);
  const { rect, quadPoints } = annotation.data;
  // console.log('rect:', rect);
  console.log('quadPoints:', quadPoints);
}

function extractTextFrom(data) {
  console.info('--- TODO: extractTextFrom ---');
  console.log('data:', data);

  // const annotation = pdfjs.Annotation.fromData(data);
  // console.log('annotation:', annotation);
}

function sortByPageNumber(a, b) {
  if (a.pageNumber < b.pageNumber) { return -1; }
  if (a.pageNumber > b.pageNumber) { return 1; }
  return 0;
}