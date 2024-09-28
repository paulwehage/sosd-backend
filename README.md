
# Software Sustainability Dashboard Backend (SOSD)

This repository contains two main directories: `api` and `database`. The `database` directory includes a Docker Compose file for starting a MySQL container and a phpMyAdmin container. The `api` directory contains a NestJS and Prisma backend application.

## Prerequisites

Before you begin, ensure you have met the following requirements:

- **Docker**: Make sure Docker is installed on your machine. You can download it from [Docker's official website](https://www.docker.com/get-started).
- **Node.js and npm**: Ensure Node.js and npm are installed. You can download them from [Node.js official website](https://nodejs.org/).
- **Git**: Ensure Git is installed for version control. You can download it from [Git's official website](https://git-scm.com/).
- **Chromium**: Ensure Chromium is installed for running tests. You can download it from [Chromium's official website](https://www.chromium.org/).

## Getting Started

Follow these instructions to set up and run the project on your local machine.

### Clone the Repository

```sh
git clone git@github.com:paulwehage/sosd-backend.git
cd sosd-backend
```

### Setting up the Database

1. Navigate to the `database` directory:

    ```sh
    cd database
    ```

2. Start the MySQL and phpMyAdmin containers using Docker Compose:

    ```sh
    docker-compose up -d
    ```

   This will start the MySQL container and phpMyAdmin container in detached mode.

3. Access phpMyAdmin:

   Open your browser and go to `http://localhost:8080`. You can log in using the following credentials:

   - **Server**: `mysql`
   - **Username**: `root`
   - **Password**: `root_password`

   Note: You can change these credentials in the `docker-compose.yml` file if needed.

4. Prisma Setup:

   1. Go back to the root of the repository and navigate to the `api` directory:

      ```sh
      cd ../api
      ```

   2. Run the following command to apply the Prisma schema to the database:

      ```sh
      npx prisma db push
      ```

   3. After the migration is applied, you can seed the database with example data:

      ```sh
      npx prisma db seed
      ```

### Setting up the API

1. Navigate to the `api` directory:

    ```sh
    cd ../api
    ```

2. Install the dependencies:

    ```sh
    npm install
    ```

3. Start the NestJS application:

    ```sh
    npm run start
    ```

   This will start the API server in development mode.

### Testing the API

1. Once the API server is running, you can access it at `http://localhost:3000`.

2. Use tools like Postman or curl to test the API endpoints.

## Swagger Documentation

The API documentation is available at `http://localhost:3000/api`.

## Directory Structure

```plaintext
├── api
│   ├── prisma
|   |   ├── schema.prisma
|   |   ├── seed.ts
|   |   ├── seed-data.json
│   ├── src
|   |   ├── controllers
|   |   ├── services
|   |   ├── dtos
|   |   ├── app.module.ts
|   |   ├── main.ts
│   ├── test
│   ├── .env.example
│   ├── nest-cli.json
│   ├── package.json
│   ├── tsconfig.json
│   └── tsconfig.build.json
├── database
│   ├── docker-compose.yml
└── README.md
```

## Troubleshooting

- **Database Connection Issues**: Ensure the Docker containers are running and the database credentials in the `.env` file are correct.
- **Port Conflicts**: If the default ports (3306 for MySQL, 8080 for phpMyAdmin, 3000 for the API) are in use, you can change them in the respective configurations.
