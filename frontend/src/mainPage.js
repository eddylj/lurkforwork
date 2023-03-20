import { BACKEND_PORT } from './config.js';
// A helper you may want to use when uploading new images to the server.
import { fileToDataUrl } from './helpers.js';

// Global Variables
let token = null;
let authID = null;
let startIndex = 0;
let loading = false;

window.addEventListener("scroll", () => {
	// const mainPage = document.getElementById("main-page")
	// mainPage.getBoundingClientRect
	const mainPage = document.getElementById("main-page");
	if (mainPage.style.display === "") {
		const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
		console.log(startIndex);

		if (scrollTop + clientHeight >= scrollHeight && !loading) {
			loading = true;
			startIndex += 5;
			showFeed(startIndex);
			console.log(startIndex);
			// loadMoreContent();
			// console.log("meowmeow");
			loading = false;
		}
	}
});

setInterval(liveUpdate, 1000);

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
	showFeedStart(0);
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

function fetchGetUserData(user) {
	return fetch(`http://localhost:${BACKEND_PORT}/user?userId=${user}`, {
		method: "GET",
		headers: {
			'Content-Type': 'application/json',
			'Authorization': token,
		}
	})
		.then(response => response.json())
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
		errorOrSuccessPopup("Please enter a valid email or password.", false)
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
				errorOrSuccessPopup("Please enter a valid email or password.", false);
			}
			else {
				token = data.token;
				authID = data.userId;
				// Load main page after login
				showFeed(0);
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

// Create a generic popup
// Returns the popup content for appending children
function showPopup() {
	const popup = document.getElementById("generic-popup");
	const popupContent = document.getElementById("generic-popup-content");
	const closePopupSpan = document.getElementById("generic-close-span");
	closePopupSpan.addEventListener('click', () => {
		// Hide the popup
		popup.style.display = "None";
	});
	while (popupContent.childNodes.length > 2) {
		popupContent.removeChild(popupContent.lastChild);
	}

	popup.style.display = "block";
	return popupContent;
}

// Creates an h3 with an icon
function makePopupHeader(headerText, headerIconClass) {
	const popupHeader = document.createElement("h3");
	popupHeader.innerText = headerText;
	if (headerIconClass) {
		const popupHeaderIcon = document.createElement("i");
		popupHeaderIcon.setAttribute("class", headerIconClass);
		popupHeader.appendChild(popupHeaderIcon);
	}
	return popupHeader;
}

function errorOrSuccessPopup(message, success) {
	const popupContent = showPopup();
	let headerText = "";
	let headerIconClass = "";

	const popupHeader = document.createElement("h3");

	if (success) {
		headerText = "SUCCESS!";
		headerIconClass = "fa-solid fa-check";
		popupHeader.style.color = "green";

	}
	else {
		headerText = "ERROR!";
		headerIconClass = "fa-solid fa-triangle-exclamation";
		popupHeader.style.color = "rgb(155, 10, 10)";
	}
	popupHeader.innerText = headerText;
	const popupHeaderIcon = document.createElement("i");
	popupHeaderIcon.setAttribute("class", headerIconClass);

	popupContent.appendChild(popupHeader);
	popupContent.appendChild(popupHeaderIcon);
	const popupMessage = document.createElement("span");
	popupMessage.innerText = ` ${message}`;

	popupContent.appendChild(popupMessage);
}

//////////////////////////////
///// 2.2.1 Basic Feed ///////
////////////////////////////// TODO: MAKE SURE TO SHOW IN REVERSE CHRONOLOGICAL

function showFeedStart() {
	startIndex = 0;
	Array.from(document.getElementsByClassName("job-post")).forEach((jobPost) => {
		jobPost.remove();
	});
	showFeed(startIndex)
}


// Main function to show feed.
function showFeed(startIndexNum) {
	loadPage("main-page");
	// Get the job feed
	let init = {
		method: "GET",
		headers: {
			'Content-Type': 'application/json',
			'Authorization': token
		}
	}
	fetch(`http://localhost:${BACKEND_PORT}/job/feed?start=${startIndexNum}`, init)
		.then(response => response.json())
		.then(data => {
			if (data.error) {
				alert(data.error);
			} else {
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

	fetchGetUserData(jobPost.creatorId).then(data => {
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
	commentSection.setAttribute("class", `commment${jobPost.id}`);

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
	const popupContent = showPopup();
	popupContent.appendChild(makePopupHeader("Likes ", "fa-solid fa-thumbs-up"));

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
			document.getElementById("generic-popup").style.display = "None";
		});
		user.innerText = `${userInfo.userName} (${userInfo.userEmail})`
		popupContent.appendChild(user);
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
	fetchGetUserData(userId).then(data => {
		if (data.error) {
			alert(data.error);
		} else {
			if (parseInt(userId) === authID) {
				generateProfile(data, true);
			} else {
				generateProfile(data, false);
			}
		}
	})
}

function generateProfile(userData, isOwnProfile) {
	loadPage("profile-page");

	if (isOwnProfile) document.getElementById("update-profile-div").style.display = "";
	else document.getElementById("update-profile-div").style.display = "none";

	document.getElementById("profile-name").innerText = userData.name;
	document.getElementById("profile-email").innerText = userData.email;

	let profileImg = document.getElementById("profile-img");
	// TODO: Bonus default image
	if (userData.image === undefined) {
		profileImg.src = "images/defaultprofile.jpg";
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

function displayWatchers(watcheeIds) {
	const popupContent = showPopup();

	popupContent.appendChild(makePopupHeader("Watchers ", "fa-solid fa-eye"));

	Array.from(document.getElementsByClassName("watcher")).forEach((user) => {
		user.remove();
	});

	for (const id of watcheeIds) {
		const user = document.createElement("span");
		user.setAttribute("class", "watcher hover-underline");
		user.addEventListener("click", () => {
			loadProfileScreen(id);
			document.getElementById("generic-popup").style.display = "None";
		});
		fetchGetUserData(id).then(data => {
			if (data.error) {
				alert(data.error);
			} else {
				user.innerText = data.name;
			}
		})
		popupContent.appendChild(user);
	}
}

////////////////////////////////////////
///// 2.4.3 Updating your profile  /////
////////////////////////////////////////

function createInputDom(inputId, inputPlaceholder, inputType, inputAccept) {
	const newInput = document.createElement("input");
	newInput.setAttribute("id", inputId);
	newInput.setAttribute("placeholder", inputPlaceholder);
	newInput.setAttribute("type", inputType);
	newInput.setAttribute("accept", inputAccept);
	return newInput;
}

const updateProfileBtn = document.getElementById("update-profile-btn");
updateProfileBtn.addEventListener("click", () => {
	// Popup screen here
	const popupContent = showPopup();
	popupContent.appendChild(makePopupHeader("Update Profile ", "fa-solid fa-user"));

	const inputDiv = document.createElement("div");
	inputDiv.setAttribute("class", "popup-input-content");

	inputDiv.appendChild(createInputDom("update-profile-name", "Name"));
	inputDiv.appendChild(createInputDom("update-profile-picture", undefined, "file", "image/*"));
	inputDiv.appendChild(createInputDom("update-profile-email", "Email"));
	inputDiv.appendChild(createInputDom("update-profile-password", "Password", "password"));
	inputDiv.appendChild(createInputDom("update-profile-confirm-password", "Confirm password", "password"));
	popupContent.appendChild(inputDiv);

	let updateProfileSubmitButton = document.createElement("button");
	updateProfileSubmitButton.innerText = "Submit";
	updateProfileSubmitButton.setAttribute("class", "btn-submit");
	popupContent.appendChild(updateProfileSubmitButton);
	updateProfileSubmitButton.addEventListener("click", setUpdateProfileSubmitButton);

	// Fill out the popup info
	fetchGetUserData(authID).then(data => {
		if (data.error) {
			alert(data.error);
		} else {
			document.getElementById("update-profile-name").value = data.name;
			document.getElementById("update-profile-email").value = data.email;
		}
	})
});

function fetchPutUserData(requestBody) {
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
				// Close popup
				document.getElementById("generic-popup").style.display = "None";
				const popupContent = showPopup();
				let popupHeader = makePopupHeader("Profile update successful ", "fa-solid fa-check");
				popupHeader.style.color = "green";
				popupContent.appendChild(popupHeader);

			}
		})
}

// Add event listener to close button
function setUpdateProfileSubmitButton() {
	const name = document.getElementById("update-profile-name").value;
	const imgFile = document.querySelector("#update-profile-picture").files[0];
	const email = document.getElementById("update-profile-email").value;
	const password = document.getElementById("update-profile-password").value;
	const confirmPassword = document.getElementById("update-profile-confirm-password").value;

	// Check passwords are the same
	if (password !== confirmPassword) {
		errorOrSuccessPopup("Passwords don't match", false);
		return;
	}

	let requestBody = {
		"name": name,
		"password": password
	};

	// TODO: Make email global variable so don't need to put twice
	fetchGetUserData(authID).then(data => {
		if (data.error) {
			alert(data.error);
		} else {
			if (email !== data.email) {
				fetchPutUserData({ "email": email });
			}
		}
	});

	if (imgFile) {
		fileToDataUrl(imgFile).then((img) => {
			Object.assign(requestBody, { "image": img });
			fetchPutUserData(requestBody);
		});
	}
	else {
		fetchPutUserData(requestBody);
	}
}

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
	const popupContent = showPopup();
	popupContent.appendChild(makePopupHeader("Create Job ", "fa-solid fa-briefcase"));

	const inputDiv = document.createElement("div");
	inputDiv.setAttribute("class", "popup-input-content");

	inputDiv.appendChild(createInputDom("create-job-title-input", "Job title"));
	inputDiv.appendChild(createInputDom("create-job-img-input", undefined, "file", "image/*"));
	inputDiv.appendChild(createInputDom("create-job-date-input", "Start date"));
	inputDiv.appendChild(createInputDom("create-job-description-input", "Job description"));
	popupContent.appendChild(inputDiv);

	let createJobSubmitButton = document.createElement("button");
	createJobSubmitButton.innerText = "Submit";
	createJobSubmitButton.setAttribute("class", "btn-submit");
	popupContent.appendChild(createJobSubmitButton);
	const errorSpan = document.createElement("span");
	errorSpan.setAttribute("id", "create-job-error");
	popupContent.appendChild(errorSpan);

	createJobSubmitButton.addEventListener("click", () => {
		const jobTitle = document.getElementById("create-job-title-input").value;
		const jobImgFile = document.querySelector('#create-job-img-input').files[0];
		const jobDate = document.getElementById("create-job-date-input").value;
		const jobDescription = document.getElementById("create-job-description-input").value;


		// Check everything is non-empty
		if (!jobTitle || !jobDate || !jobImgFile) {
			let errorText = "";
			if (!jobTitle) errorText = "Please enter a job title";
			else if (!jobDate) errorText = "Please enter a start date";
			else errorText = "Please upload an image";
			errorSpan.innerText = errorText;
			return;
		}
		fileToDataUrl(jobImgFile).then((img) => {
			const requestBody = {
				"title": jobTitle,
				"image": img,
				"start": jobDate,
				"description": jobDescription
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
						document.getElementById("generic-popup").style.display = "None";
						const popupContent = showPopup();
						let popupHeader = makePopupHeader("Job creation successful ", "fa-solid fa-check");
						popupHeader.style.color = "green";
						popupContent.appendChild(popupHeader);
					}
				})
		});
	});
});


