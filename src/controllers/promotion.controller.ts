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
import {Promotion} from '../models';
import {PromotionRepository} from '../repositories';

export class PromotionController {
  constructor(
    @repository(PromotionRepository)
    public promotionRepository: PromotionRepository,
  ) { }

  @get('/promotions/count')
  @response(200, {
    description: 'Promotion model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(Promotion) where?: Where<Promotion>,
  ): Promise<Count> {
    return this.promotionRepository.count(where);
  }

  @get('/promotions')
  @response(200, {
    description: 'Array of Promotion model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Promotion, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(Promotion) filter?: Filter<Promotion>,
  ): Promise<Promotion[]> {
    return this.promotionRepository.find(filter);
  }

  @get('/promotions/{id}')
  @response(200, {
    description: 'Promotion model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Promotion, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.filter(Promotion, {exclude: 'where'}) filter?: FilterExcludingWhere<Promotion>
  ): Promise<Promotion> {
    return this.promotionRepository.findById(id, filter);
  }

}
