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

	const fetchHTML = async url => {
		try {
			const { data } = await axios.get(url);
			return data;
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

	const getLinks = async () => {
		chunk(getIsbnAndQty('./Barcode.html'), 3).forEach(async isbnAndQty => {
			try {
				const data = await axios.get();
				console.log(data.status);
			} catch (e) {
				console.log(`${isbnAndQty[1]} Não foi encontrado.`);
			}
		});
	}

	getLinks();

	/* const data = await fetchHTML('https://www.starwars.com/news');

	const $ = cheerio.load(data);

	$('.news-articles li')
	.each((index, element) => {
		console.log($(element).find('h2').text().trim());
	}); */
}

main();
