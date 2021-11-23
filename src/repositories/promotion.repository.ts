import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {MongoDataSource} from '../datasources';
import {Promotion, PromotionRelations} from '../models';

export class PromotionRepository extends DefaultCrudRepository<
  Promotion,
  typeof Promotion.prototype.id,
  PromotionRelations
> {
  constructor(
    @inject('datasources.mongo') dataSource: MongoDataSource,
  ) {
    super(Promotion, dataSource);
  }
}
