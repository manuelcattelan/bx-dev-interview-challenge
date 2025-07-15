import {
  ClassConstructor,
  ClassTransformOptions,
  instanceToPlain,
  plainToClass,
} from 'class-transformer';

export class Mapper {
  private static _DEFAULT_OPTIONS: ClassTransformOptions = {
    excludeExtraneousValues: true,
    exposeDefaultValues: true,
  };

  static mapData<DestinationClass, SourceData>(
    className: ClassConstructor<DestinationClass>,
    source: SourceData,
    options?: ClassTransformOptions,
  ): DestinationClass {
    const mappedData = plainToClass<DestinationClass, SourceData>(
      className,
      source,
      {
        ...this._DEFAULT_OPTIONS,
        ...options,
      },
    );

    return mappedData;
  }

  static mapArrayData<DestinationClass, SourceData>(
    className: ClassConstructor<DestinationClass>,
    source: SourceData[],
    options?: ClassTransformOptions,
  ): DestinationClass[] {
    const mappedArrayData = source.map(function mapToSingle(
      item: SourceData,
    ): DestinationClass {
      return Mapper.mapData(className, item, options);
    });

    return mappedArrayData;
  }

  static mapToPlain<SourceData, DestinationType = Record<string, unknown>>(
    source: SourceData,
    options?: ClassTransformOptions,
  ): DestinationType {
    const mappedData = instanceToPlain<SourceData>(source, {
      ...this._DEFAULT_OPTIONS,
      ...options,
    }) as DestinationType;

    return mappedData;
  }

  static mapToArrayPlain<SourceData, DestinationType = Record<string, unknown>>(
    source: SourceData[],
    options?: ClassTransformOptions,
  ): DestinationType[] {
    const mappedArrayData = source.map(function mapToSinglePlain(
      item: SourceData,
    ): DestinationType {
      return Mapper.mapToPlain(item, options);
    });

    return mappedArrayData;
  }
}
