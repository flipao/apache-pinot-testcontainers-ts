import {StartedTestContainer} from 'testcontainers';
import {container} from './testcontainers';

describe('test containers', () => {
  let startedContainer: StartedTestContainer;
  beforeAll(async () => {
    startedContainer = await container.start();
    console.log('Container started');
  });

  afterAll(async () => {
    await startedContainer.stop();
    console.log('Container stopped');
  });

  it('works', () => {
    console.log('Started container', startedContainer.getName());
    expect(startedContainer.getName()).not.toBeNull();
  });
});
