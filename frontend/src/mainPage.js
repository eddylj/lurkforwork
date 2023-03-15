import { BACKEND_PORT } from './config.js';
// A helper you may want to use when uploading new images to the server.
import { fileToDataUrl } from './helpers.js';

// Global Variables
var token = null;
var authID = null;

// Opens the page in login screen
// loadPage("login-screen");

// Function to load pages - by hiding
// Input the page id from html and it hides all other pages
function loadPage(pageId) {
	Array.from(document.getElementsByClassName("page")).forEach(page => {
		page.style.display = "none";
	});
	document.getElementById(pageId).style.display = "";
}

document.getElementById("nav-main-feed-button").addEventListener("click", () => {
	showFeed();
});

document.getElementById("nav-profile-button").addEventListener("click", () => {
	loadProfileScreen(authID);
});


////////////////////////
///// 2.1.1 Login //////
////////////////////////

const loginForm = document.forms.login_form;

document.getElementById("login").addEventListener("click", () => {
    loadPage("login-screen");
});

document.getElementById("btn-join").addEventListener("click", (e) => {
	e.preventDefault();
	loadPage("rego-screen");
})

document.getElementById("btn-login").addEventListener("click", (event) => {
	event.preventDefault();

    const loginEmail = loginForm.login_email.value;
    const loginPw = loginForm.login_pw.value;

	// Check email and pw aren't empty
	if (loginEmail === "" || loginPw === "") {
		popup("Please enter a valid email or password.", false)
		return;
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
                popup("Please enter a valid email or password.", false);
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
    loadPage("rego-screen");
});

// Back to sign in
document.getElementById("btn-signin").addEventListener("click", (e) => {
	e.preventDefault();
    loadPage("login-screen");
});

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
		popup("Please enter a valid email and name. Name must contain only letters and spaces.", false);
		return;
	}

	if (regoPw === "") {
		popup("Please enter a valid password.", false)
		return;
	}

    if (regoPw !== regoConfirmPw) {
		popup("Please ensure passwords match", false)
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
				popup('Registration successful', true);
				loadPage("login-screen");
            }
        });
});

//////////////////////////////
///// 2.1.3 Error Popup //////
//////////////////////////////

const errorPopup = document.getElementById('error-popup');
const successPopup = document.getElementById('success-popup');


// Get error popup elements
function popup(message, bool) {
	var popupText;
	var popupType;
	if (bool) {
		popupText = document.getElementById('success-text');
		popupType = successPopup;
	}
	else {
		popupText = document.getElementById('error-text');
		popupType = errorPopup;
	}
	popupType.style.display = 'block';
	popupText.innerHTML = message;
}

// Add event listener to close button
const closeError = document.getElementById('error-close');
closeError.addEventListener('click', function() {
	// Hide the popup
	errorPopup.style.display = 'none';
});

const closeSuccess = document.getElementById('success-close');
closeSuccess.addEventListener('click', function() {
	// Hide the popup
	successPopup.style.display = 'none';
});

//////////////////////////////
///// 2.2.1 Basic Feed ///////
////////////////////////////// MAKE SURE TO SHOW IN REVERSE CHRONOLOGICAL

