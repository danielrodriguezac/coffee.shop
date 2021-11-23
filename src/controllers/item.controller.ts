import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where
} from '@loopback/repository';
import {
  get,
  getModelSchemaRef, param, response
} from '@loopback/rest';
import {Item} from '../models';
import {ItemRepository} from '../repositories';

export class ItemController {
  constructor(
    @repository(ItemRepository)
    public itemRepository: ItemRepository,
  ) { }

  @get('/items/count')
  @response(200, {
    description: 'Item model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(Item) where?: Where<Item>,
  ): Promise<Count> {
    return this.itemRepository.count(where);
  }

  @get('/items')
  @response(200, {
    description: 'Array of Item model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Item, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(Item) filter?: Filter<Item>,
  ): Promise<Item[]> {
    return this.itemRepository.find(filter);
  }

  @get('/items/{id}')
  @response(200, {
    description: 'Item model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Item, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.filter(Item, {exclude: 'where'}) filter?: FilterExcludingWhere<Item>
  ): Promise<Item> {
    return this.itemRepository.findById(id, filter);
  }

}
