import chalk from 'chalk';

export class Logger {
	constructor() {}

	startMessage(message: string, index: number): void {
		console.log(`${index}. ${chalk.green.bold(message)}\n`);
	}

	success(message: string): void {
		console.log(`   ${chalk.green.bold(message)}`);
	}

	error(message: string): void {
		console.error(`${chalk.red.bold(message)}`);
	}

	info(message: string): void {
		console.log(`${chalk.blue.bold(message)}`);
	}
}
