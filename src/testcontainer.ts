import {
  TestContainer,
  StartedTestContainer,
  StoppedTestContainer,
  GenericContainer,
} from 'testcontainers';

const container: TestContainer = new GenericContainer('alpine');

export const startedContainer: StartedTestContainer = await container.start();
export const stoppedContainer: StoppedTestContainer =
  await startedContainer.stop();
