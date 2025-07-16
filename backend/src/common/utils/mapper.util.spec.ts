import { plainToClass, instanceToPlain } from 'class-transformer';
import { Mapper } from './mapper.util';

jest.mock('class-transformer');

describe('Mapper', () => {
  const mockPlainToClass = plainToClass as jest.Mock;
  const mockInstanceToPlain = instanceToPlain as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('mapData', () => {
    it('should map plain object to class instance', () => {
      const mockClass = class TestClass {};
      const mockSource = { id: 1, name: 'test' };
      const mockResult = new mockClass();
      mockPlainToClass.mockReturnValue(mockResult);

      const result = Mapper.mapData(mockClass, mockSource);

      expect(mockPlainToClass).toHaveBeenCalledWith(mockClass, mockSource, {
        excludeExtraneousValues: true,
        exposeDefaultValues: true,
      });
      expect(result).toBe(mockResult);
    });

    it('should use custom options when provided', () => {
      const mockClass = class TestClass {};
      const mockSource = { id: 1, name: 'test' };
      const customOptions = { excludeExtraneousValues: false };

      Mapper.mapData(mockClass, mockSource, customOptions);

      expect(mockPlainToClass).toHaveBeenCalledWith(mockClass, mockSource, {
        excludeExtraneousValues: false,
        exposeDefaultValues: true,
      });
    });
  });

  describe('mapArrayData', () => {
    it('should map array of plain objects to class instances', () => {
      const mockClass = class TestClass {};
      const mockSource = [
        { id: 1, name: 'test1' },
        { id: 2, name: 'test2' },
      ];
      const mockResult = [new mockClass(), new mockClass()];
      mockPlainToClass
        .mockReturnValueOnce(mockResult[0])
        .mockReturnValueOnce(mockResult[1]);

      const result = Mapper.mapArrayData(mockClass, mockSource);

      expect(mockPlainToClass).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockResult);
    });
  });

  describe('mapToPlain', () => {
    it('should map class instance to plain object', () => {
      const mockSource = { id: 1, name: 'test' };
      const mockResult = { id: 1, name: 'test' };
      mockInstanceToPlain.mockReturnValue(mockResult);

      const result = Mapper.mapToPlain(mockSource);

      expect(mockInstanceToPlain).toHaveBeenCalledWith(mockSource, {
        excludeExtraneousValues: true,
        exposeDefaultValues: true,
      });
      expect(result).toBe(mockResult);
    });
  });

  describe('mapToArrayPlain', () => {
    it('should map array of class instances to plain objects', () => {
      const mockSource = [
        { id: 1, name: 'test1' },
        { id: 2, name: 'test2' },
      ];
      const mockResult = [
        { id: 1, name: 'test1' },
        { id: 2, name: 'test2' },
      ];
      mockInstanceToPlain
        .mockReturnValueOnce(mockResult[0])
        .mockReturnValueOnce(mockResult[1]);

      const result = Mapper.mapToArrayPlain(mockSource);

      expect(mockInstanceToPlain).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockResult);
    });
  });
});
