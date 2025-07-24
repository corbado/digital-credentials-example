# Digital Credentials Example

This is a [Next.js](https://nextjs.org) project that demonstrates digital credential verification using OpenID for Verifiable Credentials.

## Database Setup

This project uses a MySQL database to store challenges and verification sessions. Follow these steps to set up the database:

### Prerequisites

- Docker and Docker Compose installed on your system
- Node.js 18+ installed

### Database Configuration

1. **Create Environment File**: Copy the example environment variables and create your own `.env.local` file:

```bash
# Create your own .env.local file with these variables:
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_NAME=digital_credentials
DATABASE_USER=app_user
DATABASE_PASSWORD=app_password
DATABASE_URL="mysql://app_user:app_password@localhost:3306/digital_credentials"
NODE_ENV=development
```

2. **Start the Database**: Use Docker Compose to start the MySQL database:

```bash
docker-compose up -d
```

This will:

- Start a MySQL 8.0 container
- Create the `digital_credentials` database
- Run the initialization SQL script to create required tables
- Set up the database user and permissions

3. **Database Schema**: The following tables are automatically created:
   - `challenges`: Stores verification challenges with expiration times
   - `verification_sessions`: Tracks verification attempts and their status
   - `verified_credentials`: Stores verified credential data (optional)

### Development

1. **Install Dependencies**:

```bash
npm install
```

2. **Start the Development Server**:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Database Management

- **View Database**: Connect to the MySQL instance at `localhost:3306` with the credentials from your `.env.local` file
- **Stop Database**: `docker-compose down`
- **Reset Database**: `docker-compose down -v` (removes data) then `docker-compose up -d`
- **View Logs**: `docker-compose logs mysql`

## API Endpoints

### Verification Flow

1. **Start Verification**: `GET /api/verify/start`

   - Generates a challenge and stores it in the database
   - Returns DCQL query with the challenge as nonce

2. **Verify Presentation**: `POST /api/verify/callback`
   - Validates the presentation against the stored challenge
   - Creates verification session records
   - Returns verification result

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
