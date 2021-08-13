# Rooms service (NestJS)

This service is responsible for handling actions with rooms.

---

## Responsibilities

- Create room
- Delete room
- Update room
- Response to a search request
- Response with all rooms of the user
- Add user to the room
- Delete user from the room
- Response with user rights
- Change user rights

---

## Installing App

1. Clone this repository `git clone https://github.com/S-Sergio-A/rooms-microservice.git`
2. Navigate to the root directory and add the`.env` file with your database and microservice data:
```
MONGO_USERNAME
MONGO_PASSWORD
MONGO_CLUSTER_URL
MONGO_USER_DATABASE_NAME
MONGO_ROOMS_DATABASE_NAME
MONGO_MESSAGES_DATABASE_NAME

REDIS_DB_NAME
REDIS_PASSWORD
REDIS_ENDPOINT
REDIS_PORT

CLOUDINARY_API_KEY
CLOUDINARY_CLOUD
CLOUDINARY_API_SECRET
```

3. Install dependencies

```javascript
npm install;
```

---

### Running the server in development mode

```javascript
npm start: dev;
```

### Running the server in production mode

```javascript
npm build;

npm start: prod;
```

# License

---

This project uses the following [license](https://github.com/S-Sergio-A/rooms-microservice/blob/master/LICENSE).
