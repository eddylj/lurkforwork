import { BACKEND_PORT } from './config.js';
// A helper you may want to use when uploading new images to the server.
import { fileToDataUrl } from './helpers.js';

// Global Variables
var token = null;
var authID = null;

////////////////////////
///// 2.1.1 Login //////
////////////////////////

const loginForm = document.forms.login_form;

document.getElementById("login").addEventListener("click", () => {
    var loginScreen = document.getElementById("login-screen");
    if (loginScreen.style.display === "none") {
        loginScreen.style.display = "block";
    }
    else loginScreen.style.display = "none";
	}
);


document.getElementById("btn-login").addEventListener("click", (event) => {
	event.preventDefault();

    const loginEmail = loginForm.login_email.value;
    const loginPw = loginForm.login_pw.value;

	// Check email and pw aren't empty
	if (loginEmail === "" || loginPw === "") {
		errorPopup("Please enter a valid email or password.")
	}

    const requestBody = {
        "email": loginEmail,
        "password": loginPw
    }

    const init = {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
    }

    fetch(`http://localhost:${BACKEND_PORT}/auth/login`, init)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
            } else {
                console.log('data is', data)
                token = data.token;
                authID = data.userId;
				// LOAD MAIN PAGE
				showFeed();
            }
        });
});

//////////////////////////////
///// 2.1.2 Registration /////
//////////////////////////////

// Variables
const regoForm = document.forms.rego_form;

// Toggle nav bar rego screen
document.getElementById("register").addEventListener("click", () => {
    var loginScreen = document.getElementById("rego-screen");
    if (loginScreen.style.display === "none") {
        loginScreen.style.display = "block";
    }
    else loginScreen.style.display = "none";
}
);

// Helper to check valid email and name
function isValidEmailAndName(email, name) {
	// Check if email is valid
	let emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	if (!emailRegex.test(email)) {
	  return false;
	}
	
	// Check if name is valid (contains only letters and spaces)
	let nameRegex = /^[a-zA-Z\s]+$/;
	if (!nameRegex.test(name)) {
	  return false;
	}
	
	// If both email and name are valid, return true
	return true;
  }

// Register account
document.getElementById("btn-register").addEventListener("click", (event) => {
    event.preventDefault();

    let regoEmail = regoForm.rego_email.value;
    let regoName = regoForm.rego_name.value;
    let regoPw = regoForm.rego_pw.value;
    let regoConfirmPw = regoForm.rego_confirm_pw.value;

	if (!isValidEmailAndName(regoEmail, regoName)) {
		errorPopup("Please enter a valid email and name. Name must contain only letters and spaces.");
		return;
	}

	if (regoPw === "") {
		errorPopup("Please enter a valid password.")
	}

    if (regoPw !== regoConfirmPw) {
        // alert("passwords don't match");
		errorPopup("Passwords don't match lil bruva")
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
                console.log('data is', data);
				// BRING TO LOGIN PAGE
            }
        });
});

//////////////////////////////
///// 2.1.3 Error Popup //////
//////////////////////////////

// Get error popup elements
function errorPopup(message) {
	const popup = document.getElementById('popup');
	const errorText = document.getElementById('error-text');
	popup.style.display = 'block';
	errorText.innerHTML = message;
}

// Add event listener to close button
const closeError = document.querySelector('.close');
closeError.addEventListener('click', function() {
	// Hide the popup
	popup.style.display = 'none';
});

//////////////////////////////
///// 2.2.1 Basic Feed ///////
////////////////////////////// MAKE SURE TO SHOW IN REVERSE CHRONOLOGICAL

// Main function to show feed.
function showFeed() {
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
				console.log(jobPost);
				generatePost(jobPost);
			}

			// Dummy datta
			let post = {
				"id": 220770,
				"creatorId": 19100,
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
					"userId": 61775,
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
					"userId": 61775,
					"userEmail": "zhizhizhiz@gmail.com",
					"userName": "mecy",
					"comment": "IS AZ THE GOAT OF TFT??"
				}
				]
			}
			generatePost(post);
		}
	})
}

