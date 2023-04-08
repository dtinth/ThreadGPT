import { UseQueryResult } from '@tanstack/react-query';
import { ikv } from 'src/ikv';
import ObjectID from 'bson-objectid';
import { queryClient } from 'src/queryClient';
import { Message, Role } from 'src/types/Message';
import storageKey from 'src/keys/StorageKey';
import ThreadNode from 'src/types/ThreadNode';
import { createChatCompletion } from 'src/components/CreateForm/CreateForm';

async function mutationFunction(
  data: { text: string; role: Role } | null, 
  nodeId: string, 
  nextMessages: Message[],
  query: UseQueryResult<ThreadNode, unknown>
) {
  const text = data?.text ?? null;
  const role = data?.role ?? 'user';
  const parentKey = storageKey(nodeId);
  const parent = await ikv.get(parentKey);

  if (!parent) {
    throw new Error('Parent node not found');
  }

  async function addNode(message: ThreadNode['message'], response?: unknown) {
    const id = String(ObjectID());
    const node: ThreadNode = {
      depth: parent.depth + 1,
      children: [],
      message: message,
      response,
      timestamp: new Date().toJSON(),
    };
    await ikv.set(storageKey(id), node);
    parent.children.unshift(id);
  }

  if (text === null) {
    let secretKey = await ikv.get('openaiSecretKey');
    if (!secretKey) {
      secretKey = prompt('Enter OpenAI secret key');
      if (!secretKey) {
        throw new Error('OpenAI secret key is required');
      }
      await ikv.set('openaiSecretKey', secretKey);
      queryClient.invalidateQueries(['models']);
    }

    const response = await createChatCompletion(nextMessages, secretKey);
    for (const [index, choice] of response.data.choices.entries()) {
      await addNode(choice.message, {
        data: response.data,
        index,
      });
    }
  } else {
    if (!text.trim()) {
      throw new Error('Message cannot be empty');
    }
    await addNode({ role: role, content: text });
  }
  await ikv.set(parentKey, parent);
  query.refetch(); 
}

function tweakMutationFunction(data: { text: string; role: Role }, insertMessage?: (message: Message) => void){
  if (!insertMessage) {
    throw new Error('Cannot insert message at root level');
  }
  return insertMessage({
    content: data.text,
    role: data.role,
  });
}

export { mutationFunction, tweakMutationFunction};
  