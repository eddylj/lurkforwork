import { BACKEND_PORT } from './config.js';
// A helper you may want to use when uploading new images to the server.
import { fileToDataUrl } from './helpers.js';

// User Token
// var userID = document.getElementById("token").innerText

// GET /job/feed
function getJobFeed(userID, start_index) {
    let init = {
        method: "GET",
        header: {
            'Content-Type': 'application/json',
            'Authorization': userID,
        }
    }

    fetch(`http://localhost:${BACKEND_PORT}/job/feed?start=${start_index}`, init)
        .then(response => response.json())
        .then(data => {
            if(data.error) {
                alert(data.error);
            } else {
                console.log('data is', data);
            }
        })
}

// POST /job
function postJob(userID) {
    let requestBody = {
        "title": title,
        "image": dsf,
        "start": Datenow,
        "description": description,
    }

    let init = {
        method: "POST",
        header: {
            'Content-Type': 'application/json',
            'Authorization': userID,
        },
        body: JSON.stringify(requestBody),
    }

    fetch(`http://localhost:${BACKEND_PORT}/job`, init)
        .then(response => response.json())
        .then(data => {
            if(data.error) {
                alert(data.error);
            } else {
                console.log('data is', data);
            }
        })
}

// PUT /job
function putJob(userID) {
    let requestBody = {
        "id": id,
        "title": Title,
        "image": image,
        "start": start,
        "description": description
    }

    let init = {
        method: "PUT",
        header: {
            'Content-Type': 'application/json',
            'Authorization': userID,
        },
        body: JSON.stringify(requestBody),
    }

    fetch(`http://localhost:${BACKEND_PORT}/job`, init)
        .then(response => response.json())
        .then(data => {
            if(data.error) {
                alert(data.error);
            } else {
                console.log('data is', data);
            }
        })
}

// DELETE /job
function deleteJob(userID) {
    let requestBody = {
        "id": id
    }

    let init = {
        method: "DELETE",
        header: {
            'Content-Type': 'application/json',
            'Authorization': userID,
        },
        body: JSON.stringify(requestBody),
    }

    fetch(`http://localhost:${BACKEND_PORT}/job`, init)
        .then(response => response.json())
        .then(data => {
            if(data.error) {
                alert(data.error);
            } else {
                console.log('data is', data);
            }
        })
}

// POST /job/comment
function postJobComment(userID) {
    let requestBody = {
        "id": id,
        "comment": comment,
    }

    let init = {
        method: "POST",
        header: {
            'Content-Type': 'application/json',
            'Authorization': userID,
        },
        body: JSON.stringify(requestBody),
    }

    fetch(`http://localhost:${BACKEND_PORT}/job/comment`, init)
        .then(response => response.json())
        .then(data => {
            if(data.error) {
                alert(data.error);
            } else {
                console.log('data is', data);
            }
        })
}

// PUT /job/like
function putJobLike(userID) {
    let requestBody = {
        "id": id,
        "turnon": trueOrFalse
    }

    let init = {
        method: "PUT",
        header: {
            'Content-Type': 'application/json',
            'Authorization': userID,
        },
        body: JSON.stringify(requestBody),
    }

    fetch(`http://localhost:${BACKEND_PORT}/job/like`, init)
        .then(response => response.json())
        .then(data => {
            if(data.error) {
                alert(data.error);
            } else {
                console.log('data is', data);
            }
        })
}

