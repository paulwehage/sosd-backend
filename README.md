
# Software Sustainability Dashboard Backend (SOSD)

This repository contains two main directories: `api` and `database`. The `database` directory includes a Docker Compose file for starting a MySQL container and a phpMyAdmin container, along with a database schema `sosd_schema`. The `api` directory contains a NestJS backend application.

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

4. Import the `sosd_schema`:

   - Click on the `Import` tab in phpMyAdmin.
   - Select the `sosd_schema.sql` file from the `database` directory and import it.

### Setting up the API

1. Navigate to the `api` directory:

    ```sh
    cd ../api
    ```

2. Install the dependencies:

    ```sh
    npm install
    ```

3. Configure the environment variables:

   Create a `.env` file in the `api` directory and add the following environment variables:

    ```env
    DB_HOST=localhost
    DB_PORT=3306
    DB_USER=root
    DB_PASS=password
    DB_NAME=sosd_db
    ```

4. Start the NestJS application:

    ```sh
    npm run start:dev
    ```

   This will start the API server in development mode.

5. Seed the database with example data:

   After starting the API server, run the following command to seed the database:

    ```sh
    npx prisma db seed
    ```

   This will populate your database with example data defined in the `prisma/seed.ts` file.

### Testing the API

1. Once the API server is running, you can access it at `http://localhost:3000`.

2. Use tools like Postman or curl to test the API endpoints.

## Swagger Documentation

The API documentation is available at `http://localhost:3000/api`.

## Directory Structure

```plaintext
├── api
│   ├── src
|   |   ├── controllers
|   |   ├── services
|   |   ├── entities
│   ├── test
│   ├── .env.example
│   ├── nest-cli.json
│   ├── package.json
│   ├── tsconfig.json
│   └── tsconfig.build.json
├── database
│   ├── docker-compose.yml
│   ├── sosd_schema.sql
└── README.md
```

## Troubleshooting

- **Database Connection Issues**: Ensure the Docker containers are running and the database credentials in the `.env` file are correct.
- **Port Conflicts**: If the default ports (3306 for MySQL, 8080 for phpMyAdmin, 3000 for the API) are in use, you can change them in the respective configurations.
