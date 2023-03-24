import { BACKEND_PORT } from './config.js';
// A helper you may want to use when uploading new images to the server.
import { fileToDataUrl } from './helpers.js';

// Global Variables
let token = null;
let authID = null;
let startIndex = 0;
let loading = false;
let allowNotifs = false;
let currPostIds = [];

window.addEventListener("scroll", () => {
	// const navBar = document.getElementById(nav);
	// if (window.pageYOffset)
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

// Opens initial page in login screen
loadPage("login-screen");

// Input the page id from html and hide all other pages
function loadPage(pageId) {
	Array.from(document.getElementsByClassName("page")).forEach(page => {
		page.style.display = "none";
	});

	if (pageId === "main-page") {
		document.getElementById("nav-home-button").style.color = "rgb(102, 52, 127)";
	}
	else {
		document.getElementById("nav-home-button").style.color = "black";
	}
	if (pageId === "profile-page") {
		document.getElementById("nav-profile-button").style.color = "rgb(102, 52, 127)";
	}
	else {
		document.getElementById("nav-profile-button").style.color = "black";
	}

	const navBar = document.getElementById("nav");
	const logoSpan = document.getElementById("login-logo-span");
	if (pageId === "login-screen" || pageId === "rego-screen") {
		navBar.style.display = "none";
		logoSpan.style.display = "block";
	}
	else {
		navBar.style.display = "";
		logoSpan.style.display = "none";
	}
	document.getElementById(pageId).style.display = "";
}

document.getElementById("nav-logo-span").addEventListener("click", () => {
	showFeedStart();
});

document.getElementById("nav-home-button").addEventListener("click", () => {
	showFeedStart();
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
				showFeedStart();
			}
		});
});

//////////////////////////////
///// 2.1.2 Registration /////
//////////////////////////////

// Variables
const regoForm = document.forms.rego_form;

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
		errorOrSuccessPopup("Please enter a valid email and name. Names must contain only letters and spaces.", false);
		return;
	}
	if (regoPw === "") {
		errorOrSuccessPopup("Please enter a password", false)
		return;
	}
	if (regoPw !== regoConfirmPw) {
		errorOrSuccessPopup("Please ensure passwords match", false)
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
				errorOrSuccessPopup("Email address already taken", false);
			} else {
				errorOrSuccessPopup('Registration successful', true);
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
	const popupHeader = document.createElement("h3");
	const popupHeaderIcon = document.createElement("i");

	if (success) {
		popupHeader.innerText = "SUCCESS!";
		popupHeaderIcon.setAttribute("class", "fa-solid fa-check");
		popupHeader.style.color = "green";
	}
	else {
		popupHeader.innerText = "ERROR!";
		popupHeaderIcon.setAttribute("class", "fa-solid fa-triangle-exclamation");
		popupHeader.style.color = "rgb(155, 10, 10)";
	}
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
	// Whenever feed is accessed, reset watchEmail input
	watchEmailInput.style.display = "none";
	watchEmailInput.value = "";

	startIndex = 0;
	Array.from(document.getElementsByClassName("job-post")).forEach((jobPost) => {
		jobPost.remove();
	});

	showFeed(startIndex);

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
					if (!currPostIds.includes(jobPost.id)) currPostIds.push(jobPost.id);
					console.log(currPostIds);
					generatePost(jobPost);
				}
			}
		})
}


function isoToNormalDate(date) {
	return `${date.substring(8, 10)}/${date.substring(5, 7)}/${date.substring(0, 4)}`;
}
//  DD/MM/YYYY
// how many hours and minutes ago
function jobPostCreateDate(date) {
	const isoDate = new Date(date);
	const nowDate = new Date();
	const timeSince = nowDate.getTime() - isoDate.getTime();
	const hoursSince = Math.floor(timeSince / (1000 * 60 * 60));


	if (hoursSince < 24) {
		const minutesSince = Math.floor(timeSince / (1000 * 60) % 60);
		return hoursSince === 0 ? `${minutesSince} min ago` : `${hoursSince} hrs ${minutesSince} min ago`;
	}
	else {
		return isoToNormalDate(date);
	}

}

