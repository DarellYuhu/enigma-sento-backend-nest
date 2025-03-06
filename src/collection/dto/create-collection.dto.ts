export class CreateCollectionDto {
  name: string;
  type: CollectionType;
  assets?: string[];
}
