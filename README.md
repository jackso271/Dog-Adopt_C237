# Pet Adoption App

A simple C237 CA2 web application for customers to request dog adoption, staff to manage dogs and adoption requests, and admin users to manage customer and staff accounts.

The project follows the class application flow:

**User Action → Express Route → SQL Query → MySQL Database → Response**

## Technology Used

- Node.js
- Express.js
- EJS
- MySQL / Azure MySQL
- express-session
- connect-flash
- Multer image upload
- Server-side JavaScript

## User Roles

### Customer

- Sign up and log in
- View available dogs
- View dog details
- Submit one adoption request per dog
- View request history

### Staff

- View available dogs
- Add dogs and upload images
- Edit dog information and replace images
- Delete dogs
- View adoption report
- Accept or deny adoption requests

### Admin

- Customer CRUD: view, edit and delete customers
- Staff CRUD: view, add, edit and delete staff

## Folder Structure

```text
pet-adoption-app/
├── app.js
├── db.js
├── database.sql
├── routes/
│   ├── auth.js
│   ├── customer.js
│   ├── staff.js
│   └── admin.js
├── middleware/
│   └── auth.js
├── public/
│   ├── css/style.css
│   └── images/dogs/
└── views/
    ├── partials/
    ├── customer/
    ├── staff/
    └── admin/
```

## Setup Instructions

### 1. Install packages

```bash
npm install
```

### 2. Create `.env`

Copy `.env.example` and rename the copy to `.env`.

Fill in the shared Azure MySQL details:

```env
DB_HOST=your-azure-mysql-host
DB_PORT=3306
DB_USER=your-database-user
DB_PASSWORD=your-database-password
DB_NAME=your-database-name
DB_SSL=true
SESSION_SECRET=replace-with-a-secret-value
PORT=3000
```

Do not upload `.env` to GitHub.

### 3. Import the database

Open `database.sql` in MySQL Workbench and run it inside the database named in `DB_NAME`.

The SQL file creates:

- `users`
- `dogs`
- `adoption_requests`

### 4. Default Admin Login

After running `database.sql`:

- Email: `admin@petadopt.com`
- Password: `Admin123`

Use the Admin account to create Staff accounts.

### 5. Run the application

Development:

```bash
npm run dev
```

Normal start:

```bash
npm start
```

Open:

```text
http://localhost:3000
```

## Adoption Request Status

- `Pending`: waiting for staff review
- `Accepted`: staff accepted the request
- `Denied`: staff denied the request
- `Closed`: another customer adopted the same dog

When staff accepts a request:

1. The selected request becomes `Accepted`.
2. The dog becomes `Adopted`.
3. The dog no longer appears on the customer or staff dashboard.
4. Other pending requests for that dog become `Closed`.

## Image Upload

Multer saves uploaded dog images inside:

```text
public/images/dogs/
```

Only the image filename is stored in MySQL.

This is the same local file-upload approach used in the C237 image-upload lesson. On some cloud hosting services, locally uploaded files may not remain after a restart or redeployment.

## GitHub Notes

The following should be committed:

- Source code
- EJS files
- CSS
- `database.sql`
- `.env.example`
- `README.md`

The following should not be committed:

- `.env`
- `node_modules`

## Search and Filtering

Search and filtering are intentionally not included in this first version. They can be added after all core features are tested and working.
