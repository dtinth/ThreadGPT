function convertToNumber(input: string): number {
	const number = Number(input);
	if (isNaN(number)) {
		throw new Error(`${input} is not a valid number`);
	}
	return number;
}

export {
	convertToNumber,
};