import { BACKEND_PORT } from './config.js';
// A helper you may want to use when uploading new images to the server.
import { fileToDataUrl } from './helpers.js';

// Variables
const regoForm = document.forms.rego_form;

document.getElementById("register").addEventListener("click", () => {
    var loginScreen = document.getElementById("rego-screen");
    if (loginScreen.style.display === "none") {
        loginScreen.style.display = "block";
    }
    else loginScreen.style.display = "none";
}
);


document.getElementById("btn-register").addEventListener("click", (event) => {
    let regoEmail = regoForm.rego_email.value;
    let regoName = regoForm.rego_name.value;
    let regoPw = regoForm.rego_pw.value;
    let regoConfirmPw = regoForm.rego_confirm_pw.value;
    console.log(regoEmail);

    event.preventDefault();
    if (regoPw !== regoConfirmPw) {
        alert("passwords don't match");
        return;
    }

    const requestBody = {
        "email": regoEmail,
        "password": regoPw,
        "name": regoName
    }

    const init = {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
    }


    fetch(`http://localhost:${BACKEND_PORT}/auth/register`, init)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
            } else {
                console.log('data is', data)
            }
        });
});