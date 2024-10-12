import {hello} from './hello';

describe('hello', () => {
  describe('hello', () => {
    it('should return string', () => {
      const expected = 'Hello test!';

      const actual = hello('test');

      expect(actual).toBe(expected);
    });
  });
});
