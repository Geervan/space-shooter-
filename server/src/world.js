import { performance } from 'perf_hooks';
import { World as World$1 } from 'ecsy';

import logger from './utils/logger';
import { Connection } from './components/connection';
import { NetworkEvent } from './components/network-event';
import { HelloMessage } from './components/messages/hello-message';
import { NetworkEventSystem } from './systems/network-event-system';
import { NetworkMessageSystem } from './systems/network-message-system';

export default class World {
  constructor(id, maxPlayers, server) {
    this.id = id;
    this.maxPlayers = maxPlayers;
    this.server = server;
    this.updatesPerSecond = 10;
    this.lastTime = performance.now();

    this.players = {};

    this.playerCount = 0;

    this.world = new World$1()
      .registerComponent(Connection)
      .registerComponent(NetworkEvent)
      .registerComponent(HelloMessage)
      .registerSystem(NetworkEventSystem)
      .registerSystem(NetworkMessageSystem);
    
    logger.info(`${this.id} running`);
  }
  
  run() {
    setTimeout(this.run.bind(this), 1000/this.updatesPerSecond);

    let time = performance.now();
    let delta = time - this.lastTime;

    if (delta > 250) {
      delta = 250;
    }

    this.world.execute(delta, time);
    
    this.lastTime = time;
  }

  handlePlayerConnect(connection) {
    logger.debug(`Creating player ${connection.id}`);
    this.players[connection.id] = this.world
      .createEntity()
      .addComponent(Connection, { value: connection });
    this.playerCount++;
    
    connection.onMessage((message) => {
      const type = message.shift();
      this.players[connection.id].addComponent(NetworkEvent, { type, message });
    });

    connection.onDisconnect(() => {
      this.handlePlayerDisconnect(connection);
    });

    connection.send('go');
  }
  
  handlePlayerDisconnect(connection) {
    logger.debug(`Deleting player ${connection.id}`);
    this.players[connection.id].remove();
    delete this.players[connection.id];
    this.playerCount--;
  }
}
