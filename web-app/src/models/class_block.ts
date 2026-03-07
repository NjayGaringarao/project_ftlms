import { Block } from "./block";
import { Class } from "./class";

export type ClassBlock = {
  id: string;
  class_id: string;
  block_id: string;
};

export type ExtendedClassBlock = ClassBlock & {
  class: Class;
  block: Block;
};
