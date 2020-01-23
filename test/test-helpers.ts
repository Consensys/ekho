/**
 * A jest.Mock of a repository so Providers or modules which depend on them can be unit-tested.
 * Implementation of methods exposed here can be mocked in place.
 */
export const mockRepository = jest.fn(() => {
  return {
    metadata: {
      columns: [],
      relations: [],
    },
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneOrFail: jest.fn(),
    delete: jest.fn(),
  };
});

export interface StringIndexedObject {
  [name: string]: StringIndexedObject | string;
}

/**
 * Mock a ConfigService which takes a config object and can get values from within that object.
 * @param values A config object, or just the subset of the config object being used in this test.
 * @returns object with a function 'get' which takes a dot-seperated path to a config property on 'values' and returns it.
 */
export const mockConfigService = (values: StringIndexedObject) => {
  const mockedConfigServiceGetter = get(values);
  return {
    get: mockedConfigServiceGetter,
  };
};

const get = (values: StringIndexedObject) => (dotSeperatedPath: string = '') => {
  const path = dotSeperatedPath.split('.');
  const [firstKey, ...childKeys] = path;
  return getIn(values, firstKey, ...childKeys);
};

const getIn = (obj: StringIndexedObject, currentKey: string, ...deeperKeys: string[]): string => {
  const [nextDeepestKey, ...rest] = deeperKeys;
  const val = obj[currentKey];

  return typeof val === 'object' ? getIn(val, nextDeepestKey, ...rest) : val;
};
