export default function createRegex(searchTerm) {
    const protoSearch = searchTerm
        .replace(/[,\s/.]+/g, " ")
        .trim()
        .replace(/\s+/g, "|")
        .replace(/\|.{1,2}(?=\||$)/g, "");
    return new RegExp(`(${protoSearch})`, "gi");
}