function generatePost(jobPost) {
	// Create Container for job post
	const jobContainer = document.createElement("div");
	jobContainer.setAttribute("class", "job-post");
	// User name 
	const creatorSpan = document.createElement("span");
	creatorSpan.setAttribute("class", "hover-underline");
	fetch(`http://localhost:${BACKEND_PORT}/user?userId=${jobPost.creatorId}`, {
		method: "GET",
		headers: {
			'Content-Type': 'application/json',
			'Authorization': token,
		}
	})
	.then(response => response.json())
	.then(data => {
		if (data.error) {
			alert(data.error);
		} else {
			creatorSpan.innerText = data.name;
		}
	})
	
	// Job Post Date
	const jobDate = document.createElement("div");
	jobDate.setAttribute("class", "job-post-date");
	jobDate.innerHTML = `Posted: ${jobPost.createdAt}`;
	jobContainer.appendChild(creatorSpan);
	jobContainer.appendChild(jobDate);

	// Job content
	const jobContent = document.createElement("div");
	jobContent.setAttribute("class", "job-content");
	// Add Image
	const jobImg = document.createElement("img");
	jobImg.setAttribute("class", "job-img");
	jobImg.src = jobPost.image;
	jobContent.appendChild(jobImg);

	// Job description
	const jobDescription = document.createElement("div");
	jobDescription.setAttribute("class", "job-description");
	const descriptionTitle = document.createElement("h5");
	descriptionTitle.innerText = jobPost.title;
	jobDescription.appendChild(descriptionTitle);
	const brNode = document.createElement("br");
	jobDescription.appendChild(brNode);
	const jobStartDate = document.createElement("div");
	jobStartDate.innerText = jobPost.start; // WIll need to change this for date function
	jobDescription.appendChild(jobStartDate);
	const brNode2 = document.createElement("br");
	jobDescription.appendChild(brNode2);
	const jobInfo = document.createElement("p");
	jobInfo.innerText = jobPost.description;
	jobDescription.appendChild(jobInfo);
	jobContent.appendChild(jobDescription);

	jobContainer.appendChild(jobContent);

	// Likes and comments bar
	const likeCommentBar = document.createElement("div");
	likeCommentBar.setAttribute("class", "likes-comments-bar");
	const likes = document.createElement("div");
	likes.setAttribute("class", "likes");
	const likeBtn = document.createElement("button");
	likeBtn.setAttribute("class", "like-button");
	// Check if post has been liked
	const isLiked = jobPost.likes.some((user) => user.userId === authID);
	if (isLiked) {
		likeBtn.innerText = "LIKED";
	} else {
		likeBtn.innerText = "NOT LIKED";
	}
	likeBtn.setAttribute("id", `${authID}${jobPost.id}`)
	// likeBtn.setAttribute("onclick", likePost(jobPost.id, `${authID}${jobPost.id}`));
	const numLikes = document.createElement("span");
	numLikes.innerText = `${jobPost.likes.length} likes`
	numLikes.setAttribute("class", "hover-underline");
	const numComments = document.createElement("span");
	numComments.setAttribute("class", "hover-underline");
	numComments.innerText = `${jobPost.comments.length} comments`;

	likes.appendChild(likeBtn);
	likes.appendChild(numLikes);
	likeCommentBar.appendChild(likes);
	likeCommentBar.appendChild(numComments);
	jobContainer.appendChild(likeCommentBar);

	// Comments section
	const commentSection = document.createElement("div");
	commentSection.setAttribute("class", "comments");
	for (const commentInfo of jobPost.comments) {
		const comment = document.createElement("div");
		comment.setAttribute("class", "comment");
		const commentUser = document.createElement("span");
		// SET PROFILE LINK HERE
		commentUser.innerText = commentInfo.userName;
		commentUser.setAttribute("class", "hover-underline");
		comment.appendChild(commentUser);
		comment.innerHTML += `: ${commentInfo.comment}\n`;
		commentSection.appendChild(comment);
	}
	jobContainer.appendChild(commentSection);

	// Post comment
	const postComment = document.createElement("div");
	postComment.setAttribute("class", "post-comment");

	const addComment = document.createElement("input");
	addComment.setAttribute("placeholder", "Add a comment");
	addComment.setAttribute("class", "add-comment");

	const postCommentBtn = document.createElement("button");
	postCommentBtn.setAttribute("class", "post-comment-button");
	postCommentBtn.innerText = "Post";
	postCommentBtn.addEventListener("click", () => {
		const requestBody = {
			"id": jobPost.id,
			"comment": addComment.value
		}
		fetch(`http://localhost:${BACKEND_PORT}/job/comment`, {
			method: "POST",
			headers: {
				'Content-Type': 'application/json',
				'Authorization': token,
			},
			body: JSON.stringify(requestBody)
		})
		.then(response => response.json())
		.then(data => {
			if (data.error) {
				alert(data.error);
			} else {
				addComment.innerText = "";
				console.log("comment posted successfully");
			}
		});
	});

	postComment.appendChild(addComment);
	postComment.appendChild(postCommentBtn);
	jobContainer.appendChild(postComment);

	// Append to main page
    document.getElementById("main-page").appendChild(jobContainer);
}

// Function to like post
function likePost(postID, btnId) {
	// if (self.innerText === "notLiked") {}
	const btn = document.getElementById(btnId);
	const requestBody = {
		"id": postID,
		"turnon": btnId.innerText !== "LIKED",
	}

	fetch(`http://localhost:${BACKEND_PORT}/job/like`, {
		method: "PUT",
		headers: {
			'Content-Type': 'application/json',
			'Authorization': token,
		},
		body: JSON.stringify(requestBody),
	})
	.then(response => response.json())
	.then(data => {
		if (data.error) {
			alert(data.error);
		} else {
			if (btn.innerText === "LIKED") {
				btn.innerText = "NOT LIKED";
			} else {
				btn.innerText = "LIKED";
			}
		}
	})
}



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