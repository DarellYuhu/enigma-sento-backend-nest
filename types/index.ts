export enum FieldMap {
  'value' = 'value',
  'colorCollectionId' = 'fill',
  'fontCollectionId' = 'fontId',
  'imageCollectionId' = 'imageUrl',
}

export type VarField = {
  id: string;
  key: string;
  property:
    | 'value'
    | 'fontCollectionId'
    | 'colorCollectionId'
    | 'imageCollectionId';
};

export type FieldConfig = VarField & {
  value: string[];
  targetField: FieldMap;
};
