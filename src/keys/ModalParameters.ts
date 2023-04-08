import { DEFAULT_TEMPERATURE, DEFAULT_TOP_P } from 'src/constant/default';
import { ModalParameter } from 'src/types/ModalParameterType';

const temperature = {
  key: "temperature",
  defaultValue: DEFAULT_TEMPERATURE,
} as ModalParameter;

const top_p = {
  key: "top_p",
  defaultValue: DEFAULT_TOP_P,
} as ModalParameter;

export {
  temperature,
  top_p,
};