// Main function to show feed.
function showFeed() {
	loadPage("main-page");
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

			Array.from(document.getElementsByClassName("job-post")).forEach((jobPost) => {
				jobPost.remove();
			});

			for (const jobPost of data) {
				console.log(jobPost);
				generatePost(jobPost);
			}

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
	creatorSpan.addEventListener("click", () => loadProfileScreen(jobPost.creatorId));
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

	const jobContent = createJobContent(jobPost, false);

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
	const likeIcon = document.createElement("i");
	if (isLiked) {
		likeIcon.setAttribute("class", "fa-solid fa-thumbs-up");
		likeBtn.setAttribute("liked", "");
	} else {
		likeIcon.setAttribute("class", "fa-regular fa-thumbs-up");
		likeBtn.removeAttribute("liked");
	}
	likeBtn.appendChild(likeIcon);

	likeBtn.setAttribute("id", `${authID}${jobPost.id}`)
	likeBtn.addEventListener("click", () => likePost(jobPost.id, `${authID}${jobPost.id}`, likeIcon));
	// Num Likes
	const numLikes = document.createElement("span");
	numLikes.innerText = `${jobPost.likes.length} likes`
	numLikes.setAttribute("class", "hover-underline");
	numLikes.addEventListener("click", () => displayLikes(jobPost.likes));
	// Num of Comments
	const numComments = document.createElement("span");
	numComments.setAttribute("class", "hover-underline");
	numComments.innerText = `${jobPost.comments.length} comments`;
	// numComments.addEventListener("click", () => showComments())

	likes.appendChild(likeBtn);
	likes.appendChild(numLikes);
	likeCommentBar.appendChild(likes);
	likeCommentBar.appendChild(numComments);
	jobContainer.appendChild(likeCommentBar);

	// Comments section (hide and unhide this in another function to show/unshow)
	const commentSection = document.createElement("div");
	commentSection.setAttribute("class", "comments");
	for (const commentInfo of jobPost.comments) {
		const comment = document.createElement("div");
		comment.setAttribute("class", "comment");
		const commentUser = document.createElement("span");
		commentUser.innerText = commentInfo.userName;
		commentUser.setAttribute("class", "hover-underline");
		commentUser.addEventListener("click", () => loadProfileScreen(commentInfo.userId));
		comment.appendChild(commentUser);
		const commentContent = document.createElement("span");
		commentContent.setAttribute("class", "comment-content");
		commentContent.innerText = `: ${commentInfo.comment}`
		comment.appendChild(commentContent);
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
				addComment.value = "";
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

// Function to generate job content
function createJobContent(jobPost, includeUpdateDelete) {
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
	descriptionTitle.innerText = `${jobPost.title}${jobPost.id}`;
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

	if (includeUpdateDelete) {
		const editJobButtons = document.createElement("div");
		editJobButtons.setAttribute("class", "edit-job-buttons");
		const jobUpdateBtn = document.createElement("button");
		jobUpdateBtn.setAttribute("class", `job-update`);
		jobUpdateBtn.innerText = "Update";
		// Add Event listener to update
		jobUpdateBtn.addEventListener("click", () => updateJob(jobPost));

		const jobDeleteBtn = document.createElement("button");
		jobDeleteBtn.setAttribute("class", `job-delete`);

		jobDeleteBtn.innerText = "Delete";
		// Add Event listener to delete job
		jobDeleteBtn.addEventListener("click", () => deleteJob(jobPost.id));
		
		editJobButtons.appendChild(jobUpdateBtn);
		editJobButtons.appendChild(jobDeleteBtn);
		jobContent.appendChild(editJobButtons);
	}

	return jobContent;
}

////////////////////////////////////////
///// 2.3.1 Show Likes on a job ////////
////////////////////////////////////////

const displayLikesClose = document.getElementById('display-likes-close');
displayLikesClose.addEventListener('click', () => {
	document.getElementById("display-likes-popup").style.display = "None";
});

function displayLikes(likeData) {
	// Popup likes
	document.getElementById("display-likes-popup").style.display = "block";
	// Clear current likes
	Array.from(document.getElementsByClassName("liked-user")).forEach((user) => {
		user.remove();
	});
	// Add likes
	for (const userInfo of likeData) {
		const user = document.createElement("span");
		user.setAttribute("class", "liked-user hover-underline");
		user.addEventListener("click", () => {
			loadProfileScreen(userInfo.userId);
			document.getElementById("display-likes-popup").style.display = "None";
		});
		user.innerText = `${userInfo.userName} (${userInfo.userEmail})`
		document.getElementById("display-likes-content").appendChild(user);
	}
}

////////////////////////////////////////
///// 2.3.2 Show comments on a job /////
////////////////////////////////////////

// in the above function - generatePost

////////////////////////////////////////
///// 2.3.3 Liking a job ///////////////
////////////////////////////////////////



// Function to like post
function likePost(postID, btnId, likeIcon) {
	// if (self.innerText === "notLiked") {}
	const btn = document.getElementById(btnId);
	const isLiked = btn.hasAttribute("liked");
	const requestBody = {
		"id": postID,
		"turnon": !isLiked,
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
			if (isLiked) {
				btn.removeAttribute("liked");
				likeIcon.setAttribute("class", "fa-regular fa-thumbs-up");
			}
			else {
				btn.setAttribute("liked", "");
				likeIcon.setAttribute("class", "fa-solid fa-thumbs-up");
			}
		}
	})
}


////////////////////////////////////////
///// 2.4.1 Viewing Other Profiles /////
////////////////////////////////////////

function loadProfileScreen(userId) {
	// Make a get request to get user info

	fetch(`http://localhost:${BACKEND_PORT}/user?userId=${userId}`, {
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
			console.log(data);
			console.log(userId);
			console.log(authID);
			if (parseInt(userId) === authID) {
				console.log("own");
				generateProfile(data, true);
			} else {
				console.log("not own");
				generateProfile(data, false);
			}
		}
	})
}

