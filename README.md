# Welcome to Book Marketplace
Welcome to our book marketplace! This website provides you with the opportunity to buy books shared by other users. Follow the instructions below to get started.

## Project Summary
The Book Marketplace project aims to facilitate individuals who have books they have already read and no longer need, by providing them with a platform to sell these books. Additionally, it seeks to assist those who are in search of their next favorite book. The project is designed to be user-friendly and intuitive for both sellers and buyers.

## How It Works
- **Account Creation:** Users register to create their personalized account, enabling them to create listings and purchase books from other users.

- **Listing a Book:** After registering or logging into their account, users can create a listing for their book and await potential buyers.

- **Purchasing a Book:** Once registered or logged in, users can start buying books uploaded by other users.

- **Profile Page:** On the profile page, users can find basic information, as well as a list of all the books they have purchased.

## Project Structure
The project follows a structured organization to improve maintainability and ease of navigation. Here's a brief overview of the main directories and their purposes:

* **/client:** Contains the user interface application created with React.
    *  **/public:** Static images.
    
    * **/src:** React components, styles, and application logic.

- **/service:**

    - **/server.js:** A file that, when started, enables the use of the SoftUni Practice Server.

Feel free to explore each directory to gain more detailed information about its contents. This structure is designed to facilitate working on specific aspects of the application.

## Run Locally

**Clone the project**

```bash
  
git clone https://github.com/veselinfilev/React-Project
  
```

Go to the server directory

```bash
 
  cd server 
 
```

Start the server

```bash
  
  node server.js
  
```

Go to the client directory

```bash
  
  cd client
  
```

Install dependencies

```bash
  
  npm install
  
```

Start application
```bash
  
  npm run dev
 
```

## API Endpoints

  ### Authentication

○ **Register User**

  + **POST - /users**

    + **Request:**

    ```bash
    {
      email,
      password,
      username
    }
    ```

○ **Login User**

  + **POST - /users**

    + **Request:**

    ```bash
    {
      email,
      password
    }
    ```

### Book Management    

○ **Create Book**

  + **POST - /data/books**

    + **Request:**

    ```bash
    {
      title,
      author,
      genre,
      price,
      description,
      image
    }
    ```

  ○ **Update Book**

  + **PUT - /data/books/:bookId**

    + **Request:**

    ```bash
    {
      _id,
      title,
      author,
      genre,
      price,
      description,
      image
    }
    ```

  ○ **Delete Book**

  + **DELETE - /data/books/:bookId**  

   ○ **Get Book**

  + **GET - /data/books/:bookId** 

 **Enjoy** 😊
