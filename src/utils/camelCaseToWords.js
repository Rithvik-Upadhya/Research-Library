export default function camelCaseToWords(str) {
    return str
        .match(/^[a-z]+|[A-Z][a-z]*/g)
        .map(function (word) {
            return word[0].toUpperCase() + word.substr(1).toLowerCase();
        })
        .join(" ");
}
