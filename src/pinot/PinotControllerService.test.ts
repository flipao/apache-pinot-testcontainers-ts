import { readFileSync } from 'fs';
import { Network } from 'testcontainers';
import ApachePinotCluster from '../cluster/ApachePinotCluster';
import { PinotControllerService } from './PinotControllerService';

function delay(time: number) {
  return new Promise(resolve => setTimeout(resolve, time));
}

describe('PinotControllerService', () => {
  let cluster: ApachePinotCluster;
  let endpoint: string;

  beforeAll(async () => {
    const network = await new Network().start();
    cluster = new ApachePinotCluster(
      'zookeeper:3.9.2',
      'apachepinot/pinot:latest-21-openjdk',
      false,
      network,
    );
    await cluster.start();

    endpoint = `http://localhost:${cluster.getControllerPort()}`;
  });

  afterAll(async () => {
    await cluster.stop();
  });

  describe('createSchema', () => {
    it('Should create schema', async () => {
      const schemaConfig = readFileSync(
        'resources/transcript/transcript-schema.json',
        { encoding: 'utf-8', flag: 'r' },
      );

      const service = new PinotControllerService(endpoint);
      const actual = await service.createSchema(schemaConfig);

      expect(actual).toBeTruthy();
    }, 60_000);
  });

  describe('createTable', () => {
    it('Should create table', async () => {
      const tableConfig = readFileSync(
        'resources/transcript/transcript-table-offline.json',
        { encoding: 'utf-8', flag: 'r' },
      );

      const service = new PinotControllerService(endpoint);
      const actual = await service.createTable(tableConfig);

      expect(actual).toBeTruthy();
    }, 300_000);
  });

  describe('ingestFromFile', () => {
    it('Should ingest csv file', async () => {
      const inputFile = readFileSync('resources/transcript/transcripts.csv', {
        encoding: 'utf-8',
        flag: 'r',
      });

      const service = new PinotControllerService(endpoint);
      const actual = await service.ingestFromFile(
        'transcript_OFFLINE',
        inputFile,
      );

      console.log(`WAITING at `, endpoint);
      await delay(120_000);

      expect(actual).toBeTruthy();
    }, 300_000);
  });
});
