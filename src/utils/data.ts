export const isArrayDiff = (arr1: Array<string>, arr2: Array<string>) => {
  return arr1.filter((x: any) => arr2.includes(x)).length;
};

export const isStringDiff = (str1: Array<string>, str2: Array<string>) =>
  str1 === str2;

export default {
  isArrayDiff,
  isStringDiff,
};
