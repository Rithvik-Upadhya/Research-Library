import camelCaseToWords from "./camelCaseToWords.js";
import capitalize from "./capitalize.js";

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

const remapZoteroData = (patchedItems) => {
    const remappedData = patchedItems.map((item) => ({
        abstractNote: item.abstractNote,
        alt: item.alt,
        authors: remapAuthors(item.authors),
        dateAdded: getDate(item.dateAdded),
        dateModified: getDate(item.dateModified),
        edition: item.edition,
        favourite: checkFav(item.tags),
        image: item.image,
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
