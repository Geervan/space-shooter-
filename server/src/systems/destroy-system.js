import { System } from 'ecsy';

import Messages from '../../../shared/messages';

import { Connection } from '../../../shared/components/connection';
import { Playing } from '../../../shared/components/playing';
import { Destroy } from '../components/destroy';
import { Respawn } from '../components/respawn';
import { SpaceshipController } from '../../../shared/components/spaceship-controller';
import { Transform } from '../components/transform';
import { Kind } from '../../../shared/components/kind';

export class DestroySystem extends System {
  static queries = {
    entities: {
      components: [Destroy]
    }
  };

  init(worldServer) {
    this.worldServer = worldServer;
  }

  execute(_delta, _time) {
    this.queries.entities.results.forEach((entity) => {
      if (entity.hasComponent(Connection)) {
        if (entity.hasComponent(Playing)) {
          this.worldServer.broadcast(new Messages.Despawn(entity.worldId), entity.worldId);
        }
      } else {
          this.worldServer.broadcast(new Messages.Despawn(entity.worldId));
      }

      if (entity.hasComponent(Respawn)) {
        const timer = entity.getComponent(Respawn).timer;

        // Currently can only respawn spaceship players
        if (entity.hasComponent(SpaceshipController)) {
          const controller = entity.getComponent(SpaceshipController);

          if (controller.hasPlayerAttached()) {
            const connection = controller.player.getComponent(Connection).value;

            setTimeout(() => {
                const spaceship = this.worldServer.addPlayer(connection.id);
                const { position, rotation, scale } = spaceship.getComponent(Transform);
                const kind = spaceship.getComponent(Kind).value;

                connection.pushMessage(new Messages.Welcome(
                  spaceship.worldId,
                  'todo: decouple playerObject from Welcome msg',
                  kind,
                  position,
                  rotation,
                  scale
                ));

                this.worldServer.broadcast(new Messages.Spawn(
                  spaceship.worldId,
                  kind,
                  position,
                  rotation,
                  scale
                ), connection.id);
            }, timer);
          }
        }
      }

      delete this.worldServer.entities[entity.worldId];
      entity.remove();
    });
  }
}
