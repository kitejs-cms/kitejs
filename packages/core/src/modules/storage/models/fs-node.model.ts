export type DirectoryNodeModel = {
  name: string;
  path: string;
  type: "directory";
  children: Array<DirectoryNodeModel | FileNodeModel>;
};

export type FileNodeModel = {
  name: string;
  path: string;
  url: string;
  type: "file";
};
