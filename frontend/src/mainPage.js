import { BACKEND_PORT } from './config.js';
// A helper you may want to use when uploading new images to the server.
import { fileToDataUrl } from './helpers.js';

// Function to deserialise the info of a job feed
// var token = document.getElementById("token").innerText;

document.getElementById("generate-feed").addEventListener("click", generate);

function generate() {
    // Create Container for job post
    const jobContainer = document.createElement("div");
    jobContainer.setAttribute("class", "job-container");
    
    // Dummy post
    let post = {
        "id": 528491,
        "creatorId": 61175,
        "title": "COO for cupcake factory",
        "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==",
        "start": "2011-10-05T14:48:00.000Z",
        "description": "Dedicated technical wizard with a passion and interest in human relationships",
        "createdAt": "2011-10-05T14:48:00.000Z",
        "likes": [
          {
            "userId": 61021,
            "userEmail": "betty@email.com",
            "userName": "Betty"
          }, 
          {
            "userId": 696969,
            "userEmail": "zhizhizhiz@gmail.com",
            "userName": "mechy5"
          }
        ],
        "comments": [
          {
            "userId": 61021,
            "userEmail": "betty@email.com",
            "userName": "Betty",
            "comment": "This is a great opportunity, my email is hello@unsw.edu.au"
          }, {
            "userId": 696969,
            "userEmail": "zhizhizhiz@gmail.com",
            "userName": "mecy",
            "comment": "IS AZ THE GOAT OF TFT??"
          }
        ]
      }

    let id = post.id;
    let creatorId = post.creatorId;
    let title = post.title;
    let image = post.image;
    let start = post.start;
    let description = post.description;
    let createdAt = post.createdAt;
    let numLikes = post.likes.length;
    let numComments = post.comments.length;

    // jobContainer.appendChild(makeDiv("Post ID", id));
    jobContainer.appendChild(makeDiv("Creator", creatorId));
    jobContainer.appendChild(makeDiv("Created At", createdAt));
    // Image
    const img = document.createElement("img");
    img.src = image;
    img.style = "width: 30px";
    jobContainer.appendChild(img);
    jobContainer.appendChild(makeDiv("Title", title));
    jobContainer.appendChild(makeDiv("Job Description", description));
    jobContainer.appendChild(makeDiv("Start Date", start));
    jobContainer.appendChild(makeDiv("Number of Likes", numLikes));
    jobContainer.appendChild(makeDiv("Number of Comments", numComments));

    jobContainer.appendChild(makeButton("👍 Like"));
    jobContainer.appendChild(makeButton("💬 Comment"));

    // Append to main page
    document.getElementById("main-page").appendChild(jobContainer)
}

function makeDiv(ind, val) {
    const div = document.createElement("div");
    div.innerText = ind + ": " +  val;
    return div;
}

function makeButton(name) {
    const butt = document.createElement("button");
    butt.innerHTML = name;
    return butt;
}

function getNameFromUserID(userID) {
    console.log(document.getElementById("token").innerText);
    let x = document.getElementById("token").innerText
    fetch(`http://localhost:${BACKEND_PORT}/user?userId=${userID}`, {
        method: "GET",
        header: {
            'Content-Type': 'application/json',
            Authorization: x,
        },
    })
        .then(response => response.json())
        .then(data => {
            if(data.error) {
                alert(data.error);
            } else {
                return data.name;
            }
    })
}