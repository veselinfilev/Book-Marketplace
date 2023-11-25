const baseUrl = "http://localhost:3030/users"

export const login = async (email, password) => {

    const userData = {
        email,
        password
    }

    const response = await fetch(`${baseUrl}/login`, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
    });

    const result = await response.json();

    return result

}

export const register = async (email, password, username) => {

    const userData = {
        email,
        password,
        username
    }

    const response = await fetch(`${baseUrl}/register`, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
    });
    const result = await response.json();

    return result

}

export const logout = async () => {
    const token = JSON.parse(localStorage.getItem('user')).accessToken;

    const response = await fetch(`${baseUrl}/logout`, {
        method: 'GET',
        headers: {
            'X-Authorization': token
        }
    });

    if (response.status === 204) {
        return {};
    }

    const errorMessage = await response.text();
    throw new Error(`Logout failed with status: ${response.status}. ${errorMessage}`);
};