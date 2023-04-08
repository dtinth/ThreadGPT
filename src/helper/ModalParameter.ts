import { useQuery } from '@tanstack/react-query';
import { ikv } from 'src/ikv';
import { ModalParameter } from 'src/types/ModalParameterType';

export const useModalParameter = (modalParameter: ModalParameter) => {
  const query = useQuery({
    queryKey: [modalParameter.key],
    queryFn: async () => {
      const model = await ikv.get(modalParameter.key);
      return model || modalParameter.defaultValue;
    },
  });
  return [
    query.data || modalParameter.defaultValue,
    async (temperature : number) => {
      await ikv.set(modalParameter.key, temperature);
      query.refetch();
    },
  ];
};