import { useMutation, useQuery } from '@tanstack/react-query';
import { ikv } from 'src/ikv';
import { useMemo, useState } from 'react';
import ObjectID from 'bson-objectid';
import { errorToString } from 'src/helper/errors';
import 'src/styles.css';
import { ResultPanel } from 'src/components/ResultPanel';
import { Dropdown } from 'src/components/Dropdown/Dropdown';
import { ErrorTab } from 'src/components/ErrorTab';
import { rmRf } from 'src/helper/rmRf';
import { Message, Role } from 'src/types/Message';
import storageKey from 'src/keys/StorageKey';
import { Indent } from 'src/components/Indent';
import ThreadNode from 'src/types/ThreadNode';
import { CreateForm } from 'src/components/CreateForm';
import { ModelButton } from 'src/components/Model/ModelButton';
import { DetailTab } from 'src/components/DetailTab/DetailTab';
import { DropdownListMapper } from 'src/components/Dropdown/DropdownListMapper';
import { mutationFunction, tweakMutationFunction } from 'src/components/ThreadGPT/ThreadGPTMutationFunction';

interface ThreadGPT {
  nodeId: string
  previousMessages: Exclude<ThreadNode['message'], undefined>[]
  removeSelf?: () => void
  insertMessage?: (message: Message) => void
}

function ThreadGPT(props: ThreadGPT) {
	const query = useQuery({
		queryKey: ['threadgpt', props.nodeId],
		queryFn: async (): Promise<ThreadNode> => {
			const key = storageKey(props.nodeId);
			const node = await ikv.get(key);
			if (!node) {
				const defaultNode = { depth: 0, children: [] };
				await ikv.set(key, defaultNode);
				return defaultNode;
			}
			return node;
		},
	});
	const nextMessages = useMemo(() => [
		...props.previousMessages,
		...(query.data?.message ? [query.data?.message] : []),
	], [query.data?.message, props.previousMessages]);
	const [showCreateForm, setShowCreateForm] = useState<boolean | undefined>(
		undefined,
	);
	const [showTweakForm, setShowTweakForm] = useState(false);

	const mutation = useMutation({ 
		mutationFn:  async (data: { text: string; role: Role }) => mutationFunction(data, props.nodeId, nextMessages, query)
	});

	const tweakMutation = useMutation({
		mutationFn: async (data: { text: string; role: Role }) => tweakMutationFunction(data, props.insertMessage),
	});

	if (query.isLoading) {
		return <div>Loading...</div>;
	}
	if (query.isError) {
		return (
			<div>
        Unable to fetch node {props.nodeId}: {String(query.error)}
			</div>
		);
	}
	const data = query.data;
	const message = data.message;
	const defaultShowCreateForm =
    data.children.length === 0 && message?.role !== 'user';
	const effectiveShowCreateForm = showCreateForm ?? defaultShowCreateForm;
	const verb = data.depth === 0 ? 'Start a thread' : 'Reply';
	const listItem = DropdownListMapper(
		{
			query,
			nextMessages,
			insertMessage: props.insertMessage,
			nodeId: props.nodeId,
			previousMessages: props.previousMessages,
			removeSelf: props.removeSelf,
			setShowTweakForm,
			setShowCreateForm,
		}
	);

	return (
		<>
			{showTweakForm && !!message && (
				<Indent depth={data.depth}>
					<div className="pt-3">
						{tweakMutation.isError && (
							<ErrorTab error={errorToString(tweakMutation.error)}/>
						)}
						<CreateForm
							draftId={props.nodeId + ':tweak'}
							onCancel={() => setShowTweakForm(false)}
							onSubmit={(text, role) =>
								tweakMutation
									.mutateAsync({ text, role })
									.then(() => setShowTweakForm(false))
							}
							loading={tweakMutation.isLoading}
							verb={'Tweak'}
							defaultRole={message.role}
							defaultValue={message.content}
						/>
					</div>
				</Indent>
			)}
			<div
				id={`message-${props.nodeId}`}
				data-depth={data.depth}
				data-role={message?.role}
				data-content={message?.content}
				data-timestamp={data.timestamp}
			>
				{message ? (
					<>
						<Indent depth={data.depth - 1}>
							<DetailTab 
								response={data.response}
								message={message}
								timestamp={data.timestamp}
							/>
						</Indent>
						<Indent depth={data.depth}>
							<ResultPanel content={query.data?.message?.content}/>
						</Indent>
					</>
				) : null}
				{!effectiveShowCreateForm && (
					<Indent depth={data.depth}>
						<div className="d-flex ps-3 py-2 gap-2 flex-wrap">
							{message?.role === 'user' ? (
								<ModelButton mutate={mutation.mutate} isLoading={mutation.isLoading} childrens={data.children}/>
							) : (
								<button
									className="btn btn-primary"
									onClick={() => setShowCreateForm(true)}
									disabled={mutation.isLoading}
								>
									{verb}
								</button>
							)}
							<Dropdown items={listItem} />
						</div>
					</Indent>
				)}
				{mutation.isError && (
					<Indent depth={data.depth + 1}>
						<ErrorTab error={errorToString(mutation.error)} />
					</Indent>
				)}
				{effectiveShowCreateForm && (
					<Indent depth={data.depth + 1}>
						<CreateForm
							draftId={props.nodeId}
							onCancel={() => setShowCreateForm(false)}
							onSubmit={(text, role) =>
								mutation
									.mutateAsync({ text, role })
									.then(() => setShowCreateForm(false))
							}
							loading={mutation.isLoading}
							verb={verb}
							defaultRole={message?.role === 'user' ? 'assistant' : 'user'}
						/>
					</Indent>
				)}
			</div>
			{data.children.map((childId) => (
				<ThreadGPT
					nodeId={childId}
					key={childId}
					previousMessages={nextMessages}
					removeSelf={async () => {
						const node = (await ikv.get(storageKey(props.nodeId))) as ThreadNode;
						if (!node) {
							throw new Error('Message not found');
						}
						node.children = node.children.filter((id) => id !== childId);
						await ikv.set(storageKey(props.nodeId), node);
						const deleted = await rmRf(childId);
						alert(`Deleted ${deleted} messages`);
						query.refetch();
					}}
					insertMessage={async (message: Message) => {
						const parentKey = storageKey(props.nodeId);
						const parent = await ikv.get(parentKey);
						if (!parent) {
							throw new Error('Message not found');
						}
						const index = parent.children.indexOf(childId);
						if (index === -1) {
							throw new Error('Child message not found');
						}
						const id = String(ObjectID());
						const node: ThreadNode = {
							depth: parent.depth + 1,
							children: [],
							message: message,
							timestamp: new Date().toJSON(),
						};
						await ikv.set(storageKey(id), node);
						parent.children.splice(index, 0, id);
						await ikv.set(parentKey, parent);
						query.refetch();
					}}
				/>
			))}
		</>
	);
}

export default ThreadGPT;