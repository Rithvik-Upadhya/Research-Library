export default function cloudinarifyImage(url, transformer) {
    const regex =
        /(?<=https:\/\/res\.cloudinary\.com\/cfp-resource-library\/image\/upload\/)(.*)/gi;
    const subst = `${transformer}/q_auto/$1`;
    return url.replace(regex, subst);
}
