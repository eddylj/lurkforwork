import { BACKEND_PORT } from './config.js';
// A helper you may want to use when uploading new images to the server.
import { fileToDataUrl } from './helpers.js';

// Global Variables
let token = null;
let authID = null;

// Opens the page in login screen
loadPage("login-screen");

// Input the page id from html and hide all other pages
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

function initPost(requestBody) {
	return {
		method: "POST",
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(requestBody),
	}
}


////////////////////////
///// 2.1.1 Login //////
////////////////////////

const loginForm = document.forms.login_form;

document.getElementById("nav-login").addEventListener("click", () => {
	loadPage("login-screen");
});

document.getElementById("btn-join").addEventListener("click", (event) => {
	event.preventDefault();
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

	fetch(`http://localhost:${BACKEND_PORT}/auth/login`, initPost(requestBody))
		.then(response => response.json())
		.then(data => {
			if (data.error) {
				popup("Please enter a valid email or password.", false);
			}
			else {
				token = data.token;
				authID = data.userId;
				// Load main page after login
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
document.getElementById("nav-register").addEventListener("click", () => {
	loadPage("rego-screen");
});
// Back to login
document.getElementById("btn-signin").addEventListener("click", (event) => {
	event.preventDefault();
	loadPage("login-screen");
});

function isValidEmailAndName(email, name) {
	// Check if email is valid (standard email regex)
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
		popup("Please enter a valid email and name. Names must contain only letters and spaces.", false);
		return;
	}
	if (regoPw === "") {
		popup("Please enter a password.", false)
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


	fetch(`http://localhost:${BACKEND_PORT}/auth/register`, initPost(requestBody))
		.then(response => response.json())
		.then(data => {
			if (data.error) {
				alert(data.error);
			} else {
				popup('Registration successful', true);
				// Load login after successful registration
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
function popup(message, success) {
	let popupText;
	let popupType;
	if (success) {
		popupText = document.getElementById('success-text');
		popupType = successPopup;
	}
	else {
		popupText = document.getElementById('error-text');
		popupType = errorPopup;
	}
	popupType.style.display = 'block';
	popupText.innerText = message;
}

// Add event listener to close button
const closeError = document.getElementById('error-close');
closeError.addEventListener('click', () => {
	// Hide the popup
	errorPopup.style.display = 'none';
});

const closeSuccess = document.getElementById('success-close');
closeSuccess.addEventListener('click', () => {
	// Hide the popup
	successPopup.style.display = 'none';
});

//////////////////////////////
///// 2.2.1 Basic Feed ///////
////////////////////////////// TODO: MAKE SURE TO SHOW IN REVERSE CHRONOLOGICAL

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
			if (data.error) {
				alert(data.error);
			} else {
				Array.from(document.getElementsByClassName("job-post")).forEach((jobPost) => {
					jobPost.remove();
				});
				for (const jobPost of data) {
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
	jobDate.innerText = `Posted: ${jobPost.createdAt}`;

	jobContainer.appendChild(creatorSpan);
	jobContainer.appendChild(jobDate);

	const jobContent = createJobContent(jobPost);
	jobContainer.appendChild(jobContent);

	// Likes and comments bar
	const likeCommentBar = document.createElement("div");
	likeCommentBar.setAttribute("class", "likes-comments-bar");

	const likesDiv = document.createElement("div");
	likesDiv.setAttribute("class", "likes");

	const likeSpan = document.createElement("span");
	// Check if post has been liked by current user
	const isLiked = jobPost.likes.some((user) => user.userId === authID);
	const likeIcon = document.createElement("i");
	if (isLiked) {
		likeIcon.setAttribute("class", "fa-solid fa-thumbs-up");
		likeSpan.setAttribute("liked", "");
	}
	else {
		likeIcon.setAttribute("class", "fa-regular fa-thumbs-up");
		likeSpan.removeAttribute("liked");
	}
	likeSpan.appendChild(likeIcon);

	likeSpan.setAttribute("id", `${authID}${jobPost.id}`);
	likeSpan.addEventListener("click", () => likePost(jobPost.id, `${authID}${jobPost.id}`, likeIcon));

	const numLikes = document.createElement("p");
	numLikes.innerText = `  ${jobPost.likes.length} likes`
	numLikes.setAttribute("class", "hover-underline");
	numLikes.addEventListener("click", () => displayLikes(jobPost.likes));

	likesDiv.appendChild(likeSpan);
	likesDiv.appendChild(numLikes);

	const numComments = document.createElement("p");
	numComments.innerText = `${jobPost.comments.length} comments`;

	likeCommentBar.appendChild(likesDiv);
	likeCommentBar.appendChild(numComments);
	jobContainer.appendChild(likeCommentBar);

	// Comments section (TODO: hide and unhide this in another function to show/unshow)
	const commentSection = document.createElement("div");
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
	const postCommentDiv = document.createElement("div");
	postCommentDiv.setAttribute("class", "post-comment-div");

	const addComment = document.createElement("input");
	addComment.setAttribute("placeholder", "Add a comment");
	addComment.setAttribute("class", "comment-input");

	const postCommentBtn = document.createElement("button");
	postCommentBtn.setAttribute("class", "post-comment-button");
	postCommentBtn.innerText = "Post";
	postCommentBtn.addEventListener("click", () => {
		// Cannot post empty comment
		if (!addComment.value) {
			return;
		}

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
				}
			});
	});

	postCommentDiv.appendChild(addComment);
	postCommentDiv.appendChild(postCommentBtn);
	jobContainer.appendChild(postCommentDiv);

	// Append to main page
	document.getElementById("main-page").appendChild(jobContainer);
}

function createJobContent(jobPost) {
	const jobContent = document.createElement("div");
	jobContent.setAttribute("class", "job-content");

	const jobImg = document.createElement("img");
	jobImg.setAttribute("class", "job-img");
	jobImg.src = jobPost.image;
	jobContent.appendChild(jobImg);

	const jobDescription = document.createElement("div");
	jobDescription.setAttribute("class", "job-description");
	const descriptionTitle = document.createElement("h5");
	descriptionTitle.innerText = `${jobPost.title}${jobPost.id}`;
	jobDescription.appendChild(descriptionTitle);

	const brNode = document.createElement("br");
	jobDescription.appendChild(brNode);

	const jobStartDate = document.createElement("div");
	jobStartDate.innerText = jobPost.start; // TODO: WIll need to change this for date function
	jobDescription.appendChild(jobStartDate);

	const brNode2 = document.createElement("br");
	jobDescription.appendChild(brNode2);

	const jobInfo = document.createElement("p");
	jobInfo.innerText = jobPost.description;
	jobDescription.appendChild(jobInfo);
	jobContent.appendChild(jobDescription);

	return jobContent;
}

////////////////////////////////////////
///// 2.3.1 Show Likes on a job ////////
////////////////////////////////////////

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

const displayLikesClose = document.getElementById('display-likes-close');
displayLikesClose.addEventListener('click', () => {
	document.getElementById("display-likes-popup").style.display = "none";
});

////////////////////////////////////////
///// 2.3.2 Show comments on a job /////
////////////////////////////////////////

// in the above function - generatePost

////////////////////////////////////////
///// 2.3.3 Liking a job ///////////////
////////////////////////////////////////

// Function to like post
function likePost(postID, spanId, likeIcon) {
	const likeSpan = document.getElementById(spanId);
	const isLiked = likeSpan.hasAttribute("liked");

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
					likeSpan.removeAttribute("liked");
					likeIcon.setAttribute("class", "fa-regular fa-thumbs-up");
				}
				else {
					likeSpan.setAttribute("liked", "");
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
	loadPage("profile-page");

	if (isOwnProfile) document.getElementById("update-profile").style.display = "";
	else document.getElementById("update-profile").style.display = "none";

	document.getElementById("profile-name").innerText = userData.name;
	document.getElementById("profile-email").innerText = userData.email;

	let profileImg = document.getElementById("profile-img");
	// TODO: Bonus default image
	if (userData.image === undefined) {
		profileImg.src = "images/defaultProfile.png";
	}
	else {
		profileImg.src = userData.image;
	}

	// Create num of watchees - do this so button doesn't stack up on multiple event listeners (remove curr first)
	let profileInfo = document.getElementById("profile-info");
	let numWatchers = document.getElementById("profile-num-watchers");
	profileInfo.removeChild(numWatchers);

	// Removes watch button from own profile
	let watchButton = document.getElementById("watch-button");
	if (watchButton !== null) {
		profileInfo.removeChild(watchButton);
	}

	// Num watchers
	let newNumWatchers = document.createElement("span");
	newNumWatchers.setAttribute("class", "watchers-span hover-underline");
	newNumWatchers.setAttribute("id", "profile-num-watchers");
	newNumWatchers.innerText = `${userData.watcheeUserIds.length} watcher(s)`;
	newNumWatchers.addEventListener("click", () => displayWatchers(userData.watcheeUserIds));
	profileInfo.appendChild(newNumWatchers);

	// Add button to watch/unwatch
	let newWatchButton = document.createElement("button");
	newWatchButton.setAttribute("id", "watch-button");
	// Check if user is currently watching
	const isWatched = userData.watcheeUserIds.some((watcher) => watcher === authID);
	if (isWatched) {
		newWatchButton.innerText = "✔️ Watching";
		newWatchButton.setAttribute("watching", "")
	}
	else {
		newWatchButton.innerText = "➕ Watch";
		newWatchButton.removeAttribute("watching")
	}
	profileInfo.appendChild(newWatchButton);

	// newWatchButton.setAttribute("id", `${authID}${userData.id}`);
	newWatchButton.addEventListener("click", () => watchUser(userData.email, "watch-button"));

	// Create job
	if (isOwnProfile) {
		// function to hide and unhide
		document.getElementById("create-job-container").style.display = "block";
	} else {
		document.getElementById("create-job-container").style.display = "None";
	}

	// Generate jobs
	// Delete job postings first
	Array.from(document.getElementsByClassName("job-post")).forEach((jobPost) => {
		jobPost.remove();
	});
	const profilePage = document.getElementById("profile-page");
	userData.jobs.forEach((jobPost) => {
		const jobContainer = document.createElement("div");
		jobContainer.setAttribute("class", "job-post");

		// Create update and delete job buttons
		if (isOwnProfile) {
			const editJobButtonsFather = document.createElement("div");
			editJobButtonsFather.setAttribute("class", "edit-job-buttons-father");
			const editJobButtons = document.createElement("div");
			editJobButtons.setAttribute("class", "edit-job-buttons");

			const jobUpdateBtn = document.createElement("button");
			jobUpdateBtn.setAttribute("class", "job-update");
			jobUpdateBtn.innerText = "Update";
			// Add Event listener to update
			jobUpdateBtn.addEventListener("click", () => updateJob(jobPost));

			const jobDeleteBtn = document.createElement("button");
			jobDeleteBtn.setAttribute("class", "job-delete");
			jobDeleteBtn.innerText = "Delete";
			// Add Event listener to delete job
			jobDeleteBtn.addEventListener("click", () => deleteJob(jobPost.id));

			editJobButtons.appendChild(jobUpdateBtn);
			editJobButtons.appendChild(jobDeleteBtn);
			editJobButtonsFather.appendChild(editJobButtons);
			jobContainer.appendChild(editJobButtonsFather);
		}
		const jobContent = createJobContent(jobPost);
		jobContainer.appendChild(jobContent);


		profilePage.appendChild(jobContainer);
	});
}

// Show watchers

const displayWatchersClose = document.getElementById('display-watchers-close');
displayWatchersClose.addEventListener('click', () => {
	document.getElementById("display-watchers-popup").style.display = "None";
});

function displayWatchers(watcheeIds) {
	document.getElementById("display-watchers-popup").style.display = "block";
	Array.from(document.getElementsByClassName("watcher")).forEach((user) => {
		user.remove();
	});

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
			if (data.error) {
				alert(data.error);
			} else {
				document.getElementById("profile-name-update").value = data.name;
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
	let imgFile = document.querySelector('#profile-picture-update').files[0];
	let email = document.getElementById("email-update").value;
	let password = document.getElementById("password-update").value;
	let confirmPassword = document.getElementById("confirm-password-update").value;

	// Check name, email password is value
	if (!isValidEmailAndName(email, name)) {
		popup("Please enter valid email and name", false);
		return;
	}
	if (password !== confirmPassword) {
		popup("Passwords don't match", false);
		return;
	}
	if (imgFile) {
		fileToDataUrl(imgFile).then((img) => {
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
		});
	}
});


////////////////////////////////////////
///// 2.4.4 Watching/Unwatching  ///////
////////////////////////////////////////

// Watch Button
function watchUser(email, buttonId) {
	const watchButton = document.getElementById(buttonId);
	const isWatched = watchButton.hasAttribute("watching");
	const requestBody = {
		"email": email,
		"turnon": !isWatched
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
				if (isWatched) {
					watchButton.removeAttribute("watching");
					watchButton.innerText = "➕ Watch";
				}
				else {
					watchButton.setAttribute("watching", "");
					watchButton.innerText = "✔️ Watching";
				}
			}
		})
}

////////////////////////////////////////
///// 2.5.1 Adding a job  //////////////
////////////////////////////////////////

const createJobBtn = document.getElementById("create-job-btn");
createJobBtn.addEventListener("click", () => {
	document.getElementById("create-job-popup").style.display = "block";
});

// Add event listener to close button
const createJobClose = document.getElementById('create-job-close');
createJobClose.addEventListener('click', () => {
	// Hide the popup
	document.getElementById("create-job-popup").style.display = "None";
});


const submitJobBtn = document.getElementById("create-job-submit");
submitJobBtn.addEventListener("click", () => {

	let title = document.getElementById("job-name-input").value;
	let imgFile = document.querySelector('#job-img-input').files[0];
	let startDate = document.getElementById("start-date-input").value;
	let description = document.getElementById("job-description-input").value;

	// Check everything is non-empty
	if (title === "" || description === "" || startDate === "") {
		popup("Name and description must not be empty", false);
		return;
	}

	if (imgFile) {
		fileToDataUrl(imgFile).then((img) => {
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
		});
	}
	else popup("Image must not be empty", false);
});

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