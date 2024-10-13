import { TestContainer, GenericContainer } from 'testcontainers';

export const container: TestContainer = new GenericContainer('alpine');
