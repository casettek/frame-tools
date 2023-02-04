export type ImportData = {
  name: string;
  data: string;
  wrapType: number;
  wrapPrefix: string;
  wrapSuffix: string;
  pages: number;
};

export type ImportDataMap = {
  [key: string]: ImportData;
};