function generateProfile(userData, isOwnProfile) {
	// Function to show page
	// fdsjk dsajkds fkj hdsakf
	loadPage("profile-page");

	if (isOwnProfile) {
		document.getElementById("update-profile").style.display = "";
	} else {
		document.getElementById("update-profile").style.display = "none";
	}

	document.getElementById("profile-name").innerText = userData.name;
	document.getElementById("profile-email").innerText = userData.email;
	let profileImg = document.getElementById("profile-img");
	if (userData.image === undefined) {
		profileImg.src = "images/defaultProfile.png";
	} else {
		profileImg.src =  userData.image;
	}
	
	// Create num of watchees - do this so button doesn't stack up on multiple event listeners (remove curr first)
	let profileInfo = document.getElementById("profile-info");
	let numWatchers = document.getElementById("profile-num-watchers");
	let watchButton = document.getElementById("watch-button");
	profileInfo.removeChild(numWatchers);
	// console.log(profileInfo.childNodes);
	if (watchButton !== null) {
		profileInfo.removeChild(watchButton);
	}
	// Num watchers
	let newNumWatchers = document.createElement("span");
	newNumWatchers.setAttribute("class", "watchers hover-underline");
	newNumWatchers.setAttribute("id", "profile-num-watchers");
	newNumWatchers.innerText = `${userData.watcheeUserIds.length} watcher(s)`;
	newNumWatchers.addEventListener("click", () => displayWatchers(userData.watcheeUserIds));
	profileInfo.appendChild(newNumWatchers);

	// Add button to watch/unwatch
	if (!isOwnProfile) {
		let newWatchButton = document.createElement("watch-button");
		newWatchButton.setAttribute("id", "watch-button");
		newWatchButton.innerText = "watch button";
		// Check if user is currently watching

		newWatchButton.addEventListener("click", () => watchUser(userData.email, true));
		profileInfo.appendChild(newWatchButton);
	}

	// Create job
	if (isOwnProfile) {
		// function to hide and unhide
		console.log("own");
		document.getElementById("create-job-container").style.display = "block";
	} else {
		console.log("not own");
		document.getElementById("create-job-container").style.display = "None";
	}

	// Generate jobs
	// Delete job postings first
	Array.from(document.getElementsByClassName("job-content")).forEach((jobPost) => {
		jobPost.remove();
	});
	const profilePage = document.getElementById("profile-page");
	userData.jobs.forEach((jobPost) => {
		const jobContent = createJobContent(jobPost, isOwnProfile);
		profilePage.appendChild(jobContent);
	});
}

// Show watchers

const displayWatchersClose = document.getElementById('display-watchers-close');
displayWatchersClose.addEventListener('click', () => {
	document.getElementById("display-watchers-popup").style.display = "None";
});

function displayWatchers(watcheeIds) {
	// Popup likes
	document.getElementById("display-watchers-popup").style.display = "block";
	// Clear current likes
	Array.from(document.getElementsByClassName("watcher")).forEach((user) => {
		user.remove();
	});

	// Add likes
	for (const id of watcheeIds) {
		const user = document.createElement("span");
		user.setAttribute("class", "watcher hover-underline");
		user.addEventListener("click", () => {
			loadProfileScreen(id);
			document.getElementById("display-watchers-popup").style.display = "None";
		});
		fetch(`http://localhost:${BACKEND_PORT}/user?userId=${id}`, {
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
				user.innerText = data.name;
			}
		})
		document.getElementById("display-watchers-content").appendChild(user);
	}
}

////////////////////////////////////////
///// 2.4.3 Updating your profile  /////
////////////////////////////////////////

const editProfileBtn = document.getElementById("update-profile");
editProfileBtn.addEventListener("click", () => {
	// Popup screen here
	document.getElementById("update-profile-popup").style.display = "block";
	// Fill out the popup info
	fetch(`http://localhost:${BACKEND_PORT}/user?userId=${authID}`, {
		method: "GET",
		headers: {
			'Content-Type': 'application/json',
			'Authorization': token,
		}
	})
	.then(response => response.json())
	.then(data => {
		if (data.error){
			alert(data.error);
		} else {
			document.getElementById("profile-name-update").value = data.name;
			// might need to change this
			// document.getElementById("profile-picture-update").value = data.image;
			document.getElementById("email-update").value = data.email;
		}
	})


});

// Add event listener to close button
const profilePopupClose = document.getElementById('profile-popup-close');
profilePopupClose.addEventListener('click', () => {
	// Hide the popup
	document.getElementById("update-profile-popup").style.display = "None";
});

