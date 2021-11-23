import {Entity, model, property} from '@loopback/repository';

export enum PAYMENT_STATUSES {
  AWAITING_PAYMENT = 'AWAITING_PAYMENT',
  PAID = 'PAID'
}

export enum PREPARATION_STATUSES {
  AWAITING_PAYMENT = 'AWAITING_PAYMENT',
  PREPARING = 'PREPARING',
  DONE = 'DONE'
}

@model()
export class Order extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: true,
  })
  id?: string;

  @property({
    type: 'array',
    itemType: 'string',
    required: true,
  })
  items: string[];

  @property({
    type: 'array',
    itemType: 'string',
    required: false,
  })
  promotions: string[];

  @property({
    type: 'number',
    required: false,
  })
  total: number;

  @property({
    type: 'number',
    required: false,
  })
  taxTotal: number;

  @property({
    type: 'string',
    required: false,
    jsonSchema: {
      enum: Object.values(PAYMENT_STATUSES),
    },
  })
  paymentStatus: PAYMENT_STATUSES;

  @property({
    type: 'number',
    required: false,
    hidden: true
  })
  paymentTimestamp: number;

  @property({
    type: 'string',
    required: false,
    jsonSchema: {
      enum: Object.values(PREPARATION_STATUSES),
    },
  })
  preparationStatus: PREPARATION_STATUSES;

  @property({
    type: 'string',
    required: false,
    description: 'Number of seconds required to prepare the order'
  })
  preparationTime: number;

  @property({
    type: 'string',
    required: true
  })
  CustomerId: string;

  constructor(data?: Partial<Order>) {
    super(data);
  }
}

export interface OrderRelations {
  // describe navigational properties here
}

export type OrderWithRelations = Order & OrderRelations;
