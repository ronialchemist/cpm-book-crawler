const main = async () => {
  const axios = require('axios');
  const cheerio = require('cheerio');
  const fs = require('fs');
  let i = 0;

  const chunk = (array, size) => {
    const chunkedArray = [];

    for (let i = 0; i < array.length; i++) {
      const last = chunkedArray[chunkedArray.length - 1];

      if(!last || last.length === size) {
        chunkedArray.push([array[i]]);
      } else {
        last.push(array[i]);
      }
    }

    return chunkedArray;
  }

  const downloadFile = async (url, path) => {
    try {
      const writer = fs.createWriteStream(path);

      const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream'
      });
  
      response.data.pipe(writer);
  
      return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
    } catch (e) {
      console.log(`AQUIIII!!!`);
    }
  }

  const fetchHTML = async url => {
    try {
      const response = await axios({
        url,
        method: 'GET',
        responseType: 'arraybuffer',
        reponseEncoding: 'binary'
      });

      return response;
    } catch (e) {
      return e;
    }
  }

  const getIsbnAndQty = (path) => {
    const isbnAndQty = [];
    const $ = cheerio.load(fs.readFileSync(path));

    $('tbody td')
    .each((index, element) => {
      isbnAndQty.push($(element).text());
    });

    return isbnAndQty;	
  }

  const getBookInfo = async () => {
    do {
      try {
        const isbn = chunk(getIsbnAndQty('./Barcode.html'), 3)[i][1];
        const qty = chunk(getIsbnAndQty('./Barcode.html'), 3)[i][2];
        const response = await fetchHTML(`https://www.bookfinder.com/search/?isbn=${isbn}&mode=isbn&st=sr&ac=qr`);
        const $ = cheerio.load(response.data.toString('latin1'));

        if ($('div[id=bd] p:first').length === 1) {
          console.log(`${isbn} não é um isbn válido`);
          console.log(`----End book info ${i}----`);
        } else if ($('p[align=center] strong').length != 0) {
          console.log(`livro não encontrado`);
          console.log(`----End book info ${i}----`);
        } else {
          // get image
          if ($('img[id=coverImage]').length === 1) {
            const url = $('img[id=coverImage]')[0].attribs.src;
            const filenameExtension = url.split('.')[url.split('.').length - 1];
            const filename = `${__dirname}/covers/${Date.now().toString()}.${filenameExtension}`;
            await downloadFile(url, filename);
          } else {
            console.log('imagem não encontrada');
          }

          // get title
          if ($('span[id=describe-isbn-title]').length === 1) {
            const title = $('span[id=describe-isbn-title]').text();
            console.log(title);
          } else {
            console.log('título não encontrado');
          }

          // get author
          if ($('span[itemprop=author]').length === 1) {
            const author = $('span[itemprop=author]').text();
            console.log(author);
          } else {
            console.log('autor não encontrado');
          }

          // get publisher
          if ($('span[itemprop=publisher]').length === 1) {
            const publisher = $('span[itemprop=publisher]').text();
            console.log(publisher);
          } else {
            console.log('editora não encontrada');
          }

          // get sumary
          if ($('div[id=bookSummary]').length === 1) {
            const summary = $('div[id=bookSummary]').text();
            console.log(summary);
          } else {
            console.log('sinopse não encontrada');
          }

          // get rating average
          if ($('div[class=rating] span:first').length === 1) {
            const rating = $('div[class=rating] span:first').html().split(' ')[0];
            console.log(rating);
          } else {
            console.log('avaliação não encontrada');
          }

          console.log(`----End book info ${i}----`);
        }
      } catch (e) {
        console.log(`${isbn} livro que falhou.`);
      }

      i++;
    } while(i % 5 != 0);

    if (i === 20) {
      console.log('Done.');
    } else {
      setTimeout(getBookInfo, 4000);
    }
  }

  getBookInfo();
}

main();