export default function capitalize(str) {
    return str
        .match(/[^\s]+/g)
        .map(function (word) {
            return word[0].toUpperCase() + word.substr(1);
        })
        .join(" ");
}
