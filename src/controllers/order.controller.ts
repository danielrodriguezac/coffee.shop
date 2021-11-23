import {
  Count,
  CountSchema, DataObject, Filter,
  FilterExcludingWhere,
  repository,
  Where
} from '@loopback/repository';
import {
  del, get,
  getModelSchemaRef, HttpErrors, param, post, put, requestBody,
  response,
  ResponseObject
} from '@loopback/rest';
import {Order, PAYMENT_STATUSES, PREPARATION_STATUSES} from '../models';
import {CustomerRepository, ItemRepository, OrderRepository, PromotionRepository} from '../repositories';
import {calculateTotals} from './business';


//OpenAPI response for checkProgress()
const CHECK_PROGRESS_RESPONSE: ResponseObject = {
  description: 'Returns the current status of the order with the given id, use the response to determine the polling interval',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        title: 'PingResponse',
        properties: {
          paymentStatus: {type: 'string'},
          preparationStatus: {type: 'string'},
          nextPollSecs: {type: 'number'}
        },
      },
    },
  },
}
type ProgressReport = {
  paymentStatus: string,
  preparationStatus: string,
  nextPollSecs: number
}
export class OrderController {
  constructor(
    @repository(OrderRepository)
    public orderRepository: OrderRepository,
    @repository(ItemRepository)
    public itemRepository: ItemRepository,
    @repository(PromotionRepository)
    public promotionRepository: PromotionRepository,
    @repository(CustomerRepository)
    public customerRepository: CustomerRepository,
  ) { }

  @post('/orders')
  @response(200, {
    description: 'Order model instance',
    content: {'application/json': {schema: getModelSchemaRef(Order)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Order, {
            title: 'NewOrder',
            exclude: ['id'],
          }),
        },
      },
    })
    order: Omit<Order, 'id'>,
  ): Promise<Order> {
    const newOrder = await this.buildOrder(order)
    return this.orderRepository.create(newOrder)
  }

  @get('/orders/count')
  @response(200, {
    description: 'Order model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(Order) where?: Where<Order>,
  ): Promise<Count> {
    return this.orderRepository.count(where);
  }

  @get('/orders')
  @response(200, {
    description: 'Array of Order model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Order, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(Order) filter?: Filter<Order>,
  ): Promise<Order[]> {
    return this.orderRepository.find(filter);
  }

  @get('/orders/{id}')
  @response(200, {
    description: 'Order model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Order, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.filter(Order, {exclude: 'where'}) filter?: FilterExcludingWhere<Order>
  ): Promise<Order> {
    return this.orderRepository.findById(id, filter);
  }

  @put('/orders/{id}')
  @response(204, {
    description: 'Update a order instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Order, {includeRelations: true}),
      },
    },
  })
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() order: Order,
  ): Promise<Order> {
    const targetOrder = await this.orderRepository.findById(id)
    if (!targetOrder) {
      throw HttpErrors(404, 'The order does not exist')
    }
    if (
      targetOrder.paymentStatus !== PAYMENT_STATUSES.AWAITING_PAYMENT
      || targetOrder.preparationStatus !== PREPARATION_STATUSES.AWAITING_PAYMENT
    ) {
      throw HttpErrors(405, 'The order has already been paid for/is being prepared')
    }
    const newOrder = await this.buildOrder(order)
    await this.orderRepository.replaceById(id, newOrder)
    return this.orderRepository.findById(id)
  }

  @del('/orders/{id}')
  @response(204, {
    description: 'Order DELETE success',
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    const targetOrder = await this.orderRepository.findById(id)
    if (!targetOrder) {
      throw HttpErrors(404, 'The order does not exist')
    }
    if (
      targetOrder.paymentStatus !== PAYMENT_STATUSES.AWAITING_PAYMENT
      || targetOrder.preparationStatus !== PREPARATION_STATUSES.AWAITING_PAYMENT
    ) {
      throw HttpErrors(405, 'The order has already been paid for/is being prepared')
    }
    await this.orderRepository.deleteById(id);
  }

  @post('/orders/pay/{id}')
  @response(204, CHECK_PROGRESS_RESPONSE)
  async pay(
    @param.path.string('id') id: string,
  ): Promise<ProgressReport> {

    const targetOrder = await this.orderRepository.findById(id);
    if (!targetOrder) {
      throw HttpErrors(404, 'The order does not exist')
    }
    if (
      targetOrder.paymentStatus !== PAYMENT_STATUSES.AWAITING_PAYMENT
      || targetOrder.preparationStatus !== PREPARATION_STATUSES.AWAITING_PAYMENT
    ) {
      throw HttpErrors(405, 'The order has already been paid')
    }
    await this.orderRepository.updateById(targetOrder.id, {
      paymentStatus: PAYMENT_STATUSES.PAID,
      preparationStatus: PREPARATION_STATUSES.PREPARING,
      paymentTimestamp: Date.now()
    })

    const {paymentStatus, preparationStatus, preparationTime} = await this.orderRepository.findById(targetOrder.id)
    return {
      paymentStatus,
      preparationStatus,
      nextPollSecs: preparationTime
    }
  }

  @get('/orders/progress/{id}')
  @response(200, CHECK_PROGRESS_RESPONSE)
  async checkProgress(
    @param.path.string('id') id: string
  ): Promise<ProgressReport> {
    const targetOrder = await this.orderRepository.findById(id)
    if (!targetOrder) {
      throw HttpErrors(404, 'The order does not exist')
    }
    if (targetOrder.paymentStatus !== PAYMENT_STATUSES.PAID) {
      throw HttpErrors(402, 'The order has not been paid')
    }
    const preparationTimeRemaining = Math.max((targetOrder.preparationTime * 1000) - (Date.now() - targetOrder.paymentTimestamp), 0)
    if (preparationTimeRemaining === 0) {
      // Order is done
      await this.orderRepository.updateById(targetOrder.id, {
        preparationStatus: PREPARATION_STATUSES.DONE
      })
    }

    const {paymentStatus, preparationStatus} = await this.orderRepository.findById(targetOrder.id)
    return {
      paymentStatus,
      preparationStatus,
      nextPollSecs: preparationTimeRemaining / 1000
    }
  }

  async buildOrder(order: Omit<Order, 'id'>,) {
    const items = await this.itemRepository.find({
      where: {
        id: {
          inq: [...order.items]
        }
      }
    })

    const promotions = await this.promotionRepository.find({
      where: {
        active: true
      }
    })

    const customer = await this.customerRepository.findOne({
      where: {
        id: order.CustomerId
      }
    })
    if (!customer) {
      throw HttpErrors(422, 'Customer not found')
    }

    const {total, taxTotal, timeTotal, appliedPromotions} = calculateTotals(items, promotions)
    const newOrder: DataObject<Order> = {
      items: items.map((item) => item.id!),
      promotions: Array.from(appliedPromotions).map((promotionId) => promotionId),
      paymentStatus: PAYMENT_STATUSES.AWAITING_PAYMENT,
      preparationStatus: PREPARATION_STATUSES.AWAITING_PAYMENT,
      CustomerId: customer.id!,
      preparationTime: timeTotal,
      total,
      taxTotal
    }
    return newOrder
  }
}


