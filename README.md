# INVENTORY MANAGER

This is an [Express](https://expressjs.com/) REST API built on a [PostgreSql](https://www.postgresql.org/) database using [Prisma Client](https://www.prisma.io/docs/concepts/components/prisma-client).

## Getting started

### 1. clone the repository and install dependencies

Clone the repository:

```bash
git clone git@github.com:Veraclins/Inventory-Manager.git
```

Install dependencies:

```bash
cd Inventory-Manager
yarn
```

### 2. Create and setup the database

Create a .env file by copying the provided .env.example file

``` bash
cp .env.example .env
```

Update `DATABASE_URL` replacing `<computer username here>` with your computer username (your can run the command below on your command line to get your username)

```bash
whoami
```

Run the following command to create your postgres database. This also creates the `Item` and `Lot` tables that are defined in [`prisma/schema.prisma`](./prisma/schema.prisma):

```bash
yarn migrate:dev
```

### 3. Start the REST API server

```bash
yarn dev
```

The server is now running on `http://localhost:3000`. You can now send requests to the API, e.g. [`http://localhost:3000`](http://localhost:3000/).

## Using the REST API

You can access the REST API of the server using the following endpoints:

### `GET`

- `/`: Fetch all inventory items in the database: This returns an array of all available items or an empty array. This is useful for getting the ID of an item for further request
- `/:id/quantity`: Get the quantity of valid (unexpired) items and the earliest expiry (`validTill`) as a JSON object of the form

  ```json
  {
    quantity: 20,
    validTill: 1641637497456
  }
  ```

  If no valid item is found, it returns 0 for `quantity: 0` and `validTill: null`

### `POST`

- `/`: Create a new inventory item
  - Body:
    - `name: String` (required): The name of the item (for easy identification)
- `/:id/add`: Add a new item lot to the inventory
  - Body:
    - `quantity: Number` (required): The quantity of items in this lot
    - `expiry: Number` (required): The expiry time in milliseconds-since-epoch representing the expiry time of this lot
- `/:id/sell`: Sell a quantity of the item
  - Body:
    - `quantity: Number` (required): The quantity of items to be sold

## Deployed API

The API is publicly available [here](https://clinton-inventory.herokuapp.com/start)