const updateProfileBtn = document.getElementById("update-profile-btn");
updateProfileBtn.addEventListener("click", () => {

	let name = document.getElementById("profile-name-update").value;
	let img = document.getElementById("profile-picture-update").value;
	let email = document.getElementById("email-update").value;
	let password = document.getElementById("password-update").value;
	let confirmPassword = document.getElementById("confirm-password-update").value;

	// Check name, email password is value
	if (!isValidEmailAndName(email, name)) {
		popup("Please enter valid email and name", false);
		return;
	}
	if (password === "") {
		popup("please enter valid password", false)
		return;
	}
	if (password !== confirmPassword) {
		popup("Passwords don't match", false);
		return;
	}

	const requestBody = {
		"email": email,
		"password": password,
		"name": name,
		"image": img,
	}
	fetch(`http://localhost:${BACKEND_PORT}/user`, {
		method: "PUT",
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
			popup("Not actually an error - Succesfully Updated Profile", true);
			// Close popup
			document.getElementById("update-profile-popup").style.display = "None";
		}
	})
})


////////////////////////////////////////
///// 2.4.4 Watching/Unwatching  ///////
////////////////////////////////////////

// Watch Button
function watchUser(email, setWatch) {
	const requestBody = {
		"email": email,
		"turnon": setWatch
	}
	fetch(`http://localhost:${BACKEND_PORT}/user/watch`, {
		method: "PUT",
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
			console.log("watched");
		}
	})
}

////////////////////////////////////////
///// 2.5.1 Adding a job  //////////////
////////////////////////////////////////

const createJobBtn = document.getElementById("create-job");
createJobBtn.addEventListener("click", () => {
	document.getElementById("create-job-popup").style.display = "block";
});

// Add event listener to close button
const createJobClose = document.getElementById('create-job-close');
createJobClose.addEventListener('click', () => {
	// Hide the popup
	document.getElementById("create-job-popup").style.display = "None";
});


const submitJobBtn = document.getElementById("create-job-btn");
submitJobBtn.addEventListener("click", () => {

	let title = document.getElementById("job-name-input").value;
	let img = document.getElementById("job-img-input").value;
	let startDate= document.getElementById("start-date-input").value;
	let description= document.getElementById("job-description-input").value;

	// Check everything is non-empty
	if (title === "" || description === "" || startDate === "") {
		popup("Name, image and description can't be empty", false);
		return;
	}

	console.log(title, img, startDate, description);

	const requestBody = {
		"title": title,
		"image": img,
		"start": startDate,
		"description": description
	}

	fetch(`http://localhost:${BACKEND_PORT}/job`, {
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
			popup("Not actually an error - Succesfully made job", true);
			// Close popup
			document.getElementById("create-job-popup").style.display = "None";
		}
	})
})

///////////////////////////////////////////
///// 2.5.1 Updating and deleting a job ///
///////////////////////////////////////////

// Add event listener to close button
const udpateJobClose = document.getElementById('update-job-close');
udpateJobClose.addEventListener('click', () => {
	document.getElementById("update-job-popup").style.display = "None";
});

function updateJob(jobData) {
	document.getElementById("update-job-popup").style.display = "block";
	
	document.getElementById("update-job-name-input").value = jobData.title;
	document.getElementById("update-job-img-input").value = jobData.image;
	document.getElementById("update-start-date-input").value = jobData.start;
	document.getElementById("update-job-description-input").value = jobData.description;

	document.getElementById("update-job-btn").remove();
	const updateButton = document.createElement("button");
	updateButton.setAttribute("id", "update-job-btn");
	updateButton.innerText = "Update";
	document.getElementById("update-job-content").appendChild(updateButton);

	document.getElementById("update-job-btn").addEventListener("click", () => postJobUpdate(jobData.id));
}

function postJobUpdate(jobId) {
	const requestBody = {
		"id": jobId,
		"title": document.getElementById("update-job-name-input").value,
		"image": document.getElementById("update-job-img-input").value,
		"start": document.getElementById("update-start-date-input").value,
		"description": document.getElementById("update-job-description-input").value
	}
	fetch(`http://localhost:${BACKEND_PORT}/job`, {
		method: "PUT",
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
			popup("Not actually an error - Succesfully updated job", true);
			document.getElementById("update-job-popup").style.display = "None";
			console.log(requestBody);
		}
	})
}

// document.getElementById("update-job-btn").addEventListener

function deleteJob(jobId) {
	const requestBody = {
		"id": jobId
	}
	fetch(`http://localhost:${BACKEND_PORT}/job`, {
		method: "DELETE",
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
			popup("Not actually an error - Succesfully deleted job", true);
		}
	})
}