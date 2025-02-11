export const noop = () => {};

export const stringify = (obj: any) => {
  return JSON.stringify(obj, (_, value) => (typeof value === 'bigint' ? value.toString() : value));
};
