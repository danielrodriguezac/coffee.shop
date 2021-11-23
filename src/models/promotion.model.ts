import {Entity, model, property} from '@loopback/repository';

@model()
export class Promotion extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: true,
  })
  id?: string;

  @property({
    type: 'string',
  })
  name?: string;

  @property({
    type: 'boolean',
    hidden: true
  })
  active: boolean;

  @property({
    type: 'string',
  })
  description?: string;

  @property({
    type: 'array',
    itemType: 'string',
    required: true,
  })
  itemsRequired: string[];

  @property({
    type: 'array',
    itemType: 'string',
    required: true,
  })
  itemsDiscounted: string[];

  @property({
    type: 'number',
  })
  percentage?: number;

  @property({
    type: 'number',
  })
  amount?: number;

  constructor(data?: Partial<Promotion>) {
    super(data);
  }
}

export interface PromotionRelations {
  // describe navigational properties here
}

export type PromotionWithRelations = Promotion & PromotionRelations;
