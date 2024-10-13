import {
  GenericContainer,
  StartedNetwork,
  StartedTestContainer,
  Wait,
  WaitStrategy,
} from 'testcontainers';
import { logConsumer } from '../helpers/LogConsumer';

export default class ApachePinotCluster {
  private ZOOKEEPER_PORT = 2181;
  private ZOOKEEPER_ALIAS = 'zookeeper';

  private CONTROLLER_PORT = 9000;
  private CONTROLLER_ALIAS = 'pinot-controller';
  private CONTROLLER_COMMAND = [
    `StartController`,
    `-zkAddress`,
    `${this.ZOOKEEPER_ALIAS}:${this.ZOOKEEPER_PORT}`,
  ];

  private BROKER_PORT = 8099;
  private BROKER_ALIAS = 'pinot-broker';
  private BROKER_COMMAND = [
    `StartBroker`,
    `-zkAddress`,
    `${this.ZOOKEEPER_ALIAS}:${this.ZOOKEEPER_PORT}`,
  ];

  private SERVER_PORT = 8098;
  private SERVER_ALIAS = 'pinot-server';
  private SERVER_COMMAND = [
    `StartServer`,
    `-zkAddress`,
    `${this.ZOOKEEPER_ALIAS}:${this.ZOOKEEPER_PORT}`,
  ];

  private MINION_ALIAS = 'pinot-minion';
  private MINION_COMMAND = [
    `StartMinion`,
    `-zkAddress`,
    `${this.ZOOKEEPER_ALIAS}:${this.ZOOKEEPER_PORT}`,
  ];

  private zookeeper: GenericContainer;
  private pinotController: GenericContainer;
  private pinotBroker: GenericContainer;
  private pinotServer: GenericContainer;
  private pinotMinion?: GenericContainer;

  private startedZookeeper?: StartedTestContainer;
  private startedPinotController?: StartedTestContainer;
  private startedPinotBroker?: StartedTestContainer;
  private startedPinotServer?: StartedTestContainer;
  private startedPinotMinion?: StartedTestContainer;

  private startedContainers: StartedTestContainer[] = [];

  private enableMinion: boolean;

  constructor(
    zookeeperVersion: string,
    pinotVersion: string,
    enableMinion: boolean,
    network: StartedNetwork,
  ) {
    this.enableMinion = enableMinion;

    this.zookeeper = new GenericContainer(zookeeperVersion)
      .withNetwork(network)
      .withNetworkAliases(this.ZOOKEEPER_ALIAS)
      .withExposedPorts(this.ZOOKEEPER_PORT)
      .withEnvironment({
        ZOOKEEPER_CLIENT_PORT: this.ZOOKEEPER_PORT.toString(),
        ZOOKEEPER_TICK_TIME: '2000',
      })
      .withStartupTimeout(1 * 60 * 1000)
      .withLogConsumer(logConsumer(this.ZOOKEEPER_ALIAS));

    this.pinotController = new GenericContainer(pinotVersion)
      .withNetwork(network)
      .withNetworkAliases(this.CONTROLLER_ALIAS)
      //   .dependsOn(zookeeper)
      .withExposedPorts(this.CONTROLLER_PORT)
      .withEnvironment({
        JAVA_OPTS: this.getJavaOpts('1G', '4G'),
        LOG4J_CONSOLE_LEVEL: 'warn',
      })
      .withStartupTimeout(2 * 60 * 1000)
      .withCommand(this.CONTROLLER_COMMAND)
      .withWaitStrategy(this.getWaitStrategy('CONTROLLER'))
      .withLogConsumer(logConsumer(this.CONTROLLER_ALIAS));

    this.pinotBroker = new GenericContainer(pinotVersion)
      .withNetwork(network)
      .withNetworkAliases(this.BROKER_ALIAS)
      //   .dependsOn(pinotController)
      .withExposedPorts(this.BROKER_PORT)
      .withEnvironment({
        JAVA_OPTS: this.getJavaOpts('4G', '4G'),
        LOG4J_CONSOLE_LEVEL: 'warn',
      })
      .withCommand(this.BROKER_COMMAND)
      .withWaitStrategy(this.getWaitStrategy('BROKER'))
      .withLogConsumer(logConsumer(this.BROKER_ALIAS));

    this.pinotServer = new GenericContainer(pinotVersion)
      .withNetwork(network)
      .withNetworkAliases(this.SERVER_ALIAS)
      //   .dependsOn(pinotBroker)
      .withExposedPorts(this.SERVER_PORT)
      .withEnvironment({
        JAVA_OPTS: this.getJavaOpts('4G', '8G'),
        LOG4J_CONSOLE_LEVEL: 'warn',
      })
      .withCommand(this.SERVER_COMMAND)
      .withWaitStrategy(this.getWaitStrategy('SERVER'))
      .withLogConsumer(logConsumer(this.SERVER_ALIAS));

    if (enableMinion) {
      this.pinotMinion = new GenericContainer(pinotVersion)
        .withNetwork(network)
        .withNetworkAliases(this.MINION_ALIAS)
        // .dependsOn(pinotBroker)
        .withEnvironment({
          JAVA_OPTS: this.getJavaOpts('4G', '8G'),
          LOG4J_CONSOLE_LEVEL: 'warn',
        })
        .withCommand(this.MINION_COMMAND)
        .withWaitStrategy(this.getWaitStrategy('MINION'))
        .withLogConsumer(logConsumer(this.MINION_ALIAS));
    }
  }

  public async start(): Promise<boolean> {
    console.log('>>>>>> STARTING <<<<<<<<');
    this.startedZookeeper = await this.zookeeper.start();
    console.log('>>>>>> ZOOKEEPER STARTED <<<<<<<<');
    this.startedPinotController = await this.pinotController.start();
    console.log('>>>>>> PINOT CONTROLLER STARTED <<<<<<<<');
    this.startedPinotBroker = await this.pinotBroker.start();
    console.log('>>>>>> PINOT BROKER STARTED <<<<<<<<');
    this.startedPinotServer = await this.pinotServer.start();
    console.log('>>>>>> PINOT SERVER STARTED <<<<<<<<');
    if (this.pinotMinion) {
      this.startedPinotMinion = await this.pinotMinion.start();
      console.log('>>>>>> PINOT MINION STARTED <<<<<<<<');
    }
    console.log('>>>>>> ALL STARTED <<<<<<<<');

    return true;
  }

  public async stop(): Promise<boolean> {
    await this.startedPinotController?.stop();
    await this.startedPinotBroker?.stop();
    await this.startedPinotServer?.stop();
    await this.startedPinotMinion?.stop();
    await this.startedZookeeper?.stop();
    return true;
  }

  private getJavaOpts(xms: string, xmx: string): string {
    return `-Dplugins.dir=/opt/pinot/plugins -Xms${xms} -Xmx${xmx} -XX:+UseG1GC -XX:MaxGCPauseMillis=200`;
  }

  private getWaitStrategy(service: string): WaitStrategy {
    const regEx = new RegExp(
      `^(?:.*?)Started Pinot \\[${service}\\] instance(?:.*?)$`,
    );
    console.log('>>>>>>>>> REG EXP <<<<<<<<<<<', regEx);
    return Wait.forLogMessage(regEx);
  }

  getControllerPort(): number | undefined {
    return this.startedPinotController?.getMappedPort(this.CONTROLLER_PORT);
  }

  getBrokerPort(): number | undefined {
    return this.startedPinotBroker?.getMappedPort(this.BROKER_PORT);
  }
}
