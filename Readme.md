# Tripmaster-UserManagementApplication
This application provides functionalities for managing users, flights, vacation packages, and hotels. Admin users can create, update, ban/unban users, send notifications, and manage various entities in the system. The application includes features like filtering, pagination, and autocomplete for better user experience.

### REMINDER: It wont work properly without running the backend

## Table of Contents
- **Installation**
- **Usage**
- **Sign Up**
- **Log In**
- **Viewing and Managing Users**
- **Viewing and Managing Flights**
- **Viewing and Managing Vacation Packages**
- **Viewing and Managing Hotels**
- **API Endpoints**
- **Customization**

# Installation
Clone the repository:


git clone https://github.com/Adam-Agbaria/Tripmaster-UserManagement.git
cd yourrepository
npm install
npm start

### Usage

### Sign Up
To sign up as an admin user:

Go to the signup page (signup.html).
Fill in the required details: username, email, password, and confirm the password.
Submit the form to create a new admin user.

### Log In

To log in as an admin user:

1. Go to the login page (`login.html`).
2. Enter your email and password.
3. Submit the form to log in.

### Viewing and Managing Users

After logging in, navigate to the user management page (`admin.html`).
Users are displayed in a paginated format.
Use the search bar to filter users by email.
Banned users will have a yellow "Unban" button, while active users will have a red "Ban" button.
Click "Ban" to ban a user. This changes their avatar to "D-<previous_avatar>".
Click "Unban" to unban a user. This reverts their avatar to the previous value.
Click "Notify" to send a notification to the user.

### Viewing and Managing Flights

Go to the flights management page (`flights.html`).
Flights are displayed in a paginated format.
Use the filters to search for flights by destination, departure date, return date, user email, price range, and more.
Click "Delete" to deactivate a flight or "Undelete" to reactivate it. The "Undelete" button will appear in yellow.

### Viewing and Managing Vacation Packages

Go to the vacation packages management page (`packages.html`).
Packages are displayed in a paginated format.
Use the filters to search for packages by destination, hotel name, start date, end date, user email, price range, and stars.
Click "Delete" to deactivate a package or "Undelete" to reactivate it. The "Undelete" button will appear in yellow.

### Viewing and Managing Hotels

Go to the hotels management page (`hotels.html`).
Hotels are displayed in a paginated format.
Use the filters to search for hotels by city, check-in date, check-out date, hotel name, and price range.
Click "Delete" to deactivate a hotel or "Undelete" to reactivate it. The "Undelete" button will appear in yellow.

## API Endpoints

The application interacts with the backend using various API endpoints. Below are some of the key endpoints:

### Users

- `POST /superapp/users`: Create a new user
- `PUT /superapp/users/{superapp}/{email}`: Update user details
- `GET /superapp/admin/users`: Get all users with pagination

### Flights

- `GET /superapp/objects/search/byType/Flight`: Get all flights with pagination

### Vacation Packages

- `GET /superapp/objects/search/byType/VacationPackage`: Get all vacation packages with pagination

### Hotels

- `GET /superapp/objects/search/byType/Hotel`: Get all hotels with pagination

## Customization

The application can be customized to fit different needs. Here are some customization options:

### Filters

You can add or remove filters based on the properties of the entities you manage.

### Buttons and Actions

Customize the actions performed by the buttons (e.g., adding new actions for users).

### Autocomplete Options

Modify the autocomplete options by updating the corresponding JavaScript files (agentDestinations.js, destinations.js).

### Styling

Update the CSS to change the look and feel of the application.

### Adding New Filters

To add a new filter:

1. Add a new input element in the corresponding HTML file (e.g., users.html for users).
2. Update the `applyUserFilters` function (or the respective function for other entities) to include the new filter logic.

### Modifying Button Actions

To modify the actions performed by the buttons:

1. Update the JavaScript functions that handle button clicks (e.g., `banUser`, `unbanUser`, `notifyUser`).
2. Ensure that the functions send the correct API requests to the backend.

## Conclusion

This User Management Application provides a comprehensive set of features for managing users, flights, vacation packages, and hotels. It is designed to be flexible and customizable to fit various administrative needs.
