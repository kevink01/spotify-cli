import type { Option } from './option';
import * as z from 'zod';

export function validateSchema<T extends z.ZodType>(
	data: any[],
	schema: T,
	options: Option
) {
	const schemedResponse = [];
	for (const item of data) {
		schemedResponse.push({
			added_at: options.included_added_at
				? getKey(item, options, 'added_at')
				: undefined,
			href: getKey(item, options, 'href'),
			id: getKey(item, options, 'id'),
			name: getKey(item, options, 'name'),
			uri: getKey(item, options, 'uri'),
		});
	}
	const result = schema.safeParse(schemedResponse);
	return result.success ? result.data : ([] as z.core.output<T>);
}

function getKey(item: any, options: Option, key: string) {
	return options.key === undefined ? item[key] : item[options.key][key];
}
