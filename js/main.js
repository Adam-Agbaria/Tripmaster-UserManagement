import agentDestinations from './agentDestinations.js';
import destinations from './destinations.js';

document.addEventListener('DOMContentLoaded', function() {
    console.log('Main.js loaded'); // Ensure this logs to verify the correct file is loaded

    const signupForm = document.getElementById('signupForm');
    const loginForm = document.getElementById('loginForm');
    const userInfo = document.getElementById('userInfo');
    const loading = document.getElementById('loading');
    const alertContainer = document.getElementById('alert-container');
    const flightsContainer = document.getElementById('flightsContainer');
    const packagesContainer = document.getElementById('packagesContainer');
    const hotelsContainer = document.getElementById('hotelsContainer');
    const usersContainer = document.getElementById('usersContainer');
    const prevPageButton = document.getElementById('prevPage');
    const nextPageButton = document.getElementById('nextPage');
    const filterButton = document.getElementById('filterButton');
    const destinationInput = document.getElementById('filterDestination');
    const packageDestinationInput = document.getElementById('filterPackageDestination');
    const hotelCityInput = document.getElementById('filterHotelCity');
    const userEmailInput = document.getElementById('filterUserEmail');
    const showDeletedCheckbox = document.getElementById('showDeleted'); // Checkbox to toggle showing deleted items
    window.toggleActiveStatus = toggleActiveStatus;
    window.banUser = banUser;
    window.unbanUser = unbanUser;
    window.notifyUser = notifyUser;

    let currentPage = 0;
    let allFlights = [];
    let allPackages = [];
    let allHotels = [];
    let allUsers = [];

    const email = localStorage.getItem('userEmail');
    const superapp = localStorage.getItem('superapp');
    const userId = {
        superapp: superapp,
        email: email
    };

    if (signupForm) {
        signupForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const passwordConfirm = document.getElementById('passwordConfirm').value;

            if (password !== passwordConfirm) {
                showAlert('danger', 'Passwords do not match');
                return;
            }

            const passwordError = getPasswordError(password);
            if (passwordError) {
                showAlert('danger', passwordError);
                return;
            }

            const userInput = {
                email: email,
                role: "ADMIN",
                username: username,
                avatar: "C"
            };

            console.log("User input: ", userInput);
            showLoading();
            try {
                const response = await fetch('http://localhost:8084/superapp/users', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(userInput),
                });
                console.log("Response status: ", response.status, response.statusText);
                if (!response.ok) {
                    throw new Error(`Failed to create user: ${response.statusText}`);
                }
                const text = await response.text();
                if (!text) {
                    throw new Error('Empty response from server');
                }
                const createdUser = JSON.parse(text);
                console.log('User created:', createdUser);
                const userId = {
                    superapp: "tripMaster",
                    email: createdUser.userId.email
                };
                await updateUserRole(userId, 'MINIAPP_USER');
                await createPasswordObject(userId, createdUser.username, createdUser.avatar, password);
                await updateUserRole(userId, 'ADMIN');
                console.log('User role reverted to ADMIN');
                hideLoading();
                setTimeout(() => {
                    window.location.href = 'admin.html';
                }, 2000); // Redirect to admin.html after 2 seconds
            } catch (error) {
                console.error('Error during signup:', error);
                hideLoading();
                showAlert('danger', 'User already exists');
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            console.log("Login form submitted");
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            showLoading();
            try {
                const userId = {
                    superapp: "tripMaster",
                    email: email
                };
                await updateUserRole(userId, 'MINIAPP_USER');
                const passwordBoundaryObject = await fetchPasswordBoundaryObject(email);
                if (passwordBoundaryObject && passwordBoundaryObject.objectDetails.password === password) {
                    console.log('Login successful');
                    localStorage.setItem('userEmail', email);
                    localStorage.setItem('superapp', 'tripMaster');
                    await updateUserRole(userId, 'ADMIN');
                    console.log('User role reverted to ADMIN');
                    hideLoading();
                    window.location.href = 'admin.html';
                } else {
                    await updateUserRole(userId, 'ADMIN');
                    console.log('User role reverted to ADMIN');
                    hideLoading();
                    showAlert('danger', 'Incorrect password');
                }
            } catch (error) {
                console.error('Error during login:', error);
                showAlert('danger', 'User does not exist');
                hideLoading();
            }
        });
    }

    if (userInfo) {
        if (email && superapp) {
            userInfo.textContent = `Logged in as: ${email} (${superapp})`;
        } else {
            window.location.href = 'login.html';
        }
    }

    if (flightsContainer) {
        loadFlights(); // Load initial flights

        prevPageButton.addEventListener('click', function() {
            if (currentPage > 0) {
                currentPage -= 1;
                displayFlights(applyFlightFilters(allFlights));
            }
        });

        nextPageButton.addEventListener('click', function() {
            currentPage += 1;
            displayFlights(applyFlightFilters(allFlights));
        });

        filterButton.addEventListener('click', function() {
            currentPage = 0;
            const filteredFlights = applyFlightFilters(allFlights);
            displayFlights(filteredFlights);
        });

        showDeletedCheckbox.addEventListener('change', function() {
            displayFlights(applyFlightFilters(allFlights));
        });

        setupAutocomplete(destinationInput, destinations);
    }

    if (packagesContainer) {
        loadPackages(); // Load initial packages

        prevPageButton.addEventListener('click', function() {
            if (currentPage > 0) {
                currentPage -= 1;
                displayPackages(applyPackageFilters(allPackages));
            }
        });

        nextPageButton.addEventListener('click', function() {
            currentPage += 1;
            displayPackages(applyPackageFilters(allPackages));
        });

        filterButton.addEventListener('click', function() {
            currentPage = 0;
            const filteredPackages = applyPackageFilters(allPackages);
            displayPackages(filteredPackages);
        });

        showDeletedCheckbox.addEventListener('change', function() {
            displayPackages(applyPackageFilters(allPackages));
        });

        setupAutocomplete(packageDestinationInput, agentDestinations); // New setup for vacation packages
        setupAutocomplete(document.getElementById('filterHotelName'), hotels); // Set up autocomplete for hotels
        setupAutocomplete(document.getElementById('filterUserEmail'), users); // Set up autocomplete for user emails
    }

    if (hotelsContainer) {
        loadHotels(); // Load initial hotels

        prevPageButton.addEventListener('click', function() {
            if (currentPage > 0) {
                currentPage -= 1;
                displayHotels(applyHotelFilters(allHotels));
            }
        });

        nextPageButton.addEventListener('click', function() {
            currentPage += 1;
            displayHotels(applyHotelFilters(allHotels));
        });

        filterButton.addEventListener('click', function() {
            currentPage = 0;
            const filteredHotels = applyHotelFilters(allHotels);
            displayHotels(filteredHotels);
        });

        showDeletedCheckbox.addEventListener('change', function() {
            displayHotels(applyHotelFilters(allHotels));
        });

        setupAutocomplete(hotelCityInput, destinations);
    }

    if (usersContainer) {
        loadUsers(); // Load initial users

        prevPageButton.addEventListener('click', function() {
            if (currentPage > 0) {
                currentPage -= 1;
                displayUsers(applyUserFilters(allUsers));
            }
        });

        nextPageButton.addEventListener('click', function() {
            currentPage += 1;
            displayUsers(applyUserFilters(allUsers));
        });

        filterButton.addEventListener('click', function() {
            currentPage = 0;
            const filteredUsers = applyUserFilters(allUsers);
            displayUsers(filteredUsers);
        });

        setupAutocomplete(userEmailInput, users); // Set up autocomplete for user emails
    }

    async function loadFlights() {
        try {
            const userId = {
                superapp: localStorage.getItem('superapp'),
                email: localStorage.getItem('userEmail')
            };

            await updateUserRole(userId, 'SUPERAPP_USER'); // Fetch all flights
            allFlights = await fetchFlights();

            const filteredFlights = applyFlightFilters(allFlights);
            displayFlights(filteredFlights);

            await updateUserRole(userId, 'ADMIN');
        } catch (error) {
            console.error('Error loading flights:', error);
            alert('Failed to load flights');
            await updateUserRole(userId, 'ADMIN');
        }
    }

    async function fetchFlights() {
        const url = new URL('http://localhost:8084/superapp/objects/search/byType/Flight');
        url.searchParams.append('userSuperapp', userId.superapp);
        url.searchParams.append('userEmail', userId.email);
        url.searchParams.append('size', 1000); // Fetch a large number of flights
        url.searchParams.append('page', 0);

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch flights: ${response.statusText}`);
        }
        return await response.json();
    }

    function applyFlightFilters(flights) {
        const filters = {
            destination: document.getElementById('filterDestination').value.toLowerCase(),
            departureDate: document.getElementById('filterDepartureDate').value,
            returnDate: document.getElementById('filterReturnDate').value,
            userEmail: document.getElementById('filterUserEmail').value.toLowerCase(),
            minPrice: parseFloat(document.getElementById('filterMinPrice').value),
            maxPrice: parseFloat(document.getElementById('filterMaxPrice').value)
        };

        const showDeleted = showDeletedCheckbox.checked;

        return flights.filter(flight => {
            const flightDetails = flight.objectDetails;

            const destinationMatch = filters.destination ? flightDetails.destination.toLowerCase().includes(filters.destination) : true;

            let departureDateMatch = true;
            let returnDateMatch = true;

            if (filters.departureDate) {
                const filterDepartureDate = new Date(filters.departureDate);
                const flightDepartureDate = parseDateString(flightDetails.departureDate);
                console.log(`Comparing departure dates: ${flightDepartureDate} === ${filterDepartureDate}`);
                departureDateMatch = flightDepartureDate >= filterDepartureDate;
            }

            if (filters.returnDate) {
                const filterReturnDate = new Date(filters.returnDate);
                const flightReturnDate = parseDateString(flightDetails.returnDate);
                console.log(`Comparing return dates: ${flightReturnDate} === ${filterReturnDate}`);
                returnDateMatch = flightReturnDate <= filterReturnDate;
            }

            const userEmailMatch = filters.userEmail ? flight.createdBy.userId.email.toLowerCase().includes(filters.userEmail) : true;

            const minPriceMatch = !isNaN(filters.minPrice) ? parseFloat(flightDetails.price) >= filters.minPrice : true;

            const maxPriceMatch = !isNaN(filters.maxPrice) ? parseFloat(flightDetails.price) <= filters.maxPrice : true;

            const activeMatch = showDeleted ? !flight.active : flight.active;

            return destinationMatch && departureDateMatch && returnDateMatch && userEmailMatch && minPriceMatch && maxPriceMatch && activeMatch;
        });
    }

    function displayFlights(flights) {
        const flightsPerPage = 10;
        const start = currentPage * flightsPerPage;
        const end = start + flightsPerPage;
        const flightsToDisplay = flights.slice(start, end);

        flightsContainer.innerHTML = '';
        flightsToDisplay.forEach(flight => {
            const flightDetails = flight.objectDetails;
            const flightCard = `
                <div class="col-md-4 mb-4">
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">Flight to ${flightDetails.destination}</h5>
                            <p class="card-text">
                                <strong>Origin:</strong> ${flightDetails.origin}<br>
                                <strong>Price:</strong> ${flightDetails.price}<br>
                                <strong>Adults:</strong> ${flightDetails.adults}<br>
                                <strong>Children:</strong> ${flightDetails.children}<br>
                                <strong>Departure Date:</strong> ${flightDetails.departureDate}<br>
                                <strong>Return Date:</strong> ${flightDetails.returnDate}<br>
                                <strong>User Email:</strong> ${flight.createdBy.userId.email}
                            </p>
                            <button class="btn btn-danger" onclick="toggleActiveStatus('${flight.objectId.superapp}', '${flight.objectId.id}', ${!flight.active})">
                                ${flight.active ? 'Delete' : 'Undelete'}
                            </button>
                        </div>
                    </div>
                </div>
            `;
            flightsContainer.insertAdjacentHTML('beforeend', flightCard);
        });

        prevPageButton.disabled = currentPage === 0;
        nextPageButton.disabled = end >= flights.length;
    }

    async function loadPackages() {
        try {
            const userId = {
                superapp: localStorage.getItem('superapp'),
                email: localStorage.getItem('userEmail')
            };

            await updateUserRole(userId, 'SUPERAPP_USER'); // Fetch all packages
            allPackages = await fetchPackages();

            const filteredPackages = applyPackageFilters(allPackages);
            displayPackages(filteredPackages);

            await updateUserRole(userId, 'ADMIN');
        } catch (error) {
            console.error('Error loading packages:', error);
            alert('Failed to load packages');
            await updateUserRole(userId, 'ADMIN');
        }
    }

    async function fetchPackages() {
        const url = new URL('http://localhost:8084/superapp/objects/search/byType/VacationPackage');
        url.searchParams.append('userSuperapp', userId.superapp);
        url.searchParams.append('userEmail', userId.email);
        url.searchParams.append('size', 1000); // Fetch a large number of packages
        url.searchParams.append('page', 0);

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch packages: ${response.statusText}`);
        }
        return await response.json();
    }

    function applyPackageFilters(packages) {
        const filters = {
            destination: document.getElementById('filterPackageDestination').value.toLowerCase(),
            hotelName: document.getElementById('filterHotelName').value.toLowerCase(),
            startDate: document.getElementById('filterStartDate').value,
            endDate: document.getElementById('filterEndDate').value,
            minPrice: parseFloat(document.getElementById('filterMinPrice').value),
            maxPrice: parseFloat(document.getElementById('filterMaxPrice').value),
            stars: parseInt(document.getElementById('filterStars').value),
            userEmail: document.getElementById('filterUserEmail').value.toLowerCase()
        };

        const showDeleted = showDeletedCheckbox.checked;

        return packages.filter(pkg => {
            const packageDetails = pkg.objectDetails;

            const destinationMatch = filters.destination ? packageDetails.destination.toLowerCase().includes(filters.destination) : true;
            const hotelNameMatch = filters.hotelName ? packageDetails.hotelName.toLowerCase().includes(filters.hotelName) : true;

            let startDateMatch = true;
            let endDateMatch = true;

            if (filters.startDate) {
                const filterStartDate = new Date(filters.startDate);
                const packageStartDate = parseDateString(packageDetails.startDate);
                console.log(`Comparing start dates: ${packageStartDate} === ${filterStartDate}`);
                startDateMatch = packageStartDate >= filterStartDate;
            }

            if (filters.endDate) {
                const filterEndDate = new Date(filters.endDate);
                const packageEndDate = parseDateString(packageDetails.endDate);
                console.log(`Comparing end dates: ${packageEndDate} === ${filterEndDate}`);
                endDateMatch = packageEndDate <= filterEndDate;
            }

            const minPriceMatch = !isNaN(filters.minPrice) ? parseFloat(packageDetails.price) >= filters.minPrice : true;
            const maxPriceMatch = !isNaN(filters.maxPrice) ? parseFloat(packageDetails.price) <= filters.maxPrice : true;
            const starsMatch = !isNaN(filters.stars) ? parseInt(packageDetails.stars) === filters.stars : true;
            const userEmailMatch = filters.userEmail ? pkg.createdBy.userId.email.toLowerCase().includes(filters.userEmail) : true;
            const activeMatch = showDeleted ? !pkg.active : pkg.active;

            return destinationMatch && hotelNameMatch && startDateMatch && endDateMatch && minPriceMatch && maxPriceMatch && starsMatch && userEmailMatch && activeMatch;
        });
    }

    function displayPackages(packages) {
        const packagesPerPage = 10;
        const start = currentPage * packagesPerPage;
        const end = start + packagesPerPage;
        const packagesToDisplay = packages.slice(start, end);

        packagesContainer.innerHTML = '';
        packagesToDisplay.forEach(pkg => {
            const packageDetails = pkg.objectDetails;
            const packageCard = `
                <div class="col-md-4 mb-4">
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">${packageDetails.packageName}</h5>
                            <p class="card-text">
                                <strong>Destination:</strong> ${packageDetails.destination}<br>
                                <strong>Hotel Name:</strong> ${packageDetails.hotelName}<br>
                                <strong>Stars:</strong> ${packageDetails.stars}<br>
                                <strong>Price:</strong> ${packageDetails.price}<br>
                                <strong>Start Date:</strong> ${packageDetails.startDate}<br>
                                <strong>End Date:</strong> ${packageDetails.endDate}<br>
                                <strong>User Email:</strong> ${pkg.createdBy.userId.email}
                            </p>
                            <button class="btn ${pkg.active ? 'btn-danger' : 'btn-warning'}" onclick="toggleActiveStatus('${pkg.objectId.superapp}', '${pkg.objectId.id}', ${!pkg.active})">
                                ${pkg.active ? 'Delete' : 'Undelete'}
                            </button>

                        </div>
                    </div>
                </div>
            `;
            packagesContainer.insertAdjacentHTML('beforeend', packageCard);
        });

        prevPageButton.disabled = currentPage === 0;
        nextPageButton.disabled = end >= packages.length;
    }

    async function loadHotels() {
        try {
            const userId = {
                superapp: localStorage.getItem('superapp'),
                email: localStorage.getItem('userEmail')
            };

            await updateUserRole(userId, 'SUPERAPP_USER'); // Fetch all hotels
            allHotels = await fetchHotels();

            const filteredHotels = applyHotelFilters(allHotels);
            displayHotels(filteredHotels);

            await updateUserRole(userId, 'ADMIN');
        } catch (error) {
            console.error('Error loading hotels:', error);
            alert('Failed to load hotels');
            await updateUserRole(userId, 'ADMIN');
        }
    }

    async function fetchHotels() {
        const url = new URL('http://localhost:8084/superapp/objects/search/byType/Hotel');
        url.searchParams.append('userSuperapp', userId.superapp);
        url.searchParams.append('userEmail', userId.email);
        url.searchParams.append('size', 1000); // Fetch a large number of hotels
        url.searchParams.append('page', 0);

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch hotels: ${response.statusText}`);
        }
        return await response.json();
    }

    function applyHotelFilters(hotels) {
        const filters = {
            city: document.getElementById('filterHotelCity').value.toLowerCase(),
            checkInDate: document.getElementById('filterCheckInDate').value,
            checkOutDate: document.getElementById('filterCheckOutDate').value,
            hotelName: document.getElementById('filterHotelName').value.toLowerCase(),
            minPrice: parseFloat(document.getElementById('filterMinPrice').value),
            maxPrice: parseFloat(document.getElementById('filterMaxPrice').value)
        };

        const showDeleted = showDeletedCheckbox.checked;

        return hotels.filter(hotel => {
            const hotelDetails = hotel.objectDetails;

            const cityMatch = filters.city ? hotelDetails.city.toLowerCase().includes(filters.city) : true;
            const hotelNameMatch = filters.hotelName ? hotelDetails.hotelName.toLowerCase().includes(filters.hotelName) : true;

            let checkInDateMatch = true;
            let checkOutDateMatch = true;

            if (filters.checkInDate) {
                const filterCheckInDate = new Date(filters.checkInDate);
                const hotelCheckInDate = parseDateString(hotelDetails.checkInDate);
                console.log(`Comparing check-in dates: ${hotelCheckInDate} === ${filterCheckInDate}`);
                checkInDateMatch = hotelCheckInDate >= filterCheckInDate;
            }

            if (filters.checkOutDate) {
                const filterCheckOutDate = new Date(filters.checkOutDate);
                const hotelCheckOutDate = parseDateString(hotelDetails.checkOutDate);
                console.log(`Comparing check-out dates: ${hotelCheckOutDate} === ${filterCheckOutDate}`);
                checkOutDateMatch = hotelCheckOutDate <= filterCheckOutDate;
            }

            const minPriceMatch = !isNaN(filters.minPrice) ? parseFloat(hotelDetails.price) >= filters.minPrice : true;
            const maxPriceMatch = !isNaN(filters.maxPrice) ? parseFloat(hotelDetails.price) <= filters.maxPrice : true;
            const activeMatch = showDeleted ? !hotel.active : hotel.active;

            return cityMatch && hotelNameMatch && checkInDateMatch && checkOutDateMatch && minPriceMatch && maxPriceMatch && activeMatch;
        });
    }

    function displayHotels(hotels) {
        const hotelsPerPage = 10;
        const start = currentPage * hotelsPerPage;
        const end = start + hotelsPerPage;
        const hotelsToDisplay = hotels.slice(start, end);

        hotelsContainer.innerHTML = '';
        hotelsToDisplay.forEach(hotel => {
            const hotelDetails = hotel.objectDetails;
            const hotelCard = `
                <div class="col-md-4 mb-4">
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">Hotel in ${hotelDetails.city}</h5>
                            <p class="card-text">
                                <strong>Hotel Name:</strong> ${hotelDetails.hotelName}<br>
                                <strong>Check-In Date:</strong> ${hotelDetails.checkInDate}<br>
                                <strong>Check-Out Date:</strong> ${hotelDetails.checkOutDate}<br>
                                <strong>Price:</strong> ${hotelDetails.price}<br>
                                <strong>User Email:</strong> ${hotel.createdBy.userId.email}
                            </p>
                            <button class="btn ${hotel.active ? 'btn-danger' : 'btn-warning'}" onclick="toggleActiveStatus('${hotel.objectId.superapp}', '${hotel.objectId.id}', ${!hotel.active})">
                                ${hotel.active ? 'Delete' : 'Undelete'}
                            </button>

                        </div>
                    </div>
                </div>
            `;
            hotelsContainer.insertAdjacentHTML('beforeend', hotelCard);
        });

        prevPageButton.disabled = currentPage === 0;
        nextPageButton.disabled = end >= hotels.length;
    }

    async function loadUsers() {
        try {
            const userId = {
                superapp: localStorage.getItem('superapp'),
                email: localStorage.getItem('userEmail')
            };

            allUsers = await fetchUsers();

            const filteredUsers = applyUserFilters(allUsers);
            displayUsers(filteredUsers);
        } catch (error) {
            console.error('Error loading users:', error);
            alert('Failed to load users');
        }
    }

    async function fetchUsers() {
        const url = new URL('http://localhost:8084/superapp/admin/users');
        url.searchParams.append('userSuperapp', userId.superapp);
        url.searchParams.append('userEmail', userId.email);
        url.searchParams.append('size', 1000); // Fetch a large number of users
        url.searchParams.append('page', 0);

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch users: ${response.statusText}`);
        }
        return await response.json();
    }

    function applyUserFilters(users) {
        const filters = {
            email: document.getElementById('filterUserEmail').value.toLowerCase(),
            showBanned: document.getElementById('showDeleted').checked // Assuming there's a checkbox to show only banned users
        };
    
        return users.filter(user => {
            const emailMatch = filters.email ? user.userId.email.toLowerCase().includes(filters.email) : true;
            const bannedMatch = filters.showBanned ? user.avatar.startsWith('D-') : true;
            return emailMatch && bannedMatch;
        });
    }

    function displayUsers(users) {
        const usersPerPage = 10;
        const start = currentPage * usersPerPage;
        const end = start + usersPerPage;
        const filteredUsers = users.filter(user => !user.avatar.includes('C'));
    
        const usersToDisplay = filteredUsers.slice(start, end);
        usersContainer.innerHTML = '';
        usersToDisplay.forEach(user => {
            const isBanned = user.avatar.startsWith('D-');
            const userCard = `
                <div class="col-md-4 mb-4">
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">${user.username}</h5>
                            <p class="card-text">
                                <strong>Email:</strong> ${user.userId.email}<br>
                                <strong>Role:</strong> ${user.role}<br>
                                <strong>Avatar:</strong> ${user.avatar}
                            </p>
                            <button class="btn ${isBanned ? 'btn-warning' : 'btn-danger'}" onclick="${isBanned ? `unbanUser('${user.userId.superapp}', '${user.userId.email}', '${user.avatar}')` : `banUser('${user.userId.superapp}', '${user.userId.email}', '${user.avatar}')`}">
                                ${isBanned ? 'Unban' : 'Ban'}
                            </button>

                            <button class="btn btn-primary" onclick="notifyUser('${user.userId.email}')">Notify</button>
                        </div>
                    </div>
                </div>
            `;
            usersContainer.insertAdjacentHTML('beforeend', userCard);
        });

        prevPageButton.disabled = currentPage === 0;
        nextPageButton.disabled = end >= users.length;
    }

    async function banUser(superapp, email, currentAvatar) {
        const userId = {
            superapp: superapp,
            email: email
        };

        const newAvatar = `D-${currentAvatar}`;

        const userUpdate = {
            userId: userId,
            avatar: newAvatar
        };

        const requestUrl = `http://localhost:8084/superapp/users/${superapp}/${email}`;
        console.log(`Updating user avatar with request URL: ${requestUrl}`);
        console.log(`Request body: ${JSON.stringify(userUpdate)}`);

        try {
            const response = await fetch(requestUrl, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userUpdate),
            });

            if (!response.ok) {
                throw new Error(`Failed to update user: ${response.statusText}`);
            }

            console.log('User banned successfully');
            loadUsers(); // Reload users to reflect the updated avatar
        } catch (error) {
            console.error('Error updating user:', error);
        }
    }

    async function unbanUser(superapp, email, currentAvatar) {
        const userId = {
            superapp: superapp,
            email: email
        };

        const originalAvatar = currentAvatar.slice(2); // Remove 'D-' prefix to get the original avatar

        const userUpdate = {
            userId: userId,
            avatar: originalAvatar
        };

        const requestUrl = `http://localhost:8084/superapp/users/${superapp}/${email}`;
        console.log(`Updating user avatar with request URL: ${requestUrl}`);
        console.log(`Request body: ${JSON.stringify(userUpdate)}`);

        try {
            const response = await fetch(requestUrl, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userUpdate),
            });

            if (!response.ok) {
                throw new Error(`Failed to update user: ${response.statusText}`);
            }

            console.log('User unbanned successfully');
            loadUsers(); // Reload users to reflect the updated avatar
        } catch (error) {
            console.error('Error updating user:', error);
        }
    }

    async function notifyUser(email) {
        const message = prompt("Enter the notification message:");
        if (!message) {
            return;
        }

        const notificationObject = {
            objectId: {
                superapp: "tripMaster",
                id: "4893f3dd-ceec-4d9e-992a-fae8f08137eb"
            },
            type: "Notification",
            alias: "User Notification",
            active: true,
            createdBy: {
                userId: {
                    superapp: "tripMaster",
                    email: localStorage.getItem('userEmail')
                }
            },
            objectDetails: {
                email: email,
                message: message
            }
        };

        const requestUrl = 'http://localhost:8084/superapp/objects';
        console.log(`Creating notification object with request URL: ${requestUrl}`);
        console.log(`Request body: ${JSON.stringify(notificationObject)}`);

        try {
            await updateUserRole(userId, 'SUPERAPP_USER'); // Update role to create notification
            const response = await fetch(requestUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(notificationObject),
            });

            if (!response.ok) {
                throw new Error(`Failed to create notification object: ${response.statusText}`);
            }

            console.log('Notification sent successfully');
            await updateUserRole(userId, 'ADMIN'); // Revert role back to ADMIN
        } catch (error) {
            console.error('Error sending notification:', error);
            await updateUserRole(userId, 'ADMIN'); // Ensure role is reverted even on error
        }
    }

    function setupAutocomplete(inputElement, options) {
        inputElement.addEventListener('input', function() {
            const list = document.createElement('datalist');
            list.id = `datalist-${inputElement.id}`;
            document.body.appendChild(list);

            const inputValue = inputElement.value.toLowerCase();
            list.innerHTML = '';

            options.forEach(option => {
                if (option.label.toLowerCase().includes(inputValue)) {
                    const optionElement = document.createElement('option');
                    optionElement.value = option.label;
                    list.appendChild(optionElement);
                }
            });

            inputElement.setAttribute('list', list.id);
        });

        inputElement.addEventListener('change', function() {
            const selectedOption = options.find(option => option.label.toLowerCase() === inputElement.value.toLowerCase());
            if (selectedOption) {
                inputElement.value = selectedOption.value;
            }
        });
    }

    function showAlert(type, message) {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show mt-3`;
        alert.role = 'alert';
        alert.innerHTML = `
            ${message}
            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>
        `;
        alertContainer.innerHTML = '';
        alertContainer.appendChild(alert);
    }

    function getPasswordError(password) {
        if (password.length < 8) {
            return "Password must be at least 8 characters long";
        }
        if (!/[A-Z]/.test(password)) {
            return "Password must contain at least one uppercase letter";
        }
        if (!/[a-z]/.test(password)) {
            return "Password must contain at least one lowercase letter";
        }
        if (!/[0-9]/.test(password)) {
            return "Password must contain at least one digit";
        }
        if (!/[^a-zA-Z0-9]/.test(password)) {
            return "Password must contain at least one special character";
        }
        return null;
    }


    async function createPasswordObject(userId, username, avatar, password) {
        const passwordObject = {
            objectId: {
                superapp: "tripMaster",
                id: "4893f3dd-ceec-4d9e-992a-fae8f08137eb"
            },
            type: "Password",
            alias: "User Password",
            location: {
                lat: 0,
                lng: 0
            },
            active: true,
            creationTimestamp: new Date().toISOString(),
            createdBy: {
                userId: userId
            },
            objectDetails: {
                password: password
            }
        };

        const requestUrl = 'http://localhost:8084/superapp/objects';
        console.log(`Creating password object with request URL: ${requestUrl}`);
        console.log(`Request body: ${JSON.stringify(passwordObject)}`);

        const response = await fetch(requestUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(passwordObject),
        });
        console.log("Create password object response status: ", response.status, response.statusText);
        if (!response.ok) {
            throw new Error(`Failed to create password object: ${response.statusText}`);
        }
        const text = await response.text();
        if (!text) {
            throw new Error('Empty response from server');
        }
        const data = JSON.parse(text);
        console.log('Password object created:', data);
        localStorage.setItem('userEmail', userId.email);
        localStorage.setItem('superapp', 'tripMaster');
    }

    async function updateUserRole(userId, role) {
        const userUpdate = {
            userId: userId,
            role: role
        };
        const requestUrl = `http://localhost:8084/superapp/users/${userId.superapp}/${userId.email}`;
        console.log(`Updating user role with request URL: ${requestUrl}`);
        console.log(`Request body: ${JSON.stringify(userUpdate)}`);

        const response = await fetch(requestUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userUpdate),
        });
        console.log(`Response from updateUserRole: ${response.status} ${response.statusText}`);
        if (!response.ok) {
            throw new Error(`Failed to update user role: ${response.statusText}`);
        }
        // No need to parse response body if it's supposed to be empty
    }

    async function fetchPasswordBoundaryObject(email) {
        const command = {
            command: "findObjectsByCreatorEmailAndType",
            targetObject: {
                objectId: {
                    superapp: "tripMaster",
                    id: "4893f3dd-ceec-4d9e-992a-fae8f08137eb"
                }
            },
            invokedBy: {
                userId: {
                    superapp: "tripMaster",
                    email: email
                }
            },
            invocationTimestamp: new Date().toISOString(),
            commandAttributes: {
                email: email,
                type: "Password",
                page: 0,
                size: 1
            }
        };

        const requestUrl = 'http://localhost:8084/superapp/miniapp/adminApp';
        console.log(`Fetching password boundary object with request URL: ${requestUrl}`);
        console.log(`Request body: ${JSON.stringify(command)}`);

        const response = await fetch(requestUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(command),
        });
        const result = await response.json();
        console.log('Password boundary object fetched:', result);

        if (result && result[0] && result[0].commandAttributes && result[0].commandAttributes.results) {
            return result[0].commandAttributes.results[0];
        } else {
            throw new Error('No results found');
        }
    }

    function showLoading() {
        if (loading) {
            loading.style.display = 'block';
        }
    }

    function hideLoading() {
        if (loading) {
            loading.style.display = 'none';
        }
    }

    async function toggleActiveStatus(superapp, id, newStatus) {
        const userId = {
            superapp: localStorage.getItem('superapp'),
            email: localStorage.getItem('userEmail')
        };

        const boundaryObject = {
            objectId: {
                id: id,
                superapp: localStorage.getItem('superapp'),
            },
            active: newStatus
        };

        const requestUrl = `http://localhost:8084/superapp/objects/${superapp}/${id}?userSuperapp=${userId.superapp}&userEmail=${userId.email}`;
        console.log(`Updating object status with request URL: ${requestUrl}`);
        console.log(`Request body: ${JSON.stringify(boundaryObject)}`);

        try {
            await updateUserRole(userId, 'SUPERAPP_USER');
            const response = await fetch(requestUrl, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(boundaryObject),
            });

            if (!response.ok) {
                throw new Error(`Failed to update object status: ${response.statusText}`);
            }

            console.log('Object status updated successfully');
            await updateUserRole(userId, 'ADMIN');
            location.reload();
        } catch (error) {
            console.error('Error updating object status:', error);
        }
    }
});

