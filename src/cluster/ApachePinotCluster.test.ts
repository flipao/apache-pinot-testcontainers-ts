import { Network } from 'testcontainers';
import ApachePinotCluster from './ApachePinotCluster';

const testTimeout = 5 * 60 * 1000; // 5 minutes
describe('ApachePinotCluster', () => {
  describe('start', () => {
    it(
      'should start',
      async () => {
        const network = await new Network().start();
        const cluster = new ApachePinotCluster(
          'zookeeper:3.9.2',
          'apachepinot/pinot:latest-21-openjdk',
          false,
          network,
        );

        const actual = await cluster.start();

        expect(actual).toBe(true);

        expect(cluster.getBrokerPort()).toBeGreaterThan(0);
        expect(cluster.getControllerPort()).toBeGreaterThan(0);
      },
      testTimeout,
    );
  });
});
