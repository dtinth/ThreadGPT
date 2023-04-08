import { QueryObserverSuccessResult } from '@tanstack/react-query';
import { ikv } from 'src/ikv';
import storageKey from 'src/keys/StorageKey';
import { queryClient } from 'src/queryClient';
import { Message } from 'src/types/Message';
import ThreadNode from 'src/types/ThreadNode';
import { rmRf } from 'src/helper/rmRf';

interface DropdownListMapperProps {
  query: QueryObserverSuccessResult<ThreadNode, unknown>
  nextMessages: Message[];
  insertMessage?: (message: Message) => void
  nodeId: string
  previousMessages: Exclude<ThreadNode['message'], undefined>[]
  removeSelf?: () => void
  setShowTweakForm: (show: boolean) => void;
  setShowCreateForm: (show: boolean) => void;
}

export function DropdownListMapper(props: DropdownListMapperProps) {
  const data = props.query.data;
  const message = data.message;
  return ([
    ...(message?.content && props.insertMessage
      ? [
        {
          text: 'Tweak message',
          tooltip:
                  'Creates a copy of this message and lets you edit it',
          onClick: () => props.setShowTweakForm(true),
        },
      ]
      : []),
    ...(message?.role === 'user'
      ? [
        {
          text: 'Custom reply',
          tooltip:
                  'Add a reply to this message with your own text, can be used to help steer the assistant in the right direction',
          onClick: () => props.setShowCreateForm(true),
        },
      ]
      : []),
    ...(message?.content
      ? [
        {
          text: 'Copy message content',
          onClick: () => {
            navigator.clipboard.writeText(
              message?.content || '',
            );
          },
        },
      ]
      : []),
    {
      text: 'Copy conversation as JSON',
      onClick: () => {
        navigator.clipboard.writeText(
          JSON.stringify(props.nextMessages, null, 2),
        );
      },
    },
    ...(data.response
      ? [
        {
          text: 'Copy OpenAI API response as JSON',
          onClick: () => {
            navigator.clipboard.writeText(
              JSON.stringify(data.response.data, null, 2),
            );
          },
        },
      ]
      : []),
    ...(props.removeSelf
      ? [{ text: 'Remove', onClick: props.removeSelf }]
      : []),
    ...(data.children.length > 0
      ? [
        {
          text: 'Remove all replies',
          onClick: async () => {
            const node = (await ikv.get(
              storageKey(props.nodeId),
            )) as ThreadNode;
            if (!node) {
              throw new Error('Message not found');
            }
            const childIds = node.children;
            node.children = [];
            await ikv.set(storageKey(props.nodeId), node);
            const deleted = await Promise.all(
              childIds.map(rmRf),
            ).then((r) => r.reduce((a, b) => a + b, 0));
            alert(`Deleted ${deleted} messages`);
            props.query.refetch();
          },
        },
      ]
      : []),
    ...(data.depth === 0
      ? [
        {
          text: 'Reset OpenAI secret key',
          onClick: async () => {
            const oldKey = await ikv.get('openaiSecretKey');
            const secretKey = prompt(
              'Enter OpenAI secret key',
              oldKey || '',
            );
            if (secretKey == null) {
              return;
            }
            if (oldKey !== secretKey) {
              if (
                !confirm('This will replace your stored key')
              ) {
                alert('phew!');
                return;
              }
            }
            await ikv.set('openaiSecretKey', secretKey);
            queryClient.invalidateQueries(['models']);
          },
        },
      ]
      : []),
  ]
  );
}