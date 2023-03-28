const camelCaseToWords = require("./camelCaseToWords.cjs");
const capitalize = require("./capitalize.cjs");

function remapAuthors(authors) {
    return authors
        ? authors.map((author) => `${author.firstName} ${author.lastName}`)
        : [];
}

function getDate(timestamp) {
    return new Date(Date.parse(timestamp));
}

function remapTags(tags) {
    return tags.map((tagObj) => capitalize(tagObj.tag));
}

function checkFav(tags) {
    return remapTags(tags).includes("Favourite");
}

const remapZoteroData = (inputData) => {
    const remappedData = inputData.map(({ data }) => ({
        key: data.key,
        version: data.version,
        itemType: camelCaseToWords(data.itemType),
        title: data.title,
        authors: remapAuthors(data.creators),
        abstractNote: data.abstractNote,
        series: data.series,
        volume: data.volume,
        edition: data.edition,
        publisher: data.publisher,
        publicationTitle: data.publicationTitle,
        url: data.url,
        websiteTitle: data.websiteTitle,
        institution: data.institution,
        pages: data.pages,
        tags: remapTags(data.tags),
        favourite: checkFav(data.tags),
        year: getDate(data.date).getFullYear(),
        dateAdded: getDate(data.dateAdded),
        dateModified: getDate(data.dateModified),
    }));
    return remappedData;
};

module.exports = remapZoteroData;
