export default function cloudinarifyImage(url, transformer) {
    const regex =
        /(?<=https:\/\/res\.cloudinary\.com\/cfp-resource-library\/image\/upload\/)(.*)/i;
    const subst = `${transformer}/q_auto/$1`;
    return url.replace(regex, subst);
}
