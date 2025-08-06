import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { CreateLayoutGroupDto } from './dto/create-layout-group.dto';
import { TemplateSchema } from 'src/layout/schema/template.schema';
import { Color } from 'src/asset/schemas/color.schema';
import { AssetService } from 'src/asset/asset.service';
import { CollectionService } from 'src/collection/collection.service';
import { LayoutService } from 'src/layout/layout.service';
import { FieldConfig, FieldMap, VarField } from 'types';
import { ZipFile } from 'yazl';

@Injectable()
export class LayoutGroupService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly asset: AssetService,
    private readonly collection: CollectionService,
    private readonly layout: LayoutService,
  ) {}

  create(payload: CreateLayoutGroupDto) {
    return this.prisma.layoutGroup.create({
      data: {
        name: payload.name,
        description: payload.description,
        groupItem: {
          createMany: {
            data: payload.layoutIds.map((layoutId) => ({ layoutId })),
          },
        },
      },
    });
  }

  async findAll() {
    const data = await this.prisma.layoutGroup.findMany({
      include: {
        _count: { select: { groupItem: true } },
      },
    });
    return data.map(({ _count, ...item }) => ({
      ...item,
      layoutCount: _count.groupItem,
    }));
  }

  async getVariableFields(groupId: number) {
    const { groupItem } = await this.prisma.layoutGroup.findUniqueOrThrow({
      where: { id: groupId },
      select: { groupItem: { include: { layout: true } } },
    });

    const normalize = groupItem.flatMap(
      (item) => (item.layout.template as TemplateSchema).shapes,
    );

    const varFields: VarField[] = [];
    const assignedVar: string[] = [];

    for (const shape of normalize) {
      const tryAssign = (
        condition: boolean,
        property: VarField['property'],
      ) => {
        const id = shape.key + property;
        if (condition && !assignedVar.includes(id)) {
          assignedVar.push(id);
          varFields.push({ key: shape.key, property, id });
        }
      };

      if (shape.type === 'text') {
        tryAssign(!shape.value, 'value');
        tryAssign(!shape.fill, 'colorCollectionId');
        tryAssign(!shape.fontId, 'fontCollectionId');
      } else {
        tryAssign(!shape.fill && !shape.imageId, 'imageCollectionId');
      }
    }

    return varFields;
  }

  async generateContent(
    groupId: number,
    fieldValue: Map<string, string | string[]>,
    iteration = '10',
  ) {
    const varFields = await this.getVariableFields(groupId);
    const withValues: FieldConfig[] = [];
    for (const item of varFields) {
      let value: string[] = [];
      const targetField = FieldMap[item.property];

      switch (item.property) {
        case 'value':
          // the array of text
          value = fieldValue.get(item.id) as string[];
          break;
        case 'colorCollectionId':
          const colors: Color[] = await this.asset.findAllColor(
            fieldValue.get(item.id) as string,
          );
          // array of hex color
          value = colors.map((color) => color.primary);
          break;
        case 'fontCollectionId':
          const collection = await this.collection.findOne(
            fieldValue.get(item.id) as string,
          );
          const fonts = await this.asset.findAllFont(collection.assets);
          // array of font id (fill be load on generate)
          value = fonts.map((font) => font._id.toString());
          break;
        case 'imageCollectionId':
          const images = await this.asset.getImages({
            collectionId: fieldValue.get(item.id) as string,
          });
          // array of image url
          value = images.map((img) => img.url);
          break;
      }

      withValues.push({ ...item, value, targetField });
    }

    const templates = await this.layout.getAll(groupId);

    const generatedImgs = await Promise.all(
      Array.from({ length: +iteration }).map((_, i) => {
        return this.layout.generateImage(templates[i % templates.length].id, {
          templateConfig: withValues,
          idx: i,
        });
      }),
    );

    const zip = new ZipFile();
    generatedImgs.forEach((img, i) => {
      zip.addBuffer(img, `img-${i}.png`);
    });
    zip.end();
    const chunks: Buffer[] = [];
    const buf = await new Promise<Buffer>((resolve, reject) => {
      zip.outputStream
        .on('data', (chunk) => chunks.push(Buffer.from(chunk)))
        .on('end', () => resolve(Buffer.concat(chunks)))
        .on('error', reject);
    });

    return buf;
  }
}
