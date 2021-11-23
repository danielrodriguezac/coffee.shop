# coffee.shop

A primitive backend to handle coffee shop orders
## Database Setup

A mongodb database is required for the server to function, spin one up quickly with docker using the following command (you might want to change some of the switches depending on your current setup):

```
docker run --restart unless-stopped --name mongodb -p27017:27017 -d mongo
```

## Install dependencies

```sh
npm install
```

## Seeding example data

The following command will create Items and Promotions which will be used on the following steps

```sh
npm run migrate
```

## Run the application

```sh
npm start
```

Open http://127.0.0.1:3000 in your browser.

You can also explore and execute requests to the API via http://127.0.0.1:3000/explorer/

## Request sequence

Follow these steps to achieve the requested functionality

### Create a Customer

The first element that must be created is the Customer, only the name parameter is required. Remember you can use the explorer to execute these commands, there is also an OpenAPI spec, I think Postman can read those and give you a nice graphical interface if you find that more appealing

METHOD: POST
ROUTE: /customer

```
{
  "id": "619c1cd9163b032911597dd3",
  "name": "Daniel"
}
```

You will receive a new instance of Customer with an id, keep it somewhere safe, you will need it :)

### Get a list of the items available at the coffee shop

METHOD: GET
ROUTE: /items

You will receive something like the following with a few more elements, keep the ids of the desired items somewhere safe as well

```
[
  {
    "id": "6197f21799c987c205de910a",
    "name": "Small Espresso coffe",
    "price": 2,
    "prepTime": 180,
    "taxRate": 0.2
  },
  {
    "id": "6197f21799c987c205de910d",
    "name": "Donut",
    "price": 2,
    "prepTime": 30,
    "taxRate": 0.15
  }
  ...
]
```

### Get a list of the available promotions

Here you can browse the available promotions, two will be registered by the migration process

METHOD: GET
ROUTE: /promotions

```
[
  {
    "id": "619c190d44b8cb2512661623",
    "name": "Big combo",
    "description": "50% OFF on your large coffee if you take a Premium Donut",
    "itemsRequired": [
      "6197f21799c987c205de910b",
      "6197f21799c987c205de910e"
    ],
    "itemsDiscounted": [
      "6197f21799c987c205de910b"
    ],
    "percentage": 0.5
  },
  {
    "id": "619c190d44b8cb2512661624",
    "name": "Small combo",
    "description": "1$ OFF on your small coffee if you take a Donut",
    "itemsRequired": [
      "6197f21799c987c205de910d",
      "6197f21799c987c205de910a"
    ],
    "itemsDiscounted": [
      "6197f21799c987c205de910d",
      "6197f21799c987c205de910a"
    ],
    "amount": 0.5
  }
]
```

### Create a new Order

With the data obtained previously we can now request the creation of a new Order, please keep in mind we are sending the ids of the items we want and the id of the Customer, the rest of the fields are not required and promotions will be applied automatically. You can use the PUT method to update your order when needed

METHOD: Post
ROUTE: /orders

```
{
  "items": [
    "6197f21799c987c205de910a",
    "6197f21799c987c205de910d"
  ],
  "CustomerId": "619c1cd9163b032911597dd3"
}
```

You will receive a response that looks like this

```
{
  "id": "619d0cffbfc17eb1fbcccc6c",
  "items": [
    "6197f21799c987c205de910a",
    "6197f21799c987c205de910d"
  ],
  "promotions": [
    "619d08acb9fe11ae2701f905"
  ],
  "total": 3,
  "taxTotal": 0.525,
  "paymentStatus": "AWAITING_PAYMENT",
  "preparationStatus": "AWAITING_PAYMENT",
  "preparationTime": "210",
  "CustomerId": "619c1cd9163b032911597dd3"
}
```

Note that the promotion has already been applied lowering the price from 4$ to 3$, you can find the logic for this process in ./controllers/business.ts

### Paying for your order

Even though this is a POST method the id is retrieved from the URI for simplicity

METHOD: POST
ROUTE: /orders/pay/619d0cffbfc17eb1fbcccc6c

You will receive a response that looks like this:

```
{
  "paymentStatus": "PAID",
  "preparationStatus": "PREPARING",
  "nextPollSecs": "210"
}
```

You can use the nextPollSecs property to schedule the frontend polling for status updates using the route presented in the next section

### Receiving status checks

The simplest solution i could think of for this requirement was a sort of "directed polling" using the server response to determine when you should request for updates in order to notify the user

METHOD: GET
ROUTE: /orders/progress/619d120abfc17eb1fbcccc6d

The response as the order is being prepared will look like this:

```
{
  "paymentStatus": "PAID",
  "preparationStatus": "PREPARING",
  "nextPollSecs": 193.454
}
```

When the order is done you will receive the following:

```
{
  "paymentStatus": "PAID",
  "preparationStatus": "DONE",
  "nextPollSecs": 0
}
```

## Rebuild the project

To incrementally build the project:

```sh
npm run build
```

To force a full build by cleaning up cached artifacts:

```sh
npm run rebuild
```
