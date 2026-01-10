const AUTH_KEY = 'ott_users';
const SESSION_KEY = 'ott_current_user';

const Auth = {
    getUsers: () => JSON.parse(localStorage.getItem(AUTH_KEY)) || [],

    setUsers: (users) => localStorage.setItem(AUTH_KEY, JSON.stringify(users)),

    getCurrentUser: () => JSON.parse(localStorage.getItem(SESSION_KEY)),

    setCurrentUser: (user) => localStorage.setItem(SESSION_KEY, JSON.stringify(user)),

    removeCurrentUser: () => localStorage.removeItem(SESSION_KEY),

    register: (name, email, password) => {
        const users = Auth.getUsers();
        if (users.find(u => u.email === email)) {
            return { success: false, message: "User already exists with this email." };
        }
        const newUser = { name, email, password, wishlist: [] };
        users.push(newUser);
        Auth.setUsers(users);
        return { success: true, message: "Registration successful! Please login." };
    },

    login: (email, password) => {
        const users = Auth.getUsers();
        const user = users.find(u => u.email === email && u.password === password);
        if (user) {
            Auth.setCurrentUser(user);
            return { success: true, user };
        }
        return { success: false, message: "Invalid email or password." };
    },

    logout: () => {
        Auth.removeCurrentUser();
        window.location.href = 'index.html';
    },

    addToWishlist: (movie) => {
        const currentUser = Auth.getCurrentUser();
        if (!currentUser) return { success: false, message: "Not logged in" };

        // Update in session
        if (!currentUser.wishlist) currentUser.wishlist = [];
        if (currentUser.wishlist.find(m => m.id === movie.id)) {
            return { success: false, message: "Movie already in list" };
        }
        currentUser.wishlist.push(movie);
        Auth.setCurrentUser(currentUser);

        // Update in database (users array)
        const users = Auth.getUsers();
        const userIndex = users.findIndex(u => u.email === currentUser.email);
        if (userIndex !== -1) {
            users[userIndex] = currentUser;
            Auth.setUsers(users);
        }
        return { success: true, message: "Added to wishlist" };
    },

    removeFromWishlist: (movieId) => {
        const currentUser = Auth.getCurrentUser();
        if (!currentUser) return;

        currentUser.wishlist = currentUser.wishlist.filter(m => m.id !== movieId);
        Auth.setCurrentUser(currentUser);

        const users = Auth.getUsers();
        const userIndex = users.findIndex(u => u.email === currentUser.email);
        if (userIndex !== -1) {
            users[userIndex] = currentUser;
            Auth.setUsers(users);
        }
    },

    getWishlist: () => {
        const currentUser = Auth.getCurrentUser();
        return currentUser ? currentUser.wishlist : [];
    }
};
