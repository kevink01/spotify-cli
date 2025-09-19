export type Option = {
	name: string;
	value: string;
	url: string;
	key?: string;
	include_added_at: boolean;
	process_data: (token: string) => Promise<void>;
	save_file: string;
	// Error messages
	offset_error_message: string;
};