function generatePost(jobPost) {
	// Create Container for job post
	const jobContainer = document.createElement("div");
	jobContainer.setAttribute("class", "job-post");
	jobContainer.setAttribute("id", `jobPost${jobPost.id}`);
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
	const jobDateDiv = document.createElement("div");
	const jobDate = document.createElement("p");

	jobDate.innerText = jobPostCreateDate(jobPost.createdAt);
	jobDate.style.color = "grey";

	jobDateDiv.appendChild(jobDate);

	jobContainer.appendChild(creatorSpan);
	jobContainer.appendChild(jobDateDiv);

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

	// Number of likes
	const numLikes = document.createElement("p");
	numLikes.setAttribute("id", `numLikes${jobPost.id}`)
	numLikes.innerText = `  ${jobPost.likes.length} likes`
	numLikes.setAttribute("class", "hover-underline");

	// Like section
	const likeSection = document.createElement("div");
	likeSection.setAttribute("id", `likes${jobPost.id}`);
	generateLikes(likeSection, jobPost.likes);

	numLikes.addEventListener("click", () => displayLikes(likeSection));

	likesDiv.appendChild(likeSpan);
	likesDiv.appendChild(numLikes);
	likesDiv.style.marginTop = "8px";

	const numComments = document.createElement("p");
	numComments.setAttribute("id", `numComments${jobPost.id}`);
	numComments.innerText = `${jobPost.comments.length} comments`;

	likeCommentBar.appendChild(likesDiv);
	likeCommentBar.appendChild(numComments);
	jobContainer.appendChild(likeCommentBar);

	const commentSection = document.createElement("div");
	commentSection.setAttribute("id", `comments${jobPost.id}`);

	generateComments(commentSection, jobPost.comments);
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
	descriptionTitle.innerText = `${jobPost.title}`;
	jobDescription.appendChild(descriptionTitle);

	const brNode = document.createElement("br");
	jobDescription.appendChild(brNode);

	const jobStartDate = document.createElement("div");
	jobStartDate.innerText = `Starting ${isoToNormalDate(jobPost.start)}`;;
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

function generateLikes(likeSection, likeData) {
	for (const userInfo of likeData) {
		const user = document.createElement("span");
		user.setAttribute("class", "liked-user hover-underline");
		user.addEventListener("click", () => {
			loadProfileScreen(userInfo.userId);
			document.getElementById("generic-popup").style.display = "None";
		});
		user.innerText = `${userInfo.userName} (${userInfo.userEmail})`
		likeSection.appendChild(user);
	}
}

function displayLikes(likeSection) {
	// Popup likes
	const popupContent = showPopup();
	popupContent.appendChild(makePopupHeader("Likes ", "fa-solid fa-thumbs-up"));
	popupContent.appendChild(likeSection);
}

////////////////////////////////////////
///// 2.3.2 Show comments on a job /////
////////////////////////////////////////

function generateComments(commentSection, comments) {
	for (const commentInfo of comments) {
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
}

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
			jobUpdateBtn.setAttribute("class", "small-media-button");
			jobUpdateBtn.innerText = "Update";
			// Add Event listener to update
			jobUpdateBtn.addEventListener("click", () => updateJob(jobPost));

			const jobDeleteBtn = document.createElement("button");
			jobDeleteBtn.setAttribute("class", "small-media-button");
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

	let updateProfileSubmitButton = document.createElement("button");
	updateProfileSubmitButton.innerText = "Submit";
	updateProfileSubmitButton.setAttribute("class", "btn-submit");
	inputDiv.appendChild(updateProfileSubmitButton);
	updateProfileSubmitButton.addEventListener("click", setUpdateProfileSubmitButton);

	popupContent.appendChild(inputDiv);

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
function watchUserFetchPut(requestBody) {
	return fetch(`http://localhost:${BACKEND_PORT}/user/watch`, {
		method: "PUT",
		headers: {
			'Content-Type': 'application/json',
			'Authorization': token,
		},
		body: JSON.stringify(requestBody)
	})
		.then(response => response.json());
}


function watchUser(email, buttonId) {
	const watchButton = document.getElementById(buttonId);
	const isWatched = watchButton.hasAttribute("watching");
	const requestBody = {
		"email": email,
		"turnon": !isWatched
	}

	watchUserFetchPut(requestBody).then(data => {
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

const watchEmailButton = document.getElementById("watch-email-button");
const watchEmailInput = document.getElementById("watch-email-input");

watchEmailButton.addEventListener("click", () => {
	watchEmailInput.style.display === "inline" ? watchEmailInput.style.display = "none" :
		watchEmailInput.style.display = "inline";
});

watchEmailInput.addEventListener("keydown", (e) => {
	if (e.key === "Enter") {
		const requestBody = {
			"email": watchEmailInput.value,
			"turnon": true
		}
		watchUserFetchPut(requestBody).then(data => {
			if (data.error) {
				errorOrSuccessPopup("That email does not belong to an account", false);
			}
			else {
				errorOrSuccessPopup(`Now watching ${watchEmailInput.value}`, true);
				watchEmailInput.value = "";
			}
		});
	}
});

////////////////////////////////////////
///// 2.5.1 Adding a job  //////////////
////////////////////////////////////////

const createJobBtn = document.getElementById("create-job-btn");
createJobBtn.addEventListener("click", () => {
	const popupContent = showPopup();
	popupContent.appendChild(makePopupHeader("Create Job ", "fa-solid fa-briefcase"));

	const inputDiv = document.createElement("div");
	inputDiv.setAttribute("class", "popup-input-content");

	const startDateInput = createInputDom("create-job-date-input", "Start date");
	startDateInput.addEventListener("focus", () => {
		startDateInput.type = "date";
	});
	inputDiv.appendChild(createInputDom("create-job-title-input", "Job title"));
	inputDiv.appendChild(createInputDom("create-job-img-input", undefined, "file", "image/*"));
	inputDiv.appendChild(startDateInput);
	inputDiv.appendChild(createInputDom("create-job-description-input", "Job description"));


	let createJobSubmitButton = document.createElement("button");
	createJobSubmitButton.innerText = "Submit";
	createJobSubmitButton.setAttribute("class", "btn-submit");
	inputDiv.appendChild(createJobSubmitButton);
	const errorSpan = document.createElement("span");
	errorSpan.setAttribute("id", "create-job-error");
	inputDiv.appendChild(errorSpan);
	popupContent.appendChild(inputDiv);

	createJobSubmitButton.addEventListener("click", () => {
		const jobTitle = document.getElementById("create-job-title-input").value;
		const jobImgFile = document.querySelector('#create-job-img-input').files[0];
		const jobDescription = document.getElementById("create-job-description-input").value;


		// Check everything is non-empty
		if (!jobTitle || !startDateInput.value || !jobImgFile) {
			let errorText = "";
			if (!jobTitle) errorText = "Please enter a job title";
			else if (!startDateInput.value) errorText = "Please enter a start date";
			else errorText = "Please upload an image";
			errorSpan.innerText = errorText;
			return;
		}
		fileToDataUrl(jobImgFile).then((img) => {
			const requestBody = {
				"title": jobTitle,
				"image": img,
				"start": new Date(startDateInput.value).toISOString().substring(0, 10),
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

	const titleInput = createInputDom("update-job-title-input", "Job title");
	const imgInput = createInputDom("update-job-img-input", undefined, "file", "image/*");
	const startDateInput = createInputDom("update-job-date-input", "", "date");
	const descriptInput = createInputDom("update-job-description-input", "Job description");
	titleInput.value = jobData.title;
	// const prevDateValue = ;
	startDateInput.value = new Date(jobData.start).toISOString().substring(0, 10);
	descriptInput.value = jobData.description;

	inputDiv.appendChild(titleInput);
	inputDiv.appendChild(imgInput);
	inputDiv.appendChild(startDateInput);
	inputDiv.appendChild(descriptInput);

	let updateJobSubmitButton = document.createElement("button");
	updateJobSubmitButton.innerText = "Submit";
	updateJobSubmitButton.setAttribute("class", "btn-submit");
	inputDiv.appendChild(updateJobSubmitButton);

	popupContent.appendChild(inputDiv);

	updateJobSubmitButton.addEventListener("click", () => {
		let requestBody = {
			"id": jobData.id,
			"title": titleInput.value,
			"start": startDateInput.value,
			"description": descriptInput.value
		};

		if (imgInput.files[0]) {
			fileToDataUrl(imgInput.files[0]).then((img) => {
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
				// document.getElementById("generic-popup").style.display = "None";
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
				errorOrSuccessPopup("Job already deleted", false);
				alert(data.error);
			}
			else {
				errorOrSuccessPopup("Successfully deleted job", true);
			}
		})
}

///////////////////////////////////////////
///// 2.6.2 Live Update ///////////////////
///////////////////////////////////////////

setInterval(liveUpdate, 500);

function liveUpdate() {
	// Check the user is logged in
	if (authID === null) {
		return;
	}

	fetch(`http://localhost:${BACKEND_PORT}/job/feed?start=0`, {
		method: "GET",
		headers: {
			'Content-Type': 'application/json',
			'Authorization': token
		}
	})
		.then(response => response.json())
		.then(data => {
			if (data.error) {
				alert(data.error);
			} else {
				for (const jobPost of data) {
					liveUpdateJobPost(jobPost);
				}
			}
		})
}

function liveUpdateJobPost(jobPostData) {
	// Check job Post exsits - if doesn't - send push notif
	if (document.getElementById(`jobPost${jobPostData.id}`) === null) {
		pushNotifs();
		return;
	}

	// Update number of likes
	let numLikes = document.getElementById(`numLikes${jobPostData.id}`);
	numLikes.innerText = ` ${jobPostData.likes.length} likes`;

	// Update number of comments
	let numComments = document.getElementById(`numComments${jobPostData.id}`);
	numComments.innerText = `${jobPostData.comments.length} comments`;

	// Update comments
	const commentSection = document.getElementById(`comments${jobPostData.id}`);
	commentSection.textContent = "";
	generateComments(commentSection, jobPostData.comments);

	// Update Likes
	const likeSection = document.getElementById(`likes${jobPostData.id}`);
	if (likeSection === null) return;
	console.log(likeSection);
	likeSection.textContent = "";
	generateLikes(likeSection, jobPostData.likes);
}

///////////////////////////////////////////
///// 2.6.3 Push Notifs ///////////////////
///////////////////////////////////////////

// Function to toggle notifs
document.getElementById("nav-toggle-notifs").addEventListener("click", () => {
	if (allowNotifs) {
		allowNotifs = false;
		document.getElementById("bell-icon").setAttribute("class", "fa-regular fa-bell-slash");
	} else {
		allowNotifs = true;
		document.getElementById("bell-icon").setAttribute("class", "fa-solid fa-bell");
	}
})

function pushNotifs() {
	// Maybe check if user has turned on notifs
	if (!allowNotifs) return;

	// Fetch last 5 job posts
	fetch(`http://localhost:${BACKEND_PORT}/job/feed?start=0`, {
		method: "GET",
		headers: {
			'Content-Type': 'application/json',
			'Authorization': token
		}
	})
		.then(response => response.json())
		.then(data => {
			if (data.error) {
				alert(data.error);
			} else {
				for (const jobPost of data) {
					if (!currPostIds.includes(jobPost.id)) {
						currPostIds.push(jobPost.id);
						// If you want to customise, chuck in data as argument

						newNotifPopup(jobPost);
					}
				}
			}
		})
}

document.getElementById("notif-close-span").addEventListener("click", () => {
	document.getElementById("notif-popup").style.display = "none";
});

document.getElementById("refresh-main-page").addEventListener("click", () => {
	document.getElementById("notif-popup").style.display = "none";
	showFeedStart();
});


function newNotifPopup(jobPost) {
	const notifPopup = document.getElementById("notif-popup");
	notifPopup.style.display = "block";
	const notifPopupContent = document.getElementById("notif-popup-content");
	let notifTextDiv = document.createElement("div");
	notifTextDiv.setAttribute("class", "notif-text-div")

	fetchGetUserData(jobPost.creatorId).then(data => {
		if (data.error) {
			alert(data.error);
		} else {
			notifTextDiv.innerText = `${data.name} has posted a job: ${jobPost.title} starting ${isoToNormalDate(jobPost.start)}`;
			notifPopupContent.appendChild(notifTextDiv);
		}
	});
}

///////////////////////////////////////////
///// Bonus ///////////////////
///////////////////////////////////////////

const logoutButton = document.getElementById("nav-logout");
logoutButton.addEventListener("click", () => {
	window.location.reload();
	token = null;
	authID = null;
});