export function getURL(url: string, offset: number, limit: number): URL {
	const newURL = new URL(url);
	newURL.search = getSearchParams(offset, limit);
	return newURL;
}

function getSearchParams(offset: number, limit: number) {
	return new URLSearchParams({
		limit: limit.toString(),
		offset: offset.toString(),
	}).toString();
}
