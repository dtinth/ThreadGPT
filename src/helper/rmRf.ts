import { ikv } from 'src/ikv';
import 'src/styles.css';
import storageKey from 'src/keys/StorageKey';
import ThreadNode from 'src/types/ThreadNode';

async function rmRf(nodeId: string): Promise<number> {
	const node = await ikv.get<ThreadNode>(storageKey(nodeId));
	if (!node) {
		return 0;
	}
	return (
		await Promise.all([
			...node.children.map((childId) => rmRf(childId)),
			ikv.del(storageKey(nodeId)).then(() => 1),
		])
	).reduce((a, b) => a + b, 0);
}

export {
	rmRf,
};