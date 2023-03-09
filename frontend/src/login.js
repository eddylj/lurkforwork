import { BACKEND_PORT } from './config.js';
// A helper you may want to use when uploading new images to the server.
import { fileToDataUrl } from './helpers.js';

const loginForm = document.forms.login_form;

document.getElementById("btn-login").addEventListener("click", (event) => {
    const loginEmail = loginForm.login_email.value;
    const loginPw = loginForm.login_pw.value;

    event.preventDefault();

    const data = {
        "email": loginEmail,
        "password": loginPw
    }

    const init = {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    }


    fetch(`http://localhost:${BACKEND_PORT}/auth/login`, init)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
            } else {
                console.log('data is', data)
            }
        });
});