///////////////////////////////////////////
///// 2.5.1 Updating and deleting a job ///
///////////////////////////////////////////

// Add event listener to close button
function updateJob(jobData) {
	const popupContent = showPopup();
	popupContent.appendChild(makePopupHeader("Update Job ", "fa-solid fa-briefcase"));

	const inputDiv = document.createElement("div");
	inputDiv.setAttribute("class", "popup-input-content");

	inputDiv.appendChild(createInputDom("update-job-title-input", "Job title"));
	inputDiv.appendChild(createInputDom("update-job-img-input", undefined, "file", "image/*"));
	inputDiv.appendChild(createInputDom("update-job-date-input", "Start date"));
	inputDiv.appendChild(createInputDom("update-job-description-input", "Job description"));
	popupContent.appendChild(inputDiv);

	document.getElementById("update-job-title-input").value = jobData.title;
	document.getElementById("update-job-date-input").value = jobData.start;
	document.getElementById("update-job-description-input").value = jobData.description;

	let updateJobSubmitButton = document.createElement("button");
	updateJobSubmitButton.innerText = "Submit";
	updateJobSubmitButton.setAttribute("class", "btn-submit");
	popupContent.appendChild(updateJobSubmitButton);
	updateJobSubmitButton.addEventListener("click", () => {
		const jobTitle = document.getElementById("update-job-title-input").value;
		const jobImgFile = document.querySelector("#update-job-img-input").files[0];
		const jobDate = document.getElementById("update-job-date-input").value;
		const jobDescription = document.getElementById("update-job-description-input").value;

		let requestBody = {
			"id": jobData.id,
			"title": jobTitle,
			"start": jobDate,
			"description": jobDescription
		};

		if (jobImgFile) {
			fileToDataUrl(jobImgFile).then((img) => {
				Object.assign(requestBody, { "image": img });
				fetchPutJobData(requestBody);
			});
		}
		else {
			fetchPutJobData(requestBody);
		}
	});
}

function fetchPutJobData(requestBody) {
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
				document.getElementById("generic-popup").style.display = "None";
				const popupContent = showPopup();
				let popupHeader = makePopupHeader("Job update successful ", "fa-solid fa-check");
				popupHeader.style.color = "green";
				popupContent.appendChild(popupHeader);
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
			}
		})
}