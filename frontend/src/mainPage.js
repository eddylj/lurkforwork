import { BACKEND_PORT } from './config.js';
// A helper you may want to use when uploading new images to the server.
import { fileToDataUrl } from './helpers.js';

// Function to deserialise the info of a job feed
// var token = document.getElementById("token").innerText;

document.getElementById("generate-feed").addEventListener("click", generate);
document.getElementById("load-page").addEventListener("click", loadPage);

document.getElementById('load-user-info').addEventListener("click", getUserInfo);

function loadUserInfo(data) {
	// Will probably need to clear profile page first

	let id = data.id;
    let email = data.email;
    let name = data.name;
    // let image = data.image;
    let watchees = data.watcheeUserIds;
	let numWatchees = data.watcheeUserIds.length;
    let jobs = data.jobs;

	const profileDiv = document.createElement("div");
	profileDiv.setAttribute("class", "job-container");

	// Image
    profileDiv.appendChild(makeDiv("User ID (exclude)", id));
	// const img = document.createElement("img");
    // img.src = image;
    // img.style = "width: 30px";
	// profileDiv.appendChild(img);
    profileDiv.appendChild(makeDiv("Email", email));
    profileDiv.appendChild(makeDiv("Name", name));  
	// Show watchees
	profileDiv.appendChild(makeDiv("num watchees", numWatchees));
	profileDiv.appendChild(showWatchees(watchees));
	// Show Jobs
	profileDiv.appendChild(showJobs(jobs));

    document.getElementById("profile-page").appendChild(profileDiv)
}

function getUserInfo() {
	let token = document.getElementById('token').innerText;
	let userID = document.getElementById('user-id').value;

	// Get the job feed
	let init = {
		method: "GET",
		headers: {
			'Content-Type': 'application/json',
			'Authorization': token,
		}
	}

	fetch(`http://localhost:${BACKEND_PORT}/user?userId=${userID}`, init)
	.then(response => response.json())
	.then(data => {
		if(data.error) {
			alert(data.error);
		} else {
			console.log('data is', data);
			loadUserInfo(data);
			// return data;
		}
	})
}

function loadPage() {
	let token = document.getElementById('token').innerText;
	console.log(token);
	// Get the job feed
	let init = {
		method: "GET",
		headers: {
			'Content-Type': 'application/json',
			'Authorization': token,
		}
	}
	// DEFAULT SET START INDEX TO 0
	const start_index = 0;

	fetch(`http://localhost:${BACKEND_PORT}/job/feed?start=${start_index}`, init)
	.then(response => response.json())
	.then(data => {
		if(data.error) {
			alert(data.error);
		} else {
			console.log('data is', data);
			for (const jobPost of data) {
				generate(jobPost);
			}
		}
	})
}

function generate(post) {
    // Create Container for job post
    const jobContainer = document.createElement("div");
    jobContainer.setAttribute("class", "job-container");
    
    // // Dummy post
    // let post = {
    //     "id": 528491,
    //     "creatorId": 61175,
    //     "title": "COO for cupcake factory",
    //     "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==",
    //     "start": "2011-10-05T14:48:00.000Z",
    //     "description": "Dedicated technical wizard with a passion and interest in human relationships",
    //     "createdAt": "2011-10-05T14:48:00.000Z",
    //     "likes": [
    //       {
    //         "userId": 61021,
    //         "userEmail": "betty@email.com",
    //         "userName": "Betty"
    //       }, 
    //       {
    //         "userId": 696969,
    //         "userEmail": "zhizhizhiz@gmail.com",
    //         "userName": "mechy5"
    //       }
    //     ],
    //     "comments": [
    //       {
    //         "userId": 61021,
    //         "userEmail": "betty@email.com",
    //         "userName": "Betty",
    //         "comment": "This is a great opportunity, my email is hello@unsw.edu.au"
    //       }, {
    //         "userId": 696969,
    //         "userEmail": "zhizhizhiz@gmail.com",
    //         "userName": "mecy",
    //         "comment": "IS AZ THE GOAT OF TFT??"
    //       }
    //     ]
    //   }

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

    // button to like/unlike (currently only likes)
	const likeButton = makeButton("👍 Like");
	likeButton.addEventListener("click", () => {
		likeJob(post.id, true);
	})
    jobContainer.appendChild(likeButton);

    jobContainer.appendChild(makeButton("💬 Comment"));
    
    // Div with all the likes
    let likesList = showLikes(post.likes);
    jobContainer.appendChild(likesList);

    // Div with all the comments
    let commentsList = showComments(post.comments);
    jobContainer.appendChild(commentsList);

    // Append to main page
    document.getElementById("main-page").appendChild(jobContainer)
}
function showLikes(list) {
    const div = document.createElement("div");
    div.innerText = "Likes\n";
    for (const person of  list) {
        const span = document.createElement("a");
        span.innerText = person.userName + '\n';
        span.setAttribute("href", "https://www.frankerfacez.com/emoticon/518858-KEWK");
        div.appendChild(span);
    }
    return div;
}

function showComments(comments) {
    const div = document.createElement("div");
    div.innerText = "Comments\n";
    for (const comment of comments) {
        const commentDiv = document.createElement("div");
        // ADD LINK
        commentDiv.innerText = comment.userName + ": " + comment.comment;
        div.appendChild(commentDiv);
    }
    return div;
}

function showWatchees(watchees) {
    const div = document.createElement("div");
    div.innerText = "Watchees\n";
    for (const watchee of watchees) {
        // Make them a link
		div.innerHTML += watchh + " ";
	}
    return div;
}

function showJobs(jobs) {
	const div = document.createElement("div");
	div.innerText = "Jobs\n";
	for (const job of jobs) {
		div.innerText += `Job Title: ${job.title}\n Start: ${job.start}\n Description: ${job.descriptoin}\n Created At: ${job.createdAt}\n`
		const img = document.createElement("img");
		img.src = job.image;
		img.style = "width: 30px";
		div.appendChild(img);
	}
	return div;
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

// LIKE A JOB
function likeJob(postID, isLiked) {
	const requestBody = {
		"id": postID,
		"turnon": isLiked,
	}
	let init = {
		method: "PUT",
		headers: {
			'Content-Type': 'application/json',
			'Authorization': token,
		},
		body: JSON.stringify(requestBody),
	}

	fetch(`http://localhost:${BACKEND_PORT}/user?userId=${userID}`, init)
	.then(response => response.json())
	.then(data => {
		if(data.error) {
			alert(data.error);
		} else {
			console.log('data is', data);
		}
	})
}