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
