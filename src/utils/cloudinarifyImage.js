export default function cloudinarifyImage(url, transformer) {
	const regex =
		/(https:\/\/res\.cloudinary\.com\/cfp-resource-library\/image\/upload)\/(.*)/i;
	const subst = `$1/${transformer}/q_auto/$2`;
	return url.replace(regex, subst);
}
