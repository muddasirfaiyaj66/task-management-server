#Task Management Server

## Table Of Content
- [Table Of Content](#table-of-content)
- [Technologies](#technologies)
- [Installation](#installation)
- [Running Locally](#running-locally)
- [Environment Variables](#environment-variables)

## Technologies

- Built with **Node JS** & **Express**
- Used **MongoDB** as database


## Installation

**Prerequisites:**

- **Node.js:** Ensure you have Node.js (version 14 or higher) installed on your system. If not, download and install it from the official Node.js website: [https://nodejs.org/](https://nodejs.org/)

1. Clone the repository:
   ```bash
    git clone https://github.com/muddasirfaiyaj66/task-management-server
   ```
2. Install dependencies:
   ```bash
    npm install
   ```


## Running Locally

1. Start the development server:
   ```bash
    nodemon index.js
   ```
2. Access the application in your browser at `http://localhost:5000/`.



## Environment Variables

1. Create a file named `.env` in the root directory of the project.
2. Replace the following placeholder values with your own database credentials:

```.md
DB_URI=Add_Your_MongoDb_URI


ACCESS_TOKEN_SECRET=Add_Access_Token

```

- You can obtain these values from the MongoDB Database access for your MongoDB project.