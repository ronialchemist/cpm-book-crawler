const main = async () => {
	const axios = require('axios');
	const cheerio = require('cheerio');
	const fs = require('fs');

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

	const getBooksInfo = async () => {
		chunk(getIsbnAndQty('./Barcode.html'), 3).forEach(async isbnAndQty => {
			try {
        const response = await fetchHTML(`https://www.bookfinder.com/search/?isbn=${isbnAndQty[1]}&mode=isbn&st=sr&ac=qr`);
        console.log(response.data);
        const $ = cheerio.load(response.data.toString('latin1'));

        console.log('test');

        if ($('p[align=center] big').text()) {
          console.log(`${isbnAndQty[1]} Não foi encontrado`);
        } else {
          // get image
          if ($('img[id=coverImage]').html()) {
            const url = $('img[id=coverImage]')[0].attribs.src;
            const filenameExtension = url.split('.')[url.split('.').length - 1];
	          const filename = `${__dirname}/${Date.now().toString()}.${filenameExtension}`;
	          await downloadFile(url, filename);
          } else {
            console.log('imagem não encontrada');
          }

          // get title
          if ($('span[id=describe-isbn-title]').text()) {
            const title = $('span[id=describe-isbn-title]').text();
          } else {
            console.log('título não encontrado');
          }

          // get author
          if ($('span[itemprop=author]').text()) {
            const author = $('span[itemprop=author]').text();
          } else {
            console.log('autor não encontrado');
          }

          // get publisher
          if ($('span[itemprop=publisher]').text()) {
            const publisher = $('span[itemprop=publisher]').text();
          } else {
            console.log('editora não encontrada');
          }

          // get sumary
          if ($('div[id=bookSummary]').text()) {
            const summary = $('div[id=bookSummary]').text();
          } else {
            console.log('sinopse não encontrada');
          }

          // get rating average
          if ($('div[class=rating] span:first').text()) {
            const rating = $('div[class=rating] span:first').html().split(' ')[0];
          } else {
            console.log('avaliação não encontrada');
          }
        }

        console.log(title);
        console.log(author);
        console.log(publisher);
        console.log(summary);
        console.log(rating);
			} catch (e) {
				console.log(e);
			}
		});
	}

  getBooksInfo();
}

main();
