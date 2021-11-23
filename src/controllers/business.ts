import {Item, Promotion} from '../models'

type ItemsWithPromotion = {
  items: Item[],
  promotion: Promotion
}

// Receives an array of items and calculates the total
export function calculateTotals(items: Item[], promotions: Promotion[]) {
  let itemsWithPromotion: ItemsWithPromotion[] = []
  let itemsWithoutPromotion: Item[] = []
  let pendingItems = Array.from(items)

  // Get the items with promotions
  for (let i = 0; i < promotions.length; i++) {
    let promotionDone = false
    // Apply promotion
    while (!promotionDone) {
      const {inPromotion, outOfPromotion} = applyPromotion(pendingItems, promotions[i])
      pendingItems = outOfPromotion
      promotionDone = inPromotion.length === 0
      if (!promotionDone) {
        itemsWithPromotion = [
          ...itemsWithPromotion,
          {
            items: inPromotion,
            promotion: promotions[i]
          }
        ]
      }
    }
  }
  itemsWithoutPromotion = pendingItems
  const totals = {
    total: 0,
    taxTotal: 0,
    timeTotal: 0,
    appliedPromotions: new Set() as Set<string>,
    get subtotal() {return this.total - this.taxTotal}
  }

  // Calculate the required preparationTime
  items.forEach((item) => {
    totals.timeTotal += item.prepTime
  })

  // Calculate totals for items with Promotion
  for (const itemWithPromotion of itemsWithPromotion) {
    itemWithPromotion.items.forEach((item) => {
      let itemPrice = item.price
      if (itemWithPromotion.promotion.itemsDiscounted.includes(item.id!)) {
        // Apply amount discount if set
        if (itemWithPromotion.promotion.amount) {
          itemPrice = Math.max(itemPrice - itemWithPromotion.promotion.amount, 0)
        }
        // Apply percentage discount if set
        if (itemWithPromotion.promotion.percentage) {
          const discountAmount = itemWithPromotion.promotion.percentage * itemPrice
          itemPrice = Math.max(itemPrice - discountAmount, 0)
        }
      }
      const tax = itemPrice * item.taxRate
      totals.total += itemPrice
      totals.taxTotal += tax
      totals.appliedPromotions.add(itemWithPromotion.promotion.id!)
    })
  }
  // Calculate totals for items without Promotion
  itemsWithoutPromotion.forEach((item) => {
    const tax = item.price * item.taxRate
    totals.total += item.price
    totals.taxTotal += tax
  })
  return totals
}

// Apply a promotion by looping through the requirements and checking conditions
// OPTZE: This function can probably be optimized by ordering the elements and using a
// better set matching algorithm
function applyPromotion(items: Item[], promotion: Promotion) {
  const inPromotion = []
  const outOfPromotion = Array.from(items)
  for (const requiredItemId of promotion.itemsRequired) {
    for (let i = outOfPromotion.length - 1; i >= 0; i--) {
      const item = outOfPromotion[i]
      if (item.id === requiredItemId) {
        inPromotion.push(item)
        outOfPromotion.splice(i, 1)
        break
      }
    }
  }
  if (inPromotion.length === promotion.itemsRequired.length) {
    return {
      inPromotion,
      outOfPromotion
    }
  } else {
    return {
      inPromotion: [],
      outOfPromotion: items
    }
  }
}

function calculateTimeRequired(items: Item[]) {
  return
}

async function getPromotions(items: string[]) {

}


