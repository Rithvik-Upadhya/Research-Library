import camelCaseToWords from './camelCaseToWords.js';
import capitalize from './capitalize.js';

function remapAuthors(authors) {
	return authors
		? authors.map((author) => `${author.firstName} ${author.lastName}`)
		: [];
}

function getDate(timestamp) {
	return new Date(Date.parse(timestamp));
}

function remapTags(tags) {
	return tags
		.map((tagObj) => capitalize(tagObj.tag))
		.filter((tag) => tag.match(/favou?rites?/i) === null);
}

function checkFav(tags) {
	return tags
		.map((tagObj) => capitalize(tagObj.tag))
		.some((tag) => /favou?rites?/i.test(tag));
}

function checkImageURL(url) {
	const regex = /[^\s]+\.(?:png||jpe?g)$/i;
	const result = regex.test(url) ? url : '';
	return result;
}

const remapZoteroData = (patchedItems) => {
	const remappedData = patchedItems.map((item) => ({
		abstractNote: item.abstractNote,
		authors: remapAuthors(item.creators),
		dateAdded: getDate(item.dateAdded),
		dateModified: getDate(item.dateModified),
		edition: item.edition,
		favourite: checkFav(item.tags),
		image: checkImageURL(item.extra),
		institution: item.institution,
		itemType: camelCaseToWords(item.itemType),
		key: item.key,
		pages: item.pages,
		publicationTitle: item.publicationTitle,
		publisher: item.publisher,
		series: item.series,
		tags: remapTags(item.tags),
		title: item.title,
		url: item.url,
		version: item.version,
		volume: item.volume,
		websiteTitle: item.websiteTitle,
		year: getDate(item.date).getFullYear(),
	}));
	return remappedData;
};

export default remapZoteroData;
