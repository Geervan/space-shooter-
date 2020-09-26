import { System } from 'ecsy';

import Types from '../../../shared/types';
import Messages from '../../../shared/messages';
import { Connection } from '../../../shared/components/connection';

export class NetworkEventSystem extends System {
  static queries = {
    connections: {
      components: [Connection]
    }
  };

  init(game) {
    this.game = game;
  }

  execute() {
    this.queries.connections.results.forEach((entity) => {
      const connection = entity.getComponent(Connection).value;

      while (connection.hasIncomingMessage()) {
        const message = connection.popMessage();

        switch (message.type) {
          case Types.Messages.GO:
            connection.pushMessage(new Messages.Hello('Nicky'));
            break;
          case Types.Messages.WELCOME: {
            const { id, position, rotation } = message.data;
            const connection = entity.getMutableComponent(Connection).value;
            connection.id = id;
            this.game.addPlayer(position, rotation);
            break;
          }
          case Types.Messages.SPAWN: {
            const { id, kind, position, rotation } = message.data;
            this.game.addEntity(id, kind, position, rotation);
            break;
          }
          case Types.Messages.DESPAWN: {
            const { id } = message.data;
            this.game.removeEntity(id);
            break;
          }
        }
      }
    });
  }
}
