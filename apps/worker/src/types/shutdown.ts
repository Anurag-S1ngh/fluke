export type Closer = {
  name: string;
  close: () => Promise<unknown>;
};
