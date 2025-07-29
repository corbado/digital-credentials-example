# Digital Credentials Example

This is a [Next.js](https://nextjs.org) project that demonstrates digital credential issuance and verification using OpenID for Verifiable Credentials (OpenID4VCI).

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
NEXT_PUBLIC_BASE_URL=http://localhost:3000
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
   - `credential_offers`: Stores credential offers and authorization codes
   - `authorization_codes`: Tracks authorization codes for credential issuance

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

### SSL/HTTPS Requirements for Credential Issuance

**Important**: Digital credential issuance requires HTTPS. For development and testing, you can use ngrok to create a secure tunnel:

1. **Install ngrok** (if not already installed):

   ```bash
   # macOS
   brew install ngrok

   # Or download from https://ngrok.com/download
   ```

2. **Start ngrok tunnel**:

   ```bash
   ngrok http 3000
   ```

3. **Update Environment Variables**: Copy the HTTPS URL from ngrok (e.g., `https://abc123.ngrok.io`) and update your `.env.local`:

   ```bash
   NEXT_PUBLIC_BASE_URL=https://your-ngrok-url.ngrok.io
   ```

4. **Restart the development server**:
   ```bash
   npm run dev
   ```

Now you can access your app via the HTTPS ngrok URL and issue credentials without SSL issues.

### Database Management

- **View Database**: Connect to the MySQL instance at `localhost:3306` with the credentials from your `.env.local` file
- **Stop Database**: `docker-compose down`
- **Reset Database**: `docker-compose down -v` (removes data) then `docker-compose up -d`
- **View Logs**: `docker-compose logs mysql`

## API Endpoints

### Issuance Flow

1. **Create Credential Offer**: `POST /api/issue/authorize`

   - Accepts user data (name, birth date, etc.)
   - Creates a credential offer with pre-authorized code
   - Returns credential offer URI and transaction code
   - **Request Body**:
     ```json
     {
       "user_data": {
         "given_name": "John",
         "family_name": "Doe",
         "birth_date": "1990-01-01",
         "document_number": "123456789",
         "issuing_country": "EU"
       }
     }
     ```
   - **Response**:
     ```json
     {
       "credential_offer_uri": "openid-vc://?credential_offer=...",
       "pre_authorized_code": "auth_code_123",
       "tx_code": "1234"
     }
     ```

2. **Exchange Authorization Code for Token**: `POST /api/issue/token`

   - Exchanges pre-authorized code for access token
   - Validates transaction code (PIN)
   - **Request Body**:
     ```json
     {
       "grant_type": "urn:ietf:params:oauth:grant-type:pre-authorized_code",
       "pre-authorized_code": "auth_code_123",
       "tx_code": "1234"
     }
     ```

3. **Issue Credential**: `POST /api/issue/credential`
   - Issues the actual verifiable credential
   - Requires valid access token
   - Returns signed credential in JWT format

### Verification Flow

1. **Start Verification**: `GET /api/verify/start`

   - Generates a challenge and stores it in the database
   - Returns DCQL query with the challenge as nonce

2. **Verify Presentation**: `POST /api/verify/finish`
   - Validates the presentation against the stored challenge
   - Creates verification session records
   - Returns verification result

### Schema Endpoints

1. **Get PID Schema**: `GET /api/schemas/pid`
   - Returns the EU Digital Identity (PID) credential schema
   - Defines the structure and validation rules for PID credentials

## User Interface

### Issuer Interface (`/issue`)

- Form to collect user data for credential issuance
- Generates QR codes for wallet integration
- Provides app store links for [Sphereon Wallet](https://play.google.com/store/apps/details?id=com.sphereon.ssi.wallet&hl=en) (Android) and [App Store](https://apps.apple.com/us/app/sphereon-wallet/id1661096796) (iOS)
- Displays credential offer URIs and transaction codes
- Supports OpenID4VCI-compatible wallets

### Verifier Interface (`/`)

- Simple verification interface
- Generates verification challenges
- Displays verification results
- Supports presentation of PID credentials

## Wallet Integration

This project is designed to work with OpenID4VCI-compatible wallets, particularly:

- **Sphereon Wallet**: Recommended wallet for credential issuance and verification
- Any other wallet supporting OpenID for Verifiable Credentials (Not yet tested with other wallets)

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
