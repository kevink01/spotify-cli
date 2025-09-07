export function getURL(url: string, offset: number, limit: number): URL {
	const newURL = new URL(url);
	newURL.search = getSearchParams(offset, limit).toString();
	return newURL;
}

export function getSearchParams(
	offset: number,
	limit: number
): URLSearchParams {
	return new URLSearchParams({
		limit: limit.toString(),
		offset: offset.toString(),
	});
}
