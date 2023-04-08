// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderMeta(response: any) {
	const usage = response?.data?.usage;
	const model = response?.data?.model;
	if (!usage) return '';
	return (
		<>
			{', '}
			<span
				title={`${usage.prompt_tokens} prompt, ${usage.completion_tokens} completion`}
			>
				{usage.total_tokens} tokens
			</span>
			{', '}
			{model}
		</>
	);
}

export default renderMeta;