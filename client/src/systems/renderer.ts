import {System} from 'ecsy';
import Position from '../components/position';
import Renderable from '../components/renderable';
import Shape from '../components/shape';

export default class Renderer extends System {
  // Define a query of entities that have 'Renderable' and 'Shape' components
  static queries = {
    renderables: { components: [Renderable, Shape, Position] }
  };

  public queries: any;

  private shapeSize: number;
  private shapeHalfSize: number;
  private canvasWidth: number;
  private canvasHeight: number;
  private ctx: CanvasRenderingContext2D;

  init() {
    this.shapeSize = 50;
    this.shapeHalfSize = this.shapeSize / 2;

    let canvas = document.querySelector('canvas');
    this.canvasWidth = canvas.width = window.innerWidth;
    this.canvasHeight = canvas.height = window.innerHeight;
    this.ctx = canvas.getContext('2d');

    window.addEventListener('resize', () => {
      this.canvasWidth = canvas.width = window.innerWidth
      this.canvasHeight = canvas.height = window.innerHeight;
    }, false);
  }

  // This method will get called on every frame by default
  execute(delta: number, time: number) {

    this.ctx.fillStyle = '#d4d4d4';
    this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    // Iterate through all the entities on the query
    this.queries.renderables.results.forEach((entity: any) => {
      var shape = entity.getComponent(Shape);
      var position = entity.getComponent(Position);
      if (shape.primitive === 'box') {
        this.drawBox(position);
      } else {
        this.drawCircle(position);
      }
    });
  }

  drawCircle(position: Position) {
    this.ctx.beginPath();
    this.ctx.arc(position.x, position.y, this.shapeHalfSize, 0, 2 * Math.PI, false);
    this.ctx.fillStyle= '#39c495';
    this.ctx.fill();
    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = '#0b845b';
    this.ctx.stroke();
  }

  drawBox(position: Position) {
    this.ctx.beginPath();
    this.ctx.rect(position.x - this.shapeHalfSize, position.y - this.shapeHalfSize, this.shapeSize, this.shapeSize);
    this.ctx.fillStyle= '#e2736e';
    this.ctx.fill();
    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = '#b74843';
    this.ctx.stroke();
  }
}
