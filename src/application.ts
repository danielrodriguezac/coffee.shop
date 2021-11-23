import {BootMixin} from '@loopback/boot';
import {ApplicationConfig} from '@loopback/core';
import {RepositoryMixin, SchemaMigrationOptions} from '@loopback/repository';
import {RestApplication} from '@loopback/rest';
import {
  RestExplorerBindings,
  RestExplorerComponent
} from '@loopback/rest-explorer';
import {ServiceMixin} from '@loopback/service-proxy';
import path from 'path';
import {ItemRepository, PromotionRepository} from './repositories';
import {MySequence} from './sequence';

const NAMES_SMALL_EXPRESSO = 'Small Espresso coffe'
const NAMES_LARGE_EXPRESSO = 'Large Espresso coffe'
const NAMES_DONUT = 'Donut'
const NAMES_PREMIUM_DONUT = 'Premium donut'

export {ApplicationConfig};

export class CoffeeShopApplication extends BootMixin(
  ServiceMixin(RepositoryMixin(RestApplication)),
) {
  constructor(options: ApplicationConfig = {}) {
    super(options);

    // Set up the custom sequence
    this.sequence(MySequence);

    // Set up default home page
    this.static('/', path.join(__dirname, '../public'));

    // Customize @loopback/rest-explorer configuration here
    this.configure(RestExplorerBindings.COMPONENT).to({
      path: '/explorer',
    });
    this.component(RestExplorerComponent);

    this.projectRoot = __dirname;
    // Customize @loopback/boot Booter Conventions here
    this.bootOptions = {
      controllers: {
        // Customize ControllerBooter Conventions here
        dirs: ['controllers'],
        extensions: ['.controller.js'],
        nested: true,
      },
    };
  }

  // Seed database
  async migrateSchema(options?: SchemaMigrationOptions) {
    await super.migrateSchema(options);

    const itemRepo = await this.getRepository(ItemRepository);
    const itemsFound = await itemRepo.count();
    if (itemsFound.count > 0) {
      console.log('Item seeding skipped')
      // itemRepo.updateById(found.id, {isComplete: false});
    } else {
      console.log('Seeding items...')
      await itemRepo.createAll([
        {
          name: NAMES_SMALL_EXPRESSO,
          price: 2,
          prepTime: 3 * 60,
          taxRate: 0.2
        },
        {
          name: NAMES_LARGE_EXPRESSO,
          price: 3.5,
          prepTime: 5 * 60,
          taxRate: 0.2
        },
        {
          name: 'Vanilla latte coffee',
          price: 5,
          prepTime: 5 * 60,
          taxRate: 0.2
        },
        {
          name: NAMES_DONUT,
          price: 2,
          prepTime: 30,
          taxRate: 0.15
        },
        {
          name: NAMES_PREMIUM_DONUT,
          price: 3,
          prepTime: 30,
          taxRate: 0.15
        },
        {
          name: 'Cheesy bread',
          price: 2.5,
          prepTime: 30,
          taxRate: 0.15
        },
      ]);
    }








    const promotionRepo = await this.getRepository(PromotionRepository);
    const promotionsFound = await promotionRepo.count();
    if (promotionsFound.count > 0) {
      console.log('Promotion seeding skipped')
      // promotionRepo.updateById(found.id, {isComplete: false});
    } else {
      console.log('Seeding promotions...')

      const largeComboItems = await itemRepo.find({
        where: {
          or: [
            {name: NAMES_PREMIUM_DONUT},
            {name: NAMES_LARGE_EXPRESSO}
          ]
        },
        order: [
          'name ASC'
        ]
      })

      const smallComboItems = await itemRepo.find({
        where: {
          or: [
            {name: NAMES_DONUT},
            {name: NAMES_SMALL_EXPRESSO}
          ]
        },
        order: [
          'name ASC'
        ]
      })

      await promotionRepo.createAll([
        {
          name: 'Big combo',
          active: true,
          description: '50% OFF on your large coffee if you take a Premium Donut',
          itemsRequired: [
            largeComboItems[0].id,
            largeComboItems[1].id,
          ],
          itemsDiscounted: [largeComboItems[0].id,],
          percentage: 0.50
        },
        {
          name: 'Small combo',
          active: true,
          description: '1$ OFF on your small coffee if you take a Donut',
          itemsRequired: [
            smallComboItems[0].id,
            smallComboItems[1].id,
          ],
          itemsDiscounted: [
            smallComboItems[0].id,
            smallComboItems[1].id,
          ],
          amount: 0.50
        },
      ]);

    }
  }
}